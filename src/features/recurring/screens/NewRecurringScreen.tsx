import type { JSX } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralField } from "@/components/coral/CoralField";
import { CoralSegment } from "@/components/coral/CoralSegment";
import { CoralSelect, type SelectOption } from "@/components/coral/CoralSelect";
import { CoralButton } from "@/components/coral/CoralButton";
import { useCoralColors } from "@/components/coral/useCoral";
import { useUI } from "@/components/ui";

import { useRecurringForm } from "@/features/recurring/hooks/useRecurringForm";
import { useAuth } from "@/context/AppContext";
import { CURRENCIES } from "@/types";

const FREQUENCY_OPTIONS = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const SPLIT_METHOD_OPTIONS = [
  { label: "Equal", value: "equal" },
  { label: "Amount", value: "amount" },
  { label: "Shares", value: "shares" },
];

const REMINDER_OPTIONS: SelectOption[] = [
  { label: "None", value: "0" },
  { label: "1 day", value: "1" },
  { label: "2 days", value: "2" },
  { label: "3 days", value: "3" },
  { label: "1 week", value: "7" },
];

const DAYS_OF_WEEK_OPTIONS: SelectOption[] = [
  { label: "Sunday", value: "0" },
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
];

const DAY_OF_MONTH_OPTIONS: SelectOption[] = Array.from({ length: 31 }, (_, i) => ({
  label: `${i + 1}`,
  value: `${i + 1}`,
}));

const AUTO_POST_OPTIONS = [
  { label: "Auto-post", value: "on" },
  { label: "Review-only", value: "off" },
];

