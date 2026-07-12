# Development Progress Tracker

## Legend

- ✅ Done
- 🔄 In Progress
- 📋 Planned

## Phase 1: Foundation ✅

| Item                            | Status | Notes                                                            |
| ------------------------------- | ------ | ---------------------------------------------------------------- |
| Project scaffolding (Expo + TS) | ✅     | Expo SDK 56, React Native 0.85                                   |
| File-based routing setup        | ✅     | Expo Router with auth/tabs/group/expense/friend routes           |
| Provider tree                   | ✅     | GestureHandler, SafeArea, QueryClient, HeroUI, BottomSheet, Auth |
| Environment config              | ✅     | Zod-validated env vars for Supabase                              |
| Linting & formatting            | ✅     | ESLint (expo-config), Prettier                                   |
| CI/CD pipelines                 | ✅     | GitHub Actions (CI + CD)                                         |

## Phase 2: Auth & Onboarding ✅

| Item                   | Status | Notes                                           |
| ---------------------- | ------ | ----------------------------------------------- |
| Supabase client setup  | ✅     | AsyncStorage persistence, auto-refresh          |
| Auth service layer     | ✅     | signUp, signIn, signOut, session, password mgmt |
| Auth context           | ✅     | useAuth hook with routing guards                |
| Login screen           | ✅     | Email/password with Zod validation              |
| Register screen        | ✅     | Name, email, password, confirm password         |
| Forgot password screen | ✅     | Email-only flow                                 |
| Welcome screen         | ✅     | Entry point for unauthenticated users           |
| Onboarding flow        | ✅     | Multi-slide animated onboarding                 |
| Auth routing guard     | ✅     | Redirects unauthenticated users to welcome      |

## Phase 3: Navigation & Shell ✅

| Item              | Status | Notes                                             |
| ----------------- | ------ | ------------------------------------------------- |
| Tab bar layout    | ✅     | 4 tabs with blur, animations, haptics, active dot |
| Root stack layout | ✅     | Auth, onboarding, tabs, modal routes              |
| Screen headers    | ✅     | Native-style headers with back button             |

## Phase 4: Dashboard

| Item                 | Status | Notes                                    |
| -------------------- | ------ | ---------------------------------------- |
| Dashboard screen     | ✅     | Greeting, balance summary, quick actions |
| Balance summary card | ✅     | Owe/owed panels, settle-up action        |
| Balance calculations | ✅     | Computed from expenses and settlements   |
| Empty state          | ✅     | No-data state with action                |

## Phase 5: Groups

| Item                     | Status | Notes                                             |
| ------------------------ | ------ | ------------------------------------------------- |
| Groups list screen       | ✅     | Summary cards, search, filter pills, stacked rows |
| Group creation screen    | ✅     | Name, icon picker, member selection               |
| Group detail screen      | ✅     | Balance card, expense list, members               |
| Group settings screen    | ✅     | Edit group, add/remove members                    |
| Group settle screen      | ✅     | Simplify debts flow                               |
| Group card component     | ✅     | Summary card with balance, member count           |
| Group row component      | ✅     | List row with icon, name, balance                 |
| User search bottom sheet | ✅     | Searchable user selection                         |

## Phase 6: Expenses

| Item                        | Status | Notes                                 |
| --------------------------- | ------ | ------------------------------------- |
| New expense screen          | ✅     | Full-screen form, split preview       |
| Expense detail screen       | ✅     | Full expense view                     |
| Expense form participants   | ✅     | Friend/group participant selection    |
| Expense form splits         | ✅     | Equal/custom/percentage split methods |
| Transaction row component   | ✅     | List row for expenses                 |
| Expense queries             | ✅     | Fetch by group/user/ID                |
| Expense API service         | ✅     | CRUD with splits management           |
| Split calculation utilities | ✅     | Equal, custom, percentage splits      |

## Phase 7: Friends

| Item                   | Status | Notes                                                |
| ---------------------- | ------ | ---------------------------------------------------- |
| Friends list screen    | ✅     | Summary shell, attention card, filters, grouped rows |
| Friend detail screen   | ✅     | Balance card, shared expenses, actions               |
| New friend screen      | ✅     | Add by email or user search                          |
| Friend queries         | ✅     | useFriends hook                                      |
| Friendship service     | ✅     | CRUD with accept/reject/pending flows                |
| Pending requests       | ✅     | Attention card with accept/reject                    |
| Balance-based grouping | ✅     | Owes you / You owe / Settled sections                |

