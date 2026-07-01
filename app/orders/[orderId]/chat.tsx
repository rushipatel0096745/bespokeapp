import React, { useRef, useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    Pressable,
    Image,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    useWindowDimensions,
    Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

import * as ImagePicker from "expo-image-picker";

import { useConversation } from "@/hooks/useConversation";
import { useMessages } from "@/hooks/useMessage";
import { useSendMessage } from "@/hooks/useSendMessage";
import { Message } from "@/services/message";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { colors, typography, spacing, radii, shadows } from "@/theme/theme";

type DateMarker = { type: "__date__"; label: string; id: string };
type ListItem = Message | DateMarker;

type ActionHandler = (action: string, message: Message) => void;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDateLabel(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// Group messages by date for date separators
function groupByDate(messages: Message[]): (Message | { type: "__date__"; label: string; id: string })[] {
    const result: (Message | { type: "__date__"; label: string; id: string })[] = [];
    let lastDate = "";

    for (const msg of messages) {
        const dateLabel = formatDateLabel(msg.created_at);
        if (dateLabel !== lastDate) {
            result.push({ type: "__date__", label: dateLabel, id: `date-${msg.id}` });
            lastDate = dateLabel;
        }
        result.push(msg);
    }
    return result;
}

// ─── Bubble sub-components ────────────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
    return (
        <View style={sep.root}>
            <View style={sep.line} />
            <Text style={sep.label}>{label}</Text>
            <View style={sep.line} />
        </View>
    );
}

const sep = StyleSheet.create({
    root: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    line: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
    },
    label: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
    },
});

// ── System pill ───────────────────────────────────────────────────────────────

function SystemBubble({ text }: { text: string }) {
    return (
        <View style={sysBubble.root}>
            <Text style={sysBubble.text}>{text}</Text>
        </View>
    );
}

const sysBubble = StyleSheet.create({
    root: {
        alignSelf: "center",
        backgroundColor: colors.creamMid,
        borderRadius: radii.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        marginVertical: spacing.xs,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    text: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
    },
});

// ── Text bubble ───────────────────────────────────────────────────────────────

function TextBubble({
    msg,
    onAction,
    actionDisabled,
}: {
    msg: Message;
    onAction: ActionHandler;
    actionDisabled: boolean;
}) {
    const isCustomer = msg.sender_type === "customer";
    const isOptimistic = msg.id.startsWith("optimistic-");
    const action = msg.metadata?.action as string | undefined;

    return (
        <View style={[bubble.row, isCustomer && bubble.rowReverse]}>
            <View style={[bubble.bubble, isCustomer ? bubble.bubbleCustomer : bubble.bubbleAgent]}>
                <Text style={[bubble.text, isCustomer ? bubble.textCustomer : bubble.textAgent]}>{msg.text}</Text>

                {action === "proof_decision" && (
                    <View style={bubble.ctaRow}>
                        <Pressable
                            style={[bubble.cta, bubble.ctaPrimary, actionDisabled && { opacity: 0.6 }]}
                            onPress={() => onAction("approve_proof", msg)}
                            disabled={actionDisabled}>
                            <Text style={bubble.ctaText}>All OK</Text>
                        </Pressable>
                        <Pressable
                            style={[bubble.cta, bubble.ctaSecondary, actionDisabled && { opacity: 0.6 }]}
                            onPress={() => onAction("request_changes", msg)}
                            disabled={actionDisabled}>
                            <Text style={bubble.ctaTextSecondary}>Make Changes</Text>
                        </Pressable>
                    </View>
                )}

                {action === "upsell_offer" && (
                    <View style={bubble.ctaRow}>
                        <Pressable
                            style={[bubble.cta, bubble.ctaPrimary, actionDisabled && { opacity: 0.6 }]}
                            onPress={() => onAction("upsell_yes", msg)}
                            disabled={actionDisabled}>
                            <Text style={bubble.ctaText}>Yes Please</Text>
                        </Pressable>
                        <Pressable
                            style={[bubble.cta, bubble.ctaSecondary, actionDisabled && { opacity: 0.6 }]}
                            onPress={() => onAction("upsell_no", msg)}
                            disabled={actionDisabled}>
                            <Text style={bubble.ctaTextSecondary}>No Thanks</Text>
                        </Pressable>
                    </View>
                )}

                {action === "upsell_retry" && (
                    <View style={bubble.ctaRow}>
                        <Pressable
                            style={[bubble.cta, bubble.ctaPrimary, actionDisabled && { opacity: 0.6 }]}
                            onPress={() => onAction("upsell_retry_yes", msg)}
                            disabled={actionDisabled}>
                            <Text style={bubble.ctaText}>OK, YES!</Text>
                        </Pressable>
                        <Pressable
                            style={[bubble.cta, bubble.ctaSecondary, actionDisabled && { opacity: 0.6 }]}
                            onPress={() => onAction("upsell_retry_no", msg)}
                            disabled={actionDisabled}>
                            <Text style={bubble.ctaTextSecondary}>No Thank You!</Text>
                        </Pressable>
                    </View>
                )}

                {action === "browse_addons" && (
                    <Pressable
                        style={[bubble.cta, actionDisabled && { opacity: 0.6 }]}
                        onPress={() => onAction("browse_addons", msg)}
                        disabled={actionDisabled}>
                        <Text style={bubble.ctaText}>Browse Add-Ons</Text>
                    </Pressable>
                )}

                <Text
                    style={[
                        bubble.time,
                        isCustomer ? bubble.timeCustomer : bubble.timeAgent,
                        isOptimistic && bubble.timeFaded,
                    ]}>
                    {isOptimistic ? "Sending…" : formatTime(msg.created_at)}
                </Text>
            </View>
        </View>
    );
}
// ── Image bubble ──────────────────────────────────────────────────────────────

