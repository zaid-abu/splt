import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";

export interface MutationImpact {
  currentUserId: string;
  groupIds: string[];
  personIds: string[];
  expenseIds: string[];
  settlementIds: string[];
  recurringIds: string[];
  notifications: boolean;
}

function addUnique(acc: unknown[][], key: unknown[]): void {
  const serialized = JSON.stringify(key);
  if (!acc.some((existing) => JSON.stringify(existing) === serialized)) {
    acc.push(key);
  }
}

export async function invalidateAfterMutation(
  queryClient: QueryClient,
  impact: MutationImpact
): Promise<void> {
  const keys: unknown[][] = [];

  addUnique(keys, [...queryKeys.home(impact.currentUserId)]);
  addUnique(keys, [...queryKeys.circles(impact.currentUserId)]);
  addUnique(keys, [...queryKeys.openBalances(impact.currentUserId)]);
  addUnique(keys, [...queryKeys.expenses]);
  addUnique(keys, [...queryKeys.settlements]);
  addUnique(keys, [...queryKeys.activities]);

  for (const groupId of impact.groupIds) {
    addUnique(keys, [...queryKeys.groupSnapshot(groupId)]);
  }

  for (const personId of impact.personIds) {
    addUnique(keys, [...queryKeys.personSnapshot(personId)]);
  }

  for (const expenseId of impact.expenseIds) {
    addUnique(keys, [...queryKeys.expenseDetails(expenseId)]);
  }

  for (const settlementId of impact.settlementIds) {
    addUnique(keys, [...queryKeys.settlements]);
  }

  for (const recurringId of impact.recurringIds) {
    addUnique(keys, [...queryKeys.recurring.list(recurringId)]);
  }

  if (impact.notifications) {
    addUnique(keys, [...queryKeys.notifications(impact.currentUserId)]);
  }

  await Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
}
