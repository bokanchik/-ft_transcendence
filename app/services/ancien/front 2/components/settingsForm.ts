// import { User, UpdateUserPayload } from '../shared/schemas/usersSchemas.js';
// import { ApiResult, ApiUpdateUserSuccessData } from '../utils/types.js';
// import { t } from '../services/i18nService.js';

// interface ProfileFormProps {
// 	user: User;
// 	onProfileUpdate: (payload: UpdateUserPayload) => Promise<ApiResult<ApiUpdateUserSuccessData>>;
// }

// export function SettingsForm(props: ProfileFormProps): HTMLElement {
// 	const { user, onProfileUpdate } = props;

// 	const formElement = document.createElement('form');
// 	formElement.id = 'profile-form-component';
// 	formElement.innerHTML = `
//         <div id="profile-message" class="mb-4 text-center text-sm min-h-[1.25rem]"></div>

//         <!-- Champ Username -->
//         <div class="mb-4">
//             <label for="username" class="block text-gray-700 text-sm font-bold mb-2">${t('user.username')}</label>
//             <input type="text" id="username" name="username" readonly
//                    value="${user.username}"
//                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 cursor-not-allowed leading-tight focus:outline-none focus:shadow-outline">
//             <p class="text-xs text-gray-500 mt-1">${t('user.settings.usernameMsg')}</p>
//         </div>

//         <!-- Champ Email -->
//         <div class="mb-4">
//             <label for="email" class="block text-gray-700 text-sm font-bold mb-2">${t('user.email')}</label>
//             <input type="email" id="email" name="email" required
//                    value="${user.email || ''}"
//                    placeholder="${t('user.settings.emailPlaceholder')}"
//                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
//         </div>

//         <!-- Champ Display Name -->
//         <div class="mb-4">
//             <label for="display_name" class="block text-gray-700 text-sm font-bold mb-2">${t('user.displayName')}</label>
//             <input type="text" id="display_name" name="display_name" required
//                    value="${user.display_name || ''}"
//                    placeholder="${t('user.settings.displayNamePlaceholder')}"
//                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
//         </div>

//         <!-- Champ Avatar URL (Optionnel) -->
//         <div class="mb-6">
//             <label for="avatar_url" class="block text-gray-700 text-sm font-bold mb-2">${t('register.avatarUrl')}</label>
//             <input type="url" id="avatar_url" name="avatar_url"
//                    value="${user.avatar_url || ''}"
//                    placeholder="https://example.com/avatar.png"
//                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
//              <p class="text-xs text-gray-500 mt-1">${t('user.settings.avatarMsg')}</p>
//         </div>

//         <div class="flex items-center justify-center mt-6 border-t pt-6">
//             <button type="submit" id="save-profile-button"
//                     class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
//                 ${t('user.settings.button')}
//             </button>
//         </div>
//     `;

// 	const emailInput = formElement.querySelector('#email') as HTMLInputElement;
// 	const displayNameInput = formElement.querySelector('#display_name') as HTMLInputElement;
// 	const avatarUrlInput = formElement.querySelector('#avatar_url') as HTMLInputElement;
// 	const messageDiv = formElement.querySelector('#profile-message') as HTMLDivElement;
// 	const saveButton = formElement.querySelector('#save-profile-button') as HTMLButtonElement;

// 	formElement.addEventListener('submit', async (event) => {
// 		event.preventDefault();
// 		messageDiv.textContent = t('user.settings.savingMsg1');
// 		messageDiv.className = 'mb-4 text-center text-sm text-gray-600 min-h-[1.25rem]';
// 		saveButton.disabled = true;
// 		saveButton.textContent = t('user.settings.savingMsg2');

// 		const updatedEmail = emailInput.value.trim();
// 		const updatedDisplayName = displayNameInput.value.trim();
// 		const updatedAvatarUrl = avatarUrlInput.value.trim();