function ImageBubble({ msg, onPress }: { msg: Message; onPress: (uri: string) => void }) {
    const isCustomer = msg.sender_type === "customer";
    const isOptimistic = msg.id.startsWith("optimistic-");
    if (!msg.image_url) return null;

    return (
        <View style={[bubble.row, isCustomer && bubble.rowReverse]}>
            <Pressable onPress={() => msg.image_url && onPress(msg.image_url)}>
                <Image
                    source={{ uri: msg.image_url! }}
                    style={[imgBubble.img, isOptimistic && imgBubble.imgOptimistic]}
                    resizeMode='cover'
                />
                <Text
                    style={[
                        bubble.time,
                        isCustomer ? bubble.timeCustomer : bubble.timeAgent,
                        { marginTop: spacing.xs },
                        isOptimistic && bubble.timeFaded,
                    ]}>
                    {isOptimistic ? "Sending…" : formatTime(msg.created_at)}
                </Text>
            </Pressable>
        </View>
    );
}

const imgBubble = StyleSheet.create({
    img: {
        width: 200,
        height: 200,
        borderRadius: radii.lg,
        backgroundColor: colors.creamMid,
    },
    imgOptimistic: {
        opacity: 0.6,
    },
});

// ── Proof card ────────────────────────────────────────────────────────────────

// function ProofCard({ msg, onPress }: { msg: Message; onPress: (uri: string) => void }) {
//     const proofUrl = msg.image_url;
//     const proofTitle = (msg.metadata?.title as string) ?? "Your proof is ready";
//     const proofNote = (msg.metadata?.note as string) ?? "Please review and let us know.";

//     return (
//         <View style={proofCard.root}>
//             {proofUrl && (
//                 <Pressable onPress={() => onPress(proofUrl)}>
//                     <Image source={{ uri: proofUrl }} style={proofCard.image} resizeMode='cover' />
//                 </Pressable>
//             )}
//             <View style={proofCard.body}>
//                 <Text style={proofCard.title}>{proofTitle}</Text>
//                 <Text style={proofCard.note}>{proofNote}</Text>
//                 <View style={proofCard.actions}>
//                     <Pressable style={proofCard.btnApprove}>
//                         <Text style={proofCard.btnApproveText}>✓ Approve</Text>
//                     </Pressable>
//                     <Pressable style={proofCard.btnChanges}>
//                         <Text style={proofCard.btnChangesText}>Request Changes</Text>
//                     </Pressable>
//                 </View>
//             </View>
//         </View>
//     );
// }

function ProofCard({ msg, onPress }: { msg: Message; onPress: (uri: string) => void }) {
    if (!msg.image_url) return null;

    return (
        <View style={[proofCard.root, proofCard.alignLeft]}>
            <Text style={proofCard.proofLabel}>Design Proof</Text>
            <Pressable onPress={() => onPress(msg.image_url!)}>
                <Image source={{ uri: msg.image_url }} style={proofCard.proofThumb} resizeMode='cover' />
            </Pressable>
            <Pressable style={proofCard.proofButton} onPress={() => onPress(msg.image_url!)}>
                <Text style={proofCard.proofButtonText}>View Proof</Text>
            </Pressable>
        </View>
    );
}

