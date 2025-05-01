import fastify from "../server.js";
import { waitingRoom, removePlayerFromWaitingList, addPlayerToWaitingList, getWaitingListSize } from "../utils/waitingRoom.js";

// --- Socket.io handler for matchmaking ---
export async function matchSocketHandler(socket) {
   
    fastify.log.info(`Player connected: ${socket.id}`); 
   
    socket.on('authenticate', async (playerId) => {
        // store playerId and socket.id in waiting list if not already in        
        const newlyAdded = await addPlayerToWaitingList(playerId, socket.id);
        
        if (!newlyAdded) {
            fastify.log.info(`Player ${playerId} is already in waiting list. List size: ${await getWaitingListSize()}`);
            return;
        }
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
        removePlayerFromWaitingList(socket.id);
        // TODO: maybe need a full check of a game room (if player is disconnected --> need to stop the game 
        // and notify the other player)
        fastify.log.info(`Player removed: ${socket.id}`);

    });
}