# SPLT Production Refactoring Roadmap & Architecture Guidelines

This document serves as the master blueprint for transforming the SPLT Expo application into a clean, scalable, maintainable, and production-grade codebase matching the engineering quality of companies like Linear, Airbnb, Notion, or Stripe.

## 🎯 Main Goal & Priorities

Transform this project into something that could confidently ship to production.

Priorities:

1. Maintain existing functionality.
2. Never introduce regressions.
3. Improve maintainability.
4. Improve scalability.
5. Improve readability.
6. Improve performance.
7. Improve user experience.
8. Improve accessibility.
9. Improve developer experience.
10. Reduce technical debt.

---

## 🛠️ Project Stack

### Core

- Expo SDK 56
- React Native 0.85
- React 19
- TypeScript
- Expo Router

### Backend

- Supabase Authentication
- Supabase Database
- Supabase Storage

### UI

- HeroUI Native
- Uniwind
- Tailwind Variants
- Tailwind Merge

### Animations

- React Native Reanimated
- Lottie
- Expo Blur
- Expo Haptics

### Components

- Gorhom Bottom Sheet
- Gifted Charts
- Lucide Icons
- React Native SVG
- React Native Date Picker

### Utilities

- dayjs
- date-fns (Removed in Phase 2)
- AsyncStorage

### Technologies To Introduce (When Required)

- Zustand
- @tanstack/react-query
- React Hook Form
- Zod
  _(Do not introduce Redux, MobX, or unnecessary libraries)._

---

## 📜 Non-Negotiable Rules

- **Incremental Refactoring:** Never rewrite multiple features simultaneously. Every phase must leave the application fully functional.
- **No Regressions:** Never remove existing functionality.
- **Completeness:** Never use placeholders. Never skip code. Never respond with partial implementations. Never use "same as previous." Always provide complete code for modified files.
- **Business Logic:** Do not change business logic unless explicitly asked.
- **Future Improvements:** If a change belongs to a future phase, document it under "Future Improvements" instead of implementing it now.

---

## 🧹 Code Quality Standards

- **Single Responsibility:** Every file should have a single responsibility.
- **File Size Limits:**
  - Preferred maximum file size: 250–300 lines
  - Absolute maximum: 500 lines
- **Extraction:** If a file exceeds this limit, extract:
  - Components
  - Custom hooks
  - Utilities
  - Constants
  - Services
  - Validation
  - API logic
  - Animations
  - Types
- **Avoid giant screen components.**

---

## 📁 Folder Structure Targets

### Global Folder Structure Target

```text
app/
assets/
components/
  ui/
  cards/
  buttons/
  forms/
  charts/
  layout/
  feedback/
  animations/
  bottom-sheet/
  dialogs/
features/
  auth/
  dashboard/
  groups/
  expenses/
  settlements/
  profile/
  onboarding/
hooks/
providers/
store/
services/
  api/
  supabase/
  storage/
  analytics/
queries/
mutations/
types/
constants/
utils/
theme/
config/
```

### Feature Structure

Every feature should eventually contain:

```text
feature/
  components/
  hooks/
  queries/
  mutations/
  services/
  types/
  utils/
  constants/
  validation/
```

---

## 🏗️ Architecture & Standards

### State Management Rules

Always choose the correct layer:

- **React State:** Temporary component state
- **Context:** Very small shared state
- **Zustand:** UI state, Preferences, Theme, Selected group, Filters, Bottom sheets, Dialog visibility
- **React Query:** Expenses, Groups, Members, Balances, Categories, Budgets, User profile, All Supabase data
- _Rules:_ Never fetch Supabase directly inside screen components. Never duplicate server state.

### API Layer

Every API call should be abstracted. Screens should never know about Supabase.
**Architecture Flow:**
`Screen` ↓ `Feature Hook` ↓ `React Query` ↓ `Service Layer` ↓ `Supabase`

Every request should include:

- Error handling
- Response transformation
- Type safety
- Caching
- Retry strategy

### UI Standards

Extract reusable components for:
Buttons, Cards, Inputs, Text Areas, Headers, Screen Containers, Sections, Stat Cards, Expense Cards, Group Cards, Charts, Lists, List Items, Dialogs, Bottom Sheets, Tabs, Search Bars, Skeletons, Loading States, Empty States, Error States, Toast Components, Floating Action Buttons.
_Avoid duplicated layouts._

### Styling Rules

Never hardcode: Colors, Spacing, Border radius, Typography, Shadows, Opacity.

- Use theme tokens.
- Support dark mode everywhere.
- Create reusable spacing and typography utilities.

### Performance Standards

Analyze and improve:

- Large FlatLists (FlashList opportunities)
- Inline functions, objects, styles
- Expensive calculations & missing memoization
- Navigation re-renders & large component trees
- Unnecessary Context updates & animation performance
  _Only optimize when measurable. Do not prematurely optimize._

