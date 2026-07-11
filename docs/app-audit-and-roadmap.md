# Splt App Audit, Fix Plan, and Splitwise-Inspired Roadmap

> Audit date: 11 July 2026  
> Scope: static review of the React Native app, Supabase migrations, service/query layers, design system, and project checks. No production database or device build was mutated. Runtime verification on iOS, Android, tablets, and a staged Supabase project is still required.

## Outcome

Splt has a strong product foundation and a coherent visual direction, but it is **not release-ready**. The highest-risk issues are authorization, ledger atomicity, account recovery/deletion, and missing automated tests. UI polish should follow those fixes rather than lead them.

### Release gates

- [ ] Close every P0 issue.
- [ ] Close the security, ledger-integrity, auth, accessibility, and CI P1 issues.
- [ ] Make `npm run typecheck`, `npm run lint`, `npm run format:check`, and `npm run test -- --runInBand` pass in CI.
- [ ] Test the critical journeys against a clean staged Supabase project with at least three users.
- [ ] Complete VoiceOver, TalkBack, large-text, reduced-motion, light/dark, narrow-phone, and tablet passes.
- [ ] Add monitoring, crash reporting, and a rollback plan before production rollout.

## Current health

| Dimension           |     Score | Main finding                                                                                                                                 |
| ------------------- | --------: | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessibility       |       2/4 | Useful labels exist, but contrast, text scaling, reduced motion, and touch-target coverage are incomplete.                                   |
| Performance         |       2/4 | Good query caching and list primitives exist, but broad invalidation, provider remounting, and extensive entry animation add avoidable work. |
| Responsive/adaptive |       2/4 | Safe areas are commonly handled, but tablet/landscape layouts and Android expanded navigation are not designed.                              |
| Theming             |       1/4 | A dark palette exists, but app configuration, status bars, hard-coded colors, and duplicated token sources make it unreliable.               |
| UI anti-patterns    |       3/4 | The visual system is restrained and consistent overall; repeated card containers and uppercase section labels need moderation.               |
| **UI audit total**  | **10/20** | **Acceptable, with significant work required.**                                                                                              |

### Verification snapshot

| Check                                           | Result | Detail                                                                                                                           |
| ----------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                             | Pass   | No TypeScript compiler errors.                                                                                                   |
| `npm run lint`                                  | Fail   | 5 errors and 22 warnings. Settlement effects, unescaped text, missing hook dependencies, and unused code are among the failures. |
| `npm run format:check`                          | Fail   | 45 files are not Prettier-clean.                                                                                                 |
| `npm run test -- --runInBand --passWithNoTests` | Fail   | Jest references removed module `@testing-library/react-native/extend-expect`; no test files were found.                          |

## P0 — fix before any release

### 1. Friendship acceptance can escalate group membership

**Location:** `supabase/migrations/202607040004_friends_table.sql:25`, `supabase/migrations/202607050006_friend_group_invites.sql:5`

Both people in a friendship can update every friendship field. A `SECURITY DEFINER` trigger then trusts client-controlled `metadata.pending_groups` and inserts both users into those groups without proving that the inviter owns or belongs to each group. The function also lacks an explicit `search_path`.

**Impact:** a malicious client may accept its own request, alter invite metadata, and attempt unauthorized membership changes.

**Fix:** replace client-writable acceptance/invite metadata with narrowly scoped RPCs such as `request_friendship`, `respond_to_friendship`, and `invite_to_group`. Check actor, request direction, group membership/role, and target user inside one transaction. Set `search_path = public, pg_temp`, revoke direct table writes that bypass the RPCs, and add RLS regression tests.

### 2. Expense writes are not atomic

**Location:** `src/features/expenses/services/api.ts:63`, `src/features/expenses/services/api.ts:88`

Creating an expense inserts the parent and splits in separate requests. Updating writes the parent, deletes all splits, then recreates them. Any network, policy, validation, or process failure between steps leaves a partial ledger.

**Impact:** orphan expenses, expenses with no splits, or lost split data can produce incorrect balances.

**Fix:** move create/update into transactional Postgres RPCs. Validate the full payload server-side, lock the target row on update, enforce idempotency, and return the complete committed expense.

