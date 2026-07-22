import {
  coldBackHref,
  expenseContextFromParams,
  expenseHref,
  parseGroupView,
  parseReturnTarget,
  settlementHref,
} from "./phase2Routes";

describe("parseGroupView", () => {
  it("returns overview for unknown value", () => {
    expect(parseGroupView("unknown")).toBe("overview");
  });

  it("returns expenses for expenses value", () => {
    expect(parseGroupView("expenses")).toBe("expenses");
  });

  it("returns schedule for schedule value", () => {
    expect(parseGroupView("schedule")).toBe("schedule");
  });

  it("returns overview for undefined", () => {
    expect(parseGroupView(undefined)).toBe("overview");
  });

  it("parses first element of string array", () => {
    expect(parseGroupView(["expenses", "schedule"])).toBe("expenses");
  });

  it("falls back to overview for empty array first element", () => {
    expect(parseGroupView(["unknown"])).toBe("overview");
  });
});

describe("parseReturnTarget", () => {
  it("returns home for unrecognized values", () => {
    expect(parseReturnTarget("https://example.com")).toBe("home");
  });

  it("returns home for undefined", () => {
    expect(parseReturnTarget(undefined)).toBe("home");
  });

  it("parses circles-groups", () => {
    expect(parseReturnTarget("circles-groups")).toBe("circles-groups");
  });

  it("parses circles-people", () => {
    expect(parseReturnTarget("circles-people")).toBe("circles-people");
  });

  it("parses group", () => {
    expect(parseReturnTarget("group")).toBe("group");
  });

  it("parses friend", () => {
    expect(parseReturnTarget("friend")).toBe("friend");
  });

  it("parses home", () => {
    expect(parseReturnTarget("home")).toBe("home");
  });

  it("takes first element from string array", () => {
    expect(parseReturnTarget(["group", "home"])).toBe("group");
  });
});

describe("expenseContextFromParams", () => {
  it("returns invalid when both groupId and friendId provided", () => {
    expect(expenseContextFromParams({ groupId: "g", friendId: "u" })).toEqual({
      state: "invalid",
    });
  });

  it("returns group when only groupId provided", () => {
    const result = expenseContextFromParams({ groupId: "g1" });
    expect(result).toEqual({ state: "group", groupId: "g1" });
  });

  it("returns direct when only friendId provided", () => {
    const result = expenseContextFromParams({ friendId: "f1" });
    expect(result).toEqual({ state: "direct", friendshipId: "f1" });
  });

  it("returns invalid when neither groupId nor friendId provided", () => {
    const result = expenseContextFromParams({});
    expect(result).toEqual({ state: "invalid" });
  });
});

describe("expenseHref", () => {
  it("returns /expense/new with no context", () => {
    expect(expenseHref()).toBe("/expense/new");
  });

  it("includes groupId params for group context", () => {
    const result = expenseHref({ type: "group", groupId: "g1" });
    expect(result).toEqual({
      pathname: "/expense/new",
      params: { groupId: "g1" },
    });
  });

  it("includes friendId params for direct context", () => {
    const result = expenseHref({ type: "direct", friendshipId: "f1" });
    expect(result).toEqual({
      pathname: "/expense/new",
      params: { friendId: "f1" },
    });
  });

  it("includes returnTo and resume when provided", () => {
    const result = expenseHref({ type: "group", groupId: "g1" }, "group", "expense");
    expect(result).toEqual({
      pathname: "/expense/new",
      params: { groupId: "g1", returnTo: "group", resume: "expense" },
    });
  });
});

describe("settlementHref", () => {
  it("returns /settle/new with no input", () => {
    expect(settlementHref()).toBe("/settle/new");
  });

  it("returns group settle path for group context", () => {
    const result = settlementHref({
      counterpartyId: "g1",
      context: { type: "group", groupId: "g1" },
    });
    expect(result.pathname).toBe("/settle/[id]");
    expect(result.params).toMatchObject({ id: "g1", contextType: "group", groupId: "g1" });
  });

  it("returns direct settle path for direct context", () => {
    const result = settlementHref({
      counterpartyId: "f1",
      context: { type: "direct", friendshipId: "f1" },
    });
    expect(result.pathname).toBe("/settle/[id]");
    expect(result.params).toMatchObject({ id: "f1", contextType: "direct", friendshipId: "f1" });
  });

  it("includes returnTo and expenseId when provided", () => {
    const result = settlementHref({
      counterpartyId: "g1",
      context: { type: "group", groupId: "g1" },
      returnTo: "group",
      expenseId: "e1",
    });
    expect(result.params).toMatchObject({
      id: "g1",
      contextType: "group",
      groupId: "g1",
      returnTo: "group",
      expenseId: "e1",
    });
  });
});

describe("coldBackHref", () => {
  it("returns home for home target", () => {
    expect(coldBackHref("home")).toBe("/home");
  });

  it("returns circles-groups path", () => {
    expect(coldBackHref("circles-groups")).toBe("/circles?segment=groups");
  });

  it("returns circles-people path", () => {
    expect(coldBackHref("circles-people")).toBe("/circles?segment=people");
  });

  it("returns group path with context", () => {
    const result = coldBackHref("group", { type: "group", groupId: "g1" });
    expect(result).toEqual({
      pathname: "/group/[id]",
      params: { id: "g1" },
    });
  });

  it("returns friend path with context", () => {
    const result = coldBackHref("friend", {
      type: "direct",
      friendshipId: "f1",
    });
    expect(result).toEqual({
      pathname: "/friend/[id]",
      params: { id: "f1" },
    });
  });

  it("falls back to home for group target without context", () => {
    expect(coldBackHref("group")).toBe("/home");
  });

  it("falls back to home for friend target without context", () => {
    expect(coldBackHref("friend")).toBe("/home");
  });
});
