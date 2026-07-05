# SPLT — Complete UI Revamp & Production Roadmap

> **Objective:** Transform SPLT from its current purple-heavy, cold-toned UI into the warm, editorial, premium design shown in the reference — while simultaneously completing all leftover functionality, fixing architectural gaps, and restructuring the project for true production readiness.

![Reference Design](file:///Users/abuzaid/Documents/Projects/splt/splt/design.png)

---

## Current State Assessment

### What Exists Today

| Area                       | Status         | Notes                                                                                                            |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Auth flow**              | ✅ Working     | Supabase auth with login/register/welcome screens                                                                |
| **Dashboard**              | ✅ Working     | Purple hero card, pie chart, quick actions, activity feed                                                        |
| **Groups CRUD**            | ✅ Working     | Create, view, list, settings, icon picker                                                                        |
| **Expenses CRUD**          | ✅ Working     | Create, edit, delete, split methods (equal/custom/percentage)                                                    |
| **Settlements**            | ✅ Working     | Record payments between friends                                                                                  |
| **Friends list**           | ⚠️ Partial     | Friends derived from groups — no independent friend model                                                        |
| **Activity feed**          | ✅ Working     | Timeline of expenses, settlements, group events                                                                  |
| **Profile**                | ⚠️ Stub        | Screen exists but minimal functionality                                                                          |
| **Onboarding**             | ❌ Not built   | Feature folder scaffolded but empty                                                                              |
| **Dark mode**              | ❌ Not built   | CSS variables defined but no dark theme values                                                                   |
| **Push notifications**     | ❌ Not built   | No notification system                                                                                           |
| **Receipt scanning**       | ❌ Not built   | "Attach Receipt" button is a no-op                                                                               |
| **Debt simplification UI** | ⚠️ Partial     | Algorithm exists but no toggle UI or visual graph                                                                |
| **Data layer**             | ⚠️ Mock + Real | `useDataStore` Zustand still uses MOCK_DATA; React Query hooks exist but many screens still couple to mock store |
| **Tests**                  | ❌ None        | Jest configured but 0 test files                                                                                 |

---

## Reference Design Analysis

### Key Design Characteristics from the Mockup

**1. Color Palette — Warm & Neutral**

- Background: Warm cream/beige (`#F5F0EB`) — not cold gray
- Cards: Pure white (`#FFFFFF`) with very subtle shadow
- Text: Near-black (`#1A1A1A`) for headings, muted gray (`#8E8E93`) for secondary
- Accent: Soft red (`#E85D5D`) for "you owe" amounts
- Primary CTA: Dark charcoal/black (`#1A1A1A`) for buttons like "Create group"
- No purple anywhere — completely warm, neutral palette

**2. Typography — Editorial Serif + Clean Sans**

- Screen titles use an elegant serif font (e.g., "Welcome, Maria" in italic serif)
- Body text uses a clean sans-serif
- Section labels ("YOU OWE", "ACTIVE GROUPS", "TRANSACTIONS") are small, uppercase, tracked

**3. Layout & Spacing**

- Balance cards: Two side-by-side white cards with stacked avatars + arrow buttons
- Groups section: White card with list items, each with icon + name + count + chevron
- Transactions: List with category icon + title + amount + payer info
- Generous padding (~20px horizontal), 16px card radius (not 32px)
- Clean section dividers with subtle labels

**4. Tab Bar — Minimal & Clean**

- 5 icons: Home (filled), Stats (bar chart), Add (⊕ circle), Friends (people), Profile (person)
- Active dot indicator below current tab
- Solid white background, no blur/glass effect
- No floating pill — sits flush at bottom

**5. Bottom Sheet — Create Group**

- Modal bottom sheet overlay (not full screen)
- Title field with emoji/icon picker inline
- Participants list with avatars + delete buttons
- Currency dropdown
- Dark "Create group" button
- Footer text: "All participants will receive an invite"

**6. Notification Bell**

- Top-right notification icon with red badge count
- Links to notifications screen

---

## Design System Overhaul

### New Color Palette

```css
/* Warm, editorial palette derived from reference */
--color-background: #f5f0eb; /* Warm cream */
--color-surface: #ffffff; /* White cards */
--color-surface-secondary: #f9f6f2; /* Slightly warmer off-white */

--color-text-primary: #1a1a1a; /* Near black */
--color-text-secondary: #8e8e93; /* Muted gray */
--color-text-disabled: #c7c7cc;
--color-text-inverse: #ffffff;

--color-border-light: #e8e4df; /* Warm border */
--color-border-main: #d6d2cd;

--color-primary: #1a1a1a; /* Dark CTA buttons */
--color-primary-foreground: #ffffff;

--color-accent-red: #e85d5d; /* Debt/owe indicator */
--color-accent-green: #4caf82; /* Positive balance */
--color-accent-purple: #c4a8e0; /* Group icon backgrounds */
--color-accent-pink: #e8c4c4; /* Avatar ring accent */

--color-success: #4caf82;
--color-danger: #e85d5d;
--color-warning: #f5a623;
```

### New Typography System

```
Heading Font:  DM Serif Display (serif, italic for greetings)
Body Font:     Inter or PlusJakartaSans (sans-serif)
Section Label: uppercase, tracked, 10-11px, muted color
Amount:        bold, large sizes (32-40px)
```

### New Spacing & Radius

```
Card border-radius:    16px (not 32px)
Button border-radius:  12px (pill for small chips, 999px)
Input border-radius:   12px
Section padding:       20px horizontal
Card padding:          16px–20px
List item height:      ~64-72px
```

---

## Implementation Phases

---

### ✅ Phase 1: Design System Foundation

**Priority:** P0 — Must do first (all screens depend on this)
**Effort:** 2 days
**Status:** COMPLETE — 2026-07-04

**Goal:** Replace every design token, color, font, and spacing value to match the warm, editorial reference.

#### Files to Modify

- [global.css](file:///Users/abuzaid/Documents/Projects/splt/splt/src/global.css) — Complete rewrite of all CSS variables
- [design-tokens.json](file:///Users/abuzaid/Documents/Projects/splt/splt/design-tokens.json) — Update all token values to new palette
- [_layout.tsx](file:///Users/abuzaid/Documents/Projects/splt/splt/src/app/_layout.tsx) — Add serif font (`DM Serif Display`)
- [package.json](file:///Users/abuzaid/Documents/Projects/splt/splt/package.json) — Add `@expo-google-fonts/dm-serif-display`

#### Detailed Changes

**1. Color Migration:**

| Token                       | Current Value         | New Value                 |
| --------------------------- | --------------------- | ------------------------- |
| `--color-primary`           | `#3d2b82` (purple)    | `#1A1A1A` (dark charcoal) |
| `--color-primary-light`     | `#6749d2`             | `#3A3A3A`                 |
| `--color-primary-dark`      | `#261c4c`             | `#000000`                 |
| `--color-background`        | `#f2f2f6` (cold gray) | `#F5F0EB` (warm cream)    |
| `--color-surface`           | `#ffffff`             | `#FFFFFF`                 |
| `--color-surface-secondary` | `#f8f9fb`             | `#F9F6F2`                 |
| `--color-text-primary`      | `#1e1a34`             | `#1A1A1A`                 |
| `--color-text-secondary`    | `#8a8798`             | `#8E8E93`                 |
| `--color-border-light`      | `#f0f0f0`             | `#E8E4DF`                 |
| `--color-border-main`       | `#e5e5e5`             | `#D6D2CD`                 |
| `--color-accent-blue`       | `#6b4eff`             | Remove (no blue in ref)   |
| `--color-success`           | `#10b981`             | `#4CAF82`                 |
| `--color-danger`            | `#ef4444`             | `#E85D5D`                 |

**2. Typography:**

- Install `@expo-google-fonts/dm-serif-display`
- Add `@utility font-heading` with serif family
- Add `@utility font-heading-italic` for greeting text
- Update `--font-family-heading` to `DM Serif Display`

**3. Spacing & Radius:**

- `--radius-xl: 32px` → `16px`
- `--radius-xxl: 40px` → `20px`
- `--radius-lg: 24px` → `16px`
- Keep `--radius-pill: 9999px`

**4. Dark Mode Prep:**

- Define `:root.dark` CSS variable overrides
- Dark background: `#121212`, dark surface: `#1E1E1E`

#### Why First

Every screen uses `bg-background`, `text-foreground`, `bg-primary`, etc. Changing these tokens propagates the new look across the entire app immediately. All subsequent phases build on this foundation.

---

### ✅ Phase 2: Tab Bar & Navigation Redesign

**Priority:** P0
**Effort:** 0.5 day
**Status:** COMPLETE — 2026-07-04

**Goal:** Replace the glass-morphic floating tab bar with the clean, minimal icon bar from the reference.

#### Files to Modify

- [_layout.tsx (tabs)](<file:///Users/abuzaid/Documents/Projects/splt/splt/src/app/(tabs)/_layout.tsx>) — Complete tab bar redesign

#### Reference Tab Bar Spec

```
[🏠 Home]  [📊 Stats]  [⊕ Add]  [👥 Friends]  [👤 Profile]
     •
```

- **Background:** Solid white (`#FFFFFF`), no BlurView
- **Icons:** Thin stroke (1.5px), ~22px, gray (`#8E8E93`) when inactive
- **Active state:** Dark (`#1A1A1A`) icon + small dot below
- **No text labels** — icons only (reference shows no labels)
- **No floating pill** — standard bottom position with safe area padding
- **Center "Add" button:** Circle outline with `+`, same style as other icons (not elevated FAB)
- **Subtle top border:** 1px `#E8E4DF`

#### Changes from Current

| Current                               | New                                               |
| ------------------------------------- | ------------------------------------------------- |
| BlurView with 85% opacity white       | Solid white background                            |
| Floating pill with rounded corners    | Flush bottom bar                                  |
| Centered elevated FAB (purple circle) | Regular icon item (circle outline)                |
| Text labels that animate in           | No text labels                                    |
| 4 tabs + FAB                          | 5 equal tabs (Home, Stats, Add, Friends, Profile) |

#### New Tab Routes

- `index` → Home (Dashboard)
- `stats` → Analytics (new screen)
- `add` → Expense creation (navigates to `/expense/new`)
- `friends` → Friends list
- `profile` → Profile screen

> **Note:** This removes the `groups` and `activity` tabs. Groups are accessible from the dashboard's "Active Groups" section, and Activity is accessible from individual group/friend screens. This matches the reference design.

---

### ✅ Phase 3: Dashboard Screen Revamp

**Priority:** P0 — This is the first screen users see
**Effort:** 1.5 days
**Status:** COMPLETE — 2026-07-04

**Goal:** Completely redesign the home screen to match the reference mockup.

#### Files to Modify

- [DashboardScreen.tsx](file:///Users/abuzaid/Documents/Projects/splt/splt/src/features/dashboard/screens/DashboardScreen.tsx) — Complete UI rewrite
- [BalanceCard.tsx](file:///Users/abuzaid/Documents/Projects/splt/splt/src/features/dashboard/components/BalanceCard.tsx) — New balance card component

#### Reference Dashboard Layout (top to bottom)

**A. Header**

```
Welcome, [Name]                    🔔²
(serif italic font)          (notification bell with badge)
```

- No blurred sticky header — simple top-aligned layout
- Serif italic greeting
- Notification bell icon (top-right) with red badge count

**B. Balance Overview — Two Side-by-Side Cards**

```
┌──────────────────┐  ┌──────────────────┐
│ YOU OWE          │  │ YOU ARE OWED     │
│                  │  │                  │
│ 176 PLN          │  │ 225 PLN          │
│ 👤👤👤  →        │  │ 👤👤👤  →       │
└──────────────────┘  └──────────────────┘
```

- White cards with subtle shadow/border
- "YOU OWE" / "YOU ARE OWED" as small uppercase labels
- Large amount number (32-36px, bold)
- Currency code next to amount in smaller text
- Stacked avatar row of people you owe/who owe you
- Arrow button (→) linking to details

**C. Active Groups Section**

```
ACTIVE GROUPS

┌──────────────────────────────────────┐
│ ⚙️  Summer trip         >           │
│     3 participants                   │
│──────────────────────────────────────│
│ 🏠  Flat Rent            >          │
│     2 participants                   │
│──────────────────────────────────────│
│           + Add new group            │
└──────────────────────────────────────┘
```

- Single white card containing all group items
- Each item: colored icon circle + group name + participant count + chevron
- Separated by thin borders
- "+ Add new group" button at bottom of card

**D. Transactions Section**

```
TRANSACTIONS

│ 🍳  Breakfast    186 zł             │
│     Paid by you         102 zł      │
│─────────────────────────────────────│
│ 🚕  Taxi          35 zł            │
│     Paid by Maria     17.50 zł      │
│─────────────────────────────────────│
│ 🍸  Drinks       220 zł            │
│     Paid by Daniel                   │
```

- Category icon + expense title + total amount (right-aligned)
- Subtitle: "Paid by [name]" + your share in red (right-aligned)

**E. Remove from Current**

- ❌ Purple hero card with pie chart
- ❌ Quick actions grid (Groups, Friends, Activity, Profile icons)
- ❌ "Needs Attention" section (replaced by balance cards)
- ❌ Bottom sheet quick actions
- ❌ BlurView sticky header

---

### ✅ Phase 4: Create Group — Bottom Sheet Redesign

**Priority:** P0
**Effort:** 1 day
**Status:** COMPLETE — 2026-07-04

**Goal:** Convert the full-screen group creation into a bottom sheet modal, matching the reference exactly.

#### Files to Modify

- [NewGroupScreen.tsx](file:///Users/abuzaid/Documents/Projects/splt/splt/src/features/groups/screens/NewGroupScreen.tsx) — Convert to bottom sheet component
- [DashboardScreen.tsx](file:///Users/abuzaid/Documents/Projects/splt/splt/src/features/dashboard/screens/DashboardScreen.tsx) — Trigger bottom sheet from "+ Add new group"
- [_layout.tsx](file:///Users/abuzaid/Documents/Projects/splt/splt/src/app/_layout.tsx) — May adjust route presentation

#### Reference Create Group Bottom Sheet Layout

```
         Create new group                    ✕
─────────────────────────────────────────────
TITLE
 ✈️  │ Day trip to Warsaw                   │
─────────────────────────────────────────────
PARTICIPANTS                          + Add

 👤  You
 👤  Angela                              🗑
 👤  Mark                                🗑
 👤  Maria                               🗑
─────────────────────────────────────────────
CURRENCY
 Polish złoty                             ▼
─────────────────────────────────────────────
    ┌────────────────────────────────────┐
    │         Create group               │
    └────────────────────────────────────┘
    All participants will receive an invite
```

#### Key Implementation Details

- Use `@gorhom/bottom-sheet` `BottomSheetModal` (already in project)
- Snap to ~85% screen height
- Icon picker: inline emoji/icon next to title input (not separate horizontal scroller)
- Participants: avatar + name + delete trash icon (except "You" — no delete)
- "+ Add" button opens a search/email input inline
- Currency: dropdown/selector (reuse existing `CurrencySelector`)
- "Create group" button: full-width, dark/black (`bg-primary`), rounded
- Footer text below button: "All participants will receive an invite" in muted gray
- Close button (✕) in top-right corner

---

### ✅ Phase 5: All Other Screens — Design Alignment

**Priority:** P0
**Effort:** 2 days
**Status:** COMPLETE — 2026-07-04

**Goal:** Rewrite every remaining page one by one to use the new warm design language consistently. This will be executed in micro-phases per feature area (e.g., Groups, Friends, Expenses, Settlements, Activity, Auth) to ensure focused, component-level redesign.

#### 1. Groups Micro-Phase

**Groups List Screen**

```
Groups                                ⊕
─────────────────────────────────────────────
TOTAL BALANCE: 176 PLN (You Owe)

┌──────────────────────────────────────┐
│ ⚙️  Summer trip         >           │
│     3 participants                   │
│──────────────────────────────────────│
│ 🏠  Flat Rent            >          │
│     2 participants                   │
└──────────────────────────────────────┘
```

- No blurred sticky header
- Single white card for list of groups
- Each group has an icon, name, participant count, and chevron right

**Group Detail Screen**

```
< Back    ⚙️ Summer trip              ⚙️
─────────────────────────────────────────────
┌──────────────────┐  ┌──────────────────┐
│ YOU OWE          │  │ YOU ARE OWED     │
│ 176 PLN          │  │ 0 PLN            │
└──────────────────┘  └──────────────────┘
TRANSACTIONS
│ 🍳  Breakfast    186 zł             │
│     Paid by you         102 zł      │
```

- Clean balance cards (similar to dashboard)
- Transactions list matching dashboard styling
- "Settle up" button floats or sits at the bottom

#### 2. Friends Micro-Phase

**Friends Screen**

```
Friends                               ⊕
─────────────────────────────────────────────
┌──────────────────────────────────────┐
│ 👤  Maria               >           │
│     Owes you 150 zł                  │
│──────────────────────────────────────│
│ 👤  Daniel              >           │
│     You owe 45 zł                    │
└──────────────────────────────────────┘
```

- Clean white card list for friends
- Status text in soft red (you owe) or green (owes you)

#### 3. Expenses Micro-Phase

**New Expense Screen (Bottom Sheet or Full Screen)**

```
         Add Expense                    ✕
─────────────────────────────────────────────
TITLE
 🍽  │ Dinner at Trattoria                │
─────────────────────────────────────────────
AMOUNT
        $ 125.00
─────────────────────────────────────────────
PAID BY                  SPLIT
 👤 You                   🔀 Equally
─────────────────────────────────────────────
    ┌────────────────────────────────────┐
    │         Save Expense               │
    └────────────────────────────────────┘
```

- Unified layout, single column
- Large amount input
- Simple selectors for "Paid by" and "Split"

**Expense Detail Screen (Receipt Style)**

```
< Back
─────────────────────────────────────────────
       🍽 Dinner at Trattoria
             $ 125.00
       Paid by You on Jul 4

SPLIT DETAILS
  👤 You                     $ 62.50
  👤 Maria                   $ 62.50
```

- Centralized receipt-like card
- Clean typography and hierarchy

#### 4. Settlements Micro-Phase

**Settlement Screen**

```
< Back
─────────────────────────────────────────────
        👤 You    →    👤 Maria
─────────────────────────────────────────────
AMOUNT
           $ 62.50
─────────────────────────────────────────────
    ┌────────────────────────────────────┐
    │         Record Payment             │
    └────────────────────────────────────┘
```

- Avatar directional flow (You -> Friend)
- Large amount input field
- Full-width primary action button

#### 5. Activity Micro-Phase

**Activity Screen**

```
Activity
─────────────────────────────────────────────
TODAY
 🔵  Maria added "Dinner"            $125
     10:42 AM

 🟢  You settled up with Daniel       $45
     09:15 AM
```

- Simple timeline view
- Circular icons indicating action type
- Muted secondary text for timestamps

#### 6. Auth Micro-Phase

**Welcome / Auth Screens**

```
           [ SPLT Logo ]

          Welcome to SPLT
     (elegant italic serif)

    ┌────────────────────────────────────┐
    │         Get Started                │
    └────────────────────────────────────┘
```

- Warm background (`#F5F0EB`)
- Large, elegant typography for greetings
- Clean inputs with 12px radius for Login/Register

#### Files to Modify

- `src/features/groups/screens/*`
- `src/features/friends/screens/*`
- `src/features/expenses/screens/*`
- `src/features/settlements/screens/*`
- `src/features/activity/screens/*`
- `src/app/(auth)/*`
- Shared UI components: `MemberAvatar`, `AmountDisplay`, `CurrencySelector`, `SwipeableRow`, `ErrorFallback`

#### Key Consistent Changes Across All Screens

1. Replace `bg-primary` (purple) buttons → dark charcoal (`#1A1A1A`)
2. Replace `rounded-[32px]` → `rounded-[16px]` on cards
3. Replace `rounded-[24px]` → `rounded-[12px]` on buttons/inputs
4. Replace BlurView headers → simple View with warm background
5. Replace `text-primary` (purple text) → `text-foreground` or contextual color
6. Replace green `#10b981` → muted green `#4CAF82`
7. Replace red `#ef4444` → soft red `#E85D5D`
8. Remove all purple accent colors
9. Update hardcoded `backgroundColor: "rgba(242, 242, 246, 0.90)"` → use warm cream

---

### 🟡 Phase 6: Independent Friends Model

**Priority:** P1
**Effort:** 1 day

**Goal:** Make friends a first-class entity instead of deriving from group members.

#### Files to Create

- `[NEW] src/features/friends/types/index.ts`
- `[NEW] src/features/friends/services/api.ts`
- `[NEW] src/features/friends/queries/useFriends.ts`
- `[NEW] supabase/migrations/xxx_friends_table.sql`

#### Current Problem

```typescript
// Friends are currently derived from groups — fragile, no standalone friendships
const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
const uniqueFriends = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());
```

#### Solution

- Create `friendships` table: `(user_id, friend_id, status, created_at)`
- Status enum: `pending | accepted | blocked`
- `useFriends` hook queries both explicit friends AND group-derived friends (union)
- `NewFriendScreen` actually creates a friendship record (not a fake group)

---

### 🟡 Phase 7: Stats/Analytics Tab

**Priority:** P1
**Effort:** 2 days

**Goal:** Build the spending analytics screen for the new Stats tab (referenced in tab bar mockup as bar chart icon).

#### Files to Create

- `[NEW] src/features/analytics/screens/AnalyticsScreen.tsx`
- `[NEW] src/features/analytics/components/SpendingChart.tsx`
- `[NEW] src/features/analytics/components/CategoryBreakdown.tsx`
- `[NEW] src/features/analytics/components/MonthlyTrend.tsx`
- `[NEW] src/features/analytics/hooks/useAnalytics.ts`
- `[NEW] src/app/(tabs)/stats.tsx`

#### Features

1. Monthly spending bar chart
2. Category breakdown donut chart
3. Spending trends line chart
4. Top expenses list
5. Group spending comparison
6. Period selector (week/month/3mo/year/all)

---

### 🟡 Phase 8: Profile & Settings

**Priority:** P1
**Effort:** 1 day

**Goal:** Complete profile screen with settings (needed for the new Profile tab).

#### Files to Create/Modify

- [ProfileScreen.tsx](file:///Users/abuzaid/Documents/Projects/splt/splt/src/features/profile/screens/ProfileScreen.tsx) — Complete rewrite
- `[NEW] src/features/profile/screens/EditProfileScreen.tsx`
- `[NEW] src/features/profile/components/ProfileHeader.tsx`
- `[NEW] src/features/profile/components/SettingsItem.tsx`

#### Features

- Profile header (avatar, name, email, member since)
- Default currency selector
- Theme toggle (light/dark/system)
- Notification preferences
- Export data option
- Sign out with confirmation
- Delete account

---

### 🟡 Phase 9: Onboarding Flow

**Priority:** P1
**Effort:** 1 day

#### Files to Create

- `[NEW] src/features/onboarding/screens/OnboardingScreen.tsx`
- `[NEW] src/features/onboarding/components/OnboardingSlide.tsx`
- `[NEW] src/features/onboarding/constants/slides.ts`

#### Features

- 3-4 swipeable onboarding slides
- Currency & name setup on first run
- Skip option
- AsyncStorage flag to prevent repeat showing

---

### 🟡 Phase 10: Notifications & Real-time

**Priority:** P1
**Effort:** 2 days

#### Files to Create

- `[NEW] src/services/notifications/index.ts`
- `[NEW] src/features/notifications/screens/NotificationsScreen.tsx`
- `[NEW] src/features/notifications/queries/useNotifications.ts`
- `[NEW] src/hooks/useRealtime.ts`

#### Features

- Push notifications via Expo Notifications
- In-app notification bell (matches reference design badge)
- Notification types: new expense, settlement, friend request, group invite
- Supabase Realtime subscriptions for live updates

---

### 🟢 Phase 11: Data Layer — Remove Mock Data

**Priority:** P2
**Effort:** 2 days

#### Files to Modify

- [useDataStore.ts](file:///Users/abuzaid/Documents/Projects/splt/splt/src/store/useDataStore.ts) — Remove mock data, keep as UI-only state
- [mock-data.ts](file:///Users/abuzaid/Documents/Projects/splt/splt/src/lib/mock-data.ts) — Move to `__tests__/fixtures/`
- All React Query hooks — ensure they call Supabase service layer

#### Current Problem

`useDataStore` initializes with `MOCK_GROUPS`, `MOCK_EXPENSES`, etc. React Query hooks often wrap the Zustand store instead of calling Supabase.

#### Solution

1. Make all query hooks call `services/api/` functions → Supabase
2. Move `useDataStore` to pure UI state (filters, selections)
3. Move mock data to test fixtures
4. Add proper loading/error states everywhere

---

### 🟢 Phase 12: Receipt Scanning

**Priority:** P2
**Effort:** 1 day

#### Files to Create

- `[NEW] src/features/expenses/hooks/useReceiptScanner.ts`
- `[NEW] src/features/expenses/components/ReceiptPreview.tsx`
- Add `expo-image-picker` dependency

#### Features

- Camera capture + gallery picker
- Image preview thumbnail in expense creation
- Upload to Supabase Storage
- Link receipt image to expense record

---

### 🟢 Phase 13: Dead Code & Import Cleanup

**Priority:** P2
**Effort:** 0.5 day

#### Current Problem

Many screens import 15+ hooks but only use ~5:

```typescript
// FriendDetailScreen.tsx imports all of these but uses very few
import { useCreateGroup, useUpdateGroup, useDeleteGroup, useAddGroupMembers } from "...";
import { useAddExpense, useUpdateExpense, useDeleteExpense } from "...";
import { useLogActivity, useDeleteActivity } from "...";
```

#### Solution

- ESLint `--fix` for unused imports across all files
- Remove dead utility functions
- Remove `NewFriendScreen` group-creation workaround

---

### 🟢 Phase 14: Project Structure Refinement

**Priority:** P2
**Effort:** 0.5 day

#### New Structure

```
src/
├── app/                          # Thin route files
├── components/                   # Shared UI components
│   ├── feedback/
│   │   └── EmptyState.tsx        # [NEW] Reusable empty state
│   └── layout/
│       ├── ScreenContainer.tsx   # [NEW] Standard screen wrapper
│       └── StickyHeader.tsx      # [NEW] Reusable header
├── features/                     # Domain features (self-contained)
│   ├── analytics/                # [NEW]
│   └── notifications/            # [NEW]
├── config/
│   └── env.ts                    # [NEW] Validated env vars
├── hooks/
│   ├── useDebounce.ts            # [NEW]
│   └── useRealtime.ts            # [NEW]
├── theme/
│   ├── colors.ts                 # [NEW] Exported constants
│   ├── typography.ts             # [NEW]
│   └── spacing.ts                # [NEW]
└── utils/
    ├── currency.ts               # [NEW]
    └── date.ts                   # [NEW]
```

---

### 🟢 Phase 15: Reusable Screen Patterns

**Priority:** P2
**Effort:** 1 day

#### Components to Extract

- `ScreenContainer` — SafeAreaView + StatusBar + bg color
- `StickyHeader` — duplicated across 4+ screens
- `EmptyState` — duplicated across 5+ screens with same Lottie pattern
- `ListScreen` — FlashList + header + search + empty state combo

#### Savings

~200 lines removed per screen that uses these patterns.

---

### 🟢 Phase 16: Testing Foundation

**Priority:** P2
**Effort:** 2 days

#### Files to Create

- `__tests__/utils/balances.test.ts`
- `__tests__/utils/splits.test.ts`
- `__tests__/services/mappers.test.ts`
- `__tests__/components/AmountDisplay.test.tsx`

---

### 🟢 Phase 17: CI/CD & Build

**Priority:** P2
**Effort:** 0.5 day

#### Changes

- `[NEW] .github/workflows/ci.yml` — Lint + typecheck + test on PR
- Tree-shaking audit for `lucide-react-native` (imports entire icon set via `* as icons`)
- Production-ready `eas.json` build profiles

---

## Flow Improvements

### 1. Expense Creation Flow

| Current                                               | Improved                                       |
| ----------------------------------------------------- | ---------------------------------------------- |
| Multi-step: select group/friend → confirm → fill form | Single-screen form with inline picker dropdown |
| 3+ taps to add expense in known group                 | 1 tap from group detail → pre-filled form      |

### 2. Settlement Flow

| Current                                           | Improved                                          |
| ------------------------------------------------- | ------------------------------------------------- |
| Navigate to friend → tap settle → separate screen | "Settle up" directly from dashboard balance cards |
| Must find friend first                            | One-tap quick settle with pre-filled amount       |

### 3. Group Creation Flow

| Current                                        | Improved                                         |
| ---------------------------------------------- | ------------------------------------------------ |
| Full-screen with icon scroller + preview       | Bottom sheet modal (per reference)               |
| Icon picker is horizontal scroll of 15 options | Inline emoji picker next to title                |
| Members added by email only                    | Members searchable by name from contacts/friends |

### 4. Refresh Mechanism

| Current                                               | Improved                                         |
| ----------------------------------------------------- | ------------------------------------------------ |
| `setTimeout(() => setRefreshing(false), 1000)` — fake | `queryClient.invalidateQueries()` — real refetch |

### 5. Currency Handling

| Current                             | Improved                                  |
| ----------------------------------- | ----------------------------------------- |
| Hardcoded exchange rates in Zustand | Fetch live rates from free API, cache 24h |

### 6. Error Recovery

| Current                  | Improved                                         |
| ------------------------ | ------------------------------------------------ |
| Toast messages, no retry | Retry buttons, offline queue, optimistic updates |

---

## Execution Priority Matrix

| Priority | Phase                           | Effort       | Impact                  | Dependency |
| -------- | ------------------------------- | ------------ | ----------------------- | ---------- |
| ✅ P0    | ~~Phase 1: Design System~~      | ~~2 days~~   | 🟢🟢🟢 ALL screens      | Done       |
| ✅ P0    | ~~Phase 2: Tab Bar~~            | ~~0.5 day~~  | 🟢🟢 Navigation         | Done       |
| ✅ P0    | ~~Phase 3: Dashboard~~          | ~~1.5 days~~ | 🟢🟢🟢 First impression | Phase 1    |
| ✅ P0    | ~~Phase 4: Create Group Sheet~~ | ~~1 day~~    | 🟢🟢 Key flow           | Phase 1    |
| 🔴 P0    | Phase 5: All Screens Alignment  | 2 days       | 🟢🟢🟢 Consistency      | Phase 1    |
| 🟡 P1    | Phase 6: Friends Model          | 1 day        | 🟢🟢 Data integrity     | —          |
| 🟡 P1    | Phase 7: Analytics Tab          | 2 days       | 🟢🟢 New feature        | Phase 2    |
| 🟡 P1    | Phase 8: Profile/Settings       | 1 day        | 🟢🟢 Required for prod  | Phase 2    |
| 🟡 P1    | Phase 9: Onboarding             | 1 day        | 🟢 First-run UX         | Phase 1    |
| 🟡 P1    | Phase 10: Notifications         | 2 days       | 🟢🟢 Engagement         | Phase 3    |
| 🟢 P2    | Phase 11: Data Migration        | 2 days       | 🟢🟢🟢 Real persistence | Phase 6    |
| 🟢 P2    | Phase 12: Receipt Scan          | 1 day        | 🟢 Feature completion   | Phase 11   |
| 🟢 P2    | Phase 13: Dead Code             | 0.5 day      | 🟢 Code quality         | —          |
| 🟢 P2    | Phase 14: Structure             | 0.5 day      | 🟢 Maintainability      | —          |
| 🟢 P2    | Phase 15: Reusable Patterns     | 1 day        | 🟢 DRY code             | Phase 5    |
| 🟢 P2    | Phase 16: Testing               | 2 days       | 🟢🟢 Confidence         | Phase 11   |
| 🟢 P2    | Phase 17: CI/CD                 | 0.5 day      | 🟢 Automation           | Phase 16   |

**Total estimated effort: ~22 days**

---

## Recommended Execution Order

```
Week 1:  Phase 1 → Phase 2 → Phase 3 → Phase 4
Week 2:  Phase 5 → Phase 13 → Phase 14
Week 3:  Phase 6 → Phase 7 → Phase 8
Week 4:  Phase 9 → Phase 10 → Phase 15
Week 5:  Phase 11 → Phase 12
Week 6:  Phase 16 → Phase 17
```
