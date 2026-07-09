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
Last updated: 2026-07-08

| Property         | Class / Value                                                                       |
| ---------------- | ----------------------------------------------------------------------------------- |
| Background       | App `#F5F0EB`; group rows and summary cards `#FFFCF8`; controls `#FFFFFF`           |
| Border           | `1px #E8E4DF` for search, filters, summary cards, row cards, and icons              |
| Border radius    | `16px` card radius; `18px` row icon radius; `22px` empty icon radius; `999px` pills |
| Text - primary   | `#000000`, `CrimsonText_700Bold`                                                    |
| Text - secondary | `#8A8782`, `CrimsonText_600SemiBold`; summary labels are uppercase/tracked          |
| Spacing          | `24px` screen gutters; `16px` row/card padding; `10px` summary-card gap             |
| Hover state      | Pressed opacity `0.5-0.8` depending on control weight                               |
| Shadow           | None                                                                                |
| Accent usage     | Debt `#E85D5D`; positive balance `#4CAF82`; active chips and primary CTAs `#000000` |

**Pattern notes:**
Groups list rows are visually one stacked card: first row owns top radius, last row owns bottom radius, and all rows keep a light bottom divider. Do not use swipe actions inside the stacked group list, because exposed actions break the card shape and can leave rows visually offset. Group row icons use the saved Lucide icon name from group creation before falling back to emoji or initials. The page should provide summary cards, search, and filter pills before the list, with empty states adapting to search/filter context.

### Friends List

File: src/features/friends/screens/FriendsScreen.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Background       | App `#F7F6F1`; rows, attention card, empty state, and summary shell `#FEFDFA`; controls `#FFFFFF`            |
| Border           | `1px #E7E5DE` for search, filters, summary cells, attention rows, balance pills, and stacked friend rows     |
| Border radius    | `16px` outer card/list radius; `12px` summary cells; `18px` empty icon shell; `999px` search/filter/action pills |
| Text - primary   | `#1A1A1A`, headings `Sora_600SemiBold`, row/action text `IBMPlexSans_600SemiBold`                            |
| Text - secondary | `#6E6D68`, `IBMPlexSans_500Medium`; count/meta text `#9B9A94`                                               |
| Spacing          | `20px` screen gutters; `14px` list/card horizontal padding; `12px` row vertical padding; `8-10px` chip gaps |
| Hover state      | Pressed opacity `0.62-0.75`; haptics on primary icon, row, and refresh interactions                          |
| Shadow           | None                                                                                                        |
| Accent usage     | Debt `#E85D5D` on owe states; credit `#4CAF82` on owed states; primary actions and active chips `#1A1A1A`    |

**Pattern notes:**
Friends list now uses the quiet-ledger pattern: a warm summary shell, a conditional `Needs attention` card, search, count filters, then grouped stacked rows by balance state. Keep balance meaning in semantic red/green only; do not use decorative accent color for neutral contacts. Rows should stay compact and native: framed avatar, name, recent expense or source, right-aligned balance pill, and one contextual action (`Remind`, `Settle`, or `Add`). Friend requests belong in the attention card above search with compact accept/reject icon buttons. Shared-group-only contacts should remain visible but labeled through row metadata and guarded on removal.

### Add Expense Bottom Sheet

File: src/features/expenses/screens/NewExpenseScreen.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Background       | Transparent modal backdrop; sheet `#F5F0EB`; primary cards `#FFFCF8`; controls `#FFFFFF`              |
| Border           | `1px #E8E4DF` for header/action dividers, cards, rows, chips, search field, and input surfaces        |
| Border radius    | Sheet background square; cards `18px`; icon cells `14-16px`; chips, title input, CTA `999px`         |
| Text - primary   | `#000000`, `IBMPlexSans_600SemiBold`; amount uses oversized `58px` display text                        |
| Text - secondary | `#8A8782`, `IBMPlexSans_500Medium`; labels are uppercase/tracked `11px`                                |
| Spacing          | `24px` sheet gutters; `16px` card padding; `20-24px` section rhythm; `8-12px` horizontal chip gaps    |
| Hover state      | Pressed opacity `0.65-0.82`; selections use haptic feedback                                            |
| Shadow           | None for in-sheet surfaces; date popover keeps existing overlay shadow                                 |
| Accent usage     | Primary CTA `#8C7A6B`; active chips/selection states `#000000`; balanced `#4CAF82`; warning `#E85D5D` |

**Pattern notes:**
Expense creation should open as a transparent modal route with a single stable bottom sheet, one vertical scrollable body, and a fixed action bar instead of a bottom-sheet footer. The sheet uses a two-step flow when no context is preselected: search plus segmented `Friends` / `Groups` controls, then a stacked warm-surface list with row dividers and trailing selection checks before the form appears after `Continue`. Multi-select friends should surface as compact summary chips above the list so the current selection stays visible without affecting vertical scroll behavior. Keep context, amount, title, and split preview near the top of the form so add and edit flows land in the important fields immediately. Interactive choices should be chips, stacked rows, or compact cards with Lucide icons, haptics, and clear active states. Preselected group/friend links and edit flows should skip the context picker and land directly in the form.

