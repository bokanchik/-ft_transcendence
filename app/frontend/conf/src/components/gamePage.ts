import { getUserDataFromStorage } from '../services/authService.js';
import { navigateTo } from '../services/router.js';

export function GamePage(): HTMLElement {
    const authData = getUserDataFromStorage();

    if (!authData) {
        // optionnel: mettre un message d'erreur ou une alerte ?
        alert('You must be logged in to access this page.');
        navigateTo('/login');
        return document.createElement('div');
    }

    // --- Conteneur principal ---
    const container = document.createElement('div');
    container.className = 'bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-center min-h-screen p-8';
    
    const formContainer = document.createElement('div');
    formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';
    
    // --- Titre ---
    const title = document.createElement('h2');
    title.textContent = 'Welcome to the Game';
    title.className = 'text-3xl font-bold mb-6 text-center text-gray-800';

    // --- Buttons ---
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'buttons-container';
    buttonsContainer.className = 'flex flex-col items-center';

    const startButton = document.createElement('button');
    startButton.id = 'start-button';
    startButton.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 transition duration-300 ease-in-out';
    startButton.textContent = 'Start';

    const customSettingsButton = document.createElement('button');
    customSettingsButton.id = 'custom-settings-button';
    customSettingsButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out';
    customSettingsButton.textContent = 'Custom Settings';

    buttonsContainer.append(startButton, customSettingsButton); 

    // --- Le pied du page ---
    const footer = document.createElement('div');
    footer.className = 'mt-6 text-center';

    const homeLink = document.createElement('a');
    homeLink.href = '/'; // lien vers la page d'accueil
    homeLink.textContent = 'Back to Home';
    homeLink.setAttribute('data-link', ''); // intercepte par le router dans le main.ts
    homeLink.className = 'text-blue-600 hover:text-blue-800 text-sm';

    const separator = document.createElement('span');
    separator.className = 'mx-2 text-gray-400';
    separator.textContent = '|';

    footer.append(homeLink, separator);

    // --- Ajout des éléments au conteneur principal ---
    formContainer.append(title, buttonsContainer, footer);
    container.appendChild(formContainer); 

    // --- Event: Start button clicked ---
    startButton.addEventListener('click', async () => {
        const playerId = authData?.user?.id; // username or id ?  
        console.log('Start button clicked');

        const controller = new AbortController();
        const signal = controller.signal;
                
        try {
            await createMatch(authData?.token, playerId, signal);
            initSocketClient(playerId, buttonsContainer, controller);
        } catch (err) {
            // handle error for user feedback maybe redirect to error page ?
            console.error('Error creating waiting room:', err);
            alert('Error creating waiting room. Please try again.');
            navigateTo('/game');
        }        
     });

    return container;
}

// --- Fonction pour afficher le message d'attente + Cancel button ---
function showWaitingMessage(buttonsContainer: HTMLElement, socket: SocketIOClient.Socket, controller: AbortController) {
    buttonsContainer.innerHTML = ''; // clear the buttons
    
    const waitingMessage = document.createElement('div');
    waitingMessage.textContent = 'Waiting for an opponent...';
    waitingMessage.className = 'text-gray-700 font-semibold text-lg animate-pulse';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out';

    cancelButton.addEventListener('click', () => {
        controller.abort(); // abort the fetch request
        socket.emit('cancelMatch');
        socket.disconnect();
        navigateTo('/game');
    });

    buttonsContainer.append(waitingMessage, cancelButton);

}

// --- Fonction pour initialiser le client socket et le mettre dans le waiting room ---
function initSocketClient(playerId: number | undefined, buttonsContainer: HTMLElement, controller: AbortController) {
    const socket = io('wss://localhost:8443', {
        transports: ['websocket'],
    });
            
    socket.on('connect', () => {
        console.log('Connected to the server');
        socket.emit('authenticate', playerId);
        showWaitingMessage(buttonsContainer, socket, controller);
    });
    
    // TODO check for TypeError for data && timeout ?
    socket.on('matchFound', (data: { opponentId: string}) => {
        console.log('Match found with opponent:', data.opponentId);
        navigateTo('/game-room');
    });
            
    socket.on('disconnect', () => { 
        console.log('Disconnected from the server');
    });
    
    socket.on('error', (error: Error) => {
        console.error('Socket error:', error);
    });
}

// --- Fonction pour créer une salle d'attente ---
async function createMatch(token: string | undefined, playerId: number | undefined, signal: AbortSignal) {
    const response = await fetch('/api/game/1v1/match', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        signal: signal,
    });
    
    if (!response.ok) {
        throw new Error('Failed to create waiting room');
    };
      //const data = await response.json();  
}
