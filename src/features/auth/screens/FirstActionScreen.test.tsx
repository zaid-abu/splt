import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import FirstActionScreen from "./FirstActionScreen";
import { AuthService } from "@/services/api/auth";
import type { User } from "@/types";

const mockCompleteActivation = jest.fn();
const mockToastShow = jest.fn();
const mockUseAuth = jest.fn();

const currentUser: User = {
  id: "current-user-id",
  name: "Current User",
  email: "current@example.com",
  initials: "CU",
  defaultCurrency: "USD",
  setupState: "activation_pending",
};

const coralColors = {
  foreground: "#000000",
  muted: "#666666",
  accent: "#f0584b",
  positive: "#008045",
  warning: "#c08500",
  border: "#dddddd",
  surface: "#ffffff",
  avatarInk: "#1b3c5d",
};

jest.mock("@/components/coral/CoralButton", () => {
  const React = require("react");
  const RN = require("react-native");

  return {
    CoralButton: ({ label, onPress, disabled = false, loading = false }: any) =>
      React.createElement(
        RN.Pressable,
        {
          accessibilityRole: "button",
          accessibilityLabel: label,
          disabled: disabled || loading,
          onPress,
          testID: `coral-button-${label}`,
        },
        loading
          ? React.createElement(RN.ActivityIndicator, {
              accessibilityLabel: `${label} loading`,
              testID: `loading-${label}`,
            })
          : null,
        React.createElement(RN.Text, null, label)
      ),
  };
});

jest.mock("@/components/coral/CoralScreen", () => {
  const React = require("react");
  const RN = require("react-native");

  return {
    CoralScreen: ({ children }: any) =>
      React.createElement(RN.View, { testID: "coral-screen" }, children),
  };
});

jest.mock("@/components/coral/CoralTopBar", () => {
  const React = require("react");
  const RN = require("react-native");

  return {
    CoralTopBar: ({ title }: any) =>
      React.createElement(RN.Text, { accessibilityRole: "header" }, title),
  };
});

jest.mock("@/components/coral/LargeTitle", () => {
  const React = require("react");
  const RN = require("react-native");

  return {
    LargeTitle: ({ children }: any) => React.createElement(RN.Text, null, children),
  };
});

jest.mock("@/components/coral/useCoral", () => ({
  useCoralColors: () => coralColors,
}));

jest.mock("@/context/AppContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/hooks/useAppToast", () => ({
  useAppToast: () => ({ toast: { show: mockToastShow } }),
}));

jest.mock("@/services/api/auth", () => ({
  AuthService: {
    markActivationSeen: jest.fn(),
  },
}));

jest.mock("lucide-react-native", () => {
  const React = require("react");
  const RN = require("react-native");
  const MockIcon = () => React.createElement(RN.View, null);

  return {
    CalendarDays: MockIcon,
    ReceiptText: MockIcon,
    UserPlus: MockIcon,
    UsersRound: MockIcon,
  };
});

const actionCases = [
  ["Create a group", "/group/new"],
  ["Add people", "/friend/new"],
  ["Add your first expense", "/expense/new"],
  ["Schedule a recurring bill", "/recurring/new"],
  ["Skip for now", "/home"],
] as const;

const mockMarkActivationSeen = AuthService.markActivationSeen as jest.MockedFunction<
  typeof AuthService.markActivationSeen
>;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ currentUser, completeActivation: mockCompleteActivation });
  mockMarkActivationSeen.mockResolvedValue({ ...currentUser, setupState: "complete" });
});

async function renderScreen() {
  return render(<FirstActionScreen />);
}

function getControl(label: string) {
  return screen.getByRole("button", { name: new RegExp(`^${label}`) });
}

