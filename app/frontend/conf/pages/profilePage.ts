// /pages/profilePage.ts
import { getUserDataFromStorage, updateUserProfile, ApiResult } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
import { User, UpdateUserPayload } from '../shared/types.js';
import { ProfileForm } from '../components/profileForm.js'; // Importer le composant

export function ProfilePage(): HTMLElement {
	const user: User | null = getUserDataFromStorage();

	const pageContainer = document.createElement('div'); // Conteneur principal de la page
	pageContainer.className = 'min-h-screen bg-gray-100 p-4 md:p-8';

	if (!user) {
		console.warn('Access unauthorized: User not authenticated.');
		navigateTo('/login'); // Rediriger directement pour les cas non-auth

		// Ce code sera rarement atteint si navigateTo fonctionne de manière synchrone ou très rapidement
		// Il sert de fallback au cas où la redirection prendrait un instant.
		const deniedContainer = document.createElement('div');
		deniedContainer.className = 'flex items-center justify-center h-full'; // Pour centrer dans pageContainer
		deniedContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-8 text-center">
                <h1 class="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
                <p class="text-gray-700 mb-4">Vous devez être connecté pour accéder à votre profil.</p>
                <p class="text-gray-700">Redirection vers la page de connexion...</p>
                <!-- <a href="/login" data-link class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Se connecter
                </a> -->
            </div>
        `;
		pageContainer.appendChild(deniedContainer);
		return pageContainer;
	}

	const contentWrapper = document.createElement('div');
	contentWrapper.className = 'max-w-xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8';

	const title = document.createElement('h1');
	title.className = 'text-3xl font-bold text-gray-800 mb-6 border-b pb-4';
	title.textContent = 'Mon Profil';
	contentWrapper.appendChild(title);

	// Fonction de rappel pour la mise à jour du profil
	const handleProfileUpdate = async (payload: UpdateUserPayload): Promise<ApiResult> => {
		const result = await updateUserProfile(payload);
		// La logique de mise à jour du localStorage/état global de l'utilisateur
		// devrait se trouver dans `updateUserProfile` ou être gérée ici après un succès.
		// Par exemple, si `updateUserProfile` met à jour localStorage, c'est bon.
		// Sinon, il faudrait le faire ici si nécessaire.
		if (result.success) {
			console.log('Profile updated in service, local storage should be updated too.');
		}
		return result;
	};

	// Créer et ajouter le composant formulaire
	const profileFormComponent = ProfileForm({
		user: user, // Passer l'utilisateur actuel au composant
		onProfileUpdate: handleProfileUpdate,
	});
	contentWrapper.appendChild(profileFormComponent);

	// Lien de retour
	const backLink = document.createElement('a');
	backLink.href = '/dashboard';
	backLink.setAttribute('data-link', ''); // Pour le routeur
	backLink.className = 'block text-center text-gray-600 hover:text-gray-800 text-sm mt-6'; // Style ajusté
	backLink.textContent = 'Retour au Tableau de Bord';
	
	// Ajouter le lien après le formulaire dans le contentWrapper
    // On pourrait aussi le mettre DANS le formulaire si sémantiquement plus logique,
    // mais ici, on le garde séparé pour montrer la structure de la page.
    const formElement = contentWrapper.querySelector('#profile-form-component');
    if (formElement && formElement.parentNode) {
         // Insérer le lien après la dernière div du formulaire (celle avec le bouton)
        const lastDivInForm = formElement.children[formElement.children.length -1];
        if (lastDivInForm && lastDivInForm.parentNode) {
            (lastDivInForm.parentNode as HTMLElement).insertBefore(backLink, lastDivInForm.nextSibling);
        } else {
            contentWrapper.appendChild(backLink); // Fallback
        }
    } else {
        contentWrapper.appendChild(backLink); // Fallback
    }


	pageContainer.appendChild(contentWrapper);
	return pageContainer;
}