export default function NewRecurringScreen(): JSX.Element {
  const { groupId: initialGroupId, id: editId } = useLocalSearchParams<{
    groupId?: string;
    id?: string;
  }>();
  const router = useRouter();
  const coral = useCoralColors();
  const { color } = useUI();
  const { currentUser } = useAuth();

  const {
    mode,
    groups,
    selectedGroup,
    isLoadingGroups,
    isLoadingRecurring,
    isSubmitting,
    formValues,
    formErrors,
    setField,
    handleGroupSelect,
    handleMemberSelect,
    handleBack,
    handleSubmit,
  } = useRecurringForm(editId, initialGroupId);

  const isLoading = mode === "edit" ? isLoadingRecurring || isLoadingGroups : isLoadingGroups;

  const onSubmit = async () => {
    const success = await handleSubmit();
    if (success) {
      router.back();
    }
  };

  const currencyOptions: SelectOption[] = CURRENCIES.map((c) => ({
    label: `${c.symbol} ${c.code}`,
    value: c.code,
  }));

  const groupOptions: SelectOption[] = groups.map((g) => ({
    label: g.name,
    value: g.id,
  }));

  const paidByOptions: SelectOption[] = selectedGroup
    ? selectedGroup.members.map((m) => ({
        label: m.user.name,
        value: m.userId,
      }))
    : [];

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar
        title={mode === "create" ? "Add recurring" : "Edit recurring"}
        onBack={() => handleBack()}
      />

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <ActivityIndicator size="large" color={color.text} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <CoralField
            label="Title"
            placeholder="e.g. Monthly rent"
            value={formValues.title}
            onChangeText={(text) => setField("title", text)}
            error={formErrors.title}
          />

          <View style={{ marginTop: 18 }}>
            <CoralField
              label="Amount (leave empty if variable)"
              placeholder="0.00"
              value={formValues.amount?.toString() ?? ""}
              onChangeText={(text) => {
                const num = text === "" ? null : parseFloat(text);
                setField("amount", isNaN(num as number) ? null : num);
              }}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={{ marginTop: 18 }}>
            <CoralSelect
              label="Currency"
              options={currencyOptions}
              value={formValues.currencyCode}
              onValueChange={(value) => setField("currencyCode", value)}
              placeholder="Select currency"
            />
          </View>

          <View style={{ marginTop: 18 }}>
            <CoralSelect
              label="Group"
              options={groupOptions}
              value={formValues.groupId ?? undefined}
              onValueChange={(value) => handleGroupSelect(value)}
              placeholder="Select a group"
            />
            {formErrors.groupId ? (
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 12,
                  color: coral.negative,
                  marginTop: 5,
                }}
              >
                {formErrors.groupId}
              </Text>
            ) : null}
          </View>

          {selectedGroup && (
            <View style={{ marginTop: 18 }}>
              <CoralSelect
                label="Paid by"
                options={paidByOptions}
                value={formValues.paidByUserId ?? undefined}
                onValueChange={(value) => handleMemberSelect(value)}
                placeholder="Who paid?"
              />
              {formErrors.paidByUserId ? (
                <Text
                  style={{
                    fontFamily: "InstrumentSans_400Regular",
                    fontSize: 12,
                    color: coral.negative,
                    marginTop: 5,
                  }}
                >
                  {formErrors.paidByUserId}
                </Text>
              ) : null}
            </View>
          )}

          <View style={{ marginTop: 18 }}>
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 13,
                letterSpacing: 0.02 * 13,
                color: color.muted,
                marginBottom: 7,
              }}
            >
              Split method
            </Text>
            <CoralSegment
              options={SPLIT_METHOD_OPTIONS}
              selected={formValues.splitMethod}
              onSelect={(value) => setField("splitMethod", value as typeof formValues.splitMethod)}
            />
          </View>

          <View style={{ marginTop: 22 }}>
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 13,
                letterSpacing: 0.02 * 13,
                color: color.muted,
                marginBottom: 7,
              }}
            >
              Frequency
            </Text>
            <CoralSegment
              options={FREQUENCY_OPTIONS}
              selected={formValues.frequency}
              onSelect={(value) => setField("frequency", value as typeof formValues.frequency)}
            />
          </View>

          <View style={{ marginTop: 18 }}>
            <CoralField
              label="Interval"
              placeholder="1"
              value={formValues.intervalValue.toString()}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                setField("intervalValue", isNaN(num) || num < 1 ? 1 : num);
              }}
              keyboardType="number-pad"
              error={formErrors.intervalValue}
            />
          </View>

          {formValues.frequency === "weekly" && (
            <View style={{ marginTop: 18 }}>
              <CoralSelect
                label="Day of week"
                options={DAYS_OF_WEEK_OPTIONS}
                value={formValues.dayOfWeek?.toString() ?? undefined}
                onValueChange={(value) => setField("dayOfWeek", value ? parseInt(value, 10) : null)}
                placeholder="Any day"
              />
            </View>
          )}

          {(formValues.frequency === "monthly" || formValues.frequency === "yearly") && (
            <View style={{ marginTop: 18 }}>
              <CoralSelect
                label="Day of month"
                options={DAY_OF_MONTH_OPTIONS}
                value={formValues.dayOfMonth?.toString()}
                onValueChange={(value) => setField("dayOfMonth", value ? parseInt(value, 10) : 1)}
                placeholder="Select day"
              />
            </View>
          )}

          <View style={{ marginTop: 18 }}>
            <CoralField
              label="Start date"
              placeholder="YYYY-MM-DD"
              value={formValues.startDate}
              onChangeText={(text) => setField("startDate", text)}
              error={formErrors.startDate}
            />
          </View>

          <View style={{ marginTop: 18 }}>
            <CoralSelect
              label="Reminder days before"
              options={REMINDER_OPTIONS}
              value={formValues.reminderDaysBefore?.toString()}
              onValueChange={(value) =>
                setField("reminderDaysBefore", value ? parseInt(value, 10) : 0)
              }
              placeholder="None"
            />
          </View>

          <View style={{ marginTop: 18 }}>
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 13,
                letterSpacing: 0.02 * 13,
                color: color.muted,
                marginBottom: 7,
              }}
            >
              Auto-post
            </Text>
            <CoralSegment
              options={AUTO_POST_OPTIONS}
              selected={formValues.autoPost ? "on" : "off"}
              onSelect={(value) => setField("autoPost", value === "on")}
            />
          </View>

          <View style={{ marginTop: 28 }}>
            <CoralButton
              label={mode === "create" ? "Create" : "Update"}
              onPress={onSubmit}
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
            />
          </View>
        </ScrollView>
      )}
    </CoralScreen>
  );
}
