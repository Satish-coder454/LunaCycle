/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        night: { 950: '#080b1a', 900: '#10142b', 800: '#171d3b', 700: '#242b52' },
        moon: { 100: '#fff9db', 300: '#f6dfa0', 400: '#d9ba6f' },
        blush: { 300: '#f2a6bb', 400: '#e783a3', 500: '#d66089' }
      },
      boxShadow: { glow: '0 20px 70px rgba(123, 97, 255, .22)' }
    }
  },
  plugins: []
};
