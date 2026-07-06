import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { AnimatedNumber } from '../primitives/AnimatedNumber';
import { GradientBackground } from '../primitives/GradientBackground';
import { ClipboardList, MoreVertical } from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { Pressable } from '../primitives/Pressable';

export interface BillCardProps {
  title: string;
  amount: number;
  splitCount: number;
  onPress?: () => void;
  onOptionsPress?: () => void;
  className?: string;
}

export function BillCard({
  title,
  amount,
  splitCount,
  onPress,
  onOptionsPress,
  className,
}: BillCardProps) {
  return (
    <Pressable onPress={onPress} className={`w-[240px] h-[160px] rounded-2xl overflow-hidden mr-4 ${className || ''}`}>
      <GradientBackground variant="primary" className="p-4 justify-between">
        <View className="flex-row justify-between items-start">
          <View className="bg-[var(--color-surface)]/20 p-2 rounded-xl">
            <ClipboardList size={24} color={Theme.colors.surface} />
          </View>
          <Pressable onPress={onOptionsPress} haptic="light" className="p-1 -mr-1 -mt-1 rounded-full active:bg-[var(--color-surface)]/20">
            <MoreVertical size={20} color={Theme.colors.surface} />
          </Pressable>
        </View>

        <View>
          <Text variant="caption" color="inverse" className="opacity-80 mb-1">{title}</Text>
          <AnimatedNumber 
            value={amount} 
            variant="amountLarge" 
            style={{ color: Theme.colors.surface }} 
          />
          <View className="mt-2 flex-row items-center">
            <View className="bg-[var(--color-surface)]/20 px-2 py-1 rounded-md">
              <Text variant="caption" color="inverse" className="font-medium">
                Split to {splitCount}
              </Text>
            </View>
          </View>
        </View>
      </GradientBackground>
    </Pressable>
  );
}
