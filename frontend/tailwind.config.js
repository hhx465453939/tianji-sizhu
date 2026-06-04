/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#1a1410',
          800: '#241e17',
          700: '#2d251c',
          600: '#382e23',
          500: '#4a3f32',
        },
        parchment: {
          50: '#faf3e6',
          100: '#f5e6c8',
          200: '#e8d4a8',
          300: '#e8dcc8',
          700: '#3d3428',
        },
        cinnabar: {
          DEFAULT: '#c23b22',
          light: '#d4523a',
          dark: '#9e2e18',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#dbbf5e',
          dark: '#a88a3a',
        },
        jade: {
          DEFAULT: '#5c8a5e',
          light: '#72a074',
          dark: '#4a7048',
        },
        bronze: {
          DEFAULT: '#8b7355',
          light: '#a08a6c',
          dark: '#6e5a42',
        },
        wood: '#4a7c59',
        fire: '#c23b22',
        earth: '#b8860b',
        metal: '#c0b283',
        water: '#2c4a6e',
      },
      fontFamily: {
        body: ['Noto Serif CJK SC', 'Source Han Serif SC', 'SimSun', 'STSong', 'FangSong', 'serif'],
        heading: ['KaiTi', 'STKaiti', 'AR PL UKai CN', 'Noto Serif CJK SC', 'serif'],
        ganzhi: ['LiSu', 'STLiti', 'KaiTi', 'STKaiti', 'serif'],
      },
      letterSpacing: {
        'traditional': '0.15em',
        'wide-cn': '0.08em',
      },
      boxShadow: {
        'seal': '0 2px 8px rgba(194, 59, 34, 0.25)',
        'gold-glow': '0 0 12px rgba(201, 168, 76, 0.15)',
        'panel': '0 4px 16px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
