export const Theme = {
  colors: {
    primary: '#3D2B82',
    primaryLight: '#5B3FA0',
    primaryDark: '#2B1F5E',
    accent: '#6C5CE7',
    success: '#00C48C',
    danger: '#FF4757',
    background: '#F5F5F7',
    surface: '#FFFFFF',
    foreground: '#1A1A2E',
    mutedForeground: '#8E8EA0',
    border: '#E8E8F0',
  },
  gradients: {
    primary: ['#3D2B82', '#2B1F5E'],      // Dashboard header
    accent: ['#6C5CE7', '#3D2B82'],        // Buttons, highlights
    onboarding: ['#5B3FA0', '#2B1F5E'],   // Onboarding background
    danger: ['#FF4757', '#C41B2D'],       // Danger actions
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32 },
  radii: { sm: 8, md: 14, lg: 20, xl: 28, full: 9999 },
} as const;
