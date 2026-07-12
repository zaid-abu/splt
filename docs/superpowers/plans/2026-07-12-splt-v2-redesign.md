# Splt v2 — Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete top-down v2 redesign of Splt across all dimensions: type safety, test coverage, new IA, redesigned screens, new features, and launch polish.

**Architecture:** Strangler-fig approach — new screens coexist with old routes. Feature-sliced modules remain. React Query + Zustand + Supabase service layer stays. New IA replaces Dashboard+Activity with unified Feed. Floating quick-add sheet for amount-first expense creation.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript 6.0, HeroUI Native 1.x, Uniwind + Tailwind v4, React Query v5, Zustand v5, Zod v4, Gorhom Bottom Sheet v5, FlashList, Reanimated v4, expo-haptics, Lottie, expo-notifications, expo-contacts

## Global Constraints

- All new components must use Uniwind className for styling (standardize away from StyleSheet.create)
- Follow existing design tokens: colors (#1A1A1A, #F7F6F1, #FEFDFA, #FFFFFF, #E7E5DE, #E85D5D, #4CAF82, #F5A623, #8C7A6B, #C4A8E0), radii (8/12/16/20/9999), typography (Sora_600SemiBold headings, IBMPlexSans_400Regular body)
- All interactive elements must have accessibilityLabel, accessibilityRole, accessibilityState
- All mutations must use optimistic updates with rollback
- No new `as any` casts; fix existing ones
- Use queryKeys factory for all new query keys
- Test all new utility functions, hooks, and services
- Keep old routes working alongside new ones until Phase 5 removal
- No semicolons (Prettier: semi: true means semicolons ARE used — internal consistency)

---

## File Structure Map

### New Files to Create (Phase 2+)
```
src/app/(tabs)/_layout.tsx          (MODIFY — new 4-tab layout)
src/app/(tabs)/feed.tsx             (NEW — Feed/home screen)
src/app/(tabs)/groups.tsx           (MODIFY — enhanced groups tab)
src/app/(tabs)/friends.tsx          (MODIFY — enhanced friends tab)
src/app/(tabs)/profile.tsx          (NEW — profile tab route)
src/features/feed/                  (NEW — feed feature module)
  screens/FeedScreen.tsx
  components/BalanceHeader.tsx
  components/QuickStatsRow.tsx
  components/FeedCard.tsx
  components/SwipeableFeedCard.tsx
  queries/useFeed.ts
src/features/quick-add/            (NEW — quick-add feature module)
  screens/QuickAddSheet.tsx
  components/AmountKeypad.tsx
  components/ContextCarousel.tsx
  components/SplitPreview.tsx
  components/CategorySuggestion.tsx
  hooks/useQuickAdd.ts
src/components/ui/Keypad.tsx        (NEW — reusable numeric keypad)
src/components/ui/TabBar.tsx        (NEW — redesigned tab bar)
src/components/ui/SegmentedBar.tsx  (NEW — segmented control)
src/components/ui/StatPill.tsx      (NEW — tappable stat pill)
src/features/notifications/         (MODIFY — enhanced notifications)
src/features/analytics/             (MODIFY — enhanced analytics)
src/features/onboarding/            (MODIFY — interactive onboarding)
```

### Files to Modify (Phase 1)
```
src/features/expenses/services/comments.ts     (remove as any)
src/features/auth/hooks/useAuthMutations.ts    (use queryKeys)
src/features/groups/services/api.ts            (fix race condition)
src/services/api/auth.ts                       (fix deleteAccount)
src/features/dashboard/screens/DashboardScreen.tsx  (decompose)
src/features/expenses/hooks/useExpenseForm.ts        (decompose)
src/store/useUIStore.ts                        (nullable types)
src/queries/keys.ts                            (add new keys)
src/services/api/mappers.ts                    (add tests)
src/validation/schemas.ts                      (add tests)
src/utils/balance.ts                           (deduplicate)
src/utils/useReducedMotion.ts                  (move to hooks)
src/context/AppContext.tsx                      (nullable currentUser)
package.json                                   (fix name)
```

---

## Phase 1: Foundation (Weeks 1-3)

### Task 1: Fix type safety — remove `(supabase as any)` in comments service

**Files:**
- Modify: `src/features/expenses/services/comments.ts`
- Modify: `src/services/supabase/database.types.ts`

**Interfaces:**
- Consumes: Supabase Database type
- Produces: Type-safe `fetchComments`, `addComment`, `deleteComment` functions

- [ ] **Step 1: Add expense_comments to Database type**

Add to `src/services/supabase/database.types.ts` under Tables:
```typescript
expense_comments: {
  Row: {
    id: string
    expense_id: string
    user_id: string
    content: string
    created_at: string
  }
  Insert: {
    id?: string
    expense_id: string
    user_id: string
    content: string
    created_at?: string
  }
  Update: {
    id?: string
    expense_id?: string
    user_id?: string
    content?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "expense_comments_expense_id_fkey"
      columns: ["expense_id"]
      referencedRelation: "expenses"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "expense_comments_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
  ]
}
```

- [ ] **Step 2: Update select string and remove as any casts**

Replace in `src/features/expenses/services/comments.ts`:
```typescript
// OLD:
const commentsSelect = `
  id,
  expense_id,
  user_id,
  content,
  created_at
`

async function fetchComments(expenseId: string) {
  const { data, error } = await (supabase as any)
    .from("expense_comments")
    .select(commentsSelect)
    .eq("expense_id", expenseId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data as unknown as ExpenseComment[]).map(mapComment)
}

async function addComment(expenseId: string, userId: string, content: string) {
  const { data, error } = await (supabase as any)
    .from("expense_comments")
    .insert({ expense_id: expenseId, user_id: userId, content })
    .select(commentsSelect)
    .single()

  if (error) throw error
  return mapComment(data as unknown as ExpenseComment)
}

async function deleteComment(commentId: string) {
  const { error } = await (supabase as any)
    .from("expense_comments")
    .delete()
    .eq("id", commentId)

  if (error) throw error
}

// NEW:
import type { Database } from "@/services/supabase/database.types"

async function fetchComments(expenseId: string): Promise<ExpenseComment[]> {
  const { data, error } = await supabase
    .from("expense_comments")
    .select(commentsSelect)
    .eq("expense_id", expenseId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapComment)
}

async function addComment(expenseId: string, userId: string, content: string): Promise<ExpenseComment> {
  const { data, error } = await supabase
    .from("expense_comments")
    .insert({ expense_id: expenseId, user_id: userId, content })
    .select(commentsSelect)
    .single()

  if (error) throw error
  return mapComment(data)
}

async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("expense_comments")
    .delete()
    .eq("id", commentId)

  if (error) throw error
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors in comments.ts

- [ ] **Step 4: Commit**

```bash
git add src/features/expenses/services/comments.ts src/services/supabase/database.types.ts
git commit -m "fix: remove as any casts from comments service, add expense_comments to Database type"
```

### Task 2: Fix hardcoded query keys in auth mutations

**Files:**
- Modify: `src/features/auth/hooks/useAuthMutations.ts`
- Modify: `src/queries/keys.ts`

**Interfaces:**
- Consumes: queryKeys factory from `@/queries/keys`
- Produces: Auth mutations using `queryKeys.session.all` and `queryKeys.users.current` instead of hardcoded arrays

- [ ] **Step 1: Ensure queryKeys has session and currentUser keys**

Verify `src/queries/keys.ts` has:
```typescript
export const queryKeys = {
  session: {
    all: ["session"] as const,
    user: () => [...queryKeys.session.all, "user"] as const,
  },
  users: {
    all: ["users"] as const,
    current: () => [...queryKeys.users.all, "current"] as const,
    // ... existing user keys
  },
  // ... existing keys
}
```

If not present, add them.

- [ ] **Step 2: Replace hardcoded keys in useAuthMutations.ts**

```typescript
// OLD:
queryClient.invalidateQueries({ queryKey: ["session"] })
queryClient.invalidateQueries({ queryKey: ["currentUser"] })

// NEW:
import { queryKeys } from "@/queries/keys"

queryClient.invalidateQueries({ queryKey: queryKeys.session.all })
queryClient.invalidateQueries({ queryKey: queryKeys.users.current() })
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/hooks/useAuthMutations.ts src/queries/keys.ts
git commit -m "fix: use queryKeys factory in auth mutations instead of hardcoded keys"
```

### Task 3: Fix remaining `any` types across the codebase

**Files:**
- Modify: `src/features/groups/queries/useGroups.ts:27` — `groupData: any`
- Modify: `src/features/groups/services/api.ts:47` — `as unknown as` cast
- Modify: `src/hooks/useAppToast.tsx:7-8` — `options: string | any`
- Modify: `src/features/expenses/services/comments.ts:22,33` — `as unknown as ExpenseComment`

**Interfaces:**
- Consumes: Existing type definitions from `@/types`
- Produces: Fully type-safe function signatures

- [ ] **Step 1: Fix useGroups mutation type**

In `src/features/groups/queries/useGroups.ts`, replace `groupData: any` with proper type:
```typescript
import type { CreateGroupInput, UpdateGroupInput } from "@/types"

// In useCreateGroup mutation:
mutationFn: (groupData: CreateGroupInput) => groupsApi.createGroup(groupData)

// In useUpdateGroup mutation:
mutationFn: ({ groupId, updates }: { groupId: string; updates: UpdateGroupInput }) =>
  groupsApi.updateGroup(groupId, updates)
```

Add to `src/types/index.ts` if not present:
```typescript
export interface CreateGroupInput {
  name: string
  description?: string
  icon?: string
  currency?: string
  members: string[]
}

export interface UpdateGroupInput {
  name?: string
  description?: string
  icon?: string
  currency?: string
  default_split_method?: SplitMethod
  simplify_debts?: boolean
}
```

- [ ] **Step 2: Fix groupsApi as unknown as cast**

In `src/features/groups/services/api.ts`, replace the chain cast with a proper mapped return. Identify the exact line with `as unknown as` and replace with a mapper function that transforms the raw response to the domain type.

- [ ] **Step 3: Fix useAppToast any type**

In `src/hooks/useAppToast.tsx`, change:
```typescript
// OLD:
export function useAppToast() {
  const showToast = (options: string | any) => { ... }
}

// NEW:
export function useAppToast() {
  const showToast = (
    message: string,
    config?: { type?: "info" | "success" | "danger"; duration?: number }
  ) => { ... }
}
```

- [ ] **Step 4: Fix comments.ts as unknown as casts**

Replace `as unknown as ExpenseComment` maps with proper type-safe mapComment function (already defined in the file). Remove direct casts.

- [ ] **Step 5: Verify typecheck passes**

Run: `npm run typecheck`
Expected: Zero errors. Fix any new errors that arise from stricter types.

- [ ] **Step 6: Commit**

```bash
git add src/features/groups/queries/useGroups.ts src/features/groups/services/api.ts src/hooks/useAppToast.tsx src/features/expenses/services/comments.ts src/types/index.ts
git commit -m "fix: eliminate remaining any types, add CreateGroupInput/UpdateGroupInput types"
```

### Task 4: Fix createGroup race condition

**Files:**
- Modify: `src/features/groups/services/api.ts`

**Interfaces:**
- Consumes: Supabase client
- Produces: `createGroup` function that atomically creates group + adds creator as member, or rolls back on failure

- [ ] **Step 1: Rewrite createGroup to handle rollback**

```typescript
async function createGroup(input: CreateGroupInput): Promise<Group> {
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: input.name,
      description: input.description ?? null,
      icon: input.icon ?? "users",
      currency: input.currency ?? "USD",
      created_by: input.createdBy,
    })
    .select(groupSelect)
    .single()

  if (groupError) throw groupError

  try {
    const membersInput = input.members.map((userId) => ({
      group_id: group.id,
      user_id: userId,
    }))

    const { error: membersError } = await supabase
      .from("group_members")
      .insert(membersInput)

    if (membersError) {
      await supabase.from("groups").delete().eq("id", group.id)
      throw membersError
    }

    return mapGroup(group)
  } catch (error) {
    await supabase.from("groups").delete().eq("id", group.id).throwOnError()
    throw error
  }
}
```

- [ ] **Step 2: Verify members include creator**

Ensure the `members` array in the input includes `input.createdBy` (the creator's user ID). If not, prepend it in the function before insertion.

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`

