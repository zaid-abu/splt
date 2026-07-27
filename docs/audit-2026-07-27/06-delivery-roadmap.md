# Delivery Roadmap

Execution status, dependencies, evidence, and AI handoffs live in the
[AI execution tracker](./09-execution-tracker.md). This document remains the strategic
roadmap and should not be edited as a second status source.

## Sequencing rule

Do not start with broad visual polish. Fix release signal and prevent invalid writes, then
build the simplified journeys on authoritative contracts. Each phase is independently
releasable and has an exit gate.

Effort is expressed as **S/M/L/XL** until the team measures its delivery rate. Calendar
estimates made before database/device discovery would be false precision.

## Phase 0 — Stabilize and contain

**Outcome:** trustworthy gates and no reachable fake financial/security controls.  
**Size:** M

Tasks:

- preserve and review the existing dirty work before touching overlapping files;
- split app/Jest/Playwright/edge-function TypeScript configuration;
- ignore generated Playwright reports and test results;
- fix the 11 scoped lint errors and restore meaningful lint output;
- repair Circles, CircleDock, and MoneyMap/worklets test harnesses;
- run formatting as an intentional isolated change;
- add CI jobs for typecheck, lint, format, unit, and database tests;
- hide or disable with honest copy: scheduled review, export, biometric/session data,
  notification settings, reduce motion preference, delete account, and inert help actions;
- add a feature-capability registry so navigation cannot expose unavailable flows;
- record baseline native walkthrough videos/screenshots and defects on iOS and Android.

Exit gate:

- all required CI checks green from a clean checkout;
- no reachable control silently does nothing or lies about completion;
- every hidden feature has an issue/spec owner;
- production behavior is unchanged for valid expense/settlement paths.

## Phase 1 — Lock the ledger

**Outcome:** unauthorized or inconsistent expense/settlement writes are impossible.  
**Size:** XL

Tasks:

- add adversarial pgTAP tests from the financial plan;
- create the currency registry and drift tests;
- enforce positive expense/settlement amounts;
- implement context, payer, participant, uniqueness, and split-total validation;
- derive percentage/share allocations server-side;
- harden idempotency payload/ownership behavior;
- remove or privatize legacy direct mutation methods;
- audit update/delete/reversal authorization;
- run historical data dry-run queries and produce a remediation report;
- add generated database type drift to CI;
- independent SQL/security review.

Exit gate:

- all server invariants pass under concurrency/adversarial tests;
- clean and upgraded database migrations both pass;
- no client path can bypass canonical RPCs;
- data audit is approved before any corrective production migration;
- balance comparison shows no unexplained drift.

## Phase 2 — Authoritative read models

**Outcome:** screens consume correct, paginated balance and ledger projections.  
**Size:** L

Tasks:

- version `fetch_open_balances`;
- implement paginated person and group ledgers;
- return bilateral effects and context labels;
- introduce typed mappers and query keys;
- replace `usePersonSnapshot` client aggregation;
- replace broad group/activity aggregation where applicable;
- implement per-currency grouping;
- add cache invalidation and stale/offline policies;
- shadow-compare old/new projections in development.

Exit gate:

- requested friend/group behavior passes all acceptance scenarios;
- no `* 100` fallback remains in ledger projections;
- no multi-currency row is dropped or netted incorrectly;
- payload/query/performance baselines improve or remain within budget.

## Phase 3 — Minimal expense journey

**Outcome:** one composer, contextually prefilled, with equal split as the fast path.  
**Size:** XL

Tasks:

- create composer reducer/use case and pure validation selectors;
- route all Add expense entrances to it;
- implement optional context selection;
- collapse split and metadata options;
- create focused payer/participant/split sheets;
- retain entered state during supporting flows;
- add idempotent submit, server error mapping, receipt failure/cleanup behavior;
- simplify success/undo;
- migrate edit expense onto the same model;
- remove the old monolithic implementation after parity.

Exit gate:

- typical known-context equal expense can be entered without opening advanced options;
- all calculation/property/contract/device tests pass;
- duplicate taps and retry do not duplicate transactions;
- accessibility and keyboard matrix passes;
- old composer has zero live imports.

## Phase 4 — Minimal settlement journey

**Outcome:** settlement begins from a real balance and cannot misstate units/currencies.  
**Size:** L

Tasks:

