export const Colors = {
  primary: '#159A78', // Primary green
  darkForest: '#245C4B', // Dark forest green
  lightMint: '#E5F3E9', // Light mint background
  veryLightMint: '#F1F8F2', // Very light mint for card accents
  warmCream: '#F8F1E5', // Warm cream background alternative
  softPeach: '#F7E4D4', // Soft peach highlight
  white: '#FFFFFF',
  mainText: '#293A33', // Deep charcoal-green text
  secondaryText: '#7A877F', // Muted secondary text
  borders: '#E5EAE5', // Subtle divider border
  success: '#21845A',
  warning: '#C9892B',
  error: '#C74D4D',
  cardBg: '#FFFFFF',
  surfaceLight: '#F7FAF8',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: Colors.darkForest },
  h2: { fontSize: 20, fontWeight: '700' as const, color: Colors.darkForest },
  h3: { fontSize: 16, fontWeight: '600' as const, color: Colors.darkForest },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.mainText },
  bodyBold: { fontSize: 14, fontWeight: '600' as const, color: Colors.mainText },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.secondaryText },
  captionBold: { fontSize: 12, fontWeight: '600' as const, color: Colors.secondaryText },
};
