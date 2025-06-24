// /pages/loginPage.ts
import { attemptLogin } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
import { LoginForm } from '../components/loginForm.js';
import { LoginRequestBody } from '../shared/schemas/usersSchemas.js';
import { ApiResult } from '../utils/types.js';
import { t } from '../services/i18nService.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { getUserDataFromStorage } from '../services/authService.js';

export function LoginPage(): HTMLElement {
	const currentUser = getUserDataFromStorage();

	const pageWrapper = document.createElement('div');
	pageWrapper.className = 'flex flex-col min-h-screen bg-gray-100';

	const headerElement = HeaderComponent({ currentUser });
	pageWrapper.appendChild(headerElement);

	const container = document.createElement('div');
	container.className = 'bg-white flex justify-center items-center min-h-screen p-8';

	const formContainer = document.createElement('div');
	formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';

	const title = document.createElement('h2');
	title.className = 'text-3xl font-bold mb-6 text-center text-gray-800';
	title.textContent = t('login.title');

	formContainer.appendChild(title);

	// const handleLoginAttempt = async (credentials: LoginRequestBody): Promise<ApiResult> => {
	// 	return attemptLogin(credentials);
	// };

	const handleLoginSuccess = (userData: any) => {
		setTimeout(() => { navigateTo('/dashboard'); }, 500);
	};

	const loginFormComponent = LoginForm({
		// onLoginAttempt: handleLoginAttempt,
		onLoginSuccess: handleLoginSuccess,
	});
	formContainer.appendChild(loginFormComponent);


	const linksDiv = document.createElement('div');
	linksDiv.className = 'mt-6 text-center';
	linksDiv.innerHTML = `
        <a href="/" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            ${t('login.backToHome')}
        </a>
        <span class="mx-2 text-gray-400">|</span>
        <a href="/register" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            ${t('login.registerLink')}
        </a>
    `;
	formContainer.appendChild(linksDiv);

	container.appendChild(formContainer);
	pageWrapper.appendChild(container);

	// return container;
	return pageWrapper;
}
