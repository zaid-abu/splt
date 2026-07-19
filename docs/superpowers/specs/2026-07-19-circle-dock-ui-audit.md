# Splt Circle Dock UI Audit & Alignment

**Date:** 2026-07-19
**Status:** Approved — 3-pass execution
**Reference:** `design/circle-dock-redesign/prototype.css` (visual contract)
**Product:** Splt
**Platforms:** iOS and Android

## Summary

Audit every implemented screen and shared component against the HTML prototype (`design/circle-dock-redesign/`), cataloging all visual and structural discrepancies. Fixes are applied in 3 passes: tokens/components first (fixes ~60% of issues at once), then screen-level alignment, then polish and edge cases.

## How To Compare

For every component and screen, compare against the HTML prototype rendered at `390x844` (iPhone) with light theme. Check against the CSS token values in `prototype.css` (1434 lines) and the rendering logic in `prototype.js` (2508 lines).

## Pass 1: Design Tokens & Shared Components

### 1.1 Theme Token Alignment (`theme.ts` → `prototype.css`)

| Token | Prototype CSS | Current Coral | Change |
|-------|--------------|---------------|--------|
| `canvas` (bg) | `#EFF6FD` | `#EFF6FD` | — |
| `surface` | `#F9FCFF` | `#F9FCFF` | — |
| `ink` (foreground) | `#101B29` | `#101B29` | — |
| `muted` | `#536272` | `#4D5966` | Update to `#536272` |
| `border` | `#C9D6E2` | `#C9D6E2` | — |
| `coral` (accent) | `#F0584B` | `#F0584B` | — |
| `coral-strong` | `#9A342D` | `#5C0E10` | Update accentInk to `#9A342D` |
| `coral-soft` | `#FFDCD6` | `#FFDCD6` | — |
| `emerald` (positive) | `#006D3A` | `#008045` | Update to `#006D3A` |
| `emerald-soft` | `#D0F2DC` | `#D0F2DC` | — |
| `crimson` (negative) | `#A81130` | `#B61537` | Update to `#A81130` |
| `crimson-soft` | `#FFE1E1` | `#FFE1E1` | — |
| `amber` (warning) | `#765300` | `#C08500` | Update to `#765300` |
| `amber-soft` | `#FFF0BF` | — | Add `warningSoft: "#FFF0BF"` |
| `navy` (hero surface) | `#122237` | `#122237` | — |
| `focus` | `#1769AA` | — | Add `focus: "#1769AA"` |
| `control` | `#FFFFFF` | — | Already used via surface |

**Dark mode:** Verify every dark variant in `prototype.css` against `theme.ts` dark colors. The prototype dark palette differs from current Coral dark in several tokens.

### 1.2 Typography Audit

| Scope | Prototype Spec | Current | Status |
|-------|---------------|---------|--------|
| UI font | Instrument Sans (400, 500, 600) | Instrument Sans (400, 500, 600) | Match |
| Mono font | IBM Plex Mono (500, 600) | IBM Plex Mono (500, 600) | Match |
| Title size/weight | Varies by context | Via LargeTitle (36px/32px, 600) | Check alignment |
| Body size | Typically 16px/400 | 16px/400 via text defaults | Check alignment |
| Caption/label | 13px/500 (labels), 13px/400 (captions) | 13px mixed | Audit |

### 1.3 Geometry & Spacing Audit

| Element | Prototype CSS | Current Coral | Check |
|---------|--------------|---------------|-------|
| Control radius | `14px` (`--radius-control`) | `14px` on CoralButton, CoralField | Match |
| Card radius | `16px` (`--radius-card`) | `16px` on BalanceHero | Verify all cards |
| Sheet radius | `24px` (`--radius-sheet`) | `24px` on CoralSheet | Match |
| Dock radius | `18-20px` | `20px` on CircleDock | Match |
| iOS touch target | `44pt` | `44` in Coral components | Match |
| Android touch target | `48dp` | `48` in Coral components | Match |
| Screen gutter (iOS) | Varies; prototype uses `22px` | `22px` in CoralScreen | Match |
| Screen gutter (Android) | Varies; prototype uses `20px` | `20px` in CoralScreen | Match |
| Top bar height | `62px` + safe area | `62px` + insets.top | Match |
| Dock shadow | `0 6px 14px rgba(18,34,55,0.16)` | `0 6px 14px rgba(0,0,0,0.14)` | Update to full spec |

### 1.4 Component-by-Component Audit

#### CoralScreen
- [x] Background color: `coral.bg` — matches canvas
- [x] Gutter: 22 (iOS) / 20 (Android) — matches prototype patterns
- [ ] Content padding: Check if prototype uses additional top spacing for content below top bar
- [ ] Scroll behavior: Prototype uses scroll on list screens, fixed on form screens. Verify match.

