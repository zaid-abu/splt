import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import * as icons from "lucide-react-native";
import { EmptyState, useUI } from "@/components/ui";
import { ListRowSkeleton } from "@/components/ui/Skeleton";

interface FriendsEmptyProps {
  isLoading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function FriendsEmpty({
  isLoading,
  hasActiveFilters,
  onClearFilters,
}: FriendsEmptyProps): React.JSX.Element {
  const { color, radius, space } = useUI();
  const router = useRouter();

  return (
    <View style={{ paddingHorizontal: space.page }}>
      {isLoading ? (
        <View style={{ paddingTop: 20 }}>
          {[1, 2, 3, 4].map((i) => (
            <ListRowSkeleton key={i} />
          ))}
        </View>
      ) : (
        <View style={{ marginTop: 20 }}>
          <View
            style={{
              borderRadius: radius.lg,
              padding: 24,
              backgroundColor: color.surface,
              borderWidth: 1,
              borderColor: color.border,
            }}
          >
            <EmptyState
              icon={icons.Users}
              title={
                hasActiveFilters ? "No friends match this view" : "Add the people you split with"
              }
              subtitle={
                hasActiveFilters
                  ? "Try a different name, email, or balance filter."
                  : "Friends and shared-group contacts will appear here with balances and recent activity."
              }
            />
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <Pressable
                accessibilityRole="button"
                onPress={hasActiveFilters ? onClearFilters : () => router.push("/friend/new")}
                style={({ pressed }) => ({
                  minHeight: 44,
                  paddingHorizontal: 18,
                  borderRadius: radius.pill,
                  backgroundColor: hasActiveFilters ? color.control : color.text,
                  borderWidth: 1,
                  borderColor: hasActiveFilters ? color.border : color.text,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 14,
                    color: hasActiveFilters ? color.text : color.textInverse,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {hasActiveFilters ? "Clear filters" : "Add friend"}
                </Typography>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
