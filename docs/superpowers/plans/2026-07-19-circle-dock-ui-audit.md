# Circle Dock UI Audit & Alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align every implemented screen and shared component against the HTML prototype at `design/circle-dock-redesign/`

**Architecture:** 3-pass execution — Pass 1 fixes design tokens and shared Coral components (cascading into all screens), Pass 2 does screen-by-screen alignment against prototype patterns, Pass 3 polishes states, transitions, platform behavior, and dark mode.

**Tech Stack:** React Native 0.85, Expo 56, Instrument Sans / IBM Plex Mono, Tailwind v4 via Uniwind, expo-blur, react-native-reanimated v4

## Global Constraints

- All Coral components must use `useCoralColors()` exclusively — no `useUI()` imports
- Colors must match `design/circle-dock-redesign/prototype.css` token values exactly
- Border radius: controls 14px, cards 16px, sheets 24px, dock 20px
- iOS touch targets: 44pt minimum; Android: 48dp minimum
- Fonts: Instrument Sans for UI, IBM Plex Mono for amounts/numbers
- `npm run typecheck` must pass after every task; `npm run lint` must not introduce new errors
- Dark mode must be verified against prototype dark tokens for every component

---

## Pass 1: Design Tokens & Shared Components

### Task 1: Fix theme.ts token values

**Files:**
- Modify: `src/components/coral/theme.ts`

**Interfaces:**
- Produces: Updated `CORAL_COLORS` constant with prototype-matching hex values for both `light` and `dark` keys. All consumers use `useCoralColors()` which reads this — no API changes.

- [ ] **Step 1: Update light palette tokens in theme.ts**

```typescript
// src/components/coral/theme.ts
export const CORAL_COLORS = {
  light: {
    bg: "#eff6fd",
    surface: "#f9fcff",
    foreground: "#101b29",
    muted: "#536272",
    border: "#c9d6e2",
    accent: "#f0584b",
    accentInk: "#9a342d",
    accentSoft: "#ffdcd6",
    inkOnAccent: "#fefbfa",
    positive: "#006d3a",
    positiveSoft: "#d0f2dc",
    negative: "#a81130",
    negativeSoft: "#ffe1e1",
    warning: "#765300",
    warningSoft: "#fff0bf",
    focus: "#1769aa",
    balanceSurface: "#122237",
    balanceForeground: "#f1f6fa",
    avatarSoft: "#d2e8fb",
    avatarInk: "#1b3c5d",
  },
  dark: {
    bg: "#091018",
    surface: "#111923",
    foreground: "#eaeff4",
    muted: "#98a7b4",
    border: "#2a3440",
    accent: "#ff7062",
    accentInk: "#ffd4cd",
    accentSoft: "#461d18",
    inkOnAccent: "#1f0b0a",
    positive: "#48be81",
    positiveSoft: "#092e1b",
    negative: "#fd717c",
    negativeSoft: "#3f191b",
    warning: "#dea645",
    warningSoft: "#3d2a08",
    focus: "#4da6e6",
    balanceSurface: "#010715",
    balanceForeground: "#f1f6fa",
    avatarSoft: "#112b40",
    avatarInk: "#c0dbf4",
  },
} as const;
```

Changes from current:
- `muted`: `#4D5966` → `#536272`
- `accentInk`: `#5C0E10` → `#9A342D`
- `positive`: `#008045` → `#006D3A`
- `negative`: `#B61537` → `#A81130`
- `warning`: `#C08500` → `#765300`
- Added `warningSoft: "#FFF0BF"` (light) and `warningSoft: "#3D2A08"` (dark)
- Added `focus: "#1769AA"` (light) and `focus: "#4DA6E6"` (dark)

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
```

Expected: No errors from Coral components.

- [ ] **Step 3: Commit**

```bash
git add src/components/coral/theme.ts
git commit -m "fix: align Coral theme tokens with prototype CSS values"
```

---

### Task 2: Fix CoralTopBar — remove useUI, use coral colors

**Files:**
- Modify: `src/components/coral/CoralTopBar.tsx`

**Interfaces:**
- Consumes: Updated `CORAL_COLORS` from Task 1 (via `useCoralColors()`)
- Produces: Top bar renders with `coral.border` for bottom border, `coral.foreground` for back button. No `useUI` dependency.

- [ ] **Step 1: Remove useUI import, replace color references**

```typescript
// src/components/coral/CoralTopBar.tsx
import { useContext } from "react";
import type { ComponentProps, ReactNode } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUIStore } from "@/store/useUIStore";
import { useCoralColors } from "./useCoral";
import { CoralBlurTargetContext } from "./CoralBlurContext";
// REMOVED: import { useUI } from "@/components/ui";