const proofCard = StyleSheet.create({
    root: {
        alignSelf: "flex-start",
        maxWidth: "80%",
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        borderWidth: 0.5,
        borderColor: colors.borderGold,
        overflow: "hidden",
        marginVertical: spacing.xs,
        marginLeft: spacing.lg,
        ...shadows.card,
    },
    image: {
        width: "100%",
        height: 180,
        backgroundColor: colors.creamMid,
    },
    body: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    title: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
    },
    note: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        lineHeight: typography.sizes.sm * 1.5,
    },
    actions: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    btnApprove: {
        flex: 1,
        backgroundColor: colors.success,
        borderRadius: radii.md,
        paddingVertical: spacing.sm,
        alignItems: "center",
    },
    btnApproveText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.white,
    },
    btnChanges: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingVertical: spacing.sm,
        alignItems: "center",
    },
    btnChangesText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
    },
    alignLeft: {
        alignSelf: "flex-start",
    },
    proofCard: {
        marginVertical: 6,
        marginHorizontal: 12,
        padding: 10,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E5EA",
        maxWidth: "80%",
    },
    proofLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6B6B70",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    proofThumb: {
        width: "100%",
        height: 220,
        borderRadius: 10,
    },
    proofButton: {
        marginTop: 10,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#1A1A1A",
        alignItems: "center",
    },
    proofButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "600",
    },
});

// ─── Shared bubble styles ─────────────────────────────────────────────────────

const MAX_BUBBLE_WIDTH = "80%";

const bubble = StyleSheet.create({
    row: {
        flexDirection: "row",
        marginVertical: spacing.xs / 2,
        paddingHorizontal: spacing.lg,
    },
    rowReverse: {
        flexDirection: "row-reverse",
    },
    bubble: {
        maxWidth: MAX_BUBBLE_WIDTH,
        borderRadius: radii.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    bubbleAgent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radii.xs,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        ...shadows.card,
    },
    bubbleCustomer: {
        backgroundColor: colors.charcoal,
        borderTopRightRadius: radii.xs,
    },
    text: {
        fontSize: typography.sizes.base,
        fontFamily: typography.fonts.sans,
        lineHeight: typography.sizes.base * 1.5,
    },
    textAgent: { color: colors.charcoalMid },
    textCustomer: { color: colors.white },
    cta: {
        marginTop: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radii.md,
        backgroundColor: colors.charcoal,
        alignSelf: "flex-start",
    },
    ctaRow: {
        flexDirection: "row",
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    ctaPrimary: {
        backgroundColor: colors.charcoal,
        marginTop: 0,
    },
    ctaSecondary: {
        backgroundColor: colors.white,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        marginTop: 0,
    },
    ctaText: {
        fontSize: typography.sizes.xs,
        fontFamily: typography.fonts.sans,
        fontWeight: "600",
        color: colors.white,
    },
    ctaTextSecondary: {
        fontSize: typography.sizes.xs,
        fontFamily: typography.fonts.sans,
        fontWeight: "600",
        color: colors.charcoalMid,
    },
    time: {
        fontSize: typography.sizes.xxs,
        marginTop: spacing.xs / 2,
        fontFamily: typography.fonts.sans,
    },
    timeAgent: { color: colors.charcoalLight, textAlign: "left" },
    timeCustomer: { color: colors.goldLight, textAlign: "right" },
    timeFaded: { opacity: 0.5 },
});
// ─── Message renderer ─────────────────────────────────────────────────────────

function MessageItem({
    item,
    onImagePress,
    onAction,
    actionDisabled,
}: {
    item: Message;
    onImagePress: (uri: string) => void;
    onAction: ActionHandler;
    actionDisabled: boolean;
}) {
    if (item.sender_type === "designer" && item.message_type === "image") {
        return <ProofCard msg={item} onPress={onImagePress} />;
    }

    if (item.message_type === "image") {
        return <ImageBubble msg={item} onPress={onImagePress} />;
    }

    return <TextBubble msg={item} onAction={onAction} actionDisabled={actionDisabled} />;
}

// ─── Fullscreen image viewer ──────────────────────────────────────────────────

function FullscreenImage({ uri, onClose }: { uri: string; onClose: () => void }) {
    const { width, height } = useWindowDimensions();
    return (
        <Modal visible animationType='fade' onRequestClose={onClose} statusBarTranslucent>
            <Pressable style={{ flex: 1, backgroundColor: "#000", justifyContent: "center" }} onPress={onClose}>
                <Image source={{ uri }} style={{ width, height }} resizeMode='contain' />
            </Pressable>
            <Pressable style={fsImg.closeBtn} onPress={onClose}>
                <Text style={fsImg.closeText}>✕</Text>
            </Pressable>
        </Modal>
    );
}

const fsImg = StyleSheet.create({
    closeBtn: {
        position: "absolute",
        top: spacing.xxxl,
        right: spacing.lg,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    closeText: {
        color: colors.white,
        fontSize: typography.sizes.base,
    },
});

// ─── Input bar ────────────────────────────────────────────────────────────────

function InputBar({
    onSendText,
    onSendImage,
    isSending,
}: {
    onSendText: (t: string) => void;
    onSendImage: (uri: string) => void;
    isSending: boolean;
}) {
    const [text, setText] = useState("");

    function handleSend() {
        const trimmed = text.trim();
        if (!trimmed || isSending) return;
        onSendText(trimmed);
        setText("");
    }

    async function handleImagePick() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsMultipleSelection: false,
        });
        if (!result.canceled && result.assets[0]) {
            onSendImage(result.assets[0].uri);
        }
    }

    const canSend = text.trim().length > 0 && !isSending;

    return (
        <View style={input.root}>
            {/* Attach image */}
            <Pressable onPress={handleImagePick} style={input.iconBtn} disabled={isSending}>
                <Text style={input.iconText}>📎</Text>
            </Pressable>

            {/* Text field */}
            <TextInput
                style={input.field}
                value={text}
                onChangeText={setText}
                placeholder='Type a message…'
                placeholderTextColor={colors.charcoalLight}
                multiline
                maxLength={2000}
                returnKeyType='default'
            />

            {/* Send */}
            <Pressable onPress={handleSend} disabled={!canSend} style={[input.sendBtn, canSend && input.sendBtnActive]}>
                {isSending ? (
                    <ActivityIndicator size='small' color={colors.white} />
                ) : (
                    <Text style={input.sendIcon}>➤</Text>
                )}
            </Pressable>
        </View>
    );
}

