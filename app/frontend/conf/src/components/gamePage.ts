import { getUserDataFromStorage } from '../services/authService.js';
import { navigateTo } from '../services/router.js';

export function GamePage(): HTMLElement {
    const authData = getUserDataFromStorage();

    if (!authData) {
        // optionnel: mettre un message d'erreur ou une alerte ?
        navigateTo('/login');
        return document.createElement('div');
    }

    // --- Conteneur principal ---
    const container = document.createElement('div');
    container.className = 'bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-center min-h-screen p-8';
    
    const formContainer = document.createElement('div');
    formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';
    
    // --- Formulaire HTML ---
    formContainer.innerHTML = `
    <h2 class="text-3xl font-bold mb-6 text-center text-gray-800">Welcome to the Game</h2>
        <div class="flex flex-col items-center" id = "buttons-container">
        <button id="start-button" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 transition duration-300 ease-in-out">
        Start
        </button>
        <button id="custom-settings-button" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out">
        Custom Settings
        </button>
        </div>
        <div class="mt-6 text-center">
        <a href="/" data-link class="text-blue-600 hover:text-blue-800 text-sm">
        Back to Home
        </a>
        <span class="mx-2 text-gray-400">|</span>
        </div>
        `;
        container.appendChild(formContainer);
        
        
        // make an HTTP POST request to your backend to create a match (triggered by the start button)
        const startButton = container.querySelector('#start-button');
        const buttonsContainer = container.querySelector('#buttons-container');
        
        if (startButton && buttonsContainer) {
            startButton.addEventListener('click', async () => {
                console.log('Start button clicked');
                
                const playerId = authData?.user?.id; // username or id ?
                
                try {
                    createMatch(authData?.token, playerId);
                    initSocketClient(playerId);

                    buttonsContainer.innerHTML = `
                    <div class="text-gray-700 font-semibold text-lg animate-pulse">
                    Waiting for opponent...
                    </div>
                    `;
                } catch (err) {
                        console.error('Error creating waiting room:', err);
                        alert('Error creating waiting room. Please try again.');
                    }
                });        
            }
            
            return container;
        }
        
        // --- Fonction pour créer une salle d'attente ---
        async function createMatch(token: string | undefined, playerId: number | undefined) {
            const response = await fetch('/api/game/1v1/match', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                   // 'Content-Type': 'application/json',
                },
               // body: JSON.stringify({}),
            });
            if (!response.ok) {
                throw new Error('Failed to create waiting room');
            }   //const data = await response.json();  
        };
        
        async function initSocketClient(playerId: number | undefined) {
            const socket = io('wss://localhost:8443', {
                transports: ['websocket'],
            });
            
            socket.on('connect', () => {
                console.log('Connected to the server');
                socket.emit('authenticate', playerId);            
            });
            
            // TODO check for TypeError for data
            socket.on('matchFound', (data: { opponentId: string}) => {
                console.log('Match found with opponent:', data.opponentId);
                // redirection to the game page
                navigateTo('/game-room');
            });
            
            socket.on('disconnect', () => { 
                console.log('Disconnected from the server');
            });
    
            socket.on('error', (error: Error) => {
                console.error('Socket error:', error);
            });
            
        }