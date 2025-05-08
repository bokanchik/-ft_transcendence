import { getUserDataFromStorage } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
import { initSocketClient } from '../services/initSocket.js';
export function GamePage() {
    const authData = getUserDataFromStorage();
    // --- Main Container ---
    const container = document.createElement('div');
    container.className = 'bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-center min-h-screen p-8';
    const formContainer = document.createElement('div');
    formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';
    // --- Title ---
    const title = document.createElement('h2');
    title.textContent = 'Welcome to the Game';
    title.className = 'text-3xl font-bold mb-6 text-center text-gray-800';
    // --- Buttons ---
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'buttons-container';
    buttonsContainer.className = 'flex flex-col items-center';
    const localGameButton = document.createElement('button');
    localGameButton.id = 'local-button';
    localGameButton.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 transition duration-300 ease-in-out';
    localGameButton.textContent = 'Local game';
    const onlineGameButton = document.createElement('button');
    onlineGameButton.id = 'online-button';
    onlineGameButton.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 transition duration-300 ease-in-out';
    onlineGameButton.textContent = 'Online game';
    // TODO (not finished at all)
    const customSettingsButton = document.createElement('button');
    customSettingsButton.id = 'custom-settings-button';
    customSettingsButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out';
    customSettingsButton.textContent = 'Custom Settings';
    buttonsContainer.append(localGameButton, onlineGameButton, customSettingsButton);
    // --- Le pied du page ---
    const footer = document.createElement('div');
    footer.className = 'mt-6 text-center';
    const homeLink = document.createElement('a');
    homeLink.href = '/'; // lien vers la page d'accueil
    homeLink.textContent = 'Back to Home';
    homeLink.setAttribute('data-link', ''); // intercepte par le router dans le main.ts
    homeLink.className = 'text-blue-600 hover:text-blue-800 text-sm';
    footer.appendChild(homeLink);
    // --- Ajout des éléments au conteneur principal ---
    formContainer.append(title, buttonsContainer, footer);
    container.appendChild(formContainer);
    // --- Event: Local button clicked 
    localGameButton.addEventListener('click', async () => {
        navigateTo('/local-game'); // la page avec un formulaire a remplir
    });
    // --- Event: Online button clicked ---
    onlineGameButton.addEventListener('click', async () => {
        if (!authData?.user?.id || !authData?.token) {
            alert("You must be logged in to play online.");
            return;
        }
        const playerId = authData.user.id;
        const token = authData.token;
        await handleOnlineGame(playerId, token, buttonsContainer, onlineGameButton);
    });
    return container;
}
async function handleOnlineGame(playerId, token, container, button) {
    const controller = new AbortController();
    const signal = controller.signal;
    button.disabled = true;
    try {
        //  await createMatch(authData?.token, playerId, signal);
        initSocketClient(playerId, container, controller);
    }
    catch (err) {
        // handle error for user feedback maybe redirect to error page ?
        alert('Error creating waiting room. Please try again.');
        navigateTo('/game'); // !! maybe redirect to error page
    }
    finally {
        button.disabled = false;
    }
}
// --- Fonction pour créer une salle d'attente ---
async function createMatch(token, playerId, signal) {
    const response = await fetch('/api/game/match', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        signal: signal,
    });
    if (!response.ok) {
        throw new Error('Failed to create waiting room');
    }
    ;
    // const data = await response.json();  
}
