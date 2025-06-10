// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html', // Scanne la page d'entrée
    './src/**/*.{js,ts}', // Scanne tous les fichiers JS/TS dans src
  ],
  theme: {
    extend: {
      // Vos extensions actuelles
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)', boxShadow: 'none' },
          '100%': { opacity: '1', transform: 'translateY(0)', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
