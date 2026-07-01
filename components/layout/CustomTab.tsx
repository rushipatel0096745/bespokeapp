import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/theme";

const icons = {
    index: { active: "home", inactive: "home-outline" },
    orders: { active: "bag", inactive: "bag-outline" },
    community: { active: "people", inactive: "people-outline" },
    profile: { active: "person-circle", inactive: "person-circle-outline" },
} as const;

// ─── Inner component — hooks live here, never conditionally rendered ──────────

function TabBarInner({ state, navigation, isNestedScreen }: { state: any; navigation: any; isNestedScreen: boolean }) {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withTiming(isNestedScreen ? 100 : 0, { duration: 200 });
    }, [isNestedScreen]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: withTiming(isNestedScreen ? 0 : 1, { duration: 150 }),
    }));

    return (
        <Animated.View
            style={[styles.container, { bottom: Platform.OS === "ios" ? insets.bottom - 12 : 16 }, animatedStyle]}>
            {state.routes.map((route: any, index: number) => {
                const focused = state.index === index;
                const routeKey = route.name.split("/")[0];
                const icon = icons[routeKey as keyof typeof icons];

                return (
                    <Pressable key={route.key} style={styles.tab} onPress={() => navigation.navigate(route.name)}>
                        <View style={[styles.iconContainer, focused && styles.activeContainer]}>
                            <Ionicons
                                name={focused ? icon.active : icon.inactive}
                                size={24}
                                color={focused ? colors.charcoal : colors.charcoalLight}
                            />
                        </View>
                    </Pressable>
                );
            })}
        </Animated.View>
    );
}

// ─── Exported component — just computes isNestedScreen and delegates ──────────

export default function CustomTabBar(props: any) {
    const { state, navigation } = props;

    const activeRoute = state.routes[state.index];
    const nestedState = activeRoute?.state;
    const nestedIndex = nestedState?.index ?? 0;
    const isNestedScreen = nestedState !== undefined && nestedIndex > 0;

    return <TabBarInner state={state} navigation={navigation} isNestedScreen={isNestedScreen} />;
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",

        left: 20,
        right: 20,
        bottom: Platform.OS === "ios" ? 24 : 16,

        height: 72,

        borderRadius: 36,

        backgroundColor: colors.white,

        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        // shadowOpacity: 0.08,
        shadowOpacity: 0.25,
        shadowRadius: 14,

        elevation: 10,
    },

    tab: {
        flex: 1,
        height: "100%",

        justifyContent: "center",
        alignItems: "center",
    },

    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,

        justifyContent: "center",
        alignItems: "center",
    },

    activeContainer: {
        backgroundColor: "#F4F4F4",
    },
});

// import Ionicons from "@expo/vector-icons/Ionicons";
// import { Platform, Pressable, StyleSheet, View } from "react-native";
// import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { colors } from "../../theme/theme";
// import { useEffect } from "react";

// const icons = {
//     index: {
//         active: "home",
//         inactive: "home-outline",
//     },
//     orders: {
//         active: "bag",
//         inactive: "bag-outline",
//     },
//     community: {
//         active: "people",
//         inactive: "people-outline",
//     },
//     profile: {
//         active: "person-circle",
//         inactive: "person-circle-outline",
//     },
// } as const;

// export default function CustomTabBar(props: any) {
//     const { state, navigation } = props;
//     // console.log(state.routes.map((r: any) => r.name));
//     const insets = useSafeAreaInsets();

//     // Hide tab bar when any tab has a nested screen pushed on top
//     // state.routes[state.index].state tells us the nested stack state
//     const activeRoute = state.routes[state.index];
//     const nestedState = activeRoute?.state;
//     const nestedIndex = nestedState?.index ?? 0;
//     const isNestedScreen = nestedState !== undefined && nestedIndex > 0;
//     // const isNestedScreen = nestedIndex > 0;

//     const translateY = useSharedValue(0);

//     if (isNestedScreen) return null;

//     useEffect(() => {
//         translateY.value = withTiming(isNestedScreen ? 100 : 0, { duration: 200 });
//     }, [isNestedScreen]);

//     const animatedStyle = useAnimatedStyle(() => ({
//         transform: [{ translateY: translateY.value }],
//         opacity: withTiming(isNestedScreen ? 0 : 1, { duration: 150 }),
//     }));

//     return (
//         <View
//             style={[
//                 styles.container,
//                 {
//                     bottom: Platform.OS === "ios" ? insets.bottom : 16,
//                 },
//             ]}>
//             {state.routes.map((route: any, index: number) => {
//                 const focused = state.index === index;
//                 const routeKey = route.name.split("/")[0];

