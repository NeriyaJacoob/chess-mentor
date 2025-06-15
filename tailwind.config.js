// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend-react/src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6096BA',
        secondary: '#274C77',
        success: '#34A853',
        warning: '#F7C548',
        danger: '#D72631',
        'dark-square': '#D18B47',
        'light-square': '#FFCE9E',
        'board-border': '#8B4513'
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
    },
  },
  plugins: [],
}