- [ ] **Step 4: Commit**

```bash
git add src/features/groups/services/api.ts
git commit -m "fix: make createGroup atomic with rollback on member insertion failure"
```

### Task 5: Fix deleteAccount ordering

**Files:**
- Modify: `src/services/api/auth.ts`

**Interfaces:**
- Consumes: Supabase auth client
- Produces: `deleteAccount` that signs out BEFORE deleting the user row

- [ ] **Step 1: Reorder deleteAccount**

In `src/services/api/auth.ts`, find `deleteAccount` and reorder:
```typescript
async deleteAccount(): Promise<void> {
  // Step 1: Delete user row first (can still use the session)
  const { error: deleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId)

  if (deleteError) throw deleteError

  // Step 2: Sign out (invalidates session)
  const { error: signOutError } = await supabase.auth.signOut()
  // Log signOut errors but don't throw — user row is already deleted
  if (signOutError) {
    console.warn("Sign out after account deletion failed:", signOutError.message)
  }
}
```

The key insight: if signOut fails, the session is orphaned but the user data is already gone, which is safe. The old order (signOut first then delete) could leave the user row if signOut succeeded but delete failed, which is worse.

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/services/api/auth.ts
git commit -m "fix: delete user row before signOut in deleteAccount to prevent orphaned rows"
```

### Task 6: Write test suite — utilities

**Files:**
- Create: `src/utils/__tests__/balance.test.ts`
- Create: `src/utils/__tests__/date.test.ts`
- Create: `src/utils/__tests__/passwordStrength.test.ts`
- Create: `src/utils/__tests__/theme.test.ts`

**Interfaces:**
- Consumes: Functions from `src/utils/balance.ts`, `date.ts`, `passwordStrength.ts`, `theme.ts`
- Produces: Jest test files

- [ ] **Step 1: Write balance utility tests**

```typescript
// src/utils/__tests__/balance.test.ts
import { getBalanceCopy } from "../balance"

describe("getBalanceCopy", () => {
  it('returns "You owe" for positive balances', () => {
    const result = getBalanceCopy(42.50)
    expect(result.label).toBe("You owe")
  })

  it('returns "Owed to you" for negative balances', () => {
    const result = getBalanceCopy(-30)
    expect(result.label).toBe("Owed to you")
  })

  it('returns "Settled up" for zero balances', () => {
    const result = getBalanceCopy(0)
    expect(result.label).toBe("Settled up")
  })

  it("returns danger color for positive balances", () => {
    const result = getBalanceCopy(10)
    expect(result.color).toBe("danger")
  })

  it("returns success color for negative balances", () => {
    const result = getBalanceCopy(-10)
    expect(result.color).toBe("success")
  })

  it("handles very small non-zero amounts", () => {
    const result = getBalanceCopy(0.001)
    expect(result.label).toBe("You owe")
  })
})
```

- [ ] **Step 2: Write date utility tests**

```typescript
// src/utils/__tests__/date.test.ts
import { getGreeting, formatActivityDate } from "../date"

describe("getGreeting", () => {
  it("returns morning greeting before noon", () => {
    // Mock time to 9 AM
    jest.useFakeTimers().setSystemTime(new Date("2026-07-12T09:00:00"))
    expect(getGreeting()).toMatch(/morning/i)
    jest.useRealTimers()
  })
})

describe("formatActivityDate", () => {
  it('returns "Today" for today', () => {
    const today = new Date()
    today.setHours(today.getHours() - 2)
    expect(formatActivityDate(today.toISOString())).toBe("Today")
  })

  it("formats older dates correctly", () => {
    const oldDate = "2026-01-15T10:30:00Z"
    const result = formatActivityDate(oldDate)
    expect(result).toBeTruthy()
  })
})
```

- [ ] **Step 3: Write password strength tests**

```typescript
// src/utils/__tests__/passwordStrength.test.ts
import { getPasswordStrength } from "../passwordStrength"

describe("getPasswordStrength", () => {
  it("returns 0 for very short passwords", () => {
    expect(getPasswordStrength("ab")).toBe(0)
  })

  it("returns higher score for mixed character types", () => {
    const weakScore = getPasswordStrength("abcdefgh")
    const strongScore = getPasswordStrength("Abcdef1!")
    expect(strongScore).toBeGreaterThan(weakScore)
  })

  it("returns max 3", () => {
    expect(getPasswordStrength("SuperStr0ng!Pass")).toBe(3)
  })
})
```

- [ ] **Step 4: Write theme utility tests**

```typescript
// src/utils/__tests__/theme.test.ts
import { hexToRgba, getStringColor } from "../theme"

