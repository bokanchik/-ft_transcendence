import { attemptRegister } from '../services/authService.js';
import { RegisterRequestBody } from '../shared/schemas/usersSchemas.js'
import { ApiResult, ApiRegisterSuccessData } from '../utils/types.js'
import { navigateTo } from '../services/router.js';
import { t } from '../services/i18nService.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { getUserDataFromStorage } from '../services/authService.js';

export async function RegisterPage(): Promise<HTMLElement> {
	const currentUser = getUserDataFromStorage();

	const pageWrapper = document.createElement('div');
	pageWrapper.className = 'flex flex-col min-h-screen bg-gray-100';

	const headerElement = HeaderComponent({ currentUser });
	pageWrapper.appendChild(headerElement);


	const container = document.createElement('div');
	container.className = 'bg-white flex justify-center items-center min-h-screen p-8';

	const formContainer = document.createElement('div');
	formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';

	formContainer.innerHTML = `
        <h2 class="text-3xl font-bold mb-6 text-center text-gray-800">${t('register.title')}</h2>
        <form id="register-form">
            <div class="mb-4">
                <label for="username" class="block text-gray-700 text-sm font-bold mb-2">${t('user.username')}</label>
                <input type="text" id="username" name="username" required minlength="3" maxlength="20"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <p class="text-xs text-gray-600 mt-1">${t('register.nameSpec')}</p>
            </div>
            <div class="mb-4">
                <label for="email" class="block text-gray-700 text-sm font-bold mb-2">${t('user.email')}</label>
                <input type="email" id="email" name="email" required
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
             <div class="mb-4">
                <label for="display_name" class="block text-gray-700 text-sm font-bold mb-2">${t('user.displayName')}</label>
                <input type="text" id="display_name" name="display_name" required minlength="3" maxlength="20"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <p class="text-xs text-gray-600 mt-1">${t('register.nameSpec')}</p>
            </div>
            <div class="mb-4">
                <label for="password" class="block text-gray-700 text-sm font-bold mb-2">${t('user.password')}</label>
                <input type="password" id="password" name="password" required minlength="8" maxlength="20"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                 <p class="text-xs text-gray-600 mt-1">${t('register.passwordSpec')}</p>
            </div>
             <div class="mb-6">
                <label for="confirm_password" class="block text-gray-700 text-sm font-bold mb-2">${t('register.confirmPassword')}</label>
                <input type="password" id="confirm_password" name="confirm_password" required minlength="8" maxlength="100"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-6">
                <label for="avatar_url" class="block text-gray-700 text-sm font-bold mb-2">${t('register.avatarUrl')}</label>
                <input type="url" id="avatar_url" name="avatar_url" placeholder="https://example.com/avatar.jpg"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="flex items-center justify-between">
                <button type="submit" id="register-button"
                        class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out">
                    ${t('register.button')}
                </button>
            </div>
        </form>
        <div id="register-message" class="mt-4 text-center text-sm"></div>
        <div class="mt-6 text-center">
          <a href="/" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            ${t('login.backToHome')}
          </a>
          <span class="mx-2 text-gray-400">|</span>
          <a href="/login" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            ${t('register.loginLink')}
          </a>
        </div>
    `;

	container.appendChild(formContainer);
	pageWrapper.appendChild(container);

	const form = container.querySelector('#register-form') as HTMLFormElement;
	const usernameInput = container.querySelector('#username') as HTMLInputElement;
	const emailInput = container.querySelector('#email') as HTMLInputElement;
	const displayNameInput = container.querySelector('#display_name') as HTMLInputElement;
	const passwordInput = container.querySelector('#password') as HTMLInputElement;
	const confirmPasswordInput = container.querySelector('#confirm_password') as HTMLInputElement;
	const avatarUrlInput = container.querySelector('#avatar_url') as HTMLInputElement;
	const messageDiv = container.querySelector('#register-message') as HTMLDivElement;
	const registerButton = container.querySelector('#register-button') as HTMLButtonElement;

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		messageDiv.textContent = '';
		messageDiv.className = 'mt-4 text-center text-sm';

		const username = usernameInput.value.trim();
		const email = emailInput.value.trim();
		const displayName = displayNameInput.value.trim();
		const password = passwordInput.value;
		const confirmPassword = confirmPasswordInput.value;
		const avatarUrl = avatarUrlInput.value.trim();

		if (!username || !email || !displayName || !password || !confirmPassword) {
			messageDiv.textContent = t('register.fillAllFields');
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			return;
		}
		if (password !== confirmPassword) {
			messageDiv.textContent = t('register.passwordMismatch');
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			passwordInput.value = ''; // Clear passwords
			confirmPasswordInput.value = '';
			return;
		}
		if (password.length < 8) {
			messageDiv.textContent = t('register.passwordLength');
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			return;
		}
		// Simple check for avatar URL format if provided
		if (avatarUrl && !isValidHttpUrl(avatarUrl)) {
			messageDiv.textContent = t('register.avatarSpec');
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			return;
		}

		// --- Appel à l'API ---
		messageDiv.textContent = t('register.attemptingRegistration');
		messageDiv.className = 'mt-4 text-center text-sm text-gray-600';
		registerButton.disabled = true;
		registerButton.textContent = t('register.registering');

		const credentials: RegisterRequestBody = {
			username,
			email,
			password,
			display_name: displayName,
		};
		// Only add avatar_url if it's not empty
		if (avatarUrl) {
			credentials.avatar_url = avatarUrl;
		}

		const registrationResult: ApiResult<ApiRegisterSuccessData> = await attemptRegister(credentials);

		registerButton.disabled = false;
		registerButton.textContent = t('register.button');

		if (registrationResult.success) {
			messageDiv.textContent = t('register.success');
			messageDiv.className = 'mt-4 text-center text-sm text-green-600';
			form.reset();
			setTimeout(() => { navigateTo('/login'); }, 500);

		} else {
			messageDiv.textContent = `${t('register.failure')} ${registrationResult.error} `; // Message générique post-alert
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			passwordInput.value = ''; // Clear password fields on failure
			confirmPasswordInput.value = '';
		}
	});

	return pageWrapper;
}

function isValidHttpUrl(string: string): boolean {
	let url;
	try {
		url = new URL(string);
	} catch (_) {
		return false;
	}
	return url.protocol === "http:" || url.protocol === "https:";
}
