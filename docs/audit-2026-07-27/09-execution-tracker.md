---
tracker: splt-improvement-program
version: 1
last_updated: 2026-07-27
program_status: ACTIVE
current_phase: P1
active_task: P1-02
next_task: P1-02
---

# Splt AI Execution Tracker

This is the **active implementation source of truth** for the Splt improvement program.
The roadmap explains strategy; this file records execution. Any AI or developer resuming
the work must read this file first, then the linked specification for the selected task.

## Blueprint ready

The product language and major decisions are settled in
[the blueprint](./README.md). Implementation can begin when the user explicitly approves
it. Creating this tracker is not approval to run production migrations, alter production
data, delete user work, publish a release, or enable unfinished capabilities.

## Program objective

Make Splt financially trustworthy, materially simpler for end users, accessible and
adaptive on iOS/Android, and maintainable—while preserving the Coral Ledger design tokens
and migrating safely behind existing routes.

## Canonical references

Read only the documents relevant to the active task, but always read this tracker fully:

| Reference                                               | Use                                                   |
| ------------------------------------------------------- | ----------------------------------------------------- |
| [Blueprint](./README.md)                                | Settled principles, language, and decisions           |
| [Audit](./01-current-state-audit.md)                    | Finding IDs and evidence                              |
| [UX blueprint](./02-product-ux-blueprint.md)            | Target journeys and interaction rules                 |
| [Person ledger](./03-person-ledger-spec.md)             | Friend/group projection and acceptance cases          |
| [Financial integrity](./04-financial-integrity-plan.md) | Money/RPC invariants and adversarial tests            |
| [Architecture](./05-technical-architecture.md)          | Boundaries, migration shape, and ADR list             |
| [Roadmap](./06-delivery-roadmap.md)                     | Phase outcomes and rollout sequence                   |
| [Testing](./07-test-and-release-strategy.md)            | Test layers, matrices, and release gates              |
| [Inventory](./08-screen-and-control-inventory.md)       | Route/control keep, rewrite, merge, or hide decisions |
| `DESIGN.md`                                             | Current Coral Ledger visual direction                 |
| `design-tokens.json`                                    | Preserved token source                                |
| `ui-registry.md`                                        | Component implementation registry                     |

If implementation contradicts a canonical reference, stop and add a decision-log entry.
Do not silently reinterpret product or money semantics.

## Status vocabulary

Use exactly one value:

- `TODO` — ready only when all dependencies are `DONE`.
- `IN_PROGRESS` — actively being changed; only one task may have this status.
- `BLOCKED` — cannot continue safely; blocker is recorded in the Blocker log.
- `REVIEW` — implementation is complete and awaits an independent review or user decision.
- `DONE` — acceptance criteria and verification are complete with evidence.
- `SKIPPED` — explicitly removed from scope with a decision-log entry.

Phase status is derived:

- `PLANNED`: no task started;
- `ACTIVE`: at least one task is `IN_PROGRESS`, `REVIEW`, or `DONE`;
- `BLOCKED`: the next critical task is blocked;
- `DONE`: every required task in the phase is `DONE` or approved `SKIPPED`.

## Mandatory AI operating protocol

### At the start of every implementation session

1. Read this tracker fully.
2. Run `git status --short` and preserve all unrelated existing changes.
3. Read the specification references named by the candidate task.
4. Select `next_task` only if its dependencies are `DONE`; otherwise select the earliest
   unblocked dependency.
5. Change `active_task` in the front matter and that task’s status to `IN_PROGRESS`.
6. Add a Session log row stating intended scope before editing product code.
7. Use applicable installed skills and project instructions.

### While working

- Work on one tracker task at a time.
- Keep changes inside the task’s declared scope.
- Do not combine unrelated formatting, dependency upgrades, or refactors.
- Add failing tests before fixing P0/P1 financial or authorization defects.
- Use integer minor units and preserve currencies through all ledger paths.
- Never infer permission for production data correction, deployment, destructive cleanup,
  external messaging, or a materially different product decision.
- Update affected documentation and generated types in the same task when required.
- If new work is found, add a `DISC-*` discovery row; do not expand the active task
  silently.

### Before marking a task done

1. Run every command in the task’s Verification field.
2. Review the diff for unrelated changes, secrets, generated artifacts, and stale code.
3. Add an Evidence log row with files, tests, and result.
4. If verification fails because of the task, keep it `IN_PROGRESS` or mark it `BLOCKED`.
5. If unrelated pre-existing failure remains, record exact evidence; do not claim the full
   gate is green.
6. Change status to `DONE` only when all acceptance criteria are satisfied.
7. Set `active_task: NONE`, update `next_task`, `last_updated`, and the Session log.

### Stop and request explicit user direction when

- a production migration or historical money correction is ready to run;
- deleting or rewriting user-owned dirty changes is required;
- an architectural/product decision differs from the settled blueprint;
- a public API or schema must change incompatibly without a safe migration;
- a requested capability needs new credentials, paid infrastructure, legal content, or
  third-party coordination;
- security review finds possible active exploitation or exposed secrets;
- rollback cannot be demonstrated for a financially meaningful change.

## Definition of done for every task

A task is `DONE` only when:

- its acceptance criteria and unhappy paths are implemented;
- required tests pass at the layer owning the rule;
- TypeScript, scoped lint, and formatting pass for touched files;
- accessibility, reduced motion, loading/error/offline, and platform behavior are covered
  when relevant;
- docs, generated database types, and registry entries are updated when relevant;
- the diff contains no accidental user-work changes or secrets;
- evidence is recorded below;
- no temporary predecessor remains unless the task explicitly requires a feature flag.

