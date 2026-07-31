import type { OpenBalance } from "@/features/money/types";

type SettlementRouter = {
  push: (href: {
    pathname: "/settle/[id]";
    params: {
      id: string;
      contextType: OpenBalance["context"]["type"];
      groupId?: string;
      friendshipId?: string;
      currency: string;
      amountMinor: string;
      isOwedToYou: "true" | "false";
    };
  }) => void;
};

export function openSettlementComposer(
  router: SettlementRouter,
  counterpartyId: string,
  balance: OpenBalance
): void {
  router.push({
    pathname: "/settle/[id]",
    params: {
      id: counterpartyId,
      contextType: balance.context.type,
      groupId: balance.context.type === "group" ? balance.context.groupId : undefined,
      friendshipId: balance.context.type === "direct" ? balance.context.friendshipId : undefined,
      currency: balance.currency,
      amountMinor: String(Math.abs(balance.signedAmountMinor)),
      isOwedToYou: balance.signedAmountMinor > 0 ? "true" : "false",
    },
  });
}
