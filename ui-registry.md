### Dashboard Card Surfaces

File: src/features/dashboard/screens/DashboardScreen.tsx
Last updated: 2026-07-08

| Property         | Class / Value                                                                       |
| ---------------- | ----------------------------------------------------------------------------------- |
| Background       | App `#F5F0EB`; dashboard cards `#FFFCF8`; controls `#FFFFFF`                        |
| Border           | `1px #E8E4DF` for all dashboard card surfaces and inner panels                      |
| Border radius    | `16px` card radius; `18px` row icon radius; `999px` filter/action pills             |
| Text - primary   | `#000000`, `CrimsonText_700Bold`                                                    |
| Text - secondary | `#8A8782`, `CrimsonText_600SemiBold`; section labels are uppercase/tracked          |
| Spacing          | `24px` screen gutters; `16px` card padding; `16px` row vertical padding             |
| Hover state      | Pressed opacity `0.5-0.8` depending on control weight                               |
| Shadow           | None                                                                                |
| Accent usage     | Debt `#E85D5D`; positive balance `#4CAF82`; active chips and primary CTAs `#000000` |

**Pattern notes:**
Dashboard sections should use the same warm `#FFFCF8` card surface for consistency, then rely on padding, row structure, and inner controls for distinction. Rows inside list cards should suppress the final separator and use a muted chevron to signal navigation. Group and activity icon containers use `48px` squares with `18px` radius and `1px #E8E4DF` borders. Group rows should render the saved Lucide icon name from group creation before falling back to emoji or initials. Activity rows should include compact relative dates such as `Today`, `Yesterday`, or `Jul 8`.

### Balance Summary Card

File: src/features/dashboard/components/BalanceCard.tsx
Last updated: 2026-07-08

| Property         | Class / Value                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Background       | Outer card `#FFFCF8`; owe panel `#FFF7F5`; owed panel `#F5FCF8`                                     |
| Border           | Outer `1px #E8E4DF`; inner panels `1px #E8E4DF`                                                     |
| Border radius    | Outer `16px`; inner panels `14px`; settle pill `999px`                                              |
| Text - primary   | `#000000`, `CrimsonText_700Bold`                                                                    |
| Text - secondary | `#8A8782`, uppercase tracked section labels                                                         |
| Spacing          | Outer `16px`; inner panels `14px`; `12px` gap between balance panels; `14px` top gap before actions |
| Hover state      | Spring scale to `0.97` on press                                                                     |
| Shadow           | None                                                                                                |
| Accent usage     | Owe amount `#E85D5D`; owed amount `#4CAF82`; primary action `#000000`                               |

**Pattern notes:**
Balance cards should read as the primary dashboard summary. Use the warm outer surface, semantic red/green money states, softly tinted inner panels, person hints, and a clear `Settle up` / `View balances` action row without adding shadow or heavy decoration.

### Analytics Cards

File: src/features/analytics/screens/AnalyticsScreen.tsx
Last updated: 2026-07-08

| Property         | Class / Value                                                                         |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | App `#F5F0EB`; analytics cards `#FFFCF8`; metric/control panels `#FFFFFF`             |
| Border           | `1px #E8E4DF` for cards, controls, metric panels, and row icons                       |
| Border radius    | `16px` card radius; `18px` row icon radius; `14px` metric panel radius; `999px` pills |
| Text - primary   | `#000000`, `CrimsonText_700Bold`                                                      |
| Text - secondary | `#8A8782`, `CrimsonText_600SemiBold`; section labels are uppercase/tracked            |
| Spacing          | `24px` screen gutters; `16px` card padding; `16px` row vertical padding               |
| Hover state      | Pressed opacity `0.7-0.8` for chips and CTAs                                          |
| Shadow           | None                                                                                  |
| Accent usage     | Chart line and active chips use `#000000`; categories use muted distinct hues         |

**Pattern notes:**
Analytics cards should match the dashboard card system: warm surface, light border, no shadow. Use compact summary metrics before charts, pill period controls, rounded `48px` row icons, and progress bars for category comparison. Empty analytics sections should stay in-card and include an action when there is a natural next step.

### Groups List

File: src/features/groups/screens/GroupsScreen.tsx
Last updated: 2026-07-12

| Property         | Class / Value                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Background       | App `#F7F6F1`; cards, empty states, and summary surfaces `#FEFDFA`; controls `#FFFFFF`                |
| Border           | `1px #E7E5DE` for search, filters, summary cards, row cards, icons, and empty-state shells            |
| Border radius    | `16px` card/list radius; `14px` row icon/badge radius; `20px` empty icon shell; `999px` pills/buttons |
| Text - primary   | `#1A1A1A`; screen title `Sora_600SemiBold 28px`; row/action text `IBMPlexSans_600SemiBold 16px`       |
| Text - secondary | `#6E6D68` `IBMPlexSans_500Medium 14px`; summary labels are uppercase/tracked `11px`                   |
| Spacing          | `24px` screen gutters; `16px` row padding; `10px` summary-card gap; `12px` card horizontal padding    |
| Hover state      | Pressed opacity `0.65-0.72` for controls and cards; haptics on filter pills and primary actions       |
| Shadow           | None                                                                                                  |
| Accent usage     | Debt `#E85D5D`; credit `#4CAF82`; Net `#E85D5D`/`#4CAF82`; active pills and primary CTAs `#1A1A1A`    |

**Pattern notes:**
Groups list rows are visually one stacked card: first row owns top radius, last row owns bottom radius, and all rows keep a light bottom divider. Do not use swipe actions inside the stacked group list, because exposed actions break the card shape and can leave rows visually offset. Group row icons use the saved Lucide icon name from group creation before falling back to initials. Each row now uses a compact colored balance pill (red/green/muted background) instead of verbose text. Subtitle shows member count + relative time since last activity (e.g., "3 participants · 2d ago"). Summary metrics include Groups count, You owe, Owed, and Net balance. Empty state integrates a "Create Group" CTA inline inside the card. Staggered entrance animations (FadeInDown with per-row delay) apply on initial mount.

### Group Detail

File: src/features/groups/screens/GroupDetailScreen.tsx
Last updated: 2026-07-12

| Property         | Class / Value                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| Background       | App `#F7F6F1`; cards and list surfaces `#FEFDFA`; controls `#FFFFFF`                                             |
| Border           | `1px #E7E5DE` for header buttons, balance card, lists, debt rows, action bar, invite card, and empty shells      |
| Border radius    | `16px` cards/lists; `12px` inner panels; `999px` header/action buttons and member pills                          |
| Text - primary   | `#1A1A1A`; header title `Sora_600SemiBold 24px`; section headers `IBMPlexSans_600SemiBold 16px`                  |
| Text - secondary | `#6E6D68` `IBMPlexSans_500Medium 14px`; debt row labels `IBMPlexSans_500Medium 14px`                             |
| Spacing          | `24px` screen gutters; `32px` section bottom margin; `16-20px` card padding; `12px` member pill gap              |
| Hover state      | Pressed opacity `0.65` for icon buttons; background `UI.color.subtle` on debt rows; spring scale on action pills |
| Shadow           | None                                                                                                             |
| Accent usage     | Debt `#E85D5D`; credit `#4CAF82`; settled state `#6E6D68`; progress bar `#1A1A1A`                                |

