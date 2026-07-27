# Current-State Audit

## Method

This is a static repository and automated-gate audit, not a claim that every device path
has been manually exercised. Evidence came from route and dependency inventory, service
and migration review, money utilities, core screen review, control searches, Jest,
TypeScript, ESLint, Prettier, and Playwright test discovery. Native device walkthroughs
remain an explicit Phase 0 task.

Severity:

- **P0 — blocker:** can permit unauthorized ledger writes or structurally corrupt money.
- **P1 — critical:** a primary journey is wrong, misleading, inaccessible, or unreleasable.
- **P2 — important:** material UX, maintainability, adaptivity, or performance weakness.
- **P3 — polish:** consistency or delight issue with limited task impact.

## Health score

| Native dimension     |    Score | Evidence                                                                                                                                                |
| -------------------- | -------: | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessibility        |      1/4 | Some good roles and target sizes, but weak label association, incomplete state semantics, capped text scaling, and mostly unhandled reduced motion      |
| Performance          |      2/4 | React Query and list tooling exist, but person/group snapshots load broad datasets, screens are very large, and no release profiling budget is enforced |
| Appearance/theming   |      2/4 | Coral tokens and dark colors exist, but several token systems and hard-coded colors coexist and design documents disagree                               |
| Platform conformance |      2/4 | Safe areas and back handling are present, but the custom JS dock/sheets need platform behavior verification                                             |
| Adaptivity           |      1/4 | Phone-first fixed layouts, module-level dimensions, no tablet navigation model, and font-size caps                                                      |
| **Total**            | **8/20** | **Poor; remediation required before calling the app production-ready**                                                                                  |

## P0 findings

### A-001 — Expense mutation authorization is insufficient

`create_expense_v2` is `SECURITY DEFINER`. It authenticates the caller and validates a
receipt, then delegates to `create_expense_internal_v2`. The latest internal function
does not establish all of these invariants before insertion:

- the actor belongs to the selected group or accepted friendship;
- the payer belongs to that context;
- every split user belongs to that context;
- a direct expense has exactly the two friendship participants;
- split users are unique;
- positions and participant count are valid.

Because the function bypasses ordinary RLS, these checks must be explicit in the RPC.
Client validation is not a security boundary.

**Required outcome:** fail-closed context authorization inside the transaction, with
adversarial pgTAP coverage for outsiders, former members, pending/rejected friendships,
foreign payers, injected participants, and duplicate users.

### A-002 — Split totals can diverge from the expense amount

The latest equal-split branch inserts client-provided amounts without summing them.
Percentage validates percentage units but not the sum of `amountMinor`; shares validates
positive total shares but not the allocated minor total. Only custom currently verifies
the monetary sum. An expense can therefore have an amount that disagrees with its splits,
which makes every downstream balance ambiguous.

**Required outcome:** for every method, calculate or validate on the server and enforce:

`sum(split.amount_minor) = expense.amount_minor`

The transaction must roll back on any mismatch.

## P1 findings

### Money and settlement

- **A-003:** `SettlementScreen` preset buttons pass minor units into a major-unit text
  input. A 5,000-minor balance can become `5000` instead of `50.00`.
- **A-004:** bulk settlement confirmation adds minor units from multiple currencies and
  formats the result as the first currency. This is a false financial total.
- **A-005:** expense parsing and the database allow zero-value expenses
  (`amount_minor >= 0`). A posted expense must be greater than zero.
- **A-006:** `selectSettlementTarget` deliberately selects the negative balance closest to
  zero when no positive balance exists. That rule is surprising and should be replaced
  by an explicit product ranking, normally largest absolute actionable balance.
- **A-007:** legacy major-unit balance and direct mutation paths coexist with the canonical
  minor-unit/RPC stack. This permits future code to bypass the intended contract.
- **A-008:** “settle all” records `cash` without the user choosing or confirming that
  metadata.

### Person detail and requested behavior

- **A-009:** the app already lists shared groups and shared expense history, but a group
  expense paid by a third person is rendered as “You paid” with the full expense value.
- **A-010:** history does not name the group, so a shared expense lacks the context the
  user requested.
- **A-011:** each shared group uses `.find()` for one open balance and silently drops
  additional currencies.
- **A-012:** `usePersonSnapshot` reconstructs the ledger from all client-fetched expenses
  and settlements rather than consuming the authoritative open-balance RPC.
- **A-013:** legacy fallbacks use `Math.round(amount * 100)`, which is wrong for zero- and
  three-decimal currencies.

### False or non-functional product surfaces

- **A-014:** scheduled-expense review is explicitly a mock with fixed `$96.40`; “Post
  expense” only navigates back.
- **A-015:** data export selectors do nothing and “Generate export” goes back despite copy
  promising a secure background export.
- **A-016:** Face ID is hard-coded on, active session data is fictional, and Delete account
  does nothing.
