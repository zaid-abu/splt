# P1 Ledger Hardening ADR Bundle

**Status:** Accepted for implementation planning
**Date:** 2026-07-27
**Scope:** P1-01, with contracts consumed by P1-02 through P1-14

## Context

Splt's current `v2` financial RPCs use `SECURITY DEFINER`, but the expense mutation
path does not consistently prove context membership, payer and participant authority,
split uniqueness, positive amounts, or exact monetary totals before inserting rows.
The settlement path also defaults an absent payment method to `cash`, relies on
client-supplied direction details, and has no complete audited reversal policy.

The application stores canonical values in integer minor units, while the current
Supabase-generated JavaScript types represent PostgreSQL `bigint` values as numbers.
That representation is unsafe for sufficiently large values and cannot carry an
arbitrary JavaScript `bigint` through JSON serialization.

The existing routes and services must migrate without allowing a client to bypass
server authorization or creating a second, divergent ledger contract.

## Decisions

### ADR-1: Money and currency transport

PostgreSQL remains authoritative for money and stores ledger values as integer minor
units. SQL arithmetic uses `bigint` with explicit product bounds before arithmetic that
could overflow. Currency codes are validated through one versioned registry and their
minor scales are never inferred from a default or from `* 100`.

At the JavaScript boundary:

- Domain money values use validated `bigint` minor units and a branded currency code.
- RPC inputs carrying PostgreSQL `bigint` values use canonical base-10 decimal strings.
- RPC response mappers accept decimal strings and reject unsafe numbers, malformed
  values, unknown currencies, and values outside the configured product bound.
- UI amount fields parse major-unit text into minor units only at the input boundary;
  formatters convert minor units back to localized major-unit text only at presentation.
- A generated database type that says `number` for a ledger `bigint` is treated as an
  unsafe transport type and is wrapped by an explicit mapper rather than used directly.

The product bound is `9_000_000_000_000_000` minor units per money value. It is below
both PostgreSQL `bigint` limits and JavaScript `Number.MAX_SAFE_INTEGER`, while still
allowing exact UI-only conversion when required. Financial values never require that
conversion for persistence or RPC. Allocation intermediates must validate multiplication
and division before converting back to this bound.

### ADR-2: Expense authorization and transaction boundary

Public expense RPCs derive the actor exclusively from `auth.uid()`. An actor parameter
is not accepted by public functions. Each request must provide exactly one context:
an active group membership or an accepted friendship containing the actor.

Before any durable insert, the transaction must prove:

- the selected context exists and is visible to the actor;
- the payer is an active participant in that context;
- every split participant is an active participant in that context;
- a direct expense contains exactly the two friendship participants;
- participant IDs and positions are unique, bounded, and valid;
- the title and optional metadata satisfy their documented limits;
- the amount is positive, supported by the currency registry, and within product bounds;
- staged receipt keys belong to the actor and are attachable to this expense; and
- an operation ID is either new or matches the same actor and canonical payload.

The public function calls private validation and mutation helpers inside one
transaction. The helper never trusts RLS as a substitute for explicit checks because
the function is `SECURITY DEFINER`. All `SECURITY DEFINER` functions use a fixed
`search_path`, explicit grants, and revocation of direct helper access.

### ADR-3: Split authority and deterministic allocation

The server is authoritative for all split methods:

- **Equal:** use the canonical ordered participant list and distribute remainder minor
  units one at a time from the first participant.
- **Percentage:** accept fixed integer percentage units, require an exact 100% total,
  derive all money amounts on the server, and distribute rounding remainder using the
  same deterministic order.
- **Shares:** require positive fixed share units, derive all money amounts on the
  server, and distribute rounding remainder using the same deterministic order.
- **Custom:** accept explicit minor amounts only after proving every participant is
  valid and the exact sum equals the expense amount.

Every method enforces:

```text
sum(split.amount_minor) = expense.amount_minor
```

An update replaces the complete split set transactionally. Partial split patches are
not a supported contract. The client may send a preview for UX, but the server either
recomputes the allocation or verifies it against the canonical algorithm before any
expense row becomes durable.

### ADR-4: Settlement and reversal/audit semantics

Settlement RPCs derive the actor from `auth.uid()`, require one valid context, require
distinct authorized parties, reject non-positive amounts, validate currency, lock and
recalculate the current balance, reject overpayment and stale direction, and record a
payment method only when the user explicitly selected it. Missing method is `NULL`, not
silently `cash`.

Financial rows are not directly deleted. Expense and settlement removal is represented
by an audited reversal operation containing:

- original event ID and event type;
- authenticated actor and authorization basis;
- client operation ID for idempotent retry;
- explicit reason and creation timestamp; and
- a durable link to the reversal event used by balance projections.

The original event remains queryable for audit history. A reversal is authorized by a
separate policy, recalculates affected balances under the same locks as the original
mutation, and is atomic with its activity/audit records. Production correction of
historical data is a separate, explicitly approved operation and is not part of this
design.

## Target contract shape

Use versioned public RPCs as the only financial write entry points:

- `create_expense_v3`
- `update_expense_v3`
- `record_settlement_v3`
- a versioned reversal RPC defined by the P1-11 policy

Private helpers own reusable validation and allocation logic. The v2 functions remain
available only as a temporary compatibility surface during migration; clients must be
moved to v3, imports/reachability must be scanned, and the old direct mutation paths
must be revoked or removed before P1-10 is complete.

Stable machine error codes are part of the RPC contract. Client services map codes to
safe user messages without exposing SQL text, credentials, receipt keys, or raw
financial payloads.

## Migration and rollout

1. Add ADRs and decision-log entries before changing financial semantics.
2. Add failing pgTAP authorization and invariant cases before implementing the new
   validation path.
3. Add the currency registry and drift tests across SQL, generated types, parsers, and
   formatters.
4. Implement v3 RPCs and private helpers in additive migrations with explicit grants.
5. Update service mappers and mutation callers to the string-based bigint contract.
6. Run clean-install and upgrade rehearsals against local production-like fixtures.
7. Shadow-compare valid v2/v3 results in development without correcting production
   data or silently accepting unexplained drift.
8. Remove v2 reachability only after import, service, and route evidence proves zero
   client bypasses.

No production migration, historical correction, destructive cleanup, or release is
authorized by this document.

## Verification plan

P1-01 is accepted only when the ADR review resolves these contracts and the decision
log points to this document. Subsequent work must provide:

- pgTAP authorization cases for anonymous, outsider, removed, pending, foreign payer,
  injected participant, duplicate participant, and invalid context requests;
- pgTAP invariant cases for zero/negative/overflow amounts and every split method;
- string/bigint mapper tests for safe, boundary, malformed, and unknown-currency data;
- deterministic allocation tests for zero-, two-, and three-decimal currencies;
- idempotency, lock-order, stale-balance, and concurrent retry tests; and
- independent SQL/security review before any production migration is considered.

## Risks and explicit non-goals

- Existing historical rows are not corrected by this work.
- Client-side previews are not a security or financial authority.
- Currency conversion and cross-currency netting are out of scope.
- Reversal authorization details are intentionally finalized in P1-11, while this ADR
  establishes the append-only and traceability requirement.
- Native P0 evidence remains unresolved because this work intentionally bypasses the
  P0 exit gate at the user's direction.
