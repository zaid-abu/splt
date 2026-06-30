import { Typography, PressableFeedback, Skeleton } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FocusAwareView } from "@/components/PageAnimator";

import { formatAmount } from "@/components/AmountDisplay";
import { useApp } from "@/context/AppContext";
import { AppUserAvatar } from "@/components/MemberAvatar";

export default function FriendsScreen(): JSX.Element {
  const router = useRouter();
  const { groups, currentUser, getUserBalances, preferredCurrency, isAppLoading } = useApp();
  const [search, setSearch] = useState("");

  const balances = getUserBalances();

  const uniqueFriends = useMemo(() => {
    const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
    return Array.from(new Map(allMembers.map((user) => [user.id, user])).values())
      .filter((user) => user.id !== currentUser.id);
  }, [groups, currentUser.id]);

  const filtered = search.trim()
    ? uniqueFriends.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : uniqueFriends;

  return (
    <FocusAwareView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top"]}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 mb-6">
          <Typography type="h1" className="font-black tracking-tight text-foreground text-[32px]">
            Friends
          </Typography>
          <PressableFeedback 
            className="w-12 h-12 rounded-full bg-primary items-center justify-center"
            onPress={() => router.push("/expense/new")}
          >
            <icons.Plus size={24} color="white" strokeWidth={3} />
          </PressableFeedback>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} className="px-6" contentContainerStyle={{ paddingBottom: 100 }}>
          
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
              <PressableFeedback onPress={() => setSearch("")} className="p-1 ml-2">
                <View className="w-5 h-5 rounded-full bg-secondary items-center justify-center">
                  <icons.X size={12} className="text-muted-foreground" strokeWidth={3} />
                </View>
              </PressableFeedback>
            )}
          </View>

          {/* List */}
          {filtered.length === 0 ? (
            <View className="mt-8 items-center justify-center p-8 bg-white rounded-[32px] border border-border border-dashed">
              <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center mb-4">
                <icons.Users size={32} className="text-primary" />
              </View>
              <Typography type="h3" className="font-bold text-foreground text-center mb-2">
                No friends found
              </Typography>
              <Typography type="body-sm" className="text-muted-foreground text-center">
                {search ? "Try a different search term" : "Add an expense with someone to see them here."}
              </Typography>
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
                    <PressableFeedback onPress={() => router.push(`/friend/${friend.id}`)}>
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
        </ScrollView>
      </SafeAreaView>
    </FocusAwareView>
  );
}
