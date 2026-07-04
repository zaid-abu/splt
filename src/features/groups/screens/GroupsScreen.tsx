/**
 * Groups Screen
 *
 * HeroUI components used:
 * - Button
 * - Card, Card.Body, Card.Title, Card.Description
 * - Surface
 * - Typography
 * - Chip
 */
import { Typography, Skeleton, Button, PressableFeedback } from "heroui-native";
import { useRouter } from "expo-router";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import type { JSX } from "react";
import { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { View, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as icons from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";

import { GroupCard } from "@/features/groups/components/GroupCard";
import { useAuth } from "@/context/AppContext";
import { useGroups } from "@/features/groups/queries/useGroups";
import type { Group } from "@/types";

export default function GroupsScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const { data: groups = [], isLoading } = useGroups(currentUser?.id);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : groups;

  const ListHeaderComponent = useCallback(
    () => (
      <View className="px-6 mb-6">
        <View className="flex-row items-center bg-white rounded-[16px] border border-border/50 h-[48px] px-4">
          <icons.Search size={20} color="#8A8798" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search your groups..."
            placeholderTextColor="#8A8798"
            className="flex-1 ml-2 font-medium text-foreground text-[16px]"
          />
          {search.length > 0 && (
            <PressableFeedback onPress={() => setSearch("")} hitSlop={8}>
              <icons.XCircle size={18} color="#8A8798" />
            </PressableFeedback>
          )}
        </View>
      </View>
    ),
    [search]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View className="px-6">
        {isLoading ? (
          <View className="bg-white rounded-[24px] border border-border/50 overflow-hidden">
            <View className="p-4 border-b border-border/50 flex-row items-center justify-between">
              <View className="flex-row items-center gap-4 flex-1">
                <Skeleton className="w-12 h-12 rounded-[16px]" />
                <View className="flex-1 gap-2">
                  <Skeleton className="w-3/4 h-5 rounded-full" />
                  <Skeleton className="w-1/3 h-3 rounded-full" />
                </View>
              </View>
            </View>
            <View className="p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-4 flex-1">
                <Skeleton className="w-12 h-12 rounded-[16px]" />
                <View className="flex-1 gap-2">
                  <Skeleton className="w-1/2 h-5 rounded-full" />
                  <Skeleton className="w-1/4 h-3 rounded-full" />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View className="mt-8 items-center justify-center p-8 bg-white rounded-[32px] border border-border border-dashed">
            <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center mb-4">
              <icons.Users size={32} className="text-primary" />
            </View>
            <Typography type="h3" className="font-bold text-foreground text-center mb-2">
              No groups found
            </Typography>
            <Typography type="body-sm" className="text-muted-foreground text-center">
              {search
                ? "Try a different search term"
                : "Create a group with friends to start splitting expenses easily."}
            </Typography>
            {!search && (
              <Button
                variant="primary"
                className="mt-6 rounded-full"
                onPress={() => router.push("/group/new")}
              >
                <icons.Plus size={18} color="white" strokeWidth={2.5} />
                <Button.Label className="font-bold">Create Group</Button.Label>
              </Button>
            )}
          </View>
        )}
      </View>
    ),
    [isLoading, search, router]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Group; index: number }) => {
      const isFirst = index === 0;
      const isLast = index === filtered.length - 1;

      return (
        <View className="px-6">
          <View
            className={`bg-white border-x border-border/50 overflow-hidden ${
              isFirst ? "rounded-t-[24px] border-t" : ""
            } ${isLast ? "rounded-b-[24px] border-b mb-6" : ""}`}
          >
            <GroupCard
              group={item}
              currentUserId={currentUser.id}
              index={index}
              isLast={isLast}
              onPress={() => router.push(`/group/${item.id}`)}
            />
          </View>
        </View>
      );
    },
    [currentUser.id, filtered.length, router]
  );

  return (
    <FocusAwareView style={{ flex: 1 }} className="bg-background">
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />

        {/* Header */}
        <BlurView
          intensity={100}
          tint="light"
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            paddingHorizontal: 24,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(242, 242, 246, 0.90)",
          }}
        >
          <Typography type="h1" className="font-black tracking-tight text-foreground text-[32px]">
            Groups
          </Typography>
          <Button
            variant="primary"
            isIconOnly
            className="w-12 h-12 rounded-full"
            onPress={() => router.push("/group/new")}
          >
            <icons.Plus size={24} color="white" strokeWidth={3} />
          </Button>
        </BlurView>

        <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 90 }}>
          <FlashList
            data={filtered}
            renderItem={renderItem}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            extraData={{ filteredLength: filtered.length }}
          />
        </View>
      </View>
    </FocusAwareView>
  );
}