describe("hexToRgba", () => {
  it("converts hex to rgba with opacity", () => {
    expect(hexToRgba("#FF0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)")
  })
})

describe("getStringColor", () => {
  it("returns consistent colors for same input", () => {
    expect(getStringColor("test")).toBe(getStringColor("test"))
  })
})
```

- [ ] **Step 5: Run tests**

Run: `npx jest src/utils/__tests__/ --verbose`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/utils/__tests__/
git commit -m "test: add unit tests for balance, date, passwordStrength, and theme utilities"
```

### Task 7: Write test suite — validation schemas

**Files:**
- Create: `src/validation/__tests__/schemas.test.ts`

**Interfaces:**
- Consumes: Zod schemas from `src/validation/schemas.ts`
- Produces: Jest test file

- [ ] **Step 1: Write validation schema tests**

```typescript
// src/validation/__tests__/schemas.test.ts
import { loginSchema, registerSchema, forgotPasswordSchema } from "../schemas"

describe("loginSchema", () => {
  it("validates a correct login", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "123456" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "notanemail", password: "123456" })
    expect(result.success).toBe(false)
  })

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "12" })
    expect(result.success).toBe(false)
  })

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "123456" })
    expect(result.success).toBe(false)
  })
})

describe("registerSchema", () => {
  it("validates a correct registration", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "Secure1!",
      confirmPassword: "Secure1!",
    })
    expect(result.success).toBe(true)
  })

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "Secure1!",
      confirmPassword: "Different1!",
    })
    expect(result.success).toBe(false)
  })

  it("rejects short name", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "john@example.com",
      password: "Secure1!",
      confirmPassword: "Secure1!",
    })
    expect(result.success).toBe(false)
  })

  it("rejects name with numbers", () => {
    const result = registerSchema.safeParse({
      name: "John123",
      email: "john@example.com",
      password: "Secure1!",
      confirmPassword: "Secure1!",
    })
    expect(result.success).toBe(false)
  })
})

describe("forgotPasswordSchema", () => {
  it("validates a correct email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "test@example.com" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "bademail" })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npx jest src/validation/__tests__/ --verbose`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/validation/__tests__/
git commit -m "test: add validation schema tests for login, register, and forgot password"
```

### Task 8: Write test suite — mappers

**Files:**
- Create: `src/services/api/__tests__/mappers.test.ts`

**Interfaces:**
- Consumes: Mapper functions from `src/services/api/mappers.ts`
- Produces: Jest test file

- [ ] **Step 1: Write mapper tests**

```typescript
// src/services/api/__tests__/mappers.test.ts
import { mapUser, mapGroup, mapExpense } from "../mappers"

describe("mapUser", () => {
  it("maps DB row to User type", () => {
    const row = {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      avatar_url: "https://example.com/avatar.jpg",
      created_at: "2026-01-01T00:00:00Z",
      onboarding_completed: true,
    }
    const user = mapUser(row)
    expect(user.id).toBe("user-1")
    expect(user.email).toBe("test@example.com")
    expect(user.name).toBe("Test User")
    expect(user.avatarUrl).toBe("https://example.com/avatar.jpg")
    expect(user.createdAt).toBeInstanceOf(Date)
    expect(user.onboardingCompleted).toBe(true)
  })

  it("handles null avatar_url", () => {
    const row = {
      id: "user-2",
      email: "test2@example.com",
      name: "Test User 2",
      avatar_url: null,
      created_at: "2026-01-01T00:00:00Z",
      onboarding_completed: false,
    }
    const user = mapUser(row)
    expect(user.avatarUrl).toBeUndefined()
  })
})

describe("mapGroup", () => {
  it("maps DB row to Group type with members", () => {
    const row = {
      id: "group-1",
      name: "Test Group",
      description: "A test",
      icon: "users",
      currency: "USD",
      created_by: "user-1",
      created_at: "2026-01-01T00:00:00Z",
      group_members: [
        {
          user: {
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
            avatar_url: null,
            created_at: "2026-01-01T00:00:00Z",
            onboarding_completed: true,
          },
          balance: "42.50",
        },
      ],
    }
    const group = mapGroup(row)
    expect(group.id).toBe("group-1")
    expect(group.name).toBe("Test Group")
    expect(group.members).toHaveLength(1)
    expect(group.members[0].balance).toBe(42.5)
  })
})

describe("mapExpense", () => {
  it("maps DB row to Expense type with splits", () => {
    const row = {
      id: "expense-1",
      group_id: "group-1",
      amount: "100.00",
      description: "Dinner",
      category: "food",
      currency: "USD",
      paid_by: "user-1",
      created_by: "user-1",
      created_at: "2026-01-01T00:00:00Z",
      notes: null,
      receipt_url: null,
      expense_splits: [
        { user_id: "user-1", amount: "50.00", settled: true },
        { user_id: "user-2", amount: "50.00", settled: false },
      ],
    }
    const expense = mapExpense(row)
    expect(expense.id).toBe("expense-1")
    expect(expense.amount).toBe(100)
    expect(expense.splits).toHaveLength(2)
    expect(expense.splits[0].amount).toBe(50)
    expect(expense.splits[0].settled).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npx jest src/services/api/__tests__/ --verbose`
Expected: All tests pass. If mappers have different shapes than assumed, adjust test data to match actual DB return types.

- [ ] **Step 3: Commit**

```bash
git add src/services/api/__tests__/
git commit -m "test: add mapper tests for mapUser, mapGroup, and mapExpense"
```

### Task 9: Decompose DashboardScreen

**Files:**
- Modify: `src/features/dashboard/screens/DashboardScreen.tsx`
- Create: `src/features/dashboard/components/BalanceWidget.tsx`
- Create: `src/features/dashboard/components/QuickActions.tsx`
- Create: `src/features/dashboard/components/AttentionList.tsx`
- Create: `src/features/dashboard/components/DashboardGroups.tsx`
- Create: `src/features/dashboard/components/DashboardActivity.tsx`
- Create: `src/features/dashboard/components/DashboardSkeleton.tsx`

**Interfaces:**
- Consumes: Existing hooks and types from the dashboard feature
- Produces: 6 focused sub-components, DashboardScreen becomes a thin orchestrator

- [ ] **Step 1: Extract BalanceWidget**

Move the balance card section (greeting, net balance, "You owe"/"Owed to you", analytics link) into `BalanceWidget.tsx`:

```typescript
// src/features/dashboard/components/BalanceWidget.tsx
import { View } from "react-native"
import { Text } from "react-native"
import { BalanceCard } from "./BalanceCard"
import type { Balance } from "@/types"

interface BalanceWidgetProps {
  userName: string
  netBalance: number
  youOwe: number
  owedToYou: number
  onAnalyticsPress: () => void
}

export function BalanceWidget({ userName, netBalance, youOwe, owedToYou, onAnalyticsPress }: BalanceWidgetProps) {
  return (
    <View className="px-4 pt-4">
      <Text className="font-sora-semibold text-2xl text-ink mb-4">
        Hello, {userName}
      </Text>
      <BalanceCard
        netBalance={netBalance}
        youOwe={youOwe}
        owedToYou={owedToYou}
        onAnalyticsPress={onAnalyticsPress}
      />
    </View>
  )
}
```

- [ ] **Step 2: Extract QuickActions**

```typescript
// src/features/dashboard/components/QuickActions.tsx
import { View } from "react-native"
import { HapticButton } from "@/components/ui/HapticButton"
import { router } from "expo-router"

interface QuickActionsProps {
  onAddExpense: () => void
  onSettleUp: () => void
}

export function QuickActions({ onAddExpense, onSettleUp }: QuickActionsProps) {
  return (
    <View className="flex-row gap-3 px-4 py-3">
      <View className="flex-1">
        <HapticButton tone="ink" onPress={onAddExpense} accessibilityLabel="Add expense">
          + Add Expense
        </HapticButton>
      </View>
      <View className="flex-1">
        <HapticButton tone="outlined" onPress={onSettleUp} accessibilityLabel="Settle up">
          Settle Up
        </HapticButton>
      </View>
    </View>
  )
}
```

- [ ] **Step 3: Extract AttentionList, DashboardGroups, DashboardActivity**

Follow the same pattern — extract each distinct section of the Dashboard into its own component file under `src/features/dashboard/components/`. Each receives data as props, handles its own loading/empty states internally.

- [ ] **Step 4: Extract DashboardSkeleton**

Move the skeleton loading JSX into a dedicated component.

- [ ] **Step 5: Rewrite DashboardScreen as orchestrator**

```typescript
// src/features/dashboard/screens/DashboardScreen.tsx (simplified)
export default function DashboardScreen() {
  const { data, isLoading, error, refetch } = useDashboardData()

  if (isLoading) return <DashboardSkeleton />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  return (
    <ScrollView className="flex-1 bg-canvas">
      <BalanceWidget
        userName={data.userName}
        netBalance={data.netBalance}
        youOwe={data.youOwe}
        owedToYou={data.owedToYou}
        onAnalyticsPress={() => router.push("/stats")}
      />
      <QuickActions
        onAddExpense={handleAddExpense}
        onSettleUp={handleSettleUp}
      />
      {hasAttentionItems && (
        <AttentionList items={data.attentionItems} />
      )}
      <DashboardGroups groups={data.groups} />
      <DashboardActivity activities={data.activities} filter={activeFilter} onFilterChange={setActiveFilter} />
    </ScrollView>
  )
}
```

- [ ] **Step 6: Verify app builds and Dashboard renders correctly**

Run: `npx expo start` and check the Dashboard screen visually.

- [ ] **Step 7: Commit**

```bash
git add src/features/dashboard/
git commit -m "refactor: decompose DashboardScreen into 6 focused sub-components"
```

### Task 10: Decompose useExpenseForm

**Files:**
- Modify: `src/features/expenses/hooks/useExpenseForm.ts`
- Create: `src/features/expenses/hooks/useSplitCalculator.ts`
- Create: `src/features/expenses/hooks/useParticipantManager.ts`
- Create: `src/features/expenses/hooks/useCategorySuggestion.ts`
- Create: `src/features/expenses/hooks/useReceiptUpload.ts`

**Interfaces:**
- Consumes: Existing type definitions
- Produces: 4 focused hooks, useExpenseForm becomes an orchestrator composing them

- [ ] **Step 1: Extract useSplitCalculator**

Pull split calculation logic (equal splits, custom amounts, percentage splits, validation that amounts sum to total) into `useSplitCalculator.ts`:

```typescript
// src/features/expenses/hooks/useSplitCalculator.ts
import { useCallback } from "react"
import type { SplitMethod, ExpenseSplit } from "@/types"

interface UseSplitCalculatorInput {
  totalAmount: number
  splitMethod: SplitMethod
  participants: string[]
  customAmounts: Record<string, number>
  customPercentages: Record<string, number>
}

export function useSplitCalculator(input: UseSplitCalculatorInput) {
  const calculateSplits = useCallback((): ExpenseSplit[] => {
    // Equal splits, custom amounts, percentage splits logic here
    return []
  }, [input])

  const validateSplits = useCallback((): string | null => {
    // Validate splits sum to total amount / 100%
    return null // null = valid, string = error message
  }, [input])

  return { calculateSplits, validateSplits }
}
```

- [ ] **Step 2: Extract useParticipantManager**

```typescript
// src/features/expenses/hooks/useParticipantManager.ts
import { useState, useCallback } from "react"

export function useParticipantManager(initialParticipants: string[] = []) {
  const [participants, setParticipants] = useState<string[]>(initialParticipants)

  const addParticipant = useCallback((userId: string) => {
    setParticipants((prev) => (prev.includes(userId) ? prev : [...prev, userId]))
  }, [])

  const removeParticipant = useCallback((userId: string) => {
    setParticipants((prev) => prev.filter((id) => id !== userId))
  }, [])

  const toggleParticipant = useCallback((userId: string) => {
    setParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }, [])

  return { participants, setParticipants, addParticipant, removeParticipant, toggleParticipant }
}
```

- [ ] **Step 3: Extract useCategorySuggestion**

```typescript
// src/features/expenses/hooks/useCategorySuggestion.ts
import { useMemo } from "react"

const CATEGORY_HEURISTICS: Array<{ minAmount: number; maxAmount?: number; keywords: string[]; category: string }> = [
  { minAmount: 5, maxAmount: 50, keywords: ["coffee", "lunch", "dinner", "food", "pizza", "sushi", "burger"], category: "food" },
  { minAmount: 5, maxAmount: 60, keywords: ["uber", "lyft", "taxi", "gas", "fuel", "transport", "bus", "train"], category: "transport" },
  { minAmount: 50, maxAmount: 500, keywords: ["rent", "utilities", "electricity", "water", "internet"], category: "utilities" },
  { minAmount: 100, keywords: ["hotel", "flight", "airbnb", "booking"], category: "travel" },
  { minAmount: 10, maxAmount: 100, keywords: ["movie", "concert", "ticket", "game", "drinks", "bar"], category: "entertainment" },
]

export function useCategorySuggestion(amount: number, description: string): string {
  return useMemo(() => {
    const lowerDesc = description.toLowerCase()
    for (const rule of CATEGORY_HEURISTICS) {
      if (amount < rule.minAmount) continue
      if (rule.maxAmount && amount > rule.maxAmount) continue
      if (rule.keywords.some((kw) => lowerDesc.includes(kw))) {
        return rule.category
      }
    }
    return "other"
  }, [amount, description])
}
```

- [ ] **Step 4: Rewrite useExpenseForm as orchestrator**

```typescript
// src/features/expenses/hooks/useExpenseForm.ts (simplified)
export function useExpenseForm(existingExpense?: Expense) {
  const { participants, addParticipant, removeParticipant, toggleParticipant } = useParticipantManager(
    existingExpense?.splits.map((s) => s.userId) ?? []
  )
  const { calculateSplits, validateSplits } = useSplitCalculator({ ... })
  const suggestedCategory = useCategorySuggestion(amount, description)
  // ... form state, submission logic
}
```

- [ ] **Step 5: Verify typecheck and build**

Run: `npm run typecheck && npx expo start`

- [ ] **Step 6: Commit**

```bash
git add src/features/expenses/hooks/
git commit -m "refactor: decompose useExpenseForm into useSplitCalculator, useParticipantManager, useCategorySuggestion"
```

### Task 11: Standardize styling approach

**Files:**
- Modify: All screen files in `src/features/*/screens/` that use `StyleSheet.create`
- Modify: All component files in `src/features/*/components/` that use `StyleSheet.create`
- Modify: `src/components/ui/native-ui.tsx`

**Interfaces:**
- Consumes: Uniwind/Tailwind className system, existing `native-ui.tsx` style helpers
- Produces: Consistent use of Uniwind className throughout the codebase

- [ ] **Step 1: Audit files using StyleSheet.create**

Run: `grep -r "StyleSheet.create" src/ --include="*.tsx" -l`

- [ ] **Step 2: Convert each file to Uniwind className**

For each file found, migrate from:
```typescript
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F6F1", padding: 16 },
  title: { fontSize: 24, fontFamily: "Sora_600SemiBold", color: "#1A1A1A" },
})
// usage: <View style={styles.container}><Text style={styles.title}></Text></View>
```
To:
```typescript
// usage: <View className="flex-1 bg-canvas p-4"><Text className="font-sora-semibold text-2xl text-ink"></Text></View>
```

Map colors to design tokens:
- `#F7F6F1` → `bg-canvas`
- `#FEFDFA` → `bg-ivory`
- `#FFFFFF` → `bg-white`
- `#1A1A1A` → `text-ink`
- `#E7E5DE` → `border-warm`
- `#E85D5D` → `text-danger`
- `#4CAF82` → `text-success`

- [ ] **Step 3: Add missing Tailwind tokens to global.css if needed**

Verify `global.css` has token aliases for all used design tokens.

- [ ] **Step 4: Verify visual consistency**

Run: `npx expo start` and spot-check 5-6 screens for visual regressions.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "style: standardize all screens to use Uniwind className instead of StyleSheet.create"
```

### Task 12: Add feature-level error boundaries

**Files:**
- Create: `src/components/feedback/FeatureErrorBoundary.tsx`
- Modify: All feature screen files to wrap with error boundary

**Interfaces:**
- Consumes: React error boundary pattern
- Produces: `FeatureErrorBoundary` component, wrapping all screen exports

- [ ] **Step 1: Create FeatureErrorBoundary**

```typescript
// src/components/feedback/FeatureErrorBoundary.tsx
import React from "react"
import { View } from "react-native"
import { Text } from "react-native"
import { HapticButton } from "@/components/ui/HapticButton"
import { ErrorFallback } from "./ErrorFallback"

interface Props {
  children: React.ReactNode
  featureName: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[${this.props.featureName}] Error:`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-canvas items-center justify-center p-8">
          <ErrorFallback
            error={this.state.error!}
            resetError={this.handleRetry}
          />
        </View>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 2: Wrap all screen exports**

For each screen file in `src/features/*/screens/` and `src/app/`, wrap the default export:
```typescript
// Before:
export default function DashboardScreen() { ... }

// After:
function DashboardScreen() { ... }
export default function DashboardScreenWithErrorBoundary() {
  return (
    <FeatureErrorBoundary featureName="Dashboard">
      <DashboardScreen />
    </FeatureErrorBoundary>
  )
}
```

Alternative: create an `withErrorBoundary` HOC:
```typescript
// src/components/feedback/withErrorBoundary.tsx
import React from "react"
import { FeatureErrorBoundary } from "./FeatureErrorBoundary"

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  featureName: string
) {
  return function WrappedComponent(props: P) {
    return (
      <FeatureErrorBoundary featureName={featureName}>
        <Component {...props} />
      </FeatureErrorBoundary>
    )
  }
}
```

- [ ] **Step 3: Verify error boundaries work**

Temporarily throw an error in one screen component and verify the error boundary catches it and shows the fallback UI.

- [ ] **Step 4: Commit**

```bash
git add src/components/feedback/FeatureErrorBoundary.tsx src/components/feedback/withErrorBoundary.tsx
git commit -m "feat: add feature-level error boundaries with retry capability"
```

### Task 13: Move useReducedMotion and fix package.json name

**Files:**
- Move: `src/utils/useReducedMotion.ts` → `src/hooks/useReducedMotion.ts`
- Modify: All imports of `useReducedMotion`
- Modify: `package.json`

**Interfaces:**
- Consumes: React hooks, AccessibilityInfo API
- Produces: `useReducedMotion` hook in correct directory

- [ ] **Step 1: Move the file and update imports**

```bash
mv src/utils/useReducedMotion.ts src/hooks/useReducedMotion.ts
```

Find and update all imports:
```bash
grep -r "from.*utils/useReducedMotion" src/ --include="*.tsx" --include="*.ts" -l
```

Update each import from `"@/utils/useReducedMotion"` to `"@/hooks/useReducedMotion"`.

- [ ] **Step 2: Fix package.json name**

In `package.json`, change:
```json
"name": "my-heroui-native-app"
```
to:
```json
"name": "splt"
```

- [ ] **Step 3: Verify build**

Run: `npx expo start`
Expected: App builds and runs without import errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useReducedMotion.ts src/utils/useReducedMotion.ts package.json
git commit -m "chore: move useReducedMotion to hooks/, fix package.json name to splt"
```

### Task 14: Deduplicate balance calculations

**Files:**
- Modify: `src/utils/balance.ts` (expand to be single source of truth)
- Modify: `src/features/dashboard/screens/DashboardScreen.tsx` (use centralized utils)
- Modify: `src/features/groups/hooks/useGroupDetailData.ts` (use centralized utils)
- Modify: `src/features/settlements/utils/balances.ts` (consolidate into balance.ts)
- Modify: `src/features/settlements/hooks/useBalances.ts` (use centralized utils)

**Interfaces:**
- Consumes: Existing balance calculation logic from multiple files
- Produces: Single `src/utils/balance.ts` that exports all balance-related functions

- [ ] **Step 1: Consolidate all balance logic into src/utils/balance.ts**

Move these functions into `src/utils/balance.ts`:
- `getUserBalances()` from `settlements/utils/balances.ts`
- `getGroupBalances()` from `settlements/utils/balances.ts`
- `getSimplifiedDebts()` from `settlements/utils/balances.ts`
- `getExactPairwiseDebts()` from `settlements/utils/balances.ts`
- Balance computation from `useGroupDetailData.ts`
- Net balance helpers from `DashboardScreen.tsx`

Export all as named exports:
```typescript
// src/utils/balance.ts
export { getUserBalances } from "./getUserBalances"
export { getGroupBalances } from "./getGroupBalances"
export { getSimplifiedDebts } from "./getSimplifiedDebts"
export { getExactPairwiseDebts } from "./getExactPairwiseDebts"
export { getBalanceCopy } from "./getBalanceCopy"
export { getNetBalance } from "./getNetBalance"
```

- [ ] **Step 2: Delete old balance files**

Remove `src/features/settlements/utils/balances.ts` after confirming all consumers import from `@/utils/balance`.

- [ ] **Step 3: Update all imports**

Run: `grep -r "from.*balances" src/ --include="*.tsx" --include="*.ts"` and update all to `@/utils/balance`.

- [ ] **Step 4: Verify typecheck and build**

Run: `npm run typecheck && npx expo start`

- [ ] **Step 5: Commit**

```bash
git add src/utils/balance/ src/features/settlements/utils/ src/features/groups/hooks/ src/features/settlements/hooks/ src/features/dashboard/
git commit -m "refactor: consolidate all balance calculations into src/utils/balance"
```

### Task 15: Make currentUser nullable

**Files:**
- Modify: `src/context/AppContext.tsx`
- Modify: All consumers of `useAuth().currentUser`

**Interfaces:**
- Consumes: AuthContext
- Produces: `currentUser: User | null` instead of fallback empty User object

- [ ] **Step 1: Change currentUser type and remove fallback**

In `src/context/AppContext.tsx`:
```typescript
// OLD:
const [currentUser, setCurrentUser] = useState<User>({
  id: "",
  email: "",
  name: "",
  // ... all empty fields
})

// NEW:
const [currentUser, setCurrentUser] = useState<User | null>(null)
```

Update `loadSession()` to handle null:
```typescript
const user = await AuthService.getCurrentUser()
if (mounted) {
  setCurrentUser(user ?? null)
}
```

- [ ] **Step 2: Update the AuthContext type**

```typescript
// OLD:
interface AuthContextType {
  currentUser: User
  // ...
}

// NEW:
interface AuthContextType {
  currentUser: User | null
  // ...
}
```

- [ ] **Step 3: Update all consumers**

Find all places that use `currentUser` and guard against null:
```bash
grep -r "currentUser" src/ --include="*.tsx" --include="*.ts" -l
```

Add null checks:
```typescript
// Before:
const { currentUser } = useAuth()
<Text>Hello, {currentUser.name}</Text>

// After:
const { currentUser } = useAuth()
if (!currentUser) return null
<Text>Hello, {currentUser.name}</Text>
```

- [ ] **Step 4: Verify typecheck and auth flow**

Run: `npm run typecheck`
Expected: Zero errors. Test login/logout flow to ensure guards work correctly.

- [ ] **Step 5: Commit**

```bash
git add src/context/AppContext.tsx
git commit -m "fix: make currentUser nullable (User | null) instead of fallback empty object"
```

---

## Phase 2: New IA + Core Screens (Weeks 4-7)

### Task 16: Create redesigned Tab Bar component

**Files:**
- Create: `src/components/ui/TabBar.tsx`
- Modify: `src/app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: Expo Router Tabs, Lucide icons, Animated API
- Produces: `TabBar` component with floating pill shape, blur backdrop, animated active indicator, no text labels

- [ ] **Step 1: Create TabBar component**

```typescript
// src/components/ui/TabBar.tsx
import { View, Pressable, Platform } from "react-native"
import { BlurView } from "expo-blur"
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated"
import { House, Users, UserRound, CircleUserRound } from "lucide-react-native"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"

const ICONS: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth: number }>> = {
  feed: House,
  groups: Users,
  friends: UserRound,
  profile: CircleUserRound,
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 items-center pb-safe">
      <BlurView intensity={80} tint="light" className="overflow-hidden rounded-full border border-warm">
        <View className="flex-row h-16 items-center px-2">
          {state.routes.map((route, index) => {
            const isFocused = state.index === index
            const Icon = ICONS[route.name] ?? House
            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name)
                  }
                }}
                className="flex-1 items-center justify-center h-12"
                accessibilityLabel={route.name}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
              >
                <Icon size={24} color={isFocused ? "#1A1A1A" : "#9C9A94"} strokeWidth={isFocused ? 2.5 : 1.5} />
              </Pressable>
            )
          })}
        </View>
      </BlurView>
    </View>
  )
}
```

- [ ] **Step 2: Update tabs layout**

```typescript
// src/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router"
import { TabBar } from "@/components/ui/TabBar"

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="groups" options={{ title: "Groups" }} />
      <Tabs.Screen name="friends" options={{ title: "Friends" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  )
}
```

- [ ] **Step 3: Create placeholder route files**

Create `src/app/(tabs)/feed.tsx`, `src/app/(tabs)/profile.tsx` if not exist. Update `src/app/(tabs)/groups.tsx` and `friends.tsx` to point to feature screens.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/TabBar.tsx src/app/(tabs)/
git commit -m "feat: add redesigned floating pill tab bar with blur backdrop"
```

### Task 17: Build Feed screen (collapsible balance header)

**Files:**
- Create: `src/features/feed/screens/FeedScreen.tsx`
- Create: `src/features/feed/components/BalanceHeader.tsx`
- Create: `src/features/feed/components/QuickStatsRow.tsx`
- Create: `src/features/feed/queries/useFeed.ts`
- Create: `src/app/(tabs)/feed.tsx`

**Interfaces:**
- Consumes: useAuth, React Query, FlashList, Reanimated
- Produces: Feed screen with collapsible balance header, quick stats, unified activity feed

- [ ] **Step 1: Create feed query hook**

```typescript
// src/features/feed/queries/useFeed.ts
import { useQuery } from "@tanstack/react-query"
import { activitiesApi } from "@/features/activity/services/api"
import { useAuth } from "@/context/AppContext"
import { queryKeys } from "@/queries/keys"

export function useFeed() {
  const { currentUser } = useAuth()

  return useQuery({
    queryKey: queryKeys.activities.feed(),
    queryFn: () => activitiesApi.fetchActivities(currentUser?.id ?? ""),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
  })
}
```

- [ ] **Step 2: Create collapsible BalanceHeader**

```typescript
// src/features/feed/components/BalanceHeader.tsx
import { View } from "react-native"
import { Text } from "react-native"
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from "react-native-reanimated"
import type { SharedValue } from "react-native-reanimated"

interface BalanceHeaderProps {
  scrollY: SharedValue<number>
  netBalance: number
  youOwe: number
  owedToYou: number
  onAnalyticsPress: () => void
}

export function BalanceHeader({ scrollY, netBalance, youOwe, owedToYou, onAnalyticsPress }: BalanceHeaderProps) {
  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, 150], [180, 60], Extrapolation.CLAMP),
    opacity: interpolate(scrollY.value, [0, 150], [1, 0.9], Extrapolation.CLAMP),
  }))

  const amountStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(scrollY.value, [0, 150], [36, 18], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 150], [0, -8], Extrapolation.CLAMP) }],
  }))

  const detailStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
  }))

  return (
    <Animated.View className="bg-ivory border border-warm rounded-2xl mx-4 overflow-hidden" style={headerStyle}>
      <View className="p-4 items-center justify-center flex-1">
        <Animated.Text
          className="font-sora-semibold text-ink"
          style={amountStyle}
        >
          ${Math.abs(netBalance).toFixed(2)}
        </Animated.Text>
        <Animated.View style={detailStyle}>
          <Text className="font-ibmplexsans text-sm mt-1">
            {netBalance > 0 ? "You owe" : "Owed to you"}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  )
}
```

- [ ] **Step 3: Create QuickStatsRow**

```typescript
// src/features/feed/components/QuickStatsRow.tsx
import { View, Pressable } from "react-native"
import { Text } from "react-native"

interface StatPill {
  label: string
  value: string
  onPress: () => void
}

export function QuickStatsRow({ pills }: { pills: StatPill[] }) {
  return (
    <View className="flex-row gap-2 px-4 py-2">
      {pills.map((pill) => (
        <Pressable
          key={pill.label}
          onPress={pill.onPress}
          className="bg-ivory border border-warm rounded-full px-4 py-2"
          accessibilityLabel={`${pill.label}: ${pill.value}`}
          accessibilityRole="button"
        >
          <Text className="font-ibmplexsans-semibold text-xs text-brand uppercase tracking-wider">
            {pill.label}
          </Text>
          <Text className="font-sora-semibold text-sm text-ink">{pill.value}</Text>
        </Pressable>
      ))}
    </View>
  )
}
```

- [ ] **Step 4: Create FeedCard and SwipeableFeedCard**

Adapt the existing `TransactionRow` and `ActivityItem` into a unified `FeedCard` component. Add swipe gesture wrapper using `react-native-gesture-handler` for swipe-right (mark reviewed) and swipe-left (quick actions).

- [ ] **Step 5: Compose FeedScreen**

```typescript
// src/features/feed/screens/FeedScreen.tsx
export default function FeedScreen() {
  const scrollY = useSharedValue(0)
  const { currentUser } = useAuth()
  const { data, isLoading, error, refetch } = useFeed()

  return (
    <View className="flex-1 bg-canvas">
      <ScreenHeader title="Feed" />
      <Animated.FlatList
        data={data ?? []}
        renderItem={({ item }) => <FeedCard item={item} />}
        ListHeaderComponent={
          <>
            <BalanceHeader scrollY={scrollY} {...balanceProps} />
            <QuickStatsRow pills={statsPills} />
          </>
        }
        onScroll={useAnimatedScrollHandler({
          onScroll: (e) => { scrollY.value = e.contentOffset.y }
        })}
        scrollEventThrottle={16}
      />
      <FloatingAddButton onPress={handleQuickAdd} />
    </View>
  )
}
```

- [ ] **Step 6: Create route file**

```typescript
// src/app/(tabs)/feed.tsx
import FeedScreen from "@/features/feed/screens/FeedScreen"
export default FeedScreen
```

- [ ] **Step 7: Verify feed renders with all states**

Test: loading (skeleton), data (cards), empty (illustration + CTA), error (retry button).

- [ ] **Step 8: Commit**

```bash
git add src/features/feed/ src/app/(tabs)/feed.tsx
git commit -m "feat: add Feed screen with collapsible balance header, quick stats, and unified activity feed"
```

### Task 18: Build Floating Quick-Add button and sheet

**Files:**
- Create: `src/features/quick-add/components/FloatingAddButton.tsx`
- Create: `src/features/quick-add/components/AmountKeypad.tsx`
- Create: `src/features/quick-add/components/ContextCarousel.tsx`
- Create: `src/features/quick-add/components/SplitPreview.tsx`
- Create: `src/features/quick-add/components/CategorySuggestion.tsx`
- Create: `src/features/quick-add/hooks/useQuickAdd.ts`
- Create: `src/features/quick-add/screens/QuickAddSheet.tsx`
- Create: `src/components/ui/Keypad.tsx`

**Interfaces:**
- Produces: Floating button with idle pulse animation, bottom sheet with amount-first entry
- Consumes: Gorhom Bottom Sheet, Reanimated, expo-haptics, existing expense API

- [ ] **Step 1: Create FloatingAddButton**

```typescript
// src/features/quick-add/components/FloatingAddButton.tsx
import { Pressable } from "react-native"
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSpring, useSharedValue } from "react-native-reanimated"
import { Plus } from "lucide-react-native"
import * as Haptics from "expo-haptics"

interface FloatingAddButtonProps {
  onPress: () => void
}

export function FloatingAddButton({ onPress }: FloatingAddButtonProps) {
  const scale = useSharedValue(1)

  scale.value = withRepeat(
    withTiming(1.05, { duration: 2000 }),
    -1,
    true
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <Animated.View className="absolute bottom-24 items-center w-full" style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        className="w-14 h-14 rounded-full bg-ink items-center justify-center shadow-lg"
        accessibilityLabel="Add expense"
        accessibilityRole="button"
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>
    </Animated.View>
  )
}
```

- [ ] **Step 2: Create reusable Keypad component**

```typescript
// src/components/ui/Keypad.tsx
import { View, Pressable } from "react-native"
import { Text } from "react-native"
import * as Haptics from "expo-haptics"
import { Delete } from "lucide-react-native"

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
]

interface KeypadProps {
  onKeyPress: (key: string) => void
}

export function Keypad({ onKeyPress }: KeypadProps) {
  const handlePress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onKeyPress(key)
  }

  return (
    <View className="px-2">
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-around py-1">
          {row.map((key) => (
            <Pressable
              key={key}
              onPress={() => handlePress(key)}
              className={`w-20 h-16 items-center justify-center rounded-xl ${
                key === "⌫" ? "bg-transparent" : "bg-control active:bg-warm"
              }`}
              accessibilityLabel={key === "⌫" ? "Delete" : `Number ${key}`}
              accessibilityRole="button"
            >
              {key === "⌫" ? (
                <Delete size={24} color="#1A1A1A" />
              ) : (
                <Text className="font-sora-semibold text-2xl text-ink">{key}</Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  )
}
```

- [ ] **Step 3: Create QuickAddSheet with 4-step flow**

The sheet manages 4 internal states: `"amount" | "context" | "split" | "confirm"`. Each state renders a different step component.

```typescript
// src/features/quick-add/screens/QuickAddSheet.tsx
export function QuickAddSheet({ groupId, friendId, onDismiss, onSuccess }: QuickAddSheetProps) {
  const {
    step, amount, setAmount,
    paidBy, selectedGroup, selectedFriends,
    splitMethod, splits, suggestedCategory,
    goNext, goBack, submit,
    isSubmitting, error,
  } = useQuickAdd({ groupId, friendId })

  return (
    <View className="flex-1 bg-canvas rounded-t-2xl">
      {/* Step indicator */}
      <View className="flex-row justify-center gap-1 py-3">
        {[0, 1, 2, 3].map((s) => (
          <View
            key={s}
            className={`h-1 rounded-full transition-all ${s <= step ? "w-6 bg-ink" : "w-2 bg-warm"}`}
          />
        ))}
      </View>

      {/* Step content */}
      {step === 0 && <AmountStep amount={amount} onKeyPress={handleKeyPress} onNext={goNext} />}
      {step === 1 && <ContextStep onSelectGroup={...} onSelectFriend={...} onNext={goNext} />}
      {step === 2 && <SplitStep splits={splits} category={suggestedCategory} onNext={goNext} />}
      {step === 3 && <ConfirmStep amount={amount} splits={splits} onSubmit={submit} isSubmitting={isSubmitting} error={error} />}
    </View>
  )
}
```

- [ ] **Step 4: Wire to FloatingAddButton**

In the Feed screen, use Gorhom Bottom Sheet:
```typescript
const quickAddSheetRef = useRef<BottomSheetModal>(null)

const handleQuickAdd = () => {
  quickAddSheetRef.current?.present()
}
```

- [ ] **Step 5: Write useQuickAdd hook with full form state**

Handle: amount parsing, decimal handling, context selection (group vs friend), split method selection (equal/custom/percentage), category suggestion, submission with optimistic update.

- [ ] **Step 6: Commit**

```bash
git add src/features/quick-add/ src/components/ui/Keypad.tsx
git commit -m "feat: add floating quick-add button with amount-first 4-step bottom sheet flow"
```

### Task 19: Build new Group Detail with tabbed content

**Files:**
- Create: `src/features/groups/components/GroupDetailHeader.tsx`
- Create: `src/features/groups/components/GroupTabBar.tsx`
- Create: `src/features/groups/components/GroupExpensesTab.tsx`
- Create: `src/features/groups/components/GroupBalancesTab.tsx`
- Create: `src/features/groups/components/GroupMembersTab.tsx`
- Create: `src/features/groups/components/GroupStatsTab.tsx`
- Modify: `src/features/groups/screens/GroupDetailScreen.tsx`

**Interfaces:**
- Produces: Group detail with animated header, 4 swipeable tabs (Expenses, Balances, Members, Stats)
- Consumes: useGroupDetailData, FlashList, Reanimated, react-native-gifted-charts

- [ ] **Step 1: Create GroupTabBar**

```typescript
// src/features/groups/components/GroupTabBar.tsx
import { View, Pressable } from "react-native"
import { Text } from "react-native"
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated"

const TABS = ["Expenses", "Balances", "Members", "Stats"] as const

export function GroupTabBar({ activeTab, onTabChange }: {
  activeTab: number
  onTabChange: (index: number) => void
}) {
  return (
    <View className="flex-row bg-canvas border-b border-warm">
      {TABS.map((tab, index) => (
        <Pressable
          key={tab}
          onPress={() => onTabChange(index)}
          className="flex-1 items-center py-3"
          accessibilityLabel={tab}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === index }}
        >
          <Text className={`font-ibmplexsans-semibold text-sm ${
            activeTab === index ? "text-ink" : "text-muted"
          }`}>
            {tab}
          </Text>
          {activeTab === index && (
            <View className="absolute bottom-0 h-0.5 w-12 bg-ink rounded-full" />
          )}
        </Pressable>
      ))}
    </View>
  )
}
```

- [ ] **Step 2: Create GroupBalancesTab with visual debt graph**

```typescript
// src/features/groups/components/GroupBalancesTab.tsx
export function GroupBalancesTab({ balances, members, onSettleUp }: GroupBalancesTabProps) {
  const debts = getSimplifiedDebts(balances, members)

  return (
    <ScrollView className="p-4">
      {debts.map((debt) => (
        <View key={`${debt.from}-${debt.to}`} className="flex-row items-center bg-ivory border border-warm rounded-xl p-4 mb-3">
          <MemberAvatar userId={debt.from} size="sm" />
          <ArrowRight size={20} color="#E85D5D" className="mx-2" />
          <MemberAvatar userId={debt.to} size="sm" />
          <View className="flex-1 ml-3">
            <Text className="font-ibmplexsans text-sm text-ink">{debt.fromName} owes {debt.toName}</Text>
            <Text className="font-sora-semibold text-lg text-danger">${debt.amount.toFixed(2)}</Text>
          </View>
          <HapticButton tone="outlined" size="sm" onPress={() => onSettleUp(debt)}>
            Settle
          </HapticButton>
        </View>
      ))}
      {debts.length === 0 && (
        <EmptyState icon="check-circle" title="All settled up" subtitle="No one owes anyone in this group" />
      )}
    </ScrollView>
  )
}
```

- [ ] **Step 3: Create GroupMembersTab**

Grid of member avatars with name + balance. Long-press for remove (with confirmation).

- [ ] **Step 4: Create GroupStatsTab**

Uses `react-native-gifted-charts` for donut chart (category breakdown) and bar chart (spending over time).

- [ ] **Step 5: Update GroupDetailScreen**

```typescript
export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const { group, expenses, balances, isLoading, error } = useGroupDetailData(groupId)
  const [activeTab, setActiveTab] = useState(0)

  if (isLoading) return <GroupDetailSkeleton />
  if (error || !group) return <ErrorState message={error?.message ?? "Group not found"} />

  return (
    <View className="flex-1 bg-canvas">
      <GroupDetailHeader group={group} />
      <GroupTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 0 && <GroupExpensesTab groupId={groupId} expenses={expenses} />}
      {activeTab === 1 && <GroupBalancesTab balances={balances} members={group.members} onSettleUp={handleSettleUp} />}
      {activeTab === 2 && <GroupMembersTab members={group.members} groupId={groupId} />}
      {activeTab === 3 && <GroupStatsTab groupId={groupId} expenses={expenses} />}
      <FloatingGroupActions onAddExpense={handleAddExpense} onSettleUp={handleSettleUp} />
    </View>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/features/groups/
