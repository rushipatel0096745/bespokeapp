import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { colors, typography, spacing, radii } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { useCreatePost } from "@/hooks/useCommunity";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const MAX_CHARS = 2000;

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
    const response = await fetch(uri);
    return response.arrayBuffer();
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ComposeScreen() {
    const { profile } = useAuth();
    const { mutateAsync: createPost, isPending } = useCreatePost();

    const [body, setBody] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const canPost = body.trim().length > 0 && !isPending && !isUploadingImage;
    const charsLeft = MAX_CHARS - body.length;

    // ── Image picker ──────────────────────────────────────────────────────────

    async function handlePickImage() {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Photo library access is required to attach an image.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
            exif: false,
        });

        if (result.canceled) return;
        setImageUri(result.assets[0].uri);
    }

    function handleRemoveImage() {
        setImageUri(null);
    }

    // ── Upload image to storage ───────────────────────────────────────────────

    async function uploadImage(uri: string): Promise<string> {
        const path = `posts/${profile!.id}/${Date.now()}.jpg`;
        const arrayBuffer = await uriToArrayBuffer(uri);

        const { error } = await supabase.storage
            .from("community-images")
            .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: false });

        if (error) throw error;

        const { data } = supabase.storage.from("community-images").getPublicUrl(path);
        return data.publicUrl;
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    async function handlePost() {
        if (!canPost || !profile) return;

        let uploadedImageUrl: string | null = null;

        if (imageUri) {
            setIsUploadingImage(true);
            try {
                uploadedImageUrl = await uploadImage(imageUri);
            } catch (error) {
                // Alert.alert("Image upload failed", "Please try again.");
                console.log(error);
                Alert.alert("Image upload failed", error instanceof Error ? error.message : JSON.stringify(error));
                setIsUploadingImage(false);
                return;
            }
            setIsUploadingImage(false);
        }

        await createPost({
            authorId: profile.id,
            body: body.trim(),
            imageUrl: uploadedImageUrl,
        });

        router.back();
    }

    // ── Right element: Post button ────────────────────────────────────────────

    const PostButton = (
        <TouchableOpacity
            onPress={handlePost}
            disabled={!canPost}
            style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
            activeOpacity={0.7}>
            {isPending || isUploadingImage ? (
                <ActivityIndicator size='small' color={colors.white} />
            ) : (
                <Text style={[styles.postBtnText, !canPost && styles.postBtnTextDisabled]}>Post</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='New post' rightElement={PostButton} />}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps='handled'>
                    {/* Body input */}
                    <TextInput
                        ref={inputRef}
                        style={styles.bodyInput}
                        placeholder='Share something with the community…'
                        placeholderTextColor={colors.charcoalLight}
                        value={body}
                        onChangeText={(t) => {
                            if (t.length <= MAX_CHARS) setBody(t);
                        }}
                        multiline
                        autoFocus
                        textAlignVertical='top'
                        returnKeyType='default'
                    />

                    {/* Image preview */}
                    {imageUri && (
                        <View style={styles.imagePreviewWrap}>
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode='cover' />
                            <TouchableOpacity
                                style={styles.removeImageBtn}
                                onPress={handleRemoveImage}
                                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                <Text style={styles.removeImageIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                {/* Bottom toolbar */}
                <View style={styles.toolbar}>
                    <TouchableOpacity
                        style={styles.toolbarBtn}
                        onPress={handlePickImage}
                        activeOpacity={0.7}
                        disabled={!!imageUri}>
                        <Text style={[styles.toolbarIcon, !!imageUri && styles.toolbarIconDisabled]}>🖼️</Text>
                    </TouchableOpacity>

                    <Text style={[styles.charCount, charsLeft < 100 && styles.charCountWarning]}>{charsLeft}</Text>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    flex: { flex: 1 },
    scrollContent: {
        padding: spacing.lg,
        gap: spacing.md,
        flexGrow: 1,
    },
    bodyInput: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
        lineHeight: typography.sizes.lg * 1.6,
        minHeight: 180,
        flex: 1,
    },
    imagePreviewWrap: {
        position: "relative",
        borderRadius: radii.lg,
        overflow: "hidden",
        alignSelf: "flex-start",
    },
    imagePreview: {
        width: 200,
        height: 160,
        borderRadius: radii.lg,
    },
    removeImageBtn: {
        position: "absolute",
        top: spacing.sm,
        right: spacing.sm,
        width: 24,
        height: 24,
        borderRadius: radii.full,
        backgroundColor: "rgba(0,0,0,0.55)",
        alignItems: "center",
        justifyContent: "center",
    },
    removeImageIcon: {
        color: colors.white,
        fontSize: 11,
        fontWeight: "700",
    },
    toolbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        backgroundColor: colors.white,
    },
    toolbarBtn: {
        padding: spacing.xs,
    },
    toolbarIcon: { fontSize: 22 },
    toolbarIconDisabled: { opacity: 0.35 },
    charCount: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
    },
    charCountWarning: {
        color: colors.error,
    },
    postBtn: {
        backgroundColor: colors.gold,
        borderRadius: radii.full,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xs + 2,
    },
    postBtnDisabled: {
        backgroundColor: colors.border,
    },
    postBtnText: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
    },
    postBtnTextDisabled: {
        color: colors.charcoalLight,
    },
});
