import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import { colors, spacing, typography, componentStyles } from "@/theme/theme";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/services/profile";

const AGE_OPTIONS = [
    { label: "Expecting", value: "expecting" },
    { label: "Newborn", value: "newborn" },
    { label: "0–6 Months", value: "0-6_months" },
    { label: "6–12 Months", value: "6-12_months" },
    { label: "1 Year", value: "1_year" },
    { label: "2 Years", value: "2_years" },
    { label: "3 Years", value: "3_years" },
    { label: "4+ Years", value: "4+_years" },
] as const;

export default function OnboardingScreen() {
    const { user, refreshProfile } = useAuth();

    const [customerType, setCustomerType] = useState<"new" | "existing" | null>(null);

    const [age, setAge] = useState<string | null>(null);

    const [purpose, setPurpose] = useState<"order" | "community" | "both" | null>(null);

    const [loading, setLoading] = useState(false);

    const canContinue = customerType && age && purpose;

    async function handleFinish() {
        if (!user) return;

        try {
            setLoading(true);

            await updateProfile(user.id, {
                customer_type: customerType!,
                youngest_child_age: age as any,
                purpose: purpose!,
                completed_onboarding: true,
            });

            await refreshProfile();

            router.replace("/");
        } catch (error: any) {
            Alert.alert("Something went wrong", error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <Text style={styles.title}>Welcome to Modern Mum Co</Text>

                <Text style={styles.subtitle}>Just a few questions so we can personalise your experience.</Text>

                {/* Customer Type */}

                <Text style={styles.question}>Are you a new or existing customer?</Text>

                <View style={styles.row}>
                    <Option label='New' selected={customerType === "new"} onPress={() => setCustomerType("new")} />

                    <Option
                        label='Existing'
                        selected={customerType === "existing"}
                        onPress={() => setCustomerType("existing")}
                    />
                </View>

                {/* Age */}

                <Text style={styles.question}>How old is your youngest child?</Text>

                <View style={styles.wrap}>
                    {AGE_OPTIONS.map((item) => (
                        <Option
                            key={item.value}
                            label={item.label}
                            selected={age === item.value}
                            onPress={() => setAge(item.value)}
                        />
                    ))}
                </View>

                {/* Purpose */}

                <Text style={styles.question}>What brings you here?</Text>

                <View style={styles.wrap}>
                    <Option
                        label='Bespoke Foil Order'
                        selected={purpose === "order"}
                        onPress={() => setPurpose("order")}
                    />

                    <Option
                        label='Community'
                        selected={purpose === "community"}
                        onPress={() => setPurpose("community")}
                    />

                    <Option label='Both' selected={purpose === "both"} onPress={() => setPurpose("both")} />
                </View>

                <TouchableOpacity
                    disabled={!canContinue || loading}
                    onPress={handleFinish}
                    style={[
                        componentStyles.buttonGold,
                        styles.button,
                        (!canContinue || loading) && {
                            opacity: 0.5,
                        },
                    ]}>
                    <Text style={componentStyles.buttonGoldText}>{loading ? "Saving..." : "Finish"}</Text>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
}

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.option, selected && styles.selected]}>
            <Text style={[styles.optionText, selected && styles.selectedText]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.xl,
    },

    title: {
        fontSize: typography.sizes.xxxl,
        fontFamily: typography.fonts.sansBold,
        color: colors.charcoal,
    },

    subtitle: {
        marginTop: spacing.sm,
        marginBottom: spacing.xxxl,
        color: colors.charcoalLight,
        fontSize: typography.sizes.md,
    },

    question: {
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
    },

    row: {
        flexDirection: "row",
        gap: spacing.md,
    },

    wrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
    },

    option: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
    },

    selected: {
        backgroundColor: colors.gold,
        borderColor: colors.gold,
    },

    optionText: {
        color: colors.charcoal,
    },

    selectedText: {
        color: colors.charcoal,
        fontFamily: typography.fonts.sansBold,
    },

    button: {
        marginTop: spacing.xxxl,
    },
});
