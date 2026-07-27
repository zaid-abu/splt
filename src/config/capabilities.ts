/**
 * Product capabilities that are safe to expose in the current release.
 *
 * A route can exist for migration/deep-link compatibility without presenting
 * a control for a backend or device feature that is not implemented yet.
 */
export const CAPABILITIES = {
  biometricLogin: false,
  accountDeletion: false,
  dataExport: false,
  scheduledExpenseReview: false,
  helpGuides: false,
  supportContact: false,
  notificationPreferences: false,
  reduceMotionPreference: false,
} as const;

export type Capability = keyof typeof CAPABILITIES;

export function isCapabilityEnabled(capability: Capability): boolean {
  return CAPABILITIES[capability];
}
