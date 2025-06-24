// /components/loginForm.ts
import { LoginRequestBody } from '../shared/schemas/usersSchemas.js';
import { ApiResult } from '../utils/types.js';
import { t } from '../services/i18nService.js';

interface LoginFormProps {
	onLoginAttempt: (credentials: LoginRequestBody) => Promise<ApiResult>;
	onLoginSuccess: (userData: any) => void;
}

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
export function LoginForm(props: LoginFormProps): HTMLElement {
	const { onLoginAttempt, onLoginSuccess } = props;
	const wrapper = document.createElement('div');
	
	const renderPasswordStep = () => {
		wrapper.innerHTML = `
            <form id="login-form-component">
                <div class="mb-4">
                    <label for="identifier" class="block text-gray-700 text-sm font-bold mb-2">${t('login.identifierLabel')}</label>
                    <input type="text" id="identifier" name="identifier" required placeholder="${t('login.identifierPlaceholder')}" class="... w-full ...">
                </div>
                <div class="mb-6">
                    <label for="password" class="block text-gray-700 text-sm font-bold mb-2">${t('login.passwordLabel')}</label>
                    <input type="password" id="password" name="password" required class="... w-full ...">
                </div>
                <div class="flex items-center justify-between">
                    <button type="submit" id="login-button" class="...">
                        ${t('login.button')}
                    </button>
                </div>
            </form>
            <div id="login-message-component" class="mt-4 text-center text-sm"></div>
        `;
		wrapper.querySelector('#login-form-component')?.addEventListener('submit', handlePasswordSubmit);
	};

	const renderTwoFactorStep = () => {
		wrapper.innerHTML = `
            <form id="2fa-form-component">
                <h3 class="text-xl font-semibold text-center mb-4">Two-Factor Authentication</h3>
                <div class="mb-4">
                    <label for="2fa-token" class="block text-gray-700 text-sm font-bold mb-2">Verification Code</label>
                    <input type="text" id="2fa-token" name="2fa-token" required autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]*" class="... w-full ...">
                </div>
                <div class="flex items-center justify-between">
                    <button type="submit" id="2fa-button" class="bg-green-600 ... w-full">Verify</button>
                </div>
            </form>
            <div id="login-message-component" class="mt-4 text-center text-sm text-red-500"></div>
        `;
		wrapper.querySelector('#2fa-form-component')?.addEventListener('submit', handleTwoFactorSubmit);
	};

	const handlePasswordSubmit = async (event: Event) => {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const identifier = (form.elements.namedItem('identifier') as HTMLInputElement).value;
		const password = (form.elements.namedItem('password') as HTMLInputElement).value;
		
		const result = await onLoginAttempt({ identifier, password });

		if (result.success) {
			if (result.data.user.is_two_fa_enabled) {
				renderTwoFactorStep();
			} else if (result.data.user) {
				onLoginSuccess(result.data.user);
			}
		} else {
			const messageDiv = wrapper.querySelector('#login-message-component');
			if (messageDiv) messageDiv.textContent = result.error;
		}
	};

	const handleTwoFactorSubmit = async (event: Event) => {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const token = (form.elements.namedItem('2fa-token') as HTMLInputElement).value;

		try {
			const response = await fetch('/api/users/auth/2fa/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error);

			onLoginSuccess(data.user);
		} catch (error: any) {
			const messageDiv = wrapper.querySelector('#login-message-component');
			if (messageDiv) messageDiv.textContent = error.message;
		}
	};

	renderPasswordStep();
	return wrapper;
}