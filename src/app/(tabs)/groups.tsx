/**
 * Groups Screen
 *
 * HeroUI components used:
 * - Button
 * - Card, Card.Body, Card.Title, Card.Description
 * - SearchField
 * - Surface
 * - Typography
 * - Chip
 */
import { SearchField, Typography, PressableFeedback } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";

import { GroupCard } from "@/components/GroupCard";
import { PageAnimator } from "@/components/PageAnimator";
import { formatAmount } from "@/components/AmountDisplay";
import { useApp } from "@/context/AppContext";

export default function GroupsScreen(): JSX.Element {
  const router = useRouter();
  const { groups, currentUser, getTotalOwedToMe, getTotalIOwe, preferredCurrency } = useApp();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : groups;

  const owedToMe = getTotalOwedToMe();
  const iOwe = Math.abs(getTotalIOwe());
  const sym = preferredCurrency.symbol;

  return (
    <PageAnimator>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top"]}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 mb-6">
          <Typography type="h1" className="font-black tracking-tight text-foreground text-[32px]">
            Groups
          </Typography>
          <PressableFeedback 
            className="w-12 h-12 rounded-full bg-primary items-center justify-center shadow-sm"
            onPress={() => router.push("/group/new")}
          >
            <icons.Plus size={24} color="white" strokeWidth={3} />
          </PressableFeedback>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} className="px-6" contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* Stats Row */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-border">
              <View className="w-10 h-10 rounded-full bg-success/10 items-center justify-center mb-3">
                <icons.ArrowDownLeft size={20} className="text-success" />
              </View>
              <Typography type="body-xs" className="text-muted-foreground font-semibold tracking-wider mb-1">
                OWED TO YOU
              </Typography>
              <Typography type="h2" className="font-black text-foreground text-[22px]">
                {formatAmount(owedToMe, preferredCurrency.code)}
              </Typography>
            </View>

            <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-border">
              <View className="w-10 h-10 rounded-full bg-danger/10 items-center justify-center mb-3">
                <icons.ArrowUpRight size={20} className="text-danger" />
              </View>
              <Typography type="body-xs" className="text-muted-foreground font-semibold tracking-wider mb-1">
                YOU OWE
              </Typography>
              <Typography type="h2" className="font-black text-foreground text-[22px]">
                {formatAmount(iOwe, preferredCurrency.code)}
              </Typography>
            </View>
          </View>

          {/* Search */}
          <View className="bg-white shadow-sm h-[52px] rounded-[16px] flex-row items-center px-4 mb-6" style={{ borderWidth: 0 }}>
            <icons.Search size={20} className="text-primary mr-3" />
            <TextInput 
              value={search}
              onChangeText={setSearch}
              placeholder="Search your groups…"
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
                No groups found
              </Typography>
              <Typography type="body-sm" className="text-muted-foreground text-center">
                {search ? "Try a different search term" : "Create a group with friends to start splitting expenses easily."}
              </Typography>
              {!search && (
                <PressableFeedback 
                  className="mt-6 bg-primary px-6 py-3 rounded-full flex-row items-center gap-2"
                  onPress={() => router.push("/group/new")}
                >
                  <icons.Plus size={18} color="white" strokeWidth={2.5} />
                  <Typography type="body" className="font-bold text-white">Create Group</Typography>
                </PressableFeedback>
              )}
            </View>
          ) : (
            <View className="gap-2">
              {filtered.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  currentUserId={currentUser.id}
                  onPress={() => router.push(`/group/${group.id}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </PageAnimator>
  );
}
