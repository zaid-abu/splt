import type { Href } from "expo-router";

export type CircleSegment = "groups" | "people";
export type ShellTabKey = "home" | "circles" | "activity" | "more";
export type ShellTabRouteName = "(home-tab)" | "(circles-tab)" | "(activity-tab)" | "(more-tab)";
export type LegacyShellRoute = "groups" | "people" | "settings";
export type GlobalActionId =
  "add-expense" | "settle-up" | "create-group" | "add-person" | "schedule-expense";

export const SHELL_HREFS = {
  home: "/home",
  circles: "/circles",
  circlesGroups: "/circles?segment=groups",
  circlesPeople: "/circles?segment=people",
  activity: "/activity",
  more: "/more",
  analytics: "/analytics",
  notifications: "/notifications",
  currencies: "/currencies",
  settleNew: "/settle/new",
} as const;

export const SHELL_TABS: readonly {
  key: ShellTabKey;
  routeName: ShellTabRouteName;
  label: string;
  href: Href;
}[] = [
  { key: "home", routeName: "(home-tab)", label: "Home", href: SHELL_HREFS.home },
  {
    key: "circles",
    routeName: "(circles-tab)",
    label: "Circles",
    href: SHELL_HREFS.circles,
  },
  {
    key: "activity",
    routeName: "(activity-tab)",
    label: "Activity",
    href: SHELL_HREFS.activity,
  },
  { key: "more", routeName: "(more-tab)", label: "More", href: SHELL_HREFS.more },
];

export const LEGACY_REDIRECT_HREFS: Record<LegacyShellRoute, Href> = {
  groups: SHELL_HREFS.circlesGroups,
  people: SHELL_HREFS.circlesPeople,
  settings: SHELL_HREFS.more,
};

export const GLOBAL_ACTIONS: readonly {
  id: GlobalActionId;
  label: string;
  href: Href;
}[] = [
  { id: "add-expense", label: "Add expense", href: "/expense/new" },
  { id: "settle-up", label: "Settle up", href: SHELL_HREFS.settleNew },
  { id: "create-group", label: "Create group", href: "/group/new" },
  { id: "add-person", label: "Add person", href: "/friend/new" },
  { id: "schedule-expense", label: "Schedule expense", href: "/recurring/new" },
];

export function parseCircleSegment(value: string | string[] | undefined): CircleSegment {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "people" ? "people" : "groups";
}

export function legacyRedirectHref(route: LegacyShellRoute): Href {
  return LEGACY_REDIRECT_HREFS[route];
}

export function settlementHref(friendId?: string | null): Href {
  const id = friendId?.trim();
  if (!id) return SHELL_HREFS.settleNew;
  return { pathname: "/settle/[id]", params: { id } };
}