### 3. Split update authorization is internally inconsistent

**Location:** `supabase/migrations/202607040002_rls_policies.sql:175`, `supabase/migrations/202607050005_fix_expense_creator.sql:21`, `src/features/expenses/services/api.ts:101`

Later migrations let an expense creator or group member update the expense and insert splits, but the old split `UPDATE`/`DELETE` policies still allow only the payer. The service ignores the split-delete error before attempting reinsertion.

**Impact:** an allowed editor cannot reliably edit an expense paid by somebody else; failed deletion can become a uniqueness error or a partial update.

**Fix:** define one authorization function for expense editors and use it consistently for the expense and all splits. Never ignore delete errors. Prefer the transactional RPC from P0.2.

### 4. “Delete account” does not delete the authentication identity

**Location:** `src/services/api/auth.ts:74`, `supabase/migrations/202607050007_delete_account_rls.sql:1`

The app deletes `public.users` and signs out, but a client cannot delete the corresponding `auth.users` row. For users with ledger history, `ON DELETE RESTRICT` references from expenses, splits, and settlements can also reject the profile deletion before sign-out. If the profile deletion does succeed, the user can still authenticate while the required profile and related data have been removed.

**Impact:** deletion is incomplete and future login can enter a broken account state. This is also a privacy/compliance risk.

**Fix:** call a protected Edge Function or server endpoint using the service role after recent-auth confirmation. Delete or anonymize data according to a written retention policy, delete `auth.users`, revoke sessions, and return a deletion receipt/status. Make the flow retryable and auditable.

## P1 — major release issues

