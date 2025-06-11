export let csrfToken: string | null = null;

export function setCsrfToken(token: string) {
	csrfToken = token;
	localStorage.setItem('csrfToken', token);
}

export function getCsrfTokenOrThrow(): string {
	if (!csrfToken) {
		csrfToken = localStorage.getItem('csrfToken');
	}
	if (!csrfToken) throw new Error('CSRF token missing. Please refresh the page.');
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
		const response = await fetch('/api/users/csrf-token', { credentials: 'include' });
		if (!response.ok) throw new Error('Failed to fetch CSRF token');
		const data = await response.json();
		csrfToken = data.csrfToken;
		console.log('CSRF Token fetched and stored:', csrfToken);
	} catch (error) {
		console.error('Error fetching CSRF token:', error);
	}
}
