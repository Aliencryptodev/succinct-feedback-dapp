/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#FE11C5',
        'primary-dark': '#c20e99',
        'primary-light': '#ff5cdc',
        'primary-glow': 'rgba(254, 17, 197, 0.3)',
        'secondary': '#90DCFF',
        'secondary-dark': '#5fa8c9',
        'secondary-light': '#c5edff',
        'accent': '#F9E766',
        'accent-dark': '#d9c954',
        'accent-light': '#fcf0a3',
        'danger': '#FF5555',
        'success': '#55d6aa',
        'bg-dark': '#0A0A0A',
        'bg-card': '#111111',
        'bg-card-hover': '#1a1a1a',
        'bg-profile': '#0F0F1A',
        'bg-sidebar': '#13132A',
        'bg-nav': '#13132A',
        'bg-tab-active': '#1E1E42',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}