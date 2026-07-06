import React, { useRef } from 'react';
import { View, Animated as RNAnimated } from 'react-native';
import { Text } from '../primitives/Text';
import { IconBadge } from '../ui/IconBadge';
import { Pressable } from '../primitives/Pressable';
import { Receipt, Trash2 } from 'lucide-react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Theme } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

export interface ExpenseCardProps {
  title: string;
  payerName: string;
  amount: number;
  userShare?: number;
  onPress?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ExpenseCard({
  title,
  payerName,
  amount,
  userShare,
  onPress,
  onDelete,
  className
}: ExpenseCardProps) {
  const swipeableRef = useRef<any>(null);

  const renderRightActions = (prog: any, drag: any) => {
    // ReanimatedSwipeable uses Reanimated SharedValues for progress/drag
    // But since it's a simple swipe, we can just render the view.
    return (
      <View className="w-20 bg-[var(--color-danger)] items-center justify-center h-full">
        <Pressable
          className="flex-1 w-full items-center justify-center"
          onPress={() => {
            swipeableRef.current?.close();
            onDelete?.();
          }}
          haptic="heavy"
        >
          <Trash2 size={24} color={Theme.colors.surface} />
        </Pressable>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={onDelete ? renderRightActions : undefined}
      onSwipeableOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      containerStyle={{ backgroundColor: 'var(--color-danger)' }}
    >
      <Pressable onPress={onPress} className={`flex-row items-center p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] ${className || ''}`}>
        <IconBadge icon={Receipt} variant="muted" size="md" className="mr-4" />
        
        <View className="flex-1 justify-center">
          <Text variant="cardLabel" numberOfLines={1}>{title}</Text>
          <View className="flex-row items-center mt-1">
            <Text variant="caption">Paid by </Text>
            <Text variant="caption" color="primary" className="font-medium">{payerName}</Text>
          </View>
        </View>

        <View className="items-end">
          <Text variant="body" className="font-semibold">${amount.toFixed(2)}</Text>
          {userShare !== undefined && userShare !== 0 && (
            <Text variant="caption" color={userShare > 0 ? 'success' : 'danger'} className="font-medium mt-0.5">
              {userShare > 0 ? 'You lent' : 'You owe'} ${Math.abs(userShare).toFixed(2)}
            </Text>
          )}
        </View>
      </Pressable>
    </Swipeable>
  );
}
