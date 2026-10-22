/** @type {import('tailwindcss').Config} */

// Color tokens are CSS variable channels (defined in src/style.css per theme).
// This keeps every legacy class name (bg-ink-800, text-gold/70) theme-aware.
const ch = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // --- legacy scale names, remapped to semantic tokens ---
        ink: {
          900: ch('--bg-app'),
          800: ch('--surface-2'),
          700: ch('--surface-3'),
          600: ch('--surface-4'),
          500: ch('--line-1'),
        },
        parchment: {
          50: ch('--text-1'),
          100: ch('--text-1'),
          200: ch('--text-2'),
          300: ch('--text-2'),
          700: ch('--text-1'),
        },
        cinnabar: {
          DEFAULT: ch('--accent-seal'),
          light: ch('--accent-seal-strong'),
          dark: ch('--accent-seal-strong'),
        },
        gold: {
          DEFAULT: ch('--accent-gold'),
          light: ch('--accent-gold-strong'),
          dark: ch('--accent-gold-strong'),
        },
        jade: {
          DEFAULT: ch('--accent-jade'),
          light: ch('--accent-jade-strong'),
          dark: ch('--accent-jade-strong'),
        },
        bronze: {
          DEFAULT: ch('--accent-ochre'),
          light: ch('--accent-ochre'),
          dark: ch('--accent-ochre'),
        },
        wood: ch('--wx-wood'),
        fire: ch('--wx-fire'),
        earth: ch('--wx-earth'),
        metal: ch('--wx-metal'),
        water: ch('--wx-water'),

        // --- semantic tokens for new code ---
        surface: {
          app: ch('--bg-app'),
          sunken: ch('--bg-sunken'),
          1: ch('--surface-1'),
          2: ch('--surface-2'),
          3: ch('--surface-3'),
          4: ch('--surface-4'),
        },
        fg: {
          1: ch('--text-1'),
          2: ch('--text-2'),
          3: ch('--text-3'),
          muted: ch('--text-muted'),
        },
        line: {
          1: ch('--line-1'),
          2: ch('--line-2'),
        },
        accent: {
          seal: ch('--accent-seal'),
          'seal-strong': ch('--accent-seal-strong'),
          gold: ch('--accent-gold'),
          'gold-strong': ch('--accent-gold-strong'),
          jade: ch('--accent-jade'),
          azure: ch('--accent-azure'),
          ochre: ch('--accent-ochre'),
          violet: ch('--accent-violet'),
        },
        wx: {
          wood: ch('--wx-wood'),
          fire: ch('--wx-fire'),
          earth: ch('--wx-earth'),
          metal: ch('--wx-metal'),
          water: ch('--wx-water'),
        },
      },
      fontFamily: {
        body: ['Noto Serif CJK SC', 'Source Han Serif SC', 'SimSun', 'STSong', 'FangSong', 'serif'],
        heading: ['KaiTi', 'STKaiti', 'AR PL UKai CN', 'Noto Serif CJK SC', 'serif'],
        ganzhi: ['LiSu', 'STLiti', 'KaiTi', 'STKaiti', 'serif'],
      },
      letterSpacing: {
        traditional: '0.15em',
        'wide-cn': '0.08em',
      },
      boxShadow: {
        seal: 'var(--shadow-seal)',
        'gold-glow': 'var(--glow-gold)',
        panel: 'var(--shadow-panel)',
        raised: 'var(--shadow-raised)',
      },
      transitionTimingFunction: {
        'out-quiet': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
