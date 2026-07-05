import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";

// Helper to extract options passed to show()
export function CustomToast({ props, options }: { props: any; options: any }): JSX.Element {
  const isDanger = options.variant === "danger";
  const isSuccess = options.variant === "success";

  const IconComponent = isDanger ? icons.AlertCircle : isSuccess ? icons.CheckCircle : icons.Info;
  const iconColor = isDanger ? "#E04F4F" : isSuccess ? "#4CAF82" : TEXT_PRIMARY;

  return (
    <View
      style={{
        backgroundColor: BG,
        borderWidth: 1,
        borderColor: SEPARATOR,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        minHeight: 56,
        width: "90%",
        alignSelf: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginTop: 16,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: SEPARATOR,
        }}
      >
        <IconComponent size={20} color={iconColor} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        {!!options.label && (
          <Typography
            numberOfLines={1}
            style={{ fontSize: 15, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
          >
            {options.label}
          </Typography>
        )}
        {!!options.description && (
          <Typography
            numberOfLines={2}
            style={{
              fontSize: 13,
              color: TEXT_SECONDARY,
              fontFamily: "CrimsonText_600SemiBold",
              marginTop: 2,
            }}
          >
            {options.description}
          </Typography>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => props.hide(props.id)}
        style={({ pressed }) => ({
          padding: 8,
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <icons.X size={16} color={TEXT_SECONDARY} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
