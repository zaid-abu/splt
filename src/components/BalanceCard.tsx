/**
 * BalanceCard — HeroUI Card + Typography over LinearGradient.
 *
 * Card anatomy: Card > Card.Header | Card.Body | Card.Footer
 * Typography types: h1-h6, body, body-sm, body-xs
 *
 * @see https://heroui.com/docs/native/components/card.mdx
 * @see https://heroui.com/docs/native/components/text.mdx
 */
import { Card, Typography } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { View } from "react-native";

interface BalanceCardProps {
  owedToYou: number;
  youOwe: number;
  net: number;
  currencySymbol?: string;
  currencyCode?: string;
}

function fmt(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(a / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `${(a / 1_000).toFixed(1)}K`;
  return a.toFixed(2);
}

export function BalanceCard({
  owedToYou,
  youOwe,
  net,
  currencySymbol = "$",
  currencyCode = "USD",
}: BalanceCardProps): JSX.Element {
  const isPositive = net >= 0;

  return (
    <LinearGradient
      colors={
        isPositive
          ? ["#065F46", "#059669", "#10B981"]
          : ["#7F1D1D", "#DC2626", "#EF4444"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, marginBottom: 20 }}
    >
      {/* Use transparent Card variant so gradient shows through */}
      <Card variant="transparent" className="gap-0">
        <Card.Header className="pb-1">
          <Typography type="body-xs" className="text-white/70 font-medium tracking-wider">
            TOTAL BALANCE
          </Typography>
        </Card.Header>

        <Card.Body className="pt-0 pb-4">
          <View className="flex-row items-end gap-1">
            <Typography type="h1" className="text-white font-black tracking-tighter">
              {net < 0 ? "-" : ""}
              {currencySymbol}
              {fmt(net)}
            </Typography>
            <Typography type="body-sm" className="text-white/60 mb-2">
              {currencyCode}
            </Typography>
          </View>
        </Card.Body>

        <Card.Footer className="gap-3 pt-0">
          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <Typography type="body-xs" className="text-white/60 font-semibold tracking-wider">
              OWED TO YOU
            </Typography>
            <Typography type="h5" className="text-white font-bold mt-0.5">
              {currencySymbol}{fmt(owedToYou)}
            </Typography>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <Typography type="body-xs" className="text-white/60 font-semibold tracking-wider">
              YOU OWE
            </Typography>
            <Typography type="h5" className="text-white font-bold mt-0.5">
              {currencySymbol}{fmt(youOwe)}
            </Typography>
          </View>
        </Card.Footer>
      </Card>
    </LinearGradient>
  );
}
