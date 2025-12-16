/**
 * MoonSys Brand Guidelines Constants
 *
 * Based on MoonSys Brand Guidelines Document
 * All brand colors, typography, and design system values
 */

// ============================================
// COLORS - From Brand Guidelines
// ============================================

export const BRAND_COLORS = {
  // Primary Cool Tone - Aqua Blue
  aqua: {
    base: '#AED9E3',
    dark: '#7DBCC9',
    light: '#C8E6ED',
    usage: 'Innovation, trust, clarity'
  },

  // Secondary Soft Violet - Lavender
  lavender: {
    base: '#BDBBDF',
    dark: '#9B98C5',
    light: '#D4D2ED',
    usage: 'Creativity, intelligence'
  },

  // Accent Warm Tone - Peach
  peach: {
    base: '#F2CAA1',
    dark: '#E5B380',
    light: '#F7DCC0',
    usage: 'Warmth, human touch'
  },

  // Highlight Tone - Pastel Yellow
  yellow: {
    base: '#F9E389',
    dark: '#F5D65F',
    light: '#FCEEB3',
    usage: 'Optimism, innovation'
  },

  // Neutral Tones
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    usage: 'Backgrounds, text'
  }
} as const;

// ============================================
// TYPOGRAPHY - From Brand Guidelines
// ============================================

export const BRAND_TYPOGRAPHY = {
  primary: 'Poppins',
  fallback: ['system-ui', 'sans-serif'],
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
} as const;

// ============================================
// CARD GRADIENT PRESETS
// ============================================

export const CARD_GRADIENTS = {
  // Primary Cards (darker to lighter for better contrast)
  aqua: {
    gradient: 'from-moonsys-aqua-dark to-moonsys-aqua',
    text: 'text-white',
    border: 'border-moonsys-aqua-dark/30'
  },

  lavender: {
    gradient: 'from-moonsys-lavender-dark to-moonsys-lavender',
    text: 'text-white',
    border: 'border-moonsys-lavender-dark/30'
  },

  peach: {
    gradient: 'from-moonsys-peach-dark to-moonsys-peach',
    text: 'text-white',
    border: 'border-moonsys-peach-dark/30'
  },

  // Yellow needs dark text for readability
  yellow: {
    gradient: 'from-moonsys-yellow-dark to-moonsys-yellow',
    text: 'text-gray-900',
    border: 'border-moonsys-yellow-dark/30'
  },

  // Multi-color gradients (3 stops for richness)
  aquaLavender: {
    gradient: 'from-moonsys-aqua-dark via-moonsys-lavender-dark to-moonsys-lavender',
    text: 'text-white',
    border: 'border-moonsys-aqua-dark/30'
  },

  lavenderPeach: {
    gradient: 'from-moonsys-lavender-dark via-moonsys-peach-dark to-moonsys-peach',
    text: 'text-white',
    border: 'border-moonsys-lavender-dark/30'
  },

  peachYellow: {
    gradient: 'from-moonsys-peach-dark via-moonsys-yellow-dark to-moonsys-yellow',
    text: 'text-gray-900',
    border: 'border-moonsys-peach-dark/30'
  },

  yellowAqua: {
    gradient: 'from-moonsys-yellow-dark via-moonsys-aqua-dark to-moonsys-aqua',
    text: 'text-gray-900',
    border: 'border-moonsys-yellow-dark/30'
  }
} as const;

// ============================================
// BUTTON STYLES
// ============================================

export const BUTTON_STYLES = {
  today: {
    active: 'bg-moonsys-aqua-dark text-white',
    inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-moonsys-aqua/30'
  },

  yesterday: {
    active: 'bg-moonsys-lavender-dark text-white',
    inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-moonsys-lavender/30'
  },

  weekly: {
    active: 'bg-moonsys-peach-dark text-white',
    inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-moonsys-peach/30'
  },

  monthly: {
    active: 'bg-moonsys-yellow-dark text-white',
    inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-moonsys-yellow/30'
  },

  custom: {
    active: 'bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark text-white',
    inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-moonsys-aqua/20 hover:to-moonsys-lavender/20'
  },

  // Generic action buttons
  primary: 'bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark hover:from-moonsys-aqua hover:to-moonsys-lavender text-white',
  secondary: 'bg-gradient-to-r from-moonsys-peach-dark to-moonsys-yellow-dark hover:from-moonsys-peach hover:to-moonsys-yellow text-white',
  apply: 'bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-peach-dark hover:from-moonsys-aqua hover:to-moonsys-peach text-white'
} as const;

