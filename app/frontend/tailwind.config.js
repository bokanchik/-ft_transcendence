/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './public/**/*.html', // Ajoute cette ligne
    './src/**/*.{js,ts}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