const input = StyleSheet.create({
    root: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        paddingBottom: spacing.md,
        backgroundColor: colors.white,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    iconBtn: {
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
    },
    iconText: {
        fontSize: 20,
    },
    field: {
        flex: 1,
        minHeight: 36,
        maxHeight: 120,
        backgroundColor: colors.cream,
        borderRadius: radii.xxl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.border,
        justifyContent: "center",
        alignItems: "center",
    },
    sendBtnActive: {
        backgroundColor: colors.charcoal,
    },
    sendIcon: {
        color: colors.white,
        fontSize: typography.sizes.base,
    },
});

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ChatSkeleton() {
    return (
        <View style={skel.root}>
            {[
                ["40%", false],
                ["60%", true],
                ["35%", false],
                ["55%", true],
                ["45%", false],
            ].map(([w, isRight], i) => (
                <View
                    key={i}
                    style={[skel.bubble, { width: w as any, alignSelf: isRight ? "flex-end" : "flex-start" }]}
                />
            ))}
        </View>
    );
}

const skel = StyleSheet.create({
    root: {
        flex: 1,
        padding: spacing.lg,
        gap: spacing.md,
    },
    bubble: {
        height: 40,
        borderRadius: radii.xl,
        backgroundColor: colors.creamMid,
    },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatScreen() {
    const { orderId, conversationId: passedConversationId } = useLocalSearchParams<{
        orderId: string;
        conversationId?: string;
    }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (passedConversationId && orderId) {
            queryClient.setQueryData(["conversation", orderId], {
                id: passedConversationId,
                order_id: orderId,
                created_at: new Date().toISOString(),
            });
        }
    }, [passedConversationId, orderId, queryClient]);

    const { data: conversation, isLoading: convLoading } = useConversation(orderId);
    const { data: rawMessages, isLoading: msgsLoading } = useMessages(conversation?.id);
    const { sendText, sendImage, isSending } = useSendMessage(conversation?.id ?? "");

    const listRef = useRef<FlatList>(null);
    const [viewerUri, setViewerUri] = useState<string | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const isLoading = convLoading || msgsLoading;
    const messages = groupByDate(rawMessages ?? []);

    // Scroll to bottom when new messages arrive
    const handleContentSizeChange = useCallback(() => {
        listRef.current?.scrollToEnd({ animated: true });
    }, []);

    // Central place every metadata.action routes through, regardless of
    // which bubble type rendered it (text CTA, proof decision, etc).
    const handleAction = useCallback<ActionHandler>(
        async (action, message) => {
            const conversationId = conversation?.id;
            if (!conversationId) return;

            try {
                setIsActionLoading(true);

                switch (action) {
                    case "approve_proof":
                        const { error: approveError } = await supabase.rpc("resolve_proof_decision", {
                            p_conversation_id: conversationId,
                            p_decision_message_id: message.id,
                            p_decision: "approved",
                        });
                        if (approveError) throw approveError;
                        break;
                    case "request_changes":
                        const { error: requestError } = await supabase.rpc("resolve_proof_decision", {
                            p_conversation_id: conversationId,
                            p_decision_message_id: message.id,
                            p_decision: "changes_requested",
                        });
                        if (requestError) throw requestError;
                        break;
                    case "upsell_yes":
                        const { error: uyError } = await supabase.rpc("resolve_upsell_offer", {
                            p_conversation_id: conversationId,
                            p_decision_message_id: message.id,
                            p_decision: "yes",
                        });
                        if (uyError) throw uyError;
                        break;
                    case "upsell_no":
                        const { error: unError } = await supabase.rpc("resolve_upsell_offer", {
                            p_conversation_id: conversationId,
                            p_decision_message_id: message.id,
                            p_decision: "no",
                        });
                        if (unError) throw unError;
                        break;
                    case "upsell_retry_yes":
                        const { error: uryError } = await supabase.rpc("resolve_upsell_retry", {
                            p_conversation_id: conversationId,
                            p_decision_message_id: message.id,
                            p_decision: "yes",
                        });
                        if (uryError) throw uryError;
                        break;
                    case "upsell_retry_no":
                        const { error: urnError } = await supabase.rpc("resolve_upsell_retry", {
                            p_conversation_id: conversationId,
                            p_decision_message_id: message.id,
                            p_decision: "no",
                        });
                        if (urnError) throw urnError;
                        break;
                    case "browse_addons":
                        router.push({
                            pathname: "/add-ons",
                            params: {
                                orderId,
                            },
                        });
                        return;
                    default:
                        if (__DEV__) console.warn("Unhandled chat action:", action, message.id);
                        return;
                }

                // Invalidate messages query so the UI updates immediately
                await queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
            } catch (err: any) {
                console.error("Action error:", err);
                Alert.alert("Error", err.message || "Failed to submit decision");
            } finally {
                setIsActionLoading(false);
            }
        },
        [conversation, orderId, router, queryClient]
    );

    const renderItem = useCallback(
        ({ item }: { item: ListItem }) => {
            if ("type" in item && item.type === "__date__") {
                return <DateSeparator label={item.label} />;
            }
            return (
                <MessageItem
                    item={item as Message}
                    onImagePress={setViewerUri}
                    onAction={handleAction}
                    actionDisabled={isActionLoading}
                />
            );
        },
        [handleAction, isActionLoading]
    );

    return (
        <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='Conversation' />}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
                {/* Message list */}
                {isLoading ? (
                    <ChatSkeleton />
                ) : (
                    <FlatList
                        ref={listRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={screen.listContent}
                        onContentSizeChange={handleContentSizeChange}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={screen.empty}>
                                <Text style={screen.emptyText}>No messages yet.</Text>
                            </View>
                        }
                    />
                )}

                {/* Input */}
                {!isLoading && conversation && (
                    <InputBar onSendText={sendText} onSendImage={sendImage} isSending={isSending} />
                )}
            </KeyboardAvoidingView>

            {/* Fullscreen image viewer */}
            {viewerUri && <FullscreenImage uri={viewerUri} onClose={() => setViewerUri(null)} />}
        </ScreenWrapper>
    );
}

const screen = StyleSheet.create({
    listContent: {
        paddingVertical: spacing.md,
        flexGrow: 1,
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: spacing.section * 2,
    },
    emptyText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoalLight,
    },
});