### Animation Standards

Use: Layout Animations, Entering animations, Exiting animations, Shared transitions, Gesture animations, Micro interactions, Haptic feedback, Loading skeletons.
_Animations should feel subtle and polished. Never animate everything._

### Forms

Use: React Hook Form, Zod, Reusable validation schemas, Reusable input components, Shared form layouts, Typed form values.

### Error Handling

Standardize: API failures, Authentication failures, Offline mode, Timeouts, Unknown errors, Retry flows, Validation errors, Toast notifications, Logging.

### Accessibility

Improve: Accessibility labels, Keyboard navigation, Safe area handling, Touch target size, Dynamic font scaling, Reduced motion support, Screen readers.

### Security

Ensure: Environment variables are secure, No secrets in the repository, Proper session handling, Secure token storage, Input validation, Authorization checks.

---

## ✅ Production Checklist

Eventually include:

- Analytics
- Crash Reporting
- Environment Config
- CI/CD readiness
- ESLint cleanup
- Prettier cleanup
- Dead code removal
- Bundle optimization
- Production logging
- Performance audit

---

## 📝 Required Response Format

Every response must contain the following sections:

### Phase Summary

Explain what this phase accomplishes.

### Architecture Analysis

Identify: Current problems, Root causes, Risks, Technical debt.

### Refactor Plan

Explain every planned change.

### Files Modified

List every affected file.

### Complete Updated Code

Provide the complete implementation for every modified file. Never truncate code.

### Why These Changes

Explain why each change improves the project.

### Verification Checklist

Explain how to verify nothing broke. Include manual testing steps.

### Potential Risks

Mention any side effects.

### Git Commit

Generate a professional Conventional Commit message (e.g., `refactor(expenses): extract reusable expense card component`).

### Future Improvements

Mention only improvements related to future phases. Do not implement them.

### Next Recommended Phase

Recommend only one next phase. Wait for approval before continuing.

---

## 🚀 Refactor Phases (Detailed Implementation Guide)

### ✅ Phase 1: Project Architecture Audit (Completed)

- Generate ADR 001 defining architectural boundaries.

### ✅ Phase 2: Dependency Audit (Completed)

- Install architectural foundations (`zustand`, `@tanstack/react-query`, `react-hook-form`, `zod`).
- Consolidate date handling by removing `date-fns` in favor of `dayjs`.

### ✅ Phase 3: Folder Structure (Completed)

- Scaffold the production-ready directory hierarchy (`src/features`, `src/services`, `src/components/ui`, etc.) with `.gitkeep` files.

### ✅ Phase 4: Design System (Completed)

- **Objective:** Establish reusable styling tokens (colors, typography, spacing).
- **Implementation:**
  - Review `design-tokens.json` and map them to Tailwind variants / Uniwind configuration.
  - Create standard typography utility constants.
  - Ensure `global.css` reflects the strict tokens.

### ✅ Phase 5: Theme Refactor (COMPLETED)

- **Goal:** Unify color system by replacing hardcoded hex values with Tailwind semantic classes.
- **Tasks:**
  - `[x]` Migrate `src/app/(auth)/welcome.tsx`, `login.tsx`, `register.tsx` hex colors (e.g., `#3D2B82` -> `bg-primary`, `#E5E5EA` -> `border-border/50`).
  - `[x]` Migrate components (`MemberAvatar.tsx`, `BalanceCard.tsx`, `CurrencySelector.tsx`, `SwipeableRow.tsx`).
  - `[x]` Update all `<SafeAreaView>` and `<FocusAwareView>` background styles to use `className="bg-background"` instead of inline hex `backgroundColor: "#F2F2F6"`.
  - `[x]` Fix TS strict mode warnings for `useThemeColor` by casting valid hex variable outputs where necessary.

### ✅ Phase 6: Providers (COMPLETED)

- **Objective:** Clean up `_layout.tsx` by extracting complex provider trees.
- **Implementation:**
  - `[x]` Create `src/providers/AppProvider.tsx`.
  - `[x]` Wrap `HeroUINativeProvider`, `BottomSheetModalProvider`, `SafeAreaProvider`, and `AppContextProvider` neatly to keep `_layout.tsx` purely for routing.

### ✅ Phase 7: Global State Management

- [x] Migrate `AppContext` to Zustand stores (`useDataStore`, `useUIStore`).
- [x] Refactor `AppContext` to serve as a pure `AuthProvider`.
- [x] Integrate Zustand stores across all screens, utilizing atomic selectors to prevent unnecessary re-renders.

### ✅ Phase 8: React Query Integration

- [x] Create `src/lib/queryClient.ts` with standard caching and retry strategies.
- [x] Create `src/queries/keys.ts` for consistent query key management (e.g., `['expenses', groupId]`).
- [x] Integrate `QueryClientProvider` into `src/providers/AppProvider.tsx`.

