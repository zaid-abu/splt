import { Redirect } from "expo-router";

import { legacyRedirectHref } from "@/features/navigation/shell";

export default function LegacyPeopleRedirect() {
  return <Redirect href={legacyRedirectHref("people")} />;
}
