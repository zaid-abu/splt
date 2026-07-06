import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import * as icons from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/primitives/Text";

interface EmptyStateProps {
  icon?: keyof typeof icons;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  className?: string;
  children?: ReactNode;
}

const iconSize = 48;

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps): JSX.Element {
  const IconComponent = icon ? (icons[icon] as any) : null; // eslint-disable-line import/namespace

  return (
    <View className={twMerge("py-8 px-4 items-center justify-center gap-3", className)}>
      {IconComponent && (
        <View className="w-20 h-20 items-center justify-center bg-surface-2 rounded-full mb-2">
          <IconComponent size={iconSize} color="#71717A" strokeWidth={1.5} />
        </View>
      )}
      <Text variant="sectionLabel" className="mt-4 mb-2 text-foreground text-center">
        {title}
      </Text>
      {description && (
        <Text variant="body" color="muted" className="text-center mb-6 max-w-[280px]">
          {description}
        </Text>
      )}
      {action && (
        <Button variant="primary" size="sm" onPress={action.onPress} className="mt-2">
          {action.label}
        </Button>
      )}
      {children}
    </View>
  );
}