describe("FirstActionScreen", () => {
  it("renders all four actions and Skip with button roles and labels", async () => {
    await renderScreen();

    expect(screen.getAllByRole("button")).toHaveLength(5);
    for (const [label] of actionCases) {
      expect(getControl(label)).toBeTruthy();
    }
    expect(screen.getByLabelText("Skip for now")).toBeTruthy();
    expect(screen.getByText("What would help first?")).toBeTruthy();
  });

  it.each(actionCases)("marks activation seen and completes %s", async (label, destination) => {
    const returnedUser: User = { ...currentUser, setupState: "complete", name: "Returned User" };
    mockMarkActivationSeen.mockResolvedValueOnce(returnedUser);

    await renderScreen();

    await act(async () => {
      fireEvent.press(getControl(label));
    });

    expect(mockMarkActivationSeen).toHaveBeenCalledWith(currentUser.id);
    expect(mockMarkActivationSeen).toHaveBeenCalledTimes(1);
    expect(mockCompleteActivation).toHaveBeenCalledWith(returnedUser, destination);
    expect(mockCompleteActivation.mock.calls[0]?.[0]).toBe(returnedUser);
  });

  it("disables every control during a deferred submission and only mutates once", async () => {
    let resolveSubmission!: (user: typeof currentUser) => void;
    const returnedUser: User = { ...currentUser, setupState: "complete" };
    const deferred = new Promise<typeof currentUser>((resolve) => {
      resolveSubmission = resolve;
    });
    mockMarkActivationSeen.mockReturnValueOnce(deferred);

    await renderScreen();

    await act(async () => {
      fireEvent.press(getControl("Create a group"));
      await Promise.resolve();
    });

    for (const [label] of actionCases) {
      const control = getControl(label);
      expect(control.props.accessibilityState?.disabled).toBe(true);
    }
    expect(getControl("Create a group").props.style.opacity).toBe(0.65);
    expect(screen.queryByTestId("loading-Skip for now")).toBeNull();

    for (const [label] of actionCases) {
      fireEvent.press(getControl(label));
    }
    expect(mockMarkActivationSeen).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSubmission(returnedUser);
      await deferred;
    });
    expect(mockCompleteActivation).toHaveBeenCalledWith(returnedUser, "/group/new");
  });

  it("shows the selected Skip loading state and disables the other controls", async () => {
    let resolveSubmission!: (user: typeof currentUser) => void;
    const returnedUser: User = { ...currentUser, setupState: "complete" };
    const deferred = new Promise<typeof currentUser>((resolve) => {
      resolveSubmission = resolve;
    });
    mockMarkActivationSeen.mockReturnValueOnce(deferred);

    await renderScreen();

    await act(async () => {
      fireEvent.press(getControl("Skip for now"));
      await Promise.resolve();
    });

    expect(screen.getByTestId("loading-Skip for now")).toBeTruthy();
    expect(getControl("Skip for now").props.accessibilityState?.disabled).toBe(true);
    for (const [label] of actionCases.slice(0, 4)) {
      expect(getControl(label).props.accessibilityState?.disabled).toBe(true);
    }

    await act(async () => {
      resolveSubmission(returnedUser);
      await deferred;
    });
  });

  it("shows an Error message in the danger top toast without completing activation", async () => {
    const error = new Error("Activation failed");
    mockMarkActivationSeen.mockRejectedValueOnce(error);

    await renderScreen();

    await act(async () => {
      fireEvent.press(getControl("Create a group"));
    });

    await waitFor(() => expect(mockToastShow).toHaveBeenCalledTimes(1));
    expect(mockToastShow).toHaveBeenCalledWith({
      label: "Could not continue",
      description: "Activation failed",
      variant: "danger",
      placement: "top",
    });
    expect(mockCompleteActivation).not.toHaveBeenCalled();
    expect(getControl("Create a group").props.accessibilityState?.disabled).toBe(false);
  });

  it("uses the fallback toast message for non-Error failures", async () => {
    mockMarkActivationSeen.mockRejectedValueOnce("offline");

    await renderScreen();

    await act(async () => {
      fireEvent.press(getControl("Add people"));
    });

    await waitFor(() => expect(mockToastShow).toHaveBeenCalledTimes(1));
    expect(mockToastShow).toHaveBeenCalledWith({
      label: "Could not continue",
      description: "Try again.",
      variant: "danger",
      placement: "top",
    });
    expect(mockCompleteActivation).not.toHaveBeenCalled();
  });

  it("allows the same action to succeed after a failed submission", async () => {
    const returnedUser: User = { ...currentUser, setupState: "complete" };
    mockMarkActivationSeen.mockRejectedValueOnce(new Error("Try later"));

    await renderScreen();

    await act(async () => {
      fireEvent.press(getControl("Add your first expense"));
    });
    await waitFor(() => expect(mockToastShow).toHaveBeenCalledTimes(1));

    mockMarkActivationSeen.mockResolvedValueOnce(returnedUser);
    await act(async () => {
      fireEvent.press(getControl("Add your first expense"));
    });

    expect(mockMarkActivationSeen).toHaveBeenCalledTimes(2);
    expect(mockMarkActivationSeen).toHaveBeenNthCalledWith(1, currentUser.id);
    expect(mockMarkActivationSeen).toHaveBeenNthCalledWith(2, currentUser.id);
    expect(mockCompleteActivation).toHaveBeenCalledWith(returnedUser, "/expense/new");
    expect(mockCompleteActivation.mock.calls[0]?.[0]).toBe(returnedUser);
  });
});
