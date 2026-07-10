import { Platform } from "react-native";
import { BlurView } from "expo-blur";
import { UI } from "@/components/ui/native-ui";

export function BlurredSheetBackground(): React.JSX.Element {
  return (
    <BlurView
      intensity={Platform.OS === "ios" ? 90 : 80}
      tint="light"
      style={{
        flex: 1,
        backgroundColor: Platform.OS === "android" ? UI.color.surface : "transparent",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      }}
    />
  );
}
