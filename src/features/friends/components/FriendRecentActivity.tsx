import { View, Text } from "react-native";
import * as icons from "lucide-react-native";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
import { useUI } from "@/components/ui";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Activity } from "@/types";

interface FriendRecentActivityProps {
  sharedActivities: Activity[];
}

export function FriendRecentActivity({
  sharedActivities,
}: FriendRecentActivityProps): React.JSX.Element {
  const { color } = useUI();
  const coral = useCoralColors();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(150).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      <View style={{ marginBottom: 28 }}>
        <Eyebrow style={{ marginTop: 0 }}>Recent Activity</Eyebrow>
        <View
          style={{
            backgroundColor: coral.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: coral.border,
            overflow: "hidden",
          }}
        >
          {sharedActivities.length === 0 ? (
            <View
              style={{
                paddingVertical: 36,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  backgroundColor: color.control,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: color.border,
                }}
              >
                <icons.Receipt size={24} color={color.text} strokeWidth={1.8} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  color: color.text,
                  fontFamily: "InstrumentSans_600SemiBold",
                  marginBottom: 8,
                }}
              >
                No shared activity
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: color.muted,
                  fontFamily: "InstrumentSans_500Medium",
                }}
              >
                Add an expense to get started
              </Text>
            </View>
          ) : (
            <>
              {sharedActivities.map((activity, idx) => (
                <View key={activity.id}>
                  {idx > 0 ? (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: color.borderSoft,
                        marginHorizontal: 14,
                      }}
                    />
                  ) : null}
                  <MoneyRow
                    title={activity.expense?.title ?? "Activity"}
                    subtitle={activity.user?.name ?? ""}
                    amount=""
                    rightElement={<icons.ChevronRight size={18} color={color.muted} />}
                  />
                </View>
              ))}
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
