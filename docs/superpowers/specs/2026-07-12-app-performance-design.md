# App Performance Optimization — Design Spec

Status: **Approved**  
Date: 2026-07-12  
Target: Mid-range devices (iPhone SE, mid-tier Android)  
Pain Points: Startup, screen transitions, scrolling, data loading

---

## Approach: Balanced Optimization

8 workstreams targeting the 4 identified pain points. All changes are in-place refactors or additive — no new third-party dependencies beyond what's already available in the Expo SDK. No database schema changes.

---

## S1: List Virtualization — FlashList Migration

**Files:**
- `src/features/friends/screens/FriendsScreen.tsx` — line ~1003, `Animated.FlatList`
- `src/features/activity/screens/ActivityScreen.tsx` — line ~183, `Animated.FlatList`
- `src/features/notifications/screens/NotificationsScreen.tsx` — line ~168, `FlatList`
- `src/features/onboarding/screens/OnboardingScreen.tsx` — line ~119, `FlatList`

**What:**
- Replace `FlatList` / `Animated.FlatList` with `@shopify/flash-list` (`FlashList`)
- Add `estimatedItemSize` prop on each (critical for FlashList perf)
- Move `Animated` wrappers from list container to individual item components
- `Animated.FlatList`'s pull-to-refresh works via `refreshControl` on FlashList — migrate that
- Stabilize `renderItem` in `ActivityScreen.tsx:194` with `useCallback`

**Why:** FlashList recycles components off-screen instead of unmounting them. On mid-range devices with 50+ items, this is the difference between 60fps and stuttering.

**Verification:** Scroll each screen with 100+ items, check JS frame rate stays above 55fps.

---

## S2: Route Lazy Loading

**Files:** All 12+ route files under `src/app/`:
- `(tabs)/index.tsx` (Dashboard), `(tabs)/groups.tsx`, `(tabs)/friends.tsx`, `(tabs)/activity.tsx`
- `group/new.tsx`, `group/[id]/index.tsx`, `group/[id]/settings.tsx`, `group/[id]/settle.tsx`
- `expense/new.tsx`, `expense/[id].tsx`
- `friend/new.tsx`, `friend/[id].tsx`
- `settle/[id].tsx`
- `profile/index.tsx`, `profile/edit.tsx`, `profile/change-password.tsx`
- `onboarding.tsx`, `notifications.tsx`
- `(auth)/` routes

**What:**
- Each route file wraps its screen import in `React.lazy(() => import(...))`
- Each gets a `<Suspense>` boundary with a skeleton fallback (reuse existing `*ScreenSkeleton` components where available)
- The tab layout (`(tabs)/_layout.tsx`) ensures the tab bar mounts eagerly — only screen content is lazy

**Why:** Eliminates parsing ~50% of the JS bundle on startup. Each route's chunk loads only when navigated to.

**Verification:** Metro should produce separate chunks per route. Measure initial bundle size before/after.

---

## S3: Shared Balance Computation

**Files:**
- New: `src/features/settlements/hooks/useBalances.ts`
- Modify: `src/features/dashboard/screens/DashboardScreen.tsx` — lines 265-363
- Modify: `src/features/friends/screens/FriendsScreen.tsx` — lines 116-264
- Modify: `src/features/groups/screens/GroupsScreen.tsx` — lines 58-93
- Unchanged: `src/features/settlements/utils/balances.ts` (reused by the hook)

**What:**
- Create shared `useOverallBalances()` and `useGroupBalance(groupId)` hooks
- Each hook uses `useQuery` with `queryKey` derived from the raw data hashes
- Leverages React Query cache invalidation: when groups/expenses/settlements change, the balance cache invalidates once (not per screen)
- Dashboard, Friends, and Groups screens replace their inline `useMemo(getUserBalances, ...)` with the shared hook

**Why:** Currently `getUserBalances()` is called ~N+1 times per render cycle (once globally + once per group). With the shared hook, it computes once per data change.

**Verification:** Dashboard with 10 groups: balance computation traces should show 1 run instead of 11.

---

## S4: FriendsScreen Decomposition

**Files:**
- New: `src/features/friends/components/FriendsBalanceHeader.tsx`
- New: `src/features/friends/components/FriendsSearchBar.tsx`
- New: `src/features/friends/components/PendingRequestsBanner.tsx`
- New: `src/features/friends/components/FriendsSectionList.tsx`
- Modify: `src/features/friends/screens/FriendsScreen.tsx` — shrink from ~1025 lines to ~150

**What:**
- Extract 4 sub-components with `React.memo` + focused props
- `FriendsBalanceHeader` — total balance card, summary, receives computed data
- `FriendsSearchBar` — search input + filter, owns its own input state, outputs filtered query
- `PendingRequestsBanner` — collapsible banner, receives pending requests, handles accept/reject
- `FriendsSectionList` — FlashList, receives pre-sectioned data, handles swipe/delete/share callbacks
- `FriendsScreen` becomes a thin orchestrator: owns queries, wires data into sub-components, handles navigation
- Fix `getRecentExpense` (O(F×E)) to run once in parent instead of per item

**Why:** A 1025-line component defeats React.memo — too many state changes cascade into re-renders. Smaller components with tight memo boundaries only re-render when their specific props change.

