// import { defineConfig } from 'vite'

// export default defineConfig({

// })

import { defineConfig } from 'vitest/config'

process.env.TL_DEBUG_PRINT_LIMIT = '0';

export default defineConfig({
  test: {
    // Active les API globales comme describe, it, expect
    // pour ne pas avoir à les importer dans chaque fichier de test.
    globals: true,
    // Simule un environnement de navigateur (DOM) pour les tests.
    // C'est indispensable pour tester des fonctions comme createElement.
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
})