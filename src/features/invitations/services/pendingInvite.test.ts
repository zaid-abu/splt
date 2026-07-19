jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

import * as SecureStore from "expo-secure-store"
import {
  savePendingInviteToken,
  consumePendingInviteToken,
  clearPendingInviteToken,
} from "./pendingInvite"

const setItemAsync = SecureStore.setItemAsync as jest.Mock
const getItemAsync = SecureStore.getItemAsync as jest.Mock
const deleteItemAsync = SecureStore.deleteItemAsync as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe("pendingInvite", () => {
  describe("savePendingInviteToken", () => {
    it("stores token under splt.pendingFriendInvite", async () => {
      await savePendingInviteToken("tok_abc")
      expect(setItemAsync).toHaveBeenCalledWith("splt.pendingFriendInvite", "tok_abc")
    })
  })

  describe("consumePendingInviteToken", () => {
    it("returns token and deletes it", async () => {
      getItemAsync.mockResolvedValueOnce("tok_abc")
      const result = await consumePendingInviteToken()
      expect(result).toBe("tok_abc")
      expect(deleteItemAsync).toHaveBeenCalledWith("splt.pendingFriendInvite")
    })

    it("returns null when no token stored", async () => {
      getItemAsync.mockResolvedValueOnce(null)
      const result = await consumePendingInviteToken()
      expect(result).toBeNull()
      expect(deleteItemAsync).not.toHaveBeenCalled()
    })

    it("returns null on SecureStore error", async () => {
      getItemAsync.mockRejectedValueOnce(new Error("Failed"))
      const result = await consumePendingInviteToken()
      expect(result).toBeNull()
    })
  })

  describe("clearPendingInviteToken", () => {
    it("deletes the token", async () => {
      await clearPendingInviteToken()
      expect(deleteItemAsync).toHaveBeenCalledWith("splt.pendingFriendInvite")
    })

    it("does not throw on error", async () => {
      deleteItemAsync.mockRejectedValueOnce(new Error("Failed"))
      await expect(clearPendingInviteToken()).resolves.toBeUndefined()
    })
  })
})
