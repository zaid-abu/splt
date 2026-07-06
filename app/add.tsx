import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet, { BottomSheetBackdrop, BottomSheetTextInput, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Text } from '../src/components/primitives/Text';
import { Pressable } from '../src/components/primitives/Pressable';
import { Theme } from '../src/constants/theme';
import { X, Receipt } from 'lucide-react-native';
import { AvatarStack } from '../src/components/ui/AvatarStack';

export default function AddExpenseScreen() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  const snapPoints = useMemo(() => ['90%'], []);

  const handleSheetChanges = (index: number) => {
    if (index === -1) {
      router.back();
    }
  };

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
    />
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        keyboardBehavior="extend"
        backgroundStyle={{ backgroundColor: Theme.colors.background }}
        handleIndicatorStyle={{ backgroundColor: Theme.colors.mutedForeground }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View className="px-6 py-4 flex-row justify-between items-center border-b border-[var(--color-border)]">
            <Text variant="cardLabel">Add Expense</Text>
            <Pressable onPress={() => bottomSheetRef.current?.close()} className="p-2 -mr-2 bg-[var(--color-surface)] rounded-full">
              <X size={20} color={Theme.colors.foreground} />
            </Pressable>
          </View>

          <BottomSheetScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
            <View className="items-center mb-8">
              <Text variant="caption" color="muted" className="mb-2">Enter Amount</Text>
              <View className="flex-row items-center">
                <Text variant="screenTitle" color="primary" className="mr-1">$</Text>
                <BottomSheetTextInput
                  placeholder="0.00"
                  placeholderTextColor={Theme.colors.mutedForeground}
                  keyboardType="decimal-pad"
                  style={{
                    fontSize: 48,
                    fontFamily: 'DMSans_700Bold',
                    color: Theme.colors.foreground,
                    minWidth: 100,
                    textAlign: 'center'
                  }}
                  autoFocus
                />
              </View>
            </View>

            <View className="bg-[var(--color-surface)] rounded-2xl p-4 mb-6 border border-[var(--color-border)]">
              <View className="flex-row items-center">
                <Receipt size={20} color={Theme.colors.mutedForeground} className="mr-3" />
                <BottomSheetTextInput
                  placeholder="What was this for?"
                  placeholderTextColor={Theme.colors.mutedForeground}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontFamily: 'DMSans_400Regular',
                    color: Theme.colors.foreground
                  }}
                />
              </View>
            </View>

            <View className="bg-[var(--color-surface)] rounded-2xl p-4 mb-8 border border-[var(--color-border)] flex-row justify-between items-center">
              <Text variant="body" className="font-medium">Split with</Text>
              <AvatarStack 
                users={[{ id: '1', name: 'Alex' }, { id: '2', name: 'Sarah' }]} 
                max={2} 
                onPress={() => Keyboard.dismiss()}
              />
            </View>

          </BottomSheetScrollView>
          
          <View className="p-6 pb-8 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
            <Pressable 
              onPress={() => bottomSheetRef.current?.close()} 
              haptic="success"
              className="bg-[var(--color-primary)] py-4 rounded-full items-center shadow-lg shadow-[var(--color-primary)]/30"
            >
              <Text variant="button" color="inverse">Split Expense</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
}
