import { supabase } from "@/services/supabase/client"
import { expensesApi } from "./api"
import type { ExpenseMutationInput, ReceiptMimeType } from "@/features/money/types"

jest.mock("@/services/supabase/client", () => ({
  supabase: {
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        remove: jest.fn(),
        createSignedUrl: jest.fn(),
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      returns: jest.fn().mockReturnThis(),
    })),
  },
}))

const rpc = supabase.rpc as jest.Mock
const getUser = supabase.auth.getUser as jest.Mock
const from = supabase.from as jest.Mock
const storageFrom = supabase.storage.from as jest.Mock

function makeExpenseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "exp-1",
    group_id: "g-1",
    friendship_id: null,
    title: "Dinner",
    amount: 25,
    amount_minor: 2500,
    currency: "USD",
    category: "food",
    paid_by: "u1",
    created_by: "u1",
    split_method: "equal",
    date: "2024-01-15T00:00:00.000Z",
    notes: null,
    receipt_url: null,
    receipt_key: null,
    client_operation_id: "op-1",
    recurring_expense_id: null,
    created_at: "2024-01-15T00:00:00.000Z",
    updated_at: "2024-01-15T00:00:00.000Z",
    ...overrides,
  }
}

function mockFetchExpense(overrides: Record<string, unknown> = {}) {
  const row = makeExpenseRow(overrides)
  const chain: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    returns: jest.fn().mockResolvedValue({ data: row, error: null }),
  }
  from.mockReturnValue(chain)
  return chain
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("expensesApi.createExpense", () => {
  it("calls create_expense_v2 RPC with group context and returns Expense", async () => {
    rpc.mockResolvedValueOnce({ data: "exp-1", error: null })
    mockFetchExpense({ id: "exp-1", title: "Dinner", group_id: "g-1" })

    const input: ExpenseMutationInput = {
      clientOperationId: "op-1",
      context: { type: "group", groupId: "g-1" },
      title: "Dinner",
      amountMinor: 2500,
      currency: "USD",
      category: "food",
      paidBy: "u1",
      splitMethod: "equal",
      date: new Date("2024-01-15"),
      splits: [
        { userId: "u1", amountMinor: 1250, position: 0 },
        { userId: "u2", amountMinor: 1250, position: 1 },
      ],
    }

    const result = await expensesApi.createExpense(input)

    expect(rpc).toHaveBeenCalledWith("create_expense_v2", {
      p_client_operation_id: "op-1",
      p_group_id: "g-1",
      p_friendship_id: null,
      p_title: "Dinner",
      p_amount_minor: 2500,
      p_currency: "USD",
      p_category: "food",
      p_paid_by: "u1",
      p_split_method: "equal",
      p_date: "2024-01-15T00:00:00.000Z",
      p_notes: "",
      p_receipt_key: null,
      p_splits: [
        { userId: "u1", amountMinor: 1250, percentageUnits: null, shareUnits: null, position: 0 },
        { userId: "u2", amountMinor: 1250, percentageUnits: null, shareUnits: null, position: 1 },
      ],
    })
    expect(result).toMatchObject({ id: "exp-1", title: "Dinner", groupId: "g-1" })
  })

  it("calls create_expense_v2 RPC with direct/friendship context", async () => {
    rpc.mockResolvedValueOnce({ data: "exp-2", error: null })
    mockFetchExpense({ id: "exp-2", title: "Lunch", group_id: null, friendship_id: "f-1" })

    const input: ExpenseMutationInput = {
      clientOperationId: "op-2",
      context: { type: "direct", friendshipId: "f-1" },
      title: "Lunch",
      amountMinor: 1500,
      currency: "USD",
      category: "food",
      paidBy: "u1",
      splitMethod: "equal",
      date: new Date("2024-01-15"),
      splits: [
        { userId: "u1", amountMinor: 750, position: 0 },
        { userId: "u2", amountMinor: 750, position: 1 },
      ],
    }

    await expensesApi.createExpense(input)

    expect(rpc).toHaveBeenCalledWith("create_expense_v2", expect.objectContaining({
      p_group_id: null,
      p_friendship_id: "f-1",
    }))
  })

  it("includes percentage and shares in splits when provided", async () => {
    rpc.mockResolvedValueOnce({ data: "exp-3", error: null })
    mockFetchExpense({ id: "exp-3" })

    const input: ExpenseMutationInput = {
      clientOperationId: "op-3",
      context: { type: "group", groupId: "g-1" },
      title: "Dinner",
      amountMinor: 2000,
      currency: "USD",
      category: "food",
      paidBy: "u1",
      splitMethod: "percentage",
      date: new Date("2024-01-15"),
      splits: [
        { userId: "u1", amountMinor: 1000, percentageUnits: 50, position: 0 },
        { userId: "u2", amountMinor: 1000, percentageUnits: 50, position: 1 },
      ],
    }

    await expensesApi.createExpense(input)

    expect(rpc).toHaveBeenCalledWith("create_expense_v2", expect.objectContaining({
      p_splits: [
        { userId: "u1", amountMinor: 1000, percentageUnits: 50, shareUnits: null, position: 0 },
        { userId: "u2", amountMinor: 1000, percentageUnits: 50, shareUnits: null, position: 1 },
      ],
    }))
  })

  it("includes shareUnits in splits when provided", async () => {
    rpc.mockResolvedValueOnce({ data: "exp-4", error: null })
    mockFetchExpense({ id: "exp-4" })

    const input: ExpenseMutationInput = {
      clientOperationId: "op-4",
      context: { type: "group", groupId: "g-1" },
      title: "Dinner",
      amountMinor: 3000,
      currency: "USD",
      category: "food",
      paidBy: "u1",
      splitMethod: "shares",
      date: new Date("2024-01-15"),
      splits: [
        { userId: "u1", amountMinor: 2000, shareUnits: 2, position: 0 },
        { userId: "u2", amountMinor: 1000, shareUnits: 1, position: 1 },
      ],
    }

    await expensesApi.createExpense(input)

    expect(rpc).toHaveBeenCalledWith("create_expense_v2", expect.objectContaining({
      p_splits: [
        { userId: "u1", amountMinor: 2000, percentageUnits: null, shareUnits: 2, position: 0 },
        { userId: "u2", amountMinor: 1000, percentageUnits: null, shareUnits: 1, position: 1 },
      ],
    }))
  })

  it("maps BALANCE_CHANGED error to structured error", async () => {
    const balanceError = new Error("BALANCE_CHANGED:500")
    rpc.mockResolvedValueOnce({ data: null, error: balanceError })

    const input: ExpenseMutationInput = {
      clientOperationId: "op-5",
      context: { type: "group", groupId: "g-1" },
      title: "Dinner",
      amountMinor: 2500,
      currency: "USD",
      category: "food",
      paidBy: "u1",
      splitMethod: "equal",
      date: new Date("2024-01-15"),
      splits: [
        { userId: "u1", amountMinor: 1250, position: 0 },
        { userId: "u2", amountMinor: 1250, position: 1 },
      ],
    }

    await expect(expensesApi.createExpense(input)).rejects.toEqual({
      code: "balance-changed",
      currentMinor: 500,
    })
  })

  it("throws non-BALANCE_CHANGED errors as-is", async () => {
    const genericError = new Error("Something went wrong")
    rpc.mockResolvedValueOnce({ data: null, error: genericError })

    const input: ExpenseMutationInput = {
      clientOperationId: "op-6",
      context: { type: "group", groupId: "g-1" },
      title: "Dinner",
      amountMinor: 2500,
      currency: "USD",
      category: "food",
      paidBy: "u1",
      splitMethod: "equal",
      date: new Date("2024-01-15"),
      splits: [
        { userId: "u1", amountMinor: 1250, position: 0 },
        { userId: "u2", amountMinor: 1250, position: 1 },
      ],
    }

    await expect(expensesApi.createExpense(input)).rejects.toThrow("Something went wrong")
  })
})

