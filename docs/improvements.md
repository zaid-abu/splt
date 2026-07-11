# Splt — Improvement Plan

A comprehensive audit of all remaining UI/UX issues, functional gaps, and feature opportunities. Organized by priority and effort.

---

## Legend

| Marker | Meaning |
|--------|---------|
| 🔴 | Critical — ship-blocking bug or broken flow |
| 🟠 | High — degrades UX significantly, should fix this sprint |
| 🟡 | Medium — important polish, fix within 2 sprints |
| 🟢 | Low — nice-to-have, queue for later |
| ⚡ | Quick win — <1hr to fix |
| 🐢 | Medium effort — 2-8hrs |
| 🐘 | Large effort — new feature, days |

---

## Section A: Bug Fixes & Immediate Corrections

### A1. 🟠 `queryClient.invalidateQueries()` fires without filter
**Status: ✅ FIXED**

**Files:** `ActivityScreen.tsx:36`, `ActivityScreen.tsx` `onRefresh`

Same issue previously fixed in DashboardScreen — the pull-to-refresh invalidates EVERY React Query cache entry, triggering dozens of unnecessary re-fetches.

**Fix:** Change to `queryClient.invalidateQueries({ queryKey: ["expenses", "settlements"] })`

**Effort:** ⚡

---

### A2. 🟠 Non-null assertion on `currentUser`
**Status: ✅ FIXED**

**File:** `ActivityScreen.tsx:49`

```typescript
user: currentUser!,  // ← dangerous non-null assertion
```

If the screen briefly renders before auth redirect, this crashes. The same pattern exists in other files (the typecheck showed ~80+ potential null accesses).

**Fix:** Either guard with `if (!currentUser) return null` at screen top, or use the optional chaining pattern already used in Dashboard.

**Effort:** ⚡

---

### A3. 🟡 Hardcoded color in tab bar
**Status: ✅ FIXED**

**File:** `src/app/(tabs)/_layout.tsx:53`

```typescript
color={isFocused ? UI.color.text : "#8E8E93"}
```

`#8E8E93` is Apple's system gray, not from the design system. Should use `UI.color.muted`.

**Effort:** ⚡

---

### A4. 🟡 `ActivityScreen` builds activities from expenses/settlements client-side
**Status: ✅ FIXED — now uses database-backed activities feed**