#### CoralTopBar
- [ ] **BUG**: `borderBottomColor: color.border` uses old UI system, should be `coral.border`
- [ ] **BUG**: Back button `ChevronLeft` uses `color.text` instead of `coral.foreground`
- [ ] Title centering: Prototype centers title with left/right slots of equal width
- [ ] Blur intensity: Prototype iOS blur opacity vs current `intensity: 80`
- [ ] Bottom border: Prototype may use no border or different border style in some contexts
- [ ] Horizontal padding: `18` (iOS) / `20` (Android) — verify against prototype

#### CoralButton
- [ ] Mixes `useUI()` and `useCoralColors()` — `useUI()` import present but `color` variable unused. Remove.
- [x] Border radius: `14px` — matches prototype `--radius-control`
- [x] Min height: `52px` (solid) / `44` or `48` (text) — reasonable
- [ ] Font size: `16px` — verify against prototype button text size
- [ ] Letter spacing: `0.02 * 16 = 0.32px` — verify
- [ ] Press opacity: `0.78` — verify against prototype press state
- [ ] Disabled opacity: `0.45` — verify against prototype disabled state

#### CoralField
- [ ] **BUG**: Uses `color.muted`, `color.border`, `color.surface`, `color.text` from old `useUI()` — all should use `coral.*`
- [x] Border radius: `14px` — matches
- [ ] Min height: `54px` — verify against prototype form field height
- [ ] Label font: `InstrumentSans_500Medium`, 13px — verify against prototype label style
- [ ] Horizontal padding: `15px` — verify against prototype input padding
- [ ] Gap between label and input: `7px` — verify

#### CoralSheet
- [x] Border radius: `24px` — matches
- [x] Handle bar: `38x5px`, `borderRadius: 4` — reasonable
- [x] Backdrop: `rgba(15, 25, 40, 0.34)` — verify against prototype backdrop
- [x] Shadow: `-4px 16px 0.12` — verify
- [x] Max height: `80%` — matches
- [x] Reduced motion: Supported — matches spec requirement
- [ ] Animation params: Spring damping `28`, stiffness `360` — verify smoothness

#### BalanceHero
- [x] Border radius: `16px` — matches card radius
- [x] Background: `coral.balanceSurface` (navy) — matches prototype
- [ ] Decorative circle: `150x150px`, `opacity: 0.28`, positioned right/top — verify size/position
- [ ] Label font: `13px`, `opacity: 0.72` — verify against prototype
- [ ] Value font: `IBMPlexMono_600SemiBold`, `40px` — matches
- [ ] Note font: `13px`, `opacity: 0.76` — verify

#### CircleDock
- [x] Border radius: `20px` — matches
- [x] Shadow: present — but opacity differs from prototype `rgba(18,34,55,0.16)`
- [ ] Shadow color: Should be `rgba(18,34,55,0.16)` per prototype, not `rgba(0,0,0,0.14)`
- [x] Blur: `intensity 85` (iOS) / `55` (Android) — present
- [x] Tab icons: 22px, with strokeWidth varying by active state — present
- [x] Text labels: 10px, `InstrumentSans_600SemiBold` — present
- [x] Active dot: `4x4px`, coral accent — present
- [x] Center Add button: `56x56px`, coral background, elevated — present
- [ ] Add button shadow: `shadowColor: coral.accent` — verify matches prototype
- [ ] Tab spacing/gap: `2px` gap — verify against prototype
- [ ] Dock padding: `20px` top, `12px` horizontal — verify

#### GlobalActionSheet
- [x] Title: "What would you like to do?" — present
- [x] 5 actions: Add expense, Settle up, Create group, Add person, Schedule expense — present
- [x] Primary action (Add expense) with coral fill — present
- [x] Close button — present
- [ ] Action row height: `56px` — verify against prototype
- [ ] Icon size: `22px` — verify
- [ ] Border radius on action rows: `14px` — verify against prototype task-sheet items

#### LargeTitle
- [ ] Font size: `36px` (iOS) / `32px` (Android) — verify against prototype title sizes
- [ ] Weight: `600` — matches prototype
- [x] Letter spacing: `-0.025em` — matches
- [x] Line height: `1.08` — present

