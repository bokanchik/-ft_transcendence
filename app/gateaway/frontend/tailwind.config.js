// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,html}", // Scanne les sources
    "./dist/**/*.html"    // Scanne TOUS les html dans dist
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
