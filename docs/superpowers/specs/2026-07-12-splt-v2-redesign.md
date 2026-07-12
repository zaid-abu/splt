# Splt v2 — Top-Down Redesign Spec

## Overview

A comprehensive redesign of the Splt expense-splitting app across all dimensions: information architecture, visual language, UX flows, feature set, and codebase quality. This spec covers a v2 rebuild using a strangler-fig approach — new screens coexist with old routes until the cutover.

## Design Philosophy: "The Living Ledger"

| v1 ("The Warm Ledger") | v2 ("The Living Ledger") |
|---|---|
| Static screens, navigation-heavy | Fluid gestures, fewer taps |
| Dashboard as a report | Feed as a command center |
| 4 separate tab silos | Unified feed with contextual overlays |
| Flat, calm, editorial | Warm depth, subtle glass, spring animations |
| Color conveys meaning | Color + motion + haptics carry semantic weight |

## Information Architecture

### New Tab Structure

```
Tab Bar: [Feed] [Groups] [Friends] [Profile]
              ↑
        Floating (+) button above tab bar
```

- **Feed** (home): Replaces Dashboard + Activity. Primary scrollable timeline.
- **Groups** tab: Richer group list with filter/search. Deep group detail with tabs.
- **Friends** tab: Balance-aware friends list with sections. Pending requests banner.
- **Profile**: Consolidated settings, preferences, account, quick stats.
- **Floating (+)**: Context-aware quick-add, accessible from Feed, Groups, or Group Detail.

### Navigation Map

```
Feed (home)
├── Quick-Add Sheet (+) → amount-first expense creation
├── Expense Detail → splits, comments, receipt, actions
├── Group Detail (tap group card)
│   ├── [Expenses] [Balances] [Members] [Stats] tabs
│   ├── Add Expense (+) → Quick-Add pre-filled with group
│   └── Settle Up → Settlement flow
├── Friend Detail (tap friend)
│   ├── Shared expenses timeline
│   └── Settle Up / Add Expense quick actions
├── Analytics (tap quick stats) → charts, breakdowns
└── Notifications (bell icon in header) → grouped feed

Groups Tab → Group Detail (same as above)
Friends Tab → Friend Detail (same as above)
Profile Tab → Edit Profile, Preferences, Account actions
```

## Screen Designs

### 1. Feed (Home) Screen

**Balance Header** (collapsible):
- **Expanded**: Full card with net balance amount (charcoal ink), semantic pill ("You owe $X" / "Owed $Y to you"), week-over-week sparkline. Warm ivory surface, 16px radius, 1px warm border.
- **Collapsed**: Single pill showing net amount. Animates on scroll — expand on pull-down, collapse on scroll-up. Haptic bump at transition.
- **Quick Stats Row**: 3 tappable pills — "This week", "This month", "By category". Tap opens mini-analytics sheet.

**Unified Feed** (FlashList):
- Chronological cards for expenses, settlements, friend joins, group creations.
- Each card: category icon badge + color, title, amount (semantic: red/green), relative timestamp, avatar stack.
- **Swipe-right**: mark as reviewed (check icon, green).
- **Swipe-left**: quick actions — Remind (bell), Settle (handshake), View (eye).
- **Long-press**: copy amount, share link.
- Pull-to-refresh, pull-down for search overlay.

