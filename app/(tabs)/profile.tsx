import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '../../src/components/primitives/Text';
import { Avatar } from '../../src/components/ui/Avatar';
import { Pressable } from '../../src/components/primitives/Pressable';
import { SlideUp } from '../../src/components/animations/SlideUp';
import { FadeIn } from '../../src/components/animations/FadeIn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, CreditCard, Bell, Shield, LogOut } from 'lucide-react-native';
import { Theme } from '../../src/constants/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const menuItems = [
    { icon: CreditCard, label: 'Payment Methods' },
    { icon: Bell, label: 'Notifications' },
    { icon: Shield, label: 'Security & Privacy' },
    { icon: Settings, label: 'App Settings' },
  ];

  return (
    <View className="flex-1 bg-[var(--color-background)]" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <SlideUp distance={20} damping={15}>
            <Text variant="screenTitle" className="mb-6">Profile</Text>
            
            <View className="items-center mb-10">
              <Avatar name="Alex Johnson" size="xl" bordered className="mb-4" />
              <Text variant="cardLabel">Alex Johnson</Text>
              <Text variant="body" color="muted">alex@example.com</Text>
            </View>
          </SlideUp>

          <FadeIn delay={100}>
            <View className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden mb-8">
              {menuItems.map((item, index) => (
                <Pressable 
                  key={index}
                  className={`flex-row items-center p-4 ${index !== menuItems.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}
                >
                  <View className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] items-center justify-center mr-4">
                    <item.icon size={20} color={Theme.colors.foreground} />
                  </View>
                  <Text variant="body" className="font-medium flex-1">{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </FadeIn>

          <FadeIn delay={200}>
            <Pressable 
              className="flex-row items-center justify-center p-4 rounded-xl bg-[var(--color-danger-soft)]"
            >
              <LogOut size={20} color={Theme.colors.danger} className="mr-2" />
              <Text variant="button" color="danger">Log Out</Text>
            </Pressable>
          </FadeIn>
        </View>
      </ScrollView>
    </View>
  );
}
