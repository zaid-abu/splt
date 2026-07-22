import type { JSX } from "react";
import { useState } from "react";
import { useRouter } from "expo-router";
import Tabs from "expo-router/js-tabs";

import { CircleDock } from "@/components/coral/CircleDock";
import { GlobalActionSheet } from "@/components/coral/GlobalActionSheet";
import { SHELL_TABS } from "@/features/navigation/shell";

export default function ShellLayout(): JSX.Element {
  const router = useRouter();
  const [actionsVisible, setActionsVisible] = useState(false);

  return (
    <>
      <Tabs
        initialRouteName="(home-tab)"
        tabBar={(props) => <CircleDock {...props} onAddPress={() => setActionsVisible(true)} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          animation: "shift",
          sceneStyle: { backgroundColor: "transparent" },
          tabBarStyle: { position: "absolute", backgroundColor: "transparent", elevation: 0, borderTopWidth: 0 },
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
    </>
  );
}