type CoralTopBarProps = {
  title?: string;
  onBack?: () => void;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
};

export function CoralTopBar({ title = "", onBack, leftElement, rightElement }: CoralTopBarProps) {
  const insets = useSafeAreaInsets();
  const blurTarget = useContext(CoralBlurTargetContext);
  const isDark = useUIStore((s) => s.isDarkMode);
  const coral = useCoralColors();
  const isIOS = Platform.OS === "ios";

  const sharedStyle: ComponentProps<typeof View>["style"] = {
    minHeight: 62 + insets.top,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: insets.top + 8,
    paddingBottom: 8,
    paddingHorizontal: isIOS ? 18 : 20,
    borderBottomWidth: 1,
    borderBottomColor: coral.border,
  };

  const inner = (
    <>
      {leftElement ? (
        <View
          style={{
            width: isIOS ? 44 : 48,
            minHeight: isIOS ? 44 : 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {leftElement}
        </View>
      ) : onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={{
            minWidth: isIOS ? 44 : 48,
            minHeight: isIOS ? 44 : 48,
            borderRadius: 9999,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={24} color={coral.foreground} strokeWidth={1.8} />
        </Pressable>
      ) : (
        <View style={{ width: isIOS ? 44 : 48 }} />
      )}
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 18,
          fontWeight: "600",
          letterSpacing: -0.01 * 18,
          color: coral.foreground,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {rightElement ? (
        <View style={{ minWidth: isIOS ? 44 : 48, alignItems: "flex-end" }}>{rightElement}</View>
      ) : (
        <View style={{ width: isIOS ? 44 : 48 }} />
      )}
    </>
  );

  if (!isIOS) {
    return <View style={[sharedStyle, { backgroundColor: coral.bg }]}>{inner}</View>;
  }

  return (
    <BlurView
      intensity={80}
      tint={isDark ? "dark" : "light"}
      blurTarget={blurTarget ?? undefined}
      blurReductionFactor={2}
      style={[sharedStyle, { backgroundColor: "transparent" }]}
    >
      {inner}
    </BlurView>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/coral/CoralTopBar.tsx
git commit -m "fix: CoralTopBar uses coral colors instead of old useUI"
```

---

### Task 3: Fix CoralField — remove useUI, use coral colors

**Files:**
- Modify: `src/components/coral/CoralField.tsx`

**Interfaces:**
- Consumes: Updated `CORAL_COLORS` from Task 1
- Produces: TextInput renders with `coral.*` colors. All `color.*` references replaced with `coral.[muted|border|surface|foreground]`.

- [ ] **Step 1: Replace useUI with useCoral**

```typescript
// src/components/coral/CoralField.tsx
import { forwardRef } from "react";
import type { ForwardedRef } from "react";
import { View, TextInput, Text } from "react-native";
import type { TextInputProps } from "react-native";
import { useCoralColors } from "./useCoral";

type CoralFieldProps = TextInputProps & {
  label?: string;
  error?: string;
};

export const CoralField = forwardRef(function CoralField(
  { label, error, style, ...props }: CoralFieldProps,
  ref: ForwardedRef<TextInput>
) {
  const coral = useCoralColors();

  return (
    <View style={{ gap: 7 }}>
      {label ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_500Medium",
            fontSize: 13,
            letterSpacing: 0.02 * 13,
            color: coral.muted,
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={coral.muted}
        style={[
          {
            fontFamily: "InstrumentSans_400Regular",
            minHeight: 54,
            borderWidth: 1,
            borderColor: error ? coral.negative : coral.border,
            borderRadius: 14,
            backgroundColor: coral.surface,
            paddingHorizontal: 15,
            fontSize: 16,
            color: coral.foreground,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text
          style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 12, color: coral.negative }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/coral/CoralField.tsx
git commit -m "fix: CoralField uses coral colors instead of old useUI"
```

---

### Task 4: Fix CoralSearchField — remove useUI, use coral colors

**Files:**
- Modify: `src/components/coral/CoralSearchField.tsx`

**Interfaces:**
- Consumes: Updated `CORAL_COLORS` from Task 1
- Produces: Search input renders with `coral.*` colors.

- [ ] **Step 1: Replace useUI with useCoral**

```typescript
// src/components/coral/CoralSearchField.tsx
import type { ReactNode } from "react";
import { View, TextInput, Pressable } from "react-native";
import type { TextInputProps } from "react-native";
import { Search, XCircle } from "lucide-react-native";
import { useCoralColors } from "./useCoral";

type CoralSearchFieldProps = TextInputProps & {
  value: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
  rightElement?: ReactNode;
};

export function CoralSearchField({
  value,
  onChangeText,
  onClear,
  rightElement,
  style,
  ...props
}: CoralSearchFieldProps) {
  const coral = useCoralColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: coral.surface,
        borderWidth: 1,
        borderColor: coral.border,
        borderRadius: 14,
        minHeight: 48,
        paddingHorizontal: 14,
        gap: 9,
      }}
    >
      <Search size={19} color={coral.muted} strokeWidth={1.7} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={coral.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          {
            flex: 1,
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 16,
            color: coral.foreground,
            padding: 0,
          },
          style,
        ]}
        {...props}
      />
      {rightElement ??
        (value.length > 0 && onClear ? (
          <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
            <XCircle size={19} color={coral.muted} strokeWidth={1.7} />
          </Pressable>
        ) : null)}
    </View>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/coral/CoralSearchField.tsx
git commit -m "fix: CoralSearchField uses coral colors instead of old useUI"
```

---

### Task 5: Fix CoralSelect — remove useUI, use coral colors

**Files:**
- Modify: `src/components/coral/CoralSelect.tsx`

**Interfaces:**
- Consumes: Updated `CORAL_COLORS` from Task 1, `CoralSheet` component
- Produces: Select renders with `coral.*` colors. All `color.*` references replaced.

- [ ] **Step 1: Replace useUI with useCoral**

```typescript
// src/components/coral/CoralSelect.tsx
import React, { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { useCoralColors } from "./useCoral";
import { CoralSheet } from "./CoralSheet";

export type SelectOption = { value: string; label: string };

type CoralSelectProps = {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
};

export function CoralSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  label,
}: CoralSelectProps) {
  const coral = useCoralColors();
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const handleSelect = useCallback(
    (optionValue: string) => {
      onValueChange?.(optionValue);
      setIsOpen(false);
    },
    [onValueChange]
  );

  return (
    <View style={{ gap: 7 }}>
      {label ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_500Medium",
            fontSize: 13,
            fontWeight: "500",
            letterSpacing: 0.02 * 13,
            color: coral.muted,
          }}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 48,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 14,
          backgroundColor: coral.surface,
          paddingHorizontal: 15,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 16,
            color: selectedLabel ? coral.foreground : coral.muted,
            flex: 1,
          }}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <ChevronDown size={18} color={coral.muted} strokeWidth={1.6} />
      </Pressable>

      <CoralSheet visible={isOpen} onClose={() => setIsOpen(false)}>
        <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => handleSelect(option.value)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: pressed ? coral.border : "transparent",
                })}
              >
                <Text
                  style={{
                    fontFamily: isSelected
                      ? "InstrumentSans_600SemiBold"
                      : "InstrumentSans_400Regular",
                    fontSize: 16,
                    color: coral.foreground,
                  }}
                >
                  {option.label}
                </Text>
                {isSelected ? <Check size={18} color={coral.foreground} strokeWidth={2} /> : null}
              </Pressable>
            );
          })}
        </View>
      </CoralSheet>
    </View>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/coral/CoralSelect.tsx
