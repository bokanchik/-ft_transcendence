import { User, UpdateUserPayload, Generate2FAResponse } from '../shared/schemas/usersSchemas.js';
import { ApiResult, ApiUpdateUserSuccessData } from '../utils/types.js';
import { t, getLanguage, setLanguage } from '../services/i18nService.js';
import { createElement, createInputField, clearElement } from '../utils/domUtils.js';
import { navigateTo } from '../services/router.js';
import { showToast } from './toast.js';

interface ProfileFormProps {
	user: User;
	onProfileUpdate: (payload: UpdateUserPayload) => Promise<ApiResult<ApiUpdateUserSuccessData>>;
	onGenerate2FA: () => Promise<Generate2FAResponse>;
	onVerifyAndEnable2FA: (token: string) => Promise<{ message: string }>;
	onDisable2FA: () => Promise<{ message: string }>;
}

const supportedLanguages = {
	'en': 'English',
	'fr': 'Français',
	'es': 'Español',
	'ru': 'Русский'
};

export function SettingsForm(props: ProfileFormProps): HTMLElement {
	const { user, onProfileUpdate, onGenerate2FA, onVerifyAndEnable2FA, onDisable2FA } = props;
	let currentUserState = { ...user };

	let emailInput: HTMLInputElement;
	let displayNameInput: HTMLInputElement;
	let avatarUrlInput: HTMLInputElement;
	let languageSelect: HTMLSelectElement;
	let twoFaCheckbox: HTMLInputElement;
	let twoFaTokenInput: HTMLInputElement;
	let qrCodeContainer: HTMLDivElement;
	let twoFaSetupContainer: HTMLDivElement;

	const formElement = createElement('form', { id: 'profile-form-component', noValidate: true });

	// --- Section Informations du profil ---
	const usernameField = createInputField('username', t('user.username'), { value: currentUserState.username, readonly: true, helpText: t('user.settings.usernameMsg'), inputClass: 'w-full p-2 bg-black/30 border border-gray-500/50 text-gray-400 cursor-not-allowed rounded-md' });
	const emailField = createInputField('email', t('user.email'), { type: 'email', required: true, value: currentUserState.email || '', placeholder: t('user.settings.emailPlaceholder') });
	emailInput = emailField.querySelector('input')!;

	const displayNameField = createInputField('display_name', t('user.displayName'), { required: true, value: currentUserState.display_name || '', placeholder: t('user.settings.displayNamePlaceholder') });
	displayNameInput = displayNameField.querySelector('input')!;

	const avatarUrlField = createInputField('avatar_url', t('register.avatarUrl'), { type: 'url', value: currentUserState.avatar_url || '', placeholder: 'https://example.com/avatar.png', helpText: t('user.settings.avatarMsg') });
	avatarUrlInput = avatarUrlField.querySelector('input')!;

	// --- Sélecteur de langue ---
	languageSelect = createElement('select', {
		id: 'language',
		name: 'language',
		className: 'w-full p-2 bg-black/20 border border-gray-500/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400'
	});
	Object.entries(supportedLanguages).forEach(([code, name]) => {
		const option = document.createElement('option');
		option.value = code;
		option.textContent = name;
		if (getLanguage() === code) {
			option.selected = true;
		}
		languageSelect.appendChild(option);
	});
	const languageField = createElement('div', { className: 'mb-6' }, [
		createElement('label', { htmlFor: 'language', textContent: t('header.language'), className: 'block text-sm font-medium text-gray-300 mb-1' }),
		languageSelect
	]);

	// --- Section Sécurité / 2FA ---
	const securityTitle = createElement('h3', { textContent: t('user.settings.securityTitle'), className: 'mt-8 text-lg font-semibold text-white mb-4 border-b border-gray-400/30 pb-2' });

	twoFaCheckbox = createElement('input', { type: 'checkbox', id: 'is_two_fa_enabled', name: 'is_two_fa_enabled', className: 'h-4 w-4 text-blue-400 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800' });
	const twoFaLabel = createElement('label', { htmlFor: 'is_two_fa_enabled', textContent: t('user.settings.enable2FA'), className: 'ml-2 block text-sm text-gray-200' });
	const twoFaToggleContainer = createElement('div', { className: 'flex items-center mb-4' }, [twoFaCheckbox, twoFaLabel]);

	qrCodeContainer = createElement('div', { id: 'qr-code-container', className: 'mb-4 p-4 rounded text-center flex justify-center items-center bg-white/90 min-h-[14rem] min-w-[14rem]' });

	const twoFaTokenField = createInputField('two_fa_token', t('user.settings.verificationCode'), { placeholder: '123456', maxLength: 6, helpText: t('user.settings.2faTokenHelp'), inputClass: 'w-full max-w-xs p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400' });
	twoFaTokenInput = twoFaTokenField.querySelector('input')!;
	twoFaTokenInput.autocomplete = 'one-time-code';

	twoFaSetupContainer = createElement('div', { id: 'two-fa-setup-container', className: 'hidden pl-6 border-l-2 border-gray-500/50' }, [
		createElement('p', { textContent: t('user.settings.2faSetupInstructions'), className: 'text-sm text-gray-300 mb-4' }),
		qrCodeContainer,
		twoFaTokenField
	]);

	const saveButton = createElement('button', { type: 'submit', id: 'save-profile-button', textContent: t('user.settings.button'), className: 'w-full sm:w-auto font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white border border-blue-400/50' });
	const submitContainer = createElement('div', { className: 'flex items-center justify-center mt-8 border-t border-gray-400/30 pt-6' }, [saveButton]);

	formElement.append(
		usernameField, emailField, displayNameField,
		avatarUrlField, languageField, securityTitle, twoFaToggleContainer,
		twoFaSetupContainer, submitContainer
	);

	// --- Logique d'événements ---
	twoFaCheckbox.checked = currentUserState.is_two_fa_enabled;

	twoFaCheckbox.addEventListener('change', async () => {
		clearElement(qrCodeContainer);
		if (twoFaCheckbox.checked) {
			twoFaSetupContainer.classList.remove('hidden');
			qrCodeContainer.append(createElement('span', { className: 'loader' }));
			try {
				const { qrCodeDataURL } = await onGenerate2FA();
				const qrCodeImg = createElement('img', { src: qrCodeDataURL, alt: t('user.settings.qrCodeAlt'), className: 'mx-auto' });
				clearElement(qrCodeContainer);
				qrCodeContainer.appendChild(qrCodeImg);
			} catch (error) {
				console.error("Failed to generate QR code:", error);
				clearElement(qrCodeContainer);
				qrCodeContainer.append(createElement('p', { textContent: t('user.settings.qrCodeError'), className: 'text-red-500' }));
			}
		} else {
			twoFaSetupContainer.classList.add('hidden');
		}
	});

	formElement.addEventListener('submit', async (event) => {
		event.preventDefault();
		saveButton.disabled = true;
		saveButton.textContent = t('user.settings.savingMsg2');

		let changesMade = false;

		try {
			const newTwoFaState = twoFaCheckbox.checked;
			if (newTwoFaState !== currentUserState.is_two_fa_enabled) {
				const twoFaToken = twoFaTokenInput.value.trim();
				if (newTwoFaState) {
					if (!twoFaToken || !/^\d{6}$/.test(twoFaToken)) throw new Error(t('user.settings.2faTokenInvalid'));
					await onVerifyAndEnable2FA(twoFaToken);
				} else {
					await onDisable2FA();
				}
			}

			const profilePayload: UpdateUserPayload = {};
			const updatedEmail = emailInput.value.trim();
			const updatedDisplayName = displayNameInput.value.trim();
			const updatedAvatarUrl = avatarUrlInput.value.trim();
			const updatedLanguage = languageSelect.value;

			if (updatedEmail !== (currentUserState.email || '')) { profilePayload.email = updatedEmail; }
			if (updatedDisplayName !== (currentUserState.display_name || '')) { profilePayload.display_name = updatedDisplayName; }
			if (updatedAvatarUrl !== (currentUserState.avatar_url || '')) { profilePayload.avatar_url = updatedAvatarUrl === '' ? null : updatedAvatarUrl; }
            if (updatedLanguage !== (currentUserState.language || '')) { profilePayload.language = updatedLanguage; }

            if (Object.keys(profilePayload).length > 0) {
				changesMade = true;
				const result = await onProfileUpdate(profilePayload);
				if (!result.success) throw new Error(result.error);
			}

            if (updatedLanguage !== getLanguage()) {
                await setLanguage(updatedLanguage, { reloadRoute: false });
            }
			if (changesMade) {
				showToast(t('user.settings.success'), 'success');
			} else {
				showToast(t('user.settings.noChanges'), 'info');
			}
			navigateTo('/dashboard');

		} catch (error: any) {
			showToast(`${t('general.error')}: ${t(error.message) || t('user.settings.error')}`, 'error');
			saveButton.disabled = false;
			saveButton.textContent = t('user.settings.button');
		}
	});

	return formElement;
}
