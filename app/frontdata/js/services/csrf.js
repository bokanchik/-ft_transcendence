import { config } from '../utils/config.js';
export let csrfToken = null;
export function setCsrfToken(token) {
    csrfToken = token;
    localStorage.setItem('csrfToken', token);
}
export function getCsrfTokenOrThrow() {
    if (!csrfToken) {
        csrfToken = localStorage.getItem('csrfToken');
    }
    if (!csrfToken)
        throw new Error('CSRF token missing. Please refresh the page.');
    return csrfToken;
}
export async function fetchWithCsrf(url, options = {}) {
    const token = getCsrfTokenOrThrow();
    const headers = new Headers(options.headers || {});
    headers.set('x-csrf-token', token);
    return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
    });
}
export async function fetchCsrfToken() {
    try {
        const response = await fetch(config.api.auth.csrf, { credentials: 'include' });
        if (!response.ok)
            throw new Error('Failed to fetch CSRF token');
        const data = await response.json();
        setCsrfToken(data.csrfToken);
        console.log('CSRF Token fetched and stored:', csrfToken);
    }
    catch (error) {
        console.error('Error fetching CSRF token:', error);
    }
}