git commit -m "fix: CoralSelect uses coral colors instead of old useUI"
```

---

### Task 6: Fix CoralSegment + CoralChip — remove useUI, use coral colors

**Files:**
- Modify: `src/components/coral/CoralSegment.tsx`
- Modify: `src/components/coral/CoralChip.tsx`

**Interfaces:**
- Consumes: Updated `CORAL_COLORS` from Task 1
- Produces: Both components render with `coral.*` colors. No `useUI` dependency.

- [ ] **Step 1: Fix CoralSegment.tsx**

```typescript
// src/components/coral/CoralSegment.tsx
import { View, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useCoralColors } from "./useCoral";

type SegmentOption = { label: string; value: string };

type CoralSegmentProps = {
  options: SegmentOption[];
  selected: string;
  onSelect: (value: string) => void;
};

export function CoralSegment({ options, selected, onSelect }: CoralSegmentProps) {
  const coral = useCoralColors();
  const minHeight = Platform.OS === "ios" ? 44 : 48;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: coral.border,
        borderRadius: 14,
        padding: 3,
        gap: 3,
      }}
    >
      {options.map((option) => {
        const isActive = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(option.value);
            }}
            style={{
              flex: 1,
              minHeight,
              borderRadius: 11,
              backgroundColor: isActive ? coral.surface : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 13,
                fontWeight: isActive ? "600" : "400",
                color: coral.foreground,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Fix CoralChip.tsx**

```typescript
// src/components/coral/CoralChip.tsx
import { Pressable, Text, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useCoralColors } from "./useCoral";

type CoralChipProps = {
  label: string;
  isActive?: boolean;
  onPress: () => void;
};

export function CoralChip({ label, isActive = false, onPress }: CoralChipProps) {
  const coral = useCoralColors();
  const minHeight = Platform.OS === "ios" ? 44 : 48;
  const borderRadius = Platform.OS === "ios" ? 22 : 24;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight,
        paddingHorizontal: 16,
        borderRadius,
        backgroundColor: isActive ? coral.foreground : coral.surface,
        borderWidth: 1,
        borderColor: isActive ? coral.foreground : coral.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 13,
          color: isActive ? coral.inkOnAccent : coral.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/coral/CoralSegment.tsx src/components/coral/CoralChip.tsx
git commit -m "fix: CoralSegment and CoralChip use coral colors instead of old useUI"
```

---

### Task 7: Fix MoneyAmount, MoneyRow, StatPair — remove useUI

**Files:**
- Modify: `src/components/coral/MoneyAmount.tsx`
- Modify: `src/components/coral/MoneyRow.tsx`
- Modify: `src/components/coral/StatPair.tsx`

**Interfaces:**
- Consumes: Updated `CORAL_COLORS` from Task 1
- Produces: Financial display components render with `coral.*` colors. `color.text` → `coral.foreground`.

- [ ] **Step 1: Fix MoneyAmount.tsx — replace color.text with coral.foreground for neutral tone**

```typescript
// src/components/coral/MoneyAmount.tsx
import type { ReactNode } from "react";
import { Text } from "react-native";
import type { TextStyle } from "react-native";
import { useCoralColors } from "./useCoral";

type MoneyAmountProps = {
  children: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "inverse";
  size?: "sm" | "md" | "lg" | "hero";
  style?: TextStyle;
};

const SIZE_MAP = {
  sm: { fontSize: 14, letterSpacing: -0.01 * 14 },
  md: { fontSize: 16, letterSpacing: -0.01 * 16 },
  lg: { fontSize: 22, letterSpacing: -0.015 * 22 },
  hero: { fontSize: 40, letterSpacing: -0.015 * 40, lineHeight: 40 },
} as const;

export function MoneyAmount({ children, tone = "neutral", size = "md", style }: MoneyAmountProps) {
  const coral = useCoralColors();

  const toneColor = {
    neutral: coral.foreground,
    positive: coral.positive,
    negative: coral.negative,
    inverse: coral.balanceForeground,
  }[tone];

  const sizeStyle = SIZE_MAP[size];

  return (
    <Text
      style={[
        {
          fontFamily: "IBMPlexMono_600SemiBold",
          fontVariant: ["tabular-nums"],
          fontWeight: "600",
          color: toneColor,
        },
        sizeStyle,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
```

- [ ] **Step 2: Fix MoneyRow.tsx — replace color.text with coral.foreground, color.muted with coral.muted**

```typescript
// src/components/coral/MoneyRow.tsx
import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { useCoralColors } from "./useCoral";

type MoneyRowProps = {
  avatar?: ReactNode;
  title: string;
  subtitle?: string;
  amount: string;
  amountTone?: "neutral" | "positive" | "negative";
  onPress?: () => void;
  rightElement?: ReactNode;
  accessibilityLabel?: string;
};

export function MoneyRow({
  avatar,
  title,
  subtitle,
  amount,
  amountTone = "neutral",
  onPress,
  rightElement,
  accessibilityLabel,
}: MoneyRowProps) {
  const coral = useCoralColors();

  const amountColor = {
    neutral: coral.foreground,
    positive: coral.positive,
    negative: coral.negative,
  }[amountTone];

  const content = (
    <View
      style={{
        minHeight: 68,
        paddingVertical: 10,
        paddingHorizontal: 2,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {avatar}
      <View style={{ minWidth: 0, flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 16,
            letterSpacing: -0.005 * 16,
            color: coral.foreground,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 13,
              lineHeight: 13 * 1.45,
              color: coral.muted,
              marginTop: 3,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          fontFamily: "IBMPlexMono_600SemiBold",
          fontVariant: ["tabular-nums"],
          fontWeight: "600",
          letterSpacing: -0.01 * 16,
          color: amountColor,
        }}
      >
        {amount}
      </Text>
      {rightElement}
    </View>
  );

  if (onPress) {
    const accessibleName =
      accessibilityLabel ?? [title, subtitle, amount].filter(Boolean).join(", ");
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibleName}
        onPress={onPress}
        style={{ width: "100%" }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
```

- [ ] **Step 3: Fix StatPair.tsx — replace color.* with coral.***

```typescript
// src/components/coral/StatPair.tsx
import { View, Text } from "react-native";
import { useCoralColors } from "./useCoral";

type StatItem = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
};

type StatPairProps = {
  left: StatItem;
  right: StatItem;
};

export function StatPair({ left, right }: StatPairProps) {
  const coral = useCoralColors();

  const renderStat = (stat: StatItem) => {
    const valueColor = {
      neutral: coral.foreground,
      positive: coral.positive,
      negative: coral.negative,
    }[stat.tone ?? "neutral"];

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: coral.surface,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <Text
          style={{
            fontFamily: "IBMPlexMono_600SemiBold",
            fontVariant: ["tabular-nums"],
            fontSize: 22,
            fontWeight: "600",
            color: valueColor,
          }}
        >
          {stat.value}
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            color: coral.muted,
            marginTop: 5,
          }}
        >
          {stat.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flexDirection: "row", gap: 12, marginVertical: 8 }}>
      {renderStat(left)}
      {renderStat(right)}
    </View>
  );
}
```

- [ ] **Step 4: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/coral/MoneyAmount.tsx src/components/coral/MoneyRow.tsx src/components/coral/StatPair.tsx
git commit -m "fix: MoneyAmount, MoneyRow, StatPair use coral colors instead of old useUI"
```

---

### Task 8: Fix GroupTile + EmptyState — remove useUI

**Files:**
- Modify: `src/components/coral/GroupTile.tsx`
- Modify: `src/components/coral/EmptyState.tsx`

**Interfaces:**
- Consumes: Updated `CORAL_COLORS` from Task 1
- Produces: Both components render with `coral.*` colors.

- [ ] **Step 1: Fix GroupTile.tsx**

```typescript
// src/components/coral/GroupTile.tsx
import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { useCoralColors } from "./useCoral";

type GroupTileProps = {
  icon?: ReactNode;
  name: string;
  meta?: string;
  onPress?: () => void;
  balanceTone?: "positive" | "negative" | "neutral";
  style?: object;
};

export function GroupTile({
  icon,
  name,
  meta,
  onPress,
  balanceTone = "neutral",
  style,
}: GroupTileProps) {
  const coral = useCoralColors();

  const content = (
    <View
      style={[
        {
          minHeight: 160,
          borderWidth: 1,
          borderColor: coral.border,
          backgroundColor: coral.surface,
          borderRadius: 16,
          padding: 17,
          flexDirection: "column",
          alignItems: "flex-start",
        },
        style,
      ]}
    >
      {icon ? (
        <View style={{ flexDirection: "row", width: "100%" }}>
          <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            {icon}
          </View>
          {balanceTone !== "neutral" && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: balanceTone === "positive" ? coral.positive : coral.negative,
                alignSelf: "flex-start",
                marginTop: 6,
                marginLeft: "auto",
              }}
            />
          )}
        </View>
      ) : null}
      <Text
        numberOfLines={2}
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 17,
          fontWeight: "600",
          color: coral.foreground,
          marginTop: "auto",
        }}
      >
        {name}
      </Text>
      {meta ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            color: coral.muted,
            marginTop: 5,
          }}
        >
          {meta}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}