## Phase 8: Settlements

| Item                   | Status | Notes                                   |
| ---------------------- | ------ | --------------------------------------- |
| Settlement screen      | ✅     | Settlement form with participant select |
| Settlement list        | ✅     | Group and user settlement history       |
| Balance utilities      | ✅     | Net balance calculations                |
| Settlement queries     | ✅     | Group and user settlement fetching      |
| Settlement API service | ✅     | CRUD operations                         |

## Phase 9: Activity Feed

| Item                    | Status | Notes                                           |
| ----------------------- | ------ | ----------------------------------------------- |
| Activity screen         | ✅     | Chronological timeline                          |
| Activity item component | ✅     | Polymorphic display (expense, settlement, etc.) |
| Activity filter         | ✅     | All / You paid / You owe                        |
| Activity API service    | ✅     | Fetch, log, delete activities                   |
| Activity queries        | ✅     | useActivities hook                              |

## Phase 10: Analytics / Stats

| Item               | Status | Notes                                   |
| ------------------ | ------ | --------------------------------------- |
| Analytics screen   | ✅     | Monthly breakdown with charts           |
| Category breakdown | ✅     | Spending by category with progress bars |
| Top expenses       | ✅     | Highest expense items                   |
| Analytics hooks    | ✅     | Data computation and aggregation        |
| Stats placeholder  | ✅     | Tab route for stats                     |

## Phase 11: Notifications

| Item                 | Status | Notes                          |
| -------------------- | ------ | ------------------------------ |
| Notifications screen | ✅     | Friend requests and updates    |
| Notification queries | ✅     | Fetch and manage notifications |
| Dashboard bell icon  | ✅     | Quick access from dashboard    |

## Phase 12: Profile

| Item                     | Status | Notes                       |
| ------------------------ | ------ | --------------------------- |
| Profile screen           | ✅     | User info, settings, logout |
| Profile edit screen      | ✅     | Name and email editing      |
| Change password screen   | ✅     | Password update form        |
| Profile update hooks     | ✅     | Mutation hooks              |
| Settings items component | ✅     | Reusable settings row       |

## Phase 13: UI Component Library

| Item                            | Status | Notes                                                                                                                               |
| ------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| native-ui.tsx (core primitives) | ✅     | PressableScale, IconButton, PrimaryButton, SectionLabel, SearchField, ScreenHeader, MetricCell, FilterPill, ListSection, EmptyState |
| MemberAvatar                    | ✅     | Framed avatar with initials/photo                                                                                                   |
| GroupIconBadge                  | ✅     | Group identity icon                                                                                                                 |
| CategoryIconBadge               | ✅     | Category-specific icon                                                                                                              |
| Card                            | ✅     | Reusable card container                                                                                                             |
| ListRow                         | ✅     | Configurable list row                                                                                                               |
| BottomActionBar                 | ✅     | Fixed bottom action area                                                                                                            |
| AmountDisplay                   | ✅     | Formatted money display                                                                                                             |
| Skeleton                        | ✅     | Loading skeleton                                                                                                                    |
| Toast                           | ✅     | Toast notifications                                                                                                                 |
| MoneySignal                     | ✅     | Financial amount with color                                                                                                         |
| SheetContainer                  | ✅     | Bottom sheet wrapper                                                                                                                |
| SheetBackground                 | ✅     | Sheet background component                                                                                                          |
| HapticButton                    | ✅     | Button with haptic feedback                                                                                                         |
| ErrorState                      | ✅     | Error display with retry                                                                                                            |
| AppLoader                       | ✅     | App-level loading screen                                                                                                            |
| FormInput                       | ✅     | Form field with validation                                                                                                          |
| CurrencySelector                | ✅     | Currency picker sheet                                                                                                               |
| PasswordStrengthMeter           | ✅     | Password strength indicator                                                                                                         |
| ConfirmationSheet               | ✅     | Confirmation dialog sheet                                                                                                           |
| Backdrop                        | ✅     | Bottom sheet backdrop                                                                                                               |
| PageAnimator                    | ✅     | Page transition animation                                                                                                           |
| SwipeableRow                    | ✅     | Swipe-to-action row                                                                                                                 |
| GlobalQueryToast                | ✅     | React Query error toast                                                                                                             |
| ErrorFallback                   | ✅     | Error boundary fallback                                                                                                             |