## Phase overview

| Phase | Outcome                                                  | Status  | Required exit task |
| ----- | -------------------------------------------------------- | ------- | ------------------ |
| P0    | Reliable gates; false UI contained                       | ACTIVE  | P0-12              |
| P1    | Ledger writes are authorized and internally consistent   | ACTIVE  | P1-14              |
| P2    | Authoritative paginated balance/person/group read models | PLANNED | P2-12              |
| P3    | One minimal expense creation/edit journey                | PLANNED | P3-14              |
| P4    | One correct balance-led settlement journey               | PLANNED | P4-10              |
| P5    | Minimal Home/Circles/Activity/More navigation            | PLANNED | P5-11              |
| P6    | One accessible, adaptive Coral component system          | PLANNED | P6-14              |
| P7    | Deferred capabilities return only with real contracts    | PLANNED | P7-08              |
| P8    | Release hardening, rollout, and legacy removal           | PLANNED | P8-10              |

## P0 — Stabilize and contain

Read: [Audit](./01-current-state-audit.md),
[Testing](./07-test-and-release-strategy.md), and
[Inventory](./08-screen-and-control-inventory.md).

| ID    | Status  | Depends on              | Work and acceptance criteria                                                                                                                                                                                                                  | Verification                                                                                         |
| ----- | ------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| P0-01 | DONE    | —                       | Record the current dirty-worktree baseline, classify existing changed/untracked files as pre-existing vs program-owned, and create no destructive cleanup.                                                                                    | `git status --short`; evidence log contains the baseline and overlap risks                           |
| P0-02 | DONE    | P0-01                   | Separate TypeScript ownership for RN app, Jest, Playwright, and Supabase functions so Node types do not enter the app bundle. App, E2E, and Deno boundaries typecheck; the test config intentionally exposes existing fixture debt for P0-07. | `npm run typecheck`; `npm run typecheck:e2e`; `npm run typecheck:supabase`                           |
| P0-03 | DONE    | P0-01                   | Exclude Playwright reports, test results, coverage, Expo output, and generated traces from lint/format/source control without hiding owned source.                                                                                            | `npm run lint` output contains no generated report assets; `git status --ignored --short` spot-check |
| P0-04 | DONE    | P0-02,P0-03             | Fix all scoped source lint errors, including effect-state and React Compiler memoization issues, without disabling rules globally.                                                                                                            | `npx eslint src e2e playwright.config.ts --quiet`                                                    |
| P0-05 | DONE    | P0-01                   | Repair Circles and CircleDock test imports/mocks and centralize router/Reanimated mocks where appropriate.                                                                                                                                    | Targeted suites pass; no skipped assertions added                                                    |
| P0-06 | DONE    | P0-01                   | Repair MoneyMap/worklets test initialization using a reusable supported Jest setup.                                                                                                                                                           | MoneyMap suite passes; full Jest run does not fail on worklets initialization                        |
| P0-07 | DONE    | P0-04,P0-05,P0-06       | Restore a green full unit/component baseline and record suite/test counts.                                                                                                                                                                    | `npm run test -- --runInBand`                                                                        |
| P0-08 | DONE    | P0-04                   | Format owned source as a dedicated reviewable change; do not reformat migrations or user work blindly.                                                                                                                                        | `npm run format:check`; diff reviewed                                                                |
| P0-09 | DONE    | P0-01                   | Add a typed capability registry and hide scheduled review, fake export, fake biometric/session/delete, no-op notification/motion, and inert help controls until implemented. No reachable control may lie or silently do nothing.             | Route/control tests plus manual route inventory                                                      |
| P0-10 | DONE    | P0-02,P0-03,P0-07,P0-08 | Make CI run install, generated drift, typecheck, scoped lint, format, Jest, and local database tests in clear jobs with useful artifacts.                                                                                                     | Validate workflow syntax; run equivalent commands locally                                            |
| P0-11 | BLOCKED | P0-09                   | Perform baseline iOS and Android walkthroughs for every live primary route; record screen, action, state, accessibility, and data defects as `DISC-*` rows.                                                                                   | Evidence links to device/build/OS notes and captures                                                 |
| P0-12 | BLOCKED | P0-07,P0-09,P0-10,P0-11 | Phase review: prove all required gates are green and no reachable control is inert or deceptive; update baseline counts and phase status.                                                                                                     | Review checklist; full Phase 0 command set                                                           |

## P1 — Lock the ledger

Read: [Financial integrity](./04-financial-integrity-plan.md) and audit findings A-001
through A-008. All SQL security work requires independent review.

