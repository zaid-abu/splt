import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import { LineChart } from "react-native-gifted-charts";
import { useWindowDimensions } from "react-native";
import * as icons from "lucide-react-native";
import { useUI, SectionLabel } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import type { TrendData } from "@/types";

interface TrendChartProps {
  trendData: TrendData[];
  onLogExpense: () => void;
}

export function TrendChart({ trendData, onLogExpense }: TrendChartProps): JSX.Element {
  const { color, space } = useUI();
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
    <Card padding={16}>
      <SectionLabel style={{ marginBottom: 12 }}>Trend</SectionLabel>
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
              fontFamily: "IBMPlexSans_500Medium",
              fontSize: 10,
            }}
          />
        </View>
      ) : (
        <View style={{ paddingVertical: 28, alignItems: "center" }}>
          <icons.LineChart size={38} color={color.muted} strokeWidth={1.25} />
          <Typography
            style={{
              marginTop: 12,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              marginBottom: 16,
            }}
          >
            No spending trend for this period.
          </Typography>
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
            <Typography
              style={{
                fontSize: 14,
                color: color.textInverse,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Log an expense
            </Typography>
          </Pressable>
        </View>
      )}
    </Card>
  );
}
