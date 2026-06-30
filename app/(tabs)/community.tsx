import { View, Text } from "react-native";
import React from "react";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";

export default function community() {
    return (
        <ScreenWrapper
            scrollable={false}
            header={
                <>
                    <NavBar title='Community' showBackButton={false} />
                </>
            }>
            <Text>community</Text>
        </ScreenWrapper>
    );
}