#### Other Components
- **CoralSegment**: Verify tab style, indicator, spacing against prototype segmented control
- **CoralChip**: Verify padding, radius, font against prototype filter chips
- **CoralSelect**: Verify against prototype picker style
- **CoralSnackbar**: Verify toast animation, duration, style against prototype
- **CoralSearchField**: Verify against prototype search field (icon, padding, clear button)
- **MoneyAmount**: Verify font (IBM Plex Mono), tabular figures, size variants
- **MoneyRow**: Verify layout, direction indicators, color coding against prototype
- **GroupTile**: Verify card style, avatar, balance display
- **EmptyState**: Verify illustration/icon, title, description, action button pattern
- **Eyebrow**: Verify small accent label style
- **StatPair**: Verify label/value layout
- **ContextBar**: Verify sub-navigation pattern

## Pass 2: Screen Alignment

### 2.1 Home (MoneyMapScreen)

Compare against prototype: `screens/home.html`

Checklist:
- [ ] Overall balance hero — position, size, colors, decorative circle
- [ ] Balance hero data: label, value, note — copy matches prototype patterns
- [ ] Quick actions below hero — layout, icons, labels
- [ ] Group/person balance ledger — section header, row layout, avatars
- [ ] "What's next" / upcoming section — visibility, content
- [ ] Empty state for new users — "Create Group, Add Person, Add Expense" actions
- [ ] Pull-to-refresh behavior
- [ ] Scroll behavior with dock
- [ ] Bottom spacing for dock clearance

### 2.2 Circles (CirclesScreen)

Compare against prototype: `screens/circles-groups.html`, `screens/circles-people.html`

Checklist:
- [ ] Segmented control: "Groups" / "People" — style matches prototype
- [ ] Search field — position, placeholder, behavior
- [ ] Group list rows — avatar, name, balance, member count/avatars
- [ ] People list rows — avatar, name, balance direction
- [ ] Row press behavior — opens detail, does not show context menu
- [ ] Empty state — "No groups yet" / "No people yet"
- [ ] Loading skeleton
- [ ] Error state with retry

### 2.3 Activity (ActivityScreen)

Compare against prototype: `screens/activity-timeline.html`, `screens/activity-upcoming.html`

Checklist:
- [ ] Segmented control: "Timeline" / "Upcoming" — style
- [ ] Timeline rows — event type icons, description, time, amount
- [ ] Upcoming rows — schedule items, due dates, amounts
- [ ] Empty state — "No activity yet"
- [ ] Search/filter — if implemented

### 2.4 More (MoreScreen)

Compare against prototype: `screens/more.html`

Checklist:
- [ ] Section-based list layout
- [ ] Row items with icons, chevrons
- [ ] Only implemented features shown
- [ ] Profile section at top — avatar, name, email
- [ ] Sign out button — position, style

### 2.5 Add Expense Flow

Compare against prototype: `screens/expense-context.html`, `screens/expense-compose.html`, `screens/expense-split.html`, `screens/expense-success.html`

Checklist:
- [ ] Context selection (circle picker) — list, search, recent
- [ ] Composer: amount, description, context display
- [ ] Payer selection — picker style
- [ ] Split method selection — picker style
- [ ] Date picker — style
- [ ] Category picker — style
- [ ] Receipt attachment — button, preview
- [ ] Split editor (Equal, Exact, Percentage, Weighted) — layout, inputs
- [ ] Participant selection with include/exclude
- [ ] Submit button — position, loading state
- [ ] Success state — receipt card, "View Expense", "Return to Circle"
- [ ] Undo action — if implemented

### 2.6 Expense Detail

Compare against prototype: `screens/expense-detail.html`

Checklist:
- [ ] Total expense display
- [ ] Payer, category, date, circle info
- [ ] Split rows — each person's share and direction
- [ ] Receipt viewing
- [ ] Comments section — if implemented
- [ ] Edit/Delete actions — permissions-aware
- [ ] Financial copy: "Total", "Your share", "You lent", "You borrowed"

### 2.7 Settlement Flow

Compare against prototype: `screens/settlement-compose.html`, `screens/settlement-review.html`, `screens/settlement-success.html`

Checklist:
- [ ] Direction text: "You pay X" or "X pays you"
- [ ] Amount — defaults to open balance, cannot exceed
- [ ] Shortcuts: Full, Half, Custom
- [ ] Method selector — Cash, Bank Transfer, Other
- [ ] Group attribution display
- [ ] Review step — exact balance consequence
- [ ] Success state — receipt, return action

### 2.8 Groups & People

Compare against prototype: `screens/group-create.html`, `screens/group-overview.html`, `screens/group-expenses.html`, `screens/group-settings.html`, `screens/person-detail.html`

Checklist:
- [ ] Group creation: name, icon, currency, members
- [ ] Group overview: net position, people, upcoming items, actions
- [ ] Group expenses: rows with "your share" / "you lent" / "you borrowed"
- [ ] Group settings: identity, preferences, members, leave, delete
- [ ] Person detail: bilateral balance, Add Expense / Settle actions, group-specific balances

