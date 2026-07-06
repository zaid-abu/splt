import React from 'react';
import { Text } from '../primitives/Text';
import { Avatar } from '../ui/Avatar';
import { Pressable } from '../primitives/Pressable';

export interface FriendCardProps {
  name: string;
  avatarUrl?: string | null;
  onPress?: () => void;
  className?: string;
}

export function FriendCard({
  name,
  avatarUrl,
  onPress,
  className
}: FriendCardProps) {
  const firstName = name.split(' ')[0];

  return (
    <Pressable onPress={onPress} className={`items-center mr-4 w-[72px] ${className || ''}`}>
      <Avatar name={name} url={avatarUrl} size="lg" className="mb-2" />
      <Text variant="caption" className="font-medium text-center" numberOfLines={1}>
        {firstName}
      </Text>
    </Pressable>
  );
}
