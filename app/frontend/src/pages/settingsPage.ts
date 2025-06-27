import { getUserDataFromStorage, updateUserProfile, generate2FASetup, verify2FASetup, disable2FA } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
import { User, UpdateUserPayload } from '../shared/schemas/usersSchemas.js';
import { ApiResult, ApiUpdateUserSuccessData } from '../utils/types.js';
import { SettingsForm } from '../components/settingsForm.js';
import { fetchCsrfToken } from '../services/csrf.js';
import { t } from '../services/i18nService.js';
import { HeaderComponent } from '../components/headerComponent.js';

export async function SettingsPage(): Promise<HTMLElement> {
	const user: User | null = getUserDataFromStorage();

	const pageWrapper = document.createElement('div');
	pageWrapper.className = 'flex flex-col min-h-screen bg-cover bg-center bg-fixed';
	pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";

	const headerElement = HeaderComponent({ currentUser: user });
	pageWrapper.appendChild(headerElement);

	const contentContainer = document.createElement('div');
	contentContainer.className = 'flex-grow flex items-center justify-center p-4 md:p-8';
	pageWrapper.appendChild(contentContainer);

	if (!user) {
		console.warn('Access unauthorized: User not authenticated.');
		navigateTo('/login');

		const deniedContainer = document.createElement('div');
		deniedContainer.className = 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 text-center';
		deniedContainer.innerHTML = `
            <h1 class="text-2xl font-bold text-red-400 mb-4">${t('user.settings.denied')}</h1>
            <p class="text-gray-200 mb-4">${t('user.settings.deniedMsg')}</p>
            <p class="text-gray-300">${t('msg.redirect.login')}</p>
        `;
		contentContainer.appendChild(deniedContainer);
		return pageWrapper;
	}

	try {
		await fetchCsrfToken();
	} catch (error) {
		console.error("Failed to fetch CSRF token:", error);
		const errorMsg = document.createElement('div');
		errorMsg.className = 'text-center text-xl text-red-500';
		errorMsg.textContent = t('msg.error.initializing');
		contentContainer.appendChild(errorMsg);
		return pageWrapper;
	}

	const contentWrapper = document.createElement('div');
	contentWrapper.className = 'w-full max-w-xl mx-auto bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-6 md:p-8';
	contentContainer.appendChild(contentWrapper);

	const title = document.createElement('h1');
	title.className = 'text-3xl font-bold text-center text-white mb-6 border-b border-gray-400/30 pb-4';
	title.textContent = t('user.settings.title');
	contentWrapper.appendChild(title);

	const handleProfileUpdate = async (payload: UpdateUserPayload): Promise<ApiResult<ApiUpdateUserSuccessData>> => {
		const result = await updateUserProfile(payload);
		if (result.success) {
			console.log('Profile updated in service, local storage should be updated too.');
			setTimeout(() => { navigateTo('/dashboard'); }, 500);
		}
		return result;
	};

	const handleVerifyAndEnable2FA = async (token: string): Promise<{ message: string }> => {
		const result = await verify2FASetup(token);
		console.log('2FA enabled, redirecting to dashboard.');
		setTimeout(() => { navigateTo('/dashboard'); }, 500);
		return result;
	};

	const handleDisable2FA = async (): Promise<{ message: string }> => {
		const result = await disable2FA();
		console.log('2FA disabled, redirecting to dashboard.');
		setTimeout(() => { navigateTo('/dashboard'); }, 500);
		return result;
	};

	const settingsFormComponent = SettingsForm({
		user: user,
		onProfileUpdate: handleProfileUpdate,
		onGenerate2FA: generate2FASetup,
		onVerifyAndEnable2FA: handleVerifyAndEnable2FA,
		onDisable2FA: handleDisable2FA,
	});
	contentWrapper.appendChild(settingsFormComponent);

	const backLink = document.createElement('a');
	backLink.href = '/dashboard';
	backLink.setAttribute('data-link', '');
	backLink.className = 'block text-center text-blue-400 hover:text-blue-300 text-sm mt-6 transition-colors';
	backLink.textContent = t('link.dashboard');

	contentWrapper.appendChild(backLink);

	return pageWrapper;
}
