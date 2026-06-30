import React, { useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { PressableFeedback, Typography } from 'heroui-native';
import * as icons from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onSettle?: () => void;
}

export function SwipeableRow({ children, onDelete, onSettle }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.9, 0],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionContainer}>
        {onSettle && (
          <Animated.View style={[styles.actionButton, { backgroundColor: '#10b981', transform: [{ scale }], opacity }]}>
            <PressableFeedback
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                swipeableRef.current?.close();
                onSettle();
              }}
              style={styles.actionInner}
            >
              <icons.CheckCircle size={24} color="white" />
              <Typography type="body-xs" className="text-white font-bold mt-1">Settle</Typography>
            </PressableFeedback>
          </Animated.View>
        )}
        
        {onDelete && (
          <Animated.View style={[styles.actionButton, { backgroundColor: '#ef4444', transform: [{ scale }], opacity }]}>
            <PressableFeedback
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                swipeableRef.current?.close();
                onDelete();
              }}
              style={styles.actionInner}
            >
              <icons.Trash2 size={24} color="white" />
              <Typography type="body-xs" className="text-white font-bold mt-1">Delete</Typography>
            </PressableFeedback>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  actionButton: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 8,
    overflow: 'hidden',
  },
  actionInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    paddingVertical: 12,
  }
});
