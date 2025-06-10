// profilePage.ts
import { navigateTo } from '../services/router.js';
import { getUserDataFromStorage, fetchUserDetails, fetchMatchHistoryForUser } from '../services/authService.js';
import { fetchCsrfToken } from '../services/csrf.js';
import { User } from '../shared/schemas/usersSchemas.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { showToast } from '../components/toast.js';

// --- Composant MatchHistory ---
interface MatchHistoryComponentProps {
	userId: number; // ID de l'utilisateur dont on affiche le profil
}

async function MatchHistoryComponent(props: MatchHistoryComponentProps): Promise<HTMLElement> {
	const { userId: profiledUserId } = props;

	const el = document.createElement('div');
	el.className = 'p-4';
	el.innerHTML = `<h3 class="text-xl font-semibold mb-4 text-gray-800">Historique des Matchs</h3>`;

	const loadingMessage = document.createElement('p');
	loadingMessage.className = 'text-gray-500 italic';
	loadingMessage.textContent = 'Chargement de l\'historique des matchs...';
	el.appendChild(loadingMessage);

	try {
		const matches = await fetchMatchHistoryForUser(profiledUserId);
		loadingMessage.remove();

		if (!matches || matches.length === 0) {
			el.innerHTML += '<p class="text-gray-500">Aucun match trouvé pour cet utilisateur.</p>';
			return el;
		}
		const opponentsDetailsCache: { [key: number]: { display_name: string } } = {};

		const list = document.createElement('ul');
		list.className = 'space-y-3';

		for (const match of matches) {
			let opponentId: number;
			let profiledUserScore: number;
			let opponentScore: number;
			let opponentDisplayName = 'Adversaire Inconnu';

			if (match.player1_id === profiledUserId) {
				opponentId = match.player2_id;
				profiledUserScore = match.player1_score;
				opponentScore = match.player2_score;
			} else if (match.player2_id === profiledUserId) {
				opponentId = match.player1_id;
				profiledUserScore = match.player2_score;
				opponentScore = match.player1_score;
			} else {
				console.warn("Match ne semble pas impliquer l'utilisateur profilé:", match);
				continue;
			}

			if (opponentsDetailsCache[opponentId]) {
				opponentDisplayName = opponentsDetailsCache[opponentId].display_name;
			} else {
				const opponentUser = await fetchUserDetails(opponentId); // ATTENTION: Peut être coûteux
				if (opponentUser) {
					opponentsDetailsCache[opponentId] = { display_name: opponentUser.display_name };
					opponentDisplayName = opponentUser.display_name;
				} else {
					opponentDisplayName = `Joueur ${opponentId}`;
				}
			}


			const resultText = match.winner_id === profiledUserId ? 'Victoire' : (match.winner_id ? 'Défaite' : 'Égalité/Annulé');
			const resultColor = match.winner_id === profiledUserId ? 'text-green-600' : (match.winner_id ? 'text-red-600' : 'text-gray-600');

			const item = document.createElement('li');
			item.className = 'p-3 bg-gray-100 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow';
			item.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="font-medium text-gray-700">Contre : ${opponentDisplayName}</span>
                    <span class="font-semibold ${resultColor}">${resultText}</span>
                </div>
                <div class="text-sm text-gray-600">
                    Score : ${profiledUserScore} - ${opponentScore}
                    <span class="mx-1">|</span>
                    Type : ${match.win_type}
                    <span class="mx-1">|</span>
                    Date : ${new Date(match.created_at).toLocaleDateString()}
                </div>
            `; // TODO : changer win_type
			list.appendChild(item);
		}
		el.appendChild(list);

	} catch (error) {
		console.error("Erreur lors du rendu de l'historique des matchs:", error);
		loadingMessage.textContent = `Erreur lors du chargement de l'historique des matchs: ${(error as Error).message}`;
		loadingMessage.classList.remove('text-gray-500', 'italic');
		loadingMessage.classList.add('text-red-500');
	}
	return el;
}


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