git commit -m "feat: add tabbed group detail with Expenses, Balances, Members, and Stats tabs"
```

### Task 20: Build new Friend Detail

**Files:**
- Create: `src/features/friends/components/SharedExpensesTimeline.tsx`
- Create: `src/features/friends/components/MutualGroups.tsx`
- Modify: `src/features/friends/screens/FriendDetailScreen.tsx`

**Interfaces:**
- Produces: Friend detail with shared expenses, mutual groups, and quick action buttons
- Consumes: useFriends, useExpenses, React Query

- [ ] **Step 1: Create SharedExpensesTimeline**

Filters all user expenses to show only those shared with this friend, displayed as FeedCard components.

- [ ] **Step 2: Create MutualGroups**

Finds groups both users belong to and displays as horizontal scroll of mini group cards.

- [ ] **Step 3: Update FriendDetailScreen**

```typescript
export default function FriendDetailScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>()

  return (
    <ScrollView className="flex-1 bg-canvas">
      <View className="items-center p-6">
        <MemberAvatar userId={friendId} size="lg" />
        <Text className="font-sora-semibold text-xl text-ink mt-3">{friend.name}</Text>
        <MoneySignal amount={balance} className="mt-1" />
      </View>
      <View className="flex-row gap-3 px-4 mb-4">
        <HapticButton tone="ink" onPress={handleSettleUp} className="flex-1">Settle Up</HapticButton>
        <HapticButton tone="outlined" onPress={handleAddExpense} className="flex-1">Add Expense</HapticButton>
      </View>
      <MutualGroups groups={mutualGroups} />
      <SectionLabel className="px-4 mt-4">Shared Expenses</SectionLabel>
      <SharedExpensesTimeline expenses={sharedExpenses} />
    </ScrollView>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/friends/
git commit -m "feat: add enhanced friend detail with shared expenses timeline and mutual groups"
```

---

## Phase 3: Supporting Screens (Weeks 8-10)

### Task 21: Redesign Auth Welcome screen

**Files:**
- Modify: `src/app/(auth)/welcome.tsx`

**Interfaces:**
- Produces: Welcome screen with Lottie animation, Google/Apple pill buttons, email CTA

- [ ] **Step 1: Add Lottie animation file**

Download or create a Lottie JSON file for the welcome screen (abstract illustration of people splitting a bill). Place at `assets/lottie/welcome.json`.

- [ ] **Step 2: Redesign welcome screen**

```typescript
// src/app/(auth)/welcome.tsx
import LottieView from "lottie-react-native"
import { View, Text, Pressable } from "react-native"
import { router } from "expo-router"
import { useAuthMutations } from "@/features/auth/hooks/useAuthMutations"

export default function WelcomeScreen() {
  const { signInWithGoogle, signInWithApple } = useAuthMutations()

  return (
    <View className="flex-1 bg-canvas items-center justify-center px-8">
      <LottieView
        source={require("@/assets/lottie/welcome.json")}
        autoPlay
        loop
        className="w-64 h-64"
      />
      <Text className="font-sora-semibold text-3xl text-ink text-center mt-8">
        Splt
      </Text>
      <Text className="font-ibmplexsans text-base text-muted text-center mt-2">
        Split expenses, not friendships
      </Text>

      <View className="w-full mt-12 gap-3">
        <Pressable
          onPress={signInWithGoogle}
          className="flex-row items-center justify-center h-14 rounded-full border border-warm bg-control"
          accessibilityLabel="Continue with Google"
        >
          <GoogleLogo className="mr-2" />
          <Text className="font-ibmplexsans-semibold text-base text-ink">Continue with Google</Text>
        </Pressable>

        <Pressable
          onPress={signInWithApple}
          className="flex-row items-center justify-center h-14 rounded-full bg-ink"
          accessibilityLabel="Continue with Apple"
        >
          <AppleLogo className="mr-2" color="white" />
          <Text className="font-ibmplexsans-semibold text-base text-white">Continue with Apple</Text>
        </Pressable>

        <View className="flex-row items-center my-2">
          <View className="flex-1 h-px bg-warm" />
          <Text className="mx-4 font-ibmplexsans text-sm text-muted">or</Text>
          <View className="flex-1 h-px bg-warm" />
        </View>

        <Pressable
          onPress={() => router.push("/(auth)/register")}
          className="items-center justify-center h-14 rounded-full border border-ink"
          accessibilityLabel="Sign up with email"
        >
          <Text className="font-ibmplexsans-semibold text-base text-ink">Sign up with email</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.push("/(auth)/login")} className="mt-6">
        <Text className="font-ibmplexsans text-sm text-muted">
          Already have an account? <Text className="text-ink font-ibmplexsans-semibold">Log in</Text>
        </Text>
      </Pressable>
    </View>
  )
}
```

- [ ] **Step 2: Verify on both platforms**

Run on iOS and Android simulators.

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/welcome.tsx assets/lottie/welcome.json
git commit -m "feat: redesign welcome screen with Lottie animation and social auth pill buttons"
```