| ID    | Status      | Depends on              | Work and acceptance criteria                                                                                                                                       | Verification                                                        |
| ----- | ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| P1-01 | DONE        | P0-12                   | Write ADRs for money/currency transport, expense authorization, split authority, and settlement reversal/audit semantics. Resolve safe JS transport limits.        | ADR review; decision log updated                                    |
| P1-02 | IN_PROGRESS | P1-01                   | Add failing pgTAP authorization cases for anonymous/outsider/removed/pending users, foreign payer, injected/duplicate participants, and invalid contexts.          | Tests fail for the intended missing checks before implementation    |
| P1-03 | TODO        | P1-01                   | Add failing pgTAP invariant cases for zero/negative/overflow amounts and equal/custom/percentage/share monetary mismatches.                                        | Tests fail for intended missing invariants                          |
| P1-04 | TODO        | P1-01                   | Create one supported-currency registry and drift tests for DB scale, client precision, formatter, and selectable currencies. Unknown currencies fail closed.       | Registry unit + DB tests                                            |
| P1-05 | TODO        | P1-02,P1-03,P1-04       | Implement fail-closed `create_expense` context, actor, payer, participant, uniqueness, positive-amount, and total validation inside one transaction.               | Adversarial pgTAP + happy-path service tests                        |
| P1-06 | TODO        | P1-05                   | Derive or verify equal/percentage/share allocation server-side with deterministic remainder semantics; every method sums exactly.                                  | Property/table tests across 0/2/3-decimal currencies                |
| P1-07 | TODO        | P1-05,P1-06             | Apply the same authorization/invariants to update, locking old and new affected balance keys.                                                                      | Update adversarial and concurrency tests                            |
| P1-08 | TODO        | P1-01                   | Harden operation idempotency so same ID/same payload is safe and same ID/different payload conflicts; test concurrent retries.                                     | Concurrent pgTAP/integration tests                                  |
| P1-09 | TODO        | P1-01                   | Harden settlement direction, amount, context, method, and stale-balance behavior; prohibit zero/negative/overpayment and fabricated method metadata.               | Settlement adversarial/concurrency tests                            |
| P1-10 | TODO        | P1-07,P1-09             | Remove/privatize direct legacy expense and settlement mutations; route all clients through canonical versioned RPCs.                                               | Import/reachability scan; service contract tests                    |
| P1-11 | TODO        | P1-07                   | Define and implement audited expense/settlement delete or reversal policy; preserve traceability.                                                                  | Permission, balance, and audit-history tests                        |
| P1-12 | TODO        | P1-07,P1-09             | Build a read-only historical data audit for split mismatch, invalid participant, zero amount, currency scale, duplicates, and orphan receipt. Do not correct data. | Dry-run report on local production-like data                        |
| P1-13 | TODO        | P1-12                   | Prepare versioned remediation, backup, comparison, and rollback runbook. Production execution requires explicit user approval.                                     | Clean install + upgrade rehearsal; before/after balance comparison  |
| P1-14 | TODO        | P1-08,P1-10,P1-11,P1-13 | Independent ledger/security review and phase exit. All adversarial tests pass and no direct mutation bypass remains.                                               | Full pgTAP, service, type generation, clean/upgrade migration suite |

## P2 — Authoritative read models

Read: [Person ledger specification](./03-person-ledger-spec.md) and
[Architecture](./05-technical-architecture.md).

| ID    | Status | Depends on        | Work and acceptance criteria                                                                                                               | Verification                                      |
| ----- | ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| P2-01 | TODO   | P1-14             | Version and document open-balance sign/key semantics by user, counterparty, context, and currency.                                         | SQL contract tests and generated types            |
| P2-02 | TODO   | P2-01             | Add failing privacy, pagination, bilateral-effect, third-party-payer, and multi-currency tests for `fetch_person_ledger_v1`.               | Tests fail for missing read model                 |
| P2-03 | TODO   | P2-02             | Implement authorized cursor-paginated person ledger returning context label and bilateral effect without copying expenses.                 | pgTAP/integration acceptance scenarios 1–12       |
| P2-04 | TODO   | P2-01             | Implement authorized cursor-paginated group ledger with current-user effects and currency-preserving balances.                             | SQL privacy/pagination/sign tests                 |
| P2-05 | TODO   | P2-03,P2-04       | Generate DB types and add boundary mappers that reject invalid/unsafe money transport.                                                     | Mapper and type-drift tests                       |
| P2-06 | TODO   | P2-05             | Centralize query keys and targeted invalidation for expense, settlement, open balance, person ledger, and group ledger.                    | Query contract tests                              |
| P2-07 | TODO   | P2-03,P2-06       | Replace `usePersonSnapshot` broad client aggregation and remove all `Math.round(amount * 100)` ledger fallbacks.                           | Person snapshot tests; `rg` proof                 |
| P2-08 | TODO   | P2-04,P2-06       | Replace broad group/activity aggregation with paginated read models where applicable.                                                      | Query/pagination and state tests                  |
| P2-09 | TODO   | P2-07             | Implement person header, Balances by place, all currencies per context, group labels, neutral third-party rows, and cursor history.        | Person-ledger component + native tests            |
| P2-10 | TODO   | P2-07,P2-08       | Define stale/offline rendering and fresh-server confirmation boundaries; add pending/retry UI without optimistic financial lies.           | Offline/reconnect integration tests               |
| P2-11 | TODO   | P2-07,P2-08       | Shadow-compare old/new projections in development with sanitized diagnostics; investigate every unexplained drift.                         | Recorded parity report                            |
| P2-12 | TODO   | P2-09,P2-10,P2-11 | Phase review: all person-ledger scenarios pass, no currency is dropped/netted across codes, and payload/performance stays within baseline. | Contract, component, native, and profile evidence |

## P3 — Minimal expense journey

Read: UX blueprint “One expense flow,” financial invariants, and component architecture.

