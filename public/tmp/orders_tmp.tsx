// screens/ChatScreen.tsx
// Modern Mum Co — Proof Chat Screen
// Replicates the WhatsApp proof sign-off flow natively

import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    StatusBar,
    Image,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, typography, spacing, radii, shadows, componentStyles } from "../../theme/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = "agent" | "bot" | "user";

type ChatState =
    | "awaiting_proof"
    | "proof_delivered"
    | "awaiting_decision"
    | "changes_round_1"
    | "changes_round_2"
    | "upsell"
    | "soft_retry"
    | "awaiting_order_number"
    | "complete";

interface Message {
    id: string;
    role: MessageRole;
    content: string;
    imageUrl?: string;
    timestamp: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChatNavBar({ babyName, ticketId, onBack }: { babyName: string; ticketId: string; onBack: () => void }) {
    return (
        <View style={styles.navBar}>
            <TouchableOpacity onPress={onBack} accessibilityRole='button' accessibilityLabel='Go back'>
                <Text style={styles.navBack}>‹</Text>
            </TouchableOpacity>
            <View style={styles.navTitleGroup}>
                <Text style={styles.navTitle}>Baby {babyName}</Text>
                <Text style={styles.navSubtitle}>#{ticketId}</Text>
            </View>
            <View style={styles.navStatusDot} />
        </View>
    );
}

function ChatBubble({ message }: { message: Message }) {
    const isUser = message.role === "user";
    const isBot = message.role === "bot";

    const bubbleStyle = isUser
        ? componentStyles.bubbleUser
        : isBot
          ? componentStyles.bubbleBot
          : componentStyles.bubbleAgent;

    const textStyle = isUser ? componentStyles.bubbleTextUser : componentStyles.bubbleTextAgent;

    return (
        <View style={[styles.bubbleRow, isUser && styles.bubbleRowRight]}>
            {!isUser && (
                <View style={[styles.bubbleAvatar, isBot && styles.bubbleAvatarBot]}>
                    <Text style={styles.bubbleAvatarText}>{isBot ? "✦" : "A"}</Text>
                </View>
            )}
            <View style={[bubbleStyle, styles.bubbleMaxWidth]}>
                {message.imageUrl && (
                    <View style={styles.proofImageContainer}>
                        <Image
                            source={{ uri: message.imageUrl }}
                            style={styles.proofImage}
                            resizeMode='cover'
                            accessibilityLabel='Proof image'
                        />
                        <Text style={styles.proofTapHint}>Tap to view full screen</Text>
                    </View>
                )}
                <Text style={textStyle}>{message.content}</Text>
                <Text style={[styles.timestamp, isUser && styles.timestampUser]}>{message.timestamp}</Text>
            </View>
        </View>
    );
}

function QuickReplies({ chatState, onAction }: { chatState: ChatState; onAction: (action: string) => void }) {
    const replies: { label: string; action: string; variant: "default" | "gold" }[] = [];

    if (chatState === "proof_delivered" || chatState === "awaiting_decision") {
        replies.push(
            { label: "All ok", action: "all_ok", variant: "gold" },
            { label: "Make changes", action: "make_changes", variant: "default" }
        );
    } else if (chatState === "changes_round_2") {
        replies.push(
            { label: "All ok", action: "all_ok", variant: "gold" },
            { label: "More changes", action: "more_changes", variant: "default" }
        );
    } else if (chatState === "upsell") {
        replies.push(
            { label: "Yes please", action: "upsell_yes", variant: "gold" },
            { label: "No thanks", action: "upsell_no", variant: "default" }
        );
    } else if (chatState === "soft_retry") {
        replies.push(
            { label: "OK, yes!", action: "retry_yes", variant: "gold" },
            { label: "No thank you", action: "retry_no", variant: "default" }
        );
    }

    if (replies.length === 0) return null;

    return (
        <View style={styles.quickReplyRow}>
            {replies.map((r) => (
                <TouchableOpacity
                    key={r.action}
                    style={r.variant === "gold" ? componentStyles.quickReplyGold : componentStyles.quickReply}
                    onPress={() => onAction(r.action)}
                    activeOpacity={0.7}
                    accessibilityRole='button'>
                    <Text
                        style={
                            r.variant === "gold" ? componentStyles.quickReplyGoldText : componentStyles.quickReplyText
                        }>
                        {r.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function ChatInput({ chatState, onSend }: { chatState: ChatState; onSend: (text: string) => void }) {
    const [text, setText] = useState("");

    // Only show free-text input for change feedback and order number entry
    const showInput =
        chatState === "changes_round_1" || chatState === "changes_round_2" || chatState === "awaiting_order_number";

    if (!showInput) return null;

    const placeholder =
        chatState === "awaiting_order_number"
            ? "Paste your order number here..."
            : "Describe the changes you'd like...";

    const handleSend = () => {
        if (text.trim().length === 0) return;
        onSend(text.trim());
        setText("");
    };

    return (
        <View style={styles.inputRow}>
            <TextInput
                style={styles.chatInput}
                value={text}
                onChangeText={setText}
                placeholder={placeholder}
                placeholderTextColor={colors.charcoalLight}
                multiline
                maxLength={500}
                accessibilityLabel='Message input'
            />
            <TouchableOpacity
                style={[styles.sendBtn, text.trim().length > 0 && styles.sendBtnActive]}
                onPress={handleSend}
                disabled={text.trim().length === 0}
                accessibilityRole='button'
                accessibilityLabel='Send message'>
                <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
    const router = useRouter();
    const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
    const scrollRef = useRef<ScrollView>(null);

    const [chatState, setChatState] = useState<ChatState>("proof_delivered");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "bot",
            content:
                "Thanks for submitting your prints — we've received them safely and our team is getting to work on your proof. Whilst you're waiting, why not browse our exclusive add-ons?",
            timestamp: "2 days ago",
        },
        {
            id: "2",
            role: "agent",
            content: "Your proof is ready to review!",
            imageUrl: undefined, // Replace with real proof image URL from Zendesk
            timestamp: "10:24",
        },
        {
            id: "3",
            role: "bot",
            content: "Your proof is attached above. Please let me know if all ok to foil and dispatch.",
            timestamp: "10:24",
        },
    ]);

    const addMessage = (role: MessageRole, content: string, imageUrl?: string) => {
        const newMsg: Message = {
            id: Date.now().toString(),
            role,
            content,
            imageUrl,
            timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleAction = (action: string) => {
        switch (action) {
            case "all_ok":
                addMessage("user", "All ok");
                setTimeout(() => {
                    addMessage(
                        "bot",
                        "Amazing! Before we foil your print, would you like to add extra copies or keyrings at a discounted price? Many families order extras for grandparents. Just a heads up — add-ons are only available before we start foiling!"
                    );
                    setChatState("upsell");
                }, 600);
                break;

            case "make_changes":
                addMessage("user", "Make changes");
                setTimeout(() => {
                    addMessage(
                        "bot",
                        "No problem at all! Please describe the changes you'd like and we'll get a new proof over to you."
                    );
                    setChatState("changes_round_1");
                }, 600);
                break;

            case "more_changes":
                addMessage("user", "More changes");
                setTimeout(() => {
                    addMessage(
                        "bot",
                        "No problem — we're happy to accommodate further amends. As a small business, it works best for us to wrap up revisions within two rounds. Please share all your final feedback in one message."
                    );
                    setChatState("changes_round_2");
                }, 600);
                break;

            case "upsell_yes":
                addMessage("user", "Yes please!");
                setTimeout(() => {
                    addMessage(
                        "bot",
                        "Great! Click below to view and add extras to your basket. Once purchased, please paste your order number here."
                    );
                    setChatState("awaiting_order_number");
                }, 600);
                break;

            case "upsell_no":
                addMessage("user", "No thanks");
                setTimeout(() => {
                    addMessage(
                        "bot",
                        "Are you sure? If you order now we can offer you a further 20% off already discounted prices using code EXTRA-20 🎁"
                    );
                    setChatState("soft_retry");
                }, 600);
                break;

            case "retry_yes":
                addMessage("user", "OK, yes!");
                setTimeout(() => {
                    addMessage(
                        "bot",
                        "Brilliant! Click below to shop add-ons with your 20% off code EXTRA-20. Once purchased, paste your order number here."
                    );
                    setChatState("awaiting_order_number");
                }, 600);
                break;

            case "retry_no":
                addMessage("user", "No thank you");
                setTimeout(() => {
                    addMessage(
                        "bot",
                        "No problem at all! We'll get your prints foiled and posted. You'll receive an email dispatch notification when your order is on its way. 💛"
                    );
                    setChatState("complete");
                }, 600);
                break;
        }
    };

    const handleTextSend = (text: string) => {
        if (chatState === "awaiting_order_number") {
            addMessage("user", text);
            setTimeout(() => {
                addMessage(
                    "bot",
                    `Perfect, thank you! We've received your add-on order ${text}. We\'ll combine everything and foil all together. You\'ll receive an email when dispatched.`
                );
                setChatState("complete");
            }, 600);
        } else {
            // Changes feedback — send to Zendesk ticket via Supabase Edge Function
            addMessage("user", text);
            setTimeout(() => {
                addMessage("bot", "Got it! Our designer will review your feedback and send over a new proof shortly.");
                setChatState("awaiting_decision");
            }, 600);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle='light-content' backgroundColor={colors.charcoal} />

            <ChatNavBar babyName='Ava' ticketId={ticketId ?? "BFC-2024-0441"} onBack={() => router.back()} />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}>
                <ScrollView
                    ref={scrollRef}
                    style={styles.messageList}
                    contentContainerStyle={styles.messageListContent}
                    showsVerticalScrollIndicator={false}>
                    {messages.map((msg) => (
                        <ChatBubble key={msg.id} message={msg} />
                    ))}
                    <View style={{ height: spacing.lg }} />
                </ScrollView>

                {/* Browse add-ons button — shown during upsell states */}
                {(chatState === "upsell" || chatState === "soft_retry" || chatState === "awaiting_order_number") && (
                    <TouchableOpacity
                        style={styles.browseBtn}
                        onPress={() => router.push("/add-ons")}
                        activeOpacity={0.85}
                        accessibilityRole='link'>
                        <Text style={styles.browseBtnText}>Browse add-ons</Text>
                    </TouchableOpacity>
                )}

                <QuickReplies chatState={chatState} onAction={handleAction} />
                <ChatInput chatState={chatState} onSend={handleTextSend} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.charcoal,
    },

    flex: {
        flex: 1,
        backgroundColor: colors.cream,
    },

    // Nav
    navBar: {
        ...componentStyles.navBar,
        gap: spacing.md,
    },

    navBack: {
        fontSize: typography.sizes.xxl,
        color: colors.gold,
        lineHeight: typography.sizes.xxl,
    },

    navTitleGroup: {
        flex: 1,
    },

    navTitle: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.white,
    },

    navSubtitle: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        marginTop: spacing.xxs,
    },

    navStatusDot: {
        width: 8,
        height: 8,
        borderRadius: radii.full,
        backgroundColor: colors.success,
    },

    // Messages
    messageList: {
        flex: 1,
        backgroundColor: colors.cream,
    },

    messageListContent: {
        padding: spacing.md,
        paddingTop: spacing.lg,
    },

    bubbleRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: spacing.md,
        gap: spacing.sm,
    },

    bubbleRowRight: {
        flexDirection: "row-reverse",
    },

    bubbleMaxWidth: {
        maxWidth: "78%",
    },

    bubbleAvatar: {
        width: 28,
        height: 28,
        borderRadius: radii.full,
        backgroundColor: colors.creamMid,
        borderWidth: 0.5,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginBottom: spacing.xs,
    },

    bubbleAvatarBot: {
        backgroundColor: colors.goldPale,
        borderColor: colors.borderGold,
    },

    bubbleAvatarText: {
        fontSize: typography.sizes.xs,
        color: colors.charcoalMid,
    },

    // Proof image in chat
    proofImageContainer: {
        marginBottom: spacing.sm,
        borderRadius: radii.sm,
        overflow: "hidden",
        borderWidth: 0.5,
        borderColor: colors.border,
    },

    proofImage: {
        width: "100%",
        height: 160,
    },

    proofTapHint: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xxs,
        color: colors.charcoalLight,
        textAlign: "center",
        paddingVertical: spacing.xs,
        backgroundColor: colors.creamMid,
    },

    timestamp: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xxs,
        color: colors.charcoalLight,
        marginTop: spacing.xxs,
    },

    timestampUser: {
        color: "rgba(250,247,242,0.6)",
        textAlign: "right",
    },

    // Quick replies
    quickReplyRow: {
        flexDirection: "row",
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
    },

    // Browse add-ons button
    browseBtn: {
        ...componentStyles.buttonGold,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        marginTop: spacing.sm,
    },

    browseBtnText: {
        ...componentStyles.buttonGoldText,
    },

    // Free text input
    inputRow: {
        flexDirection: "row",
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
        alignItems: "flex-end",
    },

    chatInput: {
        ...componentStyles.input,
        flex: 1,
        maxHeight: 100,
        paddingTop: spacing.sm,
    },

    sendBtn: {
        backgroundColor: colors.creamMid,
        borderRadius: radii.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderWidth: 0.5,
        borderColor: colors.border,
    },

    sendBtnActive: {
        backgroundColor: colors.charcoal,
        borderColor: colors.charcoal,
    },

    sendBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.white,
    },
});
