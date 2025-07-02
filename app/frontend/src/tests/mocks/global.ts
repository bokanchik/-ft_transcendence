import { vi } from 'vitest';

// vi.mock('socket.io-client', () => {
vi.mock('@/services/socket.js', () => {
    const mockSocket = {
        on: vi.fn(),
        emit: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
        get connected() { return false; }
    };
    return {
        io: () => mockSocket,
        default: () => mockSocket,
    };
});