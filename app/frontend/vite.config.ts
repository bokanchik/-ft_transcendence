// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Si votre frontend tourne sur un port (ex: 5173) et votre backend sur un autre (ex: 3000)
    proxy: {
      // Toute requête commençant par /api sera redirigée vers votre backend
      '/api/users': {
        target: 'http://localhost:4000', // <-- METTEZ ICI L'ADRESSE DE VOTRE BACKEND
        changeOrigin: true, // Nécessaire pour les hôtes virtuels
        secure: false,      // Si votre backend n'a pas de certificat SSL en dev
        },
        '/api/game': {
        target: 'http://localhost:3001', // <-- METTEZ ICI L'ADRESSE DE VOTRE BACKEND
        changeOrigin: true, // Nécessaire pour les hôtes virtuels
        secure: false,      // Si votre backend n'a pas de certificat SSL en dev

      },
    },
    // Si vous utilisez HTTPS en dev, configurez-le ici
    // https: {
    //   key: './path/to/key.pem',
    //   cert: './path/to/cert.pem'
    // }
  }
});