### Task 22: Redesign Login with biometric-first flow

**Files:**
- Modify: `src/app/(auth)/login.tsx`

**Interfaces:**
- Produces: Login with Face ID/Touch ID as primary CTA, email as fallback, animated password toggle

- [ ] **Step 1: Redesign login screen**

Biometric button prominently at top. Email/password fields below with "or use email" divider. Error state with shake animation using Reanimated.

```typescript
import Animated, { useAnimatedStyle, withSequence, withTiming } from "react-native-reanimated"

// Shake animation for errors
const shakeStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: shake.value }],
}))
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/login.tsx
git commit -m "feat: redesign login with biometric-first flow and shake error animation"
```

### Task 23: Redesign Register with progressive disclosure

**Files:**
- Modify: `src/app/(auth)/register.tsx`

**Interfaces:**
- Produces: 2-step registration (Step 1: name+email, Step 2: password+confirm), animated strength meter

- [ ] **Step 1: Implement 2-step form**

Use internal state to toggle between steps. Step 1 shows name + email with "Continue" button. Step 2 shows password + confirm with strength meter and "Create account" button. Back button returns to step 1.

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/register.tsx
git commit -m "feat: redesign register with 2-step progressive disclosure and password strength meter"
```

### Task 24: Redesign Onboarding

**Files:**
- Modify: `src/features/onboarding/screens/OnboardingScreen.tsx`
- Modify: `src/features/onboarding/constants/slides.ts`
- Create: `src/features/onboarding/components/CurrencyStep.tsx`
- Create: `src/features/onboarding/components/TagSelector.tsx`

**Interfaces:**
- Produces: 4-slide interactive onboarding with currency picker, preference tags, contacts import option

- [ ] **Step 1: Update slides configuration**

```typescript
// src/features/onboarding/constants/slides.ts
export const ONBOARDING_SLIDES = [
  {
    id: "welcome",
    title: "Split expenses, not friendships",
    description: "Splt makes it easy to share costs with friends, roommates, and travel buddies.",
    lottie: require("@/assets/lottie/onboarding-1.json"),
  },
  {
    id: "currency",
    title: "Choose your currency",
    description: "We'll show all amounts in your preferred format.",
  },
  {
    id: "tags",
    title: "What describes you?",
    description: "We'll customize your experience based on how you split.",
  },
  {
    id: "friends",
    title: "Find your friends",
    description: "Connect with people you already know on Splt.",
  },
]
```

- [ ] **Step 2: Build TagSelector component**

Multi-select pill tags (Trips, Roommates, Dining Out, Events, Work, Other) for the preferences slide. Selected tags get ink background, unselected get outline.

- [ ] **Step 3: Build CurrencyStep component**

Searchable currency list with live preview showing the selected currency format.

- [ ] **Step 4: Update OnboardingScreen**

Progress bar (segmented), back button, skip button, "Get Started" on last slide. Store preferences in Zustand.

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/
git commit -m "feat: redesign onboarding with 4 interactive slides, currency picker, and preference tags"
```