### ✅ Phase 9: Supabase Service Layer

- **Objective:** Abstract all direct Supabase calls from screens into dedicated service classes.
- **Implementation:**
  - `[x]` Create `src/services/supabase/client.ts` with typed Supabase client configuration.
  - `[x]` Add `src/services/supabase/database.types.ts` for local table type safety.
  - `[x]` Keep `src/lib/supabase.ts` as a compatibility re-export while the app transitions.
  - `[x]` Create API modules for groups, expenses, settlements, and activities.
  - `[x]` Add service-layer mappers to translate Supabase snake_case rows into app camelCase types.
  - `[x]` Migrate raw `.from('table').select()` logic out of UI components and into `src/services/api/`.
  - `[x]` Generate Supabase migration scripts for initial schema, indexes, triggers, profile bootstrapping, and RLS policies.

### ✅ Phase 10: Authentication Cleanup (COMPLETED)

- **Objective:** Refactor the auth flow to use the new service layer and React Query mutations.
- **Implementation:**
  - `[x]` Standardize login/signup logic in `src/features/auth/`.
  - `[x]` Securely manage sessions via React Query rather than local state.

### ✅ Phase 11: Navigation Refactor (COMPLETED)

- **Objective:** Clean up Expo Router configurations and standardize route types.
- **Implementation:**
  - `[x]` Define typed route parameters.
  - `[x]` Standardize screen transitions in `_layout.tsx`.

### ✅ Phase 12: Reusable UI Components (COMPLETED)

- **Objective:** Extract primitive UI elements into `src/components/ui/`.
- **Implementation:**
  - `[x]` Move standalone items like `AmountDisplay`, `MemberAvatar`, `CurrencySelector` into the unified `components/` hierarchy.
  - `[x]` Ensure all adhere strictly to the Design System.

### ✅ Phase 13: Reusable Form Components (COMPLETED)

- **Objective:** Integrate React Hook Form and Zod to create robust, typed form inputs.
- **Implementation:**
  - `[x]` Create generic `<FormInput />`, `<FormSelect />` wrappers that combine React Hook Form `Controller` with HeroUI `TextField` and `Label`.
  - `[x]` Set up `src/validation/` for shared Zod schemas.

### ✅ Phase 14: Feature Modularization (COMPLETED)

- **Objective:** Move domain-specific logic into `src/features/`.
- **Implementation:**
  - `[x]` Slice the app into `features/expenses`, `features/groups`, etc.
  - `[x]` Move screens, hooks, queries, and components into these feature folders.

### ✅ Phase 15: Business Logic Extraction (COMPLETED)

- **Objective:** Ensure screens are purely presentational.
- **Implementation:**
  - `[x]` Extract complex calculations (e.g., custom split logic, balance settlement math) into pure utility functions inside `src/utils/math.ts` or feature-specific `utils/`.

### ✅ Phase 16: Performance Optimization

- **Objective:** Optimize rendering and memory usage.
- **Implementation:**
  - `[x]` Convert `ScrollView` or basic `FlatList` implementations to `@shopify/flash-list` where appropriate (e.g., long activity feeds).
  - `[x]` Add `useMemo` and `useCallback` to prevent re-rendering in heavy screens.

### ⏳ Phase 17: Animation Polish

- **Objective:** Standardize Reanimated transitions.
- **Implementation:**
  - Apply `FadeIn`, `FadeOut`, or Layout animations uniformly to lists and modals.
  - Ensure `expo-haptics` are used correctly on button presses and success states.

### ✅ Phase 18: Accessibility (COMPLETED)

- **Objective:** Improve screen reader support and keyboard navigation.
- **Implementation:**
  - `[x]` Audit custom components (like tabs and custom pills) to ensure `accessibilityRole` and `accessibilityLabel` are present.

### ✅ Phase 19: Error Handling

- **Objective:** Standardize API failure handling and offline modes.
- **Implementation:**
  - `[x]` Implement a global error boundary.
  - `[x]` Create a unified `Toast` notification system for mutation failures.

### ✅ Phase 20: Testing Preparation (COMPLETED)

- **Objective:** Ensure the codebase is modular enough for unit testing.
- **Implementation:**
  - `[x]` Verify that the service layer can be easily mocked.
  - `[x]` Separate all side-effects from pure components.

### ⏳ Phase 21: Security Review

- **Objective:** Audit environment variables and input validation.
- **Implementation:**
  - Ensure `EXPO_PUBLIC_` keys are properly loaded.
  - Double-check Zod schemas against injection or bad data.

### ⏳ Phase 22: Production Readiness Audit

- **Objective:** Final cleanup before shipping.
- **Implementation:**
  - Run ESLint and Prettier sweeps.
  - Remove all `console.log` statements.
  - Perform a final bundle size check and analytics integration check.