| ID    | Status | Depends on              | Work and acceptance criteria                                                                                                      | Verification                                 |
| ----- | ------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| P3-01 | TODO   | P2-12                   | Define canonical typed expense-composer state machine/reducer and route input contract.                                           | ADR/design review; reducer transition tests  |
| P3-02 | TODO   | P3-01                   | Implement currency-aware amount parser, positive validation, description rule, and server error mapping.                          | Parser/validation/error table tests          |
| P3-03 | TODO   | P3-01,P3-02             | Build default composer showing amount, description, context, and compact `Paid by · split` summary only.                          | Component tests and small/large phone review |
| P3-04 | TODO   | P3-03                   | Build optional searchable context step; known group/person entrances skip it and invalid context fails safely.                    | Route/deep-link tests                        |
| P3-05 | TODO   | P3-03                   | Build focused payer/participant/split sheet with Equal default and advanced Custom/Percentage/Shares. Changes apply with Done.    | All method/component/a11y tests              |
| P3-06 | TODO   | P3-03                   | Move date/category/notes/receipt under More options while preserving draft state.                                                 | Interaction and restoration tests            |
| P3-07 | TODO   | P3-02,P3-05,P3-06       | Integrate idempotent create RPC, busy/double-tap protection, actionable errors, and fresh authoritative cache updates.            | Service/integration/retry tests              |
| P3-08 | TODO   | P3-07                   | Harden receipt permission, type/size, staging, retry, attachment, cancellation, and cleanup behavior.                             | Receipt integration and denial/offline tests |
| P3-09 | TODO   | P3-07                   | Implement concise success result and only offer Undo when audited reversal supports it.                                           | Success/reversal tests                       |
| P3-10 | TODO   | P3-03,P3-04,P3-05       | Route Home, person, group, activity empty state, and centre action into the same composer with optional context.                  | Route matrix                                 |
| P3-11 | TODO   | P3-07                   | Migrate Edit expense to the same domain model while preserving edit permissions and recalculating affected balances.              | Edit adversarial/integration tests           |
| P3-12 | TODO   | P3-03,P3-05,P3-06       | Verify keyboard, screen reader, large text, reduced motion, dark/light, safe area, and validation announcements.                  | iOS/Android accessibility matrix             |
| P3-13 | TODO   | P3-07,P3-10,P3-11,P3-12 | Feature-flag rollout, compare errors/completion, and remove old composer only after parity and zero live imports.                 | Telemetry/profile/import evidence            |
| P3-14 | TODO   | P3-13                   | Phase review: typical known-context equal expense is minimal, all split methods remain correct, and retry cannot duplicate money. | Full expense contract/component/native suite |

## P4 — Minimal settlement journey

| ID    | Status | Depends on        | Work and acceptance criteria                                                                                 | Verification                                       |
| ----- | ------ | ----------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| P4-01 | TODO   | P1-14,P2-12       | Define one typed settlement route/selection contract from an authoritative open balance.                     | Design/reducer tests                               |
| P4-02 | TODO   | P4-01             | Fix Full/Half/Custom conversion so UI input is major units and domain/server values remain minor units.      | 0/2/3-decimal preset tests                         |
| P4-03 | TODO   | P4-01             | Route Home/person/group balance actions directly with person, context, and currency preselected.             | Route matrix                                       |
| P4-04 | TODO   | P4-02             | Build minimal composer naming parties, context, currency, amount, and “external payment” consequence.        | Component/copy/a11y tests                          |
| P4-05 | TODO   | P4-04             | Make payment method explicit or null; never silently record cash.                                            | Mutation payload tests                             |
| P4-06 | TODO   | P4-04             | Remove cross-currency total; model bulk settle as independent rows grouped by currency.                      | Multi-currency component and contract tests        |
| P4-07 | TODO   | P4-05,P4-06       | Implement fresh balance recheck, stale recovery, retry, idempotency, and partial-failure behavior.           | Race/offline/concurrency tests                     |
| P4-08 | TODO   | P4-03,P4-07       | Consolidate `settle/new`, `settle/[id]`, group adapter, and dashboard sheet around one domain flow.          | Import/route scan                                  |
| P4-09 | TODO   | P4-04,P4-08       | Verify back/predictive back, keyboard, screen reader, large text, reduced motion, and platform confirmation. | iOS/Android native matrix                          |
| P4-10 | TODO   | P4-07,P4-08,P4-09 | Phase review: no overpayment, wrong direction, unit leak, mixed-currency total, or duplicate path.           | Full settlement SQL/service/component/native suite |

## P5 — Navigation and screen simplification

| ID    | Status | Depends on              | Work and acceptance criteria                                                                                          | Verification                                   |
| ----- | ------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| P5-01 | TODO   | P3-14,P4-10             | Make the centre action open Add expense directly and remove the generic five-action sheet.                            | Dock/navigation tests                          |
| P5-02 | TODO   | P5-01                   | Keep Home, Circles, Activity, More as top-level destinations; document exact responsibility of each.                  | Route inventory review                         |
| P5-03 | TODO   | P5-02                   | Move Add person/Create group to the appropriate Circles segment with honest empty/header actions.                     | Circles interaction tests                      |
| P5-04 | TODO   | P2-12,P5-02             | Redesign Home around per-currency balances, likely next actions, recent activity, and one primary Add expense action. | Data-state/component/native tests              |
| P5-05 | TODO   | P2-12,P5-02             | Align Group detail with authoritative balances/activity and contextual Add expense/Settle actions.                    | Group journey tests                            |
| P5-06 | TODO   | P2-12,P5-02             | Align Activity with paginated context-labelled signed ledger events.                                                  | Pagination/filter tests                        |
| P5-07 | TODO   | P0-09,P5-02             | Reduce More to real secondary features and capability-gate every deferred feature.                                    | Route/control audit                            |
| P5-08 | TODO   | P5-03,P5-04,P5-05,P5-06 | Remove duplicated actions and consolidate compatibility routes with safe redirects.                                   | Route/import/deep-link matrix                  |
| P5-09 | TODO   | P5-08                   | Verify auth/onboarding/invite/deep-link resume and draft preservation across supporting creation flows.               | Native journey matrix                          |
| P5-10 | TODO   | P5-02                   | Implement defined wide-layout navigation adaptation using live window dimensions.                                     | Phone/tablet portrait/landscape/split-screen   |
| P5-11 | TODO   | P5-08,P5-09,P5-10       | Phase review and moderated usability evidence for: what do I owe, why, and fastest safe action.                       | Usability notes + full navigation/native suite |

