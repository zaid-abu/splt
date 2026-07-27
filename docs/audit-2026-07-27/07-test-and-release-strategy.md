# Test and Release Strategy

## Principle

Financial correctness needs proof at the layer that owns the rule. A screenshot cannot
prove authorization, a service mock cannot prove SQL, and a browser run cannot prove
iOS/Android behavior.

## Test layers

### Pure unit tests

Fast deterministic tests for:

- currency parsing/formatting and scales;
- equal/custom/percentage/share allocation;
- signed balance/effect copy;
- composer and settlement reducers;
- permission decisions;
- query-key/invalidation helpers;
- route parameter normalization.

Use table and property-based cases for money, including remainder and boundary values.

### Component interaction tests

React Native Testing Library:

- semantic labels/roles/states rather than implementation selectors;
- keyboard entry and validation;
- default/advanced composer disclosure;
- sheet open/apply/cancel;
- disabled/busy/double-submit;
- loading, empty, error, offline, and restricted states;
- person ledger context/effect/multi-currency rows;
- reduced-motion branch.

Keep native animation/navigation mocks centralized. A dependency upgrade should not require
hundreds of bespoke screen mocks.

### Service contract tests

Against typed fake responses and a local Supabase project:

- mapper behavior and unknown fields;
- error code mapping;
- pagination/cursors;
- idempotent retry;
- cache invalidation;
- receipt staging/attachment cleanup;
- stale balance recovery.

Mocks verify client orchestration, not database correctness.

### Database tests

pgTAP and transactional integration tests:

- every invariant and authorization case in the financial plan;
- RLS and `SECURITY DEFINER` behavior as different users/anonymous;
- concurrent idempotency and balance locks;
- create/update/delete/reversal;
- person/group ledger privacy and effect semantics;
- clean install and upgrade from a production-like snapshot;
- generated TypeScript types after migrations.

These are release blockers.

### Native journey tests

Use a native-capable runner for development builds on iOS and Android. Critical journeys:

1. sign up/sign in/reset and auth restoration;
2. create person and group;
3. add equal group expense;
4. add custom/percentage/share expense;
5. edit and audited delete/reversal;
6. see group expense in person ledger;
7. settle full/partial in direct and group context;
8. multi-currency balances;
9. offline/stale/retry;
10. invite/deep-link restoration;
11. dark/light, large text, screen reader, and reduced motion smoke paths.

Playwright web checks remain useful for public responsive auth, but they are not the native
release gate.

### Exploratory testing

Run a charter per release:

- interrupt/resume with app backgrounding;
- network loss during upload/submit;
- rotation/split screen/tablet;
- rapid repeated taps;
- clock/timezone/date edge;
- member removal while editing;
- settlement race from two devices;
- receipt permission denial;
- OS back/gesture/predictive back;
- old deep links and upgraded cached state.

## Accessibility matrix

| Area          | iOS                                           | Android                                  |
| ------------- | --------------------------------------------- | ---------------------------------------- |
| Screen reader | VoiceOver                                     | TalkBack                                 |
| Text          | accessibility sizes                           | largest font/display size                |
| Motion        | Reduce Motion                                 | Remove animations/reduced motion         |
| Input         | software + hardware keyboard                  | software + hardware keyboard             |
| Navigation    | edge-back/modal escape                        | back/predictive back                     |
| Contrast      | light/dark/increased contrast where available | light/dark/high contrast where available |

Verify focus order, modal focus/restoration, composite money-row announcements, error/live
announcements, and all icon-only actions.

## Performance budgets

Set numeric budgets after Phase 0 release profiling, then fail on meaningful regressions.
Measure:

- cold/warm launch and time to interactive;
- UI/JS frames in dock, sheets, composer, and long ledgers;
- memory after repeated navigation and long-list scroll;
- render commits for a row update;
- query count, payload, and cache size;
- bundle/binary size.

Record device, OS, build type, dataset size, and method. Only release builds inform
production budgets.

## CI pipeline

Suggested order:

1. install with lockfile;
2. generated-file and database-type drift;
3. typecheck app, tests, Playwright, and functions with appropriate configs;
4. scoped ESLint;
5. Prettier check;
6. pure/component Jest;
7. local Supabase migration + pgTAP;
8. build/export smoke for supported targets;
9. Playwright public web checks where web remains supported;
10. scheduled native E2E on representative simulators/devices;
11. dependency/license/security scan with reviewed policy.

Generated reports are artifacts, not lint inputs or committed source.

## Coverage policy

Do not optimize for one global percentage. Require:

- 100% branch/invariant coverage for pure money allocation and sign rules;
- a test for every public RPC authorization/invariant branch;
- journey coverage for every primary flow and regression;
- explicit owner/justification for untested native-only behavior.

## Test data

- deterministic UUIDs and dates;
- fixtures for direct, group, multiple groups, third-party payer, blocked/removed users,
  zero/two/three-decimal currencies, and large values;
- no production PII;
- local database seed that supports every critical journey;
- isolate users/tests so parallel runs cannot affect each other.

## Release gates

No staged production release when:

- required CI is red or flaky;
- a P0/P1 ledger/security issue is open;
- migration dry-run or rollback is missing;
- balance comparison has unexplained drift;
- critical native journeys fail;
- crash-free or mutation-error metrics regress past the approved threshold;
- an advertised control is known to be inert/misleading.

## Staged release

1. internal development build;
2. team dogfood with seeded and disposable accounts;
3. platform beta tracks;
4. small production percentage;
5. progressive rollout after an observation window;
6. full release;
7. post-release review and removal of temporary compatibility code.

Monitor sanitized RPC error codes, idempotency conflicts, stale-balance rejections,
receipt failures, crashes, and person-ledger load/pagination failures. Never log raw money
notes, credentials, emails, or receipt contents.

## Current gate repair checklist

- configure Node types only for Playwright, not the RN app bundle;
- exclude `playwright-report` and `test-results` from lint/format/type ownership;
- resolve 11 scoped ESLint errors;
- repair 3 failing Jest suites and centralize Reanimated/worklets/router mocks;
- format 128 files in a reviewable isolated change;
- decide whether web is supported; if yes, expand beyond one public auth spec;
- add native E2E rather than treating viewport-sized browser tests as mobile proof;
- run Supabase tests in CI from a clean database.
