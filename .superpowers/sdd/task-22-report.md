# Task 22 Report: Home, Notifications, and Integration Hardening

## Status

Complete.

## Files Modified

- `src/features/dashboard/hooks/useHomeSnapshot.ts`
- `src/features/dashboard/screens-v2/MoneyMapScreen.tsx`
- `src/features/dashboard/screens-v2/MoneyMapScreen.test.tsx`
- `src/features/notifications/screens-v2/NotificationsScreen.tsx`
- `src/features/notifications/screens-v2/NotificationsScreen.test.tsx`
- `src/features/recurring/services/readAdapter.ts`
- `src/features/recurring/services/readAdapter.test.ts`

## What Changed

- Home now shows a cached-offline banner, first-use CTAs with the task labels, a hero breakdown for multiple balances, settlement routing by group/person context, and recent movement only as a fallback when no schedule is available.
- Home schedule selection now prefers pending review items before active items.
- Notifications now format balance reminders with context, currency, and message text, and their action buttons respect Android touch targets.

## Verification

- `npx tsc --noEmit 2>&1 | grep -v "supabase/functions"`
- `npm test -- --runInBand src/features/dashboard/screens-v2/MoneyMapScreen.test.tsx src/features/notifications/screens-v2/NotificationsScreen.test.tsx`
- `npx jest src/features/recurring/services/readAdapter.test.ts --runInBand`
- `npx jest src/features/dashboard/hooks/useHomeSnapshot.test.tsx --runInBand`
