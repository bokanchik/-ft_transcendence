import { User, UpdateUserPayload } from '../shared/schemas/usersSchemas.js';
import { ApiResult } from '../utils/types.js';
import { t } from '../services/i18nService.js';

interface ProfileFormProps {
	user: User;
	onProfileUpdate: (payload: UpdateUserPayload) => Promise<ApiResult>;
}

export function SettingsForm(props: ProfileFormProps): HTMLElement {
	const { user, onProfileUpdate } = props;

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

	const emailInput = formElement.querySelector('#email') as HTMLInputElement;
	const displayNameInput = formElement.querySelector('#display_name') as HTMLInputElement;
	const avatarUrlInput = formElement.querySelector('#avatar_url') as HTMLInputElement;
	const messageDiv = formElement.querySelector('#profile-message') as HTMLDivElement;
	const saveButton = formElement.querySelector('#save-profile-button') as HTMLButtonElement;

	formElement.addEventListener('submit', async (event) => {
		event.preventDefault();
		messageDiv.textContent = t('user.settings.savingMsg1');
		messageDiv.className = 'mb-4 text-center text-sm text-gray-600 min-h-[1.25rem]';
		saveButton.disabled = true;
		saveButton.textContent = t('user.settings.savingMsg2');

		const updatedEmail = emailInput.value.trim();
		const updatedDisplayName = displayNameInput.value.trim();
		const updatedAvatarUrl = avatarUrlInput.value.trim();

		if (!updatedEmail || !updatedDisplayName) {
			messageDiv.textContent = t('register.fieldsRequired');
			messageDiv.className = 'mb-4 text-center text-sm text-red-600 font-semibold min-h-[1.25rem]';
			saveButton.disabled = false;
			saveButton.textContent = t('user.settings.button');
			return;
		}

		const payload: UpdateUserPayload = {
			email: updatedEmail,
			display_name: updatedDisplayName,
			avatar_url: updatedAvatarUrl,
		};

		const result = await onProfileUpdate(payload);

		saveButton.disabled = false;
		saveButton.textContent = t('user.settings.button');

		if (result.success) {
			messageDiv.textContent = t('user.settings.success');
			messageDiv.className = 'mb-4 text-center text-sm text-green-600 font-semibold min-h-[1.25rem]';

			emailInput.value = result.data.user.email;
			displayNameInput.value = result.data.user.display_name;
			avatarUrlInput.value = result.data.user.avatar_url || '';

			setTimeout(() => {
				if (messageDiv.textContent === t('user.settings.success')) {
					messageDiv.textContent = '';
				}
			}, 3000);
		} else {
			messageDiv.textContent = `${t('general.error')}: ${result.error || t('user.settings.error')}`;
			messageDiv.className = 'mb-4 text-center text-sm text-red-600 font-semibold min-h-[1.25rem]';
		}
	});

	return formElement;
}
