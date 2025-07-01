// src/services/csrf.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setCsrfToken, getCsrfTokenOrThrow, fetchWithCsrf, fetchCsrfToken } from './csrf';
import { config } from '../utils/config';
import { http, HttpResponse } from 'msw';
import { server } from '../tests/mocks/server';

describe('csrfService', () => {
    const FAKE_CSRF_TOKEN = 'my-secret-csrf-token';

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        setCsrfToken(null as any); 
        server.resetHandlers();
    });

    it('setCsrfToken should store the token in localStorage', () => {
        setCsrfToken(FAKE_CSRF_TOKEN);
        expect(localStorage.getItem('csrfToken')).toBe(FAKE_CSRF_TOKEN);
    });

    it('getCsrfTokenOrThrow should return token from memory if available', () => {
        setCsrfToken(FAKE_CSRF_TOKEN);
        expect(getCsrfTokenOrThrow()).toBe(FAKE_CSRF_TOKEN);
    });

    it('getCsrfTokenOrThrow should return token from localStorage if not in memory', () => {
        setCsrfToken(null as any);
        localStorage.setItem('csrfToken', FAKE_CSRF_TOKEN);
        expect(getCsrfTokenOrThrow()).toBe(FAKE_CSRF_TOKEN);
    });

    it('getCsrfTokenOrThrow should throw an error if no token is available', () => {
        setCsrfToken(null as any);
        localStorage.clear();
        expect(() => getCsrfTokenOrThrow()).toThrow('CSRF token missing. Please refresh the page.');
    });

    it('fetchCsrfToken should fetch and set the token, making it available', async () => {
        server.use(
            http.get(config.api.auth.csrf, () => {
                return HttpResponse.json({ csrfToken: FAKE_CSRF_TOKEN });
            })
        );
        
        setCsrfToken(null as any);
        localStorage.clear();
        expect(() => getCsrfTokenOrThrow()).toThrow();
        
        await fetchCsrfToken();
        
        expect(getCsrfTokenOrThrow()).toBe(FAKE_CSRF_TOKEN);
        expect(localStorage.getItem('csrfToken')).toBe(FAKE_CSRF_TOKEN);
    });

    it('fetchWithCsrf should include the CSRF token in headers', async () => {
        server.use(
            http.post('/api/test', async ({ request }) => {
                const headers = request.headers;
                expect(headers.get('x-csrf-token')).toBe(FAKE_CSRF_TOKEN);
                return HttpResponse.json({ success: true });
            })
        );
        
        setCsrfToken(FAKE_CSRF_TOKEN);
        const response = await fetchWithCsrf('/api/test', { method: 'POST' });
        expect(response.ok).toBe(true);
    });
});