// profilePage.ts
import { navigateTo } from '../services/router.js';
import { getUserDataFromStorage } from '../services/authService.js';
import { fetchCsrfToken } from '../services/csrf.js';
import { User as AuthUserType, User as ApiUserType } from '../shared/types.js'; // Assurez-vous que ApiUserType est bien défini
import { HeaderComponent } from '../components/headerComponent.js';
import { showToast } from '../components/toast.js';

// --- Supposons que vous ayez une fonction pour récupérer les détails d'un utilisateur par ID ---
// Ceci est un MOCK. Vous devrez implémenter la vraie fonction d'API.
async function fetchUserDetails(userId: number): Promise<ApiUserType | null> {
    console.log(`Fetching details for user ID: ${userId}`);
    // MOCK API call
    // Dans une vraie application, vous feriez :
    // const response = await fetch(`/api/users/${userId}`);
    // if (!response.ok) return null;
    // return await response.json();

    // Pour l'exemple, si l'ID est 1, retournons un utilisateur mocké
    // ou essayons de trouver l'utilisateur dans une liste mockée si vous en avez une
    // Sinon, retournons un utilisateur générique.
    const currentUser = getUserDataFromStorage();
    if (currentUser && currentUser.id === userId) {
        return currentUser as ApiUserType; // Cast si nécessaire, assurez-vous que les types sont compatibles
    }
    // Simuler la recherche d'un autre utilisateur
    // Pour cet exemple, nous allons retourner un utilisateur mocké simple s'il n'est pas l'utilisateur actuel.
    // Idéalement, vous auriez un endpoint API /api/users/${userId}
    try {
        const response = await fetch(`/api/users/${userId}`); // Assurez-vous que cet endpoint existe
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Failed to fetch user: ${response.statusText}`);
        }
        const user = await response.json();
        // Simuler les champs wins/losses si non présents dans votre API /api/users/:id
        return {
            ...user,
            wins: user.wins ?? Math.floor(Math.random() * 20),
            losses: user.losses ?? Math.floor(Math.random() * 20),
            created_at: user.created_at || new Date().toISOString(), // Assurez-vous que ce champ existe
        } as ApiUserType;
    } catch (error) {
        console.error("Mock fetchUserDetails error:", error);
        // Retourner un utilisateur mocké pour que la page ne plante pas complètement
        // Ou gérer l'erreur plus proprement (ex: afficher un message d'erreur)
        return {
            id: userId,
            username: `user_${userId}`,
            display_name: `User ${userId}`,
            email: `user${userId}@example.com`,
            avatar_url: null,
            wins: 10,
            losses: 5,
            created_at: new Date().toISOString(),
            status: 'offline',
        } as ApiUserType;
    }
}

// --- Composant MatchHistory (pourrait être dans son propre fichier) ---
// Vous devrez implémenter la logique pour récupérer et afficher l'historique des matchs
interface MatchHistoryProps {
    userId: number;
    // Potentiellement, d'autres informations comme le nom d'utilisateur pour l'affichage
}

async function MatchHistoryComponent(props: MatchHistoryProps): Promise<HTMLElement> {
    const el = document.createElement('div');
    el.className = 'p-4';
    el.innerHTML = `<h3 class="text-xl font-semibold mb-4">Historique des Matchs</h3>`;

    const loadingMessage = document.createElement('p');
    loadingMessage.className = 'text-gray-500';
    loadingMessage.textContent = 'Chargement de l\'historique des matchs...';
    el.appendChild(loadingMessage);

    try {
        // MOCK: Simuler un appel API pour l'historique des matchs
        // Remplacez par votre véritable appel API : await fetchMatchHistoryForUser(props.userId);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler la latence réseau
        const matches = [ // Données mockées
            { opponent: 'AdversaireA', result: 'Victoire', score: '10 - 5', date: '2024-07-20' },
            { opponent: 'AdversaireB', result: 'Défaite', score: '3 - 10', date: '2024-07-19' },
            { opponent: 'AdversaireC', result: 'Victoire', score: '10 - 8', date: '2024-07-18' },
        ];

        loadingMessage.remove(); // Enlever le message de chargement

        if (matches.length === 0) {
            el.innerHTML += '<p class="text-gray-500">Aucun match trouvé pour cet utilisateur.</p>';
            return el;
        }

        const list = document.createElement('ul');
        list.className = 'space-y-3';
        matches.forEach(match => {
            const item = document.createElement('li');
            item.className = 'p-3 bg-gray-100 rounded-lg shadow-sm';
            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-medium">${match.opponent}</span>
                    <span class="${match.result === 'Victoire' ? 'text-green-600' : 'text-red-600'}">${match.result}</span>
                </div>
                <div class="text-sm text-gray-600">Score: ${match.score} - Date: ${match.date}</div>
            `;
            list.appendChild(item);
        });
        el.appendChild(list);

    } catch (error) {
        console.error("Erreur lors du chargement de l'historique des matchs:", error);
        loadingMessage.textContent = 'Erreur lors du chargement de l\'historique des matchs.';
        loadingMessage.classList.add('text-red-500');
    }
    return el;
}


