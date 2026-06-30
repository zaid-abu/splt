import { Typography, PressableFeedback, Skeleton } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, TextInput, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";

import { FocusAwareView } from "@/components/PageAnimator";
import { formatAmount } from "@/components/AmountDisplay";
import { useApp } from "@/context/AppContext";
import { AppUserAvatar } from "@/components/MemberAvatar";

export default function FriendsScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groups, currentUser, getUserBalances, preferredCurrency, isAppLoading } = useApp();
  
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const balances = getUserBalances();

  const uniqueFriends = useMemo(() => {
    const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
    return Array.from(new Map(allMembers.map((user) => [user.id, user])).values())
      .filter((user) => user.id !== currentUser.id);
  }, [groups, currentUser.id]);

  const filtered = search.trim()
    ? uniqueFriends.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : uniqueFriends;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1000);
  }, []);

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: '#F2F2F6' }}>
      <StatusBar style="dark" />
      
      {/* ── Sticky Blurred Header ───────────────────── */}
      <BlurView 
        intensity={100} 
        tint="light" 
        style={{ 
          paddingTop: insets.top + 16, 
          paddingBottom: 16, 
          paddingHorizontal: 24,
          position: 'absolute',
          top: 0, left: 0, right: 0,
          zIndex: 50,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(242, 242, 246, 0.90)',
        }}
      >
        <Typography type="h1" className="font-black tracking-tight text-foreground text-[32px]">
          Friends
        </Typography>
        <PressableFeedback 
          className="w-12 h-12 rounded-full bg-primary items-center justify-center"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/expense/new");
          }}
        >
          <icons.Plus size={24} color="white" strokeWidth={3} />
        </PressableFeedback>
      </BlurView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingTop: insets.top + 90, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3D2B82" progressViewOffset={insets.top + 80} />
        }
      >
        <View className="px-6 mt-2">
          {/* Search */}
          <View className="bg-white h-[52px] rounded-[16px] flex-row items-center px-4 mb-6" style={{ borderWidth: 0 }}>
            <icons.Search size={20} className="text-primary mr-3" />
            <TextInput 
              value={search}
              onChangeText={setSearch}
              placeholder="Search friends…"
              className="flex-1 font-medium text-[16px] text-foreground h-full"
              placeholderTextColor="#8A8798"
            />
            {search.length > 0 && (
              <PressableFeedback onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearch("");
              }} className="p-1 ml-2">
                <View className="w-5 h-5 rounded-full bg-secondary items-center justify-center">
                  <icons.X size={12} className="text-muted-foreground" strokeWidth={3} />
                </View>
              </PressableFeedback>
            )}
          </View>

          {/* List */}
          {filtered.length === 0 ? (
            <View className="mt-8 items-center justify-center p-8 bg-white rounded-[32px] border border-border border-dashed">
              <View className="w-24 h-24 mb-4">
                <LottieView
                  source={require('@/assets/empty-state.json')}
                  autoPlay
                  loop
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
              <Typography type="h3" className="font-bold text-foreground text-center mb-2">
                No friends found
              </Typography>
              <Typography type="body-sm" className="text-muted-foreground text-center mb-6">
                {search ? "Try a different search term" : "Add an expense with someone to see them here."}
              </Typography>
              {!search && (
                <PressableFeedback 
                  className="bg-primary px-6 h-12 rounded-[16px] items-center justify-center flex-row gap-2"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/expense/new");
                  }}
                >
                  <icons.Plus size={20} color="white" />
                  <Typography type="body-sm" className="text-white font-bold">Add a friend</Typography>
                </PressableFeedback>
              )}
            </View>
          ) : (
            <View className="gap-2">
              {isAppLoading ? (
                <>
                  <Skeleton className="w-full h-[88px] rounded-[24px]" />
                  <Skeleton className="w-full h-[88px] rounded-[24px]" />
                  <Skeleton className="w-full h-[88px] rounded-[24px]" />
                </>
              ) : filtered.map((friend, index) => {
                const bal = balances.get(friend.id) || 0;
                const isPositive = bal > 0;
                const isNegative = bal < 0;
                
                return (
                  <FocusAwareView key={friend.id} delay={100 + index * 50}>
                    <PressableFeedback onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/friend/${friend.id}`);
                    }}>
                      <View className="flex-row items-center bg-white rounded-[24px] p-4 mb-2 border border-border">
                        <AppUserAvatar user={friend} size="lg" />
                        <View className="flex-1 ml-4">
                          <Typography type="h3" className="font-bold text-[18px] text-foreground mb-1">
                            {friend.name}
                          </Typography>
                          {bal === 0 ? (
                            <Typography type="body-sm" className="text-muted-foreground font-medium">Settled up</Typography>
                          ) : (
                            <Typography type="body-sm" className={`font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                              {isPositive ? 'Owes you ' : 'You owe '}
                              {formatAmount(Math.abs(bal), preferredCurrency.code)}
                            </Typography>
                          )}
                        </View>
                        <icons.ChevronRight size={20} color="#8A8798" />
                      </View>
                    </PressableFeedback>
                  </FocusAwareView>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </FocusAwareView>
  );
}
