// import { navigateTo } from '../services/router.js';
// import { handleOnlineGame } from '../services/initOnlineGame.js';
// import { HeaderComponent } from '../components/headerComponent.js';
// // @ts-ignore
// import { User } from '../shared/schemas/usersSchemas.js';
// import { getUserDataFromStorage } from '../services/authService.js';
// import { showToast } from './toast.js';
// import { t } from '../services/i18nService.js';
// export type GameMode = 'local' | 'remote';
// /**
//  * @brief Renders the Game Page UI and sets up game mode interaction.
//  *
//  * @returns A DOM element (`HTMLElement`) representing the entire game page layout.
//  *
//  * @details
//  * - Checks if the user is authenticated; redirects to `/login` if not.
//  * - Constructs the full page layout including:
//  *   - Header with user info
//  *   - A main section with buttons to select game modes
//  *   - A footer with a link to return home
//  * - Provides an "Online game" button that:
//  *   - Verifies the user's session via `/api/users/me`
//  *   - Stores the selected game mode in `sessionStorage`
//  *   - Calls `handleOnlineGame` to start an online session
//  */
// export function GamePage(): HTMLElement {
// 	const authData = getUserDataFromStorage();
// 	// Si l'utilisateur n'est pas connecté, redirigez-le ou affichez un état alternatif.
// 	if (!authData) {
// 		console.warn("GamePage: User not authenticated, redirecting to login.");
// 		navigateTo('/login');
// 		// Retourner un élément vide pour éviter les erreurs de rendu pendant la redirection
// 		return document.createElement('div');
// 	}
// 	const currentUser: User = authData as User;
// 	// --- Main Container ---
// 	const pageWrapper = document.createElement('div');
// 	// pageWrapper.className = 'flex flex-col min-h-screen'; // Assure que la page prend toute la hauteur
// 	pageWrapper.className = 'flex flex-col min-h-screen bg-cover bg-center bg-fixed';
// 	pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";
// 	// --- Header ---
// 	const headerElement = HeaderComponent({ currentUser });
// 	pageWrapper.appendChild(headerElement);
// 	// --- Game Page Content ---
// 	const gameContentContainer: HTMLDivElement = document.createElement('div');
// 	// gameContentContainer.className = 'bg-white flex justify-center items-center min-h-screen p-8';
// 	gameContentContainer.className = 'flex-grow flex justify-center items-center p-4 sm:p-8';
// 	const formContainer: HTMLDivElement = document.createElement('div');
// 	// formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';
// 	formContainer.className = 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full';
// 	// --- Title ---
// 	const title: HTMLHeadElement = document.createElement('h2');
// 	title.textContent = t('game.welcome');
// 	// title.className = 'text-3xl font-bold mb-6 text-center text-gray-800';
// 	title.className = 'text-3xl font-bold mb-6 text-center text-white';
// 	// --- Buttons ---
// 	const buttonsContainer: HTMLDivElement = document.createElement('div');
// 	buttonsContainer.id = 'buttons-container';
// 	buttonsContainer.className = 'flex flex-col items-center';
// 	const onlineGameButton: HTMLButtonElement = document.createElement('button');
// 	onlineGameButton.id = 'online-button';
// 	// onlineGameButton.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 transition duration-300 ease-in-out';
// 	onlineGameButton.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out border border-green-500/50 text-lg';
// 	onlineGameButton.textContent = t('game.start');
// 	buttonsContainer.appendChild(onlineGameButton);
// 	// --- Le pied du page ---
// 	const footer: HTMLDivElement = document.createElement('div');
// 	footer.className = 'mt-6 text-center';
// 	const homeLink: HTMLAnchorElement = document.createElement('a');
// 	homeLink.href = '/'; // lien vers la page d'accueil
// 	homeLink.textContent = t('link.home');
// 	homeLink.setAttribute('data-link', ''); // intercepte par le router dans le main.ts
// 	// homeLink.className = 'text-blue-600 hover:text-blue-800 text-sm';
// 	homeLink.className = 'text-blue-400 hover:text-blue-300 text-sm transition-colors';
// 	footer.appendChild(homeLink);
// 	// --- Ajout des éléments au conteneur principal ---
// 	formContainer.append(title, buttonsContainer, footer);
// 	gameContentContainer.appendChild(formContainer);
// 	pageWrapper.appendChild(gameContentContainer);
// 	// --- Event: Online game button clicked ---
// 	onlineGameButton.addEventListener('click', () => {
// 		onlineGameHandler(buttonsContainer, onlineGameButton, title);
// 	});
// 	return pageWrapper;
// }
// async function onlineGameHandler(buttonsContainer: HTMLDivElement, onlineGameButton: HTMLButtonElement, title: HTMLHeadElement) {
// 	try {
// 		const userRes: Response = await fetch('/api/users/me');
// 		if (!userRes.ok) {
// 			showToast(t('game.deniedMsg'), 'error');
// 			return;
// 		}
// 		const userData = await userRes.json();
// 		const display_name: string = userData.display_name;
// 		const userId: number = userData.id;
// 		sessionStorage.setItem('gameMode', 'remote');
// 		await handleOnlineGame(display_name, userId, buttonsContainer, onlineGameButton, title);
// 	} catch (err: unknown) {
// 		console.log(`Failed to fetch from user`);
// 		showToast(t('msg.error.any'), 'error');
// 		throw err;
// 	}
// }
import { navigateTo } from '../services/router.js';
import { handleOnlineGame } from '../services/initOnlineGame.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { getUserDataFromStorage, checkAuthStatus } from '../services/authService.js';
import { showToast } from './toast.js';
import { t } from '../services/i18nService.js';
import { createElement } from '../utils/domUtils.js';
export function GamePage() {
    const authData = getUserDataFromStorage();
    if (!authData) {
        console.warn("GamePage: User not authenticated, redirecting to login.");
        navigateTo('/login');
        return createElement('div');
    }
    const currentUser = authData;
    // --- Éléments ---
    const title = createElement('h2', {
        textContent: t('game.welcome'),
        className: 'text-4xl font-medium mb-6 text-center text-white font-beach'
    });
    const onlineGameButton = createElement('button', {
        id: 'online-button',
        textContent: t('game.start'),
        className: 'bg-teal-800 hover:bg-green-600 text-gray-200 text-2xl font-beach font-medium py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out border border-green-500/50'
    });
    const buttonsContainer = createElement('div', {
        id: 'buttons-container',
        className: 'flex flex-col items-center'
    }, [onlineGameButton]);
    const homeLink = createElement('a', {
        href: '/',
        textContent: t('link.home'),
        className: 'text-blue-400 hover:text-blue-300 text-sm transition-colors'
    });
    homeLink.setAttribute('data-link', '');
    const footer = createElement('div', { className: 'mt-6 text-center' }, [homeLink]);
    const formContainer = createElement('div', {
        className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full'
    }, [title, buttonsContainer, footer]);
    const gameContentContainer = createElement('div', {
        className: 'flex-grow flex justify-center items-center p-4 sm:p-8'
    }, [formContainer]);
    const pageWrapper = createElement('div', {
        className: 'flex flex-col min-h-screen bg-cover bg-center bg-fixed'
    }, [
        HeaderComponent({ currentUser }),
        gameContentContainer
    ]);
    pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";
    // --- Logique d'événements ---
    onlineGameButton.addEventListener('click', async () => {
        onlineGameButton.disabled = true;
        try {
            await onlineGameHandler(buttonsContainer, onlineGameButton, title);
        }
        finally {
            if (onlineGameButton) {
                onlineGameButton.disabled = false;
            }
        }
    });
    return pageWrapper;
}
async function onlineGameHandler(buttonsContainer, onlineGameButton, title) {
    try {
        const freshUser = await checkAuthStatus();
        if (!freshUser) {
            showToast(t('game.deniedMsg'), 'error');
            navigateTo('/login');
            return;
        }
        const displayName = freshUser.display_name;
        const userId = freshUser.id;
        sessionStorage.setItem('gameMode', 'remote');
        await handleOnlineGame(displayName, userId, buttonsContainer, onlineGameButton, title);
    }
    catch (err) {
        console.error(`Failed to initiate online game:`, err);
        showToast(t('msg.error.any'), 'error');
    }
}
