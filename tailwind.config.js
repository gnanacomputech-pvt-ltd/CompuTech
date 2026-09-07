/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gcs: {
          gold: '#D4A72C',
          'gold-dark': '#B88918',
          'gold-light': '#F5E6B8',
          charcoal: '#222326',
          'charcoal-dark': '#17181A',
          'charcoal-light': '#32343A',
          bg: '#FAFAF7',
          border: '#E8E1D2',
          text: '#252525',
          muted: '#6B6B6B',
        }
      },
      fontFamily: {
        sans: ['Verdana', 'Geneva', 'Tahoma', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
