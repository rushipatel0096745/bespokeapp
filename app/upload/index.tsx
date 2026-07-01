import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Platform } from "react-native";
import DateTimePicker, { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import { router } from "expo-router";

import { colors, typography, spacing, radii } from "../../theme/theme";
import ScreenWrapper from "../../components/layout/ScreenWrapper";
import NavBar from "../../components/layout/NavBar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useUploadForm, PrintType, FrameColour, FoilColour, CardColour } from "../../hooks/useUploadForm";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRINT_TYPES: { value: PrintType; label: string }[] = [
    { value: "hand", label: "Hand" },
    { value: "foot", label: "Foot" },
    { value: "both", label: "Both" },
];

const IMAGE_THUMB = 88;

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <Text style={shared.label}>{children}</Text>;
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <Text style={shared.error}>{message}</Text>;
}

const shared = StyleSheet.create({
    label: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        fontWeight: "600",
        color: colors.charcoalLight,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: spacing.xs,
    },
    error: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.error ?? "#C0392B",
        marginTop: 2,
    },
});

// ─── Pill selector ────────────────────────────────────────────────────────────

function PillSelector<T extends string>({
    options,
    selected,
    onSelect,
    error,
}: {
    options: { value: T; label: string }[];
    selected: T | null;
    onSelect: (v: T) => void;
    error?: string;
}) {
    return (
        <View>
            <View style={pillStyles.row}>
                {options.map((opt) => {
                    const active = selected === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[pillStyles.pill, active && pillStyles.active]}
                            onPress={() => onSelect(opt.value)}
                            activeOpacity={0.7}>
                            <Text style={[pillStyles.text, active && pillStyles.textActive]}>{opt.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <FieldError message={error} />
        </View>
    );
}

const pillStyles = StyleSheet.create({
    row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    pill: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: radii.full,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surface ?? colors.white,
    },
    active: {
        borderColor: colors.gold,
        backgroundColor: colors.gold + "18",
    },
    text: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
    },
    textActive: {
        color: colors.charcoal,
        fontWeight: "600",
    },
});

// ─── Colour swatch selector ───────────────────────────────────────────────────

function ColourSelector({
    label,
    colours,
    selected,
    onSelect,
    error,
}: {
    label: string;
    colours: (FrameColour | FoilColour | CardColour)[];
    selected: string | null;
    onSelect: (id: string) => void;
    error?: string;
}) {
    if (colours.length === 0) return null;
    return (
        <View style={swatchStyles.container}>
            <SectionLabel>{label}</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={swatchStyles.row}>
                {colours.map((c) => {
                    const active = selected === c.id;
                    return (
                        <TouchableOpacity
                            key={c.id}
                            style={swatchStyles.item}
                            onPress={() => onSelect(c.id)}
                            activeOpacity={0.75}>
                            <View
                                style={[
                                    swatchStyles.swatch,
                                    c.hex_colour ? { backgroundColor: c.hex_colour } : swatchStyles.fallback,
                                    active && swatchStyles.swatchActive,
                                ]}
                            />
                            <Text style={[swatchStyles.name, active && swatchStyles.nameActive]} numberOfLines={1}>
                                {c.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
            <FieldError message={error} />
        </View>
    );
}

const swatchStyles = StyleSheet.create({
    container: { gap: 4 },
    row: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs },
    item: { alignItems: "center", gap: 4, width: 56 },
    swatch: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "transparent",
    },
    fallback: { backgroundColor: colors.border },
    swatchActive: { borderColor: colors.gold },
    name: {
        fontFamily: typography.fonts.sans,
        fontSize: 10,
        color: colors.charcoalLight,
        textAlign: "center",
    },
    nameActive: { color: colors.charcoal, fontWeight: "600" },
});

// ─── DOB picker ───────────────────────────────────────────────────────────────

// function DOBPicker({
//     value,
//     onChange,
//     error,
// }: {
//     value: Date | null;
//     onChange: (date: Date | null) => void;
//     error?: string;
// }) {
//     const [expanded, setExpanded] = useState(false);

//     const display = value
//         ? value.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
//         : null;

//     function handleChange(_: DateTimePickerEvent, selected?: Date) {
//         if (Platform.OS === "android") {
//             setExpanded(false); // modal closes itself
//         }
//         if (selected) onChange(selected);
//     }

//     return (
//         <View style={dobStyles.container}>
//             <SectionLabel>Date of birth</SectionLabel>

//             {/* Tappable trigger row */}
//             <TouchableOpacity
//                 style={[dobStyles.trigger, error ? dobStyles.triggerError : undefined]}
//                 onPress={() => setExpanded((v) => !v)}
//                 activeOpacity={0.7}>
//                 <Text style={[dobStyles.triggerText, !display && dobStyles.placeholder]}>
//                     {display ?? "Select date"}
//                 </Text>
//                 <Text style={[dobStyles.chevron, expanded && dobStyles.chevronOpen]}>›</Text>
//             </TouchableOpacity>

//             <FieldError message={error} />

//             {/* iOS inline spinner — always mounted when expanded so it doesn't flicker */}
//             {Platform.OS === "ios" && expanded && (
//                 <View style={dobStyles.iosPickerWrapper}>
//                     <DateTimePicker
//                         value={value ?? new Date(2024, 0, 1)}
//                         mode='date'
//                         display='spinner'
//                         maximumDate={new Date()}
//                         onChange={handleChange}
//                         style={dobStyles.iosPicker}
//                         textColor={colors.charcoal}
//                         locale='en-GB'
//                     />
//                     <TouchableOpacity style={dobStyles.doneBtn} onPress={() => setExpanded(false)}>
//                         <Text style={dobStyles.doneBtnText}>Done</Text>
//                     </TouchableOpacity>
//                 </View>
//             )}

//             {/* Android — modal picker, only render when expanded */}
//             {Platform.OS === "android" && expanded && (
//                 <DateTimePicker
//                     value={value ?? new Date(2024, 0, 1)}
//                     mode='date'
//                     display='default'
//                     maximumDate={new Date()}
//                     onChange={handleChange}
//                 />
//             )}
//         </View>
//     );
// }

function DOBPicker({
    value,
    onChange,
    error,
}: {
    value: Date | null;
    onChange: (date: Date | null) => void;
    error?: string;
}) {
    const [expanded, setExpanded] = useState(false);

    const displayLabel = value
        ? value.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
        : null;

    function handleValueChange(event: DateTimePickerChangeEvent, date: Date) {
        if (Platform.OS === "android") setExpanded(false);
        if (date) onChange(date);
    }

    function handleDismiss() {
        setExpanded(false);
    }

    return (
        <View style={dobStyles.container}>
            <SectionLabel>Date of birth</SectionLabel>

            <TouchableOpacity
                style={[dobStyles.trigger, error ? dobStyles.triggerError : undefined]}
                onPress={() => setExpanded((v) => !v)}
                activeOpacity={0.7}>
                <Text style={[dobStyles.triggerText, !displayLabel && dobStyles.placeholder]}>
                    {displayLabel ?? "Select date"}
                </Text>
                <Text style={[dobStyles.chevron, expanded && dobStyles.chevronOpen]}>›</Text>
            </TouchableOpacity>

            <FieldError message={error} />

            {/* ── iOS: inline spinner with Done button ── */}
            {expanded && Platform.OS === "ios" && (
                <View style={dobStyles.iosPickerWrapper}>
                    <DateTimePicker
                        value={value ?? new Date(2010, 0, 1)}
                        mode='date'
                        display='spinner'
                        maximumDate={new Date()}
                        onValueChange={handleValueChange}
                        // onDismiss={handleDismiss}
                        style={dobStyles.iosPicker}
                    />
                    <TouchableOpacity style={dobStyles.doneBtn} onPress={() => setExpanded(false)}>
                        <Text style={dobStyles.doneBtnText}>Done</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Android: native modal dialog, auto-closes on pick or dismiss ── */}
            {expanded && Platform.OS === "android" && (
                <DateTimePicker
                    value={value ?? new Date(2010, 0, 1)}
                    mode='date'
                    display='default'
                    maximumDate={new Date()}
                    onValueChange={handleValueChange}
                    onDismiss={handleDismiss}
                />
            )}
        </View>
    );
}
const dobStyles = StyleSheet.create({
    container: { gap: 4 },
    trigger: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        backgroundColor: colors.surface ?? colors.white,
    },
    triggerError: { borderColor: colors.error ?? "#C0392B" },
    triggerText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
    },
    placeholder: { color: colors.charcoalLight },
    chevron: {
        fontSize: 20,
        color: colors.charcoalLight,
        lineHeight: 22,
        transform: [{ rotate: "0deg" }],
    },
    chevronOpen: {
        transform: [{ rotate: "90deg" }],
    },
    iosPickerWrapper: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        overflow: "hidden",
        backgroundColor: colors.surface ?? colors.white,
    },
    iosPicker: {
        height: 180,
    },
    doneBtn: {
        alignSelf: "flex-end",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    doneBtnText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        fontWeight: "600",
        color: colors.gold,
    },
});

// ─── Image picker section ─────────────────────────────────────────────────────

function ImagePickerSection({
    images,
    onPickLibrary,
    onPickCamera,
    onRemove,
    error,
}: {
    images: { uri: string }[];
    onPickLibrary: () => void;
    onPickCamera: () => void;
    onRemove: (i: number) => void;
    error?: string;
}) {
    return (
        <View style={imgStyles.container}>
            <SectionLabel>Photos of your prints</SectionLabel>
            <Text style={imgStyles.hint}>Clear, well-lit photos give us the best result. You can add multiple.</Text>

            {/* Source buttons */}
            <View style={imgStyles.sourceRow}>
                <TouchableOpacity style={imgStyles.sourceBtn} onPress={onPickCamera} activeOpacity={0.7}>
                    <Text style={imgStyles.sourceBtnIcon}>📷</Text>
                    <Text style={imgStyles.sourceBtnLabel}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={imgStyles.sourceBtn} onPress={onPickLibrary} activeOpacity={0.7}>
                    <Text style={imgStyles.sourceBtnIcon}>🖼️</Text>
                    <Text style={imgStyles.sourceBtnLabel}>Library</Text>
                </TouchableOpacity>
            </View>

            {/* Thumbnails */}
            {images.length > 0 && (
                <View style={imgStyles.grid}>
                    {images.map((img, i) => (
                        <View key={`${img.uri}-${i}`} style={imgStyles.thumb}>
                            <Image source={{ uri: img.uri }} style={imgStyles.thumbImg} />
                            <TouchableOpacity
                                style={imgStyles.removeBtn}
                                onPress={() => onRemove(i)}
                                hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}>
                                <Text style={imgStyles.removeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            <FieldError message={error} />
        </View>
    );
}

const imgStyles = StyleSheet.create({
    container: { gap: 6 },
    hint: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        lineHeight: typography.sizes.xs * 1.6,
        marginBottom: 2,
    },
    sourceRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    sourceBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.sm + 2,
        borderRadius: radii.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surface ?? colors.white,
    },
    sourceBtnIcon: { fontSize: 16 },
    sourceBtnLabel: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
        fontWeight: "500",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    thumb: {
        width: IMAGE_THUMB,
        height: IMAGE_THUMB,
        borderRadius: radii.md,
        overflow: "hidden",
    },
    thumbImg: {
        width: IMAGE_THUMB,
        height: IMAGE_THUMB,
    },
    removeBtn: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "rgba(0,0,0,0.55)",
        alignItems: "center",
        justifyContent: "center",
    },
    removeIcon: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "700",
        lineHeight: 12,
    },
});

// ─── Step 1: Lookup ───────────────────────────────────────────────────────────

function LookupStep({
    orderNumber,
    setOrderNumber,
    onSubmit,
    isLooking,
    error,
}: {
    orderNumber: string;
    setOrderNumber: (v: string) => void;
    onSubmit: () => void;
    isLooking: boolean;
    error: string | null;
}) {
    return (
        <View style={styles.body}>
            <View style={styles.headingBlock}>
                <Text style={styles.heading}>Find your order</Text>
                <Text style={styles.subheading}>
                    Enter the order number from your confirmation email to get started.
                </Text>
            </View>

            <View style={styles.fieldGroup}>
                <Input
                    label='Order number'
                    placeholder='e.g. MMC-1234'
                    value={orderNumber}
                    onChangeText={(t) => setOrderNumber(t.toUpperCase())}
                    autoCapitalize='characters'
                    returnKeyType='done'
                    onSubmitEditing={onSubmit}
                    editable={!isLooking}
                />
                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <Button
                label={isLooking ? "Checking…" : "Continue"}
                variant='gold'
                fullWidth
                onPress={onSubmit}
                disabled={isLooking}
                style={styles.submitBtn}
            />
        </View>
    );
}

// ─── Step 2: Upload form ──────────────────────────────────────────────────────

function UploadForm({ hook }: { hook: ReturnType<typeof useUploadForm> }) {
    const {
        websiteOrder,
        form,
        setField,
        formErrors,
        submitError,
        submitOrder,
        frameColours,
        foilColours,
        cardColours,
        pickImages,
        pickFromCamera,
        removeImage,
    } = hook;

    const kit = websiteOrder?.kits;

    return (
        <View style={styles.body}>
            {/* Kit badge */}
            {kit && (
                <View style={styles.kitBadge}>
                    <Text style={styles.kitBadgeText}>{kit.name}</Text>
                    {kit.includes_frame && <Text style={styles.kitInclude}>· Frame included</Text>}
                    {kit.includes_presentation_box && <Text style={styles.kitInclude}>· Presentation box</Text>}
                    {kit.includes_affirmation_card && <Text style={styles.kitInclude}>· Affirmation card</Text>}
                </View>
            )}

            <View style={styles.headingBlock}>
                <Text style={styles.heading}>Tell us about your prints</Text>
                <Text style={styles.subheading}>
                    We'll create your proof in 1–2 working days and send it to you for review.
                </Text>
            </View>

            {/* Baby's name */}
            <View style={styles.fieldGroup}>
                <Input
                    label="Baby's name"
                    placeholder='e.g. Ava'
                    value={form.babyName}
                    onChangeText={(t) => setField("babyName", t)}
                    autoCapitalize='words'
                    returnKeyType='next'
                />
                <FieldError message={formErrors.babyName} />
            </View>

            {/* Date of birth — native picker */}
            <DOBPicker
                value={form.dateOfBirth}
                onChange={(d) => setField("dateOfBirth", d)}
                error={formErrors.dateOfBirth}
            />

            {/* Print type */}
            <View style={styles.fieldGroup}>
                <SectionLabel>Print type</SectionLabel>
                <PillSelector<PrintType>
                    options={PRINT_TYPES}
                    selected={form.printType}
                    onSelect={(v) => setField("printType", v)}
                    error={formErrors.printType}
                />
            </View>

            {/* Frame colour */}
            {kit?.includes_frame && (
                <ColourSelector
                    label='Frame colour'
                    colours={frameColours}
                    selected={form.frameColourId}
                    onSelect={(id) => setField("frameColourId", id)}
                    error={formErrors.frameColourId}
                />
            )}

            {/* Foil colour */}
            {foilColours.length > 0 && (
                <ColourSelector
                    label='Foil colour'
                    colours={foilColours}
                    selected={form.foilColourId}
                    onSelect={(id) => setField("foilColourId", id)}
                    error={formErrors.foilColourId}
                />
            )}

            {/* Card colour */}
            {kit?.includes_affirmation_card && cardColours.length > 0 && (
                <ColourSelector
                    label='Card colour'
                    colours={cardColours}
                    selected={form.cardColourId}
                    onSelect={(id) => setField("cardColourId", id)}
                    error={formErrors.cardColourId}
                />
            )}

            {/* Photos */}
            <ImagePickerSection
                images={form.images}
                onPickLibrary={pickImages}
                onPickCamera={pickFromCamera}
                onRemove={removeImage}
                error={formErrors.images}
            />

            {/* Special instructions */}
            <View style={styles.fieldGroup}>
                <Input
                    label='Special instructions'
                    placeholder='e.g. Please add "Happy Birthday Grandma" in small text below the print'
                    value={form.specialInstructions}
                    onChangeText={(t) => setField("specialInstructions", t)}
                    multiline
                    numberOfLines={3}
                    returnKeyType='done'
                    style={styles.textArea}
                />
            </View>

            {submitError && <Text style={styles.errorText}>{submitError}</Text>}

            <Button label='Submit prints' variant='gold' fullWidth onPress={submitOrder} style={styles.submitBtn} />
        </View>
    );
}

// ─── Submitting view ──────────────────────────────────────────────────────────

function SubmittingView({ progress }: { progress: string | null }) {
    return (
        <View style={styles.centeredBody}>
            <ActivityIndicator size='large' color={colors.gold} />
            <Text style={styles.submittingText}>{progress ?? "Submitting your order…"}</Text>
        </View>
    );
}

// ─── Success view ─────────────────────────────────────────────────────────────

function SuccessView({ orderId }: { orderId: string }) {
    console.log("orderId: ", orderId);
    return (
        <View style={styles.centeredBody}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.heading}>All done!</Text>
            <Text style={styles.subheading}>
                We've received your prints. Your proof will be ready in 1–2 working days — we'll email you when it's
                ready to review.
            </Text>
            <Button
                label='Back to home'
                variant='gold'
                fullWidth
                onPress={() => router.replace(`/orders/${orderId}/chat`)}
                style={styles.submitBtn}
            />
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function UploadScreen() {
    const hook = useUploadForm();
    const { step, orderNumber, setOrderNumber, lookupError, isLooking, lookupOrder, uploadProgress } = hook;

    return (
        <ScreenWrapper
            scrollable={step !== "success" && step !== "submitting"}
            header={<NavBar variant='back' title='Upload prints' />}>
            {step === "lookup" && (
                <LookupStep
                    orderNumber={orderNumber}
                    setOrderNumber={setOrderNumber}
                    onSubmit={lookupOrder}
                    isLooking={isLooking}
                    error={lookupError}
                />
            )}
            {step === "form" && <UploadForm hook={hook} />}
            {step === "submitting" && <SubmittingView progress={uploadProgress} />}
            {step === "success" && <SuccessView orderId={orderNumber} />}
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    body: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
    },
    centeredBody: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xl * 2,
        alignItems: "center",
        gap: spacing.md,
    },
    headingBlock: { gap: spacing.xs },
    heading: {
        fontFamily: typography.fonts.serif,
        fontSize: typography.sizes.xl,
        color: colors.charcoal,
        lineHeight: typography.sizes.xl * 1.3,
    },
    subheading: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        lineHeight: typography.sizes.sm * 1.6,
    },
    fieldGroup: { gap: 4 },
    submitBtn: { marginTop: spacing.xs },
    errorText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.error ?? "#C0392B",
    },
    textArea: {
        minHeight: 88,
        textAlignVertical: "top",
        paddingTop: spacing.sm,
    },
    kitBadge: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.gold + "14",
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.gold + "40",
    },
    kitBadgeText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        fontWeight: "600",
        color: colors.charcoal,
    },
    kitInclude: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
    },
    submittingText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        marginTop: spacing.sm,
        textAlign: "center",
    },
    successEmoji: { fontSize: 48, marginBottom: spacing.sm },
});
