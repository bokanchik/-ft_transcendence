import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from './mocks/server.js';
import '@testing-library/jest-dom/vitest';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
});
afterAll(() => server.close());