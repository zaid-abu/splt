import { fireEvent, render } from "@testing-library/react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";

import { CircleDock } from "./CircleDock";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
}));

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: (state: { isDarkMode: boolean }) => unknown) =>
    selector({ isDarkMode: false }),
}));

function makeProps() {
  const routes = ["(home-tab)", "(circles-tab)", "(activity-tab)", "(more-tab)"].map(
    (name, index) => ({ key: `${index}-key`, name, params: undefined })
  );
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigate = jest.fn();
  const props = {
    state: { index: 0, routes },
    descriptors: Object.fromEntries(
      routes.map((route) => [route.key, { options: {}, route, navigation: {} }])
    ),
    navigation: { emit, navigate },
    insets: { top: 0, right: 0, bottom: 20, left: 0 },
  } as unknown as BottomTabBarProps;
  return { props, emit, navigate };
}

describe("CircleDock", () => {
  it("renders four tabs and a separate central Add button", async () => {
    const onAddPress = jest.fn();
    const { props } = makeProps();
    const screen = await render(<CircleDock {...props} onAddPress={onAddPress} />);

    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.getByLabelText("Home")).toBeTruthy();
    expect(screen.getByLabelText("Circles")).toBeTruthy();
    expect(screen.getByLabelText("Activity")).toBeTruthy();
    expect(screen.getByLabelText("More")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open Add actions" })).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Open Add actions" }));
    expect(onAddPress).toHaveBeenCalledTimes(1);
  });

  it("emits tabPress and navigates to the selected stable stack", async () => {
    const { props, emit, navigate } = makeProps();
    const screen = await render(<CircleDock {...props} onAddPress={jest.fn()} />);

    fireEvent.press(screen.getByLabelText("Circles"));

    expect(emit).toHaveBeenCalledWith({
      type: "tabPress",
      target: "1-key",
      canPreventDefault: true,
    });
    expect(navigate).toHaveBeenCalledWith("(circles-tab)", undefined);
  });
});
