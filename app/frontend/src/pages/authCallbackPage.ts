import { navigateTo } from '../services/router.js';
import { setUserDataInStorage } from '../services/authService.js';
import { t } from '../services/i18nService.js';
import { createElement } from '../utils/domUtils.js';

async function handleGoogleAuth(code: string) {
    try {
        const response = await fetch('/api/users/auth/google/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            throw new Error('Google authentication failed on the server.');
        }

        const { user } = await response.json();
        setUserDataInStorage(user);
        navigateTo('/dashboard');

    } catch (error) {
        console.error("Google auth callback error:", error);
        navigateTo('/login?error=google_failed');
    }
}

export function AuthCallbackPage(): HTMLElement {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        handleGoogleAuth(code);
    } else {
        console.error('No authorization code found.');
        navigateTo('/login?error=no_code');
    }

    return createElement('div', {
        textContent: t('login.googleVerifying'),
        className: 'min-h-screen flex items-center justify-center text-xl'
    });
}