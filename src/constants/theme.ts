export const Colors = {
  primary: {
    50:  '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  // Enterprise — classic gold for the Teams / premium build
  enterprise: {
    50:  '#FDFBF0',
    100: '#FAF4D3',
    200: '#F5E6A3',
    300: '#EDD070',
    400: '#E4BB45',
    500: '#D4AF37',  // classic gold
    600: '#B8960C',
    700: '#9A7D0A',
    800: '#7D6408',
    900: '#614E06',
  },
  // Warm-black surfaces for enterprise
  enterpriseSurface: {
    950: '#07060200',
    900: '#0A0905',
    800: '#141209',
    700: '#1E1B0E',
    600: '#2A2410',
    500: '#3D3518',
  },
  surface: {
    900: '#0F172A',
    800: '#1E293B',
    700: '#334155',
    600: '#475569',
    500: '#64748B',
  },
  slate: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
  },
  gold: {
    400: '#FBBF24',
    500: '#F59E0B',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error:   '#EF4444',
  white:   '#FFFFFF',
  black:   '#000000',
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const Radius = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

export const FontSize = {
  xs:   12,
  sm:   14,
  base: 16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;
