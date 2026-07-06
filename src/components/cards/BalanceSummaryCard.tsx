import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { AnimatedNumber } from '../primitives/AnimatedNumber';
import { Chip } from '../ui/Chip';
import { ArrowLeftRight, ArrowDownToLine, Plus } from 'lucide-react-native';

export interface BalanceSummaryCardProps {
  balance: number;
  currency?: string;
  onTopup?: () => void;
  onExchange?: () => void;
  onWithdraw?: () => void;
  className?: string;
}

export function BalanceSummaryCard({
  balance,
  currency = 'USD',
  onTopup,
  onExchange,
  onWithdraw,
  className
}: BalanceSummaryCardProps) {
  return (
    <View className={`bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm ${className || ''}`}>
      <View className="flex-row justify-between items-center mb-2">
        <Text variant="bodySmall" color="muted" className="font-medium">Total Balance</Text>
        <Chip 
          label="Topup" 
          icon={Plus} 
          variant="outline" 
          onPress={onTopup} 
          className="py-1 px-3"
        />
      </View>
      
      <View className="flex-row items-end mb-6">
        <AnimatedNumber value={balance} variant="amountLarge" />
        <Text variant="body" color="muted" className="ml-2 mb-1.5 font-medium">{currency}</Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Chip 
            label="Exchange" 
            icon={ArrowLeftRight} 
            variant="filled" 
            onPress={onExchange} 
            className="w-full"
          />
        </View>
        <View className="flex-1">
          <Chip 
            label="Withdraw" 
            icon={ArrowDownToLine} 
            variant="filled" 
            onPress={onWithdraw} 
            className="w-full"
          />
        </View>
      </View>
    </View>
  );
}