export async function ProfilePage(params: { userId?: string }): Promise<HTMLElement> {
    const loggedInUser: AuthUserType | null = getUserDataFromStorage();

    if (!loggedInUser) {
        navigateTo('/login');
        const redirectMsg = document.createElement('div');
        redirectMsg.className = 'min-h-screen flex items-center justify-center text-xl';
        redirectMsg.textContent = 'Redirection vers la page de connexion...';
        return redirectMsg;
    }

    const userIdToView = params.userId ? parseInt(params.userId, 10) : loggedInUser.id; // Par défaut, le profil de l'utilisateur connecté si aucun ID n'est fourni

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
        const errorMsg = document.createElement('div');
        errorMsg.className = 'min-h-screen flex items-center justify-center text-xl text-red-500';
        errorMsg.textContent = 'Erreur lors de l\'initialisation de la page. Veuillez rafraîchir.';
        return errorMsg;
    }

    const pageContainer = document.createElement('div');
    pageContainer.className = 'min-h-screen bg-gray-200 p-4 sm:p-8 flex flex-col items-center';

    const profileWrapper = document.createElement('div');
    profileWrapper.className = 'bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden';

    // --- Header (identique au dashboard) ---
    // Le HeaderComponent affiche toujours les infos de l'utilisateur connecté (loggedInUser)
    const headerElement = HeaderComponent({ currentUser: loggedInUser });

    // --- Section principale (Sidebar + Contenu Match History) ---
    const mainSection = document.createElement('div');
    mainSection.className = 'flex flex-1 min-h-[calc(100vh-150px)]'; // Hauteur minimale

    // --- Afficher un message de chargement pendant la récupération des données du profil ---
    profileWrapper.appendChild(headerElement);
    profileWrapper.appendChild(mainSection);
    pageContainer.appendChild(profileWrapper);

    const loadingProfileMsg = document.createElement('p');
    loadingProfileMsg.className = 'text-center text-gray-500 py-10 flex-1';
    loadingProfileMsg.textContent = 'Chargement du profil...';
    mainSection.appendChild(loadingProfileMsg);


    // --- Récupérer les détails de l'utilisateur dont on visite le profil ---
    const profiledUser: ApiUserType | null = await fetchUserDetails(userIdToView);

    if (!profiledUser) {
        loadingProfileMsg.remove();
        const errorMsg = document.createElement('div');
        errorMsg.className = 'flex-1 p-6 text-center text-red-500';
        errorMsg.textContent = `Profil utilisateur avec ID ${userIdToView} non trouvé.`;
        mainSection.appendChild(errorMsg);
        return pageContainer;
    }
    
    loadingProfileMsg.remove(); // Enlever le message de chargement du profil

    // --- Sidebar (infos de l'utilisateur `profiledUser`) ---
    const sidebar = document.createElement('div');
    sidebar.className = 'w-1/4 p-6 bg-gray-50 border-r border-gray-200 space-y-3 overflow-y-auto';

    // Helper pour créer les items de la sidebar (identique à celui du dashboard)
    function createSidebarItem(label: string, value: string | number | Date | undefined | null): HTMLElement {
        const item = document.createElement('div');
        item.className = 'p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm';
        const labelEl = document.createElement('span');
        labelEl.className = 'text-xs text-gray-500 block mb-0.5';
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

    sidebar.appendChild(createSidebarItem('Nom d\'utilisateur', profiledUser.username));
    sidebar.appendChild(createSidebarItem('Nom affiché', profiledUser.display_name));
    sidebar.appendChild(createSidebarItem('Email', profiledUser.email)); // Peut-être masquer pour les autres profils ?
    sidebar.appendChild(createSidebarItem('Date de création', new Date(profiledUser.created_at)));
    sidebar.appendChild(createSidebarItem('Victoires', profiledUser.wins ?? 'N/A'));
    sidebar.appendChild(createSidebarItem('Défaites', profiledUser.losses ?? 'N/A'));
    // Vous pouvez ajouter d'autres informations si disponibles pour `profiledUser`

    // --- Contenu principal (Match History uniquement) ---
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'w-3/4 p-6 flex flex-col overflow-y-auto';

    // Charger le composant MatchHistory
    const matchHistoryElement = await MatchHistoryComponent({ userId: profiledUser.id });
    contentWrapper.appendChild(matchHistoryElement);


    mainSection.appendChild(sidebar);
    mainSection.appendChild(contentWrapper);

    // Si c'est le profil de l'utilisateur connecté, on pourrait ajouter un bouton "Editer Profil"
    if (loggedInUser.id === profiledUser.id) {
        const editProfileButton = document.createElement('button');
        editProfileButton.textContent = 'Éditer mon profil';
        editProfileButton.className = 'mt-4 ml-auto mr-auto block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md';
        editProfileButton.onclick = () => navigateTo('/settings'); // ou une page d'édition de profil
        sidebar.appendChild(editProfileButton); // Ajouter à la sidebar ou ailleurs
    }

    return pageContainer;
}