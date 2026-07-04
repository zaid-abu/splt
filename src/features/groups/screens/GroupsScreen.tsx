/**
 * Groups Screen
 *
 * Flatter design (no shadows), smooth animations, strict reference alignment based on design.json
 */
import { Typography, Skeleton } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { View, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as icons from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { GroupCard } from "@/features/groups/components/GroupCard";
import { useAuth } from "@/context/AppContext";
import { useGroups } from "@/features/groups/queries/useGroups";
import type { Group } from "@/types";

// ─── Design Tokens ───
const BG = "#F7F6F1";
const SURFACE = "#FEFDFA";
const BORDER = "#E7E5DE";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6E6D68";
const TEXT_TERTIARY = "#9B9A94";
const CARD_RADIUS = 14;
const SECTION_PAD = 20;

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
      <View style={{ paddingHorizontal: SECTION_PAD, marginBottom: 24, marginTop: insets.top + 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <Typography
            style={{
              fontFamily: "DMSerifDisplay_400Regular",
              fontSize: 32,
              color: TEXT_PRIMARY,
              lineHeight: 40,
            }}
          >
            Groups.
          </Typography>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/group/new")}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 0,
              backgroundColor: "#8C7A6B",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <icons.Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#5D5C5A", // from surface.inputField
            borderRadius: CARD_RADIUS,
            height: 48,
            paddingHorizontal: 16,
          }}
        >
          <icons.Search size={18} color="rgba(255,255,255,0.6)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search your groups..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={{
              flex: 1,
              marginLeft: 12,
              fontFamily: "PlusJakartaSans_500Medium",
              color: "#FFFFFF",
              fontSize: 14,
            }}
          />
          {search.length > 0 && (
            <Pressable accessibilityRole="button" onPress={() => setSearch("")} hitSlop={8}>
              <icons.XCircle size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>
      </View>
    ),
    [search, insets.top, router]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={{ paddingHorizontal: SECTION_PAD }}>
        {isLoading ? (
          <View style={{ backgroundColor: SURFACE, borderRadius: CARD_RADIUS, overflow: "hidden", borderWidth: 1, borderColor: BORDER }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER, flexDirection: "row", alignItems: "center" }}>
              <Skeleton className="w-10 h-10 rounded-none mr-4" />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton className="w-3/4 h-4 rounded-[4px]" />
                <Skeleton className="w-1/3 h-3 rounded-[4px]" />
              </View>
            </View>
            <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
              <Skeleton className="w-10 h-10 rounded-none mr-4" />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton className="w-1/2 h-4 rounded-[4px]" />
                <Skeleton className="w-1/4 h-3 rounded-[4px]" />
              </View>
            </View>
          </View>
        ) : (
          <View
            style={{
              marginTop: 32,
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              backgroundColor: SURFACE,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: BORDER,
              borderStyle: "dashed",
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 0,
                backgroundColor: "#EFEEE9", // secondary background
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <icons.Users size={32} color={TEXT_PRIMARY} />
            </View>
            <Typography style={{ fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY, marginBottom: 8, fontFamily: "PlusJakartaSans_700Bold", textAlign: "center" }}>
              No groups found
            </Typography>
            <Typography style={{ fontSize: 14, color: TEXT_SECONDARY, textAlign: "center", fontFamily: "PlusJakartaSans_400Regular" }}>
              {search
                ? "Try a different search term"
                : "Create a group with friends to start splitting expenses easily."}
            </Typography>
            {!search && (
              <Pressable
                onPress={() => router.push("/group/new")}
                style={({ pressed }) => ({
                  marginTop: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#8C7A6B",
                  height: 48,
                  borderRadius: 0,
                  paddingHorizontal: 24,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <icons.Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Typography style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 15, fontFamily: "PlusJakartaSans_600SemiBold", marginLeft: 8 }}>
                  Create Group
                </Typography>
              </Pressable>
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
        <Animated.View layout={LinearTransition.springify()} style={{ paddingHorizontal: SECTION_PAD }}>
          <View
            style={{
              backgroundColor: SURFACE,
              overflow: "hidden",
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: BORDER,
              borderTopWidth: isFirst ? 1 : 0,
              borderBottomWidth: isLast ? 1 : 0,
              borderTopLeftRadius: isFirst ? CARD_RADIUS : 0,
              borderTopRightRadius: isFirst ? CARD_RADIUS : 0,
              borderBottomLeftRadius: isLast ? CARD_RADIUS : 0,
              borderBottomRightRadius: isLast ? CARD_RADIUS : 0,
              marginBottom: isLast ? 24 : 0,
            }}
          >
            <GroupCard
              group={item}
              currentUserId={currentUser.id}
              index={index}
              isLast={isLast}
              onPress={() => router.push(`/group/${item.id}`)}
            />
          </View>
        </Animated.View>
      );
    },
    [currentUser.id, filtered.length, router]
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={{ flex: 1 }}
      >
        <FlashList
          data={filtered}
          renderItem={renderItem}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          extraData={{ filteredLength: filtered.length }}
        />
      </Animated.View>
    </View>
  );
}
