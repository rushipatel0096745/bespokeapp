// components/layout/Toast.tsx
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error";

type ToastState = {
    visible: boolean;
    message: string;
    type: ToastType;
};

type ToastContextValue = {
    showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const insets = useSafeAreaInsets();
    const [toast, setToast] = useState<ToastState>({ visible: false, message: "", type: "success" });
    const opacity = useRef(new Animated.Value(0)).current;
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback(
        (message: string, type: ToastType = "success") => {
            if (hideTimer.current) clearTimeout(hideTimer.current);

            setToast({ visible: true, message, type });
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();

            hideTimer.current = setTimeout(() => {
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => setToast((t) => ({ ...t, visible: false })));
            }, 2200);
        },
        [opacity]
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast.visible && (
                <Animated.View
                    pointerEvents='none'
                    style={[
                        styles.container,
                        { top: insets.top + 12, opacity },
                        toast.type === "error" ? styles.error : styles.success,
                    ]}>
                    <Text style={styles.text}>{toast.message}</Text>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within a ToastProvider");
    return ctx;
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 16,
        right: 16,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        zIndex: 999,
        elevation: 6,
    },
    success: {
        backgroundColor: "#1F2937",
    },
    error: {
        backgroundColor: "#B91C1C",
    },
    text: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "500",
        textAlign: "center",
    },
});