**Pattern notes:**
Group detail uses a native-style custom header (back button, GroupIconBadge + name, settings gear), followed by a horizontal scrollable member avatars row showing each member's name and net balance in a compact pill. The BalanceCard provides you-owe / owed-to-you split with tinted inner panels and settle CTAs. Below are Group Balances (pairwise debt rows with semantic coloring and "owes" labels) and Transactions (expense list using TransactionRow with CategoryIconBadge). "Settle Up" in the bottom action bar is hidden when the group is all settled. The "Add Expense" button then becomes full-width. Styles are extracted to a module-level `StyleSheet.create` constant for reduced re-render overhead.

### Balance Pill (GroupCard)

File: src/features/groups/components/GroupCard.tsx
Last updated: 2026-07-12

| Property         | Class / Value                                                                        |
| ---------------- | ------------------------------------------------------------------------------------ |
| Background       | Settled: `UI.color.subtle`; owe: `UI.color.dangerTint`; owed: `UI.color.successTint` |
| Border           | None                                                                                 |
| Border radius    | `999px` pill                                                                         |
| Text - primary   | `IBMPlexSans_600SemiBold`, `12px`; settled: `UI.color.muted`; owe: `UI.color.danger` |
| Text - secondary | N/A                                                                                  |
| Spacing          | `10px` horizontal padding; `26px` height                                             |
| Hover state      | None (inside parent card press)                                                      |
| Shadow           | None                                                                                 |
| Accent usage     | Red tint for negative balance, green tint for positive, neutral for settled          |

