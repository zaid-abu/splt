# Splt Product and Engineering Improvement Blueprint

**Audit date:** 2026-07-27  
**Status:** Blueprint ready for implementation approval  
**Scope:** Product model, financial correctness, security, UX, accessibility, motion,
performance, architecture, testing, release safety, and documentation

## Executive decision

Splt should not be discarded and rebuilt as a disconnected greenfield app. Its domain
model, Supabase schema, minor-unit calculation utilities, query layer, design tokens, and
test foundation are valuable. The recommended approach is a **controlled rewrite behind
the existing routes**:

1. lock down the ledger and make the server authoritative;
2. replace derived client-side ledgers with paginated read models;
3. simplify expense and settlement journeys;
4. consolidate the component system around the existing Coral Ledger tokens;
5. remove or hide every control that does not perform its advertised action;
6. migrate one vertical slice at a time with contract, integration, and device tests.

This limits data risk, keeps releases possible, and avoids reproducing current defects in
a new shell.

## Product principles

- **One flow, contextual entrances.** Add expense may be opened from Home, a person, or a
  group, but all entrances use the same composer and contract.
- **Balances lead to settlement.** Settle is shown where an actual non-zero balance is
  visible; it is not a generic creation action.
- **The server owns money.** The database validates authorization, currency scale,
  participants, totals, and idempotency in a transaction. The client previews the same
  rules but cannot weaken them.
- **A person ledger is a projection.** Group expenses are not copied into a friend record.
  A relationship view derives the bilateral effect and context from canonical expenses
  and settlements.
- **Never combine currencies.** Totals, balances, and settlement confirmations remain
  separated by currency.
- **No false affordances.** Unimplemented switches, buttons, export promises, and
  financial review screens are removed from navigation until their contracts exist.
- **Calm, direct interaction.** Essential fields are visible; advanced splitting and
  metadata are disclosed when needed. Motion explains change and respects reduced motion.
- **Keep the visual identity.** Coral Ledger tokens, typography, radii, and semantic money
  colors remain the visual source of truth.

## Canonical language

| Term             | Meaning                                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| Person           | Another user with whom the current user has a relationship                      |
| Group            | A shared expense context with two or more members                               |
| Context          | Exactly one direct friendship or one group                                      |
| Expense          | A canonical transaction with payer, participants, splits, currency, and context |
| Person ledger    | A read-only projection of expenses and settlements relevant to two users        |
| Bilateral effect | The signed change an event makes between the current user and one person        |
| Settlement       | A record of an external payment; Splt does not itself transfer money            |
| Open balance     | Authoritative outstanding amount for one person, context, and currency          |

## Decisions that are settled

1. Preserve `design-tokens.json` and the Coral Ledger direction.
2. Make the centre action open Add expense directly.
3. Keep four top-level destinations: Home, Circles, Activity, More.
4. Put Create group and Add person inside Circles.
5. Put Settle next to real balances and preselect its context.
6. Keep direct and group transactions canonical; build a server person-ledger projection.
7. Never net or display one total across currencies.
8. Use integer minor units throughout the ledger domain.
9. Replace the current app incrementally, not with a hard reset.
10. Do not introduce HeroUI Native during the rewrite until an ADR proves that its value
    exceeds the cost of a third component system. The current package does not contain
    `heroui-native`; the Coral primitives can be made accessible without changing tokens.

## Documents

1. [Current-state audit](./01-current-state-audit.md) — evidence, severity, quality gates,
   strengths, and native UX score.
2. [Product and UX blueprint](./02-product-ux-blueprint.md) — target information
   architecture, core journeys, interaction rules, accessibility, and motion.
3. [Person ledger specification](./03-person-ledger-spec.md) — the requested
   Splitwise-style group-in-friend-detail behavior and its data contract.
4. [Financial integrity plan](./04-financial-integrity-plan.md) — invariants, RPC security,
   currencies, calculations, transactions, and adversarial tests.
5. [Technical architecture](./05-technical-architecture.md) — controlled rewrite,
   boundaries, data flow, UI consolidation, and code-quality decisions.
6. [Delivery roadmap](./06-delivery-roadmap.md) — phases, dependencies, acceptance gates,
   rollback, and definition of done.
7. [Test and release strategy](./07-test-and-release-strategy.md) — test pyramid, CI,
   device matrix, accessibility, performance, observability, and release gates.
8. [Screen and control inventory](./08-screen-and-control-inventory.md) — keep/rewrite/
   hide decisions for routes, surfaces, and known non-functional controls.
9. [AI execution tracker](./09-execution-tracker.md) — atomic task IDs, dependencies,
   statuses, verification, evidence, blockers, decisions, and handoff protocol.

## Baseline summary

- 54 Expo Router files, 360 TypeScript/TSX source files, and roughly 50,500 source lines.
- 38 Jest suites: 35 passed and 3 failed; 476 of 501 tests passed.
- Typecheck fails because Playwright files require Node types that are not configured.
- Targeted source lint has 11 errors. The default lint command also scans generated
  Playwright reports and expands to thousands of irrelevant findings.
- Formatting fails in 128 files.
- Browser E2E currently lists 12 public-auth checks; authenticated checks are disabled
  without credentials and it does not replace native iOS/Android testing.
- Native adaptive score: **8/20 (poor)**. The app has strong safe-area and touch-target
  foundations, but weak adaptivity, partial accessibility, inconsistent motion policy,
  and duplicated UI/data paths.

## Skill guidance applied

The blueprint applies the five requested installed skills:

- `frontend-design`: deliberate product hierarchy, consistent vocabulary, and protection
  of the existing visual direction.
- `web-design-guidelines`: transferable interaction, form, focus, and accessibility rules;
  web-only requirements are not treated as native requirements.
- `vercel-react-native-skills`: measure before optimizing, virtualize long content, prefer
  transform/opacity motion, and avoid speculative memoization.
- `react-native-best-practices`: native navigation, safe areas, reduced motion, profiling,
  platform behavior, and release-build verification.
- `react-native-design`: platform touch targets, accessibility semantics, keyboard and
  sheet behavior, dynamic type, and adaptive layouts.

## Approval boundary

This blueprint does not authorize production migrations or a destructive rewrite. The
first implementation package should be Phase 0 from the roadmap: repair quality gates,
hide false financial UI, and add failing adversarial database tests before changing
ledger functions.

Implementation status is tracked only in the
[AI execution tracker](./09-execution-tracker.md). The older
`docs/progress-tracker.md` describes historical feature presence and must not be used to
infer that a current audit finding or release gate is complete.