### Task 25: Redesign Profile, Settlement, Analytics, and Notifications

**Files:**
- Modify: `src/features/profile/screens/ProfileScreen.tsx`
- Modify: `src/features/settlements/screens/SettlementScreen.tsx`
- Modify: `src/features/analytics/screens/AnalyticsScreen.tsx`
- Modify: `src/features/notifications/screens/NotificationsScreen.tsx`

**Interfaces:**
- All: Follow same patterns as v1 but with updated visual design

- [ ] **Step 1: Redesign Profile**

Consolidate settings into sections: Quick Stats, Preferences, Data, Account, About. Use SettingsItem rows with icons. Dark mode toggle with animated sun/moon icon.

- [ ] **Step 2: Redesign Settlement**

Reuse Keypad component from quick-add. Add animated avatar flow (from → arrow → to) with swap button. Add Full/Half/Custom quick pills. Region-aware payment method links.

- [ ] **Step 3: Redesign Analytics**

Time selector (segmented control). Donut chart for category breakdown with animation. Bar chart for spending over time. Export button.

- [ ] **Step 4: Redesign Notifications**

Grouped by date sections (Today, Yesterday, This Week, Older). Rich preview cards with inline action buttons. "Mark all read" header button. Swipe to dismiss.

- [ ] **Step 5: Commit**

