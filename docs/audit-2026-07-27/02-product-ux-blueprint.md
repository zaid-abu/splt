# Product and UX Blueprint

## Product promise

Splt should answer three questions without making the user understand its data model:

1. **What do I owe or get back?**
2. **Why is that the balance?**
3. **What is the fastest safe action I can take?**

Every top-level screen and flow should serve one of those questions.

## Target information architecture

### Home

Purpose: current financial state and the next likely action.

- summary separated by currency;
- people/groups with actionable balances;
- recent activity;
- one primary Add expense action;
- settle actions attached to balance rows/cards;
- no create-group, add-person, or schedule-expense launcher.

### Circles

Purpose: find and manage the people and groups behind transactions.

- People and Groups segments;
- search;
- Add person in People;
- Create group in Groups;
- rows show balance summaries by currency, not a cross-currency total;
- no separate `people` or `groups` product destination once compatibility redirects are
  no longer required.

### Activity

Purpose: chronological, filterable ledger explanation.

- canonical expense and settlement events;
- context label on every row;
- signed effect for the current user;
- cursor pagination and pull to refresh;
- filter by person, group, currency, and event type only when volume justifies it.

### More

Purpose: secondary, account, and configuration tasks.

- profile;
- currencies;
- appearance;
- notifications only when functional;
- security only with real state;
- export only when functional;
- recurring expenses only after the feature is real;
- help and legal content with owned sources.

### Centre action

The centre action opens **Add expense directly**. It is not a generic “create anything”
menu. On larger screens it can become a labelled primary action in a navigation rail or
toolbar.

## One expense flow

All entrances navigate to the same route and domain composer:

```text
Home add                 -> expense/new
Person add               -> expense/new?friendshipId=...
Group add                -> expense/new?groupId=...
Activity empty-state add -> expense/new
```

The context parameter is a default, not a separate implementation. The route validates
that exactly one group or friendship context is selected before submission.

### Step model

**If context is known:** open directly in the composer.  
**If context is unknown:** show one searchable “Who is this with?” context step, then the
same composer.

### Default composer

Visible by default:

- currency and amount;
- description;
- compact context summary;
- compact rule: `Paid by you · split equally`;
- primary button: `Add expense`.

Collapsed under **Split options**:

- payer;
- participants;
- equal/custom/percentage/shares;
- a clear preview that always totals to the expense amount.

Collapsed under **More options**:

- date;
- category;
- notes;
- receipt.

Changes in a focused sheet apply with **Done**. Do not put an extra “Apply split” action in
the main form. The sticky submit action remains reachable above the keyboard and announces
why it is disabled.

### Validation

- amount must be greater than zero;
- description is either required or a deliberate category-derived default—never silently
  the word “Expense”;
- context, payer, and every participant must be valid in that context;
- the split preview must equal the amount;
- validation is inline after blur/submission, not while the user is midway through typing;
- server errors map to actionable copy without leaking database internals;
- submit is idempotent and visibly busy; double taps cannot duplicate an expense.

### Success

Use a brief confirmation state or toast with:

- `Expense added`;
- amount and context;
- `View expense`;
- optional reversible Undo only when the backend supports a safe, audited reversal.

Do not turn success into another multi-step screen.

## One settlement flow

Settlement is available only from an open balance:

```text
Home balance -> settle/[counterparty]?context=...&currency=...
Person balance -> same route with person preselected
Group balance -> same route with group, person, and currency preselected
```

### Settlement composer

- names both parties;
- shows context and currency;
- defaults to the full open balance in correctly formatted major units;
- allows Full, Half, or Custom without minor/major conversion leakage;
- chooses a payment method intentionally or records no method;
- states “This records a payment made outside Splt”;
- validates against a fresh authoritative balance at confirmation;
- displays multiple currencies as separate settlement operations.

Remove the false cross-currency “Total.” “Settle all” may confirm several independent
rows, with one subtotal per currency and explicit partial-failure behavior.

## Person detail

The screen becomes a relationship ledger:

1. identity and currency-separated total;
2. Add expense and Settle, with Settle disabled/hidden at zero;
3. **Balances by place** — Direct and each shared group;
4. **History together** — each expense/settlement with group/direct context and bilateral
   effect;
