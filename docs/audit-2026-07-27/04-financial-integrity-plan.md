# Financial Integrity Plan

## Objective

Every displayed balance must be reproducible from valid canonical events, and every
mutation must be authorized, atomic, idempotent, currency-correct, and independently
verified on the server.

## Canonical money model

```ts
type CurrencyCode = string & { readonly __currency: unique symbol };
type MoneyMinor = number & { readonly __minor: unique symbol };
type Money = { currency: CurrencyCode; minor: MoneyMinor };
```

Runtime rules:

- store and calculate ledger values in integer minor units;
- format major units only at presentation/input boundaries;
- never add two `Money` values without equal currency;
- never infer scale with `* 100`;
- reject unknown currency codes rather than defaulting to scale 2;
- define product limits that remain within PostgreSQL `bigint` and safe client transport;
- make amount parsing locale-aware enough for supported input conventions, while storing
  normalized integers.

## One currency registry

Create a versioned registry used to generate or test:

- client scale and formatting metadata;
- database `currency_minor_scale`;
- selectable product currencies;
- amount input precision;
- fixtures and boundary tests.

Do not maintain divergent switch statements. Unsupported currencies fail with a stable
error. Changes require an ADR and migration test.

## Expense invariants

The public RPC validates all conditions before any durable insert:

### Identity and context

- authenticated actor exists;
- exactly one of `group_id` and `friendship_id` is present;
- group exists and actor is an active member, or friendship exists, is accepted, and
  contains actor;
- payer is an active participant in the selected context;
- direct context participants are exactly the two friendship users.

### Expense

- client operation ID is valid and unique within the intended ownership scope;
- title is normalized and within defined limits;
- `amount_minor > 0`;
- currency is supported;
- date is valid and within documented product bounds;
- category, notes, and receipt satisfy their contracts.

### Splits

- JSON is an array with a bounded non-zero length;
- each split has one valid context participant;
- user IDs are unique;
- positions are unique/contiguous if ordering is retained;
- every split amount is non-negative;
- payer representation follows one explicit rule;
- `sum(amount_minor) = expense.amount_minor` for **every** split method;
- percentage units sum to exactly 100% in the fixed scale;
- share units are positive and their server-derived allocation totals exactly;
- equal allocation is server-derived from the ordered participant list, or client values
  are verified against the same deterministic algorithm.

### Transaction and locks

- acquire stable balance locks after validating context identifiers;
- idempotency lookup confirms the existing operation belongs to the same actor/payload or
  returns a conflict, not an unrelated expense ID;
- expense, splits, activity, receipt attachment, and notifications commit atomically;
- notification failure policy is explicit and cannot corrupt the ledger;
- errors use stable machine codes mapped to safe client messages.

Apply the same validation to update. Update must lock the old and new affected balance
keys, authorize the actor under the edit policy, and recalculate every affected context.

## Settlement invariants

- actor is one of the two parties and is authorized for the context;
- payer and payee are distinct context participants;
- exactly one group/friendship context;
- `amount_minor > 0`;
- currency is supported;
- amount cannot exceed the freshly recalculated actionable open balance;
- direction agrees with the signed balance;
- settlement uses client operation idempotency;
- the balance is rechecked after locks and before insert;
- settlement, activity, and notification are atomic;
- payment method is selected explicitly or null; bulk actions do not fabricate `cash`.

Deletion should not be an unaudited direct table delete. Prefer an audited reversal event
or a tightly authorized RPC with historical traceability. Document whether edited/deleted
transactions remain in an audit log.

## Balance projection

Authoritative open balance key:

```text
(current_user, counterparty, context_type, context_id, currency)
```

Sign from current-user perspective:

- positive: counterparty owes current user;
- negative: current user owes counterparty;
- zero: omit from open-balance results.

Balance derivation uses only valid canonical events. Client code formats and groups the
rows but does not reproduce ledger arithmetic. Group totals and person totals are grouped
by currency. No exchange-rate netting is used for amounts a user can settle.

## Calculation cases

### Equal

Use deterministic participant order and allocate remainder one minor unit at a time using
a documented rule. The same input always produces the same output.

### Custom

Every amount is explicit and the sum must match exactly.

### Percentage

Percentages use fixed integer units. The server derives monetary amounts with a documented
remainder strategy; it does not trust independently supplied percentages and amounts that
could disagree.

### Shares

Shares are positive fixed units. The server derives proportional minor amounts with the
same deterministic remainder rule.

### Edits

An edit replaces the full split set transactionally. Patch-like partial split mutation is
not allowed.

## Adversarial database test matrix

Add pgTAP tests before changing the RPC:

| Area           | Must reject                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| Authentication | anonymous actor, forged actor parameter                                         |
| Group context  | outsider, removed member, nonexistent group                                     |
| Direct context | third user, pending/rejected/blocked friendship, nonexistent friendship         |
| Payer          | outsider payer, null payer, non-friend payer                                    |
| Splits         | outsider user, duplicate user, duplicate position, empty array, excessive count |
| Amount         | zero, negative, overflow/product-limit breach, unsupported currency             |
| Totals         | equal, custom, percentage, and shares amount mismatch                           |
| Percentage     | below/above 100%, negative units                                                |
| Shares         | zero/negative total, inconsistent amounts                                       |
| Context        | both IDs, neither ID                                                            |
| Idempotency    | same operation/same payload, same operation/different payload, concurrent retry |
| Receipt        | another owner’s key, already attached key, missing staged object                |
| Update/delete  | non-creator/non-authorized member, affected balance lock race                   |
| Settlement     | wrong direction, overpayment, stale balance, mixed context, self-payment        |
| Visibility     | person ledger or balance query by unrelated user                                |

Also test successful zero-decimal, two-decimal, and three-decimal currencies; one-minor-unit
remainders; high supported values; group membership changes; and concurrent expense/
settlement writes.

## Client contract tests

- parser/formatter round trip for every supported scale;
- locale separators and pasted currency symbols;
- blank, zero, negative, excess precision, and overflow;
- all split methods and deterministic remainders;
- preset Full/Half/Custom conversion;
- copy/sign matrix for every payer/relationship case;
- per-currency grouping;
- server error code mapping;
- double-submit/idempotent retry;
- cache invalidation after create/edit/delete/settle.

## Data audit and remediation

Before enforcing new constraints in production:

1. back up and document recovery;
2. query existing expenses whose split sum differs from amount;
3. find zero/negative amounts, duplicate participants/positions, invalid context members,
   unsupported currency/precision, and orphan receipts;
4. classify whether each row can be deterministically repaired;
5. produce a dry-run report with counts and IDs;
6. get explicit approval for any financial data correction;
7. apply a reversible/versioned migration;
8. recalculate and compare balances before and after;
9. retain an audit record of corrections.

Do not silently “fix” historical money from client code.

## Completion gate

Ledger hardening is complete only when:

- all adversarial pgTAP tests pass against a clean local database;
- service contract tests use the generated database types;
- no public client path performs direct expense/settlement table mutation;
- no ledger-domain file performs floating major-unit arithmetic;
- no cross-currency total exists;
- production migration includes backup, dry-run, observability, and rollback instructions;
- an independent review signs off the SQL security and balance semantics.