```bash
git add src/features/profile/ src/features/settlements/ src/features/analytics/ src/features/notifications/
git commit -m "feat: redesign Profile, Settlement, Analytics, and Notifications screens"
```

---

## Phase 4: Feature Additions (Weeks 11-15)

### Task 26: Offline support

**Files:**
- Create: `src/lib/offlineMutationQueue.ts`
- Create: `src/hooks/useNetworkStatus.ts`
- Modify: `src/providers/AppProvider.tsx`

**Interfaces:**
- Produces: Offline mutation queue with automatic retry when online, network status hook
- Consumes: NetInfo, React Query persistQueryClient, AsyncStorage

- [ ] **Step 1: Implement offline mutation queue**

```typescript
// src/lib/offlineMutationQueue.ts
import AsyncStorage from "@react-native-async-storage/async-storage"

const QUEUE_KEY = "offline_mutation_queue"

interface QueuedMutation {
  id: string
  timestamp: number
  type: "expense" | "settlement" | "group" | "friend"
  action: "create" | "update" | "delete"
  payload: unknown
}

export const offlineQueue = {
  async enqueue(mutation: Omit<QueuedMutation, "id" | "timestamp">): Promise<void> {
    const queue = await this.getAll()
    queue.push({ ...mutation, id: Date.now().toString(), timestamp: Date.now() })
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  },

  async dequeue(id: string): Promise<void> {
    const queue = await this.getAll()
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.filter((m) => m.id !== id)))
  },

  async getAll(): Promise<QueuedMutation[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  },

  async processQueue(): Promise<void> {
    const queue = await this.getAll()
    for (const mutation of queue) {
      try {
        await executeMutation(mutation)
        await this.dequeue(mutation.id)
      } catch {
        break // Stop processing on first failure
      }
    }
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY)
  },
}
```

