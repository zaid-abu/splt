import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { GlobalActionSheet } from "./GlobalActionSheet";

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn() }));

jest.mock("./CoralSheet", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    CoralSheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
      visible ? React.createElement(View, null, children) : null,
  };
});

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: (state: { isDarkMode: boolean }) => unknown) =>
    selector({ isDarkMode: false }),
}));

describe("GlobalActionSheet", () => {
  it("renders no actions while closed", async () => {
    const screen = await render(
      <GlobalActionSheet visible={false} onClose={jest.fn()} onActionPress={jest.fn()} />
    );
    expect(screen.queryByText("What would you like to do?")).toBeNull();
  });

  it("exposes all five actions and returns the selected href", async () => {
    const onActionPress = jest.fn();
    const screen = await render(
      <GlobalActionSheet visible onClose={jest.fn()} onActionPress={onActionPress} />
    );

    expect(screen.getByRole("button", { name: "Add expense" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Settle up" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create group" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add person" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Schedule expense" })).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Settle up" }));
    expect(onActionPress).toHaveBeenCalledWith("/settle/new");
  });
});
