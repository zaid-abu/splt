# ADR 001: Production Architecture Strategy

## Status

Accepted

## Context

The SPLT application is currently a functional Expo application but lacks the architectural rigor required for a large-scale production deployment. The current state features UI components and business logic tightly coupled in screens, missing abstraction layers for API calls (Supabase), and inadequate state management segregation.

To scale the application to the level of industry leaders (Linear, Airbnb), we need a robust, maintainable, and scalable architecture.

## Decision

We will systematically refactor the application across 22 phases, adopting the following architectural patterns:

1. **Feature-Sliced Design (Modified)**: Features will be modularized into a `src/features/` directory containing their own components, hooks, queries, mutations, services, and types.
2. **State Management Stratification**:
   - React State: Component-local temporary state.
   - React Context: Small, deeply shared configurations (e.g., Theme/App context).
   - Zustand: Global UI state (preferences, selected groups, bottom sheet visibility).
   - React Query (@tanstack/react-query): Server state and data fetching/caching.
3. **Service Layer Abstraction**: All Supabase interactions will be hidden behind a Service Layer, preventing UI screens from knowing about the underlying database.
4. **Form Management**: React Hook Form and Zod will be used for typed, validated, and performant form handling.
5. **UI Layer**: We will leverage HeroUI Native, Uniwind, and Tailwind Variants to build a strict, reusable design system.

## Consequences

- **Positive**: High maintainability, easier testing, clear separation of concerns, and robust error handling.
- **Negative**: Increased initial overhead for developers to learn the strict boundaries and patterns.
