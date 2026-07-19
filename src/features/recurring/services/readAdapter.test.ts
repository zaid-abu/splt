import {
  buildScheduleSections,
  nextHomeScheduleItem,
  type ScheduleReadItem,
  type RecurringReadInput,
} from "./readAdapter";
import type { RecurringExpense, RecurringOccurrence } from "@/types";

const baseRecurring: RecurringExpense = {
  id: "re-1",
  groupId: "g-1",
  createdBy: "u-1",
  paidByUserId: "u-1",
  title: "Rent",
  amount: null,
  amountMinor: 120000,
  currencyCode: "USD",
  splitMethod: "equal",
  splitConfig: null,
  frequency: "monthly",
  intervalValue: 1,
  dayOfWeek: null,
  dayOfMonth: 1,
  startDate: "2026-01-01",
  nextRunDate: "2026-02-01T00:00:00Z",
  reminderDaysBefore: 3,
  autoPost: false,
  status: "active",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function makeRecurring(overrides: Partial<RecurringExpense>): RecurringExpense {
  return { ...baseRecurring, ...overrides };
}

function makeOccurrence(overrides: Partial<RecurringOccurrence>): RecurringOccurrence {
  return {
    id: "occ-default",
    recurringExpenseId: "re-1",
    scheduledFor: "2026-02-01T00:00:00Z",
    expenseId: null,
    status: "pending",
    createdAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

function itemHref(id: string) {
  return { pathname: "/recurring/[id]", params: { id } };
}

const TZ = "America/New_York";

describe("buildScheduleSections", () => {
  it("separates pending, active, and paused items", () => {
    const re1 = makeRecurring({
      id: "re-1",
      status: "active",
      nextRunDate: "2026-03-01T00:00:00Z",
    });
    const re2 = makeRecurring({
      id: "re-2",
      status: "active",
      nextRunDate: "2026-04-01T00:00:00Z",
    });
    const re3 = makeRecurring({
      id: "re-3",
      status: "paused",
      nextRunDate: "2026-05-01T00:00:00Z",
    });
    const occ = makeOccurrence({
      id: "occ-1",
      recurringExpenseId: "re-1",
      status: "pending",
      scheduledFor: "2026-02-15T00:00:00Z",
    });

    const input: RecurringReadInput = { recurringExpenses: [re1, re2, re3], occurrences: [occ] };
    const result = buildScheduleSections(input, TZ);

    expect(result.needsReview).toHaveLength(1);
    expect(result.needsReview[0].id).toBe("occ-1");
    expect(result.needsReview[0].state).toBe("needs-review");

    expect(result.active).toHaveLength(1);
    expect(result.active[0].id).toBe("re-2");
    expect(result.active[0].state).toBe("active");

    expect(result.paused).toHaveLength(1);
    expect(result.paused[0].id).toBe("re-3");
    expect(result.paused[0].state).toBe("paused");
  });

  it("returns empty sections for empty input", () => {
    const input: RecurringReadInput = { recurringExpenses: [], occurrences: [] };
    const result = buildScheduleSections(input, TZ);

    expect(result.needsReview).toEqual([]);
    expect(result.active).toEqual([]);
    expect(result.paused).toEqual([]);
  });

  it("excludes active recurrings that have pending occurrences", () => {
    const re = makeRecurring({ id: "re-1", status: "active" });
    const occ = makeOccurrence({ id: "occ-1", recurringExpenseId: "re-1", status: "pending" });

    const input: RecurringReadInput = { recurringExpenses: [re], occurrences: [occ] };
    const result = buildScheduleSections(input, TZ);

    expect(result.needsReview).toHaveLength(1);
    expect(result.active).toHaveLength(0);
  });

  it("includes active recurrings when no occurrences exist", () => {
    const re = makeRecurring({ id: "re-1", status: "active" });

    const input: RecurringReadInput = { recurringExpenses: [re], occurrences: [] };
    const result = buildScheduleSections(input, TZ);

    expect(result.needsReview).toHaveLength(0);
    expect(result.active).toHaveLength(1);
    expect(result.active[0].id).toBe("re-1");
  });

  it("handles non-pending occurrences without adding them to needs-review", () => {
    const re = makeRecurring({ id: "re-1", status: "active" });
    const occ = makeOccurrence({
      id: "occ-1",
      recurringExpenseId: "re-1",
      status: "generated",
    });

    const input: RecurringReadInput = { recurringExpenses: [re], occurrences: [occ] };
    const result = buildScheduleSections(input, TZ);

    expect(result.needsReview).toHaveLength(0);
    expect(result.active).toHaveLength(1);
  });

  it("sorts needs-review by date then recurring ID", () => {
    const reA = makeRecurring({ id: "a", status: "active", nextRunDate: "2026-03-01T00:00:00Z" });
    const reB = makeRecurring({ id: "b", status: "active", nextRunDate: "2026-03-01T00:00:00Z" });
    const occ1 = makeOccurrence({
      id: "occ-1",
      recurringExpenseId: "b",
      status: "pending",
      scheduledFor: "2026-02-01T00:00:00Z",
    });
    const occ2 = makeOccurrence({
      id: "occ-2",
      recurringExpenseId: "a",
      status: "pending",
      scheduledFor: "2026-03-01T00:00:00Z",
    });

    const input: RecurringReadInput = { recurringExpenses: [reA, reB], occurrences: [occ1, occ2] };
    const result = buildScheduleSections(input, TZ);

    expect(result.needsReview[0].id).toBe("occ-1");
    expect(result.needsReview[1].id).toBe("occ-2");
  });

  it("breaks date ties by recurring ID", () => {
    const reA = makeRecurring({ id: "a", status: "active", nextRunDate: "2026-03-01T00:00:00Z" });
    const reB = makeRecurring({ id: "b", status: "active", nextRunDate: "2026-03-01T00:00:00Z" });
    const occ1 = makeOccurrence({
      id: "occ-1",
      recurringExpenseId: "b",
      status: "pending",
      scheduledFor: "2026-03-01T00:00:00Z",
    });
    const occ2 = makeOccurrence({
      id: "occ-2",
      recurringExpenseId: "a",
      status: "pending",
      scheduledFor: "2026-03-01T00:00:00Z",
    });

    const input: RecurringReadInput = { recurringExpenses: [reA, reB], occurrences: [occ1, occ2] };
    const result = buildScheduleSections(input, TZ);

    expect(result.needsReview[0].id).toBe("occ-2");
    expect(result.needsReview[1].id).toBe("occ-1");
  });

  it("sets href to /recurring/[id] for all items", () => {
    const re = makeRecurring({ id: "re-1", status: "active", nextRunDate: "2026-03-01T00:00:00Z" });
    const rePaused = makeRecurring({
      id: "re-2",
      status: "paused",
      nextRunDate: "2026-03-01T00:00:00Z",
    });
    const occ = makeOccurrence({
      id: "occ-1",
      recurringExpenseId: "re-1",
      status: "pending",
      scheduledFor: "2026-02-01T00:00:00Z",
    });

    const input: RecurringReadInput = { recurringExpenses: [re, rePaused], occurrences: [occ] };
    const result = buildScheduleSections(input, TZ);

    for (const item of result.needsReview) {
      expect(item.href).toEqual(itemHref("re-1"));
    }
    for (const item of result.active) {
      expect(item.href).toEqual(itemHref("re-1"));
    }
    for (const item of result.paused) {
      expect(item.href).toEqual(itemHref("re-2"));
    }
  });

  it("skips occurrences whose recurring is not in the input", () => {
    const re = makeRecurring({ id: "re-1", status: "active" });
    const occ = makeOccurrence({
      id: "occ-1",
      recurringExpenseId: "re-999",
      status: "pending",
    });

    const input: RecurringReadInput = { recurringExpenses: [re], occurrences: [occ] };
    const result = buildScheduleSections(input, TZ);

    expect(result.needsReview).toHaveLength(0);
  });

  it("uses local date from the given timeZone for sorting", () => {
    const reA = makeRecurring({
      id: "a",
      status: "active",
      nextRunDate: "2026-01-02T01:00:00Z",
    });
    const reB = makeRecurring({
      id: "b",
      status: "active",
      nextRunDate: "2026-01-01T23:00:00Z",
    });

    const input: RecurringReadInput = {
      recurringExpenses: [reA, reB],
      occurrences: [],
    };

    const utcResult = buildScheduleSections(input, "UTC");
    expect(utcResult.active[0].id).toBe("b");
    expect(utcResult.active[1].id).toBe("a");

    const nyResult = buildScheduleSections(input, "America/New_York");
    expect(nyResult.active[0].id).toBe("a");
    expect(nyResult.active[1].id).toBe("b");
  });
});

describe("nextHomeScheduleItem", () => {
  it("prefers needs-review items over active ones", () => {
    const reLate = makeRecurring({
      id: "re-late",
      status: "active",
      nextRunDate: "2026-03-01T00:00:00Z",
    });
    const reEarly = makeRecurring({
      id: "re-early",
      status: "active",
      nextRunDate: "2026-01-15T00:00:00Z",
    });
    const occ = makeOccurrence({
      id: "occ-1",
      recurringExpenseId: "re-late",
      status: "pending",
      scheduledFor: "2026-02-01T00:00:00Z",
    });

    const input: RecurringReadInput = {
      recurringExpenses: [reLate, reEarly],
      occurrences: [occ],
    };
    const result = nextHomeScheduleItem(input, TZ);

    expect(result).not.toBeNull();
    expect(result!.id).toBe("occ-1");
    expect(result!.state).toBe("needs-review");
  });

  it("prefers needs-review when it is earliest", () => {
    const re = makeRecurring({
      id: "re-1",
      status: "active",
      nextRunDate: "2026-03-01T00:00:00Z",
    });
    const occ = makeOccurrence({
      id: "occ-1",
      recurringExpenseId: "re-1",
      status: "pending",
      scheduledFor: "2026-01-01T00:00:00Z",
    });

    const input: RecurringReadInput = { recurringExpenses: [re], occurrences: [occ] };
    const result = nextHomeScheduleItem(input, TZ);

    expect(result).not.toBeNull();
    expect(result!.id).toBe("occ-1");
    expect(result!.state).toBe("needs-review");
  });

  it("prefers pending schedule items over active ones", () => {
    const re = makeRecurring({
      id: "re-1",
      status: "active",
      nextRunDate: "2026-01-01T00:00:00Z",
    });
    const occ = makeOccurrence({
      id: "occ-1",
      recurringExpenseId: "re-1",
      status: "pending",
      scheduledFor: "2026-03-01T00:00:00Z",
    });

    const input: RecurringReadInput = { recurringExpenses: [re], occurrences: [occ] };
    const result = nextHomeScheduleItem(input, TZ);

    expect(result).not.toBeNull();
    expect(result!.id).toBe("occ-1");
    expect(result!.state).toBe("needs-review");
  });

  it("returns null for empty input", () => {
    const input: RecurringReadInput = { recurringExpenses: [], occurrences: [] };
    expect(nextHomeScheduleItem(input, TZ)).toBeNull();
  });
});