## P6 — Coral UI, accessibility, adaptivity, motion, and performance

This phase runs component-by-component alongside P3–P5, but its exit task occurs after
those journeys stabilize.

| ID    | Status | Depends on                          | Work and acceptance criteria                                                                                                               | Verification                                   |
| ----- | ------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| P6-01 | TODO   | P0-12                               | Write token-governance ADR: preserve `design-tokens.json`, generate/verify Coral theme/CSS/docs, and mark Warm Ledger guidance historical. | Token drift test                               |
| P6-02 | TODO   | P6-01                               | Audit `components/coral` and `components/ui`; map duplicates, live imports, migration order, and deletion criteria.                        | Import inventory                               |
| P6-03 | TODO   | P6-01                               | Harden CoralButton/IconButton for targets, disabled/busy state, labels, press feedback, and loading announcements.                         | Component/a11y/native tests                    |
| P6-04 | TODO   | P6-01                               | Harden CoralField/Select/Search for programmatic labels, hints, errors, required state, keyboard, and large text.                          | Component/a11y/native tests                    |
| P6-05 | TODO   | P6-01                               | Harden CoralSheet/dialog for live dimensions, modal semantics, initial/restored focus, escape/back, keyboard, and reduced motion.          | Rotation/tablet/VoiceOver/TalkBack tests       |
| P6-06 | TODO   | P6-01                               | Harden Screen/TopBar/Row/Empty/Error/Snackbar for safe areas, wrapping, announcements, non-color semantics, and platform targets.          | Component and state matrix                     |
| P6-07 | TODO   | P6-03,P6-04,P6-05,P6-06             | Create central motion tokens/hook honoring OS and optional app override; use transform/opacity and calm 80–250 ms transitions.             | Reduced-motion and performance tests           |
| P6-08 | TODO   | P6-03,P6-04,P6-05,P6-06             | Remove arbitrary font-size caps and repair layouts for the largest supported dynamic type.                                                 | Large-text screenshot/native audit             |
| P6-09 | TODO   | P6-05,P6-06                         | Replace module-level dimensions and phone-only constraints with `useWindowDimensions` and readable tablet widths.                          | Resize/rotation/split-screen tests             |
| P6-10 | TODO   | P6-02,P6-03,P6-04,P6-05,P6-06       | Migrate live legacy primitives one by one; update `ui-registry.md`; remove deprecated exports only after zero imports.                     | Import scan + visual/a11y tests                |
| P6-11 | TODO   | P6-01                               | Replace shared hard-coded colors with semantic tokens while preserving documented external brand/platform exceptions.                      | Token/literal scan and visual review           |
| P6-12 | TODO   | P3-14,P4-10,P5-11                   | Profile release builds for launch, frames, renders, memory, query payload, and bundle; set numeric budgets from evidence.                  | Profile report with device/build/dataset       |
| P6-13 | TODO   | P6-12                               | Optimize only measured bottlenecks: pagination/virtualization, heavy lazy paths, render derivation, animations, or bundle composition.     | Before/after profile; no functional regression |
| P6-14 | TODO   | P6-07,P6-08,P6-09,P6-10,P6-11,P6-13 | Phase review: native score ≥17/20, no dimension below 3, no duplicate primitive family, full accessibility/adaptivity matrix passes.       | Independent UI review and native matrix        |

## P7 — Deferred capabilities

Each task begins with a separate product/backend/privacy specification. A task may be
`SKIPPED` if demand does not justify it. Do not reactivate placeholder UI early.

| ID    | Status | Depends on                          | Work and acceptance criteria                                                                                                            | Verification                        |
| ----- | ------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| P7-01 | TODO   | P6-14                               | Prioritize deferred capabilities using user evidence, legal/security needs, and implementation cost; record chosen order.               | Decision log/user approval          |
| P7-02 | TODO   | P7-01                               | Implement real notification preferences and push/in-app behavior with device permission and server state.                               | Permission/delivery/deep-link tests |
| P7-03 | TODO   | P7-01                               | Implement account export job, scoped formats/date ranges, authenticated delivery, expiry, errors, and audit.                            | Security/job/download tests         |
| P7-04 | TODO   | P7-01                               | Implement account deletion/retention with re-auth, balance/legal constraints, confirmation, cancellation policy, and audit.             | Security/data lifecycle tests       |
| P7-05 | TODO   | P7-01                               | Implement recurring expense schedule/generation/review with real values, idempotency, timezone behavior, and next-occurrence semantics. | Scheduler/RPC/native tests          |
| P7-06 | TODO   | P7-01                               | Threat-model and implement biometric re-entry without retaining raw passwords; show only real session information.                      | Platform security review/tests      |
| P7-07 | TODO   | P7-01                               | Rebuild analytics on explicit currency/scope semantics; never aggregate currencies without a declared conversion model.                 | Query/math/chart/a11y tests         |
| P7-08 | TODO   | P7-02,P7-03,P7-04,P7-05,P7-06,P7-07 | Phase review for capabilities selected in P7-01; skipped items have explicit decisions and no reachable placeholders.                   | Capability/control/release review   |

## P8 — Release hardening and program closure

