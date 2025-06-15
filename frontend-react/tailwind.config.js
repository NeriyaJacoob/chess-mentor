/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6096BA',
        secondary: '#274C77',
        success: '#34A853',
        warning: '#F7C548',
        danger: '#D72631'
      }
    },
  },
  plugins: [],
}