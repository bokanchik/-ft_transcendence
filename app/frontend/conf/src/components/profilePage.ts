// src/components/profilePage.ts ou un chemin similaire

import { getUserDataFromStorage, updateUserProfile, UpdateProfilePayload, UpdateProfileResult } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
//import { navigateTo } from '../main.js';

export function ProfilePage(): HTMLElement {
	const user: UserData | null = getUserDataFromStorage();

	if (!user) {
		console.warn('Access unauthorized: User not authenticated.');
		navigateTo('/login');
		const deniedContainer = document.createElement('div');
		deniedContainer.className = 'min-h-screen bg-gray-100 p-4 md:p-8 flex items-center justify-center';
		deniedContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-8 text-center">
                <h1 class="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
                <p class="text-gray-700 mb-4">Vous devez être connecté pour accéder à votre profil.</p>
                <a href="/login" data-link class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Se connecter
                </a>
            </div>
        `;
		return deniedContainer;
	}

	const container = document.createElement('div');
	container.className = 'min-h-screen bg-gray-100 p-4 md:p-8';

	const formContainer = document.createElement('div');
	formContainer.className = 'max-w-xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8';

	// --- Formulaire HTML ---
	formContainer.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Mon Profil</h1>
        <form id="profile-form">
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
                 <a href="/dashboard" data-link class="text-gray-600 hover:text-gray-800 text-sm">
                    Retour au Tableau de Bord
                 </a>
            </div>
        </form>
    `;

	container.appendChild(formContainer);

	const form = formContainer.querySelector('#profile-form') as HTMLFormElement;
	const emailInput = formContainer.querySelector('#email') as HTMLInputElement;
	const displayNameInput = formContainer.querySelector('#display_name') as HTMLInputElement;
	const avatarUrlInput = formContainer.querySelector('#avatar_url') as HTMLInputElement; // Ajouté
	const messageDiv = formContainer.querySelector('#profile-message') as HTMLDivElement;
	const saveButton = formContainer.querySelector('#save-profile-button') as HTMLButtonElement;

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		messageDiv.textContent = 'Sauvegarde en cours...';
		messageDiv.className = 'mb-4 text-center text-sm text-gray-600 min-h-[1.25rem]';
		saveButton.disabled = true;
		saveButton.textContent = 'Sauvegarde...';

		const updatedEmail = emailInput.value.trim();
		const updatedDisplayName = displayNameInput.value.trim();
		const updatedAvatarUrl = avatarUrlInput.value.trim();

		// Validation simple (ajoutez plus si nécessaire)
		if (!updatedEmail || !updatedDisplayName) {
			messageDiv.textContent = 'Veuillez remplir les champs Email et Nom affiché.';
			messageDiv.className = 'mb-4 text-center text-sm text-red-600 font-semibold min-h-[1.25rem]';
			saveButton.disabled = false;
			saveButton.textContent = 'Enregistrer les modifications';
			return;
		}

		// Préparer le payload pour l'API
		// N'inclure que les champs qui peuvent être modifiés
		const payload: UpdateProfilePayload = {
			email: updatedEmail,
			display_name: updatedDisplayName,
			// Inclure avatar_url seulement s'il n'est pas vide, sinon potentiellement null/undefined
			// selon ce que votre API attend pour le supprimer/ne pas le changer.
			// Ici, on l'envoie tel quel (vide ou rempli). Adaptez si nécessaire.
			avatar_url: updatedAvatarUrl || null, // Envoyer null si vide, ou gardez vide ''
		};

		// Appel à la nouvelle fonction de service
		const result: UpdateProfileResult = await updateUserProfile(payload);

		saveButton.disabled = false;
		saveButton.textContent = 'Enregistrer les modifications';

		if (result.success) {
			messageDiv.textContent = 'Profil mis à jour avec succès !';
			messageDiv.className = 'mb-4 text-center text-sm text-green-600 font-semibold min-h-[1.25rem]';

			// Mettre à jour les champs avec les données retournées (si elles sont différentes, ex: trim par le backend)
			// ou après avoir mis à jour localStorage
			emailInput.value = result.data.email;
			displayNameInput.value = result.data.display_name;
			avatarUrlInput.value = result.data.avatar_url || ''; // Mettre à jour l'avatar aussi

			// Optionnel: Message de succès qui disparaît après un délai
			setTimeout(() => {
				if (messageDiv.textContent === 'Profil mis à jour avec succès !') {
					messageDiv.textContent = '';
				}
			}, 3000);

		} else {
			// Afficher l'erreur retournée par le service
			messageDiv.textContent = `Erreur: ${result.error}`;
			messageDiv.className = 'mb-4 text-center text-sm text-red-600 font-semibold min-h-[1.25rem]';
		}
	});

	return container;
}
