Status: complete

Changes:
- Updated `src/features/circles/screens/CirclesScreen.tsx` to match the circle-dock prototype more closely.
- Added the `Your network` kicker and changed the main title to `Circles`.
- Shifted group and people subtitles toward the prototype copy, including active-date wording and group-count phrasing.
- Extended circle snapshot person data in `src/features/circles/hooks/useCirclesSnapshot.ts` so people rows can describe shared-group context.
- Updated `src/features/circles/screens/CirclesScreen.test.tsx` to match the new labels and row copy.

Verification:
- `npx tsc --noEmit 2>&1 | grep -v "supabase/functions"`
- `npx jest src/features/circles/screens/CirclesScreen.test.tsx --runInBand`

Notes:
- The Circles implementation keeps the existing route and mutation behavior intact.
