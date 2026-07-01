import {
    View,
    Text,
    ScrollView,
    Image,
    Pressable,
    StyleSheet,
    Modal,
    FlatList,
    useWindowDimensions,
} from "react-native";
import React, { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useOrder } from "@/hooks/useOrder";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { colors, typography, spacing, radii, shadows } from "@/theme/theme";
import { OrderWorkflowStage, ORDER_STATUS } from "../(tabs)/orders"; // re-use from list screen
import { AddonOrdersSection } from "@/components/order/AddOnOrderSection";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderImage {
    id: string;
    image_url: string;
    image_type: string;
    sort_order: number;
}

interface OrderDetail {
    id: string;
    status: string;
    workflow_stage: OrderWorkflowStage;
    customer_name: string | null;
    baby_name: string;
    date_of_birth: string | null;
    print_type: "hand" | "foot" | "both";
    frame_colour_id: string | null;
    foil_colour_id: string | null;
    card_colour_id: string | null;
    special_instructions: string | null;
    submitted_at: string;
    kits: {
        id: string;
        name: string;
        description: string | null;
        includes_frame: boolean;
        includes_affirmation_card: boolean;
        includes_presentation_box: boolean;
    };
    order_images: OrderImage[];
}

// ─── Progress timeline config ─────────────────────────────────────────────────

type ProgressStatus = "done" | "active" | "pending";

const TIMELINE_STEPS: { stage: OrderWorkflowStage; label: string }[] = [
    { stage: "submitted", label: "Submitted" },
    { stage: "proof_pending", label: "Prints Received" },
    { stage: "proof_sent", label: "Proof Ready" },
    { stage: "changes_requested", label: "Changes Requested" },
    { stage: "approved", label: "Approved" },
    { stage: "foiling", label: "Foiling" },
    { stage: "dispatched", label: "Dispatched" },
    { stage: "completed", label: "Completed" },
];

const STAGE_ORDER: OrderWorkflowStage[] = TIMELINE_STEPS.map((s) => s.stage);

function getStepStatus(stepStage: OrderWorkflowStage, currentStage: OrderWorkflowStage): ProgressStatus {
    const stepIdx = STAGE_ORDER.indexOf(stepStage);
    const currentIdx = STAGE_ORDER.indexOf(currentStage);
    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "active";
    return "pending";
}

const PRINT_TYPE_LABELS: Record<string, string> = {
    hand: "Hand print only",
    foot: "Foot print only",
    both: "Hand & foot prints",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Divider() {
    return <View style={styles.divider} />;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ stage }: { stage: OrderWorkflowStage }) {
    const s = ORDER_STATUS[stage];
    return (
        <View style={[badge.root, { backgroundColor: s.background }]}>
            <View style={[badge.dot, { backgroundColor: s.dot }]} />
            <Text style={[badge.label, { color: s.color }]}>{s.label}</Text>
        </View>
    );
}

const badge = StyleSheet.create({
    root: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radii.full,
        gap: spacing.xs,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    label: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        letterSpacing: typography.letterSpacing.wide,
    },
});

// ─── Summary Row ──────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={summary.row}>
            <Text style={summary.label}>{label}</Text>
            <Text style={summary.value}>{value}</Text>
        </View>
    );
}

const summary = StyleSheet.create({
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    label: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoalLight,
        flex: 1,
    },
    value: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
        flex: 1,
        textAlign: "right",
    },
});

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineStep({ label, status, isLast }: { label: string; status: ProgressStatus; isLast: boolean }) {
    return (
        <View style={timeline.row}>
            {/* Left: connector line + icon */}
            <View style={timeline.iconCol}>
                <View
                    style={[
                        timeline.icon,
                        status === "done" && timeline.iconDone,
                        status === "active" && timeline.iconActive,
                        status === "pending" && timeline.iconPending,
                    ]}>
                    {status === "done" && <Text style={timeline.iconCheck}>✓</Text>}
                    {status === "active" && <View style={timeline.iconActiveDot} />}
                </View>
                {!isLast && <View style={[timeline.line, status === "done" && timeline.lineDone]} />}
            </View>

            {/* Right: label */}
            <Text
                style={[
                    timeline.label,
                    status === "done" && timeline.labelDone,
                    status === "active" && timeline.labelActive,
                    status === "pending" && timeline.labelPending,
                ]}>
                {label}
            </Text>
        </View>
    );
}

