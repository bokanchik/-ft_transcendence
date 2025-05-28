import { navigateTo } from '../services/router.js';
import { handleOnlineGame } from '../services/initOnlineGame.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { User } from '../shared/types.js';
import { getUserDataFromStorage } from '../services/authService.js';
import { showToast } from './toast.js';

export type GameMode = 'local' | 'remote';

export function GamePage(): HTMLElement {
    //ajout arthur -> on check tout de suite si l'utilisateur est connecté
    const authData = getUserDataFromStorage();

    // Le HeaderComponent attend un currentUser.
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
    const headerElement = HeaderComponent({ currentUser});
    pageWrapper.appendChild(headerElement);

    // --- Game Page Content ---
    // L'ancien 'container' devient 'gameContentContainer'
    const gameContentContainer: HTMLDivElement = document.createElement('div');
    gameContentContainer.className = 'flex-grow bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-center p-8';
    
    const formContainer: HTMLDivElement = document.createElement('div');
    formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';   
    // fin ajout arthur

    // const container: HTMLDivElement = document.createElement('div');
    // container.className = 'bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-center min-h-screen p-8';
    
    // const formContainer: HTMLDivElement = document.createElement('div');
    // formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';
    
    // --- Title ---
    const title: HTMLHeadElement = document.createElement('h2');
    title.textContent = 'Welcome to the Game';
    title.className = 'text-3xl font-bold mb-6 text-center text-gray-800';
    
    // --- Buttons ---
    const buttonsContainer: HTMLDivElement = document.createElement('div');
    buttonsContainer.id = 'buttons-container';
    buttonsContainer.className = 'flex flex-col items-center';
    
    const localGameButton: HTMLButtonElement = document.createElement('button');
    localGameButton.id = 'local-button';
    localGameButton.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 transition duration-300 ease-in-out';
    localGameButton.textContent = 'Local game';
    
    const onlineGameButton: HTMLButtonElement  = document.createElement('button');
    onlineGameButton.id = 'online-button';// fastify.get('/match/:matchId', { schema: matchSchemas.idOnly}, getMatchIdHandler);
   
    onlineGameButton.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 transition duration-300 ease-in-out';
    onlineGameButton.textContent = 'Online game';
    
    // TODO (not finished at all)
    const customSettingsButton: HTMLButtonElement  = document.createElement('button');
    customSettingsButton.id = 'custom-settings-button';
    customSettingsButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out';
    customSettingsButton.textContent = 'Custom Settings';
    
    buttonsContainer.append(localGameButton, onlineGameButton, customSettingsButton); 
    
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
    // debut ajout arthur
        formContainer.append(title, buttonsContainer, footer);
    gameContentContainer.appendChild(formContainer);
    pageWrapper.appendChild(gameContentContainer);
    // fin ajout arthur

    // formContainer.append(title, buttonsContainer, footer);
    // container.appendChild(formContainer); 
    
    // --- Event: Local game button clicked 
    localGameButton.addEventListener('click', async () =>  {
        navigateTo('/local-game'); // la page avec un formulaire a remplir pour le jeu en local
    });
    
    // --- Event: Online game button clicked ---
    onlineGameButton.addEventListener('click', async () => { 
        
        try {
            const userRes = await fetch('/api/users/me');
            if (!userRes.ok) {
                showToast('You must be logged in to play online', 'error');
                return;
            }
            const userData = await userRes.json();
            const display_name: string = userData.display_name;

            sessionStorage.setItem('gameMode', 'online');

            await handleOnlineGame(display_name, buttonsContainer, onlineGameButton);
        } catch (err: unknown) {
            console.log(`Failed to fetch from user`);
            showToast('Something went wrong. Please try again later.', 'error');
            throw err;
        }
    });

        // return container;
        return pageWrapper; // ajout arthur
}
    