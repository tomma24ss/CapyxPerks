/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        capyx: {
          50: '#fffef0',
          100: '#fffcd6',
          200: '#fff9ad',
          300: '#fff684',
          400: '#fed714',  // Primary yellow - #fed714
          500: '#fed714',  // Primary yellow - #fed714
          600: '#e5c213',
          700: '#b39700',
          800: '#806d00',
          900: '#4d4200',
        },
      },
    },
  },
  plugins: [],
}

