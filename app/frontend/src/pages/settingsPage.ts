import { getUserDataFromStorage, updateUserProfile, generate2FASetup, verify2FASetup, disable2FA } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
import { User, UpdateUserPayload } from '../shared/schemas/usersSchemas.js';
import { ApiResult, ApiUpdateUserSuccessData } from '../utils/types.js';
import { SettingsForm } from '../components/settingsForm.js';
import { fetchCsrfToken } from '../services/csrf.js';
import { t, setLanguage, getLanguage } from '../services/i18nService.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { createElement } from '../utils/domUtils.js';

export async function SettingsPage(): Promise<HTMLElement> {
	const user: User | null = getUserDataFromStorage();
	const headerElement = HeaderComponent({ currentUser: user });
	
	const pageContainer = createElement('div', {
		className: 'flex-grow flex items-center justify-center p-4 md:p-8'
	});
	
	const pageWrapper = createElement('div', { 
		className: 'flex flex-col h-screen bg-cover bg-center bg-fixed' 
	}, [
		headerElement,
		pageContainer
	]);
	pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";

	if (!user) {
		navigateTo('/login');
		const deniedContainer = createElement('div', {
			className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 text-center'
		}, [
			createElement('h1', { textContent: t('user.settings.denied'), className: 'text-2xl font-bold text-red-400 mb-4' }),
			createElement('p', { textContent: t('msg.redirect.login'), className: 'text-gray-300' })
		]);
		pageContainer.append(deniedContainer);
		return pageWrapper;
	}

	try {
		await fetchCsrfToken();
	} catch (error) {
		console.error("Failed to fetch CSRF token:", error);
		const errorMsg = createElement('div', {
			textContent: t('msg.error.initializing'),
			className: 'text-center text-xl text-red-500'
		});
		pageContainer.append(errorMsg);
		return pageWrapper;
	}

	const handleProfileUpdate = async (payload: UpdateUserPayload): Promise<ApiResult<ApiUpdateUserSuccessData>> => {
		const currentLang = getLanguage();
		const result = await updateUserProfile(payload);
		if (result.success && payload.language && payload.language !== currentLang) {
			await setLanguage(payload.language);
		}
		return result;
	};

	const handleVerifyAndEnable2FA = (token: string) => verify2FASetup(token);
	const handleDisable2FA = () => disable2FA();

	const title = createElement('h1', {
		textContent: t('user.settings.title'),
		className: 'flex-shrink-0 text-3xl font-bold text-center text-white mb-6 border-b border-gray-400/30 pb-4'
	});

	const backLink = createElement('a', {
		href: '/dashboard',
		textContent: t('link.dashboard'),
		className: 'flex-shrink-0 block text-center text-blue-400 hover:text-blue-300 text-sm mt-6 transition-colors'
	});
	backLink.setAttribute('data-link', '');

	const settingsFormComponent = SettingsForm({
		user: user,
		onProfileUpdate: handleProfileUpdate,
		onGenerate2FA: generate2FASetup,
		onVerifyAndEnable2FA: handleVerifyAndEnable2FA,
		onDisable2FA: handleDisable2FA,
	});

	const scrollableContent = createElement('div', {
		className: 'flex-grow overflow-y-auto min-h-0 pr-4 -mr-4' // Classes pour le scroll
	}, [
		settingsFormComponent
	]);

	const cardContainer = createElement('div', {
		className: 'w-full max-w-xl mx-auto bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh]'
	}, [
		title,
		scrollableContent,
		backLink
	]);
	
	pageContainer.append(cardContainer);

	return pageWrapper;
}