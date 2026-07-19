export type RecurringFrequency = "weekly" | "monthly" | "yearly";

export type RecurringStatus = "active" | "paused";

export type RecurringSplitMethod = "equal" | "amount" | "percentage" | "shares";

export type OccurrenceStatus = "pending" | "generated" | "skipped" | "failed";

export interface RecurringSplitConfig {
  [userId: string]: number;
}

export interface RecurringExpense {
  id: string;
  groupId: string;
  createdBy: string;
  paidByUserId: string;
  title: string;
  amount: number | null;
  amountMinor?: number;
  currencyCode: string;
  splitMethod: RecurringSplitMethod;
  splitConfig: RecurringSplitConfig | null;
  frequency: RecurringFrequency;
  intervalValue: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  startDate: string;
  nextRunDate: string;
  reminderDaysBefore: number;
  autoPost: boolean;
  status: RecurringStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringOccurrence {
  id: string;
  recurringExpenseId: string;
  scheduledFor: string;
  expenseId: string | null;
  status: OccurrenceStatus;
  createdAt: string;
}

export interface RecurringFormValues {
  groupId: string;
  paidByUserId: string;
  title: string;
  amount: number | null;
  currencyCode: string;
  splitMethod: RecurringSplitMethod;
  splitConfig: RecurringSplitConfig | null;
  frequency: RecurringFrequency;
  intervalValue: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  startDate: string;
  reminderDaysBefore: number;
  autoPost: boolean;
  status: RecurringStatus;
}