| ID    | Status | Depends on              | Work and acceptance criteria                                                                                                                                  | Verification                                 |
| ----- | ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| P8-01 | TODO   | P6-14,P7-08             | Reconcile AGENTS, PRODUCT, DESIGN, build, library, route, token, and generated API documentation with actual code.                                            | Documentation link/version review            |
| P8-02 | TODO   | P6-14                   | Remove empty scaffolds, `.orig`/`.rej` artifacts, stale components, compatibility code, and template package naming only after ownership/reachability checks. | Clean checkout, import scan, git diff review |
| P8-03 | TODO   | P6-14                   | Run full clean-install CI, clean DB migration, upgrade migration, and all test layers on release candidates.                                                  | Archived CI/native evidence                  |
| P8-04 | TODO   | P6-14                   | Complete privacy/security threat model and independent ledger review; resolve every P0/P1 issue.                                                              | Signed review record                         |
| P8-05 | TODO   | P6-14                   | Complete native exploratory matrix across accounts, data sizes, currencies, offline states, platforms, tablets, accessibility, and interruption.              | Test report with zero release blockers       |
| P8-06 | TODO   | P8-03,P8-04,P8-05       | Define rollout/rollback thresholds for crashes, RPC errors, idempotency conflicts, balance drift, stale rejects, and task completion.                         | Approved release runbook                     |
| P8-07 | TODO   | P8-06                   | Internal/dogfood rollout using hardened contracts and feature flags; investigate every unexplained ledger drift.                                              | Observation report                           |
| P8-08 | TODO   | P8-07                   | Staged platform beta/production rollout. Deployment and production migrations require explicit user approval.                                                 | Store/release and monitoring evidence        |
| P8-09 | TODO   | P8-08                   | Remove temporary flags/old paths only after observation proves parity and rollback window closes.                                                             | Import/route/config scan                     |
| P8-10 | TODO   | P8-01,P8-02,P8-04,P8-09 | Program review: all selected tasks done/skipped by decision, no blocker logs open, docs current, and tracker archived as completed.                           | Final independent review                     |

## Discovery backlog

New findings go here before becoming implementation tasks.

| ID       | Date       | Severity | Found during | Finding                                                                                                                                                                                                         | Proposed phase | Status |
| -------- | ---------- | -------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------ |
| DISC-001 | 2026-07-27 | P2       | Audit        | Existing `docs/progress-tracker.md` reports stale versions and completed gates that currently fail; replace or clearly archive it during P8-01.                                                                 | P8             | OPEN   |
| DISC-002 | 2026-07-27 | P1       | P0-12        | Compatibility deep links for `/profile/export`, `/profile/notifications`, and `/recurring/:id/review` still render fake/no-op controls despite their capabilities being disabled.                               | P0             | OPEN   |
| DISC-003 | 2026-07-27 | P2       | P0-12        | `npm audit --audit-level=high` reports 28 high-or-critical dependency findings, including a critical transitive `tar` issue; remediation requires dependency review and may require a breaking EAS CLI upgrade. | P8             | OPEN   |

Rules:

- IDs are sequential and never reused.
- P0/P1 discoveries can preempt the next task after evidence is recorded.
- A discovery becomes a phase task only when scope, dependency, acceptance, and
  verification are defined.

## Blocker log

| Task  | Date       | Blocker                                                                                                                              | Checks attempted                                                                                                            | Required authority/state                                                                                                                                        | Status |
| ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P0-11 | 2026-07-27 | No runnable native target is available in the current environment. Xcode is not installed/selected and Android `adb` is unavailable. | `xcodebuild -version`; `xcrun simctl list devices available`; `adb devices`; `command -v emulator`; `command -v avdmanager` | Xcode with an iOS simulator or connected device, plus Android SDK/ADB with an emulator or connected device; then rerun the full route/accessibility walkthrough | OPEN   |
| P0-12 | 2026-07-27 | Phase exit cannot be proven: P0-11 is blocked, and the local database gate cannot connect because the Docker daemon is not running.  | `npm run test:db`; `docker info`; P0-11 native-target checks                                                                | Native walkthrough evidence, running Docker/Supabase for pgTAP, and remediation or explicit ownership for DISC-002 before phase exit                            | OPEN   |

Do not mark a task `BLOCKED` merely because it is difficult. Exhaust safe in-scope checks
and alternatives, then record the exact missing authority, input, or external state.

## Decision log

Blueprint decisions are already recorded in [README](./README.md). Add only new or changed
decisions here.

| ID      | Date       | Decision                                                                                                                                                           | Reason                                                                                                                                        | Affected tasks | Approved by                          |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------ |
| DEC-001 | 2026-07-27 | Use this file—not the legacy progress tracker—as the implementation status source of truth.                                                                        | The legacy tracker describes feature presence, not verified remediation status, and contains stale platform/gate claims.                      | All            | User request to create an AI tracker |
| DEC-002 | 2026-07-27 | Begin the P0-12 review while P0-11 remains blocked, without marking Phase 0 complete until native evidence exists.                                                 | User explicitly requested P0-12; the review can classify remaining gates, but the P0-11 dependency and native exit evidence remain mandatory. | P0-11,P0-12    | User request                         |
| DEC-003 | 2026-07-27 | Bypass the P0-12 dependency gate to begin P1-01, while retaining all P0 blockers and prohibiting production migration execution.                                   | User explicitly directed work to start with P1 despite the incomplete P0 exit review.                                                         | P0,P1-01       | User request                         |
| DEC-004 | 2026-07-27 | Accept the P1 ledger-hardening ADR bundle in `docs/superpowers/specs/2026-07-27-p1-ledger-hardening-design.md` as the design baseline for implementation planning. | Establish one money transport, authorization, split authority, and reversal/audit contract before SQL changes.                                | P1-01..P1-14   | User approval                        |

## Evidence log

Append one row per completed or reviewed task. Link local reports/files with repository
paths; never paste secrets or production personal data.

