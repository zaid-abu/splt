import { View, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Typography, Skeleton } from "heroui-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { JSX } from "react";

import { useNotifications, AppNotification } from "@/features/notifications/queries/useNotifications";
import { useAuth } from "@/context/AppContext";
import { useAcceptFriend, useRejectFriend } from "@/features/friends/queries/useFriends";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";

export default function NotificationsScreen(): JSX.Element {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const { data: notifications = [], isLoading } = useNotifications(currentUser?.id);
  const { mutateAsync: acceptFriend, isPending: isAccepting } = useAcceptFriend();
  const { mutateAsync: rejectFriend, isPending: isRejecting } = useRejectFriend();

  const handleAccept = async (friendshipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await acceptFriend({ friendshipId });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReject = async (friendshipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await rejectFriend({ friendshipId });
  };

  const renderItem = ({ item, index }: { item: AppNotification; index: number }) => {
    if (item.type === "friend_request" && item.data) {
      const friendship = item.data;
      const isWorking = isAccepting || isRejecting;

      return (
        <Animated.View layout={LinearTransition} entering={FadeInDown.duration(400).delay(index * 50)}>
          <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <AppUserAvatar user={friendship.friendUser!} size="md" />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Typography style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                  {item.title}
                </Typography>
                <Typography style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", marginTop: 4 }}>
                  {item.subtitle}
                </Typography>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => handleAccept(friendship.id)}
                disabled={isWorking}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  backgroundColor: TEXT_PRIMARY,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed || isWorking ? 0.7 : 1,
                })}
              >
                {isAccepting ? <ActivityIndicator color="#FFF" /> : (
                  <Typography style={{ color: "#FFF", fontSize: 14, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold" }}>
                    Accept
                  </Typography>
                )}
              </Pressable>
              
              <Pressable
                onPress={() => handleReject(friendship.id)}
                disabled={isWorking}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: SEPARATOR,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed || isWorking ? 0.5 : 1,
                })}
              >
                {isRejecting ? <ActivityIndicator color={TEXT_PRIMARY} /> : (
                  <Typography style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold" }}>
                    Reject
                  </Typography>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>
      );
    }
    
    return null;
  };

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 44, height: 44, alignItems: "center", justifyContent: "center",
            backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR,
            opacity: pressed ? 0.5 : 1,
            marginRight: 16,
          })}
        >
          <icons.ArrowLeft size={20} color={TEXT_PRIMARY} />
        </Pressable>
        <Typography style={{ fontSize: 24, fontFamily: "DMSerifDisplay_400Regular", color: TEXT_PRIMARY }}>
          Notifications
        </Typography>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center", justifyContent: "center" }}>
            {isLoading ? (
              <ActivityIndicator size="large" color={TEXT_PRIMARY} />
            ) : (
              <>
                <icons.BellOff size={48} color={TEXT_SECONDARY} style={{ marginBottom: 16, opacity: 0.5 }} />
                <Typography style={{ fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", textAlign: "center" }}>
                  All caught up!
                </Typography>
                <Typography style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", textAlign: "center", marginTop: 8 }}>
                  You have no new notifications right now.
                </Typography>
              </>
            )}
          </View>
        }
      />
    </FocusAwareView>
  );
}
