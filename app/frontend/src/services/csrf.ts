import { config } from '../utils/config.js';
import { t } from '../services/i18nService.js';

export let csrfToken: string | null = null;

export function setCsrfToken(token: string) {
	csrfToken = token;
	localStorage.setItem(config.storage.user.csrfToken, token);
}

export function getCsrfTokenOrThrow(): string {
	if (!csrfToken) {
		csrfToken = localStorage.getItem(config.storage.user.csrfToken);
	}
	if (!csrfToken) throw new Error(t('msg.error.user.missCsrf'));
	return csrfToken;
}

export async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
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
		if (!response.ok) throw new Error(t('msg.error.user.fetchCsrf'));
		const data = await response.json();
		setCsrfToken(data.csrfToken);
	} catch (error) {
		console.error('Error fetching CSRF token:', error);
	}
}
