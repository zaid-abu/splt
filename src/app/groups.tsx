import { Redirect } from "expo-router";

import { legacyRedirectHref } from "@/features/navigation/shell";

export default function LegacyGroupsRedirect() {
  return <Redirect href={legacyRedirectHref("groups")} />;
}
