/**
 * Semantic design tokens for the enterprise (black & gold) theme.
 * Import these in every enterprise screen instead of raw hex codes.
 */

export const E = {
  // ── Backgrounds ────────────────────────────────────────────────────────────
  bg:          '#0A0905',   // page / screen background
  surface:     '#141209',   // cards, sheets
  surfaceAlt:  '#1E1B0E',   // nested surfaces, row separators
  border:      '#2A2410',   // dividers, outlines
  borderSub:   '#1E1B0E',   // subtle borders

  // ── Gold accent ────────────────────────────────────────────────────────────
  gold:        '#D4AF37',   // primary CTA, active state
  goldDim:     '#B8960C',   // pressed / secondary
  goldFaint:   '#D4AF1420', // tinted background behind gold elements
  goldTint:    '#D4AF3714', // very light tint for rows / chips

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary:   '#F5EDD0', // headings, primary text (warm white)
  textSecondary: '#A89860', // body, descriptions
  textMuted:     '#6B5D30', // placeholders, timestamps
  textDisabled:  '#3D3518', // disabled state

  // ── Semantic ───────────────────────────────────────────────────────────────
  success:  '#22C55E',
  warning:  '#F59E0B',
  error:    '#EF4444',
  info:     '#D4AF37',

  // ── Role badge colours ─────────────────────────────────────────────────────
  roleColors: {
    owner:     '#D4AF37',
    admin:     '#E4BB45',
    manager:   '#B8960C',
    member:    '#9A7D0A',
    read_only: '#6B5D30',
  },
} as const;