### Member Avatar

File: src/components/ui/MemberAvatar.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| Background       | Outer shell `#FFFFFF`; inner fill uses curated muted tones like `#F5E7DD`, `#E3ECEB`, `#E6E8F1`, or neutral `#F0ECE7` |
| Border           | Outer `1px #E8E4DF`; stack overlap ring `2px #F5F0EB`                          |
| Border radius    | `12px` small, `18px` medium, `22px` large                                      |
| Text - primary   | Initials use `CrimsonText_700Bold`; ink tones use muted hues like `#9A5F3E`, `#4B7772`, `#5C648F` |
| Text - secondary | Overflow count uses `#8A8782`                                                  |
| Spacing          | `2-3px` inner inset between shell and fill                                     |
| Hover state      | None                                                                           |
| Shadow           | None                                                                           |
| Accent usage     | Positive `#E5F3EA` / `#3F7F61`; negative `#F8E6E3` / `#B25B52`; curated muted fallback palette per user ID |

**Pattern notes:**
User avatars should match the warm framed-control language rather than render as raw circles or flat tiles. Default list avatars use a white shell with a soft inner color field, rounded-rectangle corners, and bold serif initials. The fallback palette should stay earthy and muted so rows feel consistent even when many avatars appear together; avoid saturated primaries or neon pastel mixes. Medium avatars should align with `48px` row icon rhythm, while stacks overlap with a warm app-background ring so they stay legible on cream surfaces. Remote avatar images should fill the inner shape directly and keep the same framing as initials fallbacks.

### Group Icon Badge

File: src/components/ui/GroupIconBadge.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| Background       | Outer shell `#FFFFFF`; inner fill uses curated muted tones like `#F5E7DD`, `#E3ECEB`, `#E6E8F1` |
| Border           | Outer `1px #E8E4DF`                                                           |
| Border radius    | `14px` small, `18px` medium, `22px` large                                     |
| Text - primary   | Fallback initials use `CrimsonText_700Bold`; icon ink uses muted hues like `#9A5F3E`, `#4B7772`, `#5C648F` |
| Text - secondary | None                                                                          |
| Spacing          | `2-3px` inner inset between shell and fill                                    |
| Hover state      | None                                                                          |
| Shadow           | None                                                                          |
| Accent usage     | Warm-muted palette only; avoid bright category-chip colors for persistent group identity |

**Pattern notes:**
Group icons should use the same framed editorial language as avatars, but with slightly stronger icon presence. Persistent group identity badges on dashboard rows, groups lists, and group headers should use a white shell plus a muted inner tone keyed by group ID, rather than hardcoded bright pastel blocks. Fallback initials or emoji should inherit the same ink color as Lucide icons so mixed data sources still feel consistent.

### Category Icon Badge

File: src/components/ui/CategoryIconBadge.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| Background       | Outer shell `#FFFFFF`; inner fill uses category-specific muted tones like `#F5E7DD`, `#E3ECEB`, `#E6E8F1`, `#EEE7F2` |
| Border           | Outer `1px #E8E4DF`                                                           |
| Border radius    | `14px` small, `18px` medium, `22px` large                                     |
| Text - primary   | Lucide icon ink uses muted tones like `#9A5F3E`, `#4B7772`, `#5C648F`, `#7B668D` |
| Text - secondary | None                                                                          |
| Spacing          | `2-3px` inner inset between shell and fill                                    |
| Hover state      | None                                                                          |
| Shadow           | None                                                                          |
| Accent usage     | Keep category distinction through restrained muted color pairs, not bright product-style chips |

**Pattern notes:**
Category icons should follow the same white-shell framing system as avatars and group icons, but preserve semantic distinction between categories through a curated muted palette. Transaction rows, expense detail headers, and compact spending summaries should all use this badge rather than flat colored squares or black-only icon plates. Category color should read as editorial and subdued, not dashboard-chart bright.

### Currency Selector Bottom Sheet

File: src/components/forms/CurrencySelector.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Background       | Sheet `#F5F0EB`; selection cards `#FFFCF8`; controls `#FFFFFF`; current card tint `#F7F1EA`    |
| Border           | `1px #E8E4DF` for trigger, search pill, cards, and meta pills; selected card border `#000000`  |
| Border radius    | Trigger and cards `16px`; icon shells `18px`; search and metadata pills `999px`; selected badge `14px` |
| Text - primary   | `#000000`, `CrimsonText_700Bold`; sheet title uses `UnicaOne_400Regular`                        |
| Text - secondary | `#8A8782`, `CrimsonText_600SemiBold`; labels are uppercase/tracked `11px`                       |
| Spacing          | `24px` sheet gutters; `16px` card padding; `10px` card stack gap; `12-14px` inline gaps        |
| Hover state      | Pressed opacity from `PressableFeedback`; selection uses haptic feedback                         |
| Shadow           | None                                                                                            |
| Accent usage     | Brand hint text `#8C7A6B`; active selection uses black fill instead of brand fill               |

