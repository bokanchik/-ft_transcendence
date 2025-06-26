import { User, UpdateUserPayload, Generate2FAResponse } from '../shared/schemas/usersSchemas.js';
import { ApiResult, ApiUpdateUserSuccessData } from '../utils/types.js';
import { t } from '../services/i18nService.js';

interface ProfileFormProps {
	user: User;
	onProfileUpdate: (payload: UpdateUserPayload) => Promise<ApiResult<ApiUpdateUserSuccessData>>;
	onGenerate2FA: () => Promise<Generate2FAResponse>;
	onVerifyAndEnable2FA: (token: string) => Promise<{ message: string }>;
	onDisable2FA: () => Promise<{ message: string }>;
}

export function SettingsForm(props: ProfileFormProps): HTMLElement {
	const { user, onProfileUpdate, onGenerate2FA, onVerifyAndEnable2FA, onDisable2FA } = props;
	let currentUserState = { ...user };

	const formElement = document.createElement('form');
	formElement.id = 'profile-form-component';
	formElement.noValidate = true;
	formElement.innerHTML = `
        <div id="profile-message" class="mb-4 text-center text-sm min-h-[1.25rem]"></div>

        <!-- Section Informations du profil -->
        <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">${t('user.settings.profileInfoTitle')}</h3>
        
        <div class="mb-4">
            <label for="username" class="block text-gray-700 text-sm font-bold mb-2">${t('user.username')}</label>
            <input type="text" id="username" name="username" readonly
                   value="${currentUserState.username}"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 cursor-not-allowed leading-tight focus:outline-none focus:shadow-outline">
            <p class="text-xs text-gray-500 mt-1">${t('user.settings.usernameMsg')}</p>
        </div>

        <div class="mb-4">
            <label for="email" class="block text-gray-700 text-sm font-bold mb-2">${t('user.email')}</label>
            <input type="email" id="email" name="email" required
                   value="${currentUserState.email || ''}"
                   placeholder="${t('user.settings.emailPlaceholder')}"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        </div>

        <div class="mb-4">
            <label for="display_name" class="block text-gray-700 text-sm font-bold mb-2">${t('user.displayName')}</label>
            <input type="text" id="display_name" name="display_name" required
                   value="${currentUserState.display_name || ''}"
                   placeholder="${t('user.settings.displayNamePlaceholder')}"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        </div>

        <div class="mb-6">
            <label for="avatar_url" class="block text-gray-700 text-sm font-bold mb-2">${t('register.avatarUrl')}</label>
            <input type="url" id="avatar_url" name="avatar_url"
                   value="${currentUserState.avatar_url || ''}"
                   placeholder="https://example.com/avatar.png"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
             <p class="text-xs text-gray-500 mt-1">${t('user.settings.avatarMsg')}</p>
        </div>
        
        <!-- Section Sécurité / 2FA -->
        <div class="mt-8">
             <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">${t('user.settings.securityTitle')}</h3>
             <div class="flex items-center mb-4">
                <input type="checkbox" id="is_two_fa_enabled" name="is_two_fa_enabled" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                <label for="is_two_fa_enabled" class="ml-2 block text-sm text-gray-900">${t('user.settings.enable2FA')}</label>
             </div>
             <div id="two-fa-setup-container" class="hidden pl-6 border-l-2 border-gray-200">
                <p class="text-sm text-gray-600 mb-4">${t('user.settings.2faSetupInstructions')}</p>
                <div id="qr-code-container" class="mb-4 p-4 rounded text-center flex justify-center items-center bg-gray-100 min-h-[14rem] min-w-[14rem]">
                </div>
                <div>
                    <label for="two_fa_token" class="block text-gray-700 text-sm font-bold mb-2">${t('user.settings.verificationCode')}</label>
                    <input type="text" id="two_fa_token" name="two_fa_token"
                           placeholder="123456"
                           maxlength="6"
                           autocomplete="one-time-code"
                           class="shadow appearance-none border rounded w-full max-w-xs py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    <p class="text-xs text-gray-500 mt-1">${t('user.settings.2faTokenHelp')}</p>
                </div>
             </div>
        </div>

        <div class="flex items-center justify-center mt-8 border-t pt-6">
            <button type="submit" id="save-profile-button"
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                ${t('user.settings.button')}
            </button>
        </div>
    `;

	const emailInput = formElement.querySelector('#email') as HTMLInputElement;
	const displayNameInput = formElement.querySelector('#display_name') as HTMLInputElement;
	const avatarUrlInput = formElement.querySelector('#avatar_url') as HTMLInputElement;
	const messageDiv = formElement.querySelector('#profile-message') as HTMLDivElement;
	const saveButton = formElement.querySelector('#save-profile-button') as HTMLButtonElement;

	const twoFaCheckbox = formElement.querySelector('#is_two_fa_enabled') as HTMLInputElement;
	const twoFaSetupContainer = formElement.querySelector('#two-fa-setup-container') as HTMLDivElement;
	const twoFaTokenInput = formElement.querySelector('#two_fa_token') as HTMLInputElement;
	const qrCodeContainer = formElement.querySelector('#qr-code-container') as HTMLDivElement;

	twoFaCheckbox.checked = currentUserState.is_two_fa_enabled;

	twoFaCheckbox.addEventListener('change', async () => {
		if (twoFaCheckbox.checked) {
			twoFaSetupContainer.classList.remove('hidden');
			qrCodeContainer.innerHTML = `<span class="loader"></span>`; // Affiche un spinner
			try {
				const { qrCodeDataURL } = await onGenerate2FA();
				const qrCodeImg = document.createElement('img');
				qrCodeImg.src = qrCodeDataURL;
				qrCodeImg.alt = t('user.settings.qrCodeAlt');
				qrCodeImg.classList.add('mx-auto');
				qrCodeContainer.innerHTML = '';
				qrCodeContainer.appendChild(qrCodeImg);
			} catch (error) {
				console.error("Failed to generate QR code:", error);
				qrCodeContainer.innerHTML = `<p class="text-red-500">${t('user.settings.qrCodeError')}</p>`;
			}
		} else {
			twoFaSetupContainer.classList.add('hidden');
			qrCodeContainer.innerHTML = ''; // Clear qr code
		}
	});

	formElement.addEventListener('submit', async (event) => {
		event.preventDefault();
		messageDiv.textContent = '';
		saveButton.disabled = true;
		saveButton.textContent = t('user.settings.savingMsg2');

		const updatedEmail = emailInput.value.trim();
		const updatedDisplayName = displayNameInput.value.trim();
		const updatedAvatarUrl = avatarUrlInput.value.trim();
		const newTwoFaState = twoFaCheckbox.checked;
		const twoFaToken = twoFaTokenInput.value.trim();

		let profileUpdateSuccess = false;
		let twoFaUpdateSuccess = false;

		try {
			if (newTwoFaState !== currentUserState.is_two_fa_enabled) {
				if (newTwoFaState) {
					if (!twoFaToken || !/^\d{6}$/.test(twoFaToken)) {
						throw new Error(t('user.settings.2faTokenInvalid'));
					}
					await onVerifyAndEnable2FA(twoFaToken);
				} else {
					await onDisable2FA();
				}
				twoFaUpdateSuccess = true;
			}

			const profilePayload: UpdateUserPayload = {};
			if (updatedEmail !== currentUserState.email) profilePayload.email = updatedEmail;
			if (updatedDisplayName !== currentUserState.display_name) profilePayload.display_name = updatedDisplayName;
			if (updatedAvatarUrl !== (currentUserState.avatar_url || '')) profilePayload.avatar_url = updatedAvatarUrl;

			if (Object.keys(profilePayload).length > 0) {
				const result = await onProfileUpdate(profilePayload);
				if (!result.success) {
					throw new Error(result.error);
				}
				currentUserState = { ...currentUserState, ...result.data.user };
				profileUpdateSuccess = true;
			}
			if (profileUpdateSuccess || twoFaUpdateSuccess) {
				currentUserState.is_two_fa_enabled = newTwoFaState;
				messageDiv.textContent = t('user.settings.success');
				messageDiv.className = 'mb-4 text-center text-sm text-green-600 font-semibold min-h-[1.25rem]';

				emailInput.value = currentUserState.email;
				displayNameInput.value = currentUserState.display_name;
				avatarUrlInput.value = currentUserState.avatar_url || '';
				twoFaTokenInput.value = '';
				if (!newTwoFaState) {
					twoFaSetupContainer.classList.add('hidden');
				}

				setTimeout(() => {
					if (messageDiv.textContent === t('user.settings.success')) {
						messageDiv.textContent = '';
					}
				}, 3000);
			} else {
				messageDiv.textContent = t('user.settings.noChanges');
				messageDiv.className = 'mb-4 text-center text-sm text-blue-600 min-h-[1.25rem]';
			}

		} catch (error: any) {
			messageDiv.textContent = `${t('general.error')}: ${error.message || t('user.settings.error')}`;
			messageDiv.className = 'mb-4 text-center text-sm text-red-600 font-semibold min-h-[1.25rem]';
		} finally {
			saveButton.disabled = false;
			saveButton.textContent = t('user.settings.button');
		}
	});

	return formElement;
}
