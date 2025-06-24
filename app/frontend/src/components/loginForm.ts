import { LoginRequestBody, User } from '../shared/schemas/usersSchemas.js';
import { ApiResult, ApiLoginSuccessData } from '../utils/types.js';
import { t } from '../services/i18nService.js';
import { fetchCsrfToken } from '../services/csrf.js';

interface LoginFormProps {
	onLoginAttempt: (credentials: LoginRequestBody) => Promise<ApiResult<ApiLoginSuccessData>>;
    on2FAAttempt: (token: string) => Promise<ApiResult<ApiLoginSuccessData>>;
	onLoginSuccess: (userData: User) => void;
}

export function LoginForm(props: LoginFormProps): HTMLElement {
	const { onLoginAttempt, on2FAAttempt, onLoginSuccess } = props;
	const wrapper = document.createElement('div');
	
	const renderPasswordStep = () => {
		wrapper.innerHTML = `
            <form id="login-form-component" class="space-y-6">
                <div>
                    <label for="identifier" class="block text-sm font-medium text-gray-700">${t('login.identifierLabel')}</label>
                    <input type="text" id="identifier" name="identifier" required placeholder="${t('login.identifierPlaceholder')}" 
                           class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">${t('login.passwordLabel')}</label>
                    <input type="password" id="password" name="password" required 
                           class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div>
                    <button type="submit" id="login-button" 
                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                        ${t('login.button')}
                    </button>
                </div>
            </form>
            <div id="login-message-component" class="mt-4 text-center text-sm min-h-[20px]"></div>
        `;
		wrapper.querySelector('#login-form-component')?.addEventListener('submit', handlePasswordSubmit);
	};

	const renderTwoFactorStep = () => {
		wrapper.innerHTML = `
            <form id="2fa-form-component" class="space-y-6">
                <h3 class="text-xl font-semibold text-center text-gray-800">Two-Factor Authentication</h3>
                <div>
                    <label for="2fa-token" class="block text-sm font-medium text-gray-700">Enter the 6-digit code from your authenticator app</label>
                    <input type="text" id="2fa-token" name="2fa-token" required autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6"
                           class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-[1em]">
                </div>
                <div>
                    <button type="submit" id="2fa-button" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                        Verify
                    </button>
                </div>
            </form>
            <div id="login-message-component" class="mt-4 text-center text-sm text-red-500 min-h-[20px]"></div>
        `;
		wrapper.querySelector('#2fa-form-component')?.addEventListener('submit', handleTwoFactorSubmit);
		(wrapper.querySelector('#2fa-token') as HTMLInputElement)?.focus();
	};

	const handlePasswordSubmit = async (event: Event) => {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const button = form.querySelector<HTMLButtonElement>('#login-button');
		const messageDiv = wrapper.querySelector<HTMLDivElement>('#login-message-component');

		if (button) button.disabled = true;
		if (messageDiv) messageDiv.textContent = 'Logging in...';

		const identifier = (form.elements.namedItem('identifier') as HTMLInputElement).value;
		const password = (form.elements.namedItem('password') as HTMLInputElement).value;

		const result = await onLoginAttempt({ identifier, password });

		if (result.success) {
            if (result.data.two_fa_required) {
                renderTwoFactorStep();
            } else if (result.data.user) {
                onLoginSuccess(result.data.user);
            }
        } else {
            if (messageDiv) messageDiv.textContent = result.error;
            if (button) button.disabled = false;
        }
	};

	const handleTwoFactorSubmit = async (event: Event) => {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const button = form.querySelector<HTMLButtonElement>('#2fa-button');
		const messageDiv = wrapper.querySelector<HTMLDivElement>('#login-message-component');

		if (button) button.disabled = true;
		if (messageDiv) messageDiv.textContent = 'Verifying...';

		const token = (form.elements.namedItem('2fa-token') as HTMLInputElement).value;

        const result = await on2FAAttempt(token);

        if (result.success) {
            if (result.data.user) {
                onLoginSuccess(result.data.user);
            }
        } else {
            if (messageDiv) messageDiv.textContent = result.error;
			if (button) button.disabled = false;
        }
	};

	// 	try {
	// 		const response = await fetch('/api/users/2fa/login', {
	// 			method: 'POST',
	// 			headers: { 'Content-Type': 'application/json' },
	// 			body: JSON.stringify({ token }),
    //             credentials: 'include'
	// 		});
	// 		const data = await response.json();
	// 		if (!response.ok) {
    //             throw new Error(data.messageKey ? t(data.messageKey) : data.error);
    //         }

    //         // Après un login réussi (y compris 2FA), on récupère le token CSRF pour les futures requêtes.
    //         await fetchCsrfToken();

	// 		onLoginSuccess(data.user);
	// 	} catch (error: any) {
	// 		if (messageDiv) messageDiv.textContent = error.message;
	// 		if (button) button.disabled = false;
	// 	}
	// };

	renderPasswordStep();
	return wrapper;
}