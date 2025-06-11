// profilePage.ts
import { navigateTo } from '../services/router.js';
import { getUserDataFromStorage, fetchUserDetails } from '../services/authService.js';
import { fetchCsrfToken } from '../services/csrf.js';
import { User } from '../shared/schemas/usersSchemas.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { showToast } from '../components/toast.js';
import { MatchHistoryComponent } from '../components/matchHistoryComponent.js';

export async function ProfilePage(params: { userId?: string }): Promise<HTMLElement> {
	const loggedInUser: User | null = getUserDataFromStorage();

	if (!loggedInUser) {
		navigateTo('/login');
		const redirectMsg = document.createElement('div');
		redirectMsg.className = 'min-h-screen flex items-center justify-center text-xl';
		redirectMsg.textContent = 'Redirection vers la page de connexion...';
		return redirectMsg;
	}

	const userIdToViewStr = params.userId;
	const userIdToView = userIdToViewStr ? parseInt(userIdToViewStr, 10) : loggedInUser.id;

	if (isNaN(userIdToView)) {
		const errorMsg = document.createElement('div');
		errorMsg.className = 'min-h-screen flex items-center justify-center text-xl text-red-500';
		errorMsg.textContent = 'ID utilisateur invalide.';
		return errorMsg;
	}

	try {
		await fetchCsrfToken();
	} catch (error) {
		console.error("Échec de la récupération du jeton CSRF:", error);
		showToast("Erreur d'initialisation de la sécurité. Veuillez rafraîchir.", 'error');
		const errorMsg = document.createElement('div');
		errorMsg.className = 'min-h-screen flex items-center justify-center text-xl text-red-500';
		errorMsg.textContent = 'Erreur de sécurité. Veuillez rafraîchir la page.';
		return errorMsg;
	}

	const pageContainer = document.createElement('div');
	pageContainer.className = 'min-h-screen bg-gray-200 p-4 sm:p-8 flex flex-col items-center';

	const profileWrapper = document.createElement('div');
	profileWrapper.className = 'bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden';

	const headerElement = HeaderComponent({ currentUser: loggedInUser });
	profileWrapper.appendChild(headerElement);

	const mainSection = document.createElement('div');
	mainSection.className = 'flex flex-1 min-h-[calc(100vh-150px)]';
	profileWrapper.appendChild(mainSection);
	pageContainer.appendChild(profileWrapper);

	const contentArea = document.createElement('div');
	contentArea.className = 'flex flex-1';
	mainSection.appendChild(contentArea);

	const loadingProfileMsg = document.createElement('p');
	loadingProfileMsg.className = 'text-center text-gray-500 py-20 flex-1 text-lg';
	loadingProfileMsg.textContent = 'Chargement du profil...';
	contentArea.appendChild(loadingProfileMsg);

	try {
		const profiledUser = await fetchUserDetails(userIdToView);

		if (!profiledUser) {
			loadingProfileMsg.textContent = `Profil utilisateur avec ID ${userIdToView} non trouvé.`;
			loadingProfileMsg.classList.remove('text-gray-500');
			loadingProfileMsg.classList.add('text-red-500');
			return pageContainer;
		}

		loadingProfileMsg.remove();

		// --- Sidebar (infos de l'utilisateur `profiledUser`) ---
		const sidebar = document.createElement('aside');
		sidebar.className = 'w-1/4 p-6 bg-gray-50 border-r border-gray-200 space-y-4 overflow-y-auto flex flex-col';

		function createSidebarItem(label: string, value: string | number | Date | undefined | null, isSensitive: boolean = false): HTMLElement | null {
			if (isSensitive && loggedInUser!.id !== profiledUser.id) {
				return null;
			}

			const item = document.createElement('div');
			item.className = 'p-3 bg-white border border-gray-200 rounded-lg shadow-sm';
			const labelEl = document.createElement('span');
			labelEl.className = 'text-xs text-gray-500 block mb-0.5 uppercase tracking-wider';
			labelEl.textContent = label;
			const valueEl = document.createElement('p');
			valueEl.className = 'text-sm text-gray-800 font-medium truncate';
			if (value instanceof Date) {
				valueEl.textContent = value.toLocaleDateString();
			} else {
				valueEl.textContent = value?.toString() || 'N/A';
			}
			item.appendChild(labelEl);
			item.appendChild(valueEl);
			return item;
		}

		// Affichage de l'avatar dans la sidebar
		const avatarContainer = document.createElement('div');
		avatarContainer.className = 'flex flex-col items-center mb-4';
		const avatarImg = document.createElement('img');
		avatarImg.src = profiledUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profiledUser.display_name)}&background=random&color=fff&size=128`;
		avatarImg.alt = `Avatar de ${profiledUser.display_name}`;
		avatarImg.className = 'w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-200 shadow-md mb-2';
		avatarContainer.appendChild(avatarImg);

		const displayNameEl = document.createElement('h2');
		displayNameEl.className = 'text-xl font-semibold text-gray-800 text-center';
		displayNameEl.textContent = profiledUser.display_name;
		avatarContainer.appendChild(displayNameEl);

		sidebar.appendChild(avatarContainer);

		const infoItems = [
			createSidebarItem('Email', profiledUser.email, true), // isSensitive = true
			createSidebarItem('Date de création', new Date(profiledUser.created_at)),
			createSidebarItem('Victoires', profiledUser.wins ?? 0),
			createSidebarItem('Défaites', profiledUser.losses ?? 0),
			createSidebarItem('Statut', profiledUser.status),
		];
		infoItems.forEach(item => item && sidebar.appendChild(item));

		// --- Contenu principal (Match History uniquement) ---
		const contentWrapper = document.createElement('main');
		contentWrapper.className = 'w-3/4 p-6 flex flex-col overflow-y-auto';

		const matchHistoryElement = await MatchHistoryComponent({ userId: profiledUser.id });
		contentWrapper.appendChild(matchHistoryElement);

		contentArea.appendChild(sidebar);
		contentArea.appendChild(contentWrapper);

	} catch (error) {
		console.error("Erreur lors de la construction de la page de profil:", error);
		loadingProfileMsg.textContent = `Erreur lors du chargement du profil : ${(error as Error).message}. Veuillez réessayer.`;
		loadingProfileMsg.classList.remove('text-gray-500');
		loadingProfileMsg.classList.add('text-red-500');
	}

	return pageContainer;
}
