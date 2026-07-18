import {
  GLOBAL_ACTIONS,
  LEGACY_REDIRECT_HREFS,
  SHELL_HREFS,
  SHELL_TABS,
  legacyRedirectHref,
  parseCircleSegment,
  settlementHref,
} from "./shell";

describe("Circle Dock navigation contract", () => {
  it.each([
    [undefined, "groups"],
    ["", "groups"],
    ["groups", "groups"],
    ["people", "people"],
    ["unexpected", "groups"],
    [["people", "groups"], "people"],
  ] as const)("parses circle segment %p as %s", (value, expected) => {
    expect(parseCircleSegment(value)).toBe(expected);
  });

  it("defines the canonical shell and secondary links", () => {
    expect(SHELL_HREFS).toEqual({
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
    });
  });

  it("defines exact legacy redirects", () => {
    expect(LEGACY_REDIRECT_HREFS).toEqual({
      groups: "/circles?segment=groups",
      people: "/circles?segment=people",
      settings: "/more",
    });
    expect(legacyRedirectHref("groups")).toBe("/circles?segment=groups");
    expect(legacyRedirectHref("people")).toBe("/circles?segment=people");
    expect(legacyRedirectHref("settings")).toBe("/more");
  });

  it("defines five working global actions", () => {
    expect(GLOBAL_ACTIONS).toEqual([
      { id: "add-expense", label: "Add expense", href: "/expense/new" },
      { id: "settle-up", label: "Settle up", href: "/settle/new" },
      { id: "create-group", label: "Create group", href: "/group/new" },
      { id: "add-person", label: "Add person", href: "/friend/new" },
      { id: "schedule-expense", label: "Schedule expense", href: "/recurring/new" },
    ]);
  });

  it("falls back to the selector instead of creating settle/undefined", () => {
    expect(settlementHref()).toBe("/settle/new");
    expect(settlementHref(null)).toBe("/settle/new");
    expect(settlementHref("   ")).toBe("/settle/new");
    expect(settlementHref("friend-42")).toEqual({
      pathname: "/settle/[id]",
      params: { id: "friend-42" },
    });
    expect(JSON.stringify(settlementHref())).not.toContain("undefined");
  });

  it("contains four unique stable tabs and no Add route", () => {
    expect(SHELL_TABS).toHaveLength(4);
    expect(SHELL_TABS.map((tab) => tab.key)).toEqual(["home", "circles", "activity", "more"]);
    expect(new Set(SHELL_TABS.map((tab) => tab.key)).size).toBe(4);
    expect(new Set(SHELL_TABS.map((tab) => tab.routeName)).size).toBe(4);
    expect(new Set(SHELL_TABS.map((tab) => tab.href)).size).toBe(4);
    expect(SHELL_TABS.some((tab) => String(tab.key).toLowerCase() === "add")).toBe(false);
    expect(SHELL_TABS.some((tab) => String(tab.routeName).toLowerCase().includes("add"))).toBe(
      false
    );
  });

  it("ensures no Screen suffix leaks to user-facing labels", () => {
    for (const tab of SHELL_TABS) {
      expect(tab.label).not.toMatch(/Screen/i);
    }
    for (const action of GLOBAL_ACTIONS) {
      expect(action.label).not.toMatch(/Screen/i);
    }
  });

  it("ensures every GLOBAL_ACTION href is a reachable path", () => {
    for (const action of GLOBAL_ACTIONS) {
      const href = action.href;
      if (typeof href === "string") {
        expect(href).toMatch(/^\//);
      } else {
        expect(href).toHaveProperty("pathname");
      }
    }
  });

  it("handles settlement href whitespace edge case", () => {
    expect(settlementHref("  friend-42  ")).toEqual({
      pathname: "/settle/[id]",
      params: { id: "friend-42" },
    });
  });
});