**Pattern notes:**
Compact balance indicator pill used inside GroupCard rows. Replaces verbose "You owe $X" / "Owes you $X" text with a compact tinted chip showing just the amount. Color communicates direction (red = you owe, green = you're owed). "Settled" shows as a neutral muted chip. Amount format includes currency symbol via `formatAmount`. Size constrained to ~26px height for compact row layout.

### Friends List

File: src/features/friends/screens/FriendsScreen.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| Background       | App `#F7F6F1`; rows, attention card, empty state, and summary shell `#FEFDFA`; controls `#FFFFFF`                |
| Border           | `1px #E7E5DE` for search, filters, summary cells, attention rows, balance pills, and stacked friend rows         |
| Border radius    | `16px` outer card/list radius; `12px` summary cells; `18px` empty icon shell; `999px` search/filter/action pills |
| Text - primary   | `#1A1A1A`, headings `Sora_600SemiBold`, row/action text `IBMPlexSans_600SemiBold`                                |
| Text - secondary | `#6E6D68`, `IBMPlexSans_500Medium`; count/meta text `#9B9A94`                                                    |
| Spacing          | `20px` screen gutters; `14px` list/card horizontal padding; `12px` row vertical padding; `8-10px` chip gaps      |
| Hover state      | Pressed opacity `0.62-0.75`; haptics on primary icon, row, and refresh interactions                              |
| Shadow           | None                                                                                                             |
| Accent usage     | Debt `#E85D5D` on owe states; credit `#4CAF82` on owed states; primary actions and active chips `#1A1A1A`        |

**Pattern notes:**
Friends list now uses the quiet-ledger pattern: a warm summary shell, a conditional `Needs attention` card, search, count filters, then grouped stacked rows by balance state. Keep balance meaning in semantic red/green only; do not use decorative accent color for neutral contacts. Rows should stay compact and native: framed avatar, name, recent expense or source, right-aligned balance pill, and one contextual action (`Remind`, `Settle`, or `Add`). Friend requests belong in the attention card above search with compact accept/reject icon buttons. Shared-group-only contacts should remain visible but labeled through row metadata and guarded on removal.

### Add Expense Screen

File: src/features/expenses/screens/NewExpenseScreen.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Background       | Full-screen app `#F7F6F1`; cards/lists `#FEFDFA`; controls `#FFFFFF`                                        |
| Border           | `1px #E7E5DE` for header/action dividers, cards, rows, pills, inputs, and icon shells                       |
| Border radius    | Cards/lists `16px`; inner panels/inputs `12px`; avatar/icon shells `16-18px`; chips and primary CTA `999px` |
| Text - primary   | `#1A1A1A`; screen title and amount use `Sora_600SemiBold`; working UI uses `IBMPlexSans_600SemiBold`        |
| Text - secondary | `#6E6D68`, `IBMPlexSans_500Medium`; section labels are uppercase/tracked `11px`                             |
| Spacing          | `20px` screen gutters; `16-18px` card padding; `20px` form section rhythm; `8-12px` chip/list gaps          |
| Hover state      | Pressed opacity `0.72` or row background `#FBF7F2`; selections use haptic feedback                          |
| Shadow           | None                                                                                                        |
| Accent usage     | Primary CTA `#8C7A6B`; active controls `#1A1A1A`; balanced `#4CAF82`; split warnings `#E85D5D`              |

**Pattern notes:**
Expense creation is now a real full-screen route, not a bottom sheet or transparent modal. Use a safe-area native header, a scrollable task body, and a fixed bottom action bar. The flow remains two-step when no context is preselected: search plus segmented `Friends` / `Groups`, stacked warm-surface rows, visible multi-select chips, then the form after `Continue`. The form should keep context, amount/title, and split preview near the top, followed by inline detail controls, category chips, payer chips, split method cards, and participant rows. Avoid reintroducing Gorhom sheet wrappers, sheet footers, or popover-first form controls for this screen; inline controls are the production pattern here.

### Member Avatar

File: src/components/ui/MemberAvatar.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| Background       | Outer shell `#FFFFFF`; inner fill uses curated muted tones like `#F5E7DD`, `#E3ECEB`, `#E6E8F1`, or neutral `#F0ECE7` |
| Border           | Outer `1px #E8E4DF`; stack overlap ring `2px #F5F0EB`                                                                 |
| Border radius    | `12px` small, `18px` medium, `22px` large                                                                             |
| Text - primary   | Initials use `CrimsonText_700Bold`; ink tones use muted hues like `#9A5F3E`, `#4B7772`, `#5C648F`                     |
| Text - secondary | Overflow count uses `#8A8782`                                                                                         |
| Spacing          | `2-3px` inner inset between shell and fill                                                                            |
| Hover state      | None                                                                                                                  |
| Shadow           | None                                                                                                                  |
| Accent usage     | Positive `#E5F3EA` / `#3F7F61`; negative `#F8E6E3` / `#B25B52`; curated muted fallback palette per user ID            |

**Pattern notes:**
User avatars should match the warm framed-control language rather than render as raw circles or flat tiles. Default list avatars use a white shell with a soft inner color field, rounded-rectangle corners, and bold serif initials. The fallback palette should stay earthy and muted so rows feel consistent even when many avatars appear together; avoid saturated primaries or neon pastel mixes. Medium avatars should align with `48px` row icon rhythm, while stacks overlap with a warm app-background ring so they stay legible on cream surfaces. Remote avatar images should fill the inner shape directly and keep the same framing as initials fallbacks.

### Group Icon Badge

File: src/components/ui/GroupIconBadge.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Background       | Outer shell `#FFFFFF`; inner fill uses curated muted tones like `#F5E7DD`, `#E3ECEB`, `#E6E8F1`            |
| Border           | Outer `1px #E8E4DF`                                                                                        |
| Border radius    | `14px` small, `18px` medium, `22px` large                                                                  |
| Text - primary   | Fallback initials use `CrimsonText_700Bold`; icon ink uses muted hues like `#9A5F3E`, `#4B7772`, `#5C648F` |
| Text - secondary | None                                                                                                       |
| Spacing          | `2-3px` inner inset between shell and fill                                                                 |
| Hover state      | None                                                                                                       |
| Shadow           | None                                                                                                       |
| Accent usage     | Warm-muted palette only; avoid bright category-chip colors for persistent group identity                   |

**Pattern notes:**
Group icons should use the same framed editorial language as avatars, but with slightly stronger icon presence. Persistent group identity badges on dashboard rows, groups lists, and group headers should use a white shell plus a muted inner tone keyed by group ID, rather than hardcoded bright pastel blocks. Fallback initials or emoji should inherit the same ink color as Lucide icons so mixed data sources still feel consistent.

### Category Icon Badge

File: src/components/ui/CategoryIconBadge.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Background       | Outer shell `#FFFFFF`; inner fill uses category-specific muted tones like `#F5E7DD`, `#E3ECEB`, `#E6E8F1`, `#EEE7F2` |
| Border           | Outer `1px #E8E4DF`                                                                                                  |
| Border radius    | `14px` small, `18px` medium, `22px` large                                                                            |
| Text - primary   | Lucide icon ink uses muted tones like `#9A5F3E`, `#4B7772`, `#5C648F`, `#7B668D`                                     |
| Text - secondary | None                                                                                                                 |
| Spacing          | `2-3px` inner inset between shell and fill                                                                           |
| Hover state      | None                                                                                                                 |
| Shadow           | None                                                                                                                 |
| Accent usage     | Keep category distinction through restrained muted color pairs, not bright product-style chips                       |

**Pattern notes:**
Category icons should follow the same white-shell framing system as avatars and group icons, but preserve semantic distinction between categories through a curated muted palette. Transaction rows, expense detail headers, and compact spending summaries should all use this badge rather than flat colored squares or black-only icon plates. Category color should read as editorial and subdued, not dashboard-chart bright.

### Currency Selector Bottom Sheet

File: src/components/forms/CurrencySelector.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Background       | Sheet `#F5F0EB`; selection cards `#FFFCF8`; controls `#FFFFFF`; current card tint `#F7F1EA`            |
| Border           | `1px #E8E4DF` for trigger, search pill, cards, and meta pills; selected card border `#000000`          |
| Border radius    | Trigger and cards `16px`; icon shells `18px`; search and metadata pills `999px`; selected badge `14px` |
| Text - primary   | `#000000`, `CrimsonText_700Bold`; sheet title uses `UnicaOne_400Regular`                               |
| Text - secondary | `#8A8782`, `CrimsonText_600SemiBold`; labels are uppercase/tracked `11px`                              |
| Spacing          | `24px` sheet gutters; `16px` card padding; `10px` card stack gap; `12-14px` inline gaps                |
| Hover state      | Pressed opacity from `PressableFeedback`; selection uses haptic feedback                               |
| Shadow           | None                                                                                                   |
| Accent usage     | Brand hint text `#8C7A6B`; active selection uses black fill instead of brand fill                      |

**Pattern notes:**
Bottom-sheet selectors should match the newer warm card system rather than older square-field forms. The trigger reads as a compact summary card with a framed icon shell, primary code, secondary name, and a small `Change` affordance. Inside the sheet, use an editorial title, a short explanatory subtitle, a pill search field, then stacked rounded cards for options. When there is a current or common choice, surface it explicitly with section labels and compact pills such as `Current` or `Popular` so users can decide quickly without scanning the whole list.

### Typography System

File: src/app/_layout.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Background       | N/A                                                                                       |
| Border           | N/A                                                                                       |
| Border radius    | N/A                                                                                       |
| Text - primary   | Headings `Sora_600SemiBold`; functional emphasis `IBMPlexSans_600SemiBold`                |
| Text - secondary | Body and helper copy `IBMPlexSans_400Regular`; supporting UI text `IBMPlexSans_500Medium` |
| Spacing          | N/A                                                                                       |
| Hover state      | N/A                                                                                       |
| Shadow           | N/A                                                                                       |
| Accent usage     | Typography contrast comes from family change, not decorative text treatments              |

**Pattern notes:**
Use `Sora` only where hierarchy needs a clear visual shift: screen titles, bottom-sheet titles, large card headings, and key amount callouts. Keep all functional UI copy in `IBM Plex Sans` so buttons, inputs, row metadata, and dense list content stay sharp and product-like. Avoid mixing additional expressive fonts into the interface; the system depends on the contrast between one restrained display face and one structured utility sans.

### Friend Detail Screen

File: src/features/friends/screens/FriendDetailScreen.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Background       | App `#F7F6F1`; cards and stacked list surfaces `#FEFDFA`; controls `#FFFFFF`                  |
| Border           | `1px #E7E5DE` for header buttons, balance card, lists, option icons, and bottom action bar    |
| Border radius    | `16px` cards/lists; `14px` option icon shells; `999px` header/action buttons                  |
| Text - primary   | `#1A1A1A`; screen title and amount `Sora_600SemiBold`; rows/actions `IBMPlexSans_600SemiBold` |
| Text - secondary | `#6E6D68`, `IBMPlexSans_500Medium`; tertiary chevrons/meta `#9B9A94`                          |
| Spacing          | `24px` screen gutters; `24px` balance-card padding; `14-16px` row padding; `12px` action gap  |
| Hover state      | Pressed opacity `0.62-0.8`; row press background `#FBF7F2`; success haptic after removal      |
| Shadow           | None                                                                                          |
| Accent usage     | Debt `#E85D5D`; credit `#4CAF82`; primary add action `#8C7A6B`; no decorative accent          |

**Pattern notes:**
Friend detail should behave like a warm ledger detail surface: a compact native header, one central balance card with action-oriented copy, optional shared-context sections, and a fixed bottom action bar. Do not show disabled settlement actions when the balance is already settled; make `Add Expense` the single primary action instead. Friend options belong in a dynamic bottom sheet with row icons, direct share/contact actions, and guarded destructive removal for direct friendships only. Shared groups and category spending should use the framed `GroupIconBadge` and `CategoryIconBadge` systems instead of ad hoc colored squares.

### Bottom Tab Navigation

File: src/app/(tabs)/_layout.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                              |
| ---------------- | -------------------------------------------------------------------------- |
| Background       | Tab bar `#FFFFFF` over app content                                         |
| Border           | Top border `1px #E8E4DF`                                                   |
| Border radius    | None; full-width native bottom chrome                                      |
| Text - primary   | No visible labels; accessibility labels only                               |
| Text - secondary | Inactive icons `#8E8E93`                                                   |
| Spacing          | Four equal-width tabs; `10px` vertical icon area; safe-area bottom padding |
| Hover state      | Pressed opacity `0.72`; light haptic when changing tabs                    |
| Shadow           | Android elevation `8`; iOS top shadow `0 -1px 8px rgba(0,0,0,0.05)`        |
| Accent usage     | Active icon and indicator dot `#1A1A1A`; inactive icons stay neutral       |

**Pattern notes:**
Primary bottom navigation should contain only core destinations: Dashboard, Groups, Friends, and Activity. Creation actions such as `Add Expense` belong in contextual dashboard controls, not as a center tab. Profile access should be launched from the dashboard header so account settings do not compete with task destinations in the tab bar.

### PressableScale

File: src/components/ui/native-ui.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                             |
| ---------------- | ------------------------------------------------------------------------- |
| Background       | None (wraps children)                                                     |
| Border           | None                                                                      |
| Border radius    | None                                                                      |
| Text - primary   | N/A                                                                       |
| Text - secondary | N/A                                                                       |
| Spacing          | N/A                                                                       |
| Hover state      | Spring scale to `0.97` on pressIn, restores on pressOut (Animated.spring) |
| Shadow           | None                                                                      |
| Accent usage     | N/A                                                                       |

**Pattern notes:**
Generic pressable wrapper that applies a subtle spring scale-down animation. Accepts `scaleTo` prop to customize intensity. Uses `Animated.spring` with mass 0.3, stiffness 200, damping 12. Suitable for any touchable content that needs a tactile feedback without haptics.

### PrimaryButton

File: src/components/ui/native-ui.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                         |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | Charcoal `UI.color.text` by default; brand `UI.color.brand`; danger `UI.color.danger` |
| Border           | None                                                                                  |
| Border radius    | `999px` pill                                                                          |
| Text - primary   | `#FFFFFF`, `IBMPlexSans_600SemiBold`, `16px`                                          |
| Text - secondary | N/A                                                                                   |
| Spacing          | `20px` horizontal padding; `52px` min height                                          |
| Hover state      | Disabled opacity `0.45`; pressed/loading opacity `0.78`                               |
| Shadow           | None                                                                                  |
| Accent usage     | Tone prop controls fill color: `ink`, `brand`, or `danger`                            |

**Pattern notes:**
Use as the primary CTA in forms, screens, and dialogs. Accepts `loading` (shows ActivityIndicator) and `disabled` states. Always full-width pill shape. For secondary or ghost actions, use a custom Pressable with outlined styling instead.

### IconButton

File: src/components/ui/native-ui.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                |
| ---------------- | ---------------------------------------------------------------------------- |
| Background       | Control white `UI.color.control`                                             |
| Border           | `1px` `UI.color.border`                                                      |
| Border radius    | `999px` pill                                                                 |
| Text - primary   | N/A                                                                          |
| Text - secondary | N/A                                                                          |
| Spacing          | `44x44` touch target; icon `20px` size                                       |
| Hover state      | Pressed opacity `0.6`                                                        |
| Shadow           | None                                                                         |
| Accent usage     | `tone="danger"` colors icon `UI.color.danger`; default icons `UI.color.text` |

**Pattern notes:**
Compact circular icon button for header actions, back navigation, and inline controls. Always use with an `accessibilityLabel` for screen readers. Lucide icon is passed as a component prop. Supports `tone` for semantic coloring.

### SectionLabel

File: src/components/ui/native-ui.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                          |
| ---------------- | -------------------------------------------------------------------------------------- |
| Background       | None                                                                                   |
| Border           | None                                                                                   |
| Border radius    | None                                                                                   |
| Text - primary   | `IBMPlexSans_600SemiBold`, `11px`, `UI.color.muted`, uppercase, `1.2px` letter-spacing |
| Text - secondary | N/A                                                                                    |
| Spacing          | None                                                                                   |
| Hover state      | None                                                                                   |
| Shadow           | None                                                                                   |
| Accent usage     | N/A                                                                                    |

**Pattern notes:**
Uppercase section label for grouping form fields, list sections, or filter areas. Wraps text in HeroUI `Typography` with consistent label styling. Do not use for body copy or headlines; reserved for structural metadata only.

### SearchField

File: src/components/ui/native-ui.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                |
| ---------------- | ---------------------------------------------------------------------------- |
| Background       | Control white `UI.color.control`                                             |
| Border           | `1px` `UI.color.border`                                                      |
| Border radius    | `UI.radius.lg` (`16px`)                                                      |
| Text - primary   | `IBMPlexSans_500Medium`, `16px`, `UI.color.text`                             |
| Text - secondary | Placeholder `UI.color.muted`                                                 |
| Spacing          | `16px` horizontal padding; `52px` min height; `12px` left icon gap           |
| Hover state      | None                                                                         |
| Shadow           | None                                                                         |
| Accent usage     | Search icon `UI.color.muted`; clear button `XCircle` icon on non-empty value |

**Pattern notes:**
Consistent search field used across groups, friends, and selection screens. Includes a Lucide Search icon on the left and optional clear button on the right. Supports `onClear` and `rightElement` props for custom action buttons (e.g., add friend). Matches the card radius system.

### ScreenHeader

File: src/components/ui/native-ui.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                       |
| ---------------- | ------------------------------------------------------------------- |
| Background       | None (transparent, app background shows through)                    |
| Border           | None                                                                |
| Border radius    | None                                                                |
| Text - primary   | `Sora_600SemiBold`, `28px`, `UI.color.textStrong`, `-0.3px` spacing |
| Text - secondary | N/A                                                                 |
| Spacing          | `UI.space.page` horizontal padding; `16px` vertical padding         |
| Hover state      | None                                                                |
| Shadow           | None                                                                |
| Accent usage     | Back button is an `IconButton` with `ArrowLeft`                     |

**Pattern notes:**
Native-style screen header with title and optional back button + right action. Used for feature screens that need a clear hierarchy without a full navigation bar. The back button appears as a pill icon button when `onBackPress` is provided.

### MetricCell

File: src/components/ui/native-ui.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Background       | Neutral: `UI.color.control`; success: `#F5FCF8`; danger: `#FFF7F5`; brand: `UI.color.bg`    |
| Border           | `1px` `UI.color.border`                                                                     |
| Border radius    | `UI.radius.md` (`12px`)                                                                     |
| Text - primary   | Value uses `IBMPlexSans_600SemiBold`, `16px`, tone-colored                                  |
| Text - secondary | Label uses `IBMPlexSans_600SemiBold`, `11px`, `UI.color.muted`, uppercase, `0.8px` tracking |
| Spacing          | `12px` vertical/horizontal padding; `5px` gap between label and value                       |
| Hover state      | None                                                                                        |
| Shadow           | None                                                                                        |
| Accent usage     | Tone `success`/`danger`/`brand` changes value color and background tint                     |

**Pattern notes:**
Compact metric display cell for dashboard summaries, balance breakdowns, and stat grids. Use `tone` to signal meaning: green for positive balances, red for debts, brand for special emphasis, neutral for general counts. The label is always uppercase/tracked metadata.

### FilterPill

File: src/components/ui/native-ui.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                   |
| ---------------- | ------------------------------------------------------------------------------- |
| Background       | Active: `UI.color.text`; inactive: `UI.color.control`                           |
| Border           | Active: `1px` `UI.color.text`; inactive: `1px` `UI.color.border`                |
| Border radius    | `999px` pill                                                                    |
| Text - primary   | `IBMPlexSans_600SemiBold`, `13px`; active: `#FFFFFF`, inactive: `UI.color.text` |
| Text - secondary | N/A                                                                             |
| Spacing          | `14px` horizontal padding; `44px` min height                                    |
| Hover state      | Pressed opacity `0.72`; triggers `Haptics.selectionAsync()` on press            |
| Shadow           | None                                                                            |
| Accent usage     | Active state uses charcoal fill with white text                                 |

**Pattern notes:**
Toggle pill for filter rows, category selectors, and stateful controls. Use `isActive` to toggle visual state. Always includes haptic feedback on press. Active pills invert to dark fill with light text for clear distinction.

### ListSection

File: src/components/ui/native-ui.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Background       | None                                                                                                           |
| Border           | None                                                                                                           |
| Border radius    | None                                                                                                           |
| Text - primary   | `IBMPlexSans_600SemiBold`, `18px`, `UI.color.text`, `-0.2px` spacing                                           |
| Text - secondary | N/A                                                                                                            |
| Spacing          | `UI.space.page` horizontal padding for header; `14px` bottom margin on header; `28px` bottom margin on section |
| Hover state      | None                                                                                                           |
| Shadow           | None                                                                                                           |
| Accent usage     | Optional `rightAction` for header-level controls                                                               |

**Pattern notes:**
Standard list section wrapper with a bold section header and optional right-aligned action (e.g., "See All" link). Children render below the header. Section headers use body-semibold styling rather than uppercase labels for better readability in list contexts.

### EmptyState

File: src/components/ui/native-ui.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Background       | Surface ivory `UI.color.surface`                                                                  |
| Border           | `1px` `UI.color.border`                                                                           |
| Border radius    | `UI.radius.lg` (`16px`)                                                                           |
| Text - primary   | `IBMPlexSans_600SemiBold`, `18px`, `UI.color.text`, centered                                      |
| Text - secondary | `IBMPlexSans_500Medium`, `15px`, `UI.color.muted`, centered, `21px` lineHeight                    |
| Spacing          | `32px` padding all sides; `16px` gap between icon and title; `8px` gap between title and subtitle |
| Hover state      | None                                                                                              |
| Shadow           | None                                                                                              |
| Accent usage     | Icon shell `64x64` rounded `UI.radius.xl` with border                                             |

**Pattern notes:**
Generic empty state card for lists, search results, and data-free screens. Accepts a Lucide icon component, title, and subtitle. The icon is rendered inside a framed `64x64` shell matching the card framing system. Use clear, actionable copy that guides users to the next step.

### Card

File: src/components/ui/Card.tsx
Last updated: 2026-07-11

| Property         | Class / Value                        |
| ---------------- | ------------------------------------ |
| Background       | `UI.color.surface`                   |
| Border           | `1px` `UI.color.border`              |
| Border radius    | `UI.radius.lg` (`16px`)              |
| Text - primary   | N/A (inherits from children)         |
| Text - secondary | N/A                                  |
| Spacing          | Default `16px` padding; configurable |
| Hover state      | None                                 |
| Shadow           | None                                 |
| Accent usage     | N/A                                  |

**Pattern notes:**
Minimal card wrapper consistent with the design system. No shadow by default. Accepts `padding` prop (default `16px`). Used as the base container for dashboard cards, form sections, list summaries, and any grouped content surface.

### ListRow

File: src/components/ui/ListRow.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Background       | None (transparent, parent surface shows through)                                            |
| Border           | Bottom border `1px` `UI.color.border`; suppressed when `isLast`                             |
| Border radius    | None                                                                                        |
| Text - primary   | Title: `IBMPlexSans_600SemiBold`, `16px`, `UI.color.text`                                   |
| Text - secondary | Subtitle: `IBMPlexSans_500Medium`, `13px`, `UI.color.muted`                                 |
| Spacing          | `14px` vertical padding; `16px` horizontal padding; `14px` leading gap; `12px` trailing gap |
| Hover state      | Pressed opacity `0.62` when interactive                                                     |
| Shadow           | None                                                                                        |
| Accent usage     | Leading element (icon/avatar) and trailing element (balance pill/chevron)                   |

**Pattern notes:**
Configurable list row with leading visual, title, optional subtitle, and trailing element. Supports `onPress` for navigation/action. The last row in a list suppresses its bottom border to avoid double-borders with the parent card. For grouping with card radius, wrap rows in a Card component and use `isLast` on the final row.

### BottomActionBar

File: src/components/ui/BottomActionBar.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Background       | App background `UI.color.bg`                                                                                  |
| Border           | Top border `1px` `UI.color.border`                                                                            |
| Border radius    | None                                                                                                          |
| Text - primary   | N/A (from children)                                                                                           |
| Text - secondary | N/A                                                                                                           |
| Spacing          | `UI.space.page` horizontal padding; `16px` top padding; safe-area bottom padding; `12px` gap between children |
| Hover state      | None                                                                                                          |
| Shadow           | None                                                                                                          |
| Accent usage     | N/A                                                                                                           |

**Pattern notes:**
Fixed bottom action bar attached to the bottom of scrollable screens. Uses safe-area insets for proper bottom padding. Designed to hold one or two action buttons (e.g., Continue, Cancel). Renders children in a row with gap.

### AmountDisplay

File: src/components/ui/AmountDisplay.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                          |
| ---------------- | ---------------------------------------------------------------------- |
| Background       | None                                                                   |
| Border           | None                                                                   |
| Border radius    | None                                                                   |
| Text - primary   | Amount: sized by prop (`sm`/`md`/`lg`/`xl`), tone-colored if `colored` |
| Text - secondary | Currency code: `body-xs`, `text-muted`                                 |
| Spacing          | `2px` gap between amount and currency label                            |
| Hover state      | None                                                                   |
| Shadow           | None                                                                   |
| Accent usage     | Positive amounts: `text-success`; negative: `text-danger`              |

**Pattern notes:**
Standardized currency amount display with formatting (millions compact, locale-aware decimals, zero-decimal currencies). Supports `colored` (semantic green/red for positive/negative) and `showSign` (+/- prefix) props. Currency code shown as muted subtitle. Zero amounts render in neutral text color.

### Skeleton

File: src/components/ui/Skeleton.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                 |
| ---------------- | --------------------------------------------- |
| Background       | Subtle `UI.color.subtle`                      |
| Border           | None                                          |
| Border radius    | Configurable, default `UI.radius.md` (`12px`) |
| Text - primary   | N/A                                           |
| Text - secondary | N/A                                           |
| Spacing          | Configurable width and height                 |
| Hover state      | None (pulsing animation)                      |
| Shadow           | None                                          |
| Accent usage     | N/A                                           |

**Pattern notes:**
Loading placeholder with pulse animation (opacity oscillates between 0.3-0.6 with 800ms duration). Includes pre-built `CardSkeleton` and `ListRowSkeleton` variants for common loading patterns. Width defaults to 100% if not specified. Use inside loading states while data is being fetched.

### HapticButton

File: src/components/ui/HapticButton.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Background       | Ink: `UI.color.text`; brand: `UI.color.brand`; danger: `UI.color.danger`; outlined: `UI.color.control` |
| Border           | Outlined: `1px` `UI.color.border`; others: none                                                        |
| Border radius    | `999px` pill                                                                                           |
| Text - primary   | `IBMPlexSans_600SemiBold`, `16px`; filled: `#FFFFFF`, outlined: `UI.color.text`                        |
| Text - secondary | N/A                                                                                                    |
| Spacing          | `20px` horizontal padding; configurable height (default `56px`); `8px` gap                             |
| Hover state      | Disabled opacity `0.45`; pressed/loading opacity `0.78`; haptic on press                               |
| Shadow           | None                                                                                                   |
| Accent usage     | `tone` controls fill color, border, and text color                                                     |

**Pattern notes:**
Full-featured action button with haptic feedback (`ImpactFeedbackStyle.Medium`). Supports filled (`ink`, `brand`, `danger`) and outlined tones. Accepts `loading` state with ActivityIndicator. Use for primary form actions, destructive confirmations, and key CTAs where tactile feedback enhances UX.

### ErrorState

File: src/components/ui/ErrorState.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Background       | Surface ivory `UI.color.surface`                                                                              |
| Border           | `1px` `UI.color.border`                                                                                       |
| Border radius    | `UI.radius.lg` (`16px`)                                                                                       |
| Text - primary   | `IBMPlexSans_600SemiBold`, `17px`, `UI.color.text`, centered                                                  |
| Text - secondary | `IBMPlexSans_500Medium`, `14px`, `UI.color.muted`, centered                                                   |
| Spacing          | `32px` padding; `16px` bottom margin on icon; `8px` bottom margin on title; `UI.space.page` horizontal margin |
| Hover state      | "Try Again" button pressed opacity `0.75`                                                                     |
| Shadow           | None                                                                                                          |
| Accent usage     | AlertCircle icon in `UI.color.danger` in `#FFF7F5` tinted shell                                               |

**Pattern notes:**
Card error state with icon, title, message, and optional retry button. Use inside screens and modals when data fetching fails. The retry button is a compact charcoal pill labeled "Try Again". Accepts custom `title` and `message` props for context-specific messaging.

### Toast

File: src/components/ui/Toast.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Background       | Surface ivory `UI.color.surface`                                                                            |
| Border           | `1px` `UI.color.border`                                                                                     |
| Border radius    | `UI.radius.lg` (`16px`)                                                                                     |
| Text - primary   | Label: `IBMPlexSans_600SemiBold`, `15px`, `UI.color.text`                                                   |
| Text - secondary | Description: `IBMPlexSans_500Medium`, `13px`, `UI.color.muted`                                              |
| Spacing          | `16px` horizontal padding; `14px` vertical padding; `14px` icon-container gap; `12px` dismiss button margin |
| Hover state      | Dismiss button pressed opacity `0.6`                                                                        |
| Shadow           | Toast lift: `0 4px 8px rgba(0,0,0,0.1)`, elevation 5                                                        |
| Accent usage     | Variant icon: danger `UI.color.danger`, success `UI.color.success`, default `UI.color.text`                 |

**Pattern notes:**
Animated toast notification with entering/exiting transitions (FadeInDown/FadeOutUp via reanimated). Variants: `danger`, `success`, or default. Includes framed icon shell, label, description, and dismiss button. Designed for use with a toast manager; the `props` and `options` shape is compatible with common RN toast libraries.

### MoneySignal

File: src/components/ui/MoneySignal.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                            |
| ---------------- | ------------------------------------------------------------------------ |
| Background       | Danger: `#FFF7F5`; success: `#F5FCF8`; neutral: `UI.color.control`       |
| Border           | `1px` `UI.color.border`                                                  |
| Border radius    | `UI.radius.md` (`12px`)                                                  |
| Text - primary   | Value: `IBMPlexSans_600SemiBold`, `18px`, tone-colored, `-0.2px` spacing |
| Text - secondary | Label: `IBMPlexSans_500Medium`, `12px`, `UI.color.muted`                 |
| Spacing          | `12px` padding; `4px` gap between label and value                        |
| Hover state      | None                                                                     |
| Shadow           | None                                                                     |
| Accent usage     | Danger tone: debt red; success: credit green; neutral: muted             |

**Pattern notes:**
Semantic money signal cell for displaying financial amounts with context. The `tone` prop controls background tint, text color, and label. Use for balance summary breakdowns (owes you / you owe / settled). Matches the `MetricCell` pattern but specialized for money semantics.

### SheetContainer

File: src/components/ui/SheetContainer.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Background       | App background `UI.color.bg` with `borderRadius: 0`                                          |
| Border           | None                                                                                         |
| Border radius    | `0` (square top edge)                                                                        |
| Text - primary   | N/A (from children)                                                                          |
| Text - secondary | N/A                                                                                          |
| Spacing          | `UI.space.page` horizontal padding; `24px` top padding; safe-area bottom padding; `20px` gap |
| Hover state      | None                                                                                         |
| Shadow           | None                                                                                         |
| Accent usage     | Handle indicator: `UI.color.muted`, `40px` width                                             |

**Pattern notes:**
Gorhom bottom sheet wrapper with standard backdrop, square top edges, and safe area insets. Exposes `present()` and `dismiss()` via ref (`SheetContainerHandle`). Default snap to first index with dynamic sizing enabled. Backdrop appears on index 0, press-to-close. Use for selectors, filters, and confirmation content.

### SheetBackground

File: src/components/ui/SheetBackground.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                              |
| ---------------- | ---------------------------------------------------------- |
| Background       | iOS: transparent BlurView; Android: `UI.color.surface`     |
| Border           | None                                                       |
| Border radius    | None (`borderTopLeftRadius: 0`, `borderTopRightRadius: 0`) |
| Text - primary   | N/A                                                        |
| Text - secondary | N/A                                                        |
| Spacing          | N/A                                                        |
| Hover state      | None                                                       |
| Shadow           | None                                                       |
| Accent usage     | N/A                                                        |

**Pattern notes:**
Platform-aware sheet background component. Uses `expo-blur` with `BlurView` on iOS (intensity 90, light tint) and a solid `UI.color.surface` on Android. Pass as `backgroundComponent` prop to Gorhom `BottomSheetModal` for frosted-glass sheet appearance on iOS.

### AppLoader

File: src/components/ui/AppLoader.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                          |
| ---------------- | ---------------------------------------------------------------------- |
| Background       | `#F5F0EB` when fullScreen; none otherwise                              |
| Border           | None                                                                   |
| Border radius    | None                                                                   |
| Text - primary   | `Sora_600SemiBold`, `16px`, `#8C7A6B`, `4px` letter-spacing, uppercase |
| Text - secondary | N/A                                                                    |
| Spacing          | `24px` padding; `16px` gap between spinner and text                    |
| Hover state      | None                                                                   |
| Shadow           | None                                                                   |
| Accent usage     | Rotating square border (`#8C7A6B`) + brand-toned text                  |

**Pattern notes:**
Animated app-level loading screen with a rotating square (2000ms full rotation) and pulsing scale effect. Full-screen mode sets flex: 1 with warm background. Text reads "LOADING" in tracked uppercase with brand taupe color. Use during initial app load, splash transitions, or blocking operations.

### FormInput

File: src/components/forms/FormInput.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Background       | Control white `UI.color.control`                                                                        |
| Border           | Default: `1px` `UI.color.border`; focus: `UI.color.text`; error: `UI.color.danger`                      |
| Border radius    | `UI.radius.md` (`12px`)                                                                                 |
| Text - primary   | Input: `IBMPlexSans_500Medium`, `16px`, `UI.color.text`                                                 |
| Text - secondary | Label: uppercase `11px` tracked; error: `13px` danger; description: `13px` muted                        |
| Spacing          | `52px` height; `16px` horizontal padding (with left/right element spacing `48px`); `16px` bottom margin |
| Hover state      | Focus border highlight on `isFocused`                                                                   |
| Shadow           | None                                                                                                    |
| Accent usage     | Error border and message use `UI.color.danger`                                                          |

**Pattern notes:**
React Hook Form-controlled input field. Integrates with `Controller` from react-hook-form for validation. Supports label, description, leftElement (icon), and rightElement (action). Error state displays danger-colored border and message. Label is uppercase/tracked metadata. Uses HeroUI `TextField` + `Input` components internally.

### PasswordStrengthMeter

File: src/components/forms/PasswordStrengthMeter.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                           |
| ---------------- | --------------------------------------------------------------------------------------- |
| Background       | Three `4px` segment bars; filled: strength color, unfilled: `UI.color.border`           |
| Border           | None                                                                                    |
| Border radius    | `2px` per segment                                                                       |
| Text - primary   | Label: `IBMPlexSans_500Medium`, `12px`; color scales from muted to text                 |
| Text - secondary | N/A                                                                                     |
| Spacing          | `6px` gap between segments; `6px` gap between bars and label; `-16px` top margin        |
| Hover state      | None (LayoutAnimation on password change)                                               |
| Shadow           | None                                                                                    |
| Accent usage     | 4 strength levels: too short/weak (border), fair (muted), good (#6E6D68), strong (text) |

**Pattern notes:**
Animated password strength indicator with 3 segments and a text label. Uses `evaluatePasswordStrength` from utils. Only visible when password is non-empty. Segments fill progressively based on score (0-3). Android LayoutAnimation enabled for smooth transitions. Place below password input in register/change-password forms.

### ConfirmationSheet

File: src/components/dialogs/ConfirmationSheet.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| Background       | App background `UI.color.bg` with `borderRadius: 0`                                                                 |
| Border           | None                                                                                                                |
| Border radius    | `0` (square top edge)                                                                                               |
| Text - primary   | Title: `IBMPlexSans_600SemiBold`, `22px`, `UI.color.text`                                                           |
| Text - secondary | Description: `IBMPlexSans_500Medium`, `16px`, `UI.color.muted`                                                      |
| Spacing          | `UI.space.page` horizontal; `24px` top; safe-area bottom; `20px` gap between content and buttons; `12px` button gap |
| Hover state      | Cancel pressed opacity `0.5`; confirm pressed opacity `0.8`                                                         |
| Shadow           | None                                                                                                                |
| Accent usage     | Confirm button: danger `UI.color.danger` or brand `UI.color.brand`                                                  |

**Pattern notes:**
Destructive confirmation bottom sheet with title, description, and two-action button row. Uses `useConfirmationSheet` hook for ref management. `confirmTone` controls whether the confirm button is danger (red) or brand (taupe). Accepts optional `children` to replace default content. Trigger confirm action with 300ms delay after sheet dismiss.

### Backdrop

File: src/components/bottom-sheet/Backdrop.tsx
Last updated: 2026-07-11

| Property         | Class / Value                  |
| ---------------- | ------------------------------ |
| Background       | Black overlay at `0.4` opacity |
| Border           | None                           |
| Border radius    | None                           |
| Text - primary   | N/A                            |
| Text - secondary | N/A                            |
| Spacing          | N/A                            |
| Hover state      | None                           |
| Shadow           | None                           |
| Accent usage     | N/A                            |

**Pattern notes:**
Reusable Gorhom bottom sheet backdrop factory via `useSheetBackdrop()` hook. Returns a `renderBackdrop` callback for the `backdropComponent` prop. Disappears on index -1, appears on index 0. Press-to-close behavior. Overlay at 0.4 opacity for consistent dimming across sheets.

### PageAnimator (FocusAwareView)

File: src/components/animations/PageAnimator.tsx
Last updated: 2026-07-11

| Property         | Class / Value              |
| ---------------- | -------------------------- |
| Background       | None (transparent wrapper) |
| Border           | None                       |
| Border radius    | None                       |
| Text - primary   | N/A                        |
| Text - secondary | N/A                        |
| Spacing          | N/A                        |
| Hover state      | None                       |
| Shadow           | None                       |
| Accent usage     | N/A                        |

**Pattern notes:**
Page-level entrance animation wrapper using `useFocusEffect` from expo-router. Fades in and translates up (opacity 0->1, translateY 20->0) over 300-350ms when the screen gains focus. Supports configurable `delay` for staggered animations. Respects reduced motion preferences via `useReducedMotion` — skips animation entirely when reduced motion is enabled. Reset animation on blur/blur-unmount.

### SwipeableRow

File: src/components/layout/SwipeableRow.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                    |
| ---------------- | ---------------------------------------------------------------- |
| Background       | N/A (wraps children)                                             |
| Border           | None                                                             |
| Border radius    | Action buttons: `0`                                              |
| Text - primary   | Action labels: `body-xs`, `font-bold`, white                     |
| Text - secondary | N/A                                                              |
| Spacing          | Action button width: `72px`; `8px` gap between actions           |
| Hover state      | Haptic on action press; actions scale with drag distance         |
| Shadow           | None                                                             |
| Accent usage     | Remind: primary/black; Settle: success green; Delete: danger red |

**Pattern notes:**
Swipeable list row with configurable right actions (Remind, Settle, Delete). Uses `react-native-gesture-handler/Swipeable`. Actions animate in with scale and opacity based on drag progress. Delete action opens a confirmation bottom sheet before executing. Action icons are Lucide (Bell, CheckCircle, Trash2). Friction 2, right threshold 40px.

### GlobalQueryToast

File: src/components/feedback/GlobalQueryToast.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                  |
| ---------------- | ---------------------------------------------- |
| Background       | N/A (renders null, triggers toast side-effect) |
| Border           | N/A                                            |
| Border radius    | N/A                                            |
| Text - primary   | N/A                                            |
| Text - secondary | N/A                                            |
| Spacing          | N/A                                            |
| Hover state      | N/A                                            |
| Shadow           | N/A                                            |
| Accent usage     | N/A                                            |

**Pattern notes:**
Global error listener for React Query mutations and queries. Subscribes to the query client cache and mutation cache, displaying a danger toast on any error. Deduplicates errors within a 3-second window using a Set. Renders null (no visual output) — acts as a side-effect component. Mounted once in `AppProvider`.

### ErrorFallback

File: src/components/feedback/ErrorFallback.tsx
Last updated: 2026-07-11

| Property         | Class / Value                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Background       | App background `UI.color.bg`                                                                                    |
| Border           | Inner card: `1px` `UI.color.border`                                                                             |
| Border radius    | Inner card: `UI.radius.lg` (`16px`)                                                                             |
| Text - primary   | Title: `Sora_600SemiBold`, `24px`, `UI.color.text`                                                              |
| Text - secondary | Message: `IBMPlexSans_500Medium`, `16px`, `UI.color.muted`                                                      |
| Spacing          | `24px` outer padding; inner card `24px` padding; `12px` bottom margin on title; `24px` bottom margin on message |
| Hover state      | "Try Again" button pressed: none (static)                                                                       |
| Shadow           | None                                                                                                            |
| Accent usage     | Retry button: charcoal pill with white text                                                                     |

**Pattern notes:**
Expo Router error boundary fallback component. Matches the `ErrorBoundaryProps` type expected by Expo Router's `ErrorBoundary`. Renders centered on a full-screen warm background with a card containing title, error message, and retry button. Exported as `ErrorFallback` and used as the root layout error boundary in `_layout.tsx`.

### Profile Screen

File: src/features/profile/screens/ProfileScreen.tsx
Last updated: 2026-07-12

| Property       | Class / Value                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Background     | App background `UI.color.bg`                                                                        |
| Card surface   | `UI.color.surface` via shared `Card` component                                                      |
| Border         | `1px` `UI.color.border` (via Card or explicit)                                                      |
| Border radius  | Card: `UI.radius.lg` (`16px`); pills: `UI.radius.pill` (`999px`); metric cells: `UI.radius.md`      |
| Text - heading | User name: `24px`, `IBMPlexSans_600SemiBold`, `UI.color.text`; Section headers: `SectionLabel`      |
| Text - body    | `IBMPlexSans_500Medium`, `14px`, `UI.color.muted` for email and metadata                            |
| Action buttons | Shared `HapticButton` with `tone="outlined"` for secondary, `tone="danger"` for destructive actions |
| Settings rows  | `SettingsItem` (icon + title + subtitle + right element) for toggle/row actions                     |
| Spacing        | `24px` screen gutters; `24px` card padding; `40px` between sections; `12px` vertical between rows   |
| Hover state    | `Pressable` opacity `0.65-0.7`; `HapticButton` handles opacity + haptic feedback                    |
| Shadow         | None                                                                                                |
| Accent usage   | Owed balance `+$` in `UI.color.success`; Owe balance `-$` in `UI.color.danger`                      |

**Pattern notes:**
Profile uses the same loading-first pattern as the dashboard — skeleton placeholders during `isFirstLoad`, then a `ScrollView` with `RefreshControl`. Three sections stacked vertically: (1) tappable user card with avatar, name, email, and metric cells; (2) Preferences with Dark Mode toggle and Currency picker; (3) Account section with created date, Change Password row, Log Out/Tell a Friend outlined buttons, and a visually separated Delete Account danger action. The avatar region is pressable to navigate to `/profile/edit`. All standalone pill buttons use the shared `HapticButton` for consistent haptic feedback. Bottom sheets for delete confirmation use `HapticButton` pairs (Cancel outlined + Delete danger). The edit and change-password screens use `BottomActionBar` for their save buttons.

### Circle Dock HTML Prototype

File: design/circle-dock-redesign/prototype.css
Last updated: 2026-07-18

| Property         | Class / Value                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Background       | Canvas `#EFF6FD`; content surface `#F9FCFF`; control interior `#FFFFFF`; dark canvas `#0D1722`; dark surface `#172331`          |
| Border           | `1px #C9D6E2` light; `1px #435466` dark                                                                                       |
| Border radius    | Controls `14px`; actionable cards `16px`; task sheets `24px`; Circle Dock `18-20px`                                           |
| Text - primary   | `Instrument Sans`, dark navy `#101B29` light / `#F2F7FB` dark; titles use weight `600-700`                                    |
| Text - secondary | Mineral gray `#536272` light / `#A9B7C4` dark; IBM Plex Mono is restricted to financial and numeric values                    |
| Spacing          | Phone gutters `16px`; card/row padding `10-16px`; section rhythm `14-24px`; focused-flow bottom actions preserve safe-area gap |
| Hover state      | Pressed/hover uses restrained opacity or tonal surface change; visible `3px` focus outline with `3px` offset                   |
| Shadow           | None for content; compact chrome lift for Circle Dock, task sheets, central Add, and transient feedback only                  |
| Accent usage     | Coral `#F0584B` for creation; emerald `#006D3A` credit; crimson `#A81130` debt; amber `#765300` review/warning                  |

**Pattern notes:**
Circle Dock is the approved end-to-end visual contract for the next Splt implementation. Content surfaces remain opaque; blur is limited to persistent navigation and task sheets. Every financial color is paired with signed or plain-language direction. Minimum targets are `44pt` on iOS and `48dp` on Android. The same component vocabulary applies across social and household flows: balance hero, circle rows, semantic pills, segmented subviews, task sheets, completion receipts, and explicit query states. Future React Native components should use these tokens and geometry rather than copying legacy warm-cream, HeroUI, or glassmorphism patterns.
