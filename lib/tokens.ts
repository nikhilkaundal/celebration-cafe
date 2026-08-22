/**
 * Celebration Food Cafe — Single Source-of-Truth Design Tokens
 * Extract from homepage design system for consistent multi-page development.
 */

export const colors = {
  // Brand Base Palette
  forestGreen: "#3B4A2F",
  forestGreenLight: "#4A5B3C",
  pineDark: "#1F3B2C",
  pineDeepest: "#152A1F",

  // Warm Organic Earthy Palette
  creamHero: "#F4E4C0",
  offWhiteCanvas: "#FAF7F0",
  creamSectionFill: "#F5EFE6",
  terracottaBrown: "#8B4D2A",
  terracottaBrownLight: "#A05A35",

  // Accent & Brand Highlights
  terracottaOrange: "#C4622D",
  marigoldGold: "#E8A93B",
  marigoldGoldLight: "#F2C572",

  // Typography Text Colors
  headingText: "#2A1508", // Dark Espresso Brown
  bodyText: "#6B4226",    // Warm Dark Amber
  eyebrowText: "#8B4D2A", // Terracotta Brown Label
  lightText: "#F4E4C0",   // Warm Cream Text on Dark Surfaces

  // Borders & Dividers
  borderSubtle: "rgba(31, 59, 44, 0.12)",
  borderTerracotta: "rgba(196, 98, 45, 0.35)",
  borderWhiteSubtle: "rgba(255, 255, 255, 0.15)",
} as const;

export const typography = {
  fontFamilies: {
    heading: "'Nunito', 'Fraunces', Georgia, serif",
    display: "'Nunito', 'Fraunces', Georgia, serif",
    body: "'Inter', 'Nunito', system-ui, sans-serif",
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    bold: 700,
    extraBold: 800,
    black: 900,
  },
  sizes: {
    watermark: "clamp(90px, 18vw, 320px)",
    heroHeadline: "clamp(2.1rem, 4.5vw, 4rem)",
    sectionHeading: "text-3xl md:text-5xl",
    cardTitle: "text-xl lg:text-2xl",
    body: "text-sm md:text-base",
    eyebrow: "text-[0.72rem]",
  },
} as const;

export const spacing = {
  sectionPadding: "py-20 px-6 max-w-6xl mx-auto",
  heroPadding: "pt-24 lg:pt-28 pb-20 lg:pb-24 px-4 sm:px-6",
  navbarPadding: "py-3 px-4 sm:px-8 max-w-7xl mx-auto",
  cardPadding: "p-6 sm:p-8 lg:p-10",
  badgePadding: "px-4 py-2",
} as const;

export const componentPresets = {
  badgeSticker: "bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-xs sm:text-sm tracking-widest uppercase px-4 py-2 rounded-full shadow-xl border border-white/20 whitespace-nowrap",
  badgeRating: "bg-[#FAF7F0] backdrop-blur-md px-5 py-2 rounded-full border border-[#C4622D]/35 shadow-[0_6px_22px_rgba(42,21,8,0.18)] flex items-center gap-2.5 cursor-pointer",
  buttonPrimary: "bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-[0_6px_24px_rgba(196,98,45,0.42)] transition-all duration-300 hover:brightness-110 flex items-center gap-2",
  buttonSecondary: "text-[#2A1508] font-heading font-bold text-sm opacity-80 hover:opacity-100 flex items-center gap-1 py-1 relative",
  cardSurface: "rounded-3xl bg-card border border-border shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden",
  iconContainer: "w-12 h-12 rounded-2xl bg-[#C4622D]/20 border border-[#C4622D]/40 flex items-center justify-center text-[#F4E4C0]",
} as const;

export const motionTokens = {
  springPhysics: {
    stiffness: 50,
    damping: 20,
    mass: 0.5,
  },
  emilSpring: {
    type: "spring",
    bounce: 0.15,
    duration: 0.35,
  },
  tactilePress: {
    scale: 0.95,
  },
  hoverScale: {
    scale: 1.04,
  },
  staggerConfig: {
    staggerChildren: 0.12,
    delayChildren: 0.1,
  },
  easeCustom: [0.22, 1, 0.36, 1],
} as const;

export default {
  colors,
  typography,
  spacing,
  componentPresets,
  motionTokens,
};
