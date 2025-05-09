module.exports = {
    content: [
      './src/**/*.{html,js,ts}',
      './dist/**/*.html',
    ],
    theme: {
      extend: {
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
  