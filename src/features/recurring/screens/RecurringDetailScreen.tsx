import type { JSX } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Repeat, ChevronRight } from "lucide-react-native";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { MoneyRow } from "@/components/coral/MoneyRow";
import { Eyebrow } from "@/components/coral/Eyebrow";
import { CoralButton } from "@/components/coral/CoralButton";
import { useCoralColors } from "@/components/coral/useCoral";
import { EmptyState } from "@/components/coral/EmptyState";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useUI } from "@/components/ui";

import { useRecurringDetail } from "@/features/recurring/hooks/useRecurringDetail";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useAuth } from "@/context/AppContext";

export default function RecurringDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const coral = useCoralColors();
  const { color } = useUI();
  const { currentUser } = useAuth();
  const { data: groups = [] } = useGroups(currentUser?.id);

  const {
    recurring,
    occurrences,
    frequencyLabel,
    nextRunDateLabel,
    scheduleSummary,
    reminderLabel,
    isLoading,
    isError,
    isTogglingStatus,
    isReviewing,
    handleBack,
    handleToggleStatus,
    handleReviewOccurrence,
  } = useRecurringDetail(id);

  const group = groups.find((g) => g.id === recurring?.groupId);
  const groupName = group?.name ?? "";

  const amountLabel =
    recurring && recurring.amount != null
      ? formatAmount(recurring.amount, recurring.currencyCode)
      : "Variable";

  const statusLabel = recurring?.status === "active" ? "Active" : "Paused";
  const isActive = recurring?.status === "active";

  const summaryParts = [
    `Posts to ${groupName} ${scheduleSummary}`,
    recurring?.paidByUserId === currentUser?.id ? "You pay" : "Someone else pays",
    recurring?.splitMethod === "equal" ? "split equally" : "",
  ].filter(Boolean);

  const summary = summaryParts.join(". ") + ".";

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar
        title={recurring?.title ?? "Recurring"}
        onBack={() => handleBack()}
        rightElement={
          recurring ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/recurring/${id}/edit`);
              }}
              hitSlop={8}
            >
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 15,
                  color: coral.accent,
                }}
              >
                Edit
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={color.text} />
        </View>
      ) : isError || !recurring ? (
        <EmptyState
          visual={<Repeat size={48} color={coral.muted} strokeWidth={1.2} />}
          title="Couldn't load recurring expense"
          subtitle="Pull down to try again."
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: "center", marginTop: 24, marginBottom: 4 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: coral.accentSoft,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Repeat size={40} color={coral.muted} strokeWidth={1.4} />
            </View>
          </View>

          <LargeTitle style={{ textAlign: "center" }}>
            {amountLabel} {frequencyLabel.toLowerCase()}
          </LargeTitle>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 15,
              color: color.muted,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 10,
              paddingHorizontal: 8,
            }}
          >
            {summary}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignSelf: "center",
              marginBottom: 14,
              backgroundColor: isActive ? coral.positiveSoft : coral.negativeSoft,
              borderRadius: 9999,
              paddingHorizontal: 14,
              paddingVertical: 5,
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 13,
                color: isActive ? coral.positive : coral.negative,
              }}
            >
              {statusLabel}
            </Text>
          </View>

          <Eyebrow>Schedule</Eyebrow>

          <Pressable
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 52,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <View>
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: color.text,
                }}
              >
                Next expense
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 13,
                  color: color.muted,
                  marginTop: 3,
                }}
              >
                {nextRunDateLabel}
              </Text>
            </View>
            <ChevronRight size={20} color={color.muted} strokeWidth={1.5} />
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 52,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <View>
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: color.text,
                }}
              >
                Reminder
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 13,
                  color: color.muted,
                  marginTop: 3,
                }}
              >
                {reminderLabel}
              </Text>
            </View>
            <ChevronRight size={20} color={color.muted} strokeWidth={1.5} />
          </Pressable>

          <Pressable
            accessibilityRole="switch"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleToggleStatus();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 52,
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: color.text,
                }}
              >
                Post automatically
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 13,
                  color: color.muted,
                  marginTop: 3,
                }}
              >
                Create without review
              </Text>
            </View>
            <View
              style={{
                width: 51,
                height: 31,
                borderRadius: 9999,
                backgroundColor: recurring.autoPost ? coral.accent : color.border,
                justifyContent: "center",
                paddingHorizontal: 3,
              }}
            >
              <View
                style={{
                  width: 25,
                  height: 25,
                  borderRadius: 9999,
                  backgroundColor: color.textInverse,
                  alignSelf: recurring.autoPost ? "flex-end" : "flex-start",
                }}
              />
            </View>
          </Pressable>

          {occurrences && occurrences.length > 0 && (
            <>
              <Eyebrow>History</Eyebrow>
              {occurrences.map((occ) => {
                const dateStr = new Date(occ.scheduledFor).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const statusLabelMap: Record<string, string> = {
                  pending: "Due " + dateStr,
                  generated: "Posted " + dateStr,
                  skipped: "Skipped " + dateStr,
                  failed: "Failed " + dateStr,
                };
                const occLabel = statusLabelMap[occ.status] ?? `${occ.status} ${dateStr}`;
                const occTone =
                  occ.status === "generated"
                    ? "positive"
                    : occ.status === "failed"
                      ? "negative"
                      : "neutral";

                return (
                  <MoneyRow
                    key={occ.id}
                    title={occLabel}
                    amount=""
                    amountTone={occTone}
                    rightElement={
                      occ.status === "pending" ? (
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <CoralButton
                            label="Skip"
                            onPress={() => handleReviewOccurrence(occ.id, "skip")}
                            variant="text"
                            disabled={isReviewing}
                          />
                          <CoralButton
                            label="Generate"
                            onPress={() => handleReviewOccurrence(occ.id, "generate")}
                            variant="primary"
                            disabled={isReviewing}
                            loading={isReviewing}
                          />
                        </View>
                      ) : undefined
                    }
                  />
                );
              })}
            </>
          )}

          <View style={{ marginTop: 26, marginBottom: 40 }}>
            <CoralButton
              label={isActive ? "Pause recurring expense" : "Resume recurring expense"}
              onPress={() => handleToggleStatus()}
              variant="danger"
              disabled={isTogglingStatus}
              loading={isTogglingStatus}
            />
          </View>
        </ScrollView>
      )}
    </CoralScreen>
  );
}