describe("expensesApi.updateExpense", () => {
  it("calls update_expense_v2 RPC and returns Expense", async () => {
    rpc.mockResolvedValueOnce({ data: "exp-1", error: null })

    mockFetchExpense({ id: "exp-1", title: "Updated Dinner", group_id: "g-1" })

    const result = await expensesApi.updateExpense("exp-1", {
      title: "Updated Dinner",
      amountMinor: 3000,
      currency: "USD",
      category: "food",
      paidBy: "u1",
      splitMethod: "equal",
      date: new Date("2024-01-16"),
      splits: [
        { userId: "u1", amountMinor: 1500, position: 0 },
        { userId: "u2", amountMinor: 1500, position: 1 },
      ],
    })

    expect(rpc).toHaveBeenCalledWith("update_expense_v2", {
      p_expense_id: "exp-1",
      p_title: "Updated Dinner",
      p_amount_minor: 3000,
      p_currency: "USD",
      p_category: "food",
      p_paid_by: "u1",
      p_split_method: "equal",
      p_date: "2024-01-16T00:00:00.000Z",
      p_notes: "",
      p_receipt_key: null,
      p_splits: [
        { userId: "u1", amountMinor: 1500, percentageUnits: null, shareUnits: null, position: 0 },
        { userId: "u2", amountMinor: 1500, percentageUnits: null, shareUnits: null, position: 1 },
      ],
    })
    expect(result).toMatchObject({ id: "exp-1", title: "Updated Dinner", groupId: "g-1" })
  })
})

describe("expensesApi.deleteExpense", () => {
  it("calls delete_expense_v2 RPC", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null })

    await expensesApi.deleteExpense("exp-1")

    expect(rpc).toHaveBeenCalledWith("delete_expense_v2", {
      p_expense_id: "exp-1",
    })
  })
})

