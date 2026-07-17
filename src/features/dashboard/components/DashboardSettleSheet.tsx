import type { JSX } from "react";
import { forwardRef, useCallback } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUI } from "@/components/ui";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import type { User } from "@/types";

interface DashboardSettleSheetProps {
  owedUsers: User[];
  oweUsers: User[];
  perUserBalances: Map<string, number>;
  currencyCode: string;
  onSelect: (userId: string) => void;
}

export const DashboardSettleSheet = forwardRef<BottomSheetModal, DashboardSettleSheetProps>(
  ({ owedUsers, oweUsers, perUserBalances, currencyCode, onSelect }, ref) => {
    const { color, space } = useUI();
    const insets = useSafeAreaInsets();

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          opacity={0.4}
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: color.muted, width: 40 }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: space.page,
            paddingTop: 24,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
        >
          <Typography
            style={{
              fontSize: 22,
              color: color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
              marginBottom: 20,
            }}
          >
            Settle up
          </Typography>

          {owedUsers.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Typography
                style={{
                  fontSize: 13,
                  color: color.muted,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                }}
              >
                Collect from
              </Typography>
              {owedUsers.map((user) => (
                <Pressable
                  key={user.id}
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onSelect(user.id);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: pressed ? color.subtle : "transparent",
                    marginBottom: 4,
                  })}
                >
                  <AppUserAvatar user={user} size="sm" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typography
                      style={{
                        fontSize: 15,
                        color: color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {user.name}
                    </Typography>
                    <Typography
                      style={{
                        fontSize: 13,
                        color: color.success,
                        fontFamily: "IBMPlexSans_500Medium",
                        marginTop: 1,
                      }}
                    >
                      Owes you{" "}
                      {formatAmount(
                        Math.abs(perUserBalances.get(user.id) ?? 0),
                        currencyCode
                      )}
                    </Typography>
                  </View>
                  <icons.ChevronRight size={18} color={color.muted} strokeWidth={1.75} />
                </Pressable>
              ))}
            </View>
          )}

          {oweUsers.length > 0 && (
            <View>
              <Typography
                style={{
                  fontSize: 13,
                  color: color.muted,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                }}
              >
                Pay back
              </Typography>
              {oweUsers.map((user) => (
                <Pressable
                  key={user.id}
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onSelect(user.id);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: pressed ? color.subtle : "transparent",
                    marginBottom: 4,
                  })}
                >
                  <AppUserAvatar user={user} size="sm" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typography
                      style={{
                        fontSize: 15,
                        color: color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {user.name}
                    </Typography>
                    <Typography
                      style={{
                        fontSize: 13,
                        color: color.danger,
                        fontFamily: "IBMPlexSans_500Medium",
                        marginTop: 1,
                      }}
                    >
                      You owe{" "}
                      {formatAmount(
                        Math.abs(perUserBalances.get(user.id) ?? 0),
                        currencyCode
                      )}
                    </Typography>
                  </View>
                  <icons.ChevronRight size={18} color={color.muted} strokeWidth={1.75} />
                </Pressable>
              ))}
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

DashboardSettleSheet.displayName = "DashboardSettleSheet";
