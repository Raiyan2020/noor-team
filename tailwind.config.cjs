/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#fff', card: '#E8E0EF', gold: '#483383', goldDark: '#352C48',
          text: '#100F19', textSec: '#6E585B', primary: '#483383',
        },
      },
      fontFamily: { alexandria: ['Alexandria', 'sans-serif'] },
    },
  },
  plugins: [],
};
