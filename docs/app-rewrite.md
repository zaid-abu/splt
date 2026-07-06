# SPLT App — Complete Rewrite: Technical Design Specification

> **Goal**: Rewrite every screen, component, and logic layer from scratch to match the reference design (modern fintech bill-splitting app with deep purple/navy theme, illustrated onboarding, dashboard with bill cards, wallet view with charts, and smooth animations everywhere).

---

## Reference Design Analysis

The target design shows 3 key screens:

| Screen | Key Visual Elements |
|--------|-------------------|
| **Dashboard** | Deep navy/purple gradient header, bill cards with amounts & split counts, "Recent Friends" horizontal scroll with circular avatars, "Who's sharing the bill" section, bottom tab bar with 5 icons |
| **Onboarding** | Full-screen illustration (purple/navy gradient with floating money, coins, hands), "Save your time and money" tagline, dot indicators, "Get Started" CTA button |
| **Wallet** | Clean white background, large balance display ($2,540.00), Exchange/Withdraw action buttons, bar chart (Jan-Jun), transaction list with avatars and amounts |

**Design Language**: Deep purple (#3D2B82) and navy (#2B1F5E) gradients, soft white cards, rounded corners (16-20px), clean sans-serif typography, illustrated art style, smooth spring animations.

---

## Current State Audit

> [!CAUTION]
> The current app has fundamental architectural issues that require a complete rewrite:

### Critical Issues Found
1. **Design System Mismatch**: `global.css` uses dark theme with orange primary (#FB923C), but [design.json](file:///Users/abuzaid/Documents/Projects/splt/design/design.json) specifies warm light cream theme, and the reference UI shows deep purple. **None match the target.**
2. **No Auth Guard**: [index.tsx](file:///Users/abuzaid/Documents/Projects/splt/src/app/index.tsx) redirects to `/(tabs)` without checking authentication state.
3. **Heavy Inline Styling**: 10+ feature screens use `StyleSheet.create` directly instead of reusable components. Screens should render **only components, zero custom styles**.
4. **No Skeleton/Loading States**: Screens show nothing while data loads — no shimmer, no skeleton, no progressive loading.
5. **No Pagination**: All lists (groups, expenses, friends, activities) load everything at once.
6. **No Error Boundaries**: No global or feature-level error boundary.
7. **Dual QueryClient**: Both [queryClient.ts](file:///Users/abuzaid/Documents/Projects/splt/src/lib/queryClient.ts) and [AppProviders.tsx](file:///Users/abuzaid/Documents/Projects/splt/src/providers/AppProviders.tsx) create separate `QueryClient` instances.
8. **No Optimistic Updates**: Mutations wait for server response before UI updates.
9. **Missing Memoization**: Computed values (totalOwed, totalOwing, balances) are not memoized.
10. **Empty Feature Directories**: `users/`, `activity/` are stubs with only `.gitkeep`.
11. **No Haptic Feedback**: `expo-haptics` is installed but never used.
12. **No Lottie Animations**: `lottie-react-native` is installed but asset directory is empty.
13. **Placeholder Onboarding**: Current onboarding shows colored squares instead of illustrations.

---

## User Review Required

> [!IMPORTANT]
> **New Design System**: The implementation plan replaces the current dark/orange theme with the reference design's **deep purple/navy gradient** theme. The warm cream theme from `design.json` will be **discarded** in favor of the reference UI. Please confirm this is desired.

> [!IMPORTANT]
> **Font Changes**: The reference design uses a clean sans-serif similar to **Inter** or **DM Sans**. The current `Anton` display font is very heavy/bold and doesn't match. The plan keeps **DM Sans** as primary and **Crimson Text** as display/editorial (for amount displays). `Anton` will be removed. Please confirm.

> [!WARNING]
> **No Backend Changes**: This plan only rewrites the frontend. All Supabase tables, RLS policies, and edge functions remain unchanged. Services will be refactored for better error handling but will still call the same Supabase endpoints.

---

## Open Questions

> [!IMPORTANT]
> 1. **Onboarding Illustrations**: The reference shows custom illustrated art (hands, money, coins in purple gradients). Should we use AI-generated illustrations, or will you provide custom art assets?
> 2. **Wallet Screen**: The reference shows a "Wallet" screen with balance, Exchange/Withdraw buttons, and a bar chart. The current app doesn't have a wallet feature. Should this be the **Analytics tab reimagined as a Wallet**, or is this a new feature?
> 3. **Dark Mode Support**: The reference only shows light mode. Should we maintain dark mode support (current app supports both), or go light-only?
> 4. **Push Notifications**: Current notifications screen is a stub. Should we implement real push notifications in this rewrite, or keep it as a placeholder?

---

## Proposed Architecture

```
src/
├── app/                          # Expo Router screens (ZERO custom styles)
│   ├── _layout.tsx               # Root layout with providers + auth guard
│   ├── index.tsx                 # Smart redirect (auth check → onboarding/tabs)
│   ├── (auth)/                   # Auth flow
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── _layout.tsx           # Custom animated tab bar
│   │   ├── index.tsx             # Dashboard
│   │   ├── wallet.tsx            # Wallet/Analytics (replaces analytics)
│   │   ├── add.tsx               # Create expense (modal presentation)
│   │   ├── groups.tsx            # Groups list
│   │   └── profile.tsx           # Profile & settings
│   ├── onboarding.tsx
│   ├── notifications.tsx
│   ├── expense/
│   ├── friend/
│   ├── group/
│   └── settle/
│
├── components/                   # Reusable design system components
│   ├── primitives/               # [NEW] Base-level atoms
│   │   ├── Text.tsx              # Themed text with variant system
│   │   ├── Pressable.tsx         # Animated pressable with haptics
│   │   ├── Skeleton.tsx          # [NEW] Shimmer loading placeholder
│   │   ├── AnimatedNumber.tsx    # [NEW] Animated number transitions
│   │   └── GradientBackground.tsx # [NEW] Reusable gradient wrapper
│   │
│   ├── animations/               # Animation wrappers
│   │   ├── FadeIn.tsx            # Rewrite with configurable spring
│   │   ├── SlideUp.tsx           # Rewrite with spring physics
│   │   ├── StaggeredList.tsx     # Rewrite with better perf
│   │   ├── ScaleIn.tsx           # [NEW] Scale entrance animation
│   │   └── AnimatedLayout.tsx    # [NEW] Layout animation wrapper
│   │
│   ├── layout/                   # Layout components
│   │   ├── ScreenWrapper.tsx     # Rewrite with gradient support
│   │   ├── ScreenHeader.tsx      # Rewrite matching reference
│   │   ├── ListSection.tsx       # Rewrite with animation
│   │   ├── ListItem.tsx          # Rewrite with swipe actions
│   │   ├── Section.tsx           # [NEW] Generic content section
│   │   └── Spacer.tsx            # [NEW] Spacing component
│   │
│   ├── ui/                       # Visual components
│   │   ├── Avatar.tsx            # Rewrite with image loading states
│   │   ├── AvatarStack.tsx       # Rewrite with animation
│   │   ├── Badge.tsx             # Rewrite with new color system
│   │   ├── IconBadge.tsx         # Rewrite with gradient support
│   │   ├── Divider.tsx           # Keep, minor update
│   │   ├── StatCard.tsx          # Rewrite for wallet screen
│   │   ├── Chip.tsx              # [NEW] Action chips (Exchange, Withdraw)
│   │   └── SearchBar.tsx         # [NEW] Animated search input
│   │
│   ├── cards/                    # Card components
│   │   ├── BillCard.tsx          # [NEW] Dashboard bill split card
│   │   ├── BalanceSummaryCard.tsx # Rewrite for reference design
│   │   ├── ExpenseCard.tsx       # Rewrite with swipe-to-delete
│   │   ├── TransactionCard.tsx   # [NEW] Wallet transaction row
│   │   └── FriendCard.tsx        # [NEW] Circular friend avatar card
│   │
│   ├── charts/                   # Chart components
│   │   ├── SpendingChart.tsx     # Rewrite to match reference bar chart
│   │   └── ChartSkeleton.tsx     # [NEW] Loading state for charts
│   │
│   ├── buttons/                  # Button components
│   │   ├── ActionButton.tsx      # Rewrite with spring animation
│   │   ├── SettleUpButton.tsx    # Rewrite with gradient
│   │   ├── FloatingActionButton.tsx # [NEW] Center tab FAB
│   │   └── IconButton.tsx        # [NEW] Circular icon button
│   │
│   ├── forms/                    # Form components (keep, enhance)
│   │   ├── TextField.tsx         # Enhance with animations
│   │   ├── DropdownField.tsx     # Enhance with animations
│   │   ├── DatePickerField.tsx   # Keep, minor polish
│   │   ├── SliderField.tsx       # Keep, visual update
│   │   ├── ToggleField.tsx       # Keep, visual update
│   │   └── CurrencyInput.tsx     # [NEW] Specialized currency input
│   │
│   ├── feedback/                 # Feedback components
│   │   ├── EmptyState.tsx        # Rewrite with illustrations
│   │   ├── SectionError.tsx      # Rewrite with retry animation
│   │   ├── SkeletonGroup.tsx     # [NEW] Grouped skeleton screens
│   │   ├── Toast.tsx             # [NEW] Animated toast notifications
│   │   └── ErrorBoundary.tsx     # [NEW] Error boundary component
│   │
│   ├── dialogs/                  # Dialog components
│   │   ├── ConfirmDialog.tsx     # Rewrite with spring animation
│   │   └── ActionSheet.tsx       # [NEW] Bottom action sheet
│   │
│   ├── bottom-sheet/             # Bottom sheet components
│   │   └── BottomSheetWrapper.tsx # Enhance with snap animations
│   │
│   ├── navigation/               # [NEW] Navigation components
│   │   ├── TabBar.tsx            # [NEW] Custom animated tab bar built over Expo Router
│   │   ├── TabBarItem.tsx        # [NEW] Individual tab with scale & color animations
│   │   └── HeaderBackButton.tsx  # [NEW] Animated back button
│   │
│   └── onboarding/               # [NEW] Onboarding-specific components
│       ├── OnboardingSlide.tsx   # [NEW] Individual slide
│       ├── OnboardingDots.tsx    # [NEW] Animated page indicator
│       └── OnboardingIllustration.tsx # [NEW] Illustration wrapper
│
├── features/                     # Feature screens (compose components only)
│   ├── auth/
│   │   ├── LoginScreen.tsx       # Rewrite from scratch
│   │   └── RegisterScreen.tsx    # [NEW] Separate register screen
│   │
│   ├── onboarding/
│   │   └── OnboardingScreen.tsx  # Rewrite from scratch
│   │
│   ├── dashboard/
│   │   └── DashboardScreen.tsx   # Rewrite from scratch
│   │
│   ├── wallet/                   # [NEW] Replaces analytics
│   │   └── WalletScreen.tsx
│   │
│   ├── groups/
│   │   ├── GroupListScreen.tsx    # Rewrite
│   │   ├── GroupDetailScreen.tsx  # Rewrite
│   │   ├── CreateGroupScreen.tsx # Rewrite
│   │   ├── EditGroupScreen.tsx   # Rewrite
│   │   └── AddMembersScreen.tsx  # Rewrite
│   │
│   ├── expenses/
│   │   ├── CreateExpenseScreen.tsx # Rewrite as a Bottom Sheet modal (@gorhom/bottom-sheet)
│   │   ├── ExpenseDetailScreen.tsx # Rewrite
│   │   └── EditExpenseScreen.tsx  # Rewrite
│   │
│   ├── friends/
│   │   ├── FriendDetailScreen.tsx # Rewrite
│   │   └── AddFriendScreen.tsx   # Rewrite
│   │
│   ├── settlements/
│   │   ├── SelectFriendScreen.tsx # Rewrite
│   │   └── ConfirmSettlementScreen.tsx # Rewrite
│   │
│   ├── notifications/
│   │   └── NotificationsScreen.tsx # Rewrite with real content
│   │
│   └── profile/
│       └── ProfileScreen.tsx     # Rewrite
│
├── services/                     # API service layer (refactor for error handling)
│   ├── activityService.ts        # Add proper error types
│   ├── analyticsService.ts       # Refactor for wallet data
│   ├── authService.ts            # Keep, add error typing
│   ├── expenseService.ts         # Add optimistic update support
│   ├── friendService.ts          # Add error typing
│   ├── groupService.ts           # Add error typing
│   ├── settlementService.ts      # Add error typing
│   └── userService.ts            # Keep, add error typing
│
├── hooks/                        # Custom hooks
│   ├── useBottomSheet.ts         # Keep
│   ├── useRefreshOnFocus.ts      # Keep
│   ├── useHaptics.ts             # [NEW] Haptic feedback hook
│   ├── useAnimatedValue.ts       # [NEW] Reanimated shared value hook
│   ├── useDebounce.ts            # [NEW] Debounced value hook
│   └── useKeyboard.ts            # [NEW] Keyboard state hook
│
├── queries/                      # TanStack Query hooks (add pagination)
│   ├── activityQueries.ts        # Add infinite query
│   ├── analyticsQueries.ts       # Refactor for wallet
│   ├── expenseQueries.ts         # Add infinite query
│   ├── friendQueries.ts          # Keep, optimize
│   ├── groupQueries.ts           # Keep, optimize
│   ├── settlementQueries.ts      # Add infinite query
│   └── userQueries.ts            # Keep
│
├── mutations/                    # TanStack mutations (add optimistic updates)
│   ├── expenseMutations.ts       # Add optimistic updates
│   ├── friendMutations.ts        # Add optimistic updates
│   ├── groupMutations.ts         # Add optimistic updates
│   └── settlementMutations.ts    # Add optimistic updates
│
├── store/
│   └── appStore.ts               # Enhance with UI preferences
│
├── context/
│   └── AuthContext.tsx            # Refactor with better error states
│
├── providers/
│   └── AppProviders.tsx           # Fix dual QueryClient issue
│
├── config/
│   └── supabase.ts               # Keep
│
├── constants/
│   ├── categories.ts             # Update icons/colors for new theme
│   ├── theme.ts                  # [NEW] Theme constants
│   └── layout.ts                 # [NEW] Layout constants (spacing, sizes)
│
├── types/
│   ├── index.ts                  # Enhance with utility types
│   └── navigation.ts             # [NEW] Type-safe navigation params
│
├── utils/
│   ├── currency.ts               # Keep
│   ├── colors.ts                 # [NEW] Color utilities (pastel generator, etc.)
│   └── haptics.ts                # [NEW] Haptic trigger utilities
│
├── validation/
│   ├── expenseSchema.ts          # Keep
│   ├── groupSchema.ts            # Keep
│   ├── settlementSchema.ts       # Keep
│   └── authSchema.ts             # [NEW] Extract from inline LoginScreen
│
├── lib/
│   └── queryClient.ts            # Keep (remove duplicate in providers)
│
├── theme/                        # [NEW] Theme system
│   └── tokens.ts                 # Design tokens matching reference
│
└── global.css                    # Complete rewrite for new design system
```

---

## Proposed Changes

### Phase 1: Design System Foundation

#### [MODIFY] [global.css](file:///Users/abuzaid/Documents/Projects/splt/src/global.css)
Complete rewrite of the design system tokens to match the reference design:

```css
@theme {
  /* === Core Palette === */
  --color-background: #F5F5F7;          /* Light gray app background */
  --color-surface: #FFFFFF;             /* White card surfaces */
  --color-surface-2: #F0F0F5;          /* Secondary surface */
  --color-surface-3: #E8E8F0;          /* Tertiary surface */
  --color-foreground: #1A1A2E;         /* Primary text (dark navy) */
  --color-muted-foreground: #8E8EA0;   /* Secondary text */
  --color-border: #E5E5EE;             /* Borders */
  --color-divider: #F0F0F5;            /* Dividers */

  /* === Brand: Deep Purple Gradient === */
  --color-primary: #3D2B82;            /* Deep purple (from reference) */
  --color-primary-light: #5B3FA0;      /* Lighter purple */
  --color-primary-dark: #2B1F5E;       /* Darker purple/navy */
  --color-primary-foreground: #FFFFFF;
  --color-primary-soft: rgba(61, 43, 130, 0.08);

  /* === Accent === */
  --color-accent: #6C5CE7;             /* Vibrant purple accent */
  --color-accent-foreground: #FFFFFF;

  /* === Semantic === */
  --color-success: #00C48C;            /* Green for positive amounts */
  --color-success-foreground: #FFFFFF;
  --color-success-soft: rgba(0, 196, 140, 0.10);
  --color-danger: #FF4757;             /* Red for negative/owed */
  --color-danger-foreground: #FFFFFF;
  --color-danger-soft: rgba(255, 71, 87, 0.10);
  --color-warning: #FFBE0B;
  --color-warning-foreground: #1A1A2E;

  /* === Typography === */
  --font-heading: "DMSans_700Bold", sans-serif;
  --font-body: "DMSans_400Regular", sans-serif;
  --font-display: "CrimsonText_600SemiBold", serif;

  /* === Radii === */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-2xl: 32px;
  --radius-full: 9999px;

  /* === Spacing === */
  --spacing-safe-top: env(safe-area-inset-top);
  --spacing-safe-bottom: env(safe-area-inset-bottom);
}
```

**Key Changes**:
- Purple-first color system matching reference UI
- Remove Anton font, keep DM Sans + Crimson Text
- Updated radii to match reference's rounder cards
- Added accent, primary-light, primary-dark tokens

---

#### [NEW] `src/constants/theme.ts`
Programmatic access to theme tokens for use with Reanimated, charts, and SVG:

```typescript
export const Theme = {
  colors: {
    primary: '#3D2B82',
    primaryLight: '#5B3FA0',
    primaryDark: '#2B1F5E',
    accent: '#6C5CE7',
    success: '#00C48C',
    danger: '#FF4757',
    background: '#F5F5F7',
    surface: '#FFFFFF',
    foreground: '#1A1A2E',
    mutedForeground: '#8E8EA0',
  },
  gradients: {
    primary: ['#3D2B82', '#2B1F5E'],      // Dashboard header
    accent: ['#6C5CE7', '#3D2B82'],        // Buttons, highlights
    onboarding: ['#5B3FA0', '#2B1F5E'],   // Onboarding background
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32 },
  radii: { sm: 8, md: 14, lg: 20, xl: 28, full: 9999 },
} as const;
```

---

#### [NEW] `src/constants/layout.ts`
Shared layout constants to ensure consistency:

```typescript
export const Layout = {
  screenPadding: 20,
  cardPadding: 16,
  sectionGap: 24,
  listRowHeight: 64,
  tabBarHeight: 72,
  headerHeight: 56,
  avatarSizes: { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 },
  iconSizes: { sm: 16, md: 20, lg: 24, xl: 32 },
} as const;
```

---

### Phase 2: Primitive Components

#### [NEW] `src/components/primitives/Text.tsx`
Themed text component with variant system — replaces ALL raw `<Text>` usage:

```
Variants: screenTitle, sectionLabel, cardLabel, body, bodySmall, 
          amountLarge, amountSmall, caption, button, link
Props: variant, color, weight, align, numberOfLines, animated
```

#### [NEW] `src/components/primitives/Pressable.tsx`
Animated pressable with haptic feedback on every tap:

```
- Scale animation on press (0.97)
- Opacity animation on press (0.8)
- Optional haptic feedback (light/medium/heavy)
- Animated.View wrapper with configurable entering/exiting
```

#### [NEW] `src/components/primitives/Skeleton.tsx`
Shimmer loading placeholder:

```
- Configurable width, height, borderRadius
- Animated gradient shimmer using Reanimated
- Variants: text, circle, card, listItem, chart
- Composable into SkeletonGroup for screen-level loading
```

#### [NEW] `src/components/primitives/AnimatedNumber.tsx`
Animated number display for amounts:

```
- Smoothly interpolates between values
- Currency formatting built-in
- Spring-based animation
- Used in balance cards, wallet, expense amounts
```

#### [NEW] `src/components/primitives/GradientBackground.tsx`
Reusable gradient wrapper:

```
- Uses expo-linear-gradient
- Preset gradients: primary, accent, onboarding, card
- Configurable start/end points
- Optional animated gradient shift
```

---

### Phase 3: Animation Components

#### [MODIFY] `src/components/animations/FadeIn.tsx`
Rewrite with spring physics:

```
- Replace simple FadeIn with configurable spring damping/stiffness
- Add onAnimationComplete callback
- Add imperativeHandle for programmatic trigger
```

#### [MODIFY] `src/components/animations/SlideUp.tsx`
Same spring-based rewrite.

#### [MODIFY] `src/components/animations/StaggeredList.tsx`
Performance-optimized staggered list:

```
- Use Reanimated layout animations
- FlashList compatible (via renderItem wrapper)
- Configurable stagger direction (up, down, left, right)
- Intersection-observer style "animate on scroll into view"
```

#### [NEW] `src/components/animations/ScaleIn.tsx`
Scale entrance for cards, avatars, buttons:

```
- Scale from 0.8 → 1.0 with spring
- Optional rotation for playful entry
- Configurable delay for staggering
```

#### [NEW] `src/components/animations/AnimatedLayout.tsx`
Wraps children with `LayoutAnimation` for smooth reflows:

```
- Auto-animates height/width changes
- Used when lists add/remove items
- Configurable spring/linear presets
```

---

### Phase 4: Navigation Components

#### [NEW] `src/components/navigation/TabBar.tsx`
Custom animated tab bar matching the reference design:

```
Reference design shows: Home | Chart | Transfer (center) | Clipboard | Document
- 5 tabs with icons
- Center tab is elevated with circular background (purple gradient)
- Active tab has dot indicator below icon
- Smooth icon transition animations on tab switch
- Background: white with subtle shadow
- Uses Reanimated for tab switch animations
```

#### [NEW] `src/components/navigation/TabBarItem.tsx`
Individual tab item with animation:

```
- Icon scales up on active (1.0 → 1.2)
- Color transition (muted → primary)
- Active dot indicator appears with spring
- Haptic feedback on press
```

#### [NEW] `src/components/navigation/HeaderBackButton.tsx`
Animated back/close button:

```
- Circular background
- Scale animation on press
- Haptic feedback
```

---

### Phase 5: UI Components

#### [MODIFY] `src/components/ui/Avatar.tsx`
Rewrite with image loading states:

```
- Shimmer skeleton while image loads
- Smooth fade-in when image arrives
- Keep pastel initials fallback
- Add border ring variant (for active/selected states)
- Online indicator dot (green circle)
```

#### [MODIFY] `src/components/ui/AvatarStack.tsx`
Rewrite with animation:

```
- Animated entry (each avatar slides in from left with stagger)
- "+N more" badge with count
- Press handler to show full list
```

#### [NEW] `src/components/ui/Chip.tsx`
Action chip component (for Exchange, Withdraw buttons in wallet):

```
- Outlined or filled variants
- Leading icon
- Press animation (scale)
- Variants: primary, secondary, outline, ghost
```

#### [NEW] `src/components/ui/SearchBar.tsx`
Animated search input:

```
- Expands from icon → full input on press
- Animated placeholder
- Clear button with fade animation
- Debounced search callback
```

---

### Phase 6: Card Components

#### [NEW] `src/components/cards/BillCard.tsx`
**The signature dashboard card from the reference design**:

```
Reference: Rounded card with gradient background (light blue/purple)
- Top: Icon badge (clipboard) + "..." menu
- Middle: "Total bill" label + "$140.20" large amount
- Bottom: "Split to" label + "2" count
- Left side: "Add Bill" vertical button strip

Layout: Two cards side-by-side in a horizontal scroll
- Uses GradientBackground
- AnimatedNumber for amounts
- IconBadge for category icon
- Scale + fade entrance animation
```

#### [MODIFY] `src/components/cards/BalanceSummaryCard.tsx`
Rewrite for the wallet screen:

```
- Large balance display ($2,540.00 USD)
- "+ Topup" action link
- Exchange / Withdraw action chips
- Clean white card with subtle shadow
```

#### [NEW] `src/components/cards/TransactionCard.tsx`
Wallet transaction row:

```
Reference: Avatar + Name + Date/Time + Amount (+/-) 
- Colored avatar circle
- "Abdrew Robertson" title
- "08 June, 2021 | 09:00" subtitle
- "+ $20.50" in green or "- $12.45" in red
- Press animation
- Swipe to reveal actions (optional)
```

#### [NEW] `src/components/cards/FriendCard.tsx`
Circular friend avatar for the "Recent Friends" horizontal scroll:

```
Reference: Circular avatar + name below
- 56px circle avatar
- Name centered below
- Scale animation on press
- Horizontal FlatList compatible
```

#### [MODIFY] `src/components/cards/ExpenseCard.tsx`
Rewrite with swipe-to-delete:

```
- Swipeable via react-native-gesture-handler
- Delete action revealed on swipe
- Haptic feedback on action reveal
- Expense icon, title, payer, amount
```

---

### Phase 7: Charts

#### [MODIFY] `src/components/charts/SpendingChart.tsx`
Rewrite to match reference bar chart:

```
Reference: Clean bar chart with months (Jan-Jun)
- Bars: Light purple default, dark purple for selected month
- Tooltip: "$7,200" bubble on selected bar
- Labels: Month abbreviations below
- Y-axis: "$0" to "$8k" with gridlines
- Animated bar entry (grow from bottom)
- Touch to select a bar → show tooltip
- Uses react-native-gifted-charts with custom styling
```

#### [NEW] `src/components/charts/ChartSkeleton.tsx`
Loading state:

```
- Shimmer bars matching chart layout
- Animated gradient sweep
```

---

### Phase 8: Feedback Components

#### [NEW] `src/components/feedback/SkeletonGroup.tsx`
Pre-built skeleton screens:

```
Presets:
- DashboardSkeleton: Header + 2 bill cards + friends row + activity list
- WalletSkeleton: Balance card + chart + transactions
- GroupListSkeleton: Section header + 3 list items
- GroupDetailSkeleton: Header + balances + expenses
- ProfileSkeleton: Avatar + info + settings list
```

#### [NEW] `src/components/feedback/Toast.tsx`
Animated toast notification:

```
- Slides down from top with spring
- Auto-dismiss after 3s
- Success/Error/Info variants
- Gesture to dismiss (swipe up)
```

#### [NEW] `src/components/feedback/ErrorBoundary.tsx`
React error boundary:

```
- Catches render errors
- Shows friendly error UI
- Retry button
- Reports error (future: Sentry)
```

#### [MODIFY] `src/components/feedback/EmptyState.tsx`
Rewrite with illustrations:

```
- Use themed illustration instead of just icon
- Animated entrance
- Primary action button (e.g., "Create Group", "Add Friend")
```

---

### Phase 9: Onboarding Components

#### [NEW] `src/components/onboarding/OnboardingSlide.tsx`
Individual onboarding slide:

```
- Full-screen with gradient background
- Top 60%: Illustration area
- Bottom 40%: Title + description + action
- Animated text entrance
```

#### [NEW] `src/components/onboarding/OnboardingDots.tsx`
Animated page indicator:

```
Reference: 3 dots, active dot is wider/filled
- Animated width transition on active
- Color transition (muted → primary)
- Uses Reanimated shared values
```

#### [NEW] `src/components/onboarding/OnboardingIllustration.tsx`
Illustration container:

```
- Displays onboarding artwork
- Optional parallax scroll effect
- Gradient overlay at bottom for text readability
```

---

### Phase 10: Hook Enhancements

#### [NEW] `src/hooks/useHaptics.ts`
```typescript
export function useHaptics() {
  return {
    light: () => Haptics.impactAsync(ImpactFeedbackStyle.Light),
    medium: () => Haptics.impactAsync(ImpactFeedbackStyle.Medium),
    heavy: () => Haptics.impactAsync(ImpactFeedbackStyle.Heavy),
    success: () => Haptics.notificationAsync(NotificationFeedbackType.Success),
    error: () => Haptics.notificationAsync(NotificationFeedbackType.Error),
    selection: () => Haptics.selectionAsync(),
  };
}
```

#### [NEW] `src/hooks/useDebounce.ts`
Debounced value for search inputs:

```
- Generic typed hook
- Configurable delay (default 300ms)
- Cleanup on unmount
```

#### [NEW] `src/hooks/useKeyboard.ts`
Keyboard state tracking:

```
- isKeyboardVisible
- keyboardHeight
- Animated shared value for smooth keyboard-aware layouts
```

---

### Phase 11: Service Layer Refactoring

All services will be refactored for consistent error handling:

#### [MODIFY] Every service file
```typescript
// Before (inconsistent):
try { ... } catch (error) { console.error(error); return []; }
try { ... } catch (error) { throw error; }

// After (consistent):
export class ServiceError extends Error {
  constructor(message: string, public code: string, public cause?: unknown) {
    super(message);
  }
}

// Every service function follows this pattern:
export async function getGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase.from('groups')...;
  if (error) throw new ServiceError('Failed to load groups', 'GROUPS_FETCH', error);
  return data ?? [];
}
```

---

### Phase 12: Query & Mutation Enhancements

#### Infinite Queries for Pagination
```typescript
// Before:
useQuery({ queryKey: ['expenses', groupId], queryFn: () => getByGroup(groupId) })

// After:
useInfiniteQuery({
  queryKey: ['expenses', groupId],
  queryFn: ({ pageParam = 0 }) => getByGroup(groupId, { offset: pageParam, limit: 20 }),
  getNextPageParam: (lastPage, pages) => lastPage.length === 20 ? pages.length * 20 : undefined,
})
```

**Apply to**: expenses, activities, settlements (high-volume lists).

#### Optimistic Updates for Mutations
```typescript
// Example: useCreateExpense
useMutation({
  mutationFn: expenseService.create,
  onMutate: async (newExpense) => {
    await queryClient.cancelQueries({ queryKey: ['expenses'] });
    const previous = queryClient.getQueryData(['expenses']);
    queryClient.setQueryData(['expenses'], (old) => [...old, { ...newExpense, id: 'temp' }]);
    return { previous };
  },
  onError: (err, newExpense, context) => {
    queryClient.setQueryData(['expenses'], context.previous);
    // Show error toast
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
});
```

**Apply to**: all mutations (create, update, delete for expenses, groups, settlements, friends).

---

### Phase 13: Screen Rewrites (Zero Custom Styles)

> [!IMPORTANT]
> **Every screen will ONLY compose reusable components.** No `StyleSheet.create`, no inline styles, no direct `style={{}}` props. All visual customization happens through component props and className tokens.

---

#### Screen 1: Root Layout — [MODIFY] `src/app/_layout.tsx`
```
- Add ErrorBoundary wrapper
- Add auth state listener
- Redirect: no session → (auth)/login, no onboarding → onboarding, else → (tabs)
- Keep font loading with SplashScreen
```

#### Screen 2: Root Index — [MODIFY] `src/app/index.tsx`
```
- Smart redirect based on auth + onboarding state
- Show nothing while determining (splash screen covers)
```

#### Screen 3: Onboarding — [MODIFY] `src/features/onboarding/OnboardingScreen.tsx`
```
Full rewrite matching reference design:

Slide 1: "Split bills effortlessly" 
  - Purple gradient background
  - Illustration of people sharing money (use generated image)
  - OnboardingDots showing 1/3

Slide 2: "Save your time and money" (reference center screen)
  - Deeper purple gradient
  - Illustration matching reference (hands, money, coins floating)
  - OnboardingDots showing 2/3

Slide 3: "Track everything in one place"
  - Navy gradient
  - Illustration of charts/wallet
  - OnboardingDots showing 3/3 + "Get Started" button

Components used: ScreenWrapper, GradientBackground, OnboardingSlide, 
                 OnboardingDots, OnboardingIllustration, Text, Pressable
Animations: Swipe between slides, parallax illustrations, spring dot transitions
Haptics: Selection feedback on swipe, success on "Get Started"
```

#### Screen 4: Login — [MODIFY] `src/features/auth/LoginScreen.tsx`
```
Full rewrite:
- GradientBackground (primary gradient)
- App logo/name at top with FadeIn
- Email TextField with icon
- Password TextField with show/hide toggle
- "Sign In" button (accent gradient, full width)
- "Don't have an account? Register" link → navigates to register
- "Forgot Password?" link
- Error display via Toast component
- Loading state on button

Components: ScreenWrapper, GradientBackground, Text, TextField, 
            Pressable (button), Toast, FadeIn, SlideUp
```

#### Screen 5: Register — [NEW] `src/features/auth/RegisterScreen.tsx`
```
- Same visual style as Login
- Name, Email, Password, Confirm Password fields
- Terms acceptance toggle
- "Create Account" button
- "Already have an account? Sign In" link
```

#### Screen 6: Dashboard — [MODIFY] `src/features/dashboard/DashboardScreen.tsx`
```
Full rewrite matching reference left screen:

Section 1: Header
  - "Dashboard" title with ScreenHeader
  - User avatar (top right) → navigates to profile
  - Notification bell with badge count

Section 2: Bill Cards (horizontal scroll)
  - BillCard components showing active bills
  - "Add Bill" button on the left edge
  - Two cards visible: Total bill + split count
  - Animated entrance (slide in from right)

Section 3: Recent Friends
  - Section header with search icon action
  - Horizontal scroll of FriendCard components
  - Circular avatars with names below
  - Navigate to friend detail on press

Section 4: Who's Sharing the Bill
  - List of current bill participants
  - AvatarStack showing who's involved
  - Arrow button → navigate to group detail

Section 5: Bottom (handled by TabBar)

Components: ScreenWrapper, ScreenHeader, BillCard, FriendCard, 
            ListSection, ListItem, AvatarStack, Badge, Avatar,
            Text, Pressable, FadeIn, StaggeredList, Skeleton/SkeletonGroup
State: Pull-to-refresh with RefreshControl
Data: useUserGroups, useFriends, useActivities (memoized computations)
```

#### Screen 7: Wallet (replaces Analytics) — [NEW/MODIFY] `src/features/wallet/WalletScreen.tsx`
```
Full rewrite matching reference right screen:

Section 1: Header
  - "Your wallet" title
  - User avatar (top right)

Section 2: Balance Display
  - "Balance" label
  - Large animated number: "$ 2,540.00 USD"
  - "+ Topup" action link

Section 3: Action Chips
  - "Exchange" chip with icon (left)
  - "Withdraw" chip with icon (right)

Section 4: Spending Chart
  - SpendingChart component (bar chart, Jan-Jun)
  - Interactive: tap bar to see amount tooltip
  - Animated bar entry

Section 5: Transactions
  - Section header with search icon
  - TransactionCard list (avatar, name, date, amount)
  - Color-coded amounts (green positive, red negative)
  - Paginated with infinite scroll

Components: ScreenWrapper, ScreenHeader, Text, AnimatedNumber,
            Chip, SpendingChart, TransactionCard, ListSection,
            Avatar, Badge, SearchBar, FadeIn, SlideUp, SkeletonGroup
```

#### Screen 8: Groups List — [MODIFY] `src/features/groups/GroupListScreen.tsx`
```
- ScreenWrapper with pull-to-refresh
- ScreenHeader "Groups" with "+" action button
- StaggeredList of group ListItems
  - IconBadge (group icon)
  - Group name + member count
  - Balance badge (green/red)
  - Chevron right
- "Add new group" row at bottom
- EmptyState when no groups
- SkeletonGroup while loading
```

#### Screen 9: Group Detail — [MODIFY] `src/features/groups/GroupDetailScreen.tsx`
```
- ScreenWrapper
- ScreenHeader with group name, back button, edit/delete actions
- Section: Members with balance bars
  - ListItem per member with Avatar, name, balance Badge
  - "Add Members" button
- Section: Recent Expenses
  - ExpenseCard list (swipeable)
  - "See All" action → future full list
- Section: Settlements
  - Settlement ListItems
  - SettleUpButton
- ConfirmDialog for delete actions
```

#### Screen 10: Create Group — [MODIFY] `src/features/groups/CreateGroupScreen.tsx`
```
- ScreenWrapper (scroll mode)
- ScreenHeader "Create Group" with close button
- TextField: Group name (with icon)
- DropdownField: Currency selector
- Section: Participants
  - Friend picker (search + select from friends)
  - Selected friends as chips/avatars
  - Remove button per participant
- "Create Group" primary button
- Footnote: "All participants will receive an invite"
```

#### Screen 11: Edit Group — [MODIFY] `src/features/groups/EditGroupScreen.tsx`
```
Same structure as Create, pre-filled with group data.
```

#### Screen 12: Add Members — [MODIFY] `src/features/groups/AddMembersScreen.tsx`
```
- ScreenWrapper
- ScreenHeader "Add Members" with back button
- SearchBar (animated)
- Section: Your Friends (filterable)
  - ListItems with Avatar, select checkbox
- Section: Search Results
  - ListItems with "Invite" action
- "Add Selected" primary button (shows count)
```

#### Screen 13: Create Expense — [MODIFY] `src/features/expenses/CreateExpenseScreen.tsx`
```
- BottomSheetWrapper (snaps to 90%, keyboard-aware)
- Sheet Header "New Expense" with close button
- CurrencyInput: Large amount display (animated)
- TextField: Title/description
- DropdownField: Category (with icon)
- DropdownField: Group selector
- DropdownField: Paid by
- Section: Split Method
  - Toggle between Equal / Custom / Percentage
  - Per-person split input (when custom/percentage)
  - Real-time validation of split total
- DatePickerField
- TextField: Notes (optional)
- "Create Expense" primary button sticky at bottom
```

#### Screen 14: Expense Detail — [MODIFY] `src/features/expenses/ExpenseDetailScreen.tsx`
```
- ScreenWrapper
- ScreenHeader with back, edit, delete actions
- Large amount display with AnimatedNumber
- Category IconBadge + title
- Payer section with Avatar
- Date display
- Section: Split Breakdown
  - ListItem per person with Avatar, amount, paid status Badge
- Notes section (if present)
- ConfirmDialog for delete
```

#### Screen 15: Edit Expense — [MODIFY] `src/features/expenses/EditExpenseScreen.tsx`
```
Same as Create Expense, pre-filled. Shows "Save Changes" button.
```

#### Screen 16: Friend Detail — [MODIFY] `src/features/friends/FriendDetailScreen.tsx`
```
- ScreenWrapper
- ScreenHeader with back button
- Avatar (large, centered) with name + email
- Balance section: AnimatedNumber with color (owe/owed)
- Section: Shared Groups
  - ListItems per shared group
- SettleUpButton
- "Remove Friend" destructive button
```

#### Screen 17: Add Friend — [MODIFY] `src/features/friends/AddFriendScreen.tsx`
```
- ScreenWrapper
- ScreenHeader "Add Friend"
- SearchBar (animated, debounced)
- Section: Search Results
  - ListItems with Avatar, name, email
  - "Add" action button per result
- EmptyState when no results
```

#### Screen 18: Select Friend (Settlement) — [MODIFY] `src/features/settlements/SelectFriendScreen.tsx`
```
- ScreenWrapper
- ScreenHeader "Settle Up"
- StaggeredList of friends with balances
  - Avatar, name, balance amount + direction
  - Color-coded (red owe, green owed)
- EmptyState when no balances
```

#### Screen 19: Confirm Settlement — [MODIFY] `src/features/settlements/ConfirmSettlementScreen.tsx`
```
- ScreenWrapper
- ScreenHeader "Confirm Settlement"
- Animated flow: Your Avatar → arrow → Friend Avatar
- CurrencyInput: Settlement amount
- TextField: Note (optional)
- "Confirm Settlement" primary button
- Success animation (Lottie checkmark) on completion
```

#### Screen 20: Notifications — [MODIFY] `src/features/notifications/NotificationsScreen.tsx`
```
- ScreenWrapper
- ScreenHeader "Notifications" with "Mark all read" action
- StaggeredList of notification items
  - Different types: expense added, settlement, friend request, group invite
  - Unread indicator dot
  - Relative timestamps
- EmptyState with illustration when empty
```

#### Screen 21: Profile — [MODIFY] `src/features/profile/ProfileScreen.tsx`
```
- ScreenWrapper
- ScreenHeader "Profile"
- Avatar (xl size) with name, email below
- Section: Account
  - Edit Profile, Change Password, Default Currency
- Section: Preferences
  - Dark Mode toggle
  - Notifications toggle
  - Haptic Feedback toggle
- Section: About
  - Version, Terms, Privacy Policy, Rate App
- Sign Out button (danger variant)
```

#### Screen 22: Welcome (Auth) — [MODIFY] `src/features/auth/WelcomeScreen.tsx`
```
- First screen seen if not logged in and onboarding is complete
- Animated logo entrance
- "Log In" button (primary)
- "Create Account" button (secondary)
- Matches new purple gradient theme
```

#### Screen 23: Tab Layout — [MODIFY] `src/app/(tabs)/_layout.tsx`
```
- Implement new custom TabBar component
- 5 Tabs: Dashboard, Wallet, Transfer (Center FAB), Groups, Profile
- (Existing `stats.tsx` will be replaced by `wallet.tsx`)
- (Existing `activity.tsx` and `friends.tsx` will be integrated into Dashboard/Groups or deprecated)
```

#### Screen 24: Group Settle — [MODIFY] `src/features/groups/GroupSettleScreen.tsx`
```
- Group-specific settle up flow
- Pre-selects the group context
- Shows who owes who within the specific group
- Confirm dialog with animated Lottie checkmark
```

#### Screen 25: Activity List — [MODIFY] `src/features/activity/ActivityScreen.tsx`
```
- Standalone activity feed (if separated from Dashboard)
- Infinite scroll of all expense/settlement actions
- Interactive items leading to expense details
```

#### Screen 26: Friends List — [MODIFY] `src/features/friends/FriendsListScreen.tsx`
```
- Standalone friends directory (if separated from Dashboard)
- Searchable list of all friends
- "Add Friend" floating action button
```

---

### Phase 14: Provider & Context Fixes

#### [MODIFY] `src/providers/AppProviders.tsx`
```
- Remove inline QueryClient creation
- Import singleton from src/lib/queryClient.ts
- Add ErrorBoundary wrapper
- Ensure correct provider nesting order
```

#### [MODIFY] `src/context/AuthContext.tsx`
```
- Add loading states for session check
- Add error states for auth failures
- Add auto-redirect logic (no session → auth flow)
- Export useAuth hook from context file directly
```

---

### Phase 15: Performance Optimizations

| Optimization | Where | How |
|---|---|---|
| **Memoize computations** | DashboardScreen, GroupDetail | `useMemo` for totalOwed, totalOwing, sorted lists |
| **FlashList everywhere** | All list screens | Replace `FlatList` with `@shopify/flash-list` |
| **Image caching** | Avatar | Use `expo-image` (consider adding to deps) for progressive loading |
| **Lazy component loading** | Heavy screens | `React.lazy` + Suspense for expense forms, charts |
| **Debounced search** | AddFriend, AddMembers, SearchBar | useDebounce hook (300ms) |
| **List item memoization** | All list items | `React.memo` with custom comparators |
| **Reduce re-renders** | Forms | `useForm` with `mode: 'onBlur'` to reduce validation re-renders |
| **Query deduplication** | Duplicate QueryClient | Fix singleton pattern |

---

## Verification Plan

### Automated Tests
```bash
# Type checking - ensure no TypeScript errors
npx tsc --noEmit

# Lint - ensure code quality
npm run lint

# Unit tests
npm run test
```

### Manual Verification
1. **Build verification**: `npx expo start` — app launches without crashes
2. **Auth flow**: Login → Dashboard, Logout → Login screen
3. **Onboarding**: First launch shows onboarding, subsequent launches skip
4. **Dashboard**: Bill cards scroll, friends scroll, activity loads
5. **Wallet**: Balance displays, chart renders, transactions paginate
6. **Groups**: CRUD operations (create, view, edit, delete)
7. **Expenses**: CRUD with split calculations
8. **Settlements**: Select friend → confirm → success
9. **Animations**: Every screen has smooth entrance animations
10. **Skeleton loading**: Every screen shows skeleton before data loads
11. **Error states**: Disconnect network → error states show with retry
12. **Pull-to-refresh**: All list screens support pull-to-refresh
13. **Haptics**: Buttons, tabs, swipe actions trigger haptic feedback
14. **Performance**: Smooth 60fps scrolling on large lists (FlashList)

---

## Execution Order (Recommended)

| Phase | Description | Estimated Scope |
|-------|-------------|-----------------|
| 1 | Design system (`global.css`, theme tokens, layout constants) | 3 files |
| 2 | Primitive components (Text, Pressable, Skeleton, AnimatedNumber, Gradient) | 5 files |
| 3 | Animation components (rewrite + new) | 5 files |
| 4 | Navigation components (TabBar, TabBarItem, HeaderBackButton) | 3 files |
| 5 | UI components (Avatar, Badge, Chip, SearchBar, etc.) | 8 files |
| 6 | Card components (BillCard, TransactionCard, FriendCard, etc.) | 5 files |
| 7 | Chart components (SpendingChart rewrite, ChartSkeleton) | 2 files |
| 8 | Feedback components (Skeleton, Toast, ErrorBoundary, EmptyState) | 5 files |
| 9 | Onboarding components (Slide, Dots, Illustration) | 3 files |
| 10 | Hooks (useHaptics, useDebounce, useKeyboard) | 3 files |
| 11 | Service layer refactoring (error typing) | 8 files |
| 12 | Queries & Mutations (pagination, optimistic updates) | 8 files |
| 13 | Provider & Context fixes | 2 files |
| 14 | Validation schemas (extract auth schema) | 1 file |
| 15 | Screen rewrites: Auth (Login, Register) | 2 files |
| 16 | Screen rewrite: Onboarding | 1 file |
| 17 | Screen rewrite: Dashboard | 1 file |
| 18 | Screen rewrite: Wallet | 1 file |
| 19 | Screen rewrites: Groups (5 screens) | 5 files |
| 20 | Screen rewrites: Expenses (3 screens) | 3 files |
| 21 | Screen rewrites: Friends (2 screens) | 2 files |
| 22 | Screen rewrites: Settlements (2 screens) | 2 files |
| 23 | Screen rewrites: Notifications, Profile | 2 files |
| 24 | Route layouts & tab bar integration | 4 files |
| 25 | Polish: Verify all animations, test all flows, fix edge cases | — |

**Total**: ~85 files to create or modify across 25 phases.