- **A-017:** notification settings and Reduce motion are hard-coded/no-op controls.
- **A-018:** Help search and several help/support actions do nothing.

Reachable false UI damages trust more than an absent feature. Hide these routes or label
them unavailable until real state, failure behavior, and backend contracts exist.

### Quality gates

- **A-019:** TypeScript fails because Playwright imports Node modules without configured
  Node types.
- **A-020:** 3 of 38 Jest suites fail. All 25 failing assertions are in current navigation/
  UI harness areas: Circles, CircleDock, and MoneyMap/worklets.
- **A-021:** source lint has 11 errors, including effect-state patterns, compiler
  memoization conflicts, and unescaped JSX text.
- **A-022:** the normal lint command scans generated `playwright-report` assets, producing
  6,653 findings and a 362 MB output rather than a useful signal.
- **A-023:** Prettier reports 128 files out of format.

## P2 findings

### Product complexity

- The global centre action presents five unrelated choices. Add expense, Settle, Create
  group, Add person, and Schedule expense do not share the same mental model.
- The same intent is reachable through many screens, but entrances do not consistently
  preselect context or converge on the same route.
- Friend detail sends Settle through the global selector even though the person is known.
- `NewExpenseScreen.tsx` is about 1,360 lines and exposes amount, description, context,
  payer, full split editor, date, category, receipt, and success state in one component.
- Advanced split configuration is always prominent. Typical equal splitting should not
  make users manage internal allocation mechanics.

### Architecture

- Two component families (`components/coral` and `components/ui`) overlap.
- Canonical Coral tokens, legacy Warm Ledger documentation, CSS variables, and component
  literals drift.
- Several screens exceed 500 lines and combine query orchestration, domain derivation,
  mutation, navigation, and rendering.
- Person and group projections are rebuilt on the device from large unpaginated datasets.
- Empty scaffold directories and stale components make reachability unclear.
- Project metadata is stale: repository guidance describes Expo 56/RN 0.85 while the
  package currently declares Expo 57/RN 0.86; the package name remains a template name.
- Project guidance names HeroUI Native, but no `heroui-native` dependency exists and the
  active UI is custom Coral plus legacy primitives.

### Accessibility and platform behavior

- Visible field labels are not consistently associated with their inputs.
- Busy/disabled buttons do not consistently expose `accessibilityState`.
- Modal sheets need modal semantics, focus placement/restoration, escape behavior, and
  screen-reader announcements.
- Several labels and rows cap font scaling or force one line.
- Most Reanimated usage ignores OS reduced motion; the in-app preference is a no-op.
- Custom tab/dock motion and centre action need iOS VoiceOver, Android TalkBack, back,
  predictive-back, keyboard, and large-text testing.
- Module-level `Dimensions` in sheet logic does not respond reliably to window changes.
- Tablet layout lacks an explicit rail/split-view strategy.

### Performance and resilience

- Broad snapshots fetch far more history than the screen displays.
- ScrollView is the default screen container even where content can grow.
- There is no committed release-build performance budget or profiling evidence.
- Receipt cleanup failures are swallowed.
- Offline/stale UI exists in places but mutation retry, idempotency messaging, and conflict
  behavior are not consistently specified.

## P3 findings

- Money tone and copy occasionally communicate who paid rather than the bilateral effect.
- Hard-coded success/warning colors bypass semantic tokens.
- Several financial rows use tiny fixed type.
- Spring-heavy navigation motion feels busier than the product’s calm ledger identity.
- Placeholder legal/help copy lacks an owned, versioned content source.

## Strengths to retain

- Minor-unit calculation utilities include deterministic remainder allocation and tests
  for equal/custom/percentage/share modes.
- The open-balance RPC has a useful signed convention: positive means the counterparty
  owes the current user; negative means the current user owes.
- Expense and settlement creation include client operation IDs and lock-oriented work.
- The settlement RPC rechecks balance inside the transaction.
- React Query, Zustand, service boundaries, route-level screens, safe areas, and haptics
  provide a workable foundation.
- `MoneyRow`, `CoralButton`, and top bars already establish useful touch-target patterns.
- Coral Ledger has a distinctive, restrained visual system worth preserving.
- 476 passing Jest tests are a meaningful base, once the harness is repaired.

## Baseline commands and observed results

| Command                                           | Result on 2026-07-27                                    |
| ------------------------------------------------- | ------------------------------------------------------- |
| `npm run typecheck`                               | Failed: Node module/type resolution in Playwright files |
| `npx eslint src e2e playwright.config.ts --quiet` | Failed: 11 source errors                                |
| `npx prettier --check ...`                        | Failed: 128 files                                       |
| `npm run test -- --runInBand`                     | 35 suites passed, 3 failed; 476/501 tests passed        |
| `npx playwright test --list`                      | 12 public auth checks; authenticated suite disabled     |

These results are a baseline, not a request to mechanically reformat or modify unrelated
dirty work. Phase 0 must first separate user work from audit changes and repair gates
intentionally.
