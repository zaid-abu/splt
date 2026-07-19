import { View, Text } from "react-native";
import { useCoralColors } from "./useCoral";

type StatItem = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
};

type StatPairProps = {
  left: StatItem;
  right: StatItem;
};

export function StatPair({ left, right }: StatPairProps) {
  const coral = useCoralColors();

  const renderStat = (stat: StatItem) => {
    const valueColor = {
      neutral: coral.foreground,
      positive: coral.positive,
      negative: coral.negative,
    }[stat.tone ?? "neutral"];

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: coral.surface,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <Text
          style={{
            fontFamily: "IBMPlexMono_600SemiBold",
            fontVariant: ["tabular-nums"],
            fontSize: 22,
            fontWeight: "600",
            color: valueColor,
          }}
        >
          {stat.value}
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            color: coral.muted,
            marginTop: 5,
          }}
        >
          {stat.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flexDirection: "row", gap: 12, marginVertical: 8 }}>
      {renderStat(left)}
      {renderStat(right)}
    </View>
  );
}
