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
	pageWrapper.className = 'flex flex-col min-h-screen bg-gray-100';

	const headerElement = HeaderComponent({ currentUser: user });
	pageWrapper.appendChild(headerElement);

	const contentContainer = document.createElement('div');
    contentContainer.className = 'flex-grow flex items-center justify-center p-4 md:p-8';
    pageWrapper.appendChild(contentContainer);

	if (!user) {
		console.warn('Access unauthorized: User not authenticated.');
		navigateTo('/login');

		const deniedContainer = document.createElement('div');
		deniedContainer.className = 'flex items-center justify-center h-full';
		deniedContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-8 text-center">
                <h1 class="text-2xl font-bold text-red-600 mb-4">${t('user.settings.denied')}</h1>
                <p class="text-gray-700 mb-4">${t('user.settings.deniedMsg')}</p>
                <p class="text-gray-700">${t('msg.redirect.login')}</p>
                <!-- <a href="/login" data-link class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Se connecter
                </a> -->
            </div>
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
	contentWrapper.className = 'w-full max-w-xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8';
	contentContainer.appendChild(contentWrapper);

	const title = document.createElement('h1');
	title.className = 'text-3xl font-bold text-center text-gray-800 mb-6 border-b pb-4';
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

    const settingsFormComponent = SettingsForm({
        user: user,
        onProfileUpdate: handleProfileUpdate,
        onGenerate2FA: generate2FASetup,
        onVerifyAndEnable2FA: verify2FASetup,
        onDisable2FA: disable2FA,
    });
    contentWrapper.appendChild(settingsFormComponent);

	const backLink = document.createElement('a');
	backLink.href = '/dashboard';
	backLink.setAttribute('data-link', '');
	backLink.className = 'block text-center text-gray-600 hover:text-gray-800 text-sm mt-6';
	backLink.textContent = t('user.settings.dashboardLink');

	contentWrapper.appendChild(backLink);

	return pageWrapper;
}