### 2.9 Auth Screens

Compare against prototype: `screens/welcome.html`, `screens/login.html`, `screens/register.html`, `screens/forgot-password.html`, `screens/reset-password.html`, `screens/verify-email.html`, `screens/profile-setup.html`, `screens/first-action.html`

Checklist:
- [ ] Welcome screen: brand mark, tagline, CTA buttons
- [ ] Login: email/password fields, submit, forgot password link, register link
- [ ] Register: name/email/password/confirm fields, submit, login link
- [ ] Forgot password: email field, submit, back to login
- [ ] Reset password: new password/confirm fields, submit, success state
- [ ] Verify email: status message, resend action, back to login
- [ ] Profile setup: photo, name, currency, theme
- [ ] First action: Create Group, Add People, Add Expense, Skip

### 2.10 Secondary Screens

Compare against prototype: Various secondary screens

Checklist:
- [ ] Notifications: request actions, read state, empty, error
- [ ] Insights: charts, period controls, category navigation, aggregate labels
- [ ] Currencies: home currency selection, rate freshness
- [ ] Profile: avatar, name, edit action
- [ ] Profile edit: photo, display name
- [ ] Security: password update, biometric, sessions, account deletion
- [ ] Appearance: theme toggle (light/dark)
- [ ] Export: format, date range, progress, completion
- [ ] Help: search, guides, support, terms, privacy

## Pass 3: Polish & Edge Cases

### 3.1 Platform-Specific Behavior

- [ ] iOS: Blur translucency on top bar and dock — verify intensity values
- [ ] Android: Opaque chrome on top bar — verify no blur artifact
- [ ] iOS: Native bottom sheet feel on CoralSheet
- [ ] Android: Material fade-through transitions
- [ ] iOS: 44pt touch targets minimum
- [ ] Android: 48dp touch targets minimum

### 3.2 Dark Mode

- [ ] Every surface has correct dark variant
- [ ] Text contrast meets WCAG AA in dark mode
- [ ] Semantic colors visible in dark mode
- [ ] Blur views use correct tint in dark mode
- [ ] Status bar style switches correctly

### 3.3 States

Every screen should handle:
- [ ] Loading/skeleton state
- [ ] Empty (first use)
- [ ] Empty (filtered/search)
- [ ] Error with retry
- [ ] Offline with cached content
- [ ] Disabled/submitting
- [ ] Success/completion
- [ ] Permission-restricted
- [ ] Not found (after hydration)

### 3.4 Accessibility

- [ ] Screen reader labels on all interactive elements
- [ ] Logical focus order
- [ ] Minimum touch targets (44pt/48dp)
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Reduced motion: instant crossfades instead of spatial transitions

### 3.5 Transitions & Animation

- [ ] Dock tab switch animation
- [ ] Screen push/pop transitions
- [ ] Sheet open/close spring
- [ ] Success state entrance
- [ ] Toast/snackbar animation
- [ ] All replaced with crossfade when reduced motion

### 3.6 Cleanup

- [ ] Remove `useUI()` usage from Coral components (all should use `useCoral()`)
- [ ] Remove unused `color` destructuring from CoralButton
- [ ] Remove duplicative `fontWeight` when `fontFamily` already specifies weight
- [ ] Verify no old warm-ledger colors leak through `UI.color` references in Coral components
- [ ] All AGENTS.md references to `(tabs)` updated to `(shell)`

## Execution Order

1. **Pass 1a:** Fix `theme.ts` tokens → run typecheck
2. **Pass 1b:** Fix component imports (remove `useUI()` usage) → run typecheck
3. **Pass 1c:** Fix visual details in each component → run typecheck + lint
4. **Pass 2:** Screen-by-screen alignment, grouped by feature:
   - 2a: Home (MoneyMapScreen)
   - 2b: Circles (CirclesScreen + Groups/People screens)
   - 2c: Add/Expense flows (NewExpenseScreen, ExpenseDetailScreen, EditExpenseScreen)
   - 2d: Settlement flows
   - 2e: Activity
   - 2f: More + secondary screens
   - 2g: Auth screen
5. **Pass 3:** Platform, dark mode, states, accessibility, transitions, cleanup

## Verification

After each pass:
- `npm run typecheck` — no new errors
- `npm run lint` — no new errors introduced
- Visual comparison against prototype at `390x844` (light mode, iOS)

After all passes:
- Dark mode visual check
- Android visual check at `360x800`
- Reduced motion check
- All screen states verified
