import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Text } from "@/components/primitives/Text";
import { twMerge } from "tailwind-merge";
import * as icons from "lucide-react-native";

export function CustomToast({ props, options }: { props: any; options: any }): JSX.Element {
  const isDanger = options.variant === "danger";
  const isSuccess = options.variant === "success";

  const IconComponent = isDanger ? icons.AlertCircle : isSuccess ? icons.CheckCircle : icons.Info;

  return (
    <View
      className="bg-surface border border-border px-4 py-3 flex-row items-center min-h-14 w-[90%] self-center shadow-lg mt-4 rounded-xl"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <View className="w-10 h-10 items-center justify-center mr-3 bg-transparent border border-border rounded-xl">
        <IconComponent
          size={20}
          color={isDanger ? "#EF4444" : isSuccess ? "#22C55E" : "#8E8E93"}
          strokeWidth={1.5}
        />
      </View>
      <View className="flex-1">
        {!!options.label && (
          <Text numberOfLines={1} className="text-[15px] font-bold text-foreground font-body">
            {options.label}
          </Text>
        )}
        {!!options.description && (
          <Text variant="bodySmall" className="text-foreground font-medium">{options.label}</Text>
        )}
        {options.description && <Text variant="caption" className="mt-0.5">{options.description}</Text>}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => props.hide(props.id)}
        className="p-2 active:opacity-50"
      >
        <icons.X size={16} color="#8E8E93" strokeWidth={2} />
      </Pressable>
    </View>
  );
}
