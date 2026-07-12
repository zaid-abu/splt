import { mapUser, mapGroup, mapExpense, mapGroupMember, mapExpenseSplit, mapSettlement, mapActivity } from "@/services/api/mappers"
import type { User, Group, GroupMember, Expense, ExpenseSplit, Settlement, Activity } from "@/types"

describe("mapUser", () => {
  it("maps a DB user row to a User domain type", () => {
    const dbUser = {
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      avatar: "https://example.com/avatar.jpg",
      initials: "A",
      default_currency: "USD",
      created_at: "2025-01-15T10:00:00Z",
    }

    const result: User = mapUser(dbUser)

    expect(result.id).toBe("user-1")
    expect(result.name).toBe("Alice")
    expect(result.email).toBe("alice@example.com")
    expect(result.avatar).toBe("https://example.com/avatar.jpg")
    expect(result.initials).toBe("A")
    expect(result.defaultCurrency).toBe("USD")
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.createdAt!.toISOString()).toBe("2025-01-15T10:00:00.000Z")
  })

  it("maps null avatar to undefined", () => {
    const dbUser = {
      id: "user-2",
      name: "Bob",
      email: "bob@example.com",
      avatar: null,
      initials: "B",
      default_currency: "EUR",
      created_at: "2025-01-15T10:00:00Z",
    }

    const result: User = mapUser(dbUser)

    expect(result.avatar).toBeUndefined()
  })
})

describe("mapGroupMember", () => {
  it("maps a DB group member row to a GroupMember domain type", () => {
    const dbRow = {
      group_id: "group-1",
      user_id: "user-1",
      balance: 42.5,
      created_at: "2025-01-15T10:00:00Z",
      user: {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
        avatar: null,
        initials: "A",
        default_currency: "USD",
        created_at: "2025-01-15T10:00:00Z",
      },
    }

    const result: GroupMember = mapGroupMember(dbRow)

    expect(result.userId).toBe("user-1")
    expect(result.balance).toBe(42.5)
    expect(result.user.id).toBe("user-1")
    expect(result.user.name).toBe("Alice")
  })

  it("creates an empty user when user relation is null", () => {
    const dbRow = {
      group_id: "group-1",
      user_id: "user-1",
      balance: 10,
      created_at: "2025-01-15T10:00:00Z",
      user: null,
    }

    const result: GroupMember = mapGroupMember(dbRow)

    expect(result.userId).toBe("user-1")
    expect(result.balance).toBe(10)
    expect(result.user.id).toBe("user-1")
    expect(result.user.name).toBe("Unknown user")
  })
})

describe("mapGroup", () => {
  it("maps a DB group row to a Group domain type", () => {
    const dbRow = {
      id: "group-1",
      name: "Trip to Paris",
      icon: "plane",
      description: "Summer trip",
      currency: "EUR",
      created_at: "2025-01-15T10:00:00Z",
      created_by: "user-1",
      total_expenses: 1250.0,
      simplify_debts: true,
      members: [
        {
          group_id: "group-1",
          user_id: "user-1",
          balance: 100,
          created_at: "2025-01-15T10:00:00Z",
          user: {
            id: "user-1",
            name: "Alice",
            email: "alice@example.com",
            avatar: null,
            initials: "A",
            default_currency: "USD",
            created_at: "2025-01-15T10:00:00Z",
          },
        },
      ],
    }

    const result: Group = mapGroup(dbRow)

    expect(result.id).toBe("group-1")
    expect(result.name).toBe("Trip to Paris")
    expect(result.icon).toBe("plane")
    expect(result.description).toBe("Summer trip")
    expect(result.currency).toBe("EUR")
    expect(result.createdBy).toBe("user-1")
    expect(result.totalExpenses).toBe(1250)
    expect(result.simplifyDebts).toBe(true)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.members).toHaveLength(1)
    expect(result.members[0].user.name).toBe("Alice")
  })

  it("maps null description to undefined", () => {
    const dbRow = {
      id: "group-2",
      name: "Test Group",
      icon: "home",
      description: null,
      currency: "USD",
      created_at: "2025-01-15T10:00:00Z",
      created_by: "user-1",
      total_expenses: 0,
      simplify_debts: false,
      members: [],
    }

    const result: Group = mapGroup(dbRow)

    expect(result.description).toBeUndefined()
  })

  it("maps empty members array", () => {
    const dbRow = {
      id: "group-3",
      name: "Empty Group",
      icon: "home",
      description: null,
      currency: "USD",
      created_at: "2025-01-15T10:00:00Z",
      created_by: "user-1",
      total_expenses: 0,
      simplify_debts: false,
    }

    const result: Group = mapGroup(dbRow as any)

    expect(result.members).toEqual([])
  })

  it("handles numeric string to number conversion", () => {
    const dbRow = {
      id: "group-4",
      name: "Test",
      icon: "home",
      description: null,
      currency: "USD",
      created_at: "2025-01-15T10:00:00Z",
      created_by: "user-1",
      total_expenses: "42.50",
      simplify_debts: false,
      members: [],
    }

    const result: Group = mapGroup(dbRow as any)

    expect(result.totalExpenses).toBe(42.5)
  })
})

