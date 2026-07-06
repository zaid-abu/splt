import React from 'react';
import { View } from 'react-native';
import { Avatar, AvatarProps } from './Avatar';
import { Pressable } from '../primitives/Pressable';
import { Text } from '../primitives/Text';
import Animated, { SlideInRight } from 'react-native-reanimated';

export interface AvatarStackProps {
  users: Array<{ id: string; name: string; url?: string | null }>;
  max?: number;
  size?: AvatarProps['size'];
  onPress?: () => void;
  className?: string;
}

export function AvatarStack({ 
  users, 
  max = 3, 
  size = 'sm', 
  onPress,
  className 
}: AvatarStackProps) {
  const visibleUsers = users.slice(0, max);
  const remaining = users.length - max;

  const stack = (
    <View className={`flex-row items-center ${className || ''}`}>
      {visibleUsers.map((user, index) => (
        <Animated.View 
          key={user.id} 
          entering={SlideInRight.delay(index * 50).springify()}
          style={{ marginLeft: index > 0 ? -12 : 0, zIndex: 10 - index }}
        >
          <Avatar 
            url={user.url} 
            name={user.name} 
            size={size} 
            bordered 
          />
        </Animated.View>
      ))}
      
      {remaining > 0 && (
        <Animated.View 
          entering={SlideInRight.delay(visibleUsers.length * 50).springify()}
          style={{ marginLeft: -12, zIndex: 1 }}
        >
          <View className="items-center justify-center bg-[var(--color-surface-3)] border-2 border-[var(--color-surface)] rounded-full"
            style={{ 
              width: size === 'sm' ? 32 : size === 'md' ? 40 : 24,
              height: size === 'sm' ? 32 : size === 'md' ? 40 : 24,
            }}
          >
            <Text variant="caption" className="font-medium text-[var(--color-foreground)]">
              +{remaining}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} scaleOnPress={false}>
        {stack}
      </Pressable>
    );
  }

  return stack;
}
