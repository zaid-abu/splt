import { supabase } from "@/services/supabase/client"
import { CommentsService } from "./comments"

jest.mock("@/services/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    })),
  },
}))

const getUser = supabase.auth.getUser as jest.Mock
const from = supabase.from as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe("CommentsService.addComment", () => {
  it("gets user from auth and inserts with generated types", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })

    const dbComment = {
      id: "c-1",
      expense_id: "exp-1",
      user_id: "u1",
      text: "Great dinner!",
      created_at: "2024-01-15T12:00:00.000Z",
      user: { id: "u1", name: "Alice", initials: "A" },
    }

    const chain = {
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: dbComment, error: null }),
      order: jest.fn().mockReturnThis(),
    }
    from.mockReturnValue(chain)

    const result = await CommentsService.addComment("exp-1", "Great dinner!")

    expect(getUser).toHaveBeenCalled()
    expect(from).toHaveBeenCalledWith("expense_comments")
    expect(chain.insert).toHaveBeenCalledWith({
      expense_id: "exp-1",
      user_id: "u1",
      text: "Great dinner!",
    })
    expect(chain.select).toHaveBeenCalled()
    expect(chain.single).toHaveBeenCalled()
    expect(result).toEqual({
      id: "c-1",
      expenseId: "exp-1",
      userId: "u1",
      text: "Great dinner!",
      createdAt: new Date("2024-01-15T12:00:00.000Z"),
      user: { id: "u1", name: "Alice", initials: "A" },
    })
  })

  it("does not accept user ID from caller", async () => {
    const callArgs = CommentsService.addComment.toString()
    const params = CommentsService.addComment.length
    expect(params).toBe(2)
  })

  it("throws when getUser fails", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("Not authenticated") })

    await expect(
      CommentsService.addComment("exp-1", "text")
    ).rejects.toThrow("Not authenticated")
  })
})

describe("CommentsService.deleteComment", () => {
  it("calls typed delete on expense_comments", async () => {
    const chain = {
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    }
    from.mockReturnValue(chain)
    chain.delete.mockReturnValue(chain)
    chain.eq.mockResolvedValue({ error: null })

    await CommentsService.deleteComment("c-1")

    expect(from).toHaveBeenCalledWith("expense_comments")
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith("id", "c-1")
  })
})