**Floating (+) Button**:
- Positioned above tab bar, centered. 56x56px pill, ink tone (#1A1A1A), white "+" icon.
- Subtle idle pulse animation (breathing scale 1.0 → 1.05, 2s cycle).
- Ripple effect on press. Opens amount-first sheet.

### 2. Quick-Add Flow (Bottom Sheet)

**Step 1 — Amount** (hero):
- Large numeric keypad (not a text field). Each digit tap: haptic feedback + spring animation on displayed amount.
- Amount displayed in Sora SemiBold, 36px. Currency symbol prefix.
- Backspace to delete digit. Long-press backspace to clear.

**Step 2 — With Whom**:
- Horizontal carousel: "Recent" — last 5 groups/friends with avatars.
- Search field below: type name/email, results appear instantly.
- "Just a friend" or "Add to group" tabs.

**Step 3 — Split Preview**:
- Auto-calculated based on context (defaults to equal).
- Shows each participant's share. Tap to change split method.
- Category auto-suggested pill (e.g., "Food & Drinks" for $42, "Transport" for $15). Tap to change.
- Optional: notes field, date picker (defaults to today), receipt photo.

**Step 4 — Confirm**:
- Summary card: amount + paid by + split preview + category + date.
- "Add Expense" button (ink tone, full width pill).
- Swipe down to dismiss and save as local draft. Toast: "Draft saved".

### 3. Expense Detail

- **Hero**: Large amount (Sora, 28px), category icon badge, "Paid by [avatar] [name]" line.
- **Split Bar**: Horizontal stacked bar. Each segment = one participant's share. Green = settled, amber = pending, red = overdue. Tap segment → shows participant detail.
- **Participant List**: Each row shows avatar, name, amount, status pill. Tappable to friend detail.
- **Comments**: Thread UI. Each comment has avatar, name, text, timestamp. Text input at bottom with send button. Typing indicator.
- **Receipt**: Tappable thumbnail → full-screen photo viewer with pinch-to-zoom.
- **Header Actions**: Edit (opens quick-add pre-filled), Delete (swipe-to-confirm with destructive sheet).
- **My Share Summary**: If current user hasn't settled, show "You owe $X to [name]" card with "Settle Up" button.

### 4. Groups Tab

- **Header**: "Groups" title (Sora, 24px). "New Group" button (outlined pill) at right.
- **Search**: Pull down or tap search icon → search field with instant filtering.
- **Filter Chips**: All | Active | Settled | Archived. Animated indicator pill.
- **GroupCard List**: FlashList of cards. Each card:
  - Group icon badge (lilac background) + group name + member count.
  - Last activity snippet: "[Name] paid for [category] · 2h ago".
  - Mini avatar stack (3 avatars max + "+N" overflow).
  - Balance pill: "You owe $X" (red) / "Owed $X" (green) / "Settled" (neutral).
- **Long-press**: Quick-action sheet → Add Expense, Settle Up, View Members, Leave/Archive.
- **Empty State**: Animated illustration, "Split expenses with friends", "Create Group" CTA button.

### 5. Group Detail

**Header**:
- Back button (arrow-left) + group icon badge (pulsing when new activity) + group name + settings gear.
- Collapsible: swipe down for full stats overlay.

**Tabbed Content** (swipeable tabs with animated indicator):
- **[Expenses]**: Filtered expense list for this group. Same card design as feed. Swipe actions.
- **[Balances]**: Simplified debt visualization. Directional arrows between members showing who owes whom. "Settle Up" button inline for each debt.
- **[Members]**: Grid of avatars with name + balance below each. Tap for pairwise detail. Long-press to remove (with confirmation).
- **[Stats]**: Category breakdown donut chart (animated), spending over time bar chart, per-person contribution comparison.

**Floating Actions** (2 buttons, bottom-right):
- "+" pill (add expense, opens quick-add pre-filled with group).
- Handshake icon pill (settle up).

### 6. Friends Tab

**Balance Header**:
- Compact overview: "You owe $X total" / "You're owed $Y total".
- Quick actions: "Add Friend" (outlined), "Invite" (share link).

**Section List**:
- Sections: "Owes you" (green tint), "You owe" (red tint), "Settled up" (neutral).
- Each row: avatar + name + balance amount (colored) + chevron right.

**Pending Requests Banner**:
- Slides in from top when there are pending requests.
- Count badge: "3 pending requests". Tap to expand and show list.
- Inline Accept/Reject buttons. Swipe to dismiss banner.

### 7. Friend Detail

- **Header**: Large avatar, name, email. Net balance prominently displayed.
- **Quick Actions**: "Settle Up" (ink button), "Add Expense" (outlined button — pre-selects this friend).
- **Shared Expenses Timeline**: All expenses between you and this friend across all groups.
- **Mutual Groups**: Horizontal scroll of groups you both belong to. Tap to go to group detail.
- **Actions**: Remove friend (destructive, with confirmation sheet).

### 8. Auth Screens

**Welcome**: Lottie animation, "Continue with Google/Apple", email signup link.

**Login**: Biometric-first (Face ID / Touch ID), email fallback, password show/hide toggle, error shake animation.

**Register** (2-step): Step 1: Name + Email. Step 2: Password + Confirm with strength meter. Terms toggle.

**Forgot Password**: Email field → sent state with animated checkmark + resend timer.

### 9. Onboarding

**Slide 1**: Welcome + value prop (Lottie).
**Slide 2**: Currency selection with live preview.
**Slide 3**: "What describes you?" multi-select tags (Trips, Roommates, etc.).
**Slide 4**: Contacts import (optional) + "Get Started".

Progress bar (segmented), back button, skip always visible.

### 10. Profile & Settings

**Header**: Large avatar, name, email, member since.

**Quick Stats**: Groups, Friends, Expenses count — tappable.

**Preferences**: Dark Mode (animated toggle), Default Currency, Default Split Method, Haptic Feedback, Biometric Auth.

**Data**: Export CSV, Privacy settings.

**Account**: Change Password, Linked Accounts (Google/Apple), Delete Account.

**About**: Version, Rate on App Store, Share, Feedback.

### 11. Settlement Flow

- Animated "from → to" avatar flow with swap button.
- Large numeric keypad (reuses quick-add component).
- Quick pills: Full, Half, custom.
- Payment method links (Venmo/PayPal/Cash App) — region-aware.
- Success: celebratory animation, auto-dismiss.

### 12. Analytics

- Time selector: This Week | This Month | This Year | All Time.
- Donut chart (category breakdown), bar chart (spending over time), top categories.
- Export as image or CSV.

### 13. Notifications

- Grouped: Today, Yesterday, This Week, Older.
- Rich cards with inline action buttons (Accept, View, Settle).
- Swipe to dismiss, "Mark all read", notification prefs link.
- Badge on bell icon in feed header.

## Feature Roadmap

### P0 — Must Have for v2 Launch
1. **Floating quick-add**: Add expense from anywhere in 3 taps
2. **Offline support**: Mutation queue + query persistence via persistQueryClient
3. **Push notifications**: expo-notifications + Supabase Edge Functions

### P1 — Core v2 Experience
4. **Deep linking**: splt://group/abc, splt://expense/xyz, shareable invite links
5. **Receipt attachments**: Camera capture + gallery pick + Supabase Storage
6. **AI category suggestion**: Heuristic-based (amount + group context)
7. **Recurring expenses**: Weekly/monthly repeat with auto-creation

### P2 — Delight
8. **Payment integration**: Deep links to Venmo, PayPal, Cash App (region-aware)
9. **Contacts import**: expo-contacts for finding/inviting friends
10. **iOS Widget**: Home screen widget — net balance + top group

### P3 — Post-Launch
11. **Live Activities**: iOS Dynamic Island for active trip splits
12. **CSV export**: Download expense history
13. **Group templates**: Pre-built group types for common scenarios

## Technical Foundation

### P0 — Fix Before v2 Work Starts
| Issue | File | Fix |
|-------|------|-----|
| (supabase as any) | comments.ts | Add expense_comments to Database type |
| Hardcoded query keys | useAuthMutations.ts | Use queryKeys factory |
| All any types | Multiple files | Replace with proper types |
| createGroup race condition | groupsApi.ts | Atomic group creation + member addition |
| deleteAccount order | auth.ts | Sign out before deleting user row |
| No tests | Entire codebase | Jest + testing-library test suite |

### P1 — Core Code Quality
| Change | Scope | Why |
|--------|-------|-----|
| Decompose Dashboard (1320 lines) | → BalanceHeader, QuickStats, FeedList, QuickAddButton | Single responsibility |
| Decompose useExpenseForm (438 lines) | → useSplitCalculator, useParticipantManager, useCategorySuggestion | Maintainability |
| Standardize styling | All screens → Uniwind + className | Consistency |
| Feature-level error boundaries | Each feature screen | Graceful degradation |
| Move useReducedMotion to hooks | From utils/ to hooks/ | Correct directory |
| Deduplicate balance calculations | Single utility module | DRY |
| Make currentUser nullable | User \| null instead of fallback | Type safety |

### P2 — Polish
| Change | Why |
|--------|-----|
| Structured logging | Replace console.* with level-based logger |
| Paid exchange rate API | Replace open.er-api.com (no SLA) |
| Fix package.json name | "my-heroui-native-app" → "splt" |

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- Fix all P0 type safety issues
- Standardize styling approach
- Write tests for mappers, utils, validation
- Decompose large components
- Add feature-level error boundaries
- Polish existing UI component library
- No user-facing changes

### Phase 2: New IA + Core Screens (Weeks 4-7)
- Build new 4-tab layout (Feed | Groups | Friends | Profile)
- Build Feed screen (collapsible balance, stats, unified feed)
- Build floating quick-add + amount-first sheet
- Build new Group Detail with tabs
- Build new Friend Detail
- Keep old routes functional in parallel

### Phase 3: Supporting Screens (Weeks 8-10)
- Redesigned Auth (biometric-first, progressive register)
- New Onboarding (interactive, Lottie, preferences)
- Redesigned Profile + Settings
- Redesigned Settle flow
- Enhanced Analytics
- Redesigned Notifications

### Phase 4: Feature Additions (Weeks 11-15)
- Offline support
- Push notifications
- Deep linking
- Receipt attachments
- AI category suggestions
- Recurring expenses

### Phase 5: Launch Polish (Weeks 16-17)
- Payment integration deep links
- Contacts import
- Performance audit + bundle optimization
- Accessibility audit
- App Store screenshots + metadata
- Remove old v1 code

### Phase 6: Post-Launch (Weeks 18+)
- iOS Widget
- Live Activities
- CSV export
- Group templates