| Task       | Date       | Commit/branch or working-tree note      | Files/result                                                                                                                                                                                                                                                                                                            | Verification                                                                                                                                                                                                                                                                                                                                                                                   | Reviewer          |
| ---------- | ---------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| TRACKER-01 | 2026-07-27 | Working tree; documentation only        | Created execution tracker from audited blueprint                                                                                                                                                                                                                                                                        | Prettier, dependency-ID validation, link check                                                                                                                                                                                                                                                                                                                                                 | Codex             |
| P0-01      | 2026-07-27 | Clean `main` at `45ca26a`               | `git status --short` returned no changes; no pre-existing or overlapping files to classify; no cleanup performed                                                                                                                                                                                                        | `git status --short`; `git branch --show-current`; `git log -1 --oneline`                                                                                                                                                                                                                                                                                                                      | Codex             |
| P0-02      | 2026-07-27 | Working tree; tooling boundary          | App and E2E configs pass; Deno function passes after removing an over-specific SDK callback annotation. `typecheck:tests` reports 25 existing fixture/type errors reserved for P0-07.                                                                                                                                   | `npm run typecheck`; `npm run typecheck:e2e`; `npm run typecheck:supabase`; Prettier touched files                                                                                                                                                                                                                                                                                             | Codex             |
| P0-03      | 2026-07-27 | Working tree; tool-scope boundary       | Added generated-report and Deno/skill ownership ignores. Lint now reports 11 owned app errors (no generated assets); Prettier reports 133 owned files (no reports/skills).                                                                                                                                              | `npm run lint -- --quiet`; `npx prettier --check . --log-level warn`; `git check-ignore -v playwright-report test-results coverage .expo`                                                                                                                                                                                                                                                      | Codex             |
| P0-04      | 2026-07-27 | Working tree; lint fixes                | Fixed the 11 scoped lint errors: deferred auth/invite initialization, removed conflicting manual memoization, escaped JSX entities, and preserved Deno ownership.                                                                                                                                                       | `npm run lint -- --quiet`; `npx eslint src e2e playwright.config.ts --quiet`; `npm run typecheck`; `git diff --check`                                                                                                                                                                                                                                                                          | Codex             |
| P0-05      | 2026-07-27 | Working tree; Jest harness fixes        | Added missing Coral/icon mocks and a stable Expo Router segment mock; no assertions skipped.                                                                                                                                                                                                                            | `npm run test -- --runInBand src/components/coral/CircleDock.test.tsx src/features/circles/screens/CirclesScreen.test.tsx` (2 suites, 27 tests passed)                                                                                                                                                                                                                                         | Codex             |
| P0-06      | 2026-07-27 | Working tree; Jest/worklets harness     | Added a shared Jest setup using the React Native Worklets package mock, refreshed MoneyMap fixtures to the circles-first screen contract, and added accessible settled-circle controls.                                                                                                                                 | `npm run test -- --runInBand src/features/dashboard/screens-v2/MoneyMapScreen.test.tsx` (1 suite, 14 tests passed)                                                                                                                                                                                                                                                                             | Codex             |
| P0-07      | 2026-07-27 | Working tree; Jest baseline             | Repaired the stale invite-redemption assertion to await deferred resolution. Full unit/component baseline is green.                                                                                                                                                                                                     | `npm run test -- --runInBand` (38 suites, 517 tests passed)                                                                                                                                                                                                                                                                                                                                    | Codex             |
| P0-08      | 2026-07-27 | Working tree; formatting pass           | Formatted owned source, docs, and config while preserving ignored generated/Deno scopes; resolved the new Jest setup lint declaration.                                                                                                                                                                                  | `npm run format:check`; `git diff --check`; `npm run typecheck`; `npm run lint -- --quiet`; `npm run test -- --runInBand` (38 suites, 517 tests passed)                                                                                                                                                                                                                                        | Codex             |
| P0-09      | 2026-07-27 | Working tree; capability gating         | Added the typed capability registry and removed unsupported biometric/session, deletion, export, scheduled-review, reduce-motion, notification-preference, and help/support controls from reachable UI. Updated the affected group-flow assertion.                                                                      | `npm run typecheck`; `npm run lint -- --quiet`; `npm run format:check`; `npm run test -- --runInBand` (38 suites, 517 tests passed)                                                                                                                                                                                                                                                            | Codex             |
| P0-10      | 2026-07-27 | Working tree; CI quality jobs           | Replaced destructive Expo tsconfig customization with `npm ci`; split quality, unit, and local Supabase database jobs; added E2E and Deno boundary typechecks plus `test:db`.                                                                                                                                           | Ruby YAML parse; `npm run typecheck`; `npm run lint -- --quiet`; `npm run format:check`; `git diff --check`                                                                                                                                                                                                                                                                                    | Codex             |
| P0-11      | 2026-07-27 | `41e0b49`; blocked in local environment | Native walkthrough could not start: `xcodebuild -version` reports only Command Line Tools, `xcrun simctl list devices available` cannot run without Xcode, and `adb devices` is unavailable. Non-native baseline remains green.                                                                                         | `npm run typecheck`; `npx eslint src e2e playwright.config.ts --quiet`; `npm run format:check`; `npm run test -- --runInBand` (38 suites, 517 tests passed)                                                                                                                                                                                                                                    | Codex             |
| P0-12      | 2026-07-27 | Working tree; phase review blocked      | App/E2E/Supabase typechecks, scoped lint, Jest (38 suites/517 tests), CI YAML parsing, and Playwright discovery pass. `npm run test:db` fails without a running Docker daemon; native evidence is unavailable; direct fake-control routes were found; `npm audit --audit-level=high` reports 28 high/critical findings. | `npm ci`; `npm run typecheck`; `npm run typecheck:e2e`; `npm run typecheck:supabase`; `npx eslint src e2e playwright.config.ts --quiet`; `npm run format:check` (passes after formatting this tracker); `npm run test -- --runInBand`; `npm run test:db`; `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml")'`; `npx playwright test --list`; `npm audit --audit-level=high` | Codex self-review |
| P1-01      | 2026-07-27 | `ab261f7`; accepted ADR bundle          | Defined money/currency transport, expense authorization, split authority, settlement/reversal audit semantics, the exact product bound, migration constraints, and verification requirements in `docs/superpowers/specs/2026-07-27-p1-ledger-hardening-design.md`.                                                      | `npm run format:check`; `git diff --check`; placeholder/consistency self-review; user approval                                                                                                                                                                                                                                                                                                 | User              |

