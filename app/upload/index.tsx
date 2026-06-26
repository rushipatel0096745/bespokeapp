import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { colors, typography, spacing } from "../../theme/theme";
import ScreenWrapper from "../../components/layout/ScreenWrapper";
import NavBar from "../../components/layout/NavBar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

// ─── Screen ───────────────────────────────────────────────────────────────────
//
// NavBar variant="back" — NavBar.tsx calls router.back() automatically.
// No manual back button logic needed in this screen.
//
// ─────────────────────────────────────────────────────────────────────────────

export default function UploadScreen() {
    return (
        <ScreenWrapper scrollable>
            {/* 
                variant="back"  → shows ‹ chevron, calls router.back() on tap
                title           → centred screen title
                No rightElement → right slot stays empty
            */}
            <NavBar variant='back' title='Upload prints' />

            <View style={styles.body}>
                <Text style={styles.heading}>Tell us about your prints</Text>
                <Text style={styles.subheading}>
                    We'll create your proof in 1–2 working days and notify you when it's ready.
                </Text>

                <Input label="Baby's name" placeholder='e.g. Ava' autoCapitalize='words' returnKeyType='next' />

                {/* More form fields go here — wire to useUploadForm hook */}

                <Button
                    label='Submit upload'
                    variant='gold'
                    fullWidth
                    onPress={() => {
                        // router.replace("/upload/confirmation")
                    }}
                    style={styles.submitBtn}
                />
            </View>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    body: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        gap: spacing.md,
    },
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
    submitBtn: {
        marginTop: spacing.sm,
    },
});
