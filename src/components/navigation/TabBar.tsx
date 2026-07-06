import React from 'react';
import { View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TabBarItem } from './TabBarItem';
import { Layout } from '../../constants/layout';
import { 
  Home, 
  PieChart, 
  Plus, 
  ClipboardList, 
  User 
} from 'lucide-react-native';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const getIcon = (routeName: string) => {
    switch (routeName) {
      case 'index': return Home;
      case 'wallet': return PieChart;
      case 'add': return Plus;
      case 'groups': return ClipboardList;
      case 'profile': return User;
      default: return Home;
    }
  };

  return (
    <View 
      className="flex-row bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-[var(--spacing-safe-bottom)] shadow-sm"
      style={{ height: Layout.tabBarHeight + 20 }}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isCenter = route.name === 'add';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarItem
            key={route.key}
            icon={getIcon(route.name)}
            isFocused={isFocused}
            isCenter={isCenter}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}