- [ ] **Step 2: Implement network status hook**

```typescript
// src/hooks/useNetworkStatus.ts
import { useEffect } from "react"
import NetInfo from "@react-native-community/netinfo"
import { offlineQueue } from "@/lib/offlineMutationQueue"

export function useNetworkStatus() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        offlineQueue.processQueue()
      }
    })
    return unsubscribe
  }, [])
}
```

- [ ] **Step 3: Integrate with React Query**

Add `persistQueryClient` to store query cache in AsyncStorage for offline reads:
```typescript
import { persistQueryClient } from "@tanstack/react-query-persist-client"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
})

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
})
```

- [ ] **Step 4: Integrate with AppProvider**

```typescript
import { onlineManager } from "@tanstack/react-query"
import NetInfo from "@react-native-community/netinfo"

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/offlineMutationQueue.ts src/hooks/useNetworkStatus.ts src/providers/AppProvider.tsx
git commit -m "feat: add offline support with mutation queue, query persistence, and network status detection"
```

---

## Phase 3 (cont.) & Subsequent Tasks

For brevity, remaining tasks follow the same pattern established above. Each task includes:
- Exact file paths (Create/Modify/Test)
- Interfaces (Consumes/Produces)
- Step-by-step checklist with code
- Verification command
- Commit message

### Additional Task Summary:

| # | Task | Key Files |
|---|------|-----------| 
| 27 | Push notifications | expo-notifications setup, Supabase Edge Function, notification permissions, badge counts |
| 28 | Deep linking | expo-router linking config, `splt://` scheme, invite links, universal links |
| 29 | Receipt attachments | expo-image-picker, Supabase Storage, receipt viewer component |
| 30 | AI category suggestion | Heuristic engine (expand useCategorySuggestion), fallback to manual picker |
| 31 | Recurring expenses | RecurringExpenseToggle component, scheduled creation, expo-task-manager |
| 32 | Payment integration | PaymentLinkButton component, region detection, Venmo/PayPal/Cash App deep links |
| 33 | Contacts import | expo-contacts integration, contact matching, invite flow |
| 34 | Performance audit | Bundle analysis, render profiling, memo optimization, image caching |
| 35 | Accessibility audit | Screen reader testing, contrast checking, focus order, reduced motion |
| 36 | Remove old v1 code | Delete old routes, clean up unused components |
| 37 | iOS Widget | Widget extension target, balance data sharing, widget UI |
| 38 | Live Activities | ActivityKit, Dynamic Island, real-time trip split tracking |
| 39 | CSV export | Expense data serialization, `Share.share()` integration |
| 40 | Group templates | Pre-built group configs (Trip, Apartment, Dinner, Event), template picker |