**Verification:** React DevTools profiler: typing in search should NOT re-render `FriendsSectionList` unless filtered data changes.

---

## S5: Optimistic Updates

**Files:**
- `src/features/expenses/hooks/useAddExpense.ts` (or wherever the mutation hook lives)
- `src/features/settlements/hooks/useAddSettlement.ts`
- `src/features/expenses/hooks/useDeleteExpense.ts`

**What:**
- Add `onMutate` / `onError` / `onSettled` pattern to 3 key mutations: add expense, settle up, delete expense
- `onMutate`: snapshot current cache, insert optimistic entity with temp ID
- `onError`: roll back to snapshot
- `onSettled`: invalidate queries for eventual consistency
- Other mutations (add friend, create group) keep current invalidation-only pattern

**Why:** Data loading delay is the user's biggest pain. Optimistic updates make the UI respond instantly — the server round-trip becomes a background sync.

**Verification:** Add an expense while throttling network to "Slow 3G" — the expense should appear in the list immediately, then settle to its real ID.

---

## S6: Image Optimization

**Files:**
- `src/components/ui/MemberAvatar.tsx` — line ~127
- `src/features/expenses/screens/ExpenseDetailScreen.tsx` — line ~612
- Any other `<Image>` for remote URLs (audit during implementation)

**What:**
- Replace `Image` from `react-native` with `Image` from `expo-image`
- Add `contentFit="cover"` and `cachePolicy="memory-disk"` props
- For avatars: add `placeholder` prop with a tinted blurhash or solid color
- For receipts: add `contentFit="contain"` to prevent oversized images

**Why:** React Native's `Image` has no disk cache and re-decodes on every mount. `expo-image` caches to disk, loads progressively, and downsizes automatically. On mid-range devices with slow flash storage, this turns avatar scrolling from stuttery to smooth.

**Verification:** Scroll through friends list — first pass shows minimal delay, second pass is instant (disk cache hit).

---

## S7: Service Layer N+1 Fixes

**Files:**
- `src/features/groups/services/api.ts` — lines 81-92 (`addMembers`)
- `src/features/expenses/services/api.ts` — lines 63-86 (`addExpense`), lines 100-115 (`updateExpense`)
- `src/features/groups/services/api.ts` — lines 45-57 (`createGroup`)

**What:**
- `addMembers`: replace sequential `for` loop with `supabase.from("group_members").insert(members)` (bulk array)
- `addExpense`: add `.select("*, splits:expense_splits(*)").single()` to the insert, remove the follow-up `fetchExpense`
- `updateExpense`: same `.select()` pattern, remove follow-up fetch
- `createGroup`: bulk-insert members, return created group with `.select("*, members:group_members(*)")`

**Why:** Each unnecessary round-trip adds 50-200ms on mid-range cellular networks. Adding an expense today takes 2 round-trips; with this fix, 1. Adding 5 members to a group: ~7 trips → 2.

**Verification:** Network tab in Flipper: `addExpense` should show 1 request instead of 2. `addMembers` should show 1 request instead of N.

---

## S8: Startup Parallelization

**Files:**
- `src/app/_layout.tsx` — lines 37-62 (fonts + auth session)
- `src/providers/AppProvider.tsx` — lines 27-29 (exchange rates)

**What:**
- Fire `useFonts` and Supabase session check concurrently (they already run in the layout, but ensure no accidental sequential dependency)
- Fire exchange rates as a fire-and-forget effect in `AppProvider` rather than blocking the provider tree from rendering children — if rates haven't loaded, show "USD" as the fallback instead of blocking
- Keep splash screen visible until both fonts and auth are ready (already the pattern, but ensure exchange rates don't gate it)

**Why:** Currently fonts → auth → exchangeRates (serial). After fix: (fonts + auth) in parallel → render. Exchange rates arrive whenever they arrive. Shaves ~400-800ms off perceived startup.

**Verification:** Cold start on device. Measure time from tap to first interactive screen. Should be ~40% faster.

---

## Implementation Order

The workstreams are designed to be independent where possible, with minimal merge conflicts:

1. **S7 (Service layer fixes)** — no UI impact, independent, unblocks S5
2. **S6 (Image optimization)** — purely component-level swaps, no dependencies
3. **S1 (FlashList migration)** — component changes only, no business logic
4. **S3 (Shared balance hook)** — creates a new hook, then modifies 3 screens
5. **S4 (FriendsScreen decomposition)** — depends on S1 (FlashList) and S3 (balances)
6. **S2 (Route lazy loading)** — last, since imports change everywhere
7. **S5 (Optimistic updates)** — depends on S7 clean API
8. **S8 (Startup parallelization)** — last, after everything else is stable

---

## Acceptance Criteria

- Startup time on a mid-range device: at least 35% reduction in time-to-interactive
- Scrolling on Friends, Activity, and Notifications screens: 55+ fps with 100 items
- Screen transitions (e.g., Dashboard → Groups → Expense): initial navigation feels instant, subsequent navigation loads chunk on demand
- Data mutations (add expense, settle up): optimistic UI update in <10ms, server sync completes asynchronously
- All existing tests pass: `npm run test`
- No type errors: `npm run typecheck`
- No lint errors: `npm run lint`
