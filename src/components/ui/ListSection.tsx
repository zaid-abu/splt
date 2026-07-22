import { Children, type ReactNode } from "react";
import { View, Pressable, Text } from "react-native";
import { useUI } from "@/components/ui/hooks/useUI";
import { useCoralColors } from "@/components/coral";

interface ListSectionProps {
  label: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
  rightAction?: ReactNode;
  children: ReactNode;
}

export function ListSection({
  label,
  viewAllLabel,
  onViewAll,
  rightAction,
  children,
}: ListSectionProps): React.JSX.Element {
  const { color, radius } = useUI();
  const coral = useCoralColors();
  const childrenArray = Children.toArray(children);

  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: color.text,
            fontFamily: "InstrumentSans_600SemiBold",
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
        {onViewAll && viewAllLabel ? (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text
              style={{
                fontSize: 13,
                color: color.muted,
                fontFamily: "InstrumentSans_600SemiBold",
              }}
            >
              {viewAllLabel}
            </Text>
          </Pressable>
        ) : (
          rightAction
        )}
      </View>
      <View
        style={{
          borderRadius: radius.md,
          overflow: "hidden",
          backgroundColor: coral.surface,
          borderWidth: 1,
          borderColor: color.border,
        }}
      >
        {childrenArray.map((child, index) => {
          const isLast = index === childrenArray.length - 1;
          return (
            <View
              key={index}
              style={{
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: color.borderSoft,
              }}
            >
              {child}
            </View>
          );
        })}
      </View>
    </View>
  );
}
