import { act, render, screen, waitFor } from "@testing-library/react-native";

import AuthCallbackScreen from "./AuthCallbackScreen";
import {
  AuthCallbackError,
  AuthService,
  type AuthCallbackResult,
} from "@/services/api/auth";

type CallbackParams = Partial<
  Record<"code" | "flow" | "error" | "error_code" | "error_description", string | string[]>
>;

const mockRouter = { replace: jest.fn() };
const mockUseRouter = jest.fn(() => mockRouter);
const mockUseLocalSearchParams = jest.fn(() => ({}));
const mockBeginRecovery = jest.fn();
const mockRefreshAuth = jest.fn();
const mockAuth = { beginRecovery: mockBeginRecovery, refreshAuth: mockRefreshAuth };
const mockUseAuth = jest.fn(() => mockAuth);
const mockCoral = { bg: "#ffffff", accent: "#f0584b", muted: "#666666" };
const mockUseCoralColors = jest.fn(() => mockCoral);

jest.mock("@/services/supabase/client", () => ({
  supabase: {},
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => mockUseRouter(),
}));

jest.mock("@/components/coral/useCoral", () => ({
  useCoralColors: () => mockUseCoralColors(),
}));

jest.mock("@/context/AppContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/services/api/auth", () => {
  const actual = jest.requireActual<typeof import("@/services/api/auth")>("@/services/api/auth");
  return {
    ...actual,
    AuthService: {
      ...actual.AuthService,
      completeAuthCallback: jest.fn(),
    },
  };
});

const mockCompleteAuthCallback = AuthService.completeAuthCallback as jest.MockedFunction<
  typeof AuthService.completeAuthCallback
>;

beforeEach(() => {
  jest.clearAllMocks();
  mockCompleteAuthCallback.mockReset();
  mockUseLocalSearchParams.mockReturnValue({});
  mockUseRouter.mockReturnValue(mockRouter);
  mockUseAuth.mockReturnValue(mockAuth);
  mockUseCoralColors.mockReturnValue(mockCoral);
  mockRefreshAuth.mockResolvedValue(undefined);
});

async function renderCallback(params: CallbackParams) {
  mockUseLocalSearchParams.mockReturnValue(params);
  const view = render(<AuthCallbackScreen />);
  await waitFor(() => expect(mockCompleteAuthCallback).toHaveBeenCalledTimes(1));
  return view;
}

describe("AuthCallbackScreen", () => {
  it("completes recovery and routes to reset password", async () => {
    mockCompleteAuthCallback.mockResolvedValue({ kind: "recovery", email: "abu@example.com" });

    await renderCallback({ code: "recovery-code", flow: "recovery" });

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/(auth)/reset-password",
        params: { email: "abu@example.com" },
      })
    );
    expect(mockBeginRecovery).toHaveBeenCalledWith("abu@example.com");
    expect(mockRefreshAuth).not.toHaveBeenCalled();
    expect(mockCompleteAuthCallback).toHaveBeenCalledWith({
      code: "recovery-code",
      flow: "recovery",
      error: null,
      errorDescription: null,
    });
  });

  it.each(["verification", "oauth"] as const)(
    "refreshes auth and routes home after %s success",
    async (flow) => {
      mockCompleteAuthCallback.mockResolvedValue({ kind: flow, email: "abu@example.com" });

      await renderCallback({ code: `${flow}-code`, flow });

      await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/"));
      expect(mockRefreshAuth).toHaveBeenCalledTimes(1);
      expect(mockBeginRecovery).not.toHaveBeenCalled();
    }
  );

  it("routes a recovery AuthCallbackError to forgot password with its message", async () => {
    mockCompleteAuthCallback.mockRejectedValue(
      new AuthCallbackError("Recovery link expired", "recovery")
    );

    await renderCallback({ code: "recovery-code", flow: "recovery" });

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/(auth)/forgot-password",
        params: { authError: "Recovery link expired" },
      })
    );
  });

  it("routes a non-recovery generic failure to login with the generic message", async () => {
    mockCompleteAuthCallback.mockRejectedValue(new Error("provider unavailable"));

    await renderCallback({ code: "oauth-code", flow: "verification" });

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/(auth)/login",
        params: { authError: "This authentication link is invalid or expired." },
      })
    );
  });

  it("prefers error over error_code and keeps the first array values", async () => {
    mockCompleteAuthCallback.mockResolvedValue({ kind: "verification", email: "" });

    await renderCallback({
      code: ["first-code", "second-code"],
      flow: ["verification", "oauth"],
      error: ["first-error", "second-error"],
      error_code: ["fallback-error", "ignored-error"],
      error_description: ["first-description", "second-description"],
    });

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/"));
    expect(mockCompleteAuthCallback).toHaveBeenCalledWith({
      code: "first-code",
      flow: "verification",
      error: "first-error",
      errorDescription: "first-description",
    });
  });

  it("forwards error_code when error is absent", async () => {
    mockCompleteAuthCallback.mockResolvedValue({ kind: "oauth", email: "" });

    await renderCallback({ code: "provider-code", flow: "oauth", error_code: "provider_error" });

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/"));
    expect(mockCompleteAuthCallback).toHaveBeenCalledWith({
      code: "provider-code",
      flow: "oauth",
      error: "provider_error",
      errorDescription: null,
    });
  });

  it.each([undefined, "unrecognized"])(
    "falls back to oauth for a missing or invalid flow (%s)",
    async (flow) => {
      mockCompleteAuthCallback.mockResolvedValue({ kind: "oauth", email: "" });

      await renderCallback({ code: "oauth-code", ...(flow ? { flow } : {}) });

      await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/"));
      expect(mockCompleteAuthCallback).toHaveBeenCalledWith({
        code: "oauth-code",
        flow: "oauth",
        error: null,
        errorDescription: null,
      });
    }
  );

  it("does not submit again after a dependency-changing rerender", async () => {
    mockCompleteAuthCallback.mockResolvedValue({ kind: "oauth", email: "" });
    const firstParams = { code: "first-code", flow: "oauth" };
    const secondParams = { code: "second-code", flow: "oauth" };

    const view = await renderCallback(firstParams);
    mockUseLocalSearchParams.mockReturnValue(secondParams);

    await act(async () => {
      view.rerender(<AuthCallbackScreen />);
    });

    expect(mockCompleteAuthCallback).toHaveBeenCalledTimes(1);
    expect(mockCompleteAuthCallback).toHaveBeenCalledWith({
      code: "first-code",
      flow: "oauth",
      error: null,
      errorDescription: null,
    });
  });

  it("routes refreshAuth rejection to login with the generic oauth error", async () => {
    mockCompleteAuthCallback.mockResolvedValue({ kind: "oauth", email: "" });
    mockRefreshAuth.mockRejectedValue(new Error("refresh failed"));

    await renderCallback({ code: "oauth-code", flow: "oauth" });

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/(auth)/login",
        params: { authError: "This authentication link is invalid or expired." },
      })
    );
  });

  it("shows loading text and an accessible activity indicator", async () => {
    mockCompleteAuthCallback.mockImplementation(
      () => new Promise<AuthCallbackResult>(() => undefined)
    );

    await renderCallback({ code: "pending-code", flow: "oauth" });

    expect(screen.getByText("Securing your account...")).toBeTruthy();
    expect(screen.getByLabelText("Completing authentication")).toBeTruthy();
  });
});
