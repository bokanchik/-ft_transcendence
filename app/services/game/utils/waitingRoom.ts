import { fastify } from "../server.ts";
import { clearMatchTimeout } from "../sockets/matchSocketHandler.ts";
import { insertMatchToDB } from "../database/dbModels.ts";

// import Game from "../models/gameModel.js";

let waitingList: Map<string, string> = new Map();

// --- Waiting room system ---
export async function waitingRoom() {

    fastify.log.info('Matchmaking process activated');
    
    try {
        const player1 = firstInFirstOut();
        const player2 = firstInFirstOut();
            
        if (!player1 || !player2) {
            fastify.log.error('Matchmaking failed: one or both players not found');
            return;
        }
        
        // --- clear match timeout for matchmaking
        clearMatchTimeout(player1.socketId);
        clearMatchTimeout(player2.socketId);

        const matchId = crypto.randomUUID();
        
        // assign sides random function ?
        const player1Data = {
            matchId,
            displayName: player1.playerId,
            side: 'left',
            opponent: player2.playerId,
        };
        
        const player2Data = {
            matchId,
            displayName: player2.playerId,
            side: 'right',
            opponent: player1.playerId,
        }
        
        if (player1 && player2) { // si les jouers sont toujours dans le waiting room
            
            // put to db with game state ?

            insertMatchToDB({
                matchId,
                player1_id: player1.playerId,
                player2_id: player2.playerId,
                player1_socket: player1.socketId,
                player2_socket: player2.socketId
            });
            

            // notify players that they are matched
            fastify.io.to(player1.socketId).emit('matchFound', player1Data);
            fastify.io.to(player2.socketId).emit('matchFound', player2Data);

            removePlayerFromWaitingList(player1.socketId);
            removePlayerFromWaitingList(player2.socketId);
            return;
        } else {
            fastify.log.error('Matchmaking aborted: one or both players disconnected');
            return;
        }
        // TODO: create a game room for the players
        // dans le game room a verifier si le joueur est bien dans la room (si il a pas deconnecte avant)
        // const gameId = new Game(player1.playerId, player2.playerId);
        // fastify.log.info("Game created with ID:", gameId); // how to generate a gameId ?
        
    } catch (error) {
        fastify.log.error('Error during matchmaking:', error);
    }
        
}

// --- Simple mathcmaking system : first in first out ---
function firstInFirstOut() {
    for (const [display_name, socket] of waitingList.entries()){
        waitingList.delete(display_name);
        fastify.log.info(`Player ${display_name} with socket ${socket} removed from waiting list. List size: ${waitingList.size}`);
        return { playerId: display_name, socketId: socket };
    }
    return null;
}

// --- Waiting list management ---
export async function getWaitingList() {
    return waitingList;
}

export function getWaitingListSize() {
    return waitingList.size;
}

export async function removePlayerFromWaitingList(socketId: string) {
    for (const [id, socketCopy] of waitingList) {
        if (socketCopy === socketId) {
            waitingList.delete(id);
            fastify.log.info(`Player ${id} removed from waiting list. List size: ${waitingList.size}`);
            return;
        }
    }
    fastify.log.warn(`Player with socket ID ${socketId} not found in waiting list.`);
}

export async function addPlayerToWaitingList(display_name: string, socketId: string) {
   // check if display_name is already in waiting list
   if (waitingList.has(display_name)) {
        fastify.log.info(`Player ${display_name} with socket: ${socketId} is already in waiting list. List size: ${waitingList.size}`);
        return false;
    }
    // add display_name and socketId to waiting list
    waitingList.set(display_name, socketId );
    fastify.log.info(`Player ${display_name} with socket: ${socketId} added to waiting list. List size: ${waitingList.size}`);
    return true;
}
