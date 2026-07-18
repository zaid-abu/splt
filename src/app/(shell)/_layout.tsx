import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import Tabs from "expo-router/js-tabs";

import { CircleDock } from "@/components/coral/CircleDock";
import { GlobalActionSheet } from "@/components/coral/GlobalActionSheet";
import { useCoralColors } from "@/components/coral/useCoral";
import { SHELL_TABS } from "@/features/navigation/shell";
import { useReducedMotion } from "@/utils/useReducedMotion";

export default function ShellLayout(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const reduceMotion = useReducedMotion();
  const [actionsVisible, setActionsVisible] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: coral.bg }}>
      <Tabs
        initialRouteName="(home-tab)"
        tabBar={(props) => <CircleDock {...props} onAddPress={() => setActionsVisible(true)} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          animation: reduceMotion ? "none" : "fade",
          sceneStyle: { backgroundColor: coral.bg },
        }}
      >
        {SHELL_TABS.map((tab) => (
          <Tabs.Screen
            key={tab.key}
            name={tab.routeName}
            options={{
              title: tab.label,
              href: tab.href,
              tabBarAccessibilityLabel: tab.label,
            }}
          />
        ))}
      </Tabs>
      <GlobalActionSheet
        visible={actionsVisible}
        onClose={() => setActionsVisible(false)}
        onActionPress={(href) => {
          setActionsVisible(false);
          router.push(href);
        }}
      />
    </View>
  );
}
