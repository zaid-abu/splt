import { supabase } from "@/services/supabase/client";
import { recurringApi } from "./recurringApi";

jest.mock("@/services/supabase/client", () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

const rpc = supabase.rpc as jest.Mock;

describe("recurringApi mutation contracts", () => {
  beforeEach(() => rpc.mockReset());

  it("uses the authenticated status RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await recurringApi.setRecurringStatus("schedule-1", "paused");

    expect(rpc).toHaveBeenCalledWith("set_recurring_expense_status_v2", {
      p_id: "schedule-1",
      p_status: "paused",
    });
  });

  it("uses the authenticated delete RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await recurringApi.deleteRecurringExpense("schedule-1");

    expect(rpc).toHaveBeenCalledWith("delete_recurring_expense_v2", { p_id: "schedule-1" });
  });

  it("delegates occurrence review atomically", async () => {
    rpc.mockResolvedValue({ data: "expense-1", error: null });

    await recurringApi.reviewOccurrence("occurrence-1", "generate");

    expect(rpc).toHaveBeenCalledWith("review_recurring_occurrence_v2", {
      p_occurrence_id: "occurrence-1",
      p_action: "generate",
    });
  });
});
