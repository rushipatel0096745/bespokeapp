// // app/(tabs)/_layout.tsx
// import { Tabs } from "expo-router";
// import { colors, typography } from "../../theme/theme";

// export default function TabLayout() {
//     return (
//         <Tabs
//             screenOptions={{
//                 headerShown: false,
//                 tabBarStyle: {
//                     backgroundColor: colors.white,
//                     borderTopColor: colors.border,
//                     borderTopWidth: 0.5,
//                     elevation: 0, // Removes shadow on Android
//                     shadowColor: 'transparent', // Removes shadow on iOS
//                 },
//                 tabBarActiveTintColor: colors.charcoal,
//                 tabBarInactiveTintColor: colors.charcoalLight,
//                 tabBarLabelStyle: {
//                     fontFamily: typography.fonts.sansMedium,
//                     fontSize: typography.sizes.xxs,
//                 },
//             }}>
//             <Tabs.Screen name='index' options={{ title: "Home" }} />
//             <Tabs.Screen name='orders' options={{ title: "Orders" }} />
//             <Tabs.Screen name='community' options={{ title: "Community" }} />
//             <Tabs.Screen name='profile' options={{ title: "Profile" }} />
//         </Tabs>
//     );
// }

// app/(tabs)/_layout.tsx
// import { Tabs } from "expo-router";
// import { colors, typography } from "../../theme/theme";
// import { StyleSheet, Platform, ColorValue } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";

// type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// function tabIcon(name: IoniconsName, activeName: IoniconsName) {
//     return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
//         <Ionicons name={focused ? activeName : name} size={22} color={color} />
//     );
// }

// export default function TabLayout() {
//     return (
//         <Tabs
//             screenOptions={{
//                 headerShown: false,
//                 tabBarStyle: {
//                     backgroundColor: colors.white,
//                     // 1. Float and position the bar
//                     position: "absolute",
//                     bottom: Platform.OS === "ios" ? 24 : 16,
//                     left: 28,
//                     right: 28,
//                     marginHorizontal: 28,

//                     // 2. Shape and sizing
//                     height: 70,
//                     borderRadius: 32,

//                     // 3. Clean up existing borders
//                     borderTopWidth: 0,

//                     // 4. Add floating elevation shadow
//                     ...Platform.select({
//                         ios: {
//                             shadowColor: colors.charcoal,
//                             shadowOffset: { width: 0, height: 4 },
//                             shadowOpacity: 0.08,
//                             shadowRadius: 12,
//                         },
//                         android: {
//                             elevation: 8,
//                             shadowColor: colors.charcoal,
//                         },
//                     }),

//                     // 5. Keep touch ripples inside rounded corners
//                     // overflow: "hidden",
//                 },
//                 tabBarActiveTintColor: colors.charcoal,
//                 tabBarInactiveTintColor: colors.charcoalLight,
//                 // Adjust items inside the new larger height
//                 tabBarItemStyle: {
//                     paddingVertical: 8,
//                     // flex: 0,
//                     width: 70,
//                     height: 70
//                 },
//                 tabBarLabelStyle: {
//                     fontFamily: typography.fonts.sansMedium,
//                     fontSize: typography.sizes.xxs,
//                     marginBottom: 4,
//                 },
//             }}>
//             <Tabs.Screen
//                 name='index'
//                 options={{
//                     title: "Home",
//                     tabBarIcon: tabIcon("home-outline", "home"),
//                 }}
//             />
//             <Tabs.Screen
//                 name='orders'
//                 options={{
//                     title: "Orders",
//                     tabBarIcon: tabIcon("bag-outline", "bag"),
//                 }}
//             />
//             <Tabs.Screen
//                 name='community'
//                 options={{
//                     title: "Community",
//                     tabBarIcon: tabIcon("people-outline", "people"),
//                 }}
//             />
//             <Tabs.Screen
//                 name='profile'
//                 options={{
//                     title: "Profile",
//                     tabBarIcon: tabIcon("person-circle-outline", "person-circle"),
//                 }}
//             />
//         </Tabs>
//     );
// }

import { Tabs } from "expo-router";
import CustomTabBar from "../../components/layout/CustomTab";

export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}>
            <Tabs.Screen name='index' />
            {/* <Tabs.Screen name='add-ons' /> */}
            <Tabs.Screen name='orders' />
            <Tabs.Screen name='community' />
            <Tabs.Screen name='profile' />
        </Tabs>
    );
}