## Session log

Append at session start and update the same row at session end. Keep entries short.

| Date/time  | Agent | Active task | Start state and intended scope                                                                                                                                            | End state, evidence, and next task                                                                                                                                                                     |
| ---------- | ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-27 | Codex | TRACKER-01  | Convert approved blueprint into an AI-operable tracker; no product code changes.                                                                                          | Tracker created; next task remains P0-01 pending implementation approval.                                                                                                                              |
| 2026-07-27 | Codex | P0-01       | Capture the worktree baseline and classify existing changes without editing product code.                                                                                 | Complete: clean `main` at `45ca26a`; next task is P0-02.                                                                                                                                               |
| 2026-07-27 | Codex | P0-02       | Separate app, Jest, Playwright, and Deno ownership; keep Node/Deno tooling outside the app compiler.                                                                      | Complete: app/E2E/Deno pass; test fixture debt is explicit for P0-07; next task is P0-03.                                                                                                              |
| 2026-07-27 | Codex | P0-03       | Isolate generated Playwright/Expo artifacts, installed skills, and Deno functions from the wrong lint/format ownership.                                                   | Complete: generated outputs no longer pollute gates; next task is P0-04.                                                                                                                               |
| 2026-07-27 | Codex | P0-04       | Fix all current scoped ESLint errors without disabling rules globally.                                                                                                    | Complete: 11 source errors fixed; next task is P0-05.                                                                                                                                                  |
| 2026-07-27 | Codex | P0-05       | Reproduce and repair only Circles/CircleDock test harness failures; no skipped assertions.                                                                                | Complete: 2 suites and 27 tests pass; next task is P0-06.                                                                                                                                              |
| 2026-07-27 | Codex | P0-06       | Reproduce and repair only MoneyMap/worklets initialization; centralize the fix and preserve test coverage.                                                                | Complete: shared Worklets Jest mock and current MoneyMap fixtures; 14 tests pass. Next task is P0-07.                                                                                                  |
| 2026-07-27 | Codex | P0-07       | Run the full Jest baseline and classify remaining failures without broad speculative fixes.                                                                               | Complete: 38 suites and 517 tests pass. Next task is P0-08.                                                                                                                                            |
| 2026-07-27 | Codex | P0-08       | Run the owned formatting gate and review formatting scope without touching migrations or user work blindly.                                                               | Complete: formatting drift resolved; format, typecheck, lint, diff, and full Jest gates pass. Next task is P0-09.                                                                                      |
| 2026-07-27 | Codex | P0-09       | Inventory and gate reachable controls whose underlying capability is missing or inert.                                                                                    | Complete: unsupported controls are hidden; gates and full Jest pass. Next task is P0-10.                                                                                                               |
| 2026-07-27 | Codex | P0-10       | Validate CI workflow coverage and make the quality gates reproducible in automation.                                                                                      | Complete: CI now has quality, unit, and local Supabase database jobs; YAML and equivalent local quality gates pass. Docker database execution remains an environment verification. Next task is P0-11. |
| 2026-07-27 | Codex | P0-11       | Capture native iOS/Android route walkthrough evidence and classify product/accessibility defects.                                                                         | Blocked: no Xcode/iOS simulator or Android SDK/ADB target is available. Non-native gates pass; next task remains P0-11 pending native access.                                                          |
| 2026-07-27 | Codex | P0-12       | Review Phase 0 gates and reachable controls at the user's direction while P0-11 remains blocked.                                                                          | Blocked: native evidence and local pgTAP are unavailable, and DISC-002 identifies reachable fake-control routes. Phase 0 cannot exit; next task remains P0-12 after blockers are resolved.             |
| 2026-07-27 | Codex | P1-01       | Bypass the P0 exit dependency at the user's direction; define money transport, authorization, split authority, and reversal/audit semantics before financial SQL changes. | Complete: accepted ADR bundle and evidence recorded without changing financial SQL; next task is P1-02.                                                                                                |
| 2026-07-27 | Codex | P1-02       | Add the failing database authorization contract from `docs/superpowers/plans/2026-07-27-p1-02-expense-authorization-tests.md`; do not modify financial SQL.               | In progress; implement fixture and adversarial pgTAP cases, then review the red baseline.                                                                                                              |

## Handoff template

Every AI final response after implementation work should contain:

```text
Completed: <task IDs and outcome>
Changed: <important files/migrations>
Verified: <commands and results>
Known failures: <pre-existing vs introduced>
Decisions/discoveries: <DEC/DISC IDs>
Tracker: <active_task, next_task, phase status>
Approval needed: <production/destructive/external action, or none>
```

Before ending, the AI must ensure the front matter, task table, Evidence log, Session log,
and final response agree.