describe("mapExpenseSplit", () => {
  it("maps a DB expense split row to an ExpenseSplit domain type", () => {
    const dbRow = {
      id: "split-1",
      expense_id: "expense-1",
      user_id: "user-1",
      amount: 25.0,
      percentage: 50,
      paid: true,
      created_at: "2025-01-15T10:00:00Z",
      user: {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
        avatar: null,
        initials: "A",
        default_currency: "USD",
        created_at: "2025-01-15T10:00:00Z",
      },
    }

    const result: ExpenseSplit = mapExpenseSplit(dbRow)

    expect(result.userId).toBe("user-1")
    expect(result.amount).toBe(25)
    expect(result.percentage).toBe(50)
    expect(result.paid).toBe(true)
    expect(result.user.name).toBe("Alice")
  })

  it("maps null percentage to undefined", () => {
    const dbRow = {
      id: "split-2",
      expense_id: "expense-1",
      user_id: "user-2",
      amount: 50,
      percentage: null,
      paid: false,
      created_at: "2025-01-15T10:00:00Z",
      user: null,
    }

    const result: ExpenseSplit = mapExpenseSplit(dbRow)

    expect(result.percentage).toBeUndefined()
  })
})

describe("mapExpense", () => {
  it("maps a DB expense row to an Expense domain type", () => {
    const dbRow = {
      id: "expense-1",
      group_id: "group-1",
      title: "Dinner",
      amount: 75.5,
      currency: "USD",
      category: "food",
      paid_by: "user-1",
      split_method: "equal",
      date: "2025-06-15T12:00:00Z",
      notes: "Great Italian place",
      created_at: "2025-06-15T12:30:00Z",
      paidByUser: {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
        avatar: null,
        initials: "A",
        default_currency: "USD",
        created_at: "2025-01-15T10:00:00Z",
      },
      splits: [
        {
          id: "split-1",
          expense_id: "expense-1",
          user_id: "user-1",
          amount: 37.75,
          percentage: null,
          paid: true,
          created_at: "2025-06-15T12:30:00Z",
          user: {
            id: "user-1",
            name: "Alice",
            email: "alice@example.com",
            avatar: null,
            initials: "A",
            default_currency: "USD",
            created_at: "2025-01-15T10:00:00Z",
          },
        },
      ],
    }

    const result: Expense = mapExpense(dbRow)

    expect(result.id).toBe("expense-1")
    expect(result.groupId).toBe("group-1")
    expect(result.title).toBe("Dinner")
    expect(result.amount).toBe(75.5)
    expect(result.currency).toBe("USD")
    expect(result.category).toBe("food")
    expect(result.paidBy).toBe("user-1")
    expect(result.splitMethod).toBe("equal")
    expect(result.notes).toBe("Great Italian place")
    expect(result.date).toBeInstanceOf(Date)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.paidByUser.name).toBe("Alice")
    expect(result.splits).toHaveLength(1)
    expect(result.splits[0].amount).toBe(37.75)
  })

  it("maps null group_id to undefined", () => {
    const dbRow = {
      id: "expense-2",
      group_id: null,
      title: "Lunch",
      amount: 20,
      currency: "USD",
      category: "food",
      paid_by: "user-1",
      split_method: "equal",
      date: "2025-06-15T12:00:00Z",
      notes: null,
      created_at: "2025-06-15T12:30:00Z",
    }

    const result: Expense = mapExpense(dbRow as any)

    expect(result.groupId).toBeUndefined()
  })

  it("handles numeric string to number conversion", () => {
    const dbRow = {
      id: "expense-3",
      group_id: "group-1",
      title: "Test",
      amount: "42.50",
      currency: "USD",
      category: "other",
      paid_by: "user-1",
      split_method: "equal",
      date: "2025-06-15T12:00:00Z",
      notes: null,
      created_at: "2025-06-15T12:30:00Z",
    }

    const result: Expense = mapExpense(dbRow as any)

    expect(result.amount).toBe(42.5)
  })
})

describe("mapSettlement", () => {
  it("maps a DB settlement row to a Settlement domain type", () => {
    const dbRow = {
      id: "settlement-1",
      group_id: "group-1",
      from_user_id: "user-1",
      to_user_id: "user-2",
      amount: 50.0,
      currency: "USD",
      date: "2025-06-20T10:00:00Z",
      note: "Dinner payment",
      created_at: "2025-06-20T10:30:00Z",
      fromUser: {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
        avatar: null,
        initials: "A",
        default_currency: "USD",
        created_at: "2025-01-15T10:00:00Z",
      },
      toUser: {
        id: "user-2",
        name: "Bob",
        email: "bob@example.com",
        avatar: null,
        initials: "B",
        default_currency: "USD",
        created_at: "2025-01-15T10:00:00Z",
      },
    }

    const result: Settlement = mapSettlement(dbRow as any)

    expect(result.id).toBe("settlement-1")
    expect(result.groupId).toBe("group-1")
    expect(result.fromUserId).toBe("user-1")
    expect(result.toUserId).toBe("user-2")
    expect(result.amount).toBe(50)
    expect(result.currency).toBe("USD")
    expect(result.note).toBe("Dinner payment")
    expect(result.date).toBeInstanceOf(Date)
    expect(result.fromUser.name).toBe("Alice")
    expect(result.toUser.name).toBe("Bob")
  })
})

describe("mapActivity", () => {
  it("maps a DB activity row to an Activity domain type", () => {
    const dbRow = {
      id: "activity-1",
      type: "expense",
      group_id: "group-1",
      expense_id: "expense-1",
      settlement_id: null,
      user_id: "user-1",
      description: "added expense",
      amount: 75.5,
      currency: "USD",
      date: "2025-06-15T12:30:00Z",
      created_at: "2025-06-15T12:30:00Z",
      user: {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
        avatar: null,
        initials: "A",
        default_currency: "USD",
        created_at: "2025-01-15T10:00:00Z",
      },
    }

    const result: Activity = mapActivity(dbRow as any)

    expect(result.id).toBe("activity-1")
    expect(result.type).toBe("expense")
    expect(result.userId).toBe("user-1")
    expect(result.description).toBe("added expense")
    expect(result.amount).toBe(75.5)
    expect(result.currency).toBe("USD")
    expect(result.date).toBeInstanceOf(Date)
    expect(result.user.name).toBe("Alice")
  })
})
