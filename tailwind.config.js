/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#16a34a',
          DEFAULT: '#16a34a',
        },
        wheat: {
          gold: '#d97706',
          DEFAULT: '#d97706',
        },
        soil: {
          brown: '#92400e',
          DEFAULT: '#92400e',
        },
        sky: {
          blue: '#0284c7',
          DEFAULT: '#0284c7',
        },
        alert: {
          red: '#dc2626',
          DEFAULT: '#dc2626',
        },
        farmBg: '#f0fdf4',
        textPrimary: '#14532d',
        textSecondary: '#4b5563',
      },
      fontFamily: {
        gurmukhi: ['"Noto Sans Gurmukhi"', 'sans-serif'],
        devanagari: ['"Noto Sans Devanagari"', 'sans-serif'],
        sans: ['"Inter"', '"Noto Sans Gurmukhi"', '"Noto Sans Devanagari"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
