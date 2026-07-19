import type { Href } from "expo-router";
import type { RecurringExpense, RecurringOccurrence } from "@/types";

export interface ScheduleReadItem {
  id: string;
  recurringId: string;
  groupId: string;
  state: "needs-review" | "active" | "paused";
  scheduledDate: string;
  href: Href;
  title: string;
  nextDueLabel: string;
}

export interface RecurringReadInput {
  recurringExpenses: RecurringExpense[];
  occurrences: RecurringOccurrence[];
}

export interface ScheduleSections {
  needsReview: ScheduleReadItem[];
  active: ScheduleReadItem[];
  paused: ScheduleReadItem[];
}

function localDate(iso: string, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date(iso));
}

function recurringHref(recurringId: string): Href {
  return { pathname: "/recurring/[id]", params: { id: recurringId } } as Href;
}

export function buildScheduleSections(
  input: RecurringReadInput,
  timeZone: string
): ScheduleSections {
  const { recurringExpenses, occurrences } = input;

  const pendingRecurringIds = new Set<string>();
  for (const occ of occurrences) {
    if (occ.status === "pending") {
      pendingRecurringIds.add(occ.recurringExpenseId);
    }
  }

  const needsReview: ScheduleReadItem[] = [];
  const active: ScheduleReadItem[] = [];
  const paused: ScheduleReadItem[] = [];

  for (const occ of occurrences) {
    if (occ.status !== "pending") continue;
    const re = recurringExpenses.find((r) => r.id === occ.recurringExpenseId);
    if (!re) continue;
    needsReview.push({
      id: occ.id,
      recurringId: re.id,
      groupId: re.groupId,
      state: "needs-review",
      scheduledDate: occ.scheduledFor,
      href: recurringHref(re.id),
      title: re.title,
      nextDueLabel: new Date(occ.scheduledFor).toLocaleDateString(),
    });
  }

  for (const re of recurringExpenses) {
    if (re.status === "paused") {
      paused.push({
        id: re.id,
        recurringId: re.id,
        groupId: re.groupId,
        state: "paused",
        scheduledDate: re.nextRunDate,
        href: recurringHref(re.id),
        title: re.title,
        nextDueLabel: new Date(re.nextRunDate).toLocaleDateString(),
      });
    } else if (re.status === "active" && !pendingRecurringIds.has(re.id)) {
      active.push({
        id: re.id,
        recurringId: re.id,
        groupId: re.groupId,
        state: "active",
        scheduledDate: re.nextRunDate,
        href: recurringHref(re.id),
        title: re.title,
        nextDueLabel: new Date(re.nextRunDate).toLocaleDateString(),
      });
    }
  }

  function sortByDate(items: ScheduleReadItem[]): ScheduleReadItem[] {
    return [...items].sort((a, b) => {
      const dateA = localDate(a.scheduledDate, timeZone);
      const dateB = localDate(b.scheduledDate, timeZone);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return a.recurringId.localeCompare(b.recurringId);
    });
  }

  return {
    needsReview: sortByDate(needsReview),
    active: sortByDate(active),
    paused: sortByDate(paused),
  };
}

export function nextHomeScheduleItem(
  input: RecurringReadInput,
  timeZone: string
): ScheduleReadItem | null {
  const sections = buildScheduleSections(input, timeZone);
  const all = [...sections.needsReview, ...sections.active, ...sections.paused];
  if (all.length === 0) return null;

  return all.reduce((best, item) => {
    const bestDate = localDate(best.scheduledDate, timeZone);
    const itemDate = localDate(item.scheduledDate, timeZone);
    if (itemDate < bestDate) return item;
    if (itemDate > bestDate) return best;
    return item.recurringId < best.recurringId ? item : best;
  });
}
