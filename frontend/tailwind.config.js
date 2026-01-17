/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a4b8fc',
          400: '#818cf8',
          500: '#667eea',
          600: '#5568d3',
          700: '#4751b8',
          800: '#3d4496',
          900: '#383e7a',
        },
      },
    },
  },
  plugins: [],
}
