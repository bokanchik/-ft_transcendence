// dashboardPage.ts
import { navigateTo } from '../main.js';
import {
	getUserDataFromStorage,
	logout,
	UserData,
} from '../services/authService.js';
import {
	getReceivedFriendRequests,
	getSentFriendRequests,
	acceptFriendRequest,
	declineFriendRequest,
	cancelFriendRequest,
	PendingFriendRequest,
	getFriendsList,
	Friend,
	fetchCsrfToken,
} from '../services/friendService.js';

export function DashboardPage(): HTMLElement {
	const userData: UserData | null = getUserDataFromStorage();

	if (!userData) {
		console.warn('Access unauthorized: User not authenticated.');
		navigateTo('/login');
		const redirectMsg = document.createElement('div');
		redirectMsg.className = 'p-8 text-center';
		redirectMsg.textContent = 'Loading or redirecting...';
		return redirectMsg;
	}

	const container = document.createElement('div');
	container.className = 'min-h-screen bg-gray-100 p-4 md:p-8';

	const contentWrapper = document.createElement('div');
	contentWrapper.className = 'max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8';

	// --- Section pour la liste d'amis ---
	const friendsListSection = document.createElement('div');
	friendsListSection.id = 'friends-list-section';
	friendsListSection.className = 'mt-8 p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm'; // Styles différents
	friendsListSection.innerHTML = `
        <h2 class="text-2xl font-semibold text-green-800 mb-4">Mes Amis (<span id="friends-count">0</span>)</h2>
        <ul id="friends-list" class="space-y-3">
            <li class="text-gray-500 italic">Chargement de la liste d'amis...</li>
        </ul>
    `;

	const friendRequestsSection = document.createElement('div');
	friendRequestsSection.id = 'friend-requests-section';
	friendRequestsSection.className = 'mt-8 p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm';
	friendRequestsSection.innerHTML = `
        <h2 class="text-2xl font-semibold text-indigo-800 mb-4">Demandes d'amis</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-xl font-medium text-indigo-700 mb-3">Reçues (<span id="received-requests-count">0</span>)</h3>
                <ul id="received-requests-list" class="space-y-3">
                    <li class="text-gray-500 italic">Aucune demande reçue.</li>
                </ul>
            </div>
            <div>
                <h3 class="text-xl font-medium text-indigo-700 mb-3">Envoyées (<span id="sent-requests-count">0</span>)</h3>
                <ul id="sent-requests-list" class="space-y-3">
                     <li class="text-gray-500 italic">Aucune demande envoyée.</li>
                </ul>
            </div>
        </div>
    `;

	contentWrapper.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 border-gray-200">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
                <p class="text-xl text-gray-600 mt-1">Bienvenue, <strong class="text-blue-600">${userData.display_name || userData.username}</strong> !</p>
            </div>
            <button id="logout-button"
                    class="mt-4 sm:mt-0 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out">
                Déconnexion
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="main-widgets-grid">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <h2 class="text-xl font-semibold text-blue-800 mb-3">Mon Profil</h2>
                <p class="text-gray-700 text-sm mb-1"><span class="font-medium">Username:</span> ${userData.username}</p>
                <p class="text-gray-700 text-sm mb-1"><span class="font-medium">Email:</span> ${userData.email || 'Non fourni'}</p>
                <p class="text-gray-700 text-sm"><span class="font-medium">ID:</span> ${userData.id}</p>
                <a href="/profile" data-link class="text-blue-600 hover:text-blue-800 text-sm mt-3 inline-block">Modifier le profil</a>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                <h2 class="text-xl font-semibold text-green-800 mb-3">Statistiques</h2>
                <p class="text-gray-700">Vous avez X notifications.</p>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
                <h2 class="text-xl font-semibold text-yellow-800 mb-3">Actions Rapides</h2>
                <button class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-1 px-3 rounded mr-2 mb-2">Nouvel Article</button>
            </div>
        </div>
        <div class="mt-8 text-center border-t pt-4 border-gray-200">
             <a href="/" data-link class="text-gray-600 hover:text-gray-800 text-sm">Retour à l'accueil</a>
        </div>
    `;

	// Insérer les sections Amis et Demandes d'amis
	const mainWidgetsGrid = contentWrapper.querySelector('#main-widgets-grid');
	if (mainWidgetsGrid && mainWidgetsGrid.parentNode) {
		// Insérer la liste d'amis APRÈS la grille des widgets principaux
		mainWidgetsGrid.parentNode.insertBefore(friendsListSection, mainWidgetsGrid.nextSibling);
		// Insérer les demandes d'amis APRÈS la liste d'amis
		mainWidgetsGrid.parentNode.insertBefore(friendRequestsSection, friendsListSection.nextSibling);
	} else {
		contentWrapper.appendChild(friendsListSection); // Fallback
		contentWrapper.appendChild(friendRequestsSection); // Fallback
	}

	container.appendChild(contentWrapper);

	const logoutButton = contentWrapper.querySelector('#logout-button') as HTMLButtonElement;
	if (logoutButton) {
		logoutButton.addEventListener('click', async () => {
			console.log('Déconnexion demandée...');
			try {
				await logout();
				alert('Vous avez été déconnecté.');
			} catch (error) {
				console.error('Erreur pendant la déconnexion:', error);
				alert('Une erreur est survenue lors de la déconnexion.');
			} finally {
				navigateTo('/login');
			}
		});
	}

	// --- Logique pour les listes d'amis ET demandes d'amis ---
	const receivedList = friendRequestsSection.querySelector('#received-requests-list') as HTMLUListElement;
	const sentList = friendRequestsSection.querySelector('#sent-requests-list') as HTMLUListElement;
	const receivedCountSpan = friendRequestsSection.querySelector('#received-requests-count') as HTMLSpanElement;
	const sentCountSpan = friendRequestsSection.querySelector('#sent-requests-count') as HTMLSpanElement;

	const friendsListEl = friendsListSection.querySelector('#friends-list') as HTMLUListElement;
	const friendsCountSpan = friendsListSection.querySelector('#friends-count') as HTMLSpanElement;


	async function loadAllFriendData() { // Renommée pour plus de clarté
		try {
			const [received, sent, friends] = await Promise.all([
				getReceivedFriendRequests(),
				getSentFriendRequests(),
				getFriendsList() // <-- Charger la liste d'amis
			]);

			renderReceivedRequests(received);
			renderSentRequests(sent);
			renderFriendsList(friends); // <-- Afficher la liste d'amis

		} catch (error) {
			console.error("Erreur lors du chargement des données d'amis:", error);
			receivedList.innerHTML = `<li class="text-red-500 italic">Erreur de chargement des demandes reçues.</li>`;
			sentList.innerHTML = `<li class="text-red-500 italic">Erreur de chargement des demandes envoyées.</li>`;
			friendsListEl.innerHTML = `<li class="text-red-500 italic">Erreur de chargement de la liste d'amis.</li>`;
		}
	}

	function renderReceivedRequests(requests: PendingFriendRequest[]) {
		receivedCountSpan.textContent = requests.length.toString();
		if (!requests.length) {
			receivedList.innerHTML = `<li class="text-gray-500 italic">Aucune demande reçue.</li>`;
			return;
		}
		receivedList.innerHTML = requests.map(req => `
            <li data-friendship-id="${req.friendship_id}" class="p-3 bg-white border border-gray-200 rounded-md shadow-sm flex justify-between items-center">
                <div>
                    <strong class="text-indigo-600">${req.requester?.display_name || req.requester?.username}</strong>
                    <span class="text-xs text-gray-500 block">(${req.requester?.username})</span>
                </div>
                <div>
                    <button data-action="accept" class="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded mr-1">Accepter</button>
                    <button data-action="decline" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded">Refuser</button>
                </div>
            </li>
        `).join('');
	}

	function renderSentRequests(requests: PendingFriendRequest[]) {
		sentCountSpan.textContent = requests.length.toString();
		if (!requests.length) {
			sentList.innerHTML = `<li class="text-gray-500 italic">Aucune demande envoyée.</li>`;
			return;
		}
		sentList.innerHTML = requests.map(req => `
            <li data-friendship-id="${req.friendship_id}" class="p-3 bg-white border border-gray-200 rounded-md shadow-sm flex justify-between items-center">
                 <div>
                    <strong class="text-indigo-600">${req.receiver?.display_name || req.receiver?.username}</strong>
                     <span class="text-xs text-gray-500 block">(${req.receiver?.username})</span>
                </div>
                <button data-action="cancel" class="text-xs bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-1 px-2 rounded">Annuler</button>
            </li>
        `).join('');
	}

	function renderFriendsList(friends: Friend[]) {
		friendsCountSpan.textContent = friends.length.toString();
		if (!friends.length) {
			friendsListEl.innerHTML = `<li class="text-gray-500 italic">Vous n'avez pas encore d'amis.</li>`;
			return;
		}
		friendsListEl.innerHTML = friends.map(friend => {
			const actualDisplayName = friend.friend_display_name || friend.friend_username;
			const actualUsername = friend.friend_username;
			const actualAvatarUrl = friend.friend_avatar_url;
			const actualFriendId = friend.friend_id;
			const actualStatus = friend.friend_online_status;

			// Fallback pour l'avatar si actualDisplayName est vide ou undefined après les ||
			const avatarFallbackChar = actualDisplayName ? actualDisplayName.charAt(0).toUpperCase() : 'U'; // 'U' pour User
			const avatar = actualAvatarUrl || `https://via.placeholder.com/40/007bff/ffffff?text=${avatarFallbackChar}`;

			let statusIndicator = '';
			if (actualStatus) {
				const statusColor = actualStatus === 'online' ? 'bg-green-500' : (actualStatus === 'in-game' ? 'bg-yellow-500' : 'bg-gray-400');
				statusIndicator = `<span class="inline-block w-3 h-3 ${statusColor} rounded-full mr-2" title="${actualStatus}"></span>`;
			}

			return `
            <li data-friend-id="${actualFriendId}" class="p-3 bg-white border border-gray-200 rounded-md shadow-sm flex justify-between items-center">
                <div class="flex items-center">
                    <img src="${avatar}" alt="${actualDisplayName}" class="w-10 h-10 rounded-full mr-3 object-cover">
                    <div>
                        ${statusIndicator}
                        <strong class="text-green-700">${actualDisplayName}</strong>
                        <span class="text-xs text-gray-500 block">(${actualUsername})</span>
                    </div>
                </div>
                <div>
                    <button data-action="view-profile" data-user-id="${actualFriendId}" class="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-2 rounded mr-1">Profil</button>
                    <button data-action="remove-friend" data-user-id="${actualFriendId}" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded">Supprimer</button>
                </div>
            </li>
        `;
		}).join('');
	}

	friendRequestsSection.addEventListener('click', async (event) => {
		const target = event.target as HTMLElement;
		if (target.tagName !== 'BUTTON' || !target.dataset.action) return;

		const listItem = target.closest('li[data-friendship-id]') as HTMLLIElement;
		if (!listItem) return;

		const friendshipId = parseInt(listItem.dataset.friendshipId || '', 10);
		if (isNaN(friendshipId)) return;

		const action = target.dataset.action;
		target.disabled = true;
		target.textContent = '...';

		try {
			let message = '';
			if (action === 'accept') {
				message = (await acceptFriendRequest(friendshipId)).message;
			} else if (action === 'decline') {
				message = (await declineFriendRequest(friendshipId)).message;
			} else if (action === 'cancel') {
				message = (await cancelFriendRequest(friendshipId)).message;
			}
			console.log(message);
			alert(message);
			loadAllFriendData(); // Recharger TOUTES les listes (amis et demandes)
		} catch (error: any) {
			console.error(`Erreur lors de l'action '${action}':`, error);
			alert(`Erreur: ${error.message || 'Une erreur est survenue.'}`);
			target.disabled = false;
			target.textContent = action.charAt(0).toUpperCase() + action.slice(1);
		}
	});

	// --- Ajout de gestionnaires d'événements pour la liste d'amis ---
	friendsListEl.addEventListener('click', async (event) => {
		const target = event.target as HTMLElement;
		if (target.tagName !== 'BUTTON' || !target.dataset.action) return;

		const listItem = target.closest('li[data-friend-id]') as HTMLLIElement;
		if (!listItem) return;

		const friendId = parseInt(listItem.dataset.friendId || '', 10);
		if (isNaN(friendId)) return;

		const action = target.dataset.action;

		if (action === 'view-profile') {
			// Supposons que vous ayez une route /profile/:id ou /users/:id
			// Adapter le chemin si nécessaire
			navigateTo(`/profile/${friendId}`); // Ou /users/${friendId}
		} else if (action === 'remove-friend') {
			if (confirm(`Êtes-vous sûr de vouloir supprimer cet ami ?`)) {
				target.disabled = true;
				target.textContent = '...';
				try {
					// Vous aurez besoin d'une fonction removeFriend(friendId) dans friendService.js
					// const result = await removeFriend(friendId);
					// alert(result.message);
					alert(`Ami ${friendId} supprimé (simulation). Implémentez removeFriend dans friendService.`);
					loadAllFriendData(); // Recharger les listes
				} catch (error: any) {
					console.error('Erreur lors de la suppression de l\'ami:', error);
					alert(`Erreur: ${error.message || 'Impossible de supprimer l\'ami.'}`);
					target.disabled = false;
					target.textContent = 'Supprimer';
				}
			}
		}
	});

	(async () => {
		await fetchCsrfToken();
		loadAllFriendData();
	})();

	return container;
}
