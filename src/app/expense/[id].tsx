/**
 * Expense Detail Screen
 *
 * HeroUI components used:
 * - Button
 * - Card, Card.Body, Card.Header, Card.Title, Card.Description
 * - Chip
 * - Dialog + all sub-components (Dialog.Trigger, Dialog.Portal, Dialog.Overlay,
 *     Dialog.Content, Dialog.Close, Dialog.Title, Dialog.Description)
 * - ListGroup + sub-components
 * - Avatar, Avatar.Fallback
 * - Separator
 * - Typography
 * - Alert
 */
import {
  Alert,
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  ListGroup,
  Separator,
  Typography,
} from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppUserAvatar } from "@/components/MemberAvatar";
import { getCurrencySymbol } from "@/components/AmountDisplay";
import { useApp } from "@/context/AppContext";
import { EXPENSE_CATEGORIES } from "@/types";

export default function ExpenseDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getExpense, currentUser, getGroup } = useApp();

  const expense = getExpense(id ?? "");
  const group = getGroup(expense?.groupId ?? "");
  const category = EXPENSE_CATEGORIES.find((c) => c.key === expense?.category);

  if (!expense) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View className="flex-1 bg-background items-center justify-center px-5 gap-4">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Expense not found</Alert.Title>
              <Alert.Description>This expense may have been deleted.</Alert.Description>
            </Alert.Content>
          </Alert>
          <Button onPress={() => router.back()} variant="secondary">Go back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const sym = getCurrencySymbol(expense.currency);
  const isJPY = expense.currency === "JPY" || expense.currency === "KRW";
  const paidByMe = expense.paidBy === currentUser.id;
  const myShare = expense.splits.find((s) => s.userId === currentUser.id);

  const formatAmt = (n: number) =>
    `${sym}${n.toLocaleString("en-US", {
      minimumFractionDigits: isJPY ? 0 : 2,
      maximumFractionDigits: isJPY ? 0 : 2,
    })}`;

  const metaRows = [
    {
      label: "Date",
      value: expense.date.toLocaleDateString("en-US", {
        weekday: "short", year: "numeric", month: "long", day: "numeric",
      }),
    },
    {
      label: "Group",
      value: group ? `${group.name}` : "—",
    },
    {
      label: "Split",
      value: expense.splitMethod.charAt(0).toUpperCase() + expense.splitMethod.slice(1),
    },
    ...(expense.notes ? [{ label: "Notes", value: expense.notes }] : []),
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header row ─────────────────────────────── */}
        <View className="flex-row items-center justify-between pt-4 mb-6">
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            ← Back
          </Button>

          {/* Delete — Dialog.Trigger wraps the button */}
          <Dialog>
            <Dialog.Trigger asChild>
              <Button variant="danger-soft" size="sm" isIconOnly>🗑</Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay />
              <Dialog.Content>
                <Dialog.Close />
                <Dialog.Title>Delete Expense</Dialog.Title>
                <Dialog.Description>
                  Are you sure you want to delete &quot;{expense.title}&quot;? This cannot be undone.
                </Dialog.Description>
                <View className="flex-row gap-3 mt-4">
                  <Dialog.Close asChild>
                    <Button variant="secondary" className="flex-1">Cancel</Button>
                  </Dialog.Close>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onPress={() => router.back()}
                  >
                    Delete
                  </Button>
                </View>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
        </View>

        {/* ── Hero ─────────────────────────────────────── */}
        <Card className="mb-5">
          <Card.Body className="items-center gap-3 py-6">
            <View className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 items-center justify-center">
              <Text style={{ fontSize: 40 }}>{category?.icon ?? "📦"}</Text>
            </View>
            <Card.Title className="text-2xl text-center">{expense.title}</Card.Title>
            <Typography type="h1" className="text-accent font-black">
              {formatAmt(expense.amount)}
            </Typography>
            <View className="flex-row flex-wrap gap-2 justify-center">
              <Chip variant="soft">{category?.label}</Chip>
              <Chip variant="soft">{expense.currency}</Chip>
              <Chip color={paidByMe ? "success" : "danger"} variant="soft">
                {paidByMe ? "You paid" : `${expense.paidByUser.name.split(" ")[0]} paid`}
              </Chip>
            </View>
          </Card.Body>
        </Card>

        {/* ── Meta info ─────────────────────────────────── */}
        <Typography type="body" className="font-bold mb-3">Details</Typography>
        <ListGroup className="mb-5">
          {metaRows.map((row, idx) => (
            <View key={row.label}>
              <ListGroup.Item>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle className="text-muted font-normal text-sm">
                    {row.label}
                  </ListGroup.ItemTitle>
                  <ListGroup.ItemDescription className="text-foreground font-medium mt-0.5">
                    {row.value}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
              </ListGroup.Item>
              {idx < metaRows.length - 1 && <Separator className="mx-4" />}
            </View>
          ))}
        </ListGroup>

        {/* ── Split breakdown ────────────────────────────── */}
        <Typography type="body" className="font-bold mb-3">Split Breakdown</Typography>
        <ListGroup className="mb-5">
          {expense.splits.map((split, idx) => (
            <View key={split.userId}>
              <ListGroup.Item>
                <ListGroup.ItemPrefix>
                  <AppUserAvatar user={split.user} size="md" />
                </ListGroup.ItemPrefix>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>
                    {split.userId === currentUser.id ? "You" : split.user.name}
                    {split.userId === expense.paidBy && (
                      <Typography type="body-xs" className="text-accent"> (paid)</Typography>
                    )}
                  </ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>
                    {split.paid
                      ? split.userId === expense.paidBy ? "Paid for group" : "Paid back ✓"
                      : "Owes"}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <Typography
                    type="body-sm"
                    className={`font-bold ${split.paid ? "text-success" : "text-danger"}`}
                  >
                    {formatAmt(split.amount)}
                  </Typography>
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
              {idx < expense.splits.length - 1 && <Separator className="mx-4" />}
            </View>
          ))}
        </ListGroup>

        {/* ── My share summary ──────────────────────────── */}
        {myShare && (
          <Alert status={paidByMe ? "success" : "default"}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {paidByMe ? `You paid ${formatAmt(expense.amount)}` : `You owe ${formatAmt(myShare.amount)}`}
              </Alert.Title>
              {paidByMe && (
                <Alert.Description>
                  Your share is {formatAmt(myShare.amount)} · others owe you the rest
                </Alert.Description>
              )}
            </Alert.Content>
          </Alert>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
