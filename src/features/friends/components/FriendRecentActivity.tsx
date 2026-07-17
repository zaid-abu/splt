import { View } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { GlassSection, GlassRow, useUI } from "@/components/ui";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Activity } from "@/types";

interface FriendRecentActivityProps {
  sharedActivities: Activity[];
}

export function FriendRecentActivity({
  sharedActivities,
}: FriendRecentActivityProps): React.JSX.Element {
  const { color } = useUI();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(150).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      <GlassSection title="Recent Activity">
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
            <Typography
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 8,
              }}
            >
              No shared activity
            </Typography>
            <Typography
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              Add an expense to get started
            </Typography>
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
                <GlassRow
                  title={activity.expense?.title ?? "Activity"}
                  subtitle={activity.user?.name ?? ""}
                  showChevron
                />
              </View>
            ))}
          </>
        )}
      </GlassSection>
    </Animated.View>
  );
}
