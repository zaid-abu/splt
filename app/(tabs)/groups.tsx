import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '../../src/components/primitives/Text';
import { BillCard } from '../../src/components/cards/BillCard';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { SlideUp } from '../../src/components/animations/SlideUp';
import { FadeIn } from '../../src/components/animations/FadeIn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const mockGroups = [
  { id: '1', title: 'Apt 4B Rent', amount: 1200, splitCount: 3 },
  { id: '2', title: 'Summer Trip', amount: 450.50, splitCount: 5 },
  { id: '3', title: 'Dinner Club', amount: 80, splitCount: 4 },
];

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState('');

  return (
    <View className="flex-1 bg-[var(--color-background)]" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <SlideUp distance={20} damping={15}>
            <View className="flex-row justify-between items-center mb-6">
              <Text variant="screenTitle">Groups</Text>
              <Text variant="button" color="primary">Create New</Text>
            </View>
          </SlideUp>

          <SlideUp distance={20} delay={100} damping={15}>
            <SearchBar 
              value={search} 
              onChangeText={setSearch} 
              placeholder="Search groups..." 
              className="mb-8"
            />
          </SlideUp>

          <FadeIn delay={200} className="flex-row flex-wrap justify-between">
            {mockGroups.map((group, index) => (
              <BillCard 
                key={group.id}
                title={group.title}
                amount={group.amount}
                splitCount={group.splitCount}
                className="w-full mb-4 mr-0" 
              />
            ))}
          </FadeIn>
        </View>
      </ScrollView>
    </View>
  );
}
