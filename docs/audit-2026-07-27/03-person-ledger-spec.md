# Person Ledger Specification

## User requirement

When two people share expenses inside groups, the friend/person detail page must show
those groups and their relevant expenses, similar to Splitwise. The relationship view must
remain correct for multiple groups, direct expenses, third-party payers, partial
settlements, and multiple currencies.

## Current behavior

The feature is partially present:

- `usePersonSnapshot` identifies shared groups and activities;
- `FriendDetailScreen` renders the groups under **Together**;
- shared expenses appear in **History**.

It is not safe to polish as-is:

- a third-party-paid group expense can be labelled “You paid”;
- history omits the group name;
- group rows retain only one currency balance;
- balance math is rebuilt from broad client datasets;
- fallback conversion assumes every currency has two decimal places.

## Domain rule

A person ledger does **not** duplicate expenses into a friend table. It is a server read
model derived from:

- canonical expense;
- canonical splits;
- canonical settlement;
- group/friendship membership and visibility;
- current authenticated user;
- requested counterparty.

The open-balance RPC remains the authoritative outstanding balance. Ledger rows explain
how that balance changed.

## Bilateral expense effect

Let `me` be the authenticated user and `friend` the selected person.

| Payer            | Relevant share     |           Effect from my perspective |
| ---------------- | ------------------ | -----------------------------------: |
| me               | friend’s split     | `+friendSplit` — friend owes me more |
| friend           | my split           |       `-mySplit` — I owe friend more |
| third person     | either/both splits |            `0` between me and friend |
| me/friend absent | none               |                  row is not relevant |

The amount shown in the relationship row is the **bilateral effect**, not necessarily the
full expense amount. The detail page can separately show full amount.

### Visibility decision

Show an expense in **History together** when both users are participants in its context
and at least one is included in its splits or is payer. This meets the expectation that a
shared group expense appears in the friend view. If its bilateral effect is zero, render
it neutrally as shared context—not as debt:

`Sam paid ₹900 in Goa trip · no change between you and Alex`

A future filter may offer `Balance changes only`, but the default should explain shared
activity rather than silently disappear.

## Settlement effect

| Direction      |                Effect from my perspective |
| -------------- | ----------------------------------------: |
| I paid friend  | increases signed open balance toward zero |
| Friend paid me | decreases signed open balance toward zero |

The exact sign should be returned by the read model rather than recomputed in UI copy.
Every settlement row states that it records an external payment.

## API contract

Add a versioned RPC such as:

```text
fetch_person_ledger_v1(
  p_counterparty_id uuid,
  p_cursor timestamptz,
  p_limit integer default 30
)
```

It authenticates with `auth.uid()` and returns only contexts visible to both users.

Suggested row:

```ts
type PersonLedgerRow = {
  eventId: string;
  eventType: "expense" | "settlement";
  occurredAt: string;
  context:
    | { type: "direct"; friendshipId: string; label: "Direct" }
    | { type: "group"; groupId: string; label: string };
  currency: CurrencyCode;
  fullAmountMinor: number;
  bilateralEffectMinor: number;
  title: string;
  actor: { id: string; displayName: string };
  payerId?: string;
  mySplitMinor?: number;
  counterpartySplitMinor?: number;
  settlementFromUserId?: string;
  settlementToUserId?: string;
  nextCursor?: string;
};
```

For JavaScript safety, amounts that may exceed `Number.MAX_SAFE_INTEGER` should be
transported as strings and parsed into a deliberate money type. If product limits prove
numbers safe, enforce those limits on the server and document them.

## Balance contract

Query `fetch_open_balances` for the selected counterparty and retain one row for every:

```text
(counterparty, context type, context id, currency)
```

Do not call `.find()` where multiple currency rows can exist.

Presentation model:

```ts
type PersonContextBalance = {
  context: DirectContext | GroupContext;
  balances: Array<{
    currency: CurrencyCode;
    signedAmountMinor: MoneyMinor;
  }>;
};
```

The header aggregates only within each currency:

- `Alex owes you ₹1,250`
- `You owe Alex $18.00`

Opposing contexts in the same currency may be shown as a net header only if the detailed
“Balances by place” section stays visible. Never cancel different currencies.

## Screen contract

### Header

- person identity;
- relationship state;
- one balance statement per currency;
- `All settled up` when no non-zero balances.

### Actions

- Add expense: opens canonical composer with direct friendship preselected;
- Settle: opens a balance picker only when more than one actionable context/currency
  exists; otherwise goes directly to the settlement composer;
- reminder: available only for amounts the friend owes the current user and subject to
  notification/rate-limit rules.

### Balances by place

Rows:

```text
Direct                      Alex owes you ₹200
Goa trip                    You owe Alex ₹650
                            Alex owes you $12
Apartment                   Settled
```

Tap Direct to filtered person history. Tap group to the group detail. Use “Settled”
instead of a fabricated `$0.00` when the preferred currency is unknown.

### History together

Each row contains:

- title;
- group name or Direct;
- payer/effect sentence;
- bilateral amount and sign;
- date;
- tap to canonical expense/settlement detail.

Use cursor pagination rather than loading all user history and slicing ten rows.

## Query and cache behavior

- query key includes current user, counterparty, filters, and cursor;
- balance and ledger queries are separate so activity pagination does not destabilize the
  balance header;
- creating/updating/deleting an expense invalidates its detail, context activity, person
  ledgers for affected participants, and open balances;
- creating a settlement invalidates both parties’ balances and affected context ledger;
- optimistic UI may show a pending event, but authoritative signed balances replace it;
- offline stale content is visibly marked; financial mutation confirmation requires a
  fresh server check.

## Authorization and privacy

- a user may request only their own person ledger;
- blocked users follow the product visibility policy;
- removed group members retain only legally/product-approved historical visibility;
- no email, phone, or private profile data is returned unnecessarily;
- RPC pagination cannot leak whether a hidden group or expense exists;
- group membership and friendship status are checked at query time.

## Acceptance scenarios

1. I paid ₹1,200 for four group members including Alex: friend history shows group name
   and `You lent Alex ₹300`; group balance rises by ₹300.
2. Alex paid ₹600 and my split is ₹200: row shows `You borrowed ₹200`; balance falls by
   ₹200.
3. Sam paid and both Alex and I have shares: row is neutral and never says I paid.
4. We share two groups in INR: both context balances display; the header may show their
   INR net.
5. We share USD and INR expenses: two header statements display; no combined total.
6. A partial group settlement changes only that context/currency.
7. Direct and group expenses coexist without duplication.
8. Expense edit moves amounts correctly and invalidates the ledger.
9. Expense deletion/reversal removes or reverses the event according to audit policy.
10. A non-member cannot fetch the ledger or infer a private group.
11. Zero balances render Settled, not an invented preferred-currency amount.
12. Large text, VoiceOver, and TalkBack read group, effect, amount, and action in order.

## Migration

1. Add failing SQL tests for the contract.
2. Implement `fetch_person_ledger_v1` and typed mapper.
3. Change `usePersonSnapshot` to compose authoritative balance + paginated ledger queries.
4. Render the new sections behind a remote/local feature flag.
5. Compare derived old/new balances in non-production diagnostics.
6. Remove client event aggregation and `* 100` fallbacks after parity.
7. Delete unused relationship-history components after an import/reachability check.
