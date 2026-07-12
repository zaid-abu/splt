import type { JSX } from "react";
import { useCallback, useMemo } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { UI } from "@/components/ui/native-ui";
import type { User } from "@/types";

export interface SettleUpSheetProps {
  sheetRef: React.RefObject<BottomSheetModal>;
  currentUserId: string;
  friends: User[];
  perUserBalances: Map<string, number>;
  preferredCurrency: { code: string };
}

export function SettleUpSheet({
  sheetRef,
  currentUserId,
  friends,
  perUserBalances,
  preferredCurrency,
}: SettleUpSheetProps): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const owedUsers = useMemo(() => {
    return friends
      .filter((u) => u.id !== currentUserId && (perUserBalances.get(u.id) ?? 0) > 0)
      .slice(0, 4);
  }, [friends, currentUserId, perUserBalances]);

  const oweUsers = useMemo(() => {
    return friends
      .filter((u) => u.id !== currentUserId && (perUserBalances.get(u.id) ?? 0) < 0)
      .slice(0, 4);
  }, [friends, currentUserId, perUserBalances]);

  const renderSettleBackdrop = useCallback(
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
      ref={sheetRef}
      index={0}
      enableDynamicSizing
      backdropComponent={renderSettleBackdrop}
      backgroundStyle={{ backgroundColor: UI.color.bg, borderRadius: 0 }}
      handleIndicatorStyle={{ backgroundColor: UI.color.muted, width: 40 }}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: UI.space.page,
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        <Typography
          style={{
            fontSize: 22,
            color: UI.color.text,
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
                color: UI.color.muted,
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
                  sheetRef.current?.dismiss();
                  router.push(`/settle/${user.id}`);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: pressed ? UI.color.subtle : "transparent",
                  marginBottom: 4,
                })}
              >
                <AppUserAvatar user={user} size="sm" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography
                    style={{
                      fontSize: 15,
                      color: UI.color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 13,
                      color: UI.color.success,
                      fontFamily: "IBMPlexSans_500Medium",
                      marginTop: 1,
                    }}
                  >
                    Owes you{" "}
                    {formatAmount(
                      Math.abs(perUserBalances.get(user.id) ?? 0),
                      preferredCurrency.code
                    )}
                  </Typography>
                </View>
                <icons.ChevronRight size={18} color={UI.color.muted} strokeWidth={1.75} />
              </Pressable>
            ))}
          </View>
        )}

        {oweUsers.length > 0 && (
          <View>
            <Typography
              style={{
                fontSize: 13,
                color: UI.color.muted,
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
                  sheetRef.current?.dismiss();
                  router.push(`/settle/${user.id}`);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: pressed ? UI.color.subtle : "transparent",
                  marginBottom: 4,
                })}
              >
                <AppUserAvatar user={user} size="sm" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography
                    style={{
                      fontSize: 15,
                      color: UI.color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 13,
                      color: UI.color.danger,
                      fontFamily: "IBMPlexSans_500Medium",
                      marginTop: 1,
                    }}
                  >
                    You owe{" "}
                    {formatAmount(
                      Math.abs(perUserBalances.get(user.id) ?? 0),
                      preferredCurrency.code
                    )}
                  </Typography>
                </View>
                <icons.ChevronRight size={18} color={UI.color.muted} strokeWidth={1.75} />
              </Pressable>
            ))}
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
