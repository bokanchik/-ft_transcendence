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
import { User, UpdateUserPayload } from '../shared/schemas/usersSchemas.js';
import { ApiResult, ApiUpdateUserSuccessData } from '../utils/types.js';
import { t } from '../services/i18nService.js';

interface ProfileFormProps {
	user: User;
	onProfileUpdate: (payload: UpdateUserPayload) => Promise<ApiResult<ApiUpdateUserSuccessData>>;
	// NOTE: Pour une implémentation 2FA complète, vous aurez probablement besoin de fonctions supplémentaires
	// pour générer le QR code et vérifier le token.
	// onGenerate2FA: () => Promise<{ qrCodeDataURL: string }>,
	// onVerify2FA: (token: string) => Promise<ApiResult<any>>
}

export function SettingsForm(props: ProfileFormProps): HTMLElement {
	const { user, onProfileUpdate } = props;

	const formElement = document.createElement('form');
	formElement.id = 'profile-form-component';
	formElement.innerHTML = `
        <div id="profile-message" class="mb-4 text-center text-sm min-h-[1.25rem]"></div>

        <!-- Section Informations du profil -->
        <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">${t('user.settings.profileInfoTitle')}</h3>
        
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
        
        <!-- Section Sécurité / 2FA -->
        <div class="mt-8">
             <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">${t('user.settings.securityTitle')}</h3>
             <div class="flex items-center mb-4">
                <input type="checkbox" id="is_two_fa_enabled" name="is_two_fa_enabled" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                <label for="is_two_fa_enabled" class="ml-2 block text-sm text-gray-900">${t('user.settings.enable2FA')}</label>
             </div>
             <!-- Ce conteneur ne sera visible que si on active la 2FA -->
             <div id="two-fa-setup-container" class="hidden pl-6 border-l-2 border-gray-200">
                <p class="text-sm text-gray-600 mb-4">${t('user.settings.2faSetupInstructions')}</p>
                <!-- Idéalement, ici vous afficheriez un QR Code reçu de l'API -->
                <div id="qr-code-container" class="mb-4 bg-gray-100 p-4 rounded text-center">
                    ${t('user.settings.qrCodePlaceholder')}
                </div>
                <div>
                    <label for="two_fa_token" class="block text-gray-700 text-sm font-bold mb-2">${t('user.settings.verificationCode')}</label>
                    <input type="text" id="two_fa_token" name="two_fa_token"
                           placeholder="123456"
                           maxlength="6"
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

	// --- Récupération des éléments du DOM ---
	const emailInput = formElement.querySelector('#email') as HTMLInputElement;
	const displayNameInput = formElement.querySelector('#display_name') as HTMLInputElement;
	const avatarUrlInput = formElement.querySelector('#avatar_url') as HTMLInputElement;
	const messageDiv = formElement.querySelector('#profile-message') as HTMLDivElement;
	const saveButton = formElement.querySelector('#save-profile-button') as HTMLButtonElement;
	
	// Éléments 2FA
	const twoFaCheckbox = formElement.querySelector('#is_two_fa_enabled') as HTMLInputElement;
	const twoFaSetupContainer = formElement.querySelector('#two-fa-setup-container') as HTMLDivElement;
    // Le champ pour le token/phrase. Notez que sa valeur n'est pas envoyée directement
    // via onProfileUpdate selon votre schéma actuel.
	const twoFaTokenInput = formElement.querySelector('#two_fa_token') as HTMLInputElement;


	// --- Logique 2FA ---
	
	// Initialiser l'état de la checkbox
	twoFaCheckbox.checked = user.is_two_fa_enabled;

	// Gérer l'affichage du champ de configuration 2FA
	twoFaCheckbox.addEventListener('change', () => {
		if (twoFaCheckbox.checked) {
			twoFaSetupContainer.classList.remove('hidden');
			// C'est ici que vous devriez appeler l'API pour générer et afficher le QR Code.
			// Exemple :
			// const { qrCodeDataURL } = await props.onGenerate2FA();
			// const qrCodeImg = document.createElement('img');
			// qrCodeImg.src = qrCodeDataURL;
			// document.getElementById('qr-code-container').innerHTML = '';
			// document.getElementById('qr-code-container').appendChild(qrCodeImg);
		} else {
			twoFaSetupContainer.classList.add('hidden');
		}
	});

	// --- Logique de soumission du formulaire ---
	formElement.addEventListener('submit', async (event) => {
		event.preventDefault();
		messageDiv.textContent = t('user.settings.savingMsg1');
		messageDiv.className = 'mb-4 text-center text-sm text-gray-600 min-h-[1.25rem]';
		saveButton.disabled = true;
		saveButton.textContent = t('user.settings.savingMsg2');

		const updatedEmail = emailInput.value.trim();
		const updatedDisplayName = displayNameInput.value.trim();
		const updatedAvatarUrl = avatarUrlInput.value.trim();
		const isTwoFaEnabled = twoFaCheckbox.checked;
        const twoFaToken = twoFaTokenInput.value.trim();

		// Construction du payload à envoyer
		const payload: UpdateUserPayload = {};

		// Ajoute les champs seulement s'ils ont changé pour ne pas envoyer de données inutiles
		if (updatedEmail && updatedEmail !== user.email) {
			payload.email = updatedEmail;
		}
		if (updatedDisplayName && updatedDisplayName !== user.display_name) {
			payload.display_name = updatedDisplayName;
		}
		if (updatedAvatarUrl !== (user.avatar_url || '')) {
			payload.avatar_url = updatedAvatarUrl;
		}

		// --- Gestion de la logique 2FA à la soumission ---
		if (isTwoFaEnabled !== user.is_two_fa_enabled) {
			// Si on active la 2FA, le token est requis pour la vérification
			if (isTwoFaEnabled && !twoFaToken) {
				messageDiv.textContent = t('user.settings.2faTokenRequired');
				messageDiv.className = 'mb-4 text-center text-sm text-red-600 font-semibold min-h-[1.25rem]';
				saveButton.disabled = false;
				saveButton.textContent = t('user.settings.button');
				return;
			}
			
			// NOTE IMPORTANTE: Le schéma `UpdateUserPayload` n'inclut pas de champ `token`.
			// Le flow correct serait :
			// 1. L'utilisateur coche la case.
			// 2. Appel à une API `/2fa/generate` pour obtenir le QR code (affiché dans `two-fa-setup-container`).
			// 3. L'utilisateur scanne et entre le code.
			// 4. L'utilisateur clique sur "Enregistrer".
			// 5. AVANT d'appeler `onProfileUpdate`, vous devez appeler une autre API `/2fa/verify` avec le token.
			// 6. Si la vérification réussit, alors vous appelez `onProfileUpdate` avec `is_two_fa_enabled: true`.
			//
			// Pour la désactivation, il suffit d'envoyer `is_two_fa_enabled: false`.
			payload.is_two_fa_enabled = isTwoFaEnabled;

			// Si votre backend a été adapté pour accepter un token directement lors de la mise à jour,
			// vous devrez ajouter ce champ à votre schéma `UpdateUserBodySchema`.
			// Par exemple : (payload as any).two_fa_token = twoFaToken;
		}
		
		// Vérifier si des modifications ont été apportées
		if (Object.keys(payload).length === 0) {
			messageDiv.textContent = t('user.settings.noChanges');
			messageDiv.className = 'mb-4 text-center text-sm text-blue-600 min-h-[1.25rem]';
			saveButton.disabled = false;
			saveButton.textContent = t('user.settings.button');
			return;
		}

		// Appel à l'API
		const result = await onProfileUpdate(payload);

		saveButton.disabled = false;
		saveButton.textContent = t('user.settings.button');

		if (result.success) {
			messageDiv.textContent = t('user.settings.success');
			messageDiv.className = 'mb-4 text-center text-sm text-green-600 font-semibold min-h-[1.25rem]';

			// Mettre à jour les champs du formulaire avec les nouvelles données
			emailInput.value = result.data.user.email;
			displayNameInput.value = result.data.user.display_name;
			avatarUrlInput.value = result.data.user.avatar_url || '';
			// Mettre à jour l'état de la 2FA dans l'objet `user` pour la prochaine comparaison
			user.is_two_fa_enabled = result.data.user.is_two_fa_enabled;
			twoFaCheckbox.checked = result.data.user.is_two_fa_enabled;
			if (!user.is_two_fa_enabled) {
				twoFaSetupContainer.classList.add('hidden');
			}

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