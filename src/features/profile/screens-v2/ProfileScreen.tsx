import type { JSX } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronRight } from "lucide-react-native";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralButton } from "@/components/coral/CoralButton";
import { useCoralColors } from "@/components/coral/useCoral";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useProfile } from "@/features/profile/hooks/useProfile";

export default function ProfileScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { currentUser } = useProfile();

  const handleRowPress = (path: string) => {
    void Haptics.selectionAsync();
    router.push(path as any);
  };

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Profile" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Profile Identity block */}
        <View style={{ alignItems: "center", marginTop: 20, marginBottom: 28, gap: 12 }}>
          {currentUser.id ? <AppUserAvatar user={currentUser} size="lg" /> : null}
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 24, color: coral.foreground }}>
            {currentUser.name || "Splt User"}
          </Text>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 14, color: coral.muted }}>
            {currentUser.email}
          </Text>
        </View>

        <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.foreground, marginBottom: 10 }}>
          Account settings
        </Text>

        <View style={{ backgroundColor: coral.surface, borderWidth: 1, borderColor: coral.border, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
          
          {/* Personal Details */}
          <View style={{ paddingHorizontal: 4 }}>
            <CoralButton
              label="Personal details"
              variant="text"
              onPress={() => handleRowPress("/profile/edit")}
            />
          </View>

          <View style={{ height: 1, backgroundColor: coral.border, opacity: 0.5 }} />

          {/* Security */}
          <View style={{ paddingHorizontal: 4 }}>
            <CoralButton
              label="Profile and security"
              variant="text"
              onPress={() => handleRowPress("/profile/security")}
            />
          </View>

          <View style={{ height: 1, backgroundColor: coral.border, opacity: 0.5 }} />

          {/* Notification settings */}
          <View style={{ paddingHorizontal: 4 }}>
            <CoralButton
              label="Notifications"
              variant="text"
              onPress={() => handleRowPress("/profile/notifications")}
            />
          </View>

        </View>

        <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.foreground, marginBottom: 10 }}>
          Data and exports
        </Text>

        <View style={{ backgroundColor: coral.surface, borderWidth: 1, borderColor: coral.border, borderRadius: 16, overflow: "hidden", marginBottom: 28 }}>
          
          {/* Export */}
          <View style={{ paddingHorizontal: 4 }}>
            <CoralButton
              label="Export your data"
              variant="text"
              onPress={() => handleRowPress("/profile/export")}
            />
          </View>

        </View>

        <CoralButton
          label="Edit profile details"
          variant="primary"
          onPress={() => handleRowPress("/profile/edit")}
        />

      </ScrollView>
    </CoralScreen>
  );
}
