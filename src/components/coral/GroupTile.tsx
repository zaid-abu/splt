import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { useCoralColors } from "./useCoral";

type GroupTileProps = {
  icon?: ReactNode;
  name: string;
  meta?: string;
  onPress?: () => void;
  balanceTone?: "positive" | "negative" | "neutral";
  style?: object;
};

export function GroupTile({
  icon,
  name,
  meta,
  onPress,
  balanceTone = "neutral",
  style,
}: GroupTileProps) {
  const coral = useCoralColors();

  const content = (
    <View
      style={[
        {
          minHeight: 160,
          borderWidth: 1,
          borderColor: coral.border,
          backgroundColor: coral.surface,
          borderRadius: 16,
          padding: 17,
          flexDirection: "column",
          alignItems: "flex-start",
        },
        style,
      ]}
    >
      {icon ? (
        <View style={{ flexDirection: "row", width: "100%" }}>
          <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            {icon}
          </View>
          {balanceTone !== "neutral" && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: balanceTone === "positive" ? coral.positive : coral.negative,
                alignSelf: "flex-start",
                marginTop: 6,
                marginLeft: "auto",
              }}
            />
          )}
        </View>
      ) : null}
      <Text
        numberOfLines={2}
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 17,
          color: coral.foreground,
          marginTop: "auto",
        }}
      >
        {name}
      </Text>
      {meta ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            color: coral.muted,
            marginTop: 5,
          }}
        >
          {meta}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}
