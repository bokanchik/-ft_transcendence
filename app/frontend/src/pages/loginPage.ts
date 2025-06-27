import { attemptLogin, verifyTwoFactorLogin, getUserDataFromStorage } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
import { LoginForm } from '../components/loginForm.js';
import { LoginRequestBody, User } from '../shared/schemas/usersSchemas.js';
import { ApiResult, ApiLoginSuccessData } from '../utils/types.js';
import { t } from '../services/i18nService.js';
import { HeaderComponent } from '../components/headerComponent.js';

export function LoginPage(): HTMLElement {
	const currentUser = getUserDataFromStorage();

	const pageWrapper = document.createElement('div');
	pageWrapper.className = 'flex flex-col min-h-screen bg-cover bg-center bg-fixed';
	pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";

	const headerElement = HeaderComponent({ currentUser });
	pageWrapper.appendChild(headerElement);

	const container = document.createElement('div');
	container.className = 'flex-grow flex justify-center items-center p-4 sm:p-8';

	const formContainer = document.createElement('div');
	formContainer.className = 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full';

	const title = document.createElement('h2');
	title.className = 'text-3xl font-bold mb-6 text-center text-white';
	title.textContent = t('login.title');

	formContainer.appendChild(title);

	const handleLoginAttempt = async (credentials: LoginRequestBody): Promise<ApiResult<ApiLoginSuccessData>> => {
		return attemptLogin(credentials);
	};

	const handle2FAAttempt = async (token: string): Promise<ApiResult<ApiLoginSuccessData>> => {
		return verifyTwoFactorLogin(token);
	};

	const handleLoginSuccess = (userData: User) => {
		setTimeout(() => { navigateTo('/dashboard'); }, 500);
	};

	const loginFormComponent = LoginForm({
		onLoginAttempt: handleLoginAttempt,
		on2FAAttempt: handle2FAAttempt,
		onLoginSuccess: handleLoginSuccess,
	});
	formContainer.appendChild(loginFormComponent);

	const linksDiv = document.createElement('div');
	linksDiv.className = 'mt-6 text-center';
	linksDiv.innerHTML = `
        <a href="/" data-link class="text-blue-400 hover:text-blue-300 text-sm transition-colors">${t('link.home')}</a>
        <span class="mx-2 text-gray-400">|</span>
        <a href="/register" data-link class="text-blue-400 hover:text-blue-300 text-sm transition-colors">${t('login.registerLink')}</a>
    `;
	formContainer.appendChild(linksDiv);

	container.appendChild(formContainer);
	pageWrapper.appendChild(container);

	return pageWrapper;
}
