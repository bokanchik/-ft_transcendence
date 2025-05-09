import { fastify } from "../server.ts";
import type { Socket } from "socket.io";
import { waitingRoom, removePlayerFromWaitingList, addPlayerToWaitingList, getWaitingListSize } from "../utils/waitingRoom.ts";

// --- Socket.io handler for matchmaking ---
export async function matchSocketHandler(socket: Socket): Promise<void> {
   
    fastify.log.info(`Player connected: ${socket.id}`); 
    
    // --- !!! TESTING FOR LOCAL ----
    socket.on('startLocalGame', async () => {
        fastify.log.info('Game started locally');
        socket.emit('gameStarted');
    });

    socket.on('playerMove', (movement) => {
        fastify.log.info(movement);
        //handlePlayerMove();
    });
    // -----------------------------------
    
    socket.on('authenticate', async (display_name: string) => {
        // store display_name and socket.id in waiting list if not already in        
        try {
            const newlyAdded = await addPlayerToWaitingList(display_name, socket.id);
            
            if (!newlyAdded) {
                fastify.log.info(`Player ${display_name} is already in waiting list. List size: ${await getWaitingListSize()}`);
                return;
            }
            
            const size = await getWaitingListSize();
            // matchmaking process
            if (size >= 2){
                // join a waiting room
                await waitingRoom();
            }
        } catch (error) {
            fastify.log.error(`Error during authentication: ${error}`);
        }
    });
    
    socket.on('disconnect', () => {
        try {
            fastify.log.info(`Player disconnected: ${socket.id}`);
            // remove player from waiting list
            removePlayerFromWaitingList(socket.id);
            // TODO: maybe need a full check of a game room (if player is disconnected --> need to stop the game 
            // and notify the other player)
            fastify.log.info(`Player removed: ${socket.id}`);
        } catch (error) {
            fastify.log.error(`Error during disconnection: ${error}`);
        }
    });

    // "cancel" button clicked on frontend
    socket.on('cancelMatch', () => {
        try {
            fastify.log.info(`Player disconnected: ${socket.id}`);
            removePlayerFromWaitingList(socket.id);
            fastify.log.info(`Player removed: ${socket.id}`);

        } catch (error) {
            fastify.log.error(`Error during disconnection: ${error}`);
        }
    });
}