5. relationship management in a secondary overflow/danger area.

The full contract is in [Person ledger specification](./03-person-ledger-spec.md).

## Group detail

Default view:

- group name and members;
- current user’s balances by person and currency;
- Add expense;
- recent group activity;
- Settle on actionable person/currency rows.

Schedules, analytics, members, and settings are secondary destinations. Tabs or segments
should not expose empty/unimplemented sections. Group deletion/archive must explain
blocking balances before destructive confirmation.

## Progressive disclosure rules

- Equal split is the normal case; advanced split math is secondary.
- Show one primary action per screen region.
- Do not repeat the same action in header, body, floating button, and dock.
- Ask for information only when needed for the current operation.
- Preserve entered data when the user temporarily creates a missing person/group.
- Never hide the financial consequence of a confirmation.
- Prefer direct labels: `Add expense`, `Record payment`, `Create group`, `Add person`.

## State contract for every screen

Every route must explicitly design and test:

- initial loading;
- refreshing with existing data;
- empty;
- permission/restricted;
- offline stale data;
- recoverable error with Retry;
- not found/deleted;
- success;
- destructive confirmation;
- large text, keyboard, and screen reader.

Skeletons must match the final layout. A disabled action must explain how to become
enabled. Errors appear near the relevant field or action.

## Motion system

Create one `motion` token contract:

| Use              |         Duration | Curve                                |
| ---------------- | ---------------: | ------------------------------------ |
| Press feedback   |        80–120 ms | ease out                             |
| State/selection  |       150–200 ms | standard                             |
| Sheet enter/exit |       200–250 ms | emphasized deceleration/acceleration |
| Navigation       | platform default | platform controlled                  |

Rules:

- use transform and opacity for custom transitions;
- do not animate routine layout reflow when a state change is sufficient;
- no decorative bounce in financial confirmation;
- one haptic at the meaningful result, not every intermediate tap;
- honor OS reduced motion and an optional app override through one hook;
- under reduced motion, replace spatial travel with immediate or short fades;
- never animate numbers in a way that obscures their final value.

## Accessibility contract

- minimum targets: 44 pt on iOS, 48 dp on Android;
- fields have programmatic labels, hints, errors, and required state;
- buttons expose disabled and busy state;
- icon-only controls have explicit action labels;
- sheets expose modal semantics, focus the heading/first control, trap traversal, close on
  platform escape/back, and restore focus;
- dynamic type is not arbitrarily capped; layouts wrap and grow;
- money signs are not communicated by color alone;
- success/error announcements use live regions or platform announcements;
- lists have meaningful composite row labels and actions;
- custom tab navigation is verified with VoiceOver and TalkBack;
- keyboard avoidance, return key, submit, and focus order are tested on both platforms.

## Adaptivity

Phone portrait is the first target, not the only target.

- read live window dimensions with `useWindowDimensions`;
- constrain form content to a readable maximum width on tablets;
- use a navigation rail or stable sidebar for wide layouts;
- use two-pane group/person + detail layouts only after phone journeys are stable;
- preserve safe areas and keyboard insets;
- do not encode screen height at module import time;
- test small phone, large phone, tablet portrait, tablet landscape, split-screen, and large
  text.

## Copy model

Financial rows describe effect, not merely who touched the expense:

- `You lent Alex ₹400 in Goa trip`
- `You borrowed ₹250 from Alex in Apartment`
- `Alex paid ₹900 · your share ₹300`
- `No change between you and Alex` when an event is shown for shared context but has no
  bilateral effect.

Use “owe/owes,” “paid,” “lent,” and “borrowed” consistently. Never say “Total” for values
that exclude another currency or context without naming the scope.

## Product success measures

Instrument only privacy-safe events:

- time from Add expense tap to successful creation;
- percentage of expenses added without opening advanced split;
- cancellation by step;
- settlement completion and stale-balance rejection;
- validation/error rate by code, not raw input;
- friend-detail group-row and ledger-row usage;
- crash-free sessions;
- support/contact intent from failed flows.

Targets should be set after collecting a clean baseline, not invented during the rewrite.