|   # | Issue and evidence                                                                                                                                                                                                                  | Impact                                                                                                                                 | Required fix                                                                                                                                                                                     |
| --: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | **Mutation retry can duplicate financial writes.** `src/lib/queryClient.ts:13` retries every mutation once.                                                                                                                         | A timeout after a successful insert can create a duplicate expense, settlement, comment, or friendship request.                        | Set mutation retry to `0` by default. Add client-generated idempotency keys and unique server constraints for retriable commands.                                                                |
|   2 | **Participant integrity is not enforced as one invariant.** Split and settlement policies primarily validate the actor, not that every target belongs to the selected group or an allowed non-group relationship.                   | A modified client can create nonsensical or unwanted ledger records involving unrelated users.                                         | Validate group membership/allowed participants in transactional RPCs; add deferred sum/membership checks and adversarial RLS tests.                                                              |
|   3 | **Equal/percentage split rounding can lose or create cents.** `src/features/expenses/utils/splits.ts:7` uses floating division and stores each result in `numeric(12,2)`.                                                           | `10 / 3` becomes three rounded values that may not equal the expense total.                                                            | Calculate in integer minor units, distribute remainder cents deterministically, and enforce `sum(splits) = expense.amount` server-side. Define zero-decimal and three-decimal currency behavior. |
|   4 | **Password recovery callback is missing.** `src/services/api/auth.ts:62` links to `splt://auth/callback`, but there is no callback route/session exchange flow.                                                                     | Reset links can open the app without establishing a recovery session or reaching a usable password screen.                             | Add the Expo Router callback route, parse Supabase recovery tokens, exchange/verify the session, handle expired links, and test cold/warm starts on both platforms.                              |
|   5 | **Email-confirmation signup state is not handled.** Registration always routes to onboarding after `signUp`.                                                                                                                        | Projects with email confirmation enabled can bounce the user back to auth with no explanation.                                         | Branch on returned session; show “check your email,” support resend/change-email, and only enter onboarding after a valid session.                                                               |
|   6 | **Terms acceptance is visual only.** `src/app/(auth)/register.tsx:235` has a no-op Terms link, and `submitDisabled` only changes opacity because it is not passed to `PressableScale`.                                              | Users can register without acceptance and cannot read the terms. Repeated taps remain possible while pending.                          | Publish Terms and Privacy routes/URLs, persist document versions and acceptance timestamp, pass `disabled`, and enforce acceptance in validation/server metadata.                                |
|   7 | **Profile updates do not update auth context.** `src/features/profile/hooks/useUpdateProfile.ts:10` invalidates a query that does not exist; the user lives in `AuthContext`.                                                       | The edited name/initials remain stale until another auth event or restart.                                                             | Give AuthContext a `refreshUser`/`updateUser` action or make the profile a real scoped query. Recompute initials and synchronize auth metadata where required.                                   |
|   8 | **Cross-account query isolation is incomplete.** Global keys such as `['groups']`, `['expenses']`, and `['settlements']` omit the user ID. Cache clearing happens in the UI sign-out mutation, but not in every auth listener path. | Token expiry, remote sign-out, or account switching can reuse another account’s fresh cache on the same device.                        | Scope every user-owned key by user ID and clear/remove private queries on all `SIGNED_OUT`/user-change events. Add a two-account privacy test.                                                   |
|   9 | **Delete invalidation leaves group screens stale.** `useDeleteExpense` and `useDeleteSettlement` invalidate only global lists, not affected group queries.                                                                          | Deleted ledger entries can remain visible and balances can look wrong until a later refresh.                                           | Pass/return `groupId`; invalidate detail, group expense/settlement, activity, analytics, and balance dependencies consistently.                                                                  |
|  10 | **Dark mode is not a complete appearance.** `app.json:9` forces light mode, most screens force `<StatusBar style="dark" />`, `UI.color` is mutated globally, and 227 raw hex occurrences remain in TS/TSX.                          | Dark mode can show unreadable system chrome and light-only surfaces; toggling remounts the provider tree via `src/app/_layout.tsx:62`. | Use a reactive theme context/token hook, set `userInterfaceStyle: "automatic"`, theme status/navigation bars, remove provider remounting, and migrate screen colors to semantic tokens.          |
|  11 | **Core text colors fail WCAG contrast.** `#8A8782` is 3.16:1 on `#F5F0EB` and 3.50:1 on `#FFFCF8`; green `#4CAF82` is 2.65:1 and red `#E85D5D` is 3.34:1 on the light surface.                                                      | Secondary copy and small semantic amounts are hard to read and fail WCAG 1.4.3 when used as normal text.                               | Introduce accessible text variants for muted/success/danger roles; keep lighter colors for non-text decoration only. Verify every token pair at AA.                                              |
|  12 | **Dynamic Type is artificially capped.** `src/app/_layout.tsx:24` globally limits text and inputs to 1.3×. Numerous labels are fixed to one line.                                                                                   | Users who need larger text cannot reach their configured size and content may truncate.                                                | Remove the global cap, use scalable type roles, allow wrapping/reflow, and test at the largest accessibility sizes.                                                                              |
|  13 | **Reduced motion is mostly ignored.** Only `PageAnimator` uses `useReducedMotion`; screens still use repeated `FadeInDown`, spring, layout, pulse, and scale animations.                                                            | Motion-sensitive users cannot fully disable nonessential motion.                                                                       | Centralize motion presets that honor the OS setting; replace decorative movement with instant/crossfade states.                                                                                  |
|  14 | **The automated test harness is broken and empty.** `jest.config.js:3` imports a removed matcher module and no tests are present.                                                                                                   | Ledger/security regressions can ship undetected.                                                                                       | Fix Jest setup for current Testing Library, then cover money math, RLS/RPCs, auth recovery, queries, forms, and critical screens.                                                                |
|  15 | **The repository does not pass lint or formatting.** Current result: 5 lint errors, 22 warnings, and 45 unformatted files.                                                                                                          | CI is red/noisy and real regressions are easier to miss.                                                                               | Fix settlement derived state, hook dependencies, unused imports, and JSX escaping; format once, then require clean checks.                                                                       |

## P2 — important next-pass issues

