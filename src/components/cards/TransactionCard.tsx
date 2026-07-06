import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { Avatar } from '../ui/Avatar';
import { Pressable } from '../primitives/Pressable';
import dayjs from 'dayjs';

export interface TransactionCardProps {
  title: string;
  date: string | Date;
  amount: number;
  avatarUrl?: string | null;
  onPress?: () => void;
  className?: string;
}

export function TransactionCard({
  title,
  date,
  amount,
  avatarUrl,
  onPress,
  className
}: TransactionCardProps) {
  const isPositive = amount >= 0;
  const formattedDate = dayjs(date).format('DD MMM, YYYY | HH:mm');

  return (
    <Pressable onPress={onPress} className={`flex-row items-center py-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] ${className || ''}`}>
      <Avatar name={title} url={avatarUrl} size="md" className="mr-4" />
      
      <View className="flex-1">
        <Text variant="cardLabel" numberOfLines={1}>{title}</Text>
        <Text variant="caption" className="mt-0.5">{formattedDate}</Text>
      </View>

      <Text 
        variant="body" 
        color={isPositive ? 'success' : 'danger'} 
        className="font-medium"
      >
        {isPositive ? '+' : '-'} ${Math.abs(amount).toFixed(2)}
      </Text>
    </Pressable>
  );
}