// 		if (!updatedEmail || !updatedDisplayName) {
// 			messageDiv.textContent = t('register.fieldsRequired');
// 			messageDiv.className = 'mb-4 text-center text-sm text-red-600 font-semibold min-h-[1.25rem]';
// 			saveButton.disabled = false;
// 			saveButton.textContent = t('user.settings.button');
// 			return;
// 		}

// 		const payload: UpdateUserPayload = {
// 			email: updatedEmail,
// 			display_name: updatedDisplayName,
// 			avatar_url: updatedAvatarUrl,
// 		};

// 		const result = await onProfileUpdate(payload);

// 		saveButton.disabled = false;
// 		saveButton.textContent = t('user.settings.button');

// 		if (result.success) {
// 			messageDiv.textContent = t('user.settings.success');
// 			messageDiv.className = 'mb-4 text-center text-sm text-green-600 font-semibold min-h-[1.25rem]';

// 			emailInput.value = result.data.user.email;
// 			displayNameInput.value = result.data.user.display_name;
// 			avatarUrlInput.value = result.data.user.avatar_url || '';

// 			setTimeout(() => {
// 				if (messageDiv.textContent === t('user.settings.success')) {
// 					messageDiv.textContent = '';
// 				}
// 			}, 3000);
// 		} else {
// 			messageDiv.textContent = `${t('general.error')}: ${result.error || t('user.settings.error')}`;
// 			messageDiv.className = 'mb-4 text-center text-sm text-red-600 font-semibold min-h-[1.25rem]';
// 		}
// 	});

// 	return formElement;
// }

// 2 EME VERSION

import { User, UpdateUserPayload } from '../shared/schemas/usersSchemas.js';
import { ApiResult, ApiUpdateUserSuccessData } from '../utils/types.js';
import { t } from '../services/i18nService.js';
import { TwoFactorAuthSetup } from './twoFactorAuthSetup.js';
import { showToast, showCustomConfirm } from './toast.js';

interface SettingsFormProps {
    user: User;
    onProfileUpdate: (payload: UpdateUserPayload) => Promise<ApiResult<ApiUpdateUserSuccessData>>;
    onGenerate2FA: () => Promise<{ qrCodeDataURL: string }>;
    onVerify2FA: (token: string) => Promise<void>;
    onDisable2FA: () => Promise<void>;
}

