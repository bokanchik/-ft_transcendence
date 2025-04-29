import fastify from "../server.js";
import { removePlayerFromWaitingList, addPlayerToWaitingList, waitingRoom, getWaitingListSize } from "../utils/waitingRoom.js";

export async function matchSocketHandler(socket) {
    fastify.log.info('Player connected: ' + socket.id); 
    socket.on('authenticate', async (playerId) => {
        // store playerId and socket.id in waiting list
        
        addPlayerToWaitingList(playerId, socket.id);
        
        // join a waiting room
        socket.join('waitingRoom');
        
        const size = await getWaitingListSize();
        // matchmaking process
        if (size >= 2){
            await waitingRoom();
        }
    });
            
    socket.on('disconnect', () => {
        fastify.log.info('Player disconnected: ' + socket.id);
        // remove player from waiting list
        removePlayerFromWaitingList(socket);
        fastify.log.info('Player ' + socket.id + ' removed from waiting room');
    });
}