## Phase 14: Database Schema & Migrations

| Item                 | Status | Notes                                   |
| -------------------- | ------ | --------------------------------------- |
| Initial schema       | ✅     | 202607040001_initial_schema.sql         |
| RLS policies         | ✅     | 202607040002_rls_policies.sql           |
| Expense RLS fix      | ✅     | 202607040003_fix_expense_rls.sql        |
| Friends table        | ✅     | 202607040004_friends_table.sql          |
| Delete cascades      | ✅     | 202607040005_fix_delete_cascades.sql    |
| Settlements RLS fix  | ✅     | 202607040006_fix_settlements_rls.sql    |
| Group members RLS    | ✅     | Multiple fixes for insert/delete/update |
| Expense creator fix  | ✅     | 202607050005_fix_expense_creator.sql    |
| Friend group invites | ✅     | 202607050006_friend_group_invites.sql   |
| Delete account RLS   | ✅     | 202607050007_delete_account_rls.sql     |
| Expense comments     | ✅     | 202607050008_expense_comments.sql       |

## Phase 15: Architecture & Documentation

| Item                           | Status | Notes                                |
| ------------------------------ | ------ | ------------------------------------ |
| ADR 001: Architecture strategy | ✅     | Feature-sliced design, 4-tier state  |
| DESIGN.md                      | ✅     | Full design system documentation     |
| PRODUCT.md                     | ✅     | Product purpose, brand, principles   |
| AGENTS.md                      | ✅     | AI agent context file                |
| Design tokens                  | ✅     | JSON + TS constants + CSS variables  |
| UI registry                    | ✅     | Component visual properties registry |
| Build docs                     | ✅     | docs/build.md                        |
| Library docs                   | ✅     | docs/libraries.md                    |
| Progress tracker               | ✅     | docs/progress-tracker.md             |
| Design system docs             | ✅     | docs/design-system.md                |

## Phase 16: Dark Mode Polish ✅

| Item                            | Status | Notes                                                             |
| ------------------------------- | ------ | ----------------------------------------------------------------- |
| Uniwind theme init on startup   | ✅     | `Uniwind.setTheme()` called in `_layout.tsx`                      |
| Native interface style          | ✅     | `app.json` set to `"automatic"` for system chrome adaptation      |
| ThemedStatusBar component       | ✅     | Dynamic `StatusBar` based on `isDarkMode`                         |
| BlurredSheetBackground tint     | ✅     | Dynamic `tint` prop based on theme                                |
| Module-scope color constants    | ✅     | Fixed in GroupCard, ExpenseFormSplits, ActivityItem, AppLoader    |
| Onboarding screen theming       | ✅     | All hardcoded colors replaced with `UI.color.*`                   |
| SwipeableRow delete sheet       | ✅     | Hardcoded colors replaced with `UI.color.*`                       |
| ErrorState/ErrorFallback colors | ✅     | `#FFFFFF` → `UI.color.textInverse` on dark-bg buttons             |
| textInverse color token         | ✅     | Added to `LIGHT_COLORS`/`DARK_COLORS` for button text contrast    |
| StatsPlaceholder colors         | ✅     | Hardcoded bg/icon replaced with Tailwind classes + `UI.color.*`   |
| All 28 StatusBar instances      | ✅     | Replaced `StatusBar style="dark"` with `<ThemedStatusBar />`      |
| Tab bar blur tint               | ✅     | Dynamic `tint={isDarkMode ? "dark" : "light"}`                    |
| HapticButton text contrast      | ✅     | `#FFFFFF` → `UI.color.textInverse` for "ink" tone buttons         |
| PrimaryButton text contrast     | ✅     | Callers use `UI.color.textInverse` instead of `#FFFFFF`           |
| FilterPill text contrast        | ✅     | Active state uses `UI.color.textInverse`                          |
| FriendsScreen module constants  | ✅     | Replaced module-scope `TEXT_PRIMARY`/etc. with inline `UI.color`  |
| FriendDetailScreen constants    | ✅     | Same fix — module-scope tokens now reference `UI.color` at render |
| NewFriendScreen constants       | ✅     | Same fix — removed module-scope `BG`/`TEXT_PRIMARY`/etc.          |
| NewGroupScreen module constants | ✅     | Removed `BG`/`TEXT_PRIMARY`/etc. — inline `UI.color.*` now        |
| GroupDetailScreen buttons       | ✅     | Inline styles replace `StyleSheet.create` for theme-dependent     |
| DashboardScreen empty CTA       | ✅     | `#FFFFFF` → `UI.color.textInverse` on dark-bg buttons             |
| BalanceCard settle-up button    | ✅     | `#FFFFFF` → `UI.color.textInverse`                                |
| GroupsScreen create button      | ✅     | `#FFFFFF` → `UI.color.textInverse` + `UI.color.textInverse` icon  |
| Auth screen buttons             | ✅     | login, register, forgot-password, edit, change-password           |
| TopExpenses log-expense button  | ✅     | `#FFFFFF` → `UI.color.textInverse`                                |
| ActivityItem view-details       | ✅     | `#FFFFFF` → `UI.color.textInverse`                                |
| NewExpenseScreen check/icons    | ✅     | `#FFFFFF` → `UI.color.textInverse` on `UI.color.text` bg          |
| GroupSettings icon picker       | ✅     | `#FFFFFF` → `UI.color.textInverse` for selected state             |
| CurrencySelector dark colors    | ✅     | Hardcoded `#F7F1EA`/etc. → `UI.color.subtle`                      |