describe("expensesApi.uploadStagedReceipt", () => {
  const validBlob = new Blob(["fake-receipt-data"], { type: "image/jpeg" })

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ blob: () => Promise.resolve(validBlob) })
    ) as jest.Mock
  })

  it("gets user from auth.getUser and uploads to staging path", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    rpc.mockResolvedValueOnce({ data: "receipt-id", error: null })
    const uploadMock = jest.fn().mockResolvedValue({ error: null })
    storageFrom.mockReturnValue({ upload: uploadMock, remove: jest.fn(), createSignedUrl: jest.fn() })

    const key = await expensesApi.uploadStagedReceipt({
      operationId: "op-1",
      uri: "file:///tmp/receipt.jpg",
      mimeType: "image/jpeg",
    })

    expect(getUser).toHaveBeenCalled()
    expect(uploadMock).toHaveBeenCalledWith(
      "staging/u1/op-1/receipt",
      validBlob,
      { contentType: "image/jpeg", upsert: true }
    )
    expect(key).toBe("staging/u1/op-1/receipt")
  })

  it("registers upload via RPC before uploading to storage", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    rpc.mockResolvedValueOnce({ data: "receipt-id", error: null })
    const uploadMock = jest.fn().mockResolvedValue({ error: null })
    storageFrom.mockReturnValue({ upload: uploadMock, remove: jest.fn(), createSignedUrl: jest.fn() })

    await expensesApi.uploadStagedReceipt({
      operationId: "op-1",
      uri: "file:///tmp/receipt.jpg",
      mimeType: "image/jpeg",
    })

    expect(rpc).toHaveBeenCalledWith("register_receipt_upload", {
      p_client_operation_id: "op-1",
      p_object_key: "staging/u1/op-1/receipt",
      p_mime_type: "image/jpeg",
      p_size_bytes: validBlob.size,
    })
  })

  it("throws on unsupported MIME type", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })

    await expect(
      expensesApi.uploadStagedReceipt({
        operationId: "op-1",
        uri: "file:///tmp/receipt.pdf",
        mimeType: "image/gif" as ReceiptMimeType,
      })
    ).rejects.toThrow("Unsupported MIME type")
  })

  it("throws on file larger than 10 MB", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
    const largeBlob = new Blob([new Uint8Array(10485761)])
    global.fetch = jest.fn(() =>
      Promise.resolve({ blob: () => Promise.resolve(largeBlob) })
    ) as jest.Mock

    await expect(
      expensesApi.uploadStagedReceipt({
        operationId: "op-1",
        uri: "file:///tmp/large.jpg",
        mimeType: "image/jpeg",
      })
    ).rejects.toThrow("10 MB")
  })

  it("throws auth error when getUser fails", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth required") })

    await expect(
      expensesApi.uploadStagedReceipt({
        operationId: "op-1",
        uri: "file:///tmp/receipt.jpg",
        mimeType: "image/jpeg",
      })
    ).rejects.toThrow("Auth required")
  })

  it("does not accept user ID from caller", async () => {
    const callArgs = expensesApi.uploadStagedReceipt.toString()
    expect(callArgs).not.toContain("userId")
  })
})

describe("expensesApi.removeStagedReceipt", () => {
  it("calls storage.remove with correct key", async () => {
    const removeMock = jest.fn().mockResolvedValue({ error: null })
    storageFrom.mockReturnValue({ upload: jest.fn(), remove: removeMock, createSignedUrl: jest.fn() })

    await expensesApi.removeStagedReceipt("staging/u1/op-1/receipt")

    expect(storageFrom).toHaveBeenCalledWith("expense-receipts")
    expect(removeMock).toHaveBeenCalledWith(["staging/u1/op-1/receipt"])
  })
})

describe("expensesApi.createReceiptSignedUrl", () => {
  it("calls createSignedUrl with key and 300 seconds", async () => {
    const createSignedUrlMock = jest.fn().mockResolvedValue({
      data: { signedUrl: "https://example.com/signed-url" },
      error: null,
    })
    storageFrom.mockReturnValue({ upload: jest.fn(), remove: jest.fn(), createSignedUrl: createSignedUrlMock })

    const url = await expensesApi.createReceiptSignedUrl("exp-1", "staging/u1/op-1/receipt")

    expect(storageFrom).toHaveBeenCalledWith("expense-receipts")
    expect(createSignedUrlMock).toHaveBeenCalledWith("staging/u1/op-1/receipt", 300)
    expect(url).toBe("https://example.com/signed-url")
  })
})

describe("expensesApi.registerReceiptUpload", () => {
  it("calls register_receipt_upload RPC with correct params", async () => {
    rpc.mockResolvedValueOnce({ data: "receipt-id", error: null })

    const result = await expensesApi.registerReceiptUpload({
      operationId: "op-1",
      objectKey: "staging/u1/op-1/receipt",
      mimeType: "image/jpeg",
      sizeBytes: 1024,
    })

    expect(rpc).toHaveBeenCalledWith("register_receipt_upload", {
      p_client_operation_id: "op-1",
      p_object_key: "staging/u1/op-1/receipt",
      p_mime_type: "image/jpeg",
      p_size_bytes: 1024,
    })
    expect(result).toBe("receipt-id")
  })
})
