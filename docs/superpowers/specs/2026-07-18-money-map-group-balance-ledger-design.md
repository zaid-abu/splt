# Money Map Group Balance Ledger Design

## Summary

Replace Money Map's two-column **Your circles** grid with a full-width **Where you stand** ledger. The ledger adapts the useful part of the supplied Splitwise reference: it explains the overall balance group by group and identifies the person responsible for the most significant balance in each group. It retains Splt's warm, calm Coral Ledger visual language instead of copying the reference's styling.

The Home screen remains a concise overview. The dedicated Groups tab continues to own search, filters, complete group history, and group management.

## Goals

- Make the overall balance easier to understand by showing where it comes from.
- Surface the most relevant person-level explanation within each group.
- Make each group balance easy to scan without relying on color alone.
- Preserve a short Home screen and avoid duplicating the full Groups screen.
- Reuse the existing group detail and Groups routes.

## Non-Goals

- Rebuilding the dedicated Groups screen.
- Showing every active or historical group on Home.
- Adding search, sorting controls, filters, or settled-group expansion to Home.
- Changing the balance hero, attention rows, recent movement section, tab bar, or floating Add Expense action.
- Adding new backend queries or changing persisted data.

## Placement And Hierarchy

The Home screen order remains:

1. Profile and notifications top bar.
2. Greeting and contextual lede.
3. Overall balance hero.
4. Conditional **Needs attention** person rows.
5. New **Where you stand** group balance ledger.
6. Conditional **Recent movement** expense rows.

The new ledger replaces the existing **Your circles** grid in the same general location. Its section header includes an **All groups** affordance that navigates to `/groups`.

## Ledger Presentation

The ledger is one full-width warm surface with a `16px` radius, a `1px` warm border, and no shadow. Rows are separated by soft dividers. The first and last rows inherit the outer card shape.

Each row contains:

- A `GroupIconBadge` for group identity.
- The group name as the primary label.
- A one-line person-level explanation as supporting text.
- A compact right-aligned balance pill.

Open-balance copy uses explicit direction and an amount:

- Positive person balance: `Ritwika owes you $1,206.00`.
- Negative person balance: `You owe Keran $17.87`.

The balance pill represents the user's net balance for the entire group, which can differ from the largest person-level balance when several people are involved:

- Positive group net: green-tinted pill with `+$1,206.00`.
- Negative group net: red-tinted pill with `-$17.87`.
- Settled group: neutral pill with `Settled`.

Direction is conveyed through signed values and text as well as semantic color. Long group names and supporting copy truncate to one line. The balance pill does not shrink.

Pressing a row provides light haptic feedback and navigates to `/group/[id]`. The whole row is a minimum 56px touch target with an accessibility label that includes the group name and balance state.

## Selection And Ordering

A balance is considered open when its absolute value is greater than `0.005`, matching the existing dashboard threshold.

When one or more open groups exist:

- Show only open groups.
- Sort by absolute group net balance descending.
- Break equal-balance ties by latest group expense timestamp descending.
- Show at most four rows.

When every group is settled:

- Show up to four groups sorted by latest group expense timestamp descending.
- Render neutral settled rows as reassurance that no action is required.

When the user has no groups, omit the section. Group creation remains available from the dedicated Groups screen rather than adding another Home CTA.

## Key-Person Explanation

For each displayed group, calculate the current user's per-person balances using the existing settlement balance utility scoped to that group. Exclude the current user and ignore balances with an absolute value at or below `0.005`.

Select the person with the largest absolute balance. If two balances have the same magnitude, preserve the order of `group.members`; no additional tie-break behavior is needed for this preview.

Resolve the selected user from `group.members`. If the user cannot be resolved, use `Open balance` rather than inventing a name or direction. Settled groups use `No open balances`.

## Component Boundaries

### `useDashboard`

Extend the dashboard view model with a `groupBalancePreview` collection. Each item contains:

- `group`
- `netBalance`
- `latestExpenseAt`
- `keyPerson`, when resolvable
- `keyPersonBalance`, when non-zero

The hook owns calculation, filtering, and ordering. Currency formatting remains in presentation because existing dashboard rows already use shared formatting helpers.

### `GroupBalanceLedger`

Add a dashboard-specific component at `src/features/dashboard/components/GroupBalanceLedger.tsx`, alongside the existing dashboard components. It receives prepared preview items, currency information, and navigation callbacks. It renders the section heading, **All groups** action, and one containing card.

### `GroupBalanceRow`

Keep the row local to the ledger component unless it becomes large enough to obscure the ledger's structure. It is feature-specific and should not expand the generic Coral `GroupTile` API.

### `MoneyMapScreen`

Replace the existing `GroupTile` grid block with `GroupBalanceLedger`. The screen should not perform balance calculation or group ordering.

## States And Failure Handling

- Dashboard-level loading and error behavior remain unchanged.
- The ledger renders only after group data is available.
- Missing key-person data falls back to `Open balance`.
- Missing or zero balances never produce signed `-0.00` or `+0.00` copy.
- Unsupported or mixed source currencies continue through the dashboard's existing preferred-currency conversion.
- Empty group data omits the section without leaving an orphan heading or gap.

## Accessibility

- Rows use `accessibilityRole="button"`.
- Accessibility labels state the group name and full balance meaning, such as `Clingy, you are owed $1,206.00`.
- The **All groups** control uses a descriptive label and at least a 44px touch target.
- Positive and negative meaning is always present in text, not color alone.
- Text respects existing app font scaling behavior and truncates only secondary copy where space is constrained.

## Verification

No new Jest tests are required for this change. Verification consists of:

- `npm run typecheck`
- Prettier formatting check for changed files
- Manual inspection on narrow and wide phone widths
- Positive, negative, mixed-person, and fully settled group states
- More than four open groups
- Missing key-person lookup
- No groups
- Row and **All groups** navigation
- Light and dark themes

## Success Criteria

- A user can connect the overall balance to individual groups without opening the Groups tab.
- Each open group explains the largest person-level contributor to its balance.
- The section remains compact at four rows or fewer.
- The visual treatment matches Splt's warm bordered surfaces and restrained semantic colors.
- Home does not duplicate Groups-screen management features.
