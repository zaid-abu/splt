import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '../primitives/Skeleton';

export interface ChartSkeletonProps {
  bars?: number;
  className?: string;
}

export function ChartSkeleton({ bars = 6, className }: ChartSkeletonProps) {
  return (
    <View className={`flex-row items-end justify-between h-48 w-full px-2 ${className || ''}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <View key={i} className="items-center h-full justify-end" style={{ width: 32 }}>
          <Skeleton 
            variant="chart" 
            style={{ 
              height: `${20 + Math.random() * 60}%`,
              width: '100%' 
            }} 
          />
          <Skeleton variant="text" className="w-6 h-3 mt-2" />
        </View>
      ))}
    </View>
  );
}
