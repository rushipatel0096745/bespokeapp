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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, radii } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { AuthorAvatar } from "@/components/community/AuthorAvatar";
import { useCreatePost } from "@/hooks/useCommunity";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const MAX_CHARS = 2000;
const WARN_THRESHOLD = 100;

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
    const response = await fetch(uri);
    return response.arrayBuffer();
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ComposeScreen() {
    const { profile } = useAuth();
    const { mutateAsync: createPost, isPending } = useCreatePost();
    const insets = useSafeAreaInsets();

    const [body, setBody] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const isBusy = isPending || isUploadingImage;
    const canPost = body.trim().length > 0 && !isBusy;
    const charsLeft = MAX_CHARS - body.length;
    const authorName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : "";

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
                Alert.alert("Image upload failed", error instanceof Error ? error.message : "Please try again.");
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

    // ── Nav right element ─────────────────────────────────────────────────────

    const PostButton = (
        <TouchableOpacity
            onPress={handlePost}
            disabled={!canPost}
            style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
            activeOpacity={0.7}>
            {isBusy ? (
                <ActivityIndicator size='small' color={colors.white} />
            ) : (
                <Text style={[styles.postBtnText, !canPost && styles.postBtnTextDisabled]}>Post</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='New post' rightElement={PostButton} />}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}>
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps='handled'
                    showsVerticalScrollIndicator={false}>
                    {/* Author row */}
                    {profile && (
                        <View style={styles.authorRow}>
                            <AuthorAvatar
                                firstName={profile.first_name}
                                lastName={profile.last_name}
                                avatarUrl={profile.avatar_url ?? null}
                                size='md'
                            />
                            <View style={styles.authorMeta}>
                                <Text style={styles.authorName}>{authorName}</Text>
                                <Text style={styles.audienceLabel}>Everyone in the community</Text>
                            </View>
                        </View>
                    )}

                    {/* Body input */}
                    <TextInput
                        ref={inputRef}
                        style={styles.bodyInput}
                        placeholder="What's on your mind?"
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
                                onPress={() => setImageUri(null)}
                                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                <Text style={styles.removeImageIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                {/* Bottom toolbar */}
                <View style={[styles.toolbar, { paddingBottom: insets.bottom || spacing.sm }]}>
                    <View style={styles.toolbarActions}>
                        <TouchableOpacity
                            style={[styles.toolbarBtn, imageUri ? styles.toolbarBtnActive : null]}
                            onPress={imageUri ? () => setImageUri(null) : handlePickImage}
                            activeOpacity={0.7}>
                            <Text style={styles.toolbarIcon}>🖼️</Text>
                            {imageUri && <Text style={styles.toolbarBtnLabel}>Remove</Text>}
                        </TouchableOpacity>
                    </View>

                    {/* Char counter — only shown when approaching the limit */}
                    {charsLeft <= WARN_THRESHOLD && (
                        <Text style={[styles.charCount, charsLeft <= 20 && styles.charCountDanger]}>{charsLeft}</Text>
                    )}
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
        gap: spacing.lg,
        flexGrow: 1,
    },

    // Author row
    authorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    authorMeta: {
        gap: 2,
    },
    authorName: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
    },
    audienceLabel: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
    },

    // Body input
    bodyInput: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
        lineHeight: typography.sizes.lg * 1.6,
        minHeight: 160,
        flex: 1,
    },

    // Image preview
    imagePreviewWrap: {
        position: "relative",
        alignSelf: "flex-start",
        borderRadius: radii.lg,
        overflow: "hidden",
    },
    imagePreview: {
        width: 220,
        height: 175,
        borderRadius: radii.lg,
        backgroundColor: colors.creamMid,
    },
    removeImageBtn: {
        position: "absolute",
        top: spacing.sm,
        right: spacing.sm,
        width: 26,
        height: 26,
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

    // Toolbar
    toolbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        backgroundColor: colors.white,
    },
    toolbarActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    toolbarBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: radii.full,
        backgroundColor: "transparent",
    },
    toolbarBtnActive: {
        backgroundColor: colors.errorBg,
    },
    toolbarBtnLabel: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        color: colors.error,
    },
    toolbarIcon: { fontSize: 20 },

    // Char counter
    charCount: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        minWidth: 32,
        textAlign: "right",
    },
    charCountDanger: {
        color: colors.error,
    },

    // Post button
    postBtn: {
        backgroundColor: colors.gold,
        borderRadius: radii.full,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xs + 2,
        minWidth: 60,
        alignItems: "center",
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
