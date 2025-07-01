// src/tests/setup.ts
import { beforeAll, afterEach, afterAll, vi } from 'vitest'; // Ajoutez 'vi'
import { server } from './mocks/server.js';
import '@testing-library/jest-dom/vitest';

vi.mock('socket.io-client', () => {
    const mockSocket = {
        on: vi.fn(),
        emit: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
        // On peut ajouter une propriété `connected` pour simuler l'état
        get connected() {
            return false; // Ou true si on veut simuler une connexion par défaut
        }
    };
    // La fonction `io()` retournera notre faux objet socket
    return {
        io: () => mockSocket,
        default: () => mockSocket, // Pour les imports `import io from '...'`
    };
});
// --- FIN DE L'AJOUT ---

// Démarre le serveur de mock avant tous les tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Réinitialise les "handlers" de mock après chaque test pour qu'ils ne s'influencent pas
afterEach(() => server.resetHandlers());

// Arrête le serveur de mock une fois tous les tests terminés
afterAll(() => server.close());