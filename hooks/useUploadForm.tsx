import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Kit {
    id: string;
    name: string;
    description: string | null;
    price: number;
    includes_frame: boolean;
    includes_presentation_box: boolean;
    includes_affirmation_card: boolean;
    max_revision_count: number;
}

export interface WebsiteOrder {
    id: string;
    website_order_number: string;
    kit_id: string;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    is_claimed: boolean;
    kits: Kit;
}

export interface FrameColour {
    id: string;
    name: string;
    hex_colour?: string;
}

export interface FoilColour {
    id: string;
    name: string;
    hex_colour?: string;
}

export interface CardColour {
    id: string;
    name: string;
    hex_colour?: string;
}

export interface PickedImage {
    uri: string;
    fileName: string;
    mimeType: string; // e.g. "image/jpeg"
}

export type PrintType = "hand" | "foot" | "both";

export interface UploadFormData {
    babyName: string;
    dateOfBirth: Date | null;
    printType: PrintType | null;
    frameColourId: string | null;
    foilColourId: string | null;
    cardColourId: string | null;
    specialInstructions: string;
    images: PickedImage[];
}

export type FormErrors = Partial<Record<keyof Omit<UploadFormData, "images"> | "images", string>>;

type Step = "lookup" | "form" | "submitting" | "success";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Convert a local file URI to an ArrayBuffer for Supabase Storage upload.
// fetch().blob() is broken for file:// URIs in React Native — use arrayBuffer() instead.
async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
    const response = await fetch(uri);
    return response.arrayBuffer();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUploadForm() {
    const { user } = useAuth();

    const [step, setStep] = useState<Step>("lookup");

    // ── Lookup state ──────────────────────────────────────────────────────────
    const [orderNumber, setOrderNumber] = useState("");
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [isLooking, setIsLooking] = useState(false);
    const [websiteOrder, setWebsiteOrder] = useState<WebsiteOrder | null>(null);

    // ── Colour options ────────────────────────────────────────────────────────
    const [frameColours, setFrameColours] = useState<FrameColour[]>([]);
    const [foilColours, setFoilColours] = useState<FoilColour[]>([]);
    const [cardColours, setCardColours] = useState<CardColour[]>([]);

    // ── Form state ────────────────────────────────────────────────────────────
    const [form, setForm] = useState<UploadFormData>({
        babyName: "",
        dateOfBirth: null,
        printType: null,
        frameColourId: null,
        foilColourId: null,
        cardColourId: null,
        specialInstructions: "",
        images: [],
    });

    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

    // ── Lookup ────────────────────────────────────────────────────────────────

    async function lookupOrder() {
        const {
            data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) {
            setSubmitError("Please sign in again.");
            setStep("form");
            return;
        }

        const trimmed = orderNumber.trim().toUpperCase();
        if (!trimmed) {
            setLookupError("Please enter your order number.");
            return;
        }

        setIsLooking(true);
        setLookupError(null);

        const { data, error } = await supabase
            .from("website_orders")
            .select(
                `
                id,
                website_order_number,
                kit_id,
                customer_name,
                customer_email,
                customer_phone,
                is_claimed,
                kits (
                    id,
                    name,
                    description,
                    price,
                    includes_frame,
                    includes_presentation_box,
                    includes_affirmation_card,
                    max_revision_count
                )
            `
            )
            .eq("website_order_number", trimmed)
            .single();

        setIsLooking(false);

        if (error || !data) {
            setLookupError("We couldn't find that order number. Please check and try again.");
            return;
        }

        if (data.is_claimed) {
            setLookupError("This order has already been submitted. Contact us if you think this is a mistake.");
            return;
        }

        // ── Ownership check ───────────────────────────────────────────────────
        if (data.customer_email && data.customer_email.toLowerCase() !== authUser?.email?.toLowerCase()) {
            setLookupError("This order number doesn't match your account. Please check your confirmation email.");
            return;
        }

        const order = data as unknown as WebsiteOrder;
        setWebsiteOrder(order);
        await fetchColourOptions(order.kits);
        setStep("form");
    }

    async function fetchColourOptions(kit: Kit) {
        const fetches: Promise<void>[] = [];

        if (kit.includes_frame) {
            fetches.push(
                (async () => {
                    console.log("Fetching frame colours...");
                    const { data, error } = await supabase
                        .from("frame_colours")
                        .select("id, name, hex_colour")
                        .eq("active", true);

                    console.log("Frame colours:", data);

                    if (data) {
                        setFrameColours(data as FrameColour[]);
                    }
                })()
            );
        }

        fetches.push(
            (async () => {
                console.log("Fetching foil colours...");
                const { data, error } = await supabase
                    .from("foil_colours")
                    .select("id, name, hex_colour")
                    .eq("active", true);

                console.log("Foil colours:", data);

                if (data) {
                    setFoilColours(data as FoilColour[]);
                }
            })()
        );

        if (kit.includes_affirmation_card) {
            fetches.push(
                (async () => {
                    console.log("Fetching card colours...");
                    const { data, error } = await supabase
                        .from("card_colours")
                        .select("id, name, hex_colour")
                        .eq("active", true);

                    console.log("Card colours:", data);

                    if (data) {
                        setCardColours(data as CardColour[]);
                    }
                })()
            );
        }

        await Promise.all(fetches);
    }

    // ── Form helpers ──────────────────────────────────────────────────────────

    function setField<K extends keyof UploadFormData>(key: K, value: UploadFormData[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setFormErrors((prev) => ({ ...prev, [key]: undefined }));
    }

    // ── Image picker ──────────────────────────────────────────────────────────

    async function pickImages() {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            setFormErrors((prev) => ({
                ...prev,
                images: "Photo library access is required to upload images.",
            }));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            quality: 0.85,
            orderedSelection: true,
            exif: false,
        });

        if (result.canceled) return;

        const picked: PickedImage[] = result.assets.map((asset, i) => ({
            uri: asset.uri,
            fileName: asset.fileName ?? `print_${Date.now()}_${i}.jpg`,
            mimeType: asset.mimeType ?? "image/jpeg",
        }));

        setForm((prev) => ({
            ...prev,
            images: [...prev.images, ...picked],
        }));
        setFormErrors((prev) => ({ ...prev, images: undefined }));
    }

    async function pickFromCamera() {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            setFormErrors((prev) => ({
                ...prev,
                images: "Camera access is required. Please enable it in Settings.",
            }));
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.85,
            exif: false,
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        setForm((prev) => ({
            ...prev,
            images: [
                ...prev.images,
                {
                    uri: asset.uri,
                    fileName: asset.fileName ?? `print_${Date.now()}.jpg`,
                    mimeType: asset.mimeType ?? "image/jpeg",
                },
            ],
        }));
        setFormErrors((prev) => ({ ...prev, images: undefined }));
    }

    function removeImage(index: number) {
        setForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    }

    // ── Validation ────────────────────────────────────────────────────────────

    function validate(): boolean {
        const errors: FormErrors = {};
        const kit = websiteOrder?.kits;

        if (!form.babyName.trim()) errors.babyName = "Baby's name is required.";
        if (!form.dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
        if (!form.printType) errors.printType = "Please select a print type.";
        if (form.images.length === 0) errors.images = "Please add at least one photo of your prints.";

        if (kit?.includes_frame && !form.frameColourId) {
            errors.frameColourId = "Please choose a frame colour.";
        }
        if (foilColours.length > 0 && !form.foilColourId) {
            errors.foilColourId = "Please choose a foil colour.";
        }
        if (kit?.includes_affirmation_card && cardColours.length > 0 && !form.cardColourId) {
            errors.cardColourId = "Please choose a card colour.";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    async function submitOrder() {
        if (!validate() || !websiteOrder || !user) return;

        setStep("submitting");
        setSubmitError(null);

        // 1. Insert the order row
        setUploadProgress("Creating your order…");
        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert({
                user_id: user.id,
                website_order_id: websiteOrder.id,
                kit_id: websiteOrder.kit_id,
                customer_name: websiteOrder.customer_name ?? form.babyName,
                customer_email: websiteOrder.customer_email,
                customer_phone: websiteOrder.customer_phone,
                baby_name: form.babyName.trim(),
                date_of_birth: form.dateOfBirth ? form.dateOfBirth.toISOString().split("T")[0] : null,
                print_type: form.printType,
                frame_colour_id: form.frameColourId,
                foil_colour_id: form.foilColourId,
                card_colour_id: form.cardColourId,
                special_instructions: form.specialInstructions.trim() || null,
            })
            .select("id")
            .single();

        if (orderError || !orderData) {
            setSubmitError("Something went wrong creating your order. Please try again.");
            setStep("form");
            return;
        }

        const orderId = orderData.id;

        // 2. Upload images to Supabase Storage + insert order_images rows
        const uploadedPaths: string[] = [];
        try {
            for (let i = 0; i < form.images.length; i++) {
                const img = form.images[i];
                setUploadProgress(`Uploading photo ${i + 1} of ${form.images.length}…`);

                const ext = img.mimeType === "image/png" ? "png" : "jpg";
                const storagePath = `orders/${orderId}/${Date.now()}_${i}.${ext}`;

                const arrayBuffer = await uriToArrayBuffer(img.uri);

                const { error: storageError } = await supabase.storage
                    .from("order-images")
                    .upload(storagePath, arrayBuffer, {
                        contentType: img.mimeType,
                        upsert: false,
                    });

                console.log("error: ", storageError);

                if (storageError) throw storageError;

                uploadedPaths.push(storagePath);

                const {
                    data: { publicUrl },
                } = supabase.storage.from("order-images").getPublicUrl(storagePath);

                await supabase.from("order_images").insert({
                    order_id: orderId,
                    image_url: publicUrl,
                    image_type: img.mimeType,
                    sort_order: i,
                });
            }
        } catch (err) {
            // Remove uploaded files
            if (uploadedPaths.length) {
                await supabase.storage.from("order-images").remove(uploadedPaths);
            }
            // Order was created but images failed — don't mark as claimed,
            // let staff know via submit error so user can retry
            // setSubmitError("Your order was saved but some photos failed to upload. Please try again.");

            // Delete order_images (if any were inserted)
            await supabase.from("order_images").delete().eq("order_id", orderId);

            // Delete the order itself
            await supabase.from("orders").delete().eq("id", orderId);

            setSubmitError("Failed to upload your photos. Please try again.");
            setStep("form");
            return;
        }

        // 2.1 Create conversation
        try {
            const { data: conversation, error: conversationError } = await supabase
                .from("conversations")
                .insert({
                    order_id: orderId,
                })
                .select()
                .single();

            if (!conversation || conversationError) {
                throw new Error(`Failed to create conversation ${conversationError}`);
            }

            // 2.2 Welcome message
            const { data: message, error: messageError } = await supabase
                .from("messages")
                .insert({
                    conversation_id: conversation.id,
                    sender_type: "bot",
                    message_type: "system",
                    text: "Thanks for submitting your prints! We've received them safely and our team is getting to work on your proof. Whilst you're waiting, feel free to browse our exclusive add-ons.",
                    metadata: {
                        action: "browse_addons",
                    },
                })
                .select()
                .single();

            if (messageError) {
                throw new Error(`Failed to create message: ${JSON.stringify(messageError)}`);
            }
        } catch (error) {
            console.log("Failed to create conversation and message:", JSON.stringify(error, null, 2));
            // Remove uploaded files
            if (uploadedPaths.length) {
                await supabase.storage.from("order-images").remove(uploadedPaths);
            }
            await supabase.from("order_images").delete().eq("order_id", orderId);

            await supabase.from("orders").delete().eq("id", orderId);
            setSubmitError("Failed to create conversation and message. Please try again.");
            setStep("form");
            return;
        }

        // 3. Mark website order as claimed
        await supabase.from("website_orders").update({ is_claimed: true }).eq("id", websiteOrder.id);

        setUploadProgress(null);
        setCreatedOrderId(orderId);
        setStep("success");
    }

    return {
        step,
        // Lookup
        orderNumber,
        setOrderNumber,
        lookupError,
        isLooking,
        lookupOrder,
        websiteOrder,
        // Colour options
        frameColours,
        foilColours,
        cardColours,
        // Form
        form,
        setField,
        formErrors,
        submitError,
        uploadProgress,
        submitOrder,
        // Images
        pickImages,
        pickFromCamera,
        removeImage,
        // Success
        createdOrderId,
    };
}
