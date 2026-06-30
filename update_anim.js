const fs = require('fs');

const animatorCode = `import type { JSX, PropsWithChildren } from "react";
import { useCallback } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";

interface FocusAwareViewProps extends PropsWithChildren {
  delay?: number;
  className?: string;
  style?: any;
}

export function FocusAwareView({ children, delay = 0, className, style }: FocusAwareViewProps): JSX.Element {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useFocusEffect(
    useCallback(() => {
      // Reset
      opacity.value = 0;
      translateY.value = 20;
      
      const timeout = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 300 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }, delay);
      
      return () => {
        clearTimeout(timeout);
      };
    }, [delay])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]} className={className}>
      {children}
    </Animated.View>
  );
}
`;
fs.writeFileSync('src/components/PageAnimator.tsx', animatorCode);

const files = [
  "src/app/(tabs)/index.tsx",
  "src/app/(tabs)/friends.tsx",
  "src/app/(tabs)/groups.tsx",
  "src/app/(tabs)/activity.tsx",
  "src/app/profile.tsx"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('FocusAwareView')) {
    content = content.replace(
      /import Animated, { FadeInDown } from "react-native-reanimated";\n?/g, 
      'import Animated, { FadeInDown } from "react-native-reanimated";\nimport { FocusAwareView } from "@/components/PageAnimator";\n'
    );
  }

  // Replace outer
  content = content.replace(/<Animated\.View style={{ flex: 1 }} entering={FadeInDown\.duration\(300\)\.springify\(\)}>/g, '<FocusAwareView style={{ flex: 1 }}>');
  
  // Replace inner with delay
  content = content.replace(/<Animated\.View entering={FadeInDown\.delay\((\d+)\)\.springify\(\)}/g, '<FocusAwareView delay={$1}');
  
  // Replace mathematical delays like 100 + index * 50
  content = content.replace(/<Animated\.View key={([^}]+)} entering={FadeInDown\.delay\(([^)]+)\)\.springify\(\)}/g, '<FocusAwareView key={$1} delay={$2}');
  content = content.replace(/<Animated\.View entering={FadeInDown\.delay\(([^)]+)\)\.springify\(\)}/g, '<FocusAwareView delay={$1}');

  // Replace closing tags
  content = content.replace(/<\/Animated\.View>/g, '</FocusAwareView>');

  fs.writeFileSync(file, content);
}
console.log("Done updating animations!");
