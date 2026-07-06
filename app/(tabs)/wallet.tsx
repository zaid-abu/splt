import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '../../src/components/primitives/Text';
import { BalanceSummaryCard } from '../../src/components/cards/BalanceSummaryCard';
import { SpendingChart } from '../../src/components/charts/SpendingChart';
import { SlideUp } from '../../src/components/animations/SlideUp';
import { FadeIn } from '../../src/components/animations/FadeIn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { Theme } from '../../src/constants/theme';

const mockChartData = [
  { label: 'Mon', value: 120 },
  { label: 'Tue', value: 340 },
  { label: 'Wed', value: 80 },
  { label: 'Thu', value: 450 },
  { label: 'Fri', value: 200 },
  { label: 'Sat', value: 890 },
  { label: 'Sun', value: 150 },
];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[var(--color-background)]" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <SlideUp distance={20} damping={15}>
            <Text variant="screenTitle" className="mb-6">Wallet</Text>
            <BalanceSummaryCard 
              balance={4582.50} 
              className="mb-8"
            />
          </SlideUp>

          <FadeIn delay={100}>
            <View className="flex-row justify-between items-center mb-6">
              <Text variant="sectionLabel">Spending Overview</Text>
              <Text variant="button" color="primary">This Week</Text>
            </View>
            
            <View className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] mb-8">
              <SpendingChart data={mockChartData} />
            </View>
          </FadeIn>

          <FadeIn delay={200}>
            <Text variant="sectionLabel" className="mb-4">Monthly Analytics</Text>
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1 bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)]">
                <View className="w-10 h-10 rounded-full bg-[var(--color-success-soft)] items-center justify-center mb-3">
                  <ArrowDownLeft size={20} color={Theme.colors.success} />
                </View>
                <Text variant="caption" color="muted" className="mb-1">Total Received</Text>
                <Text variant="cardLabel" color="success">+$1,240.00</Text>
              </View>
              
              <View className="flex-1 bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)]">
                <View className="w-10 h-10 rounded-full bg-[var(--color-danger-soft)] items-center justify-center mb-3">
                  <ArrowUpRight size={20} color={Theme.colors.danger} />
                </View>
                <Text variant="caption" color="muted" className="mb-1">Total Spent</Text>
                <Text variant="cardLabel" color="danger">-$850.50</Text>
              </View>
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </View>
  );
}