|   # | Issue                                                                                                                                           | Recommendation                                                                                                                                                                                               |
| --: | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | Group authorization is unclear: later migrations allow any member to add/remove members and edit group settings.                                | Define roles (`owner`, `admin`, `member`) and transfer-ownership behavior. Prevent accidental removal of owners and require settled balances or explicit confirmation before destructive membership changes. |
|   2 | The database types are stale: `expense_comments` and expense `created_by` are absent, causing `as any` casts.                                   | Regenerate `database.types.ts` from the deployed schema in CI and fail on drift.                                                                                                                             |
|   3 | Expense notes are rendered in detail but not captured by the new-expense form.                                                                  | Add a clearly optional notes field, validation, and edit support.                                                                                                                                            |
|   4 | Comments exist in schema/API/detail work, but have no notification, edit, length, spam, or moderation rules.                                    | Add server constraints, optimistic UI, edit/delete ownership, rate limits, and participant notifications.                                                                                                    |
|   5 | Activity is reconstructed from expenses/settlements while an unused `activities` table/service also exists.                                     | Pick one source of truth. Prefer immutable audit events generated by database triggers/RPCs if edit history matters; otherwise remove the dead table/service.                                                |
|   6 | Currency conversion uses a free network endpoint and silently falls back to hard-coded rates without a timestamp or source label.               | Keep balances per original currency by default. If converting, store provider, rate, timestamp, base, and user confirmation; never silently present estimated conversions as exact ledger truth.             |
|   7 | Pull-to-refresh invalidates every query in several screens.                                                                                     | Invalidate only the screen’s scoped keys and show independent refresh/error states.                                                                                                                          |
|   8 | Several long screens use `ScrollView` plus mapped rows instead of virtualized lists.                                                            | Use FlashList/FlatList for unbounded expenses, friends, groups, and activity; measure before/after on low-end Android.                                                                                       |
|   9 | Loading, error, and empty behavior is inconsistent; some queries fall back to empty arrays with a global toast.                                 | Give every screen distinct initial-loading, refreshing, offline, permission, empty, and retry states. Preserve prior data during transient failures.                                                         |
|  10 | `StatusBar` is hard-coded to dark across the app.                                                                                               | Create one themed screen shell controlling status bar, navigation bar, safe area, keyboard insets, and background.                                                                                           |
|  11 | Android predictive Back is explicitly disabled in `app.json:19`.                                                                                | Enable and test predictive Back, system Back, modal dismissal, unsaved-change guards, and edge-to-edge keyboard behavior.                                                                                    |
|  12 | iPad support is declared, but almost no screen has expanded-width behavior; onboarding captures window width only once.                         | Either set `supportsTablet: false` for the first release or add navigation rail/two-pane layouts, max content widths, rotation support, and responsive onboarding.                                           |
|  13 | Accessibility coverage is partial: 150 `Pressable` usages but only 39 explicit labels, and the shared search clear control lacks a label/state. | Audit every icon-only/custom control for label, role, hint, disabled/selected/checked state, reading order, focus restoration, live announcements, and 44 pt/48 dp targets.                                  |
|  14 | Destructive actions are exposed even when the current user may lack permission; failures are deferred to RLS.                                   | Compute capabilities returned by the server and hide/disable actions with explanatory copy.                                                                                                                  |
|  15 | App metadata and docs disagree with dependencies (docs say Expo 56/RN 0.85; package uses Expo 57/RN 0.86).                                      | Make package metadata the source of truth and update `AGENTS.md`, progress docs, build docs, and upgrade notes together.                                                                                     |
|  16 | Splash/adaptive-icon purple `#3d2b82` contradicts the documented “No Purple Reversal” design rule.                                              | Regenerate launch/icon assets from the current warm-ledger identity and verify Android monochrome/themed icons.                                                                                              |

## P3 — polish after correctness

- [ ] Reduce repeated “card inside card” grouping where spacing or dividers communicate hierarchy more clearly.
- [ ] Reserve uppercase tracked labels for genuine metadata; avoid using them as the default section scaffold.
- [ ] Consolidate `UI`, CSS variables, `design-tokens.json`, and local constants into one generated semantic token source.
- [ ] Replace raw “Error” copy with action-oriented messages and recovery choices; announce asynchronous success/failure to assistive technology.
- [ ] Standardize money formatting through `Intl.NumberFormat`, locale-aware decimal input, currency fraction digits, and negative-value conventions.
- [ ] Add localization infrastructure; remove hard-coded `en-US` dates and string concatenation that cannot be translated safely.
- [ ] Add input limits and database constraints for names, titles, notes, comments, descriptions, supported currency codes, and dates.
- [ ] Review haptics: do not fire success before persistence is confirmed, avoid haptics for routine navigation, and respect system preferences where possible.

## What is already strong

