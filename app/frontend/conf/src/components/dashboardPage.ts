import { getUserDataFromStorage, logout } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
//import { getAuthToken, logout } from '../services/authService.js';

export function DashboardPage(): HTMLElement {
    // --- Vérification de l'authentification ---
    //const authData = getAuthToken(); // Ex: { user: { id: 1, username: '...', display_name: '...' }, token: '...' } ou null
    const authData = getUserDataFromStorage();

    if (!authData || !authData.token) {
        // Non connecté ou token manquant, rediriger vers la page de connexion
        console.warn('Accès au tableau de bord refusé : utilisateur non connecté.');
        // Utilisez votre méthode de redirection. Exemples :
        // window.location.hash = '/login'; // Si vous utilisez un routage par hash
        // ou window.location.pathname = '/login'; // Si vous utilisez l'API History
        navigateTo('/login'); // Si vous avez une fonction de routage

        // Retourner un élément vide ou un message pendant la redirection
        const redirectMsg = document.createElement('div');
        redirectMsg.className = 'p-8 text-center';
        redirectMsg.textContent = 'Vous devez être connecté pour accéder à cette page. Redirection vers la page de connexion...';
        return redirectMsg;
    }

    // L'utilisateur est connecté, récupérer ses informations
    const user = authData.user;

    // --- Création des éléments HTML ---
    const container = document.createElement('div');
    container.className = 'min-h-screen bg-gray-100 p-4 md:p-8'; // Fond différent du login

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8';

    // Contenu HTML du tableau de bord
    contentWrapper.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 border-gray-200">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
                <p class="text-xl text-gray-600 mt-1">Bienvenue, <strong class="text-blue-600">${user.display_name || user.username}</strong> !</p>
            </div>
            <button id="logout-button"
                    class="mt-4 sm:mt-0 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out">
                Déconnexion
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Exemple de widget 1: Informations utilisateur -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <h2 class="text-xl font-semibold text-blue-800 mb-3">Mon Profil</h2>
                <p class="text-gray-700 text-sm mb-1"><span class="font-medium">Username:</span> ${user.username}</p>
                <p class="text-gray-700 text-sm mb-1"><span class="font-medium">Email:</span> ${user.email || 'Non fourni'}</p>
                 <p class="text-gray-700 text-sm"><span class="font-medium">ID:</span> ${user.id}</p>
                <a href="/profile" data-link class="text-blue-600 hover:text-blue-800 text-sm mt-3 inline-block">Modifier le profil</a>
            </div>

            <!-- Exemple de widget 2: Statistiques rapides -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                <h2 class="text-xl font-semibold text-green-800 mb-3">Statistiques</h2>
                <p class="text-gray-700">Vous avez X notifications.</p>
                <p class="text-gray-700">Y éléments actifs.</p>
                <!-- Ajoutez ici des données réelles -->
            </div>

             <!-- Exemple de widget 3: Actions rapides -->
             <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
                <h2 class="text-xl font-semibold text-yellow-800 mb-3">Actions Rapides</h2>
                <button class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-1 px-3 rounded mr-2 mb-2">Nouvel Article</button>
                <button class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-1 px-3 rounded mb-2">Mes Tâches</button>
            </div>

            <!-- Ajoutez d'autres widgets ou sections ici -->

        </div>

        <div class="mt-8 text-center border-t pt-4 border-gray-200">
             <a href="/" data-link class="text-gray-600 hover:text-gray-800 text-sm">Retour à l'accueil</a>
        </div>
    `;

    container.appendChild(contentWrapper);

    // --- Ajout de la logique (Déconnexion) ---
    const logoutButton = contentWrapper.querySelector('#logout-button') as HTMLButtonElement;

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            console.log('Déconnexion demandée...');
            logout(); // Supprime les données de session/locale
            alert('Vous avez été déconnecté.'); // Feedback simple
            // Rediriger vers la page de connexion ou d'accueil
            window.location.hash = '/login'; // Ou autre selon votre routage
            // ou navigate('/login');
        });
    } else {
        console.error("Le bouton de déconnexion n'a pas été trouvé dans le DOM.");
    }

    // --- Retourner l'élément racine de la page ---
    return container;
}

