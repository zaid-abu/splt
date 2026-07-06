import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Pressable } from '../primitives/Pressable';
import { Theme } from '../../constants/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ 
  value, 
  onChangeText, 
  placeholder = "Search...", 
  className 
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View 
      className={`flex-row items-center bg-[var(--color-surface-2)] rounded-xl px-3 h-12 ${
        isFocused ? 'border border-[var(--color-primary)]' : 'border border-transparent'
      } ${className || ''}`}
    >
      <Search size={20} color={Theme.colors.mutedForeground} />
      
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Theme.colors.mutedForeground}
        className="flex-1 ml-2 font-body text-base text-[var(--color-foreground)]"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      
      {value.length > 0 && (
        <Pressable onPress={handleClear} haptic="light" className="p-1">
          <X size={16} color={Theme.colors.mutedForeground} />
        </Pressable>
      )}
    </View>
  );
}
