import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard mobile baseline guideline: 375 x 812 (iPhone standard)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const dimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 360,
  isLargeDevice: SCREEN_WIDTH >= 412,
  isTablet: SCREEN_WIDTH >= 600,
};

// Responsive scaling utilities
export const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
export const verticalScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
export const moderateScale = (size, factor = 0.35) => {
  return Math.round(size + (scale(size) - size) * factor);
};

// Responsive font size utility - prevents text from being microscopic on large phones or giant on tablets
export const responsiveFont = (fontSize) => {
  const scaled = fontSize + (scale(fontSize) - fontSize) * 0.3;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

export const colors = {
  // Brand Deep Navy & Royal Blue
  navyDark: '#090d16',
  navyPrimary: '#0f172a',
  navySlate: '#1e293b',
  navyRoyal: '#1e3a8a',
  bluePrimary: '#2563eb',
  blueLight: '#3b82f6',
  blueSky: '#38bdf8',
  blueSoft: '#eff6ff',

  // Status & Semantics
  success: '#10b981',
  successDark: '#059669',
  successSoft: '#ecfdf5',
  successBorder: '#bbf7d0',

  warning: '#f59e0b',
  warningDark: '#d97706',
  warningSoft: '#fffbeb',
  warningBorder: '#fde68a',

  danger: '#ef4444',
  dangerDark: '#b91c1c',
  dangerSoft: '#fef2f2',
  dangerBorder: '#fecaca',

  // Neutrals & Backgrounds
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceSubtle: '#f1f5f9',
  border: '#e2e8f0',
  borderDark: '#cbd5e1',

  // Typography
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  textWhite: '#ffffff',

  // WhatsApp
  whatsapp: '#16a34a',
  whatsappLight: '#25D366',
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  modal: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
};
