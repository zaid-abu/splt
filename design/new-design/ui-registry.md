# Suma UI Registry

### Coral Ledger Action Surface

File: `suma-prototype.css`
Last updated: 2026-07-18

| Property         | Pattern                                                               |
| ---------------- | --------------------------------------------------------------------- |
| Background       | Opaque `--surface` content beneath `--surface-raised` material layers |
| Border           | 1px `--border`; Android bottom sheets drop side borders               |
| Border radius    | 14px controls, 16px cards, 24px task sheets                           |
| Text — primary   | Instrument Sans using `--fg`, weight 500–600                          |
| Text — secondary | Instrument Sans using `--muted`, 13–14px                              |
| Financial values | IBM Plex Mono, weight 500–600, tabular figures                        |
| Hover state      | Neutral surface shift or 2px lift on actionable cards                 |
| Focus state      | 3px coral ring with 2px offset                                        |
| Shadow           | Compact elevation only; maximum 12px blur on sheets                   |
| Accent usage     | Coral for brand actions; emerald/crimson for balance semantics        |

**Pattern notes:** Coral Ledger uses Instrument Sans for product UI and IBM Plex Mono for money. Blur is functional material for status bars, sticky bars, and command sheets, never a card treatment. iOS controls use a 44pt minimum; Android controls use a 48dp minimum.

### Money List Row

File: `suma-prototype.css`
Last updated: 2026-07-18

| Property         | Pattern                                     |
| ---------------- | ------------------------------------------- |
| Background       | Transparent over the current screen surface |
| Border           | 1px bottom separator using `--border`       |
| Border radius    | None; rows belong to a continuous list      |
| Text — primary   | 16px Instrument Sans, weight 550            |
| Text — secondary | 13px Instrument Sans using `--muted`        |
| Financial values | IBM Plex Mono, weight 600                   |
| Spacing          | 10px vertical, 12px between avatar and copy |
| Hover state      | Subtle neutral surface fill                 |
| Shadow           | None                                        |
| Accent usage     | Semantic amount text only                   |

**Pattern notes:** Coral Ledger rows truncate long names, keep IBM Plex Mono money values tabular and unwrapped, and use a 44px avatar as the stable alignment anchor.
