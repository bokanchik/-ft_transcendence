// src/tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers'; // Nous créerons ce fichier juste après

// Configure un serveur de mock avec nos "handlers" de routes
export const server = setupServer(...handlers);