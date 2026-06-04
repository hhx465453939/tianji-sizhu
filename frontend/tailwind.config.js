/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: '#4ade80',
        fire: '#f87171',
        earth: '#fbbf24',
        metal: '#e5e7eb',
        water: '#60a5fa',
      }
    },
  },
  plugins: [],
}