export function SettingsForm(props: SettingsFormProps): HTMLElement {
    let { user } = props;
    
    let isSettingUp2FA = false;
    let qrCodeUrl: string | null = null;
    
    const wrapper = document.createElement('div');
    wrapper.id = "settings-form-wrapper";

    const render = () => {
        wrapper.innerHTML = '';

        // --- Section Profil ---
        const profileForm = createProfileForm();
        wrapper.appendChild(profileForm);

        // --- Section 2FA ---
        const twoFactorSection = document.createElement('div');
        twoFactorSection.className = 'mt-8 border-t pt-6';
        twoFactorSection.innerHTML = `<h2 class="text-xl font-semibold mb-2">Two-Factor Authentication</h2>`;
        
        const twoFactorContent = document.createElement('div');
        twoFactorSection.appendChild(twoFactorContent);

        if (isSettingUp2FA && qrCodeUrl) {
            const setupComponent = TwoFactorAuthSetup({
                qrCodeDataURL: qrCodeUrl,
                onVerify: async (token) => {
                    await props.onVerify2FA(token);
                    isSettingUp2FA = false;
                    qrCodeUrl = null;
                    user = { ...user, is_two_fa_enabled: true };
                    render();
                },
                onCancel: () => {
                    isSettingUp2FA = false;
                    qrCodeUrl = null;
                    render();
                },
            });
            twoFactorContent.appendChild(setupComponent);
        } else if (user.is_two_fa_enabled) {
            // Afficher l'état "Activé" et le bouton "Désactiver"
            twoFactorContent.innerHTML += `<p class="text-green-600 mb-4">2FA is enabled on your account.</p>`;
            const disableBtn = document.createElement('button');
            disableBtn.className = 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded';
            disableBtn.textContent = 'Disable 2FA';
            disableBtn.onclick = handleDisable2FA;
            twoFactorContent.appendChild(disableBtn);
        } else {
            // Afficher l'état "Désactivé" et le bouton "Activer"
            twoFactorContent.innerHTML += `<p class="text-gray-600 mb-4">Add an extra layer of security to your account.</p>`;
            const enableBtn = document.createElement('button');
            enableBtn.className = 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded';
            enableBtn.textContent = 'Enable 2FA';
            enableBtn.onclick = handleEnable2FA;
            twoFactorContent.appendChild(enableBtn);
        }

        wrapper.appendChild(twoFactorSection);
    };

    const createProfileForm = (): HTMLElement => {
        const formElement = document.createElement('form');
        formElement.id = 'profile-form-component';
	formElement.innerHTML = `
        <div id="profile-message" class="mb-4 text-center text-sm min-h-[1.25rem]"></div>

        <!-- Champ Username -->
        <div class="mb-4">
            <label for="username" class="block text-gray-700 text-sm font-bold mb-2">${t('user.username')}</label>
            <input type="text" id="username" name="username" readonly
                   value="${user.username}"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 cursor-not-allowed leading-tight focus:outline-none focus:shadow-outline">
            <p class="text-xs text-gray-500 mt-1">${t('user.settings.usernameMsg')}</p>
        </div>

        <!-- Champ Email -->
        <div class="mb-4">
            <label for="email" class="block text-gray-700 text-sm font-bold mb-2">${t('user.email')}</label>
            <input type="email" id="email" name="email" required
                   value="${user.email || ''}"
                   placeholder="${t('user.settings.emailPlaceholder')}"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        </div>

        <!-- Champ Display Name -->
        <div class="mb-4">
            <label for="display_name" class="block text-gray-700 text-sm font-bold mb-2">${t('user.displayName')}</label>
            <input type="text" id="display_name" name="display_name" required
                   value="${user.display_name || ''}"
                   placeholder="${t('user.settings.displayNamePlaceholder')}"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        </div>

        <!-- Champ Avatar URL (Optionnel) -->
        <div class="mb-6">
            <label for="avatar_url" class="block text-gray-700 text-sm font-bold mb-2">${t('register.avatarUrl')}</label>
            <input type="url" id="avatar_url" name="avatar_url"
                   value="${user.avatar_url || ''}"
                   placeholder="https://example.com/avatar.png"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
             <p class="text-xs text-gray-500 mt-1">${t('user.settings.avatarMsg')}</p>
        </div>

        <div class="flex items-center justify-center mt-6 border-t pt-6">
            <button type="submit" id="save-profile-button"
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                ${t('user.settings.button')}
            </button>
        </div>
    `;
        return formElement;
    };
    
    // Gestionnaires d'événements 2FA
    const handleEnable2FA = async (e: MouseEvent) => {
        const button = e.target as HTMLButtonElement;
        button.disabled = true;
        button.textContent = 'Generating...';

        try {
            const { qrCodeDataURL } = await props.onGenerate2FA();
            qrCodeUrl = qrCodeDataURL;
            isSettingUp2FA = true;
            render();
        } catch (error: any) {
            showToast(error.message || 'Could not start 2FA setup.', 'error');
            button.disabled = false;
            button.textContent = 'Enable 2FA';
        }
    };
    
    const handleDisable2FA = async () => {
        const confirmed = await showCustomConfirm("Are you sure you want to disable 2FA? This will reduce your account's security.", "Disable 2FA");
        if (!confirmed) return;
        
        try {
            await props.onDisable2FA();
            showToast('2FA has been disabled.', 'success');
            user = { ...user, is_two_fa_enabled: false };
            render();
        } catch (error: any) {
            showToast(error.message || 'Failed to disable 2FA.', 'error');
        }
    };

    render();
    return wrapper;
}