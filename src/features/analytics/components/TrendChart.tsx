import type { JSX } from "react";
import { View, Pressable , Text , useWindowDimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import * as icons from "lucide-react-native";
import { useUI } from "@/components/ui";
import { Eyebrow, useCoralColors } from "@/components/coral";
import type { TrendData } from "@/types";

interface TrendChartProps {
  trendData: TrendData[];
  onLogExpense: () => void;
}

export function TrendChart({ trendData, onLogExpense }: TrendChartProps): JSX.Element {
  const { color, space } = useUI();
  const coral = useCoralColors();
  const { width } = useWindowDimensions();

  const trendChartData = (() => {
    const labelEvery = Math.max(1, Math.ceil(trendData.length / 4));
    return trendData.map((point, index) => ({
      value: point.value,
      label:
        index === 0 || index === trendData.length - 1 || index % labelEvery === 0
          ? point.label.replace(" ", "\n")
          : "",
    }));
  })();

  const trendMax = trendData.reduce((max, point) => Math.max(max, point.value), 0);
  const chartWidth = Math.max(220, width - space.page * 2 - 56);

  return (
    <View style={{ marginBottom: 28 }}>
      <Eyebrow style={{ marginTop: 0 }}>Trend</Eyebrow>
      <View
        style={{
          backgroundColor: coral.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: coral.border,
          overflow: "hidden",
        }}
      >
        <View style={{ padding: 16 }}>
          {trendChartData.length > 0 && trendMax > 0 ? (
            <View style={{ marginLeft: -10, marginTop: 2 }}>
              <LineChart
                data={trendChartData}
                areaChart
                curved
                isAnimated
                height={170}
                width={chartWidth}
                spacing={Math.max(34, chartWidth / Math.max(4, trendChartData.length - 1))}
                color={color.text}
                thickness={2}
                startFillColor={color.text}
                endFillColor={color.text}
                startOpacity={0.1}
                endOpacity={0.01}
                hideDataPoints
                hideYAxisText
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={color.border}
                rulesColor={color.border}
                rulesThickness={1}
                noOfSections={3}
                maxValue={trendMax * 1.2}
                xAxisLabelTextStyle={{
                  color: color.muted,
                  fontFamily: "InstrumentSans_500Medium",
                  fontSize: 10,
                }}
              />
            </View>
          ) : (
            <View style={{ paddingVertical: 28, alignItems: "center" }}>
              <icons.LineChart size={38} color={color.muted} strokeWidth={1.25} />
              <Text
                style={{
                  marginTop: 12,
                  color: color.muted,
                  fontFamily: "InstrumentSans_500Medium",
                  marginBottom: 16,
                }}
              >
                No spending trend for this period.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onLogExpense}
                style={({ pressed }) => ({
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: color.text,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: color.textInverse,
                    fontFamily: "InstrumentSans_600SemiBold",
                  }}
                >
                  Log an expense
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