- Feature-sliced organization and a service boundary make the app understandable.
- Core expense flows already support equal, exact-amount, and percentage splits.
- Group and non-group expenses, settlements, debt simplification, analytics, comments foundations, loading skeletons, and empty states are present.
- Safe-area handling, accessible labels on important header actions, semantic balance colors, and reusable UI primitives show deliberate UX work.
- The visual identity is calmer and more trustworthy than generic “flashy fintech,” with restrained radii and mostly flat surfaces.
- Supabase RLS is enabled broadly; the remaining work is to make policies narrow, consistent, and tested.

## Implementation plan

### Phase 0 — establish evidence (1–2 days)

- [ ] Freeze feature work and create a clean staged Supabase project from all migrations.
- [ ] Record the four check results above in CI.
- [ ] Add seed users/groups/expenses for deterministic QA.
- [ ] Add error/crash monitoring with environment and app-version tags; exclude financial/private payloads.
- [ ] Write critical-flow acceptance tests before changing authorization behavior.

**Exit:** reproducible database, reproducible failures, and safe observability.

### Phase 1 — secure the data model (3–6 days)

- [ ] Replace friendship/group-invite table writes with validated RPCs.
- [ ] Introduce group roles and a written permission matrix.
- [ ] Implement transactional expense create/update with idempotency.
- [ ] Enforce split totals, participant membership, currency codes, and money precision server-side.
- [ ] Align all expense/split RLS policies with the same editor function.
- [ ] Add pgTAP or SQL integration tests for every role and hostile operation.

**Exit:** no known privilege escalation or partial-ledger path.

### Phase 2 — repair auth/account lifecycle (2–4 days)

- [ ] Implement email-confirmation and password-recovery deep links.
- [ ] Implement server-side account deletion and recent-auth confirmation.
- [ ] Make current user reactive after profile edits.
- [ ] Scope and clear query caches for every auth transition.
- [ ] Publish functional Terms and Privacy links and record consent correctly.

**Exit:** signup, login, logout, reset, edit profile, session expiry, account switch, and deletion pass on iOS and Android.

### Phase 3 — guarantee money correctness (3–5 days)

- [ ] Move all calculations to integer minor units/a decimal-money library.
- [ ] Add deterministic remainder distribution.
- [ ] Decide and document multi-currency semantics; keep original-currency balances unless the user explicitly converts.
- [ ] Add property-based tests for splits, settlements, simplify-debts, reversals, and mixed currencies.
- [ ] Fix group/global query invalidation and remove generic mutation retries.

**Exit:** server and client agree for every ledger fixture, including rounding edge cases.

### Phase 4 — accessibility, adaptive layout, and theme (4–7 days)

- [ ] Replace failing text colors with AA semantic roles.
- [ ] Remove the 1.3× text cap and test maximum accessibility sizes.
- [ ] Complete VoiceOver/TalkBack labels, states, focus, and announcements.
- [ ] Make all motion respect reduced-motion settings.
- [ ] Replace mutable global theme values with reactive semantic tokens.
- [ ] Finish dark system chrome and remove light-only raw colors.
- [ ] Enable predictive Back and either implement tablet layouts or remove tablet support for v1.

**Exit:** accessibility matrix passes on representative iOS/Android devices.

### Phase 5 — quality and performance (3–5 days)

- [ ] Fix Jest, lint, formatting, and hook warnings.
- [ ] Add unit, component, service integration, RLS, and end-to-end smoke tests.
- [ ] Virtualize unbounded lists and narrow query invalidation.
- [ ] Add offline/reconnect UX and prevent duplicate submits.
- [ ] Reconcile documentation and generated database types.

**Exit:** all checks green, no high-severity monitoring errors in staged soak testing.

### Phase 6 — feature delivery

Only begin the feature backlog below after Phases 1–3. Build one vertical slice at a time with schema, authorization, offline behavior, notifications, analytics, accessibility, tests, and deletion/export implications included.

## Splitwise-inspired feature roadmap

The sources below are official Splitwise product/help pages, checked on the audit date. They are used for capability inspiration, not for copying proprietary UI or branding.

### Already present or substantially present

