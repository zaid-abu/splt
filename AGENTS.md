# Splt — Agent Context File

## Project Overview

Splt is a cross-platform mobile expense-splitting app (similar to Splitwise) built with Expo SDK 56 and React Native 0.85. It helps users record shared costs, split them among friends/groups, track balances, and settle up.

- **Platforms:** iOS & Android
- **Routing:** Expo Router (file-based)
- **Backend:** Supabase (Auth, PostgreSQL, RLS)
- **Bundle ID:** `com.splt.app`
- **Scheme:** `splt`

## Tech Stack

| Category       | Technology                               |
| -------------- | ---------------------------------------- |
| Framework      | Expo 56, React Native 0.85, React 19     |
| Routing        | Expo Router (file-based, `src/app/`)     |
| UI Library     | HeroUI Native 1.x                        |
| Styling        | Uniwind + Tailwind CSS v4 + `global.css` |
| State (Server) | TanStack React Query v5                  |
| State (Client) | Zustand v5 (persisted via AsyncStorage)  |
| Forms          | React Hook Form v7 + Zod v4              |
| Navigation     | Expo Router + Gorhom Bottom Sheet v5     |
| Icons          | Lucide React Native                      |
| Charts         | react-native-gifted-charts               |
| Date Picker    | react-native-ui-datepicker               |
| Animations     | react-native-reanimated v4, Lottie       |
| Haptics        | expo-haptics                             |
| Lists          | @shopify/flash-list                      |
| Testing        | Jest + @testing-library/react-native     |
| Linting        | ESLint (expo-config)                     |
| Formatting     | Prettier                                 |
| CI/CD          | GitHub Actions + EAS Build               |
| Auth           | Supabase Auth (email/password)           |

## Project Structure

```
splt/
├── AGENTS.md                    # This file
├── DESIGN.md                    # Full design system documentation
├── PRODUCT.md                   # Product purpose & brand personality
├── ui-registry.md               # UI component registry
├── design-tokens.json           # Centralized design tokens
├── app.json                     # Expo config
├── eas.json                     # EAS Build config
├── docs/
│   ├── adr/                     # Architecture Decision Records
│   ├── build.md                 # Build & run commands
│   ├── progress-tracker.md      # Development progress
│   ├── libraries.md             # Library documentation
│   └── design-system.md         # Design system reference
├── src/
│   ├── app/                     # Expo Router screens (file-based)
│   │   ├── (auth)/              # Auth group (welcome, login, register, forgot-password)
│   │   ├── (tabs)/              # Tab group (index/dashboard, groups, friends, activity)
│   │   ├── group/               # Group screens (new, [id]/index, [id]/settings, [id]/settle)
│   │   ├── expense/             # Expense screens (new, [id])
│   │   ├── friend/              # Friend screens (new, [id])
│   │   ├── settle/              # Settle screens ([id])
│   │   ├── profile/             # Profile screens (index, edit, change-password)
│   │   ├── onboarding.tsx       # Onboarding screen
│   │   ├── notifications.tsx    # Notifications screen
│   │   ├── _layout.tsx          # Root layout (Stack navigator)
│   │   └── index.tsx            # Entry redirect
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   ├── forms/               # Form components
│   │   ├── layout/              # Layout components
│   │   ├── feedback/            # Feedback components (toast, error)
│   │   ├── dialogs/             # Dialog components
│   │   ├── bottom-sheet/        # Bottom sheet components
│   │   └── animations/          # Animation components
│   ├── features/                # Feature-sliced modules
│   │   ├── activity/            # Activity feed (screens, components, queries, services)
│   │   ├── analytics/           # Analytics/stats (screens, components, hooks)
│   │   ├── auth/                # Auth (hooks)
│   │   ├── dashboard/           # Dashboard (screens, components)
│   │   ├── expenses/            # Expenses (screens, components, hooks, queries, services, utils)
│   │   ├── friends/             # Friends (screens, queries, services)
│   │   ├── groups/              # Groups (screens, components, hooks, queries, services, utils)
│   │   ├── notifications/       # Notifications (screens, queries)
│   │   ├── onboarding/          # Onboarding (screens, components, constants)
│   │   ├── profile/             # Profile (screens, components, hooks)
│   │   ├── reference/           # (empty)
│   │   ├── settlements/         # Settlements (screens, queries, services, utils)
│   │   └── users/               # Users (queries)
│   ├── config/env.ts            # Environment variables (Zod-validated)
│   ├── constants/               # App constants (icons, design tokens)
│   ├── context/                 # React Context (AuthProvider)
│   ├── hooks/                   # Shared hooks (theme, toast, refresh, debounced search)
│   ├── lib/                     # Library configs (queryClient, supabase re-export)
│   ├── providers/               # App provider tree
│   ├── queries/                 # Query key factory
│   ├── services/                # Service layers
│   │   ├── api/                 # Auth API, user API, mappers
│   │   ├── supabase/            # Supabase client & database types
│   │   ├── analytics/           # (empty)
│   │   └── storage/             # (empty)
│   ├── store/                   # Zustand stores (useUIStore)
│   ├── types/                   # TypeScript types & interfaces
│   ├── utils/                   # Utility functions (balance, date, password strength, theme)
│   └── validation/              # Zod schemas (login, register, forgot password)
└── supabase/
    └── migrations/              # SQL migration files (14 migrations)
```