//                 const icon = icons[routeKey as keyof typeof icons];

//                 return (
//                     <Pressable key={route.key} style={styles.tab} onPress={() => navigation.navigate(route.name)}>
//                         <View style={[styles.iconContainer, focused && styles.activeContainer]}>
//                             <Ionicons
//                                 name={focused ? icon.active : icon.inactive}
//                                 size={24}
//                                 color={focused ? colors.charcoal : colors.charcoalLight}
//                             />
//                         </View>
//                     </Pressable>
//                 );
//             })}
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         position: "absolute",

//         left: 20,
//         right: 20,
//         bottom: Platform.OS === "ios" ? 24 : 16,

//         height: 72,

//         borderRadius: 36,

//         backgroundColor: colors.white,

//         flexDirection: "row",
//         justifyContent: "space-evenly",
//         alignItems: "center",

//         shadowColor: "#000",
//         shadowOffset: {
//             width: 0,
//             height: 6,
//         },
//         shadowOpacity: 0.08,
//         shadowRadius: 14,

//         elevation: 10,
//     },

//     tab: {
//         flex: 1,
//         height: "100%",

//         justifyContent: "center",
//         alignItems: "center",
//     },

//     iconContainer: {
//         width: 48,
//         height: 48,
//         borderRadius: 24,

//         justifyContent: "center",
//         alignItems: "center",
//     },

//     activeContainer: {
//         backgroundColor: "#F4F4F4",
//     },
// });

// // import React from "react";
// // import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
// // import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
// // import { useSafeAreaInsets } from "react-native-safe-area-context";
// // import Ionicons from "@expo/vector-icons/Ionicons";
// // import { colors } from "../../theme/theme";

// // const ICONS = {
// //     index: ["home-outline", "home"],
// //     orders: ["bag-outline", "bag"],
// //     community: ["people-outline", "people"],
// //     profile: ["person-circle-outline", "person-circle"],
// // } as const;

// // export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
// //     const insets = useSafeAreaInsets();

// //     return (
// //         <View
// //             style={[
// //                 styles.wrapper,
// //                 {
// //                     bottom: Platform.OS === "ios" ? insets.bottom + 12 : 16,
// //                 },
// //             ]}>
// //             {state.routes.map((route, index) => {
// //                 const focused = state.index === index;

// //                 const onPress = () => {
// //                     const event = navigation.emit({
// //                         type: "tabPress",
// //                         target: route.key,
// //                         canPreventDefault: true,
// //                     });

// //                     if (!focused && !event.defaultPrevented) {
// //                         navigation.navigate(route.name);
// //                     }
// //                 };

// //                 const onLongPress = () => {
// //                     navigation.emit({
// //                         type: "tabLongPress",
// //                         target: route.key,
// //                     });
// //                 };

// //                 const [inactive, active] = ICONS[route.name as keyof typeof ICONS];

// //                 return (
// //                     <TouchableOpacity
// //                         key={route.key}
// //                         accessibilityRole='button'
// //                         accessibilityState={focused ? { selected: true } : {}}
// //                         accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
// //                         testID={descriptors[route.key].options.tabBarButtonTestID}
// //                         onPress={onPress}
// //                         onLongPress={onLongPress}
// //                         activeOpacity={0.8}
// //                         style={styles.tab}>
// //                         <Ionicons
// //                             name={focused ? active : inactive}
// //                             size={26}
// //                             color={focused ? colors.charcoal : colors.charcoalLight}
// //                         />
// //                     </TouchableOpacity>
// //                 );
// //             })}
// //         </View>
// //     );
// // }

// // const styles = StyleSheet.create({
// //     wrapper: {
// //         position: "absolute",

// //         left: 24,
// //         right: 24,

// //         height: 68,
// //         borderRadius: 34,

// //         backgroundColor: colors.white,

// //         flexDirection: "row",
// //         justifyContent: "space-around",
// //         alignItems: "center",

// //         ...Platform.select({
// //             ios: {
// //                 shadowColor: "#000",
// //                 shadowOpacity: 0.08,
// //                 shadowRadius: 12,
// //                 shadowOffset: {
// //                     width: 0,
// //                     height: 4,
// //                 },
// //             },
// //             android: {
// //                 elevation: 10,
// //             },
// //         }),
// //     },

// //     tab: {
// //         width: 56,
// //         height: 56,

// //         justifyContent: "center",
// //         alignItems: "center",
// //     },
// // });
