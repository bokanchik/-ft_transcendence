import { getUserDataFromStorage, updateUserProfile } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
import { User, UpdateUserPayload } from '../shared/schemas/usersSchemas.js';
import { ApiResult } from '../utils/types.js';
import { SettingsForm } from '../components/settingsForm.js';
import { fetchCsrfToken } from '../services/csrf.js';
import { t } from '../services/i18nService.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { TwoFactorAuthSetup } from '../components/twoFactorAuthSetup.js';
import { showToast } from '../components/toast.js';
import { fetchWithCsrf } from '../services/csrf.js';

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

	const handleProfileUpdate = async (payload: UpdateUserPayload): Promise<ApiResult> => {
		const result = await updateUserProfile(payload);
		if (result.success) {
			console.log('Profile updated in service, local storage should be updated too.');
			setTimeout(() => { navigateTo('/dashboard'); }, 500);
		}
		return result;
	};

	const profileFormComponent = SettingsForm({
		user: user,
		onProfileUpdate: handleProfileUpdate,
	});
	contentWrapper.appendChild(profileFormComponent);

	// 2fa section
    const twoFactorSection = document.createElement('div');
    twoFactorSection.className = 'mt-8 border-t pt-6';
    contentWrapper.appendChild(twoFactorSection);
    
    const twoFactorContent = document.createElement('div');
    twoFactorSection.appendChild(twoFactorContent);

    const update2FA_UI = () => {
        twoFactorContent.innerHTML = '';
        const freshUserData = getUserDataFromStorage();

        twoFactorContent.innerHTML = `
            <h2 class="text-xl font-semibold mb-2">Two-Factor Authentication</h2>
        `;

        if (freshUserData?.is_two_fa_enabled) {
            twoFactorContent.innerHTML += `
                <p class="text-green-600 mb-4">2FA is enabled.</p>
                <button id="disable-2fa-btn" class="bg-red-600 ...">Disable 2FA</button>
            `;
            // TODO: Ajouter la logique pour le bouton de désactivation
        } else {
            twoFactorContent.innerHTML += `
                <p class="text-gray-600 mb-4">Add an extra layer of security to your account.</p>
                <button id="enable-2fa-btn" class="bg-indigo-600 ...">Enable 2FA</button>
            `;
            twoFactorContent.querySelector('#enable-2fa-btn')?.addEventListener('click', start2FASetup);
        }
    };
    
    const start2FASetup = async () => {
        try {
            twoFactorContent.innerHTML = `<p>Generating QR Code...</p>`;
            const response = await fetchWithCsrf('/api/users/2fa/generate', { method: 'POST' });
            if (!response.ok) throw new Error('Could not generate 2FA setup.');
            const { qrCodeDataURL } = await response.json();

            const setupComponent = TwoFactorAuthSetup({
                qrCodeDataURL,
                onVerified: () => {
                    showToast('2FA enabled successfully!', 'success');
                    // Mettre à jour l'utilisateur dans le local storage (très important !)
                    const user = getUserDataFromStorage();
                    if (user) {
                        user.is_two_fa_enabled = true;
                        localStorage.setItem('userDataKey', JSON.stringify(user));
                    }
                    update2FA_UI();
                },
                onCancel: () => update2FA_UI()
            });

            twoFactorContent.innerHTML = '';
            twoFactorContent.appendChild(setupComponent);
        } catch (error) {
            showToast((error as Error).message, 'error');
            update2FA_UI();
        }
    };

    update2FA_UI();

	const backLink = document.createElement('a');
	backLink.href = '/dashboard';
	backLink.setAttribute('data-link', '');
	backLink.className = 'block text-center text-gray-600 hover:text-gray-800 text-sm mt-6';
	backLink.textContent = t('user.settings.dashboardLink');

	contentWrapper.appendChild(backLink);

	return pageWrapper;
}
