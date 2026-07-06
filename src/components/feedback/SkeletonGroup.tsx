import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '../primitives/Skeleton';

export interface SkeletonGroupProps {
  variant: 'dashboard' | 'wallet' | 'groupList' | 'groupDetail' | 'profile';
  className?: string;
}

export function SkeletonGroup({ variant, className }: SkeletonGroupProps) {
  const renderDashboard = () => (
    <View className={`p-5 ${className || ''}`}>
      <View className="flex-row justify-between items-center mb-6">
        <Skeleton variant="text" width={120} height={28} />
        <Skeleton variant="circle" style={{ width: 40, height: 40 }} />
      </View>
      
      <View className="flex-row mb-8">
        <Skeleton variant="card" style={{ width: 240, height: 160 }} className="mr-4" />
        <Skeleton variant="card" style={{ width: 240, height: 160 }} />
      </View>

      <Skeleton variant="text" width={140} height={20} className="mb-4" />
      <View className="flex-row mb-8">
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} className="mr-4 items-center">
            <Skeleton variant="circle" style={{ width: 56, height: 56 }} className="mb-2" />
            <Skeleton variant="text" width={40} height={12} />
          </View>
        ))}
      </View>

      <Skeleton variant="text" width={160} height={20} className="mb-4" />
      <View className="flex-row -ml-2">
        <Skeleton variant="circle" style={{ width: 32, height: 32 }} className="ml-2" />
        <Skeleton variant="circle" style={{ width: 32, height: 32 }} className="ml-2" />
        <Skeleton variant="circle" style={{ width: 32, height: 32 }} className="ml-2" />
      </View>
    </View>
  );

  const renderWallet = () => (
    <View className={`p-5 ${className || ''}`}>
      <View className="flex-row justify-between items-center mb-6">
        <Skeleton variant="text" width={120} height={28} />
        <Skeleton variant="circle" style={{ width: 40, height: 40 }} />
      </View>
      
      <Skeleton variant="card" height={160} className="mb-8" />
      
      <Skeleton variant="text" width={140} height={20} className="mb-4" />
      <View className="flex-row items-end justify-between h-40 mb-8">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} variant="chart" height={40 + Math.random() * 80} />
        ))}
      </View>

      <Skeleton variant="text" width={140} height={20} className="mb-4" />
      {[1, 2, 3].map(i => (
        <View key={i} className="flex-row items-center mb-4">
          <Skeleton variant="circle" style={{ width: 40, height: 40 }} className="mr-4" />
          <View className="flex-1">
            <Skeleton variant="text" width={120} height={16} className="mb-1" />
            <Skeleton variant="text" width={80} height={12} />
          </View>
          <Skeleton variant="text" width={60} height={16} />
        </View>
      ))}
    </View>
  );

  const renderGroupList = () => (
    <View className={`p-5 ${className || ''}`}>
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} variant="listItem" className="mb-4" />
      ))}
    </View>
  );

  const renderGroupDetail = () => (
    <View className={`p-5 ${className || ''}`}>
      <View className="items-center mb-8">
        <Skeleton variant="circle" style={{ width: 80, height: 80 }} className="mb-4" />
        <Skeleton variant="text" width={160} height={24} className="mb-2" />
        <Skeleton variant="text" width={100} height={16} />
      </View>
      
      <Skeleton variant="text" width={120} height={20} className="mb-4" />
      <View className="flex-row flex-wrap mb-8">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="circle" style={{ width: 40, height: 40 }} className="mr-2 mb-2" />
        ))}
      </View>

      <Skeleton variant="text" width={140} height={20} className="mb-4" />
      {[1, 2, 3].map(i => (
        <Skeleton key={i} variant="listItem" className="mb-4" />
      ))}
    </View>
  );

  const renderProfile = () => (
    <View className={`p-5 ${className || ''}`}>
      <View className="items-center mb-8">
        <Skeleton variant="circle" style={{ width: 80, height: 80 }} className="mb-4" />
        <Skeleton variant="text" width={160} height={24} className="mb-2" />
        <Skeleton variant="text" width={120} height={16} />
      </View>
      
      <Skeleton variant="text" width={100} height={20} className="mb-4" />
      {[1, 2, 3].map(i => (
        <Skeleton key={i} variant="text" height={48} className="mb-2" />
      ))}
      
      <View className="h-8" />
      
      <Skeleton variant="text" width={100} height={20} className="mb-4" />
      {[1, 2].map(i => (
        <Skeleton key={i} variant="text" height={48} className="mb-2" />
      ))}
    </View>
  );

  switch (variant) {
    case 'dashboard': return renderDashboard();
    case 'wallet': return renderWallet();
    case 'groupList': return renderGroupList();
    case 'groupDetail': return renderGroupDetail();
    case 'profile': return renderProfile();
    default: return null;
  }
}
