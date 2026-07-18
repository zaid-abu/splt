import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { useCoralColors } from "./useCoral";

type BalanceHeroProps = {
  label: string;
  value: string;
  note?: string;
  children?: ReactNode;
};

export function BalanceHero({ label, value, note, children }: BalanceHeroProps) {
  const coral = useCoralColors();

  return (
    <View
      style={{
        marginVertical: 18,
        padding: 22,
        backgroundColor: coral.balanceSurface,
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 150,
          height: 150,
          right: -55,
          top: -70,
          borderRadius: 9999,
          backgroundColor: coral.accent,
          opacity: 0.28,
        }}
      />
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 13,
          letterSpacing: 0.02 * 13,
          color: coral.balanceForeground,
          opacity: 0.72,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: "IBMPlexMono_600SemiBold",
          fontSize: 40,
          lineHeight: 40,
          letterSpacing: -0.015 * 40,
          fontWeight: "600",
          color: coral.balanceForeground,
          marginVertical: 9,
        }}
      >
        {value}
      </Text>
      {note ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 13,
            color: coral.balanceForeground,
            opacity: 0.76,
          }}
        >
          {note}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