| Capability                           | Splt status | Next improvement                                                               |
| ------------------------------------ | ----------- | ------------------------------------------------------------------------------ |
| Group and non-group expenses         | Present     | Harden participant permissions and invitations.                                |
| Equal split                          | Present     | Correct minor-unit rounding.                                                   |
| Exact/custom split                   | Present     | Add server invariant and reusable defaults.                                    |
| Percentage split                     | Present     | Store submitted percentage consistently and validate server-side.              |
| Multiple currencies/default currency | Partial     | Keep original balances separate; make conversion explicit and auditable.       |
| Simplify debts                       | Present     | Add proof-based tests and explain that counterparties can change.              |
| Record settlements                   | Present     | Add idempotency, payment method/reference, reversal, and confirmation history. |
| Categories and spending analytics    | Present     | Add group/friend scope, date comparison, export, and accessible charts.        |
| Expense date and notes               | Partial     | Expose notes in create/edit; add date/locale constraints.                      |
| Expense comments                     | Partial     | Finish UI rules, notifications, editing, moderation, and generated types.      |

### Tier 1 — high value, reasonable complexity

1. **Expense search and filters**  
   Search description, payer, participant, group, category, date, amount range, currency, and notes. Use server pagination/indexes rather than filtering only downloaded rows.

2. **Recurring expenses and reminders**  
   Support weekly/monthly/custom schedules, next-run preview, timezone, pause/end, edit-this/edit-future behavior, and idempotent server generation. Splitwise exposes repeat intervals and advance reminders from the date flow ([official recurring bill help](https://feedback.splitwise.com/knowledgebase/articles/238785-how-do-i-create-a-recurring-bill)).

3. **Split by shares**  
   Add share weights for couples/families and reusable ratios. Splitwise documents share-based splits for unequal household/group structures ([official shares guidance](https://feedback.splitwise.com/knowledgebase/articles/967453-tips-for-splitting-expenses-in-groups-with-couples)).

4. **Default split rules**  
   Save a default per friendship/group and optionally per category. Always preview the resulting amounts before save. Splitwise Pro lists group default splits/custom ratios ([official Pro page](https://www.splitwise.com/pro)).

5. **Real notifications and reminders**  
   Add an append-only notification table, unread state, Supabase Realtime, Expo push, email preference center, batching, deep links, and quiet hours. Notify only affected people and avoid notifying the actor about their own change.

6. **Invite links and pending members**  
   Use signed, expiring, single-purpose tokens. Let unregistered people appear as pending placeholders without exposing the global user directory.

7. **CSV export and personal data export**  
   Export group/friend expenses, splits, settlements, comments, and original currencies. Add a full account export for privacy portability.

8. **Expense history, undo, and restore**  
   Record who changed what and when; support soft-delete/restore and settlement reversal rather than irreversible destructive actions. Splitwise’s help center highlights recent-change history and shared editing behavior ([official knowledge base](https://feedback.splitwise.com/knowledgebase)).

### Tier 2 — differentiating features

1. **Receipt photo attachments**  
   Add camera/library permissions, private object storage, compression, thumbnailing, signed URLs, deletion, offline upload queue, and storage quotas. Splitwise supports receipt images on expenses ([official getting-started guide](https://feedback.splitwise.com/knowledgebase/articles/1088920-how-do-i-use-splitwise)).

2. **Receipt OCR and itemization**  
   Detect merchant/date/tax/tip/items, then let users assign each item to one or more people and review confidence before saving. Never let OCR directly commit money. Splitwise Pro lists receipt scanning and itemization ([official Pro page](https://www.splitwise.com/pro)).

3. **Group totals and budgets**  
   Add “your share” vs “group spend,” category trends, this month/last month/all time, and optional nonjudgmental budget alerts. Splitwise lists charts and graphs as a Pro capability ([official Pro page](https://www.splitwise.com/pro)).

4. **Group cover photos and richer identity**  
   Useful for scanning trip/household groups, but lower priority than ledger speed and trust.

5. **Home-screen quick add and expense templates**  
   Duplicate a previous bill or start from templates such as rent, utilities, groceries, and dinner while still reviewing payer/participants/date.

6. **Offline-first drafts and sync**  
   Save expenses locally, show explicit pending/synced/failed states, and reconcile with idempotency keys. Do not silently guess conflict resolution for edited financial records.

### Tier 3 — expensive, regulated, or operationally heavy

1. **Bank/card transaction import**  
   Splitwise Pro offers transaction import in supported markets ([official Pro page](https://www.splitwise.com/pro)). This requires an aggregator such as Plaid, consent/reauth flows, duplicate detection, regional availability, data-retention controls, and significant security/compliance work.

2. **In-app payments**  
   Start with deep links to regional payment apps plus a recorded reference. Holding funds, initiating bank payments, or wallets introduces KYC/AML, disputes, fraud, reconciliation, licenses/partners, and support obligations. Do not build a wallet as an ordinary app feature.

3. **Automatic currency conversion**  
   Splitwise generally keeps balances in separate currencies and makes conversion an explicit operation using a current rate ([official currency help](https://feedback.splitwise.com/knowledgebase/articles/301146-can-splitwise-do-currency-conversion-between-multi)). Splt should adopt similarly explicit semantics before offering bulk conversion.

4. **Card-linked automatic expense creation**  
   Treat as a later layer on transaction import. Require confirmation, merchant normalization, participant suggestions, and strong duplicate/chargeback handling.

## Recommended product order

After the release gates are closed, the best first sequence is:

1. Search and filters.
2. Recurring expenses with reminders.
3. Shares and default split rules.
4. Real notification center and invite links.
5. Export plus edit history/restore.
6. Receipt attachments.
7. OCR itemization.
8. Budgets and richer analytics.
9. Bank import or payment integrations only after a separate legal/security discovery phase.

This order improves the everyday ledger loop before adding high-cost integrations. It also matches Splt’s calm, trustworthy product principles: faster capture, clearer consequences, and fewer awkward follow-ups.

## Critical QA matrix

Run every row as creator, payer, participant, nonparticipant, group admin/member, and signed-out user where applicable.

- [ ] Create/edit/delete equal, custom, percentage, and shares expenses where someone else paid.
- [ ] Verify 0.01, 10/3, very large values, zero-decimal currencies, mixed currencies, and locale decimal separators.
- [ ] Add/remove members with open balances; leave group; transfer ownership; accept/reject/expire an invite.
- [ ] Record partial/full/overpayment and reverse/delete a settlement.
- [ ] Simulate request timeout after server commit; confirm no duplicate record.
- [ ] Interrupt expense create/update between every server operation; confirm atomic rollback.
- [ ] Switch between two accounts on one device and inspect every cached screen.
- [ ] Open signup confirmation and reset-password links from killed/background/foreground states.
- [ ] Revoke a session remotely and verify private cache removal.
- [ ] Delete an account, confirm auth identity/session removal, and test repeated deletion request.
- [ ] Test offline create/edit/reconnect conflicts and failed attachment uploads.
- [ ] Test VoiceOver/TalkBack reading order, labels, states, error announcements, and modal focus return.
- [ ] Test maximum text size, bold text, increased contrast, reduced motion, light/dark mode, and color-blind non-color cues.
- [ ] Test smallest supported phone, keyboard open, Android edge-to-edge, predictive Back, iPhone home indicator, and supported tablets.

## Definition of done for every future feature

- [ ] Product acceptance criteria and edge cases are written first.
- [ ] Authorization and privacy rules are enforced server-side, not inferred from hidden UI.
- [ ] Money changes are atomic and idempotent.
- [ ] Loading, empty, offline, error, retry, success, and permission states exist.
- [ ] VoiceOver/TalkBack, text scaling, reduced motion, contrast, and touch targets pass.
- [ ] Light/dark, iOS/Android, narrow/expanded, keyboard, and safe-area behavior pass.
- [ ] Unit, integration/RLS, component, and critical end-to-end tests pass.
- [ ] Analytics and logs contain no unnecessary financial or personal content.
- [ ] Export, deletion, retention, notification, and migration implications are addressed.
- [ ] Documentation, generated types, and the UI registry are updated.

---

After each phase, rerun the four project checks and repeat the staged security/ledger test suite. Re-run a full UI audit after Phase 4 to measure the accessibility, responsive, theming, performance, and anti-pattern scores again.
