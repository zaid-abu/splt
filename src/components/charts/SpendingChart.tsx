import React, { useState } from 'react';
import { View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text } from '../primitives/Text';
import { Theme } from '../../constants/theme';

export interface SpendingChartData {
  value: number;
  label: string;
}

export interface SpendingChartProps {
  data: SpendingChartData[];
  className?: string;
}

export function SpendingChart({ data, className }: SpendingChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map(d => d.value), 1000);
  const yAxisMax = Math.ceil(maxValue / 1000) * 1000;

  const chartData = data.map((item, index) => {
    const isSelected = selectedIndex === index;
    return {
      value: item.value,
      label: item.label,
      frontColor: isSelected ? Theme.colors.primaryDark : Theme.colors.primaryLight,
      topLabelComponent: () => isSelected ? (
        <View className="bg-[var(--color-surface)] shadow-sm px-2 py-1 rounded-md mb-2 absolute -top-8 -left-4 w-16 items-center">
          <Text variant="caption" className="font-semibold text-[var(--color-primary)]">
            ${item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
          </Text>
        </View>
      ) : null,
      onPress: () => setSelectedIndex(index),
    };
  });

  return (
    <View className={`w-full overflow-hidden ${className || ''}`}>
      <BarChart
        data={chartData}
        barWidth={32}
        spacing={24}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: Theme.colors.mutedForeground, fontSize: 12, fontFamily: 'DMSans_400Regular' }}
        xAxisLabelTextStyle={{ color: Theme.colors.mutedForeground, fontSize: 12, fontFamily: 'DMSans_400Regular' }}
        noOfSections={4}
        maxValue={yAxisMax}
        formatYLabel={(label) => `$${Number(label) >= 1000 ? `${Number(label) / 1000}k` : label}`}
        isAnimated
        animationDuration={800}
      />
    </View>
  );
}
