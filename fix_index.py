import re

with open("src/app/(tabs)/index.tsx", "r") as f:
    content = f.read()

# Enhanced Hero Card
content = content.replace(
    '</View>\n          </View>\n\n          {/* ── Functional Quick Actions Grid ─────────── */}',
    '</View>\n          </Animated.View>\n\n          {/* ── Functional Quick Actions Grid ─────────── */}'
)

# Functional Quick Actions Grid
content = content.replace(
    '</View>\n          </View>\n\n          {/* ── Outstanding Balances ──────────────────── */}',
    '</View>\n          </Animated.View>\n\n          {/* ── Outstanding Balances ──────────────────── */}'
)

# Outstanding Balances
# Note: I replaced the closing tag for Outstanding Balances with `</Animated.View>` in the diff, wait!
# Let's just fix it automatically using balanced braces or simple replace.
