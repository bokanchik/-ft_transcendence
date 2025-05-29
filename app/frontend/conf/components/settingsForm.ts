// /components/profileForm.ts
//@ts-ignore
import { User, UpdateUserPayload, ApiResult } from '../shared/types.js'; // S'assurer que ApiResult est importé

interface ProfileFormProps {
	user: User;
	onProfileUpdate: (payload: UpdateUserPayload) => Promise<ApiResult>;
}

export function SettingsForm(props: ProfileFormProps): HTMLElement {
	const { user, onProfileUpdate } = props;

	const formElement = document.createElement('form');
	formElement.id = 'profile-form-component'; // ID unique
	formElement.innerHTML = `
        <!-- Message d'état -->
        <div id="profile-message" class="mb-4 text-center text-sm min-h-[1.25rem]"></div>

        <!-- Champ Username (souvent non modifiable) -->
        <div class="mb-4">
            <label for="username" class="block text-gray-700 text-sm font-bold mb-2">Nom d'utilisateur</label>
            <input type="text" id="username" name="username" readonly
                   value="${user.username}"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 cursor-not-allowed leading-tight focus:outline-none focus:shadow-outline">
            <p class="text-xs text-gray-500 mt-1">Le nom d'utilisateur ne peut pas être modifié.</p>
        </div>

        <!-- Champ Email -->
        <div class="mb-4">
            <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Adresse Email</label>
            <input type="email" id="email" name="email" required
                   value="${user.email || ''}"
                   placeholder="Votre adresse email"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        </div>

        <!-- Champ Display Name -->
        <div class="mb-4">
            <label for="display_name" class="block text-gray-700 text-sm font-bold mb-2">Nom Affiché</label>
            <input type="text" id="display_name" name="display_name" required
                   value="${user.display_name || ''}"
                   placeholder="Comment voulez-vous être appelé ?"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        </div>

        <!-- Champ Avatar URL (Optionnel) -->
        <div class="mb-6">
            <label for="avatar_url" class="block text-gray-700 text-sm font-bold mb-2">URL de l'Avatar (Optionnel)</label>
            <input type="url" id="avatar_url" name="avatar_url"
                   value="${user.avatar_url || ''}"
                   placeholder="https://example.com/avatar.png"
                   class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
             <p class="text-xs text-gray-500 mt-1">Laissez vide si vous n'avez pas d'avatar.</p>
        </div>

        <div class="flex items-center justify-between mt-6 border-t pt-6">
            <button type="submit" id="save-profile-button"
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
                Enregistrer les modifications
            </button>
            <!-- Le lien de retour est mieux géré par la page parente -->
        </div>
    `;

	const emailInput = formElement.querySelector('#email') as HTMLInputElement;
	const displayNameInput = formElement.querySelector('#display_name') as HTMLInputElement;
	const avatarUrlInput = formElement.querySelector('#avatar_url') as HTMLInputElement;
	const messageDiv = formElement.querySelector('#profile-message') as HTMLDivElement;
	const saveButton = formElement.querySelector('#save-profile-button') as HTMLButtonElement;

	formElement.addEventListener('submit', async (event) => {
		event.preventDefault();
		messageDiv.textContent = 'Sauvegarde en cours...';
		messageDiv.className = 'mb-4 text-center text-sm text-gray-600 min-h-[1.25rem]';
		saveButton.disabled = true;
		saveButton.textContent = 'Sauvegarde...';

		const updatedEmail = emailInput.value.trim();
		const updatedDisplayName = displayNameInput.value.trim();
		const updatedAvatarUrl = avatarUrlInput.value.trim();

		if (!updatedEmail || !updatedDisplayName) {
			messageDiv.textContent = 'Veuillez remplir les champs Email et Nom affiché.';
			messageDiv.className = 'mb-4 text-center text-sm text-red-600 font-semibold min-h-[1.25rem]';
			saveButton.disabled = false;
			saveButton.textContent = 'Enregistrer les modifications';
			return;
		}

		const payload: UpdateUserPayload = {
			email: updatedEmail,
			display_name: updatedDisplayName,
			avatar_url: updatedAvatarUrl,
		};

		const result = await onProfileUpdate(payload);

		saveButton.disabled = false;
		saveButton.textContent = 'Enregistrer les modifications';

		if (result.success) {
			messageDiv.textContent = 'Profil mis à jour avec succès !';
			messageDiv.className = 'mb-4 text-center text-sm text-green-600 font-semibold min-h-[1.25rem]';

			// Mettre à jour les valeurs des champs avec les données retournées par l'API
			// Cela est important si le backend effectue une sanitisation ou une transformation
			emailInput.value = result.data.user.email;
			displayNameInput.value = result.data.user.display_name;
			avatarUrlInput.value = result.data.user.avatar_url || '';

			setTimeout(() => {
				if (messageDiv.textContent === 'Profil mis à jour avec succès !') {
					messageDiv.textContent = ''; // Effacer le message de succès
				}
			}, 3000);
		} else {
			messageDiv.textContent = `Erreur: ${result.error || 'Une erreur inconnue est survenue.'}`;
			messageDiv.className = 'mb-4 text-center text-sm text-red-600 font-semibold min-h-[1.25rem]';
		}
	});

	return formElement;
}