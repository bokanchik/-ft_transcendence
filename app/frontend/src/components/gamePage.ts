import { navigateTo } from '../services/router.js';
import { handleOnlineGame } from '../services/initOnlineGame.js';
import { HeaderComponent } from '../components/headerComponent.js';
// @ts-ignore
import { User } from '../shared/schemas/usersSchemas.js';
import { getUserDataFromStorage } from '../services/authService.js';
import { showToast } from './toast.js';

export type GameMode = 'local' | 'remote';

/**
 * @brief Renders the Game Page UI and sets up game mode interaction.
 *
 * @returns A DOM element (`HTMLElement`) representing the entire game page layout.
 *
 * @details
 * - Checks if the user is authenticated; redirects to `/login` if not.
 * - Constructs the full page layout including:
 *   - Header with user info
 *   - A main section with buttons to select game modes
 *   - A footer with a link to return home
 * - Provides an "Online game" button that:
 *   - Verifies the user's session via `/api/users/me`
 *   - Stores the selected game mode in `sessionStorage`
 *   - Calls `handleOnlineGame` to start an online session
 */
export function GamePage(): HTMLElement {
	const authData = getUserDataFromStorage();

	// Si l'utilisateur n'est pas connecté, redirigez-le ou affichez un état alternatif.
	if (!authData) {
		console.warn("GamePage: User not authenticated, redirecting to login.");
		navigateTo('/login');
		// Retourner un élément vide pour éviter les erreurs de rendu pendant la redirection
		return document.createElement('div');
	}
	const currentUser: User = authData as User;

	// --- Main Container ---
	const pageWrapper = document.createElement('div');
	pageWrapper.className = 'flex flex-col min-h-screen'; // Assure que la page prend toute la hauteur

	// --- Header ---
	const headerElement = HeaderComponent({ currentUser });
	pageWrapper.appendChild(headerElement);

    // --- Game Page Content ---
    const gameContentContainer: HTMLDivElement = document.createElement('div');
	gameContentContainer.className = 'bg-white flex justify-center items-center min-h-screen p-8';    
    
    const formContainer: HTMLDivElement = document.createElement('div');
    formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';   

    // --- Title ---
    const title: HTMLHeadElement = document.createElement('h2');
    title.textContent = 'Welcome to the Game';
    title.className = 'text-3xl font-bold mb-6 text-center text-gray-800';
    
    // --- Buttons ---
    const buttonsContainer: HTMLDivElement = document.createElement('div');
    buttonsContainer.id = 'buttons-container';
    buttonsContainer.className = 'flex flex-col items-center';
    
    const onlineGameButton: HTMLButtonElement  = document.createElement('button');
    onlineGameButton.id = 'online-button';
   
    onlineGameButton.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 transition duration-300 ease-in-out';
    onlineGameButton.textContent = 'Start Game';
    
    // TODO (not finished at all)
    const inviteFriendButton: HTMLButtonElement  = document.createElement('button');
    inviteFriendButton.id = 'invite-friend-button';
    inviteFriendButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out';
    inviteFriendButton.textContent = 'Play a friend';
    
    buttonsContainer.append(onlineGameButton, inviteFriendButton); 
    
    // --- Le pied du page ---
    const footer: HTMLDivElement = document.createElement('div');
    footer.className = 'mt-6 text-center';
    
    const homeLink: HTMLAnchorElement = document.createElement('a');
    homeLink.href = '/'; // lien vers la page d'accueil
    homeLink.textContent = 'Back to Home';
    homeLink.setAttribute('data-link', ''); // intercepte par le router dans le main.ts
    homeLink.className = 'text-blue-600 hover:text-blue-800 text-sm';
    
    footer.appendChild(homeLink);
    
    // --- Ajout des éléments au conteneur principal ---
    formContainer.append(title, buttonsContainer, footer);
    gameContentContainer.appendChild(formContainer);
    pageWrapper.appendChild(gameContentContainer);
    
    // --- Event: Online game button clicked ---
    onlineGameButton.addEventListener('click', () => {
        onlineGameHandler(buttonsContainer, onlineGameButton, title);
    });
    
    inviteFriendButton.addEventListener('click', () => {
        navigateTo('/invite');
    });
    
    return pageWrapper;
}

async function onlineGameHandler(buttonsContainer: HTMLDivElement, onlineGameButton: HTMLButtonElement, title: HTMLHeadElement) {
    
    try {
        const userRes: Response = await fetch('/api/users/me');
        if (!userRes.ok) {
            showToast('You must be logged in to play online', 'error');
            return;
        }
        const userData = await userRes.json();
        const display_name: string = userData.display_name;
        const userId: number = userData.id;
    
        sessionStorage.setItem('gameMode', 'remote');
    
        await handleOnlineGame(display_name, userId, buttonsContainer, onlineGameButton, title);
    
    } catch (err: unknown) {
        console.log(`Failed to fetch from user`);
        showToast('Something went wrong. Please try again later.', 'error');
        throw err;
    }
    
}