const ICON_SIZE = 28;
const LINE_WIDTH = 2;

const timeline = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
    },
    iconCol: {
        alignItems: "center",
        width: ICON_SIZE,
    },
    icon: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_SIZE / 2,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
    },
    iconDone: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    iconActive: {
        backgroundColor: colors.white,
        borderColor: colors.gold,
    },
    iconActiveDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.gold,
    },
    iconPending: {
        backgroundColor: colors.creamMid,
        borderColor: colors.border,
    },
    iconCheck: {
        color: colors.white,
        fontSize: typography.sizes.xs,
        fontFamily: typography.fonts.sansBold,
    },
    line: {
        width: LINE_WIDTH,
        flex: 1,
        minHeight: spacing.xl,
        backgroundColor: colors.border,
        marginVertical: 2,
    },
    lineDone: {
        backgroundColor: colors.success,
    },
    label: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        paddingTop: 4,
        paddingBottom: spacing.xl,
    },
    labelDone: { color: colors.charcoalLight },
    labelActive: { color: colors.charcoal, fontFamily: typography.fonts.sansBold },
    labelPending: { color: colors.border },
});

// ─── Image Viewer Modal ───────────────────────────────────────────────────────

function ImageViewer({
    images,
    initialIndex,
    onClose,
}: {
    images: OrderImage[];
    initialIndex: number;
    onClose: () => void;
}) {
    const { width, height } = useWindowDimensions();
    return (
        <Modal visible animationType='fade' onRequestClose={onClose} statusBarTranslucent>
            <View style={{ flex: 1, backgroundColor: "#000" }}>
                <FlatList
                    data={images}
                    horizontal
                    pagingEnabled
                    initialScrollIndex={initialIndex}
                    getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <Image source={{ uri: item.image_url }} style={{ width, height }} resizeMode='contain' />
                    )}
                />
                <Pressable style={viewer.closeBtn} onPress={onClose}>
                    <Text style={viewer.closeBtnText}>✕</Text>
                </Pressable>
            </View>
        </Modal>
    );
}

const viewer = StyleSheet.create({
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
    closeBtnText: {
        color: colors.white,
        fontSize: typography.sizes.base,
    },
});

// ─── Uploaded Prints ──────────────────────────────────────────────────────────