- route person/group/home balances directly with context and currency;
- fix Full/Half/Custom conversion;
- remove cross-currency total;
- support multi-row confirmation as independent operations;
- make payment method intentional;
- define partial failure and stale balance recovery;
- consolidate selector and compose screens;
- use audited reversal/delete policy.

Exit gate:

- no settlement can exceed or reverse the fresh balance incorrectly;
- multi-currency confirmation never shows a combined amount;
- every entry point reaches the same domain flow;
- native back, retry, and screen-reader tests pass.

## Phase 5 — Navigation and screen simplification

**Outcome:** clear Home/Circles/Activity/More model with one primary creation action.  
**Size:** L

Tasks:

- centre Add expense action;
- move Add person/Create group to Circles;
- remove Settle/Schedule from generic action sheet;
- consolidate compatibility routes;
- redesign Home around actionable balances;
- align group detail and activity with authoritative ledgers;
- remove duplicated calls to action;
- validate deep links and auth/onboarding restoration;
- implement wide-layout navigation adaptation.

Exit gate:

- moderated usability run validates the three product questions;
- every action has one canonical flow;
- no dead-end/duplicate route remains;
- phone/tablet and platform navigation checks pass.

## Phase 6 — UI system, accessibility, and motion

**Outcome:** one token-driven accessible component system.  
**Size:** XL, delivered incrementally alongside Phases 3–5

Tasks:

- make design tokens canonical and archive conflicting guidance;
- harden Button, Field, Sheet, Row, TopBar, Screen, Empty/Error states;
- migrate legacy UI primitives and delete after reachability zero;
- implement central reduced-motion policy;
- remove arbitrary font-size caps;
- fix labels, states, focus, announcements, contrast, and non-color money cues;
- adopt live window dimensions and tablet constraints;
- update `ui-registry.md`;
- add visual regression coverage for core states.

Exit gate:

- native score is at least 17/20 with no dimension below 3;
- screen-reader, large-text, reduced-motion, keyboard, dark/light, and contrast checks pass;
- no duplicate primitive family remains.

## Phase 7 — Deferred capabilities

**Outcome:** secondary features return only with complete contracts.  
**Size:** separate projects

Order by validated demand:

1. real notification preferences and push behavior;
2. account export;
3. account deletion and retention;
4. recurring expense scheduling/review;
5. biometric re-entry/security sessions;
6. richer analytics.

Each requires its own product spec, backend state, error/retry behavior, security/privacy
review, tests, and observability. Do not reactivate placeholder UI.

## Cross-phase workstreams

### Documentation

- update progress tracker at every gate;
- write ADRs before semantic migrations;
- maintain route/action inventory;
- update design/token and build documents with code changes;
- record release and rollback runbooks.

### Research

- 5–8 representative users for concept/usability checks;
- observe add-equal, add-custom, find-person-history, and settle tasks;
- record confusion and completion, not just preference;
- validate copy in supported locales before localization expansion.

### Security

- threat model ledger RPCs, receipts, deep links, invites, stored credentials, export, and
  deletion;
- independent review before production ledger migration.

## Rollout and rollback

- feature-flag person ledger, expense composer, and settlement flow independently;
- release to internal builds, then a small staged cohort;
- compare mutation error rate, balance drift diagnostics, crash-free sessions, and task
  completion;
- retain the previous UI temporarily only when both use the same hardened server contract;
- rollback the UI flag on regression;
- use forward-fix migrations for production data; never destructive reset;
- define who can stop rollout and the numeric/qualitative triggers.

## Definition of done for every task

- acceptance criteria and unhappy paths implemented;
- relevant unit, integration, contract, and native tests pass;
- accessibility and reduced-motion behavior verified;
- loading/empty/error/offline states handled;
- analytics/observability reviewed for privacy;
- docs and generated types updated;
- no new lint/type/format debt;
- migration and rollback considered;
- review confirms planned behavior and no stale predecessor remains.

## Recommended first implementation package

Start only after approval:

1. gate cleanup and generated-artifact ignores;
2. hide the mock scheduled review and false export/security/settings controls;
3. add failing adversarial expense RPC tests;
4. write the money/currency and authorization ADRs;
5. implement the minimum ledger hardening needed to make those tests pass.

This package gives immediate trust and safety improvements without prematurely redesigning
screens on unstable financial contracts.