The screen manually merges two arrays and creates `Activity` objects on-the-fly. This means:
- No server-side activity data (the `activities` table exists but isn't used)
- Activity descriptions are generic (just the expense title)
- Past activities from database aren't shown
- The built-in `useUserActivities()` hook exists but is unused

**Fix:** Use `useUserActivities()` from the activities feature, or write activity logging into expense/settlement creation mutations so the activity feed stays accurate.

**Effort:** 🐢

---

### A5. 🟡 4 remaining lint warnings
**Status: ✅ FIXED (0 warnings)**

| File | Warning |
|------|---------|
| `PageAnimator.tsx:46` | Missing deps in useCallback |
| `AppLoader.tsx:40` | Missing deps in useEffect |
| `DashboardScreen.tsx:66` | `_QuickAction` unused |
| `DashboardScreen.tsx:227` | Missing dep `balanceScale` |

3/4 are animation hooks where adding deps causes infinite loops (Animated.Value refs). These should be suppressed with `// eslint-disable-next-line` comments rather than left as warnings. `_QuickAction` should be deleted entirely since it's dead code.

**Effort:** ⚡

---

## Section B: Architecture & Consistency

### B1. 🟠 Two styling patterns coexist

- **Inline styles:** Used by DashboardScreen, GroupDetailScreen, SettlementScreen
- **StyleSheet.create:** Used by NewExpenseScreen

Pick one and standardize. `StyleSheet.create` is more performant (styles are sent to native once), but inline styles are more readable with the design system fluid objects. Recommendation: use `StyleSheet.create` for static styles, inline for dynamic ones (which is already the pattern in NewExpenseScreen).

**Effort:** 🐢 (refactor across screens)

---

### B2. 🟡 `global.css` CSS variables and `native-ui.tsx` JS objects are now aligned — but should be a single source of truth

The two theme systems are now colour-matched, but they're still two separate things. Ideally:
- Define tokens once (in `design-tokens.json`)
- Generate both CSS variables and JS constants from the same source

This prevents future drift.

**Effort:** 🐢

---

### B3. 🟢 `font-bold` and `font-black` both resolve to `IBMPlexSans_600SemiBold`

**File:** `global.css:21-27`

Only SemiBold (600) weight is loaded. The 700 (Bold) and 900 (Black) weights of IBM Plex Sans are not available. Either load the additional font files or remove the misleading mappings.

**Effort:** ⚡ (load fonts) or remove mappings

---

### B4. 🟢 `font-heading-italic` uses Sora SemiBold

**File:** `global.css:31-33`

The italic variant also uses `Sora_600SemiBold` but Sora SemiBold doesn't have a true italic. The `font-style: italic` was added in the style fix but there's no Italic variant loaded. This will fallback to faux-italic browser rendering which looks poor on native. Either load a Sora Italic font or remove this utility.

**Effort:** ⚡

---

## Section C: UI/UX Improvements

### C1. 🟠 Close/back button ambiguity
**Status: ✅ FIXED**

**File:** `NewExpenseScreen.tsx:1018`

The close button uses `ChevronLeft` (which implies "go back"), but on the context-picker step this is a close/dismiss action, not navigation. When the user has already entered data, they lose their form state.

**Fix:** Use `X` icon for the context-picker step, keep `ChevronLeft` for the details step. Or show a confirmation sheet if the user has entered data.

**Effort:** ⚡

---

### C2. 🟠 No undo for destructive actions

Users can delete expenses, settlements, groups, remove friends, and reject requests with no undo. All mutations are immediate and permanent.

**Fix:** Add a toast with "Undo" action for the most common deletions (like expense delete). Use React Query's `onMutate` optimistic update + `onError` rollback pattern.

**Effort:** 🐢

---

### C3. 🟡 Missing confirmation for certain actions

- Deleting a group member — instant with no confirm
- Leaving a group — has confirmation via ConfirmationSheet, good
- Rejecting a friend request — instant with no confirm
- Removing a friend — instant via swipe

**Fix:** Add ConfirmationSheet to group member removal. The small actions (reject friend, remove friend) are fine without confirm since they're low-stakes.

**Effort:** ⚡

---

### C4. 🟡 Pull-to-refresh on group detail/activity screens
**Status: ✅ FIXED**

The `useRefresh` hook exists at `src/hooks/useRefresh.ts` but is only used on DashboardScreen. GroupDetailScreen and ActivityScreen don't have pull-to-refresh.

**Fix:** Add RefreshControl to GroupDetailScreen and wire up the existing refresh hook.

**Effort:** ⚡

---

### C5. 🟡 No skeleton on GroupDetailScreen
**Status: ✅ FIXED**

DashboardScreen has a beautiful skeleton loading state. GroupDetailScreen just loads a blank view until data arrives.

**Fix:** Add skeleton to GroupDetailScreen using the existing `Skeleton` and `ListRowSkeleton` components.

**Effort:** ⚡

---

### C6. 🟡 FriendDetailScreen has no loading state at all
**Status: ✅ Already implemented**

Similar to C5 — the screen renders nothing until queries resolve.

**Effort:** ⚡

---

### C7. 🟡 NewExpenseScreen header text is too large (28px Sora)

The header title "Choose people" / "Expense details" uses 28px Sora which dominates the screen. The body text is 16px IBM Plex. The ratio is off.

**Fix:** Reduce to 20px or 22px to match the design system's headline scale.

**Effort:** ⚡

---

### C8. 🟡 SettlementScreen dismisses immediately after submit
**Status: ✅ FIXED**

After recording a settlement, the screen calls `router.back()` immediately. The user gets no visual confirmation before being thrown back. The success haptic fires but there's no toast or animation.

**Fix:** Show a success toast with the settlement amount before navigating back, or do a brief animated confirmation before dismissing.

**Effort:** ⚡

---

### C9. 🟢 Tab bar first-run discoverability

No text labels, only icons + active dot. New users may not know what each tab does. Onboarding doesn't explain the tab bar.

**Fix:** Show a brief tooltip on first dashboard load, or add text labels only on the first session (store a "has-seen-tabs" flag).

**Effort:** 🐢

---

### C10. 🟢 Amount formatting shows "$1.2M" for large numbers

`formatAmount()` in `AmountDisplay.tsx` uses compact notation for values >= 1,000,000. For a group trip to Japan where someone spends ¥150,000 (~$1,000 USD), this looks fine. But for a ¥10,000,000 yen split, it shows "¥10.0M" — mathematically correct but visually jarring in a personal finance app. Consider raising thresholds or using the user's preferred currency formatting style.

**Effort:** ⚡

---

### C11. 🟡 Haptic feedback missing on tab bar

**File:** `src/app/(tabs)/_layout.tsx:39-42`

Haptic fires only when switching TO a tab (`!isFocused`), but not when pressing the currently-active tab (which could be used to scroll-to-top).

**Fix:** Always fire haptic on tab press, or use a lighter haptic for active tab.

**Effort:** ⚡

---

### C12. 🟢 Search field in NewExpenseScreen duplicates native-ui.tsx SearchField

**Files:** `NewExpenseScreen.tsx:107-137`, `native-ui.tsx:229-278`

Two different SearchField implementations exist. The NewExpenseScreen version uses a different border radius (pill vs lg), different placeholder, and different clear icon. Consolidate them.

**Effort:** 🐢

---

## Section D: Features from Splitwise Worth Implementing

### D1. 🔴 Push notifications

The single biggest UX gap. Without push notifications:
- Users must open the app to see new expenses
- Friend requests go unnoticed
- Settlement reminders don't exist
- Group invitations are invisible until app is opened

**What to implement:**
- Expo Notifications + Supabase Edge Functions
- Event triggers: new expense in your group, friend request, settlement recorded, someone comments on your expense
- In-app: badge count on dashboard bell icon
- Push: local notification + remote via FCM/APNs

**Why it's critical:** Notifications are the #1 retention driver for social finance apps. Splitwise's "You owe $X to Y" push notification is their most opened notification.

**Effort:** 🐘

---

### D2. 🟠 Recurring expenses

Monthly rent, weekly utilities, subscription sharing — these are the bread-and-butter use cases that make users open the app repeatedly.

**What to implement:**
- New expense option: "Repeat" with frequency picker (daily/weekly/biweekly/monthly/yearly)
- Auto-create next instance on due date
- Show upcoming recurring expenses on dashboard
- Allow pause/skip/resume on recurring series

**Why it's high impact:** Recurring expenses create predictable, habitual app usage. Without them, users only open the app when a new ad-hoc expense happens. With them, they check every month.

**Effort:** 🐘

---

### D3. 🟠 Receipt photo attachment

Most real-world expenses come with a receipt or photo. Users want to attach an image to verify amounts.

**What to implement:**
- Camera/gallery picker using `expo-image-picker`
- Upload to Supabase Storage bucket
- Display thumbnail in expense detail
- Tap to view full-size

**Why it's high impact:** Builds trust and reduces disputes ("I didn't spend that much"). Also enables OCR scanning later (D4).

**Effort:** 🐢

---

### D4. 🟡 OCR receipt scanning

Once images are attached, extracting the amount/date/merchant from a receipt photo makes expense entry near-instant.

**What to implement:**
- Use Google Cloud Vision API or Apple's Vision framework (on-device)
- Extract: total amount, merchant name, date
- Pre-fill the expense form with extracted data
- User confirms/corrects before saving

**Implementation path:** Start with on-device Apple Vision for text recognition (free, no API key). Upgrade to a cloud OCR service if accuracy is insufficient.

**Effort:** 🐘

---

### D5. 🟠 Social login (Google + Apple)

Email/password is the highest-friction auth method. During onboarding, asking users to create a password dramatically increases drop-off.

**What to implement:**
- `@supabase/ssr` with Google OAuth (already supported by Supabase)
- Apple Sign In via `expo-apple-authentication`
- Auto-generate name from OAuth profile
- Skip email verification step for social login users

**Why it's high impact:** Every form field in signup loses ~10% of users. Social login reduces signup to 1 tap.

**Effort:** 🐢

---

### D6. 🟡 Split by shares (weighted split)

Current split methods: Equal, Custom amount, Percentage. Missing: **Shares** (e.g., "John pays 2 shares, Mary pays 1 share").

This is the Splitwise default for many use cases — "I'll cover 2/3 of rent since my room is bigger."

**What to implement:**
- Add "shares" as a 4th split method
- Each participant gets a share count (integer)
- Total = sum of shares
- Each person pays = (their shares / total shares) × amount

**Effort:** 🐢

---

### D7. 🟡 Group default split method

A group like "Apartment" should default to shares (for rent/utilities). A group like "Trip" should default to equal. Currently, every new expense starts with Equal.

**What to implement:**
- Add `default_split_method` column to `groups` table
- NewExpenseScreen preselects the group's default method
- Let user override per-expense

**Effort:** ⚡

---

### D8. 🟡 Data export (CSV)

Users want to export their balances or expense history for tax purposes, reimbursement at work, or personal accounting.

**What to implement:**
- "Export data" button in Profile > Settings
- Export expenses as CSV (date, title, amount, paid by, category, your share)
- Export balances summary as CSV
- Share sheet integration (email, AirDrop, files)

**Effort:** 🐢

---

### D9. 🟢 Contacts integration

Instead of searching by name/email, let users find friends from their phone contacts who already use Splt.

**What to implement:**
- `expo-contacts` to read phone contacts
- Match contacts against registered users by email/phone
- Show "Friends on Splt" section in NewFriendScreen

**Effort:** 🐢

---

### D10. 🟢 Multi-currency with live refresh

Exchange rates are fetched once on app launch from open.er-api.com (free tier, no auth). They never refresh during the session. For a travel app, stale rates are misleading.

**What to implement:**
- Add a background refresh interval (every 4 hours)
- Show "last updated" timestamp in currency selector
- Use the user's device locale for default currency

**Effort:** ⚡

---

## Section E: What NOT to Add (Anti-Features)

These are features that Splitwise has but would hurt Splt's product positioning:

### E1. ❌ Integrated payment processing (Venmo/PayPal)

**Why not:** Massive regulatory burden (money transmission licenses), fraud liability, and the UX complexity of linking bank accounts. Splt's positioning is "record and track" — not "move money." The "Settle up" button should keep being a manual record.

**Alternative:** Add a "Mark as paid via Venmo" option that stores the Venmo transaction ID for reference, without actually processing payments.

---

### E2. ❌ Gamification / streaks / leaderboards

**Why not:** Explicitly rejected in PRODUCT.md ("Not a gamified social app competing for attention"). Money is stressful enough. Badges and streaks make it feel like a game.

---

### E3. ❌ Web app / responsive dashboard

**Why not:** The entire design system and component library is React Native. Building a web version means either React Native Web (which has significant visual differences) or a separate codebase. The mobile-native feel is Splt's differentiator.

---

### E4. ❌ Public API / developer platform

**Why not:** Premature. A public API creates a permanent compatibility contract. Wait until there's proven demand from integrators (accounting software, tax prep tools).

---

### E5. ❌ In-app chat / messaging

**Why not:** Expense comments are sufficient for clarifying details. Full chat invites scope creep into WhatsApp territory and creates moderation/moderation liability. Keep communication focused on expenses.

---

## Section F: Implementation Priority Matrix

Ordered by impact ÷ effort:

| # | Task | Effort | Impact | Priority |
|---|------|--------|--------|----------|
| 1 | Fix ActivityScreen unfiltered `invalidateQueries` | ⚡ | 🟠 | **Now** |
| 2 | Fix `currentUser!` in ActivityScreen | ⚡ | 🟠 | **Now** |
| 3 | Tab bar hardcoded color | ⚡ | 🟡 | **Now** |
| 4 | Delete dead `_QuickAction` + suppress lint warnings | ⚡ | 🟡 | **Now** |
| 5 | Add skeleton to GroupDetailScreen | ⚡ | 🟡 | **Now** |
| 6 | Add RefreshControl to GroupDetailScreen | ⚡ | 🟡 | **Now** |
| 7 | Add confirm sheet to group member removal | ⚡ | 🟡 | **Now** |
| 8 | Social login (Google + Apple) | 🐢 | 🟠 | Next sprint |
| 9 | Receipt photo attachment | 🐢 | 🟠 | Next sprint |
| 10 | Group default split method | ⚡ | 🟡 | Next sprint |
| 11 | Pull-to-refresh on all list screens | ⚡ | 🟡 | Next sprint |
| 12 | Activity feed from database | 🐢 | 🟡 | Next sprint |
| 13 | Settlement success toast before dismiss | ⚡ | 🟡 | Next sprint |
| 14 | Standardize StyleSheet.create vs inline | 🐢 | 🟡 | Next sprint |
| 15 | Push notifications | 🐘 | 🔴 | 2 sprints |
| 16 | Recurring expenses | 🐘 | 🟠 | 2-3 sprints |
| 17 | Split by shares | 🐢 | 🟡 | 3 sprints |
| 18 | Undo for destructive actions | 🐢 | 🟠 | 3 sprints |
| 19 | Contacts integration | 🐢 | 🟢 | Later |
| 20 | Data export (CSV) | 🐢 | 🟡 | Later |
| 21 | OCR receipt scanning | 🐘 | 🟡 | Later |
| 22 | Multi-currency live refresh | ⚡ | 🟢 | Later |
| 23 | Tab bar first-run tooltip | 🐢 | 🟢 | Later |
| 24 | Single source-of-truth design tokens | 🐢 | 🟡 | Later |
| 25 | Consolidate duplicate SearchField | 🐢 | 🟢 | Later |

---

## Section G: Acceptance Checklist for Each Fix

For every task above, verify:

1. [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
2. [ ] ESLint passes with zero errors (`npm run lint`)
3. [ ] No new warnings introduced
4. [ ] Tested on both iOS and Android simulators
5. [ ] Dark mode renders correctly
6. [ ] Empty/loading/error states all render
7. [ ] Haptics fire on relevant interactions
8. [ ] Safe area insets respected on both platforms
9. [ ] No console errors in development mode

---

## Section H: Quick Reference — Design System Tokens

When adding new UI, always reference:

| Token | Light | Dark |
|-------|-------|------|
| Background | `UI.color.bg` → `#F7F6F1` | `#121212` |
| Surface | `UI.color.surface` → `#FEFDFA` | `#1E1E1E` |
| Control | `UI.color.control` → `#FFFFFF` | `#252525` |
| Text | `UI.color.text` → `#1A1A1A` | `#F5F0EB` |
| Muted | `UI.color.muted` → `#6E6D68` | `#9E9E9E` |
| Border | `UI.color.border` → `#E7E5DE` | `#3A3A3A` |
| Danger | `UI.color.danger` → `#E85D5D` | `#E85D5D` |
| Success | `UI.color.success` → `#4CAF82` | `#4CAF82` |
| Brand | `UI.color.brand` → `#8C7A6B` | `#A89A8E` |
| Card radius | `UI.radius.lg` → `16` | `16` |
| Pill radius | `UI.radius.pill` → `999` | `999` |
| Page padding | `UI.space.page` → `24` | `24` |

Typography presets: `TYPO.hero()`, `TYPO.title()`, `TYPO.body()`, `TYPO.medium()`, `TYPO.semi()`, `TYPO.label()`
