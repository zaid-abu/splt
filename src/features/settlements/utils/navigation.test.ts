import type { OpenBalance } from "@/features/money/types";
import { openSettlementComposer } from "./navigation";

describe("openSettlementComposer", () => {
  it("pushes a group settlement and preserves the balance selector in history", () => {
    const push = jest.fn();
    const balance: OpenBalance = {
      counterpartyId: "friend-1",
      context: { type: "group", groupId: "group-1" },
      currency: "USD",
      signedAmountMinor: -1250,
      lastActivityAt: new Date("2026-07-31T00:00:00Z"),
    };

    openSettlementComposer({ push }, "friend-1", balance);

    expect(push).toHaveBeenCalledWith({
      pathname: "/settle/[id]",
      params: {
        id: "friend-1",
        contextType: "group",
        groupId: "group-1",
        friendshipId: undefined,
        currency: "USD",
        amountMinor: "1250",
        isOwedToYou: "false",
      },
    });
  });

  it("passes direct friendship context and owed-to-you direction", () => {
    const push = jest.fn();
    const balance: OpenBalance = {
      counterpartyId: "friend-1",
      context: { type: "direct", friendshipId: "friendship-1" },
      currency: "JPY",
      signedAmountMinor: 500,
      lastActivityAt: new Date("2026-07-31T00:00:00Z"),
    };

    openSettlementComposer({ push }, "friend-1", balance);

    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          friendshipId: "friendship-1",
          amountMinor: "500",
          isOwedToYou: "true",
        }),
      })
    );
  });
});
