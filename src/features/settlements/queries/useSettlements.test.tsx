import { renderHook, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { settlementsApi } from "@/features/settlements/services/api";
import { useCreateSettlement, useDeleteSettlement } from "./useSettlements";

jest.mock("@/features/settlements/services/api", () => ({
  settlementsApi: {
    createSettlement: jest.fn(),
    deleteSettlement: jest.fn(),
    fetchSettlement: jest.fn(),
  },
}));

const createSettlement = settlementsApi.createSettlement as jest.Mock;
const deleteSettlement = settlementsApi.deleteSettlement as jest.Mock;
const fetchSettlement = settlementsApi.fetchSettlement as jest.Mock;

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("settlement mutation invalidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("invalidates settlement and related group/user snapshots after create", async () => {
    createSettlement.mockResolvedValueOnce({
      id: "s-1",
      groupId: "g-1",
      fromUserId: "u-1",
      toUserId: "u-2",
    });
    const queryClient = new QueryClient({ defaultOptions: { mutations: { gcTime: 0 } } });
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    const { result, unmount } = await renderHook(() => useCreateSettlement(), {
      wrapper: makeWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({} as never);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["settlements"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["activities"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["home", "u-1"] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["people", "detail", "u-2", "snapshot"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["settlements", "group", "g-1"] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["groups", "detail", "g-1", "snapshot"],
    });
    unmount();
    queryClient.clear();
  });

  it("derives string delete details and invalidates the exact group list", async () => {
    fetchSettlement.mockResolvedValueOnce({
      id: "s-1",
      groupId: "g-1",
      fromUserId: "u-1",
      toUserId: "u-2",
    });
    deleteSettlement.mockResolvedValueOnce(undefined);
    const queryClient = new QueryClient({ defaultOptions: { mutations: { gcTime: 0 } } });
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    const { result, unmount } = await renderHook(() => useDeleteSettlement(), {
      wrapper: makeWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("s-1");
    });

    expect(fetchSettlement).toHaveBeenCalledWith("s-1");
    expect(deleteSettlement).toHaveBeenCalledWith("s-1");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["settlements", "group", "g-1"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["activities"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["home"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["people"] });
    unmount();
    queryClient.clear();
  });
});