**Pattern notes:**
Bottom-sheet selectors should match the newer warm card system rather than older square-field forms. The trigger reads as a compact summary card with a framed icon shell, primary code, secondary name, and a small `Change` affordance. Inside the sheet, use an editorial title, a short explanatory subtitle, a pill search field, then stacked rounded cards for options. When there is a current or common choice, surface it explicitly with section labels and compact pills such as `Current` or `Popular` so users can decide quickly without scanning the whole list.

### Typography System

File: src/app/_layout.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| Background       | N/A                                                                           |
| Border           | N/A                                                                           |
| Border radius    | N/A                                                                           |
| Text - primary   | Headings `Sora_600SemiBold`; functional emphasis `IBMPlexSans_600SemiBold`    |
| Text - secondary | Body and helper copy `IBMPlexSans_400Regular`; supporting UI text `IBMPlexSans_500Medium` |
| Spacing          | N/A                                                                           |
| Hover state      | N/A                                                                           |
| Shadow           | N/A                                                                           |
| Accent usage     | Typography contrast comes from family change, not decorative text treatments  |

**Pattern notes:**
Use `Sora` only where hierarchy needs a clear visual shift: screen titles, bottom-sheet titles, large card headings, and key amount callouts. Keep all functional UI copy in `IBM Plex Sans` so buttons, inputs, row metadata, and dense list content stay sharp and product-like. Avoid mixing additional expressive fonts into the interface; the system depends on the contrast between one restrained display face and one structured utility sans.

### Friend Detail Screen

File: src/features/friends/screens/FriendDetailScreen.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| Background       | App `#F7F6F1`; cards and stacked list surfaces `#FEFDFA`; controls `#FFFFFF`  |
| Border           | `1px #E7E5DE` for header buttons, balance card, lists, option icons, and bottom action bar |
| Border radius    | `16px` cards/lists; `14px` option icon shells; `999px` header/action buttons  |
| Text - primary   | `#1A1A1A`; screen title and amount `Sora_600SemiBold`; rows/actions `IBMPlexSans_600SemiBold` |
| Text - secondary | `#6E6D68`, `IBMPlexSans_500Medium`; tertiary chevrons/meta `#9B9A94`          |
| Spacing          | `24px` screen gutters; `24px` balance-card padding; `14-16px` row padding; `12px` action gap |
| Hover state      | Pressed opacity `0.62-0.8`; row press background `#FBF7F2`; success haptic after removal |
| Shadow           | None                                                                          |
| Accent usage     | Debt `#E85D5D`; credit `#4CAF82`; primary add action `#8C7A6B`; no decorative accent |

**Pattern notes:**
Friend detail should behave like a warm ledger detail surface: a compact native header, one central balance card with action-oriented copy, optional shared-context sections, and a fixed bottom action bar. Do not show disabled settlement actions when the balance is already settled; make `Add Expense` the single primary action instead. Friend options belong in a dynamic bottom sheet with row icons, direct share/contact actions, and guarded destructive removal for direct friendships only. Shared groups and category spending should use the framed `GroupIconBadge` and `CategoryIconBadge` systems instead of ad hoc colored squares.

### Bottom Tab Navigation

File: src/app/(tabs)/_layout.tsx
Last updated: 2026-07-09

| Property         | Class / Value                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| Background       | Tab bar `#FFFFFF` over app content                                            |
| Border           | Top border `1px #E8E4DF`                                                      |
| Border radius    | None; full-width native bottom chrome                                         |
| Text - primary   | No visible labels; accessibility labels only                                  |
| Text - secondary | Inactive icons `#8E8E93`                                                      |
| Spacing          | Four equal-width tabs; `10px` vertical icon area; safe-area bottom padding    |
| Hover state      | Pressed opacity `0.72`; light haptic when changing tabs                       |
| Shadow           | Android elevation `8`; iOS top shadow `0 -1px 8px rgba(0,0,0,0.05)`           |
| Accent usage     | Active icon and indicator dot `#1A1A1A`; inactive icons stay neutral          |

**Pattern notes:**
Primary bottom navigation should contain only core destinations: Dashboard, Groups, Friends, and Activity. Creation actions such as `Add Expense` belong in contextual dashboard controls, not as a center tab. Profile access should be launched from the dashboard header so account settings do not compete with task destinations in the tab bar.
