import type { ExpenseCategory } from "@/types";

export type MoneySplitMethod = "equal" | "custom" | "percentage" | "shares";

export type MoneyContext =
  | { type: "group"; groupId: string; friendshipId?: never }
  | { type: "direct"; friendshipId: string; groupId?: never };

export interface SplitSource {
  userId: string;
  position: number;
  amountMinor?: number;
  percentageUnits?: number;
  shareUnits?: number;
}

export type SplitSourceValue = Partial<
  Pick<SplitSource, "amountMinor" | "percentageUnits" | "shareUnits">
>;

export interface OpenBalance {
  counterpartyId: string;
  context: MoneyContext;
  currency: string;
  signedAmountMinor: number;
  lastActivityAt: Date;
}

export interface ExpenseSplitInput {
  userId: string;
  amountMinor: number;
  percentageUnits?: number;
  shareUnits?: number;
  position: number;
}

export interface ExpenseMutationInput {
  clientOperationId: string;
  context: MoneyContext;
  title: string;
  amountMinor: number;
  currency: string;
  category: ExpenseCategory;
  paidBy: string;
  splitMethod: MoneySplitMethod;
  date: Date;
  notes?: string;
  receiptKey?: string;
  splits: ExpenseSplitInput[];
}

export type ReceiptMimeType = "image/jpeg" | "image/png" | "image/heic" | "application/pdf";

export interface SettlementMutationInput {
  clientOperationId: string;
  counterpartyId: string;
  context: MoneyContext;
  amountMinor: number;
  currency: string;
  method: "cash" | "bank_transfer" | "other";
  note?: string;
}
