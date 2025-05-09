import { fastify } from "../server.ts";
import db from "../database/connectDB.ts";
import { createMatchSchema } from "../schemas/matchSchemas.ts";
// import Game from "../models/gameModel.js";

let waitingList: Map<string, string> = new Map();
let isMatchmakingActive: boolean = false; // to prevent a race condition when two players are added to the waiting list at the same time

// --- Waiting room system ---
export async function waitingRoom() {
    if (isMatchmakingActive && waitingList.size < 2) {
        return;
    };
    isMatchmakingActive = true;
    
    fastify.log.info('Matchmaking process activated');
    
    try {
        const player1 = firstInFirstOut();
        const player2 = firstInFirstOut();
            
        if (!player1 || !player2) {
            fastify.log.error('Matchmaking failed: one or both players not found');
            return;
        }

        // put to DB (plutot a la fin)

        // notify players that they are matched
        fastify.io.to(player1.socketId).emit('matchFound', { opponentId: player2.playerId });
        fastify.io.to(player2.socketId).emit('matchFound', { opponentId: player1.playerId });
        

        // TODO: create a game room for the players
        // dans le game room a verifier si le joueur est bien dans la room (si il a pas deconnecte avant)
        // const gameId = new Game(player1.playerId, player2.playerId);
        // fastify.log.info("Game created with ID:", gameId); // how to generate a gameId ?
        
    } catch (error) {
        fastify.log.error('Error during matchmaking:', error);
    } finally {
        isMatchmakingActive = false;
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

export async function getWaitingListSize() {
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
