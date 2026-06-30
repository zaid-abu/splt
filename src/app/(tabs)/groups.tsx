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
import { SearchField, Typography, PressableFeedback, Skeleton } from "heroui-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FocusAwareView } from "@/components/PageAnimator";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";

import { GroupCard } from "@/components/GroupCard";
import { useApp } from "@/context/AppContext";

export default function GroupsScreen(): JSX.Element {
  const router = useRouter();
  const { groups, currentUser, isAppLoading } = useApp();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : groups;

  return (
    <FocusAwareView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top"]}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 mb-6">
          <Typography type="h1" className="font-black tracking-tight text-foreground text-[32px]">
            Groups
          </Typography>
          <PressableFeedback 
            className="w-12 h-12 rounded-full bg-primary items-center justify-center"
            onPress={() => router.push("/group/new")}
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
            <View className="gap-2 bg-white rounded-[24px] border border-border/50 overflow-hidden">
              {isAppLoading ? (
                <>
                  <View className="p-4 border-b border-border/50 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4 flex-1">
                      <Skeleton className="w-12 h-12 rounded-[16px]" />
                      <View className="flex-1 gap-2">
                        <Skeleton className="w-3/4 h-5 rounded-full" />
                        <Skeleton className="w-1/3 h-3 rounded-full" />
                      </View>
                    </View>
                  </View>
                  <View className="p-4 border-b border-border/50 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4 flex-1">
                      <Skeleton className="w-12 h-12 rounded-[16px]" />
                      <View className="flex-1 gap-2">
                        <Skeleton className="w-1/2 h-5 rounded-full" />
                        <Skeleton className="w-1/4 h-3 rounded-full" />
                      </View>
                    </View>
                  </View>
                </>
              ) : filtered.map((group, index) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  index={index}
                  currentUserId={currentUser.id}
                  onPress={() => router.push(`/group/${group.id}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </FocusAwareView>
  );
}
