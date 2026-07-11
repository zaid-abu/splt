# Build Guide

## Prerequisites

- Node.js 20+
- npm
- Expo CLI (`npx expo`)
- Xcode (iOS)
- Android Studio (Android)
- EAS CLI (`npx eas-cli`) for builds

## Environment Setup

1. Copy `.env` with required variables:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

2. Environment variables are Zod-validated at runtime in `src/config/env.ts`.

## Commands

### Install Dependencies

```bash
npm install
```

### Development

```bash
# Start Expo dev server
npx expo start

# Run on specific platforms
npx expo run:ios
npx expo run:android
```

### Code Quality

```bash
# TypeScript typecheck
npm run typecheck

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check
```

### Testing

```bash
npm run test
```

Jest config (`jest.config.js`):
- Preset: `jest-expo`
- Path alias: `@/` → `./src/`
- Setup: `@testing-library/react-native/extend-expect`
- Transforms: excludes node_modules except react-native, expo, heroui-native, uniwind

### Production Builds

```bash
# iOS
npx eas build --platform ios --profile production

# Android
npx eas build --platform android --profile production
```

EAS config (`eas.json`):
- `development` — dev client, internal distribution
- `preview` — internal distribution
- `production` — auto-increment version

## CI/CD

### CI (`.github/workflows/ci.yml`)
Trigger: push/PR to `main`
Steps: checkout → setup Node 20 → install → generate types → typecheck → lint → format check

### CD (`.github/workflows/cd.yml`)
Trigger: manual (`workflow_dispatch`) or tag `v*`
Steps: checkout → setup Node 20 → install → prebuild Android → setup Java 17 → decode keystore → build APK → upload artifact → create GitHub Release
Secrets required: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`

## App Configuration

See `app.json`:
- App name: `splt`
- Scheme: `splt`
- Bundle ID: `com.splt.app`
- Orientation: portrait
- Splash background: `#3d2b82`
- EAS project ID: `1fe4f382-a97e-4915-b28c-0b5d0623aba3`