```

- [ ] **Step 2: Fix EmptyState.tsx**

```typescript
// src/components/coral/EmptyState.tsx
import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { useCoralColors } from "./useCoral";

type EmptyStateProps = {
  visual?: ReactNode;
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function EmptyState({ visual, title, subtitle, children }: EmptyStateProps) {
  const coral = useCoralColors();

  return (
    <View
      style={{
        minHeight: 310,
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
      }}
    >
      <View
        style={{
          width: 112,
          height: 112,
          borderRadius: 16,
          backgroundColor: coral.accentSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        {visual}
      </View>
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 18,
          fontWeight: "600",
          color: coral.foreground,
          textAlign: "center",
          marginBottom: subtitle ? 8 : 0,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 15,
            color: coral.muted,
            textAlign: "center",
            lineHeight: 21,
            maxWidth: 280,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
```

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/coral/GroupTile.tsx src/components/coral/EmptyState.tsx
git commit -m "fix: GroupTile and EmptyState use coral colors instead of old useUI"
```

---

### Task 9: Fix CoralButton — remove unused useUI import

**Files:**
- Modify: `src/components/coral/CoralButton.tsx`

**Interfaces:**
- Consumes: Updated `CORAL_COLORS` from Task 1
- Produces: No behavioral change. Dead code removed.

- [ ] **Step 1: Remove unused useUI import and destructuring**

```typescript
// src/components/coral/CoralButton.tsx
import { Pressable, ActivityIndicator, Text, Platform } from "react-native";
import { useCoralColors } from "./useCoral";

type CoralButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "text";
  disabled?: boolean;
  loading?: boolean;
};

export function CoralButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: CoralButtonProps) {
  const coral = useCoralColors();

  const styles = {
    primary: { bg: coral.accent, fg: coral.inkOnAccent },
    secondary: { bg: coral.accentSoft, fg: coral.accentInk },
    danger: { bg: coral.negativeSoft, fg: coral.negative },
    text: { bg: "transparent", fg: coral.accent },
  }[variant];

  const isDisabled = disabled || loading;
  const minHeight = variant === "text" ? (Platform.OS === "ios" ? 44 : 48) : 52;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight,
        width: "100%",
        borderRadius: 14,
        backgroundColor: styles.bg,
        paddingHorizontal: variant === "text" ? 4 : 18,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        opacity: isDisabled ? 0.45 : pressed ? 0.78 : 1,
      })}
    >
      {loading && (
        <ActivityIndicator size="small" color={variant === "text" ? coral.accent : styles.fg} />
      )}
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 16,
          letterSpacing: 0.02 * 16,
          color: styles.fg,
          fontWeight: "600",
          textDecorationLine: variant === "text" ? "underline" : "none",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/coral/CoralButton.tsx
git commit -m "fix: remove unused useUI import from CoralButton"
```

---

### Task 10: Fix CircleDock shadow color

**Files:**
- Modify: `src/components/coral/CircleDock.tsx`

**Interfaces:**
- Consumes: `useCoralColors()`, `useUIStore`
- Produces: Dock shadow matches prototype `rgba(18, 34, 55, 0.16)` instead of `rgba(0, 0, 0, 0.14)`

- [ ] **Step 1: Replace shadow color with prototype-spec values**

In CircleDock.tsx, change the shadow values on the dock container View:

Replace:
```typescript
shadowColor: "#000000",
shadowOffset: { width: 0, height: 6 },
shadowOpacity: isDark ? 0.28 : 0.14,
shadowRadius: 14,
```

With:
```typescript
shadowColor: "#122237",
shadowOffset: { width: 0, height: 6 },
shadowOpacity: isDark ? 0.28 : 0.16,
shadowRadius: 14,
```

Also update the Add button shadow from `#000000` to `coral.accent` (already correct, verify):
```typescript
shadowColor: coral.accent,
shadowOffset: { width: 0, height: 6 },
shadowOpacity: 0.34,
shadowRadius: 9,
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/coral/CircleDock.tsx
git commit -m "fix: CircleDock shadow matches prototype spec (#122237, 0.16 opacity)"
```

---

### Task 11: Remove duplicative fontWeight from Coral components

**Files:**
- Modify: 7 Coral components with both `fontFamily: "InstrumentSans_600SemiBold"` and `fontWeight: "600"`

**Interfaces:**
- Produces: Cleaner styles. No visual change — `InstrumentSans_600SemiBold` already implies weight 600.

Components to fix (remove `fontWeight: "600"` or `fontWeight: "400"` where fontFamily already encodes weight):
- `CoralTopBar.tsx`: title Text has both
- `CoralButton.tsx`: label Text has both
- `LargeTitle.tsx`: Text has both
- `CoralSegment.tsx`: label Text has both
- `GroupTile.tsx`: name Text has both
- `MoneyRow.tsx`: amount Text has both
- `EmptyState.tsx`: title Text has both

For each component, remove the `fontWeight` line from Text styles where the `fontFamily` already specifies the weight (e.g., `InstrumentSans_600SemiBold` implies `600`, `InstrumentSans_400Regular` implies `400`).

Keep `fontWeight` only where it's dynamic (e.g., CoralSegment active/inactive toggle).

- [ ] **Step 2: Run typecheck + lint**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
npm run lint -- --quiet 2>&1 | tail -5
```

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/coral/
git commit -m "fix: remove redundant fontWeight when fontFamily encodes weight"
```

---

### Task 12: Verify no old warm-ledger colors leak

**Files:**
- Search across all files

**Interfaces:**
- Consumes: All Coral component changes from Tasks 2-11

- [ ] **Step 1: Search for remaining useUI imports in Coral components**

```bash
grep -r "useUI" src/components/coral/ --include="*.tsx" --include="*.ts"
```

Expected: No matches (all should be replaced with `useCoralColors`).

- [ ] **Step 2: Search for old warm-ledger hex values**

```bash
grep -rn "#E7E5DE\|#F7F6F1\|#FEFDFA\|#E85D5D\|#4CAF82\|#F5A623\|#E8E4DF" src/components/coral/ --include="*.tsx" --include="*.ts"
```

Expected: No matches.

- [ ] **Step 3: Run full typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit if changes needed, otherwise skip**

```bash
# Only if fixes were needed
git add -A && git commit -m "fix: remove remaining old warm-ledger color references from Coral"
```

---

## Pass 2: Screen Alignment

Pass 2 compares every screen against its HTML prototype counterpart and fixes layout, spacing, component composition, section headers, row patterns, empty states, and navigation flow structure.

### Task 13: Home screen (MoneyMapScreen)

**Files:**
- Read: `design/circle-dock-redesign/screens/home.html`
- Modify: `src/features/dashboard/screens-v2/MoneyMapScreen.tsx`

**Verification**: Compare against `screens/home.html` — check balance hero position/size/colors, quick action layout, group/person ledger section headers and row layout, upcoming section, empty state for new users, bottom spacing for dock clearance.

Execute by:
1. Reading the prototype HTML home screen
2. Reading the current `MoneyMapScreen.tsx`
3. Comparing the two for discrepancies
4. Fixing all mismatches
5. Committing

### Task 14: Circles screen

**Files:**
- Read: `design/circle-dock-redesign/screens/circles-groups.html`, `screens/circles-people.html`
- Modify: `src/features/circles/screens/CirclesScreen.tsx`

### Task 15: Group and People screens

**Files:**
- Read: `design/circle-dock-redesign/screens/group-overview.html`, `screens/group-expenses.html`, `screens/group-settings.html`, `screens/group-create.html`, `screens/person-detail.html`
- Modify: `src/features/groups/screens-v2/GroupDetailScreen.tsx`, `GroupSettingsScreen.tsx`, `NewGroupScreen.tsx`
- Modify: `src/features/friends/screens-v2/FriendDetailScreen.tsx`

### Task 16: Add Expense flow

**Files:**
- Read: `design/circle-dock-redesign/screens/expense-compose.html`, `screens/expense-split.html`, `screens/expense-success.html`
- Modify: `src/features/expenses/screens-v2/NewExpenseScreen.tsx`

### Task 17: Expense Detail screen

**Files:**
- Read: `design/circle-dock-redesign/screens/expense-detail.html`
- Modify: `src/features/expenses/screens-v2/ExpenseDetailScreen.tsx`

### Task 18: Settlement screens

**Files:**
- Read: `design/circle-dock-redesign/screens/settlement-compose.html`, `screens/settlement-review.html`, `screens/settlement-success.html`
- Modify: `src/features/settlements/screens-v2/SettlementScreen.tsx`, `NewSettlementScreen.tsx`

### Task 19: Activity screen

**Files:**
- Read: `design/circle-dock-redesign/screens/activity-timeline.html`
- Modify: `src/features/activity/screens-v2/ActivityScreen.tsx`

### Task 20: More screen + secondary

**Files:**
- Read: `design/circle-dock-redesign/screens/more.html`
- Modify: `src/features/profile/screens-v2/MoreScreen.tsx`, `AnalyticsScreen.tsx`, `CurrenciesScreen.tsx`, `NotificationsScreen.tsx`

### Task 21: Auth screens

**Files:**
- Read: `design/circle-dock-redesign/screens/welcome.html`, `screens/login.html`, `screens/register.html`, `screens/forgot-password.html`, `screens/verify-email.html`
- Modify: `src/features/auth/screens-v2/WelcomeScreen.tsx`, `LoginScreen.tsx`, `RegisterScreen.tsx`, `ForgotPasswordScreen.tsx`, `VerifyEmailScreen.tsx`

---

## Pass 3: Polish & Edge Cases

### Task 22: Platform-specific behavior verification

- [ ] Verify iOS blur intensity on top bar matches prototype
- [ ] Verify Android opaque chrome on top bar (no blur artifact)
- [ ] Verify 44pt/48dp touch targets throughout

### Task 23: Dark mode verification

- [ ] Verify every surface uses correct dark variant from theme.ts
- [ ] Verify text contrast (WCAG AA) in dark mode
- [ ] Verify semantic colors (emerald, crimson) visible in dark mode
- [ ] Verify blur tints correct in dark mode

### Task 24: State handling

- [ ] Verify loading/skeleton states on data-fetching screens
- [ ] Verify empty states (first use and filtered/search)
- [ ] Verify error states with retry actions
- [ ] Verify offline states with cached content preservation
- [ ] Verify permission-restricted states
- [ ] Verify not-found states (after hydration completes)

### Task 25: Accessibility

- [ ] Add/verify accessibilityLabel on all interactive elements
- [ ] Verify logical focus order on every screen
- [ ] Verify reduced-motion crossfade behavior

### Task 26: Final cleanup

- [ ] Run `grep -r "useUI" src/components/coral/` — confirm zero matches
- [ ] Run `npm run typecheck` — confirm clean
- [ ] Run `npm run lint` — confirm only pre-existing errors
- [ ] Update AGENTS.md: change `(tabs)` references to `(shell)`
- [ ] Delete stale design docs: remove `DESIGN.md`, `design-tokens.json`, `ui-registry.md` if they only document the old Warm Ledger

---

## Verification

After every task: `npm run typecheck` — no new errors.

After Pass 1: All Coral components use `useCoral()` exclusively. Theme tokens match prototype. No warm-ledger colors leak.

After Pass 2: Every screen renders with correct layout, spacing, component composition matching prototype patterns.

After Pass 3: Dark mode, reduced motion, states, accessibility, and platform-specific behavior all verified.
