import type { Href } from "expo-router";

import type { MoneyContext } from "@/features/money/types";
import type { ExpenseNewRouteParams, GroupView } from "@/types/navigation";

export type { GroupView };

export type CircleReturnTarget = "home" | "circles-groups" | "circles-people" | "group" | "friend";

export type ParsedExpenseContext =
  | { state: "group"; groupId: string }
  | { state: "direct"; friendshipId: string }
  | { state: "invalid" };

export interface SettlementRouteInput {
  counterpartyId?: string;
  context?: MoneyContext;
  returnTo?: CircleReturnTarget;
  expenseId?: string;
}

export function parseGroupView(value: string | string[] | undefined): GroupView {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate === "expenses" || candidate === "schedule") {
    return candidate;
  }
  return "overview";
}

export function parseReturnTarget(value: string | string[] | undefined): CircleReturnTarget {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    candidate === "circles-groups" ||
    candidate === "circles-people" ||
    candidate === "group" ||
    candidate === "friend" ||
    candidate === "home"
  ) {
    return candidate;
  }
  return "home";
}

export function expenseContextFromParams(params: ExpenseNewRouteParams): ParsedExpenseContext {
  const { groupId, friendId } = params;
  if (groupId && friendId) return { state: "invalid" };
  if (groupId) return { state: "group", groupId };
  if (friendId) return { state: "direct", friendshipId: friendId };
  return { state: "invalid" };
}

export function expenseHref(
  context?: MoneyContext,
  returnTo?: CircleReturnTarget,
  resume?: "expense"
): Href {
  if (!context) return "/expense/new";

  const params: Record<string, string> = {};
  if (context.type === "group") {
    params.groupId = context.groupId;
  } else {
    params.friendId = context.friendshipId;
  }
  if (returnTo) params.returnTo = returnTo;
  if (resume) params.resume = resume;

  return { pathname: "/expense/new", params } as Href;
}

export function settlementHref(input?: SettlementRouteInput): Href {
  if (!input?.counterpartyId) return "/settle/new";

  const { counterpartyId, context, returnTo, expenseId } = input;
  const params: Record<string, string> = { id: counterpartyId };
  if (context) {
    if (context.type === "group") {
      params.contextType = "group";
      params.groupId = context.groupId;
    } else {
      params.contextType = "direct";
      params.friendshipId = context.friendshipId;
    }
  }
  if (returnTo) params.returnTo = returnTo;
  if (expenseId) params.expenseId = expenseId;

  return { pathname: "/settle/[id]", params } as Href;
}

export function coldBackHref(target: CircleReturnTarget, context?: MoneyContext): Href {
  switch (target) {
    case "home":
      return "/home";
    case "circles-groups":
      return "/circles?segment=groups";
    case "circles-people":
      return "/circles?segment=people";
    case "group": {
      if (context?.type === "group") {
        return { pathname: "/group/[id]", params: { id: context.groupId } };
      }
      return "/home";
    }
    case "friend": {
      if (context?.type === "direct") {
        return {
          pathname: "/friend/[id]",
          params: { id: context.friendshipId },
        };
      }
      return "/home";
    }
    default:
      return "/home";
  }
}