function UploadedPrints({ images }: { images: OrderImage[] }) {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);

    if (images.length === 0) return null;

    return (
        <>
            <View style={styles.section}>
                <SectionTitle>Uploaded Prints</SectionTitle>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={prints.row}>
                    {images.map((img, i) => (
                        <Pressable key={img.id} onPress={() => setViewerIndex(i)}>
                            <Image source={{ uri: img.image_url }} style={prints.thumb} />
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {viewerIndex !== null && (
                <ImageViewer images={images} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
            )}
        </>
    );
}

const prints = StyleSheet.create({
    row: {
        gap: spacing.sm,
        paddingVertical: spacing.xs,
    },
    thumb: {
        width: 88,
        height: 88,
        borderRadius: radii.lg,
        backgroundColor: colors.creamMid,
    },
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderDetailSkeleton() {
    return (
        <View style={styles.skeletonRoot}>
            {[
                ["70%", 20],
                ["40%", 14],
                ["50%", 14],
            ].map(([w, h], i) => (
                <View
                    key={i}
                    style={[styles.skeletonLine, { width: w as any, height: h as number, marginBottom: spacing.sm }]}
                />
            ))}
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OrderScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const { data: order, isLoading, isError } = useOrder(orderId);

    return (
        <ScreenWrapper scrollable header={<NavBar variant='back' title='Order Details' />}>
            {isLoading && <OrderDetailSkeleton />}

            {isError && (
                <View style={styles.centeredMsg}>
                    <Text style={styles.errorText}>Couldn't load this order.</Text>
                </View>
            )}

            {order && <OrderDetailContent order={order as OrderDetail} />}
        </ScreenWrapper>
    );
}

function OrderDetailContent({ order }: { order: OrderDetail }) {
    const router = useRouter();
    const kit = order.kits;

    const submittedDate = new Date(order.submitted_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const dob = order.date_of_birth
        ? new Date(order.date_of_birth).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : null;

    return (
        <View style={styles.body}>
            {/* ── 1. Header ── */}
            <View style={styles.section}>
                <Text style={styles.kitName}>{kit.name}</Text>
                <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                <View style={styles.headerMeta}>
                    <StatusBadge stage={order.workflow_stage} />
                    <Text style={styles.submittedDate}>Submitted {submittedDate}</Text>
                </View>
            </View>

            <Divider />

            {/* ── 2. Upload Summary ── */}
            <View style={styles.section}>
                <SectionTitle>Upload Summary</SectionTitle>
                <View style={styles.summaryTable}>
                    <SummaryRow label="Baby's name" value={order.baby_name} />
                    {dob && <SummaryRow label='Date of birth' value={dob} />}
                    <SummaryRow label='Print type' value={PRINT_TYPE_LABELS[order.print_type] ?? order.print_type} />
                    {/* Colour IDs — display as IDs until you join the colour tables */}
                    {order.foil_colour_id && <SummaryRow label='Foil colour' value='See selection' />}
                    {order.frame_colour_id && kit.includes_frame && (
                        <SummaryRow label='Frame colour' value='See selection' />
                    )}
                    {order.card_colour_id && kit.includes_affirmation_card && (
                        <SummaryRow label='Card colour' value='See selection' />
                    )}
                </View>
            </View>

            <Divider />

            {/* ── 3. Uploaded Prints ── */}
            <UploadedPrints images={order.order_images} />

            {order.order_images.length > 0 && <Divider />}

            {/* ── 4. Order Progress ── */}
            <View style={styles.section}>
                <SectionTitle>Order Progress</SectionTitle>
                <View style={styles.timeline}>
                    {TIMELINE_STEPS.map((step, i) => (
                        <TimelineStep
                            key={step.stage}
                            label={step.label}
                            status={getStepStatus(step.stage, order.workflow_stage)}
                            isLast={i === TIMELINE_STEPS.length - 1}
                        />
                    ))}
                </View>
            </View>

            {/* ── 5. Special Instructions (conditional) ── */}
            {!!order.special_instructions && (
                <>
                    <Divider />
                    <View style={styles.section}>
                        <SectionTitle>Special Instructions</SectionTitle>
                        <Text style={styles.instructions}>{order.special_instructions}</Text>
                    </View>
                </>
            )}

            <AddonOrdersSection orderId={order.id} />

            <Divider />

            {/* ── 6. CTA ── */}
            <View style={styles.ctaSection}>
                <Pressable
                    style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
                    onPress={() => router.push(`/orders/${order.id}/chat`)}>
                    <Text style={styles.ctaBtnText}>Open Conversation</Text>
                </Pressable>
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    body: {
        paddingBottom: spacing.xxxl,
    },
    section: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginHorizontal: spacing.lg,
    },

    // Header
    kitName: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xxl,
        color: colors.charcoal,
    },
    orderId: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        letterSpacing: typography.letterSpacing.wider,
    },
    headerMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginTop: spacing.xs,
        flexWrap: "wrap",
    },
    submittedDate: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
    },

    // Section title
    sectionTitle: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        letterSpacing: typography.letterSpacing.wide,
        textTransform: "uppercase",
        marginBottom: spacing.xs,
    },

    // Summary table
    summaryTable: {
        gap: 0,
    },

    // Timeline wrapper
    timeline: {
        paddingTop: spacing.xs,
    },

    // Instructions
    instructions: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoalMid,
        lineHeight: typography.sizes.base * 1.6,
        backgroundColor: colors.creamMid,
        padding: spacing.md,
        borderRadius: radii.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },

    // CTA
    ctaSection: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    ctaBtn: {
        backgroundColor: colors.charcoal,
        borderRadius: radii.md,
        paddingVertical: spacing.md,
        alignItems: "center",
        ...shadows.card,
    },
    ctaBtnPressed: {
        backgroundColor: colors.charcoalMid,
    },
    ctaBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.white,
        letterSpacing: typography.letterSpacing.wide,
    },

    // Skeleton
    skeletonRoot: {
        padding: spacing.lg,
        paddingTop: spacing.xl,
    },
    skeletonLine: {
        backgroundColor: colors.creamMid,
        borderRadius: radii.sm,
    },

    // Error / loading states
    centeredMsg: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xxxl,
    },
    errorText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoalLight,
        textAlign: "center",
    },
});