## Phase 17: Haptics + Polish Pass (WIP)

| Item                                         | Status | Notes                                                                                                                            |
| -------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| ProfileScreen loading/error states           | ✅     | Skeleton, ErrorState, pull-to-refresh, Card/HapticButton/SectionLabel                                                            |
| edit.tsx + change-password.tsx               | ✅     | BottomActionBar, password toggle/strength, HapticButton                                                                          |
| ActivityItem settlement routing              | ✅     | Navigates to group or friend page                                                                                                |
| Activity API settlement query fix            | ✅     | Joined user relations on settlements                                                                                             |
| DatePicker dark mode colors                  | ✅     | selected_label/today_label colors, today bg → UI.color.control                                                                   |
| UserSearchBottomSheet dark mode              | ✅     | Inline UI.color.* reads, handle/spinner colors fixed                                                                             |
| GroupDetailScreen haptics                    | ✅     | All 6 Pressables have Haptics.* calls                                                                                            |
| ExpenseDetailScreen haptics + colors         | ✅     | Haptics on all pressables; #FFFFFF → UI.color.textInverse (6 places)                                                             |
| FriendDetailScreen haptics + shared Skeleton | ✅     | Custom SkeletonBlock → shared Skeleton; module consts → inline; 9 haptics                                                        |
| SettlementScreen loading + colors            | ✅     | Skeleton loading; 7 #FFF → UI.color.textInverse; 3 haptics                                                                       |
| GroupSettingsScreen ConfirmationSheet        | ✅     | Custom ConfirmationSheet → shared; skeleton loading; TEXT_DANGER fix                                                             |
| FriendsScreen module constants + IconButton  | ✅     | TEXT_DANGER/TEXT_SUCCESS → inline; custom IconButton → shared                                                                    |
| AnalyticsScreen shared components            | ✅     | Custom SectionLabel/AnalyticsCard → shared; #000/#FFF fixed                                                                      |
| NotificationsScreen pull-to-refresh          | ✅     | Added RefreshControl                                                                                                             |
| Shared SectionLabel style prop               | ✅     | Added optional style prop for margin customization                                                                               |
| Shared ConfirmationSheet type fix            | ✅     | sheetRef: RefObject<BottomSheetModal \| null>                                                                                    |
| NewExpenseScreen shared components           | ✅     | SurfaceCard→Card, HeaderButton→IconButton, ERROR const→inline, SearchField→shared, Section→SectionLabel; haptics on submit/close |
| DashboardScreen polish                       | ✅     | Already uses Card/Skeleton/ListRowSkeleton/MoneySignal/HapticButton — no further extraction needed                               |
| Auth screens AuthFormLayout                  | ✅     | Created shared AuthFormLayout; login/register extracted; forgot-password partially shares patterns                               |
| Shared SectionLabel style prop               | ✅     | Added optional style prop to native-ui.tsx SectionLabel                                                                          |
| Shared ConfirmationSheet type fix            | ✅     | sheetRef: RefObject<BottomSheetModal                                                                                             | null> |
| Auth screen line count reduction             | ✅     | -53 total lines; 3 files → 4 files with shared layout component                                                                  |
