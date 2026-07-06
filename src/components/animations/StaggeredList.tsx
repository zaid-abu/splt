import React, { useCallback } from 'react';
import { FlashList, FlashListProps, ListRenderItemInfo } from '@shopify/flash-list';
import Animated, { SlideInDown } from 'react-native-reanimated';

export interface StaggeredListProps<T> extends Omit<FlashListProps<T>, 'renderItem'> {
  renderItem: (info: ListRenderItemInfo<T>) => React.ReactElement | null;
  staggerDelay?: number;
}

export function StaggeredList<T>({ 
  renderItem, 
  staggerDelay = 50,
  ...props 
}: StaggeredListProps<T>) {
  const animatedRenderItem = useCallback((info: ListRenderItemInfo<T>) => {
    const item = renderItem(info);
    if (!item) return null;
    
    return (
      <Animated.View entering={SlideInDown.delay(Math.min(info.index, 10) * staggerDelay).springify().damping(20)}>
        {item}
      </Animated.View>
    );
  }, [renderItem, staggerDelay]);

  return (
    <FlashList
      renderItem={animatedRenderItem}
      {...props}
    />
  );
}
