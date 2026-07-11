# Library Reference

## Core Framework

| Package      | Version | Purpose        |
| ------------ | ------- | -------------- |
| expo         | ~56.0.5 | Framework      |
| react        | 19.2.3  | UI library     |
| react-native | 0.85.3  | Mobile runtime |
| typescript   | ~6.0.3  | Type checking  |

## Routing & Navigation

| Package                        | Version | Purpose                  |
| ------------------------------ | ------- | ------------------------ |
| expo-router                    | ~56.2.7 | File-based routing       |
| @gorhom/bottom-sheet           | ^5.2.14 | Bottom sheet modals      |
| react-native-screens           | ~4.25.2 | Native screen containers |
| react-native-safe-area-context | ~5.7.0  | Safe area insets         |
| react-native-gesture-handler   | ~2.31.2 | Gesture handling         |

## UI Components

| Package                    | Version | Purpose                               |
| -------------------------- | ------- | ------------------------------------- |
| heroui-native              | ^1.0.2  | Core UI primitives (Typography, etc.) |
| lucide-react-native        | ^1.22.0 | Icon library                          |
| @shopify/flash-list        | 2.0.2   | Performant lists                      |
| react-native-gifted-charts | ^1.4.77 | Charts & analytics                    |
| react-native-ui-datepicker | ^3.3.0  | Date picker                           |
| lottie-react-native        | ~7.3.4  | Lottie animations                     |
| expo-linear-gradient       | ^56.0.4 | Gradient backgrounds                  |
| expo-blur                  | ^57.0.0 | Blur views (tab bar)                  |

## Styling

| Package           | Version | Purpose                   |
| ----------------- | ------- | ------------------------- |
| tailwindcss       | ^4.1.17 | CSS framework             |
| uniwind           | ^1.5.0  | Tailwind for React Native |
| tailwind-merge    | ^3.4.0  | Class merging             |
| tailwind-variants | ^3.2.2  | Component variants        |

## State Management

| Package                                   | Version  | Purpose                                     |
| ----------------------------------------- | -------- | ------------------------------------------- |
| @tanstack/react-query                     | ^5.101.2 | Server state (fetching, caching, mutations) |
| zustand                                   | ^5.0.14  | Client state (persisted via AsyncStorage)   |
| @react-native-async-storage/async-storage | 2.2.0    | Persistent storage                          |

## Forms & Validation

| Package             | Version | Purpose              |
| ------------------- | ------- | -------------------- |
| react-hook-form     | ^7.80.0 | Form management      |
| @hookform/resolvers | ^5.4.0  | Zod resolver for RHF |
| zod                 | ^4.4.3  | Schema validation    |

## Animations

| Package                 | Version | Purpose                     |
| ----------------------- | ------- | --------------------------- |
| react-native-reanimated | ~4.3.1  | High-performance animations |
| react-native-worklets   | 0.8.3   | Reanimated worklets         |
| expo-haptics            | ~56.0.3 | Haptic feedback             |

## Backend

| Package                   | Version  | Purpose             |
| ------------------------- | -------- | ------------------- |
| @supabase/supabase-js     | ^2.108.2 | Supabase client     |
| react-native-url-polyfill | ^3.0.0   | URL polyfill for RN |

## Fonts

| Package   | Version | Purpose      |
| --------- | ------- | ------------ |
| expo-font | ^56.0.7 | Font loading |

Font files used (in `assets/fonts/`):

- Sora-SemiBold.ttf (`Sora_600SemiBold`)
- IBMPlexSans-Regular.ttf (`IBMPlexSans_400Regular`)
- IBMPlexSans-Medium.ttf (`IBMPlexSans_500Medium`)
- IBMPlexSans-SemiBold.ttf (`IBMPlexSans_600SemiBold`)

## Development Tooling

| Package                       | Version  | Purpose              |
| ----------------------------- | -------- | -------------------- |
| expo-dev-client               | ~56.0.20 | Development builds   |
| eslint                        | ^9.39.4  | Linting              |
| eslint-config-expo            | ^56.0.4  | Expo ESLint config   |
| prettier                      | ^3.8.3   | Code formatting      |
| jest                          | ^29.7.0  | Test runner          |
| jest-expo                     | ~56.0.0  | Expo Jest preset     |
| @testing-library/react-native | ^14.0.1  | React Native testing |
| eas-cli                       | ^20.5.0  | EAS Build CLI        |
