# Splt 💸

Splt is a modern money splitting application built with Expo and React Native. It makes it easy to split expenses with friends and track who owes what.

## Tech Stack

This project is built with:

- [Expo](https://expo.dev) & React Native
- [HeroUI Native](https://heroui.com/docs/native) for beautiful UI components
- [Uniwind](https://docs.uniwind.dev) (Tailwind CSS for React Native) for styling
- [Expo Router](https://docs.expo.dev/router/introduction) for file-based routing

## Get started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app:

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a:

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Core Features

- **Authentication & Security:** Secure login flows and user profiles.
- **Expense Tracking:** Seamlessly add and split expenses with friends or groups.
- **Tabbed Dashboard:** Intuitive tab UI to track activity, balances, and history at a glance.
- **Design System:** Consistent, premium visual aesthetics driven by tailored design tokens and custom branding assets (app icons, splash screens).
- **Cross-Platform:** High-performance React Native architecture ensuring a snappy experience on both iOS and Android.
- **CI/CD Integrated:** Automated deployment pipelines via GitHub Actions for reliable app delivery.

## Project Structure

The project is structured to enforce separation of concerns and maintainability:

```text
src/
├── app/          # Expo Router file-based routing (pages & layouts)
├── assets/       # Branding assets (images, icons, splash screens)
├── components/   # Reusable UI components (buttons, inputs, cards)
├── context/      # React Context providers for state management
├── lib/          # External library configurations and wrappers
├── types/        # TypeScript type definitions
├── utils/        # Helper functions and utilities
└── global.css    # Global Uniwind (Tailwind) styles and theme variables
```

## How It Works

1. **Onboarding & Auth:** Users start at a beautifully animated welcome screen, leading into a secure login/signup flow.
2. **Dashboard:** Upon authenticating, users are greeted by their dashboard which shows their current balance (who owes them vs. who they owe).
3. **Adding Expenses:** The intuitive "Add Expense" flow allows users to enter an amount, select participants, and divide the cost (equally or by specific amounts).
4. **Activity Feed:** A timeline of recent transactions and settled debts keeps everyone on the same page.

## Styling & Theming

Splt uses a modern styling stack:

- **HeroUI Native:** Provides accessible, unstyled core components that we've themed to match our brand.
- **Uniwind (Tailwind CSS):** Enables rapid, utility-first styling directly within React Native components.
- **Design Tokens:** Colors, typography, and spacing are standardized via a centralized design token system, ensuring a premium, consistent look and feel across the entire application.