// ============================================
// NAVIGATION TAB STYLES
// ============================================

export const NAV_TAB_STYLES = {
  overview: {
    active: 'bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark text-white',
    inactive: 'text-gray-700 dark:text-gray-300 hover:bg-moonsys-aqua/20'
  },

  teamPerformance: {
    active: 'bg-gradient-to-r from-moonsys-lavender-dark to-moonsys-peach-dark text-white',
    inactive: 'text-gray-700 dark:text-gray-300 hover:bg-moonsys-lavender/20'
  },

  ticketAnalytics: {
    active: 'bg-gradient-to-r from-moonsys-peach-dark to-moonsys-yellow-dark text-white',
    inactive: 'text-gray-700 dark:text-gray-300 hover:bg-moonsys-peach/20'
  },

  detailedView: {
    active: 'bg-gradient-to-r from-moonsys-yellow-dark to-moonsys-aqua-dark text-white',
    inactive: 'text-gray-700 dark:text-gray-300 hover:bg-moonsys-yellow/20'
  }
} as const;

// ============================================
// BACKGROUND GRADIENTS
// ============================================

export const BACKGROUND_GRADIENTS = {
  dashboard: {
    light: 'bg-gradient-to-br from-gray-50 via-moonsys-aqua/5 to-moonsys-lavender/5',
    dark: 'dark:bg-gradient-to-br dark:from-gray-900 dark:via-moonsys-aqua-dark/10 dark:to-moonsys-lavender-dark/10'
  },

  login: {
    main: 'bg-gradient-to-br from-moonsys-aqua via-moonsys-lavender to-moonsys-peach'
  },

  header: {
    main: 'bg-gradient-to-r from-moonsys-aqua via-moonsys-lavender to-moonsys-peach'
  }
} as const;

// ============================================
// PROGRESS/LOADING STYLES
// ============================================

export const PROGRESS_STYLES = {
  bar: 'bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark',

  circle: {
    gradient: {
      from: '#7DBCC9', // aqua-dark
      to: '#9B98C5'    // lavender-dark
    }
  },

  dots: {
    first: 'bg-moonsys-aqua-dark',
    second: 'bg-moonsys-lavender-dark',
    third: 'bg-moonsys-peach-dark'
  },

  inline: {
    background: 'bg-moonsys-aqua/20 dark:bg-moonsys-aqua/10',
    border: 'border-moonsys-aqua-dark dark:border-moonsys-lavender-dark',
    spinner: 'border-moonsys-aqua-dark',
    text: 'text-gray-900 dark:text-white',
    percentage: 'text-moonsys-aqua-dark dark:text-moonsys-lavender'
  }
} as const;

// ============================================
// DESIGN PRINCIPLES (from Brand Guidelines)
// ============================================

export const DESIGN_PRINCIPLES = {
  layout: {
    style: 'clean, minimal, easy to read',
    whitespace: 'plenty of whitespace for clarity'
  },

  consistency: {
    fonts: 'consistent font sizes, hierarchy, and colors',
    visuals: 'unified look across all visuals',
    logo: 'MoonSys logo subtly placed'
  },

  colorUsage: {
    main: 'Use Aqua and Lavender as main brand tones',
    accents: 'Use Peach and Yellow as accents',
    balance: 'Keep visuals light, balanced, and airy',
    avoid: 'Avoid overusing all four colors at once'
  }
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getCardStyle = (cardType: keyof typeof CARD_GRADIENTS) => {
  const style = CARD_GRADIENTS[cardType];
  return `bg-gradient-to-br ${style.gradient} ${style.text} border ${style.border} rounded-xl shadow-lg p-6`;
};

export const getButtonStyle = (buttonType: keyof typeof BUTTON_STYLES, isActive: boolean) => {
  const style = BUTTON_STYLES[buttonType];
  if (typeof style === 'string') return style;
  return isActive ? style.active : style.inactive;
};

export const getNavTabStyle = (tabType: keyof typeof NAV_TAB_STYLES, isActive: boolean) => {
  const style = NAV_TAB_STYLES[tabType];
  return isActive ? style.active : style.inactive;
};