## Architecture Patterns

### State Management (4-Tier)

1. **React State** — Component-local temporary state
2. **React Context** — Deeply shared configs (AuthContext)
3. **Zustand** — Global UI state (currency, dark mode, exchange rates)
4. **React Query** — Server state (data fetching, caching, mutations)

### Feature-Sliced Design

Each feature in `src/features/` contains its own:

- `screens/` — Screen components (consumed by Expo Router)
- `components/` — Feature-specific components
- `hooks/` — Custom hooks
- `queries/` — React Query hooks
- `services/` — API service modules
- `utils/` — Utility functions

### Service Layer

All Supabase interactions are hidden behind service objects:

- `AuthService` (signUp, signIn, signOut, getSession, changePassword, resetPassword, updateProfile, deleteAccount, getCurrentUser)
- `expensesApi` (fetchGroupExpenses, fetchUserExpenses, fetchExpense, addExpense, updateExpense, deleteExpense)
- `groupsApi` (fetchGroups, fetchGroup, createGroup, updateGroup, deleteGroup, addMembers, removeMember)
- `FriendsService` (getFriends, getAllFriendships, addFriend, getPendingFriendRequests, acceptFriendship, rejectFriendship, removeFriendship)
- `settlementsApi` (fetchGroupSettlements, fetchUserSettlements, addSettlement, deleteSettlement)
- `activitiesApi` (fetchActivities, logActivity, deleteActivity)

### Routing Structure

- Root Stack: `(auth)` → `onboarding` → `(tabs)` + modal routes
- Tab Bar: Dashboard | Groups | Friends | Activity (no text labels, only icons + active dot)
- Auth guard: Routes redirect to `(auth)/welcome` if unauthenticated
- Onboarding guard: New users are sent to `/onboarding` after signup

## Database Schema (Supabase)

Tables: `users`, `groups`, `group_members`, `expenses`, `expense_splits`, `settlements`, `activities`, `friendships`, `comments`

Key relationships:

- `groups` → `group_members` (many-to-many via join table with balance)
- `expenses` → `expense_splits` (one-to-many), expenses belong to groups
- `settlements` → users (from_user_id, to_user_id)
- `activities` → polymorphic (expense, settlement, member_joined, group_created)
- `friendships` → users (bidirectional, with pending/accepted/rejected status)

## Key Conventions

### Code Style

- TypeScript strict mode enabled
- Path alias `@/` maps to `./src/`, `@/assets/` maps to `./assets/`
- No semicolons in JS/TS (Prettier config: `semi: true`, singleQuote: false)
- 100 char print width, 2 space indent
- Arrow parens always, LF line endings

### Naming

- Screens: `*Screen.tsx` (e.g., `DashboardScreen.tsx`)
- Components: PascalCase (e.g., `MemberAvatar.tsx`)
- Hooks: `use*` prefix (e.g., `useFriends.ts`)
- Services: `*Service` or `*Api` objects (e.g., `AuthService`, `groupsApi`)
- Queries: `use*` prefix with React Query (e.g., `useGroups`, `useExpenses`)
- Files: camelCase or PascalCase matching export name
- Zustand store: `useUIStore` pattern

### UI Conventions

- App background: `#F7F6F1` (warm cream)
- Card surface: `#FEFDFA` (ivory)
- Control interior: `#FFFFFF` (white)
- Border: `1px #E7E5DE` (warm)
- Border radius: cards `16px`, inner panels `12px`, pills `9999px`
- Primary text: `#1A1A1A`, headings `Sora_600SemiBold`, body `IBMPlexSans_400Regular`
- Semantic: Debt `#E85D5D`, Credit `#4CAF82`, Warning `#F5A623`
- No shadows on cards (flat-by-default). Chrome lift on tab bar, toast lift for feedback.

### Form Validation

- Zod schemas in `src/validation/schemas.ts`
- Forms use React Hook Form + Zod resolver
- Login: email + password
- Register: name + email + password + confirmPassword
- Forgot password: email

## Commands

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android

# Typecheck
npm run typecheck

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# Test
npm run test

# Build (EAS)
npx eas build --platform ios --profile production
npx eas build --platform android --profile production
```

## Environment Variables

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

## CI/CD

- **CI:** Runs on push/PR to `main` — install, typecheck, lint, format check
- **CD:** Manual trigger or tag `v*` — builds signed Android APK, uploads artifact, creates GitHub Release
