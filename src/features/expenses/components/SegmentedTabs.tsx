import type { JSX } from "react";
import {  Pressable, View , Text } from "react-native";
import * as Haptics from "expo-haptics";
import { styles } from "@/features/expenses/utils/styles";

export function SegmentedTabs({
  value,
  onChange,
}: {
  value: "friends" | "groups";
  onChange: (value: "friends" | "groups") => void;
}): JSX.Element {
  return (
    <View style={styles.segmented}>
      {(["friends", "groups"] as const).map((tab) => {
        const active = value === tab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              onChange(tab);
            }}
            style={({ pressed }) => [
              styles.segment,
              active && styles.segmentActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {tab === "friends" ? "Friends" : "Groups"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
