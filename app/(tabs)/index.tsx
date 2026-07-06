import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '../../src/components/primitives/Text';
import { BillCard } from '../../src/components/cards/BillCard';
import { TransactionCard } from '../../src/components/cards/TransactionCard';
import { AvatarStack } from '../../src/components/ui/AvatarStack';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { FadeIn } from '../../src/components/animations/FadeIn';
import { SlideUp } from '../../src/components/animations/SlideUp';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const mockBills = [
  { id: '1', title: 'Weekend Trip', amount: 450.50, splitCount: 4 },
  { id: '2', title: 'Dinner at Mario\'s', amount: 120.00, splitCount: 3 },
];

const mockTransactions = [
  { id: '1', title: 'Alex paid you', amount: 45.00, date: new Date().toISOString() },
  { id: '2', title: 'You paid Sarah', amount: -25.50, date: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', title: 'Netflix Split', amount: 15.00, date: new Date(Date.now() - 86400000 * 2).toISOString() },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  return (
    <View className="flex-1 bg-[var(--color-background)]" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <SlideUp distance={20} damping={15}>
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text variant="caption" color="muted" className="mb-1 uppercase font-semibold tracking-wider">Good Morning</Text>
                <Text variant="screenTitle">Alex</Text>
              </View>
              <AvatarStack users={[{ id: '1', name: 'Alex' }]} max={1} size="md" />
            </View>
          </SlideUp>

          <SlideUp distance={20} delay={100} damping={15}>
            <SearchBar 
              value={search} 
              onChangeText={setSearch} 
              placeholder="Search expenses, friends..." 
              className="mb-8"
            />
          </SlideUp>

          <FadeIn delay={200}>
            <Text variant="sectionLabel" className="mb-4">Active Bills</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible -mx-6 px-6">
              {mockBills.map((bill, index) => (
                <BillCard 
                  key={bill.id}
                  title={bill.title}
                  amount={bill.amount}
                  splitCount={bill.splitCount}
                />
              ))}
            </ScrollView>
          </FadeIn>

          <FadeIn delay={300} className="mt-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text variant="sectionLabel">Recent Activity</Text>
              <Text variant="button" color="primary">See All</Text>
            </View>
            
            <View className="bg-[var(--color-surface)] rounded-2xl overflow-hidden border border-[var(--color-border)]">
              {mockTransactions.map((tx, index) => (
                <TransactionCard
                  key={tx.id}
                  title={tx.title}
                  amount={tx.amount}
                  date={tx.date}
                  className={index === mockTransactions.length - 1 ? 'border-b-0' : ''}
                />
              ))}
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </View>
  );
}
