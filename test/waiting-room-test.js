import { io } from 'socket.io-client';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function test() {}
    const clients = [];
    const totalPlayers = 10;

    console.log('Test file started');
    for (let i = 1; i <= totalPlayers; i++) {
        const socket = io('http://localhost:3001', {
            transports: ['websocket'],
        });
        socket.on('connect', () => {
            console.log(`Player ${i} connected`);
            socket.emit('authenticate', i);
        });

        socket.on('matchFound', ({ opponentId, gameId }) => {
            console.log(`Player ${i} matched with ${opponentId}, Game ID: ${gameId}`);
        });
        socket.on('connect_error', (err) => {
            console.error(`Connection error for player ${i}:`, err.message);
        });
        clients.push(socket);
}

test().catch((error) => {
    console.error('Error in test:', error);
});

// --- TODO --- 
/** 
 * 1. Déconnexion en file d’attente : que se passe-t-il si un joueur se déconnecte alors qu’il est seul(e) dans la waiting list ?

   2. Reconnexion ou reconnection management : un joueur qui se reconnecte peut-il récupérer sa partie ?

   3. Timeout matchmaking : y a-t-il une gestion de délai si personne ne rejoint la waiting list pendant un certain temps ?

   */