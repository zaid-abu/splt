import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useCoralColors } from "./useCoral";

type ContextBarProps = {
  title: string;
  backTo?: { label: string; route: string };
};

export function ContextBar({ title, backTo }: ContextBarProps) {
  const router = useRouter();
  const coral = useCoralColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
        paddingHorizontal: 20,
        backgroundColor: coral.surface,
        borderBottomWidth: 1,
        borderBottomColor: coral.border,
      }}
    >
      {backTo ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(backTo.route as any);
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            position: "absolute",
            left: 20,
          }}
        >
          <ChevronLeft size={14} color={coral.muted} strokeWidth={1.8} />
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 13,
              color: coral.muted,
            }}
          >
            {backTo.label}
          </Text>
        </Pressable>
      ) : null}
      <Text
        style={{
          fontFamily: "InstrumentSans_500Medium",
          fontSize: 12,
          color: coral.muted,
          letterSpacing: 0.02 * 12,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
    </View>
  );
}
