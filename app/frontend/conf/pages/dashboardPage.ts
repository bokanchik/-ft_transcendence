// /pages/dashboardPage.ts
import { navigateTo } from '../services/router.js';
import { getUserDataFromStorage, logout } from '../services/authService.js';
import { fetchCsrfToken } from '../services/csrf.js';
import { User as AuthUser, Friend, PendingFriendRequest } from '../shared/types.js'; // Renommé User en AuthUser pour éviter conflit
import {
	getReceivedFriendRequests,
	getSentFriendRequests,
	acceptFriendRequest,
	declineFriendRequest,
	cancelFriendRequest,
	getFriendsList,
	// Importer la fonction pour supprimer un ami depuis friendService (à créer si elle n'existe pas)
	// removeFriend,
} from '../services/friendService.js';

// Importer les nouveaux composants
import { FriendsListComponent } from '../components/friendsList.js';
import { FriendRequestsComponent } from '../components/friendRequests.js';

export async function DashboardPage(): Promise<HTMLElement> { // La page devient async car on charge le token CSRF
	const currentUser: AuthUser | null = getUserDataFromStorage();

	if (!currentUser) {
		console.warn('Access unauthorized: User not authenticated.');
		navigateTo('/login');
		const redirectMsg = document.createElement('div');
		redirectMsg.className = 'p-8 text-center';
		redirectMsg.textContent = 'Loading or redirecting...';
		return redirectMsg;
	}

	// Charger le token CSRF une seule fois au chargement de la page
	try {
		await fetchCsrfToken();
	} catch (error) {
		console.error("Failed to fetch CSRF token:", error);
		// Gérer l'erreur de CSRF (par exemple, afficher un message et ne pas charger les données sensibles)
		const errorMsg = document.createElement('div');
		errorMsg.className = 'p-8 text-center text-red-500';
		errorMsg.textContent = 'Error initializing page. Please try refreshing.';
		return errorMsg;
	}

	const container = document.createElement('div');
	container.className = 'min-h-screen bg-gray-100 p-4 md:p-8';

	const contentWrapper = document.createElement('div');
	contentWrapper.className = 'max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8';

	contentWrapper.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 border-gray-200">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
                <p class="text-xl text-gray-600 mt-1">Bienvenue, <strong class="text-blue-600">${currentUser.display_name || currentUser.username}</strong> !</p>
            </div>
            <button id="logout-button"
                    class="mt-4 sm:mt-0 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out">
                Déconnexion
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="main-widgets-grid">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <h2 class="text-xl font-semibold text-blue-800 mb-3">Mon Profil</h2>
                <p class="text-gray-700 text-sm mb-1"><span class="font-medium">Username:</span> ${currentUser.username}</p>
                <p class="text-gray-700 text-sm mb-1"><span class="font-medium">Email:</span> ${currentUser.email || 'Non fourni'}</p>
                <p class="text-gray-700 text-sm"><span class="font-medium">ID:</span> ${currentUser.id}</p>
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
        <!-- Placeholders pour les composants -->
        <div id="friends-list-placeholder">
            <p class="text-center text-gray-500 mt-8">Chargement de la liste d'amis...</p>
        </div>
        <div id="friend-requests-placeholder">
            <p class="text-center text-gray-500 mt-8">Chargement des demandes d'amis...</p>
        </div>

        <div class="mt-8 text-center border-t pt-4 border-gray-200">
             <a href="/" data-link class="text-gray-600 hover:text-gray-800 text-sm">Retour à l'accueil</a>
        </div>
    `;

	container.appendChild(contentWrapper);

	// Récupérer les placeholders
	const friendsListPlaceholder = contentWrapper.querySelector('#friends-list-placeholder') as HTMLElement;
	const friendRequestsPlaceholder = contentWrapper.querySelector('#friend-requests-placeholder') as HTMLElement;

	// --- Fonctions de rappel pour les composants ---
	const handleAcceptRequest = async (friendshipId: number) => {
		const result = await acceptFriendRequest(friendshipId);
		alert(result.message);
		await loadAndRenderAllFriendData(); // Recharger et réafficher
	};

	const handleDeclineRequest = async (friendshipId: number) => {
		const result = await declineFriendRequest(friendshipId);
		alert(result.message);
		await loadAndRenderAllFriendData();
	};

	const handleCancelRequest = async (friendshipId: number) => {
		const result = await cancelFriendRequest(friendshipId);
		alert(result.message);
		await loadAndRenderAllFriendData();
	};

	const handleRemoveFriend = async (friendId: number) => {
		// Assurez-vous d'avoir une fonction `removeFriend` dans `friendService.ts`
		// Exemple: export async function removeFriend(friendId: number): Promise<{ message: string }> { ... }
		// Pour l'instant, on simule comme dans votre code original pour cette partie
		// await removeFriend(friendId);
		alert(`Ami ${friendId} supprimé (simulation). Implémentez removeFriend dans friendService.`);
		await loadAndRenderAllFriendData();
	};


	// --- Chargement et rendu des données des amis ---
	async function loadAndRenderAllFriendData() {
		// Vider les placeholders pour afficher un état de chargement si nécessaire ou pour le re-rendu
		friendsListPlaceholder.innerHTML = `<p class="text-center text-gray-500 mt-8">Mise à jour de la liste d'amis...</p>`;
		friendRequestsPlaceholder.innerHTML = `<p class="text-center text-gray-500 mt-8">Mise à jour des demandes d'amis...</p>`;

		try {
			const [received, sent, friends] = await Promise.all([
				getReceivedFriendRequests(),
				getSentFriendRequests(),
				getFriendsList()
			]);

			// Rendre le composant Amis
			friendsListPlaceholder.innerHTML = ''; // Vider le placeholder
			friendsListPlaceholder.appendChild(
				FriendsListComponent({
					friends: friends,
					onRemoveFriend: handleRemoveFriend,
				})
			);

			// Rendre le composant Demandes d'amis
			friendRequestsPlaceholder.innerHTML = ''; // Vider le placeholder
			friendRequestsPlaceholder.appendChild(
				FriendRequestsComponent({
					receivedRequests: received,
					sentRequests: sent,
					onAcceptRequest: handleAcceptRequest,
					onDeclineRequest: handleDeclineRequest,
					onCancelRequest: handleCancelRequest,
				})
			);

		} catch (error) {
			console.error("Erreur lors du chargement des données d'amis:", error);
			friendsListPlaceholder.innerHTML = `<p class="text-center text-red-500 mt-8">Erreur de chargement de la liste d'amis.</p>`;
			friendRequestsPlaceholder.innerHTML = `<p class="text-center text-red-500 mt-8">Erreur de chargement des demandes.</p>`;
		}
	}

	// Bouton de déconnexion
	const logoutButton = contentWrapper.querySelector('#logout-button') as HTMLButtonElement;
	if (logoutButton) {
		logoutButton.addEventListener('click', async () => {
			console.log('Déconnexion demandée...');
			try {
				await logout(); // S'assure que logout est bien asynchrone si elle fait des appels API
				alert('Vous avez été déconnecté.');
			} catch (error) {
				console.error('Erreur pendant la déconnexion:', error);
				alert('Une erreur est survenue lors de la déconnexion.');
			} finally {
				navigateTo('/login');
			}
		});
	}

	// Chargement initial des données d'amis
	loadAndRenderAllFriendData();

	return container;
}