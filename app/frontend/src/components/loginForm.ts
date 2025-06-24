// // /components/loginForm.ts
// import { LoginRequestBody } from '../shared/schemas/usersSchemas.js';
// import { ApiResult } from '../utils/types.js';
// import { t } from '../services/i18nService.js';

// interface LoginFormProps {
// 	onLoginAttempt: (credentials: LoginRequestBody) => Promise<ApiResult>;
// 	onLoginSuccess: (userData: any) => void;
// }

// export function LoginForm(props: LoginFormProps): HTMLElement {
// 	const { onLoginAttempt, onLoginSuccess } = props;

// 	const formWrapper = document.createElement('div');

// 	formWrapper.innerHTML = `
//         <form id="login-form-component">
//             <div class="mb-4">
//                 <label for="identifier" class="block text-gray-700 text-sm font-bold mb-2">${t('login.identifierLabel')}</label>
//                 <input type="text" id="identifier" name="identifier" required placeholder="${t('login.identifierPlaceholder')}"
//                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
//             </div>
//             <div class="mb-6">
//                 <label for="password" class="block text-gray-700 text-sm font-bold mb-2">${t('login.passwordLabel')}</label>
//                 <input type="password" id="password" name="password" required
//                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline">
//             </div>
//             <div class="flex items-center justify-between">
//                 <button type="submit" id="login-button"
//                         class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out">
//                     ${t('login.button')}
//                 </button>
//             </div>
//         </form>
//         <div id="login-message-component" class="mt-4 text-center text-sm"></div>
//     `;

// 	const form = formWrapper.querySelector('#login-form-component') as HTMLFormElement;
// 	const identifierInput = formWrapper.querySelector('#identifier') as HTMLInputElement;
// 	const passwordInput = formWrapper.querySelector('#password') as HTMLInputElement;
// 	const messageDiv = formWrapper.querySelector('#login-message-component') as HTMLDivElement;
// 	const loginButton = formWrapper.querySelector('#login-button') as HTMLButtonElement;

// 	form.addEventListener('submit', async (event) => {
// 		event.preventDefault();
// 		messageDiv.textContent = t('login.attemptingLogin');
// 		messageDiv.className = 'mt-4 text-center text-sm text-gray-600';
// 		loginButton.disabled = true;
// 		loginButton.textContent = t('login.attemptingLogin');

// 		const identifier = identifierInput.value.trim();
// 		const password = passwordInput.value;

// 		if (!identifier || !password) {
// 			messageDiv.textContent = t('login.missingCredentials');
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			loginButton.disabled = false;
// 			loginButton.textContent = t('login.button');
// 			return;
// 		}

// 		const result = await onLoginAttempt({ identifier, password });

// 		loginButton.disabled = false;
// 		loginButton.textContent = t('login.button');

// 		if (result.success) {
// 			messageDiv.textContent = `${t('login.success')} ${result.data.user.display_name || result.data.user.username}!`;
// 			messageDiv.className = 'mt-4 text-center text-sm text-green-600';
// 			onLoginSuccess(result.data.user); // Appeler le callback de succès
// 		} else {
// 			messageDiv.textContent = result.error || t('login.invalidCredentials');
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			passwordInput.value = '';
// 		}
// 	});

// 	return formWrapper;
// }
// app/frontend/src/components/loginForm.ts
import { LoginRequestBody, User } from '../shared/schemas/usersSchemas.js';
import { ApiResult } from '../utils/types.js';
import { t } from '../services/i18nService.js';
import { showToast } from './toast.js';
import { fetchWithCsrf } from '../services/csrf.js';

interface LoginFormProps {
	onLoginSuccess: (userData: User) => void;
}

export function LoginForm(props: LoginFormProps): HTMLElement {
	const { onLoginSuccess } = props;
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
                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
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

		try {
			const response = await fetch('/api/users/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
                credentials: 'include',
            });
			const data = await response.json();

			if (!response.ok) throw new Error(data.messageKey ? t(data.messageKey, data.messageParams) : data.error);

			if (data.two_fa_required) {
				renderTwoFactorStep();
			} else if (data.user) {
				onLoginSuccess(data.user);
			}

		} catch (error: any) {
			if (messageDiv) messageDiv.textContent = error.message;
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

		try {
			const response = await fetchWithCsrf('/api/users/auth/2fa/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.messageKey ? t(data.messageKey) : data.error);

			onLoginSuccess(data.user);
		} catch (error: any) {
			if (messageDiv) messageDiv.textContent = error.message;
			if (button) button.disabled = false;
		}
	};

	renderPasswordStep();
	return wrapper;
}