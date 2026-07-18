import { Redirect } from "expo-router";

import { legacyRedirectHref } from "@/features/navigation/shell";

export default function LegacySettingsRedirect() {
  return <Redirect href={legacyRedirectHref("settings")} />;
}
