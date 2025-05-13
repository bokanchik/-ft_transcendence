// import { getUserDataFromStorage, logout, UserData } from '../services/authService.js';
// import { navigateTo } from '../main.js';
// //import { getAuthToken, logout } from '../services/authService.js';
//
// export function DashboardPage(): HTMLElement {
// 	// --- Vérification de l'authentification ---
// 	//const authData = getAuthToken(); // Ex: { user: { id: 1, username: '...', display_name: '...' }, token: '...' } ou null
// 	const userData: UserData | null = getUserDataFromStorage();
//
// 	if (!userData) {
// 		console.warn('Access unauthorized: User not authenticated.');
// 		navigateTo('/login');
// 		const redirectMsg = document.createElement('div');
// 		redirectMsg.className = 'p-8 text-center';
// 		redirectMsg.textContent = 'Loading or redirecting...';
// 		return redirectMsg;
// 	}
//
// 	// --- Création des éléments HTML ---
// 	const container = document.createElement('div');
// 	container.className = 'min-h-screen bg-gray-100 p-4 md:p-8'; // Fond différent du login
//
// 	const contentWrapper = document.createElement('div');
// 	contentWrapper.className = 'max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8';
//
// 	// Contenu HTML du tableau de bord
// 	contentWrapper.innerHTML = `
//         <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 border-gray-200">
//             <div>
//                 <h1 class="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
//                 <p class="text-xl text-gray-600 mt-1">Bienvenue, <strong class="text-blue-600">${userData.display_name || userData.username}</strong> !</p>
//             </div>
//             <button id="logout-button"
//                     class="mt-4 sm:mt-0 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out">
//                 Déconnexion
//             </button>
//         </div>
//
//         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <!-- Exemple de widget 1: Informations utilisateur -->
//             <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
//                 <h2 class="text-xl font-semibold text-blue-800 mb-3">Mon Profil</h2>
//                 <p class="text-gray-700 text-sm mb-1"><span class="font-medium">Username:</span> ${userData.username}</p>
//                 <p class="text-gray-700 text-sm mb-1"><span class="font-medium">Email:</span> ${userData.email || 'Non fourni'}</p>
//                  <p class="text-gray-700 text-sm"><span class="font-medium">ID:</span> ${userData.id}</p>
//                 <a href="/profile" data-link class="text-blue-600 hover:text-blue-800 text-sm mt-3 inline-block">Modifier le profil</a>
//             </div>
//
//             <!-- Exemple de widget 2: Statistiques rapides -->
//             <div class="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
//                 <h2 class="text-xl font-semibold text-green-800 mb-3">Statistiques</h2>
//                 <p class="text-gray-700">Vous avez X notifications.</p>
//                 <p class="text-gray-700">Y éléments actifs.</p>
//                 <!-- Ajoutez ici des données réelles -->
//             </div>
//
//              <!-- Exemple de widget 3: Actions rapides -->
//              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
//                 <h2 class="text-xl font-semibold text-yellow-800 mb-3">Actions Rapides</h2>
//                 <button class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-1 px-3 rounded mr-2 mb-2">Nouvel Article</button>
//                 <button class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-1 px-3 rounded mb-2">Mes Tâches</button>
//             </div>
//
//             <!-- Ajoutez d'autres widgets ou sections ici -->
//
//         </div>
//
//         <div class="mt-8 text-center border-t pt-4 border-gray-200">
//              <a href="/" data-link class="text-gray-600 hover:text-gray-800 text-sm">Retour à l'accueil</a>
//         </div>
//     `;
//
// 	container.appendChild(contentWrapper);
//
// 	// --- Ajout de la logique (Déconnexion) ---
// 	const logoutButton = contentWrapper.querySelector('#logout-button') as HTMLButtonElement;
//
// 	if (logoutButton) {
// 		logoutButton.addEventListener('click', () => {
// 			console.log('Déconnexion demandée...');
// 			logout(); // Supprime les données de session/locale
// 			alert('Vous avez été déconnecté.'); // Feedback simple
// 			// Rediriger vers la page de connexion ou d'accueil
// 			window.location.hash = '/login'; // Ou autre selon votre routage
// 			// ou navigate('/login');
// 		});
// 	} else {
// 		console.error("Le bouton de déconnexion n'a pas été trouvé dans le DOM.");
// 	}
//
// 	// --- Retourner l'élément racine de la page ---
// 	return container;
// }
//
import { getUserDataFromStorage, logout, UserData } from '../services/authService.js';
import { navigateTo } from '../main.js';
import { // Importer les nouvelles fonctions et types
    getReceivedFriendRequests,
    getSentFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    PendingFriendRequest
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

    // --- Section pour les demandes d'amis ---
    const friendRequestsSection = document.createElement('div');
    friendRequestsSection.id = 'friend-requests-section';
    friendRequestsSection.className = 'mt-8 p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm';
    friendRequestsSection.innerHTML = `
        <h2 class="text-2xl font-semibold text-indigo-800 mb-4">Demandes d'amis</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-xl font-medium text-indigo-700 mb-3">Reçues (<span id="received-requests-count">0</span>)</h3>
                <ul id="received-requests-list" class="space-y-3">
                    <!-- Les demandes reçues seront injectées ici -->
                    <li class="text-gray-500 italic">Aucune demande reçue.</li>
                </ul>
            </div>
            <div>
                <h3 class="text-xl font-medium text-indigo-700 mb-3">Envoyées (<span id="sent-requests-count">0</span>)</h3>
                <ul id="sent-requests-list" class="space-y-3">
                    <!-- Les demandes envoyées seront injectées ici -->
                     <li class="text-gray-500 italic">Aucune demande envoyée.</li>
                </ul>
            </div>
        </div>
    `;

	// Contenu HTML du tableau de bord principal
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

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <!-- Friend requests section will be appended here -->
        <div class="mt-8 text-center border-t pt-4 border-gray-200">
             <a href="/" data-link class="text-gray-600 hover:text-gray-800 text-sm">Retour à l'accueil</a>
        </div>
    `;

    // Insérer la section des demandes d'amis avant la dernière div (liens de pied de page)
    const mainGrid = contentWrapper.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    if (mainGrid && mainGrid.parentNode) {
        mainGrid.parentNode.insertBefore(friendRequestsSection, mainGrid.nextSibling);
    } else {
        contentWrapper.appendChild(friendRequestsSection); // Fallback
    }

	container.appendChild(contentWrapper);

	// --- Ajout de la logique ---
	const logoutButton = contentWrapper.querySelector('#logout-button') as HTMLButtonElement;
	if (logoutButton) {
		logoutButton.addEventListener('click', async () => { // Rendre async pour logout
			console.log('Déconnexion demandée...');
            try {
                await logout(); // Appelle la fonction logout() du service (qui est async)
                alert('Vous avez été déconnecté.');
            } catch (error) {
                console.error('Erreur pendant la déconnexion:', error);
                alert('Une erreur est survenue lors de la déconnexion.');
            } finally {
                navigateTo('/login');
            }
		});
	}

    // --- Logique pour les demandes d'amis ---
    const receivedList = friendRequestsSection.querySelector('#received-requests-list') as HTMLUListElement;
    const sentList = friendRequestsSection.querySelector('#sent-requests-list') as HTMLUListElement;
    const receivedCountSpan = friendRequestsSection.querySelector('#received-requests-count') as HTMLSpanElement;
    const sentCountSpan = friendRequestsSection.querySelector('#sent-requests-count') as HTMLSpanElement;

    async function loadFriendRequests() {
        try {
            const [received, sent] = await Promise.all([
                getReceivedFriendRequests(),
                getSentFriendRequests()
            ]);

            renderReceivedRequests(received);
            renderSentRequests(sent);

        } catch (error) {
            console.error("Erreur lors du chargement des demandes d'amis:", error);
            receivedList.innerHTML = `<li class="text-red-500 italic">Erreur de chargement.</li>`;
            sentList.innerHTML = `<li class="text-red-500 italic">Erreur de chargement.</li>`;
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

    // Gestionnaires d'événements pour les actions sur les demandes
    friendRequestsSection.addEventListener('click', async (event) => {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'BUTTON' || !target.dataset.action) return;

        const listItem = target.closest('li[data-friendship-id]') as HTMLLIElement;
        if (!listItem) return;

        const friendshipId = parseInt(listItem.dataset.friendshipId || '', 10);
        if (isNaN(friendshipId)) return;

        const action = target.dataset.action;
        target.disabled = true; // Désactiver le bouton pendant l'action
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
            console.log(message); // Pourrait être affiché dans un toast/notification
            alert(message); // Simple alerte pour le feedback
            loadFriendRequests(); // Recharger la liste
        } catch (error: any) {
            console.error(`Erreur lors de l'action '${action}':`, error);
            alert(`Erreur: ${error.message || 'Une erreur est survenue.'}`);
            target.disabled = false; // Réactiver si erreur
            target.textContent = action.charAt(0).toUpperCase() + action.slice(1); // Restaurer le texte
        }
    });

    // Charger les demandes d'amis au chargement de la page
    loadFriendRequests();

	return container;
}
