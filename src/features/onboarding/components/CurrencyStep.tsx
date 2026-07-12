import { useState, useMemo } from "react"
import { View, Pressable, TextInput, ScrollView } from "react-native"
import { Typography } from "heroui-native"
import * as Haptics from "expo-haptics"
import * as icons from "lucide-react-native"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"

import { UI } from "@/components/ui/native-ui"
import { getCurrencySymbol } from "@/components/ui/AmountDisplay"
import type { Currency } from "@/types"
import { CURRENCIES } from "@/types"

interface CurrencyStepProps {
  selected: Currency
  onSelect: (currency: Currency) => void
}

const PREVIEW_AMOUNT = 42.5

export function CurrencyStep({ selected, onSelect }: CurrencyStepProps) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return CURRENCIES
    return CURRENCIES.filter((c) => {
      const haystack = [c.code, c.name, c.symbol].join(" ").toLowerCase()
      return haystack.includes(q)
    })
  }, [search])

  const preview = `${getCurrencySymbol(selected.code)}${PREVIEW_AMOUNT.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  return (
    <View style={{ flex: 1, paddingTop: 8 }}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <View
          style={{
            backgroundColor: UI.color.surface,
            borderRadius: UI.radius.lg,
            borderWidth: 1,
            borderColor: UI.color.border,
            padding: 24,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Typography
            style={{
              fontSize: 11,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_600SemiBold",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              marginBottom: 12,
            }}
          >
            Live preview
          </Typography>
          <Typography
            style={{
              fontSize: 48,
              color: UI.color.textStrong,
              fontFamily: "Sora_600SemiBold",
              lineHeight: 56,
            }}
          >
            {preview}
          </Typography>
          <Typography
            style={{
              fontSize: 14,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              marginTop: 4,
            }}
          >
            {selected.name} &middot; {selected.code}
          </Typography>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: UI.color.control,
            borderWidth: 1,
            borderColor: UI.color.border,
            borderRadius: UI.radius.pill,
            paddingHorizontal: 16,
            height: 44,
            marginBottom: 16,
          }}
        >
          <icons.Search size={17} color={UI.color.muted} strokeWidth={1.7} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search currencies"
            placeholderTextColor={UI.color.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1,
              marginLeft: 10,
              fontFamily: "IBMPlexSans_500Medium",
              color: UI.color.text,
              fontSize: 15,
              padding: 0,
            }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <icons.XCircle size={17} color={UI.color.muted} strokeWidth={1.7} />
            </Pressable>
          )}
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {filtered.map((currency, i) => {
          const isSelected = currency.code === selected.code
          return (
            <Animated.View
              key={currency.code}
              entering={FadeIn.delay(i * 20).duration(300)}
            >
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync()
                  onSelect(currency)
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: UI.radius.md,
                  backgroundColor: isSelected ? UI.color.subtle : "transparent",
                  borderWidth: 1,
                  borderColor: isSelected ? UI.color.text : "transparent",
                  marginBottom: 8,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 44,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: isSelected ? UI.color.text : UI.color.control,
                    borderWidth: 1,
                    borderColor: isSelected ? UI.color.text : UI.color.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Typography
                    style={{
                      fontSize: 15,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      color: isSelected ? UI.color.textInverse : UI.color.text,
                    }}
                  >
                    {currency.symbol}
                  </Typography>
                </View>
                <View style={{ flex: 1 }}>
                  <Typography
                    style={{
                      fontSize: 16,
                      color: UI.color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {currency.code}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 13,
                      color: UI.color.muted,
                      fontFamily: "IBMPlexSans_500Medium",
                    }}
                  >
                    {currency.name}
                  </Typography>
                </View>
                {isSelected && (
                  <icons.Check size={18} color={UI.color.text} strokeWidth={2.5} />
                )}
              </Pressable>
            </Animated.View>
          )
        })}
      </ScrollView>
    </View>
  )
}
