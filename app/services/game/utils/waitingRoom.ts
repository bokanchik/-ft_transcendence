import { fastify } from "../server.ts";
import { clearMatchTimeout } from "../sockets/matchSocketHandler.ts";
import { insertMatchToDB } from "../database/dbModels.ts";
import { updateStatus } from "../database/dbModels.ts";

// import Game from "../models/gameModel.js";

type PlayerInfo = {
    display_name: string;
    userId: string;
    socketId: string;
}

let waitingList: Map<string, PlayerInfo> = new Map();

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
            displayName: player1.display_name,
            side: 'left',
            opponent: player2.display_name,
        };
        
        const player2Data = {
            matchId,
            displayName: player2.display_name,
            side: 'right',
            opponent: player1.display_name,
        }
        
        if (player1 && player2) { // si les jouers sont toujours dans le waiting room
            
            // put to db with game state ?

            insertMatchToDB({
                matchId,
                player1_id: player1.userId,
                player2_id: player2.userId,
                player1_socket: player1.socketId,
                player2_socket: player2.socketId
            });
            
            updateStatus('in_progress', matchId);

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
    } catch (error) {
        fastify.log.error('Error during matchmaking:', error);
    }
}

// --- Simple mathcmaking system : first in first out ---
function firstInFirstOut() {
    for (const [socketId, playerInfo] of waitingList.entries()){
        waitingList.delete(socketId);
        fastify.log.info(`Player ${playerInfo.display_name} with socket ${socketId} removed from waiting list. List size: ${waitingList.size}`);
        return playerInfo;
    }
    return null;
}

// --- Waiting list management ---
export function getWaitingListSize() {
    return waitingList.size;
}

export async function removePlayerFromWaitingList(socketId: string) {
    if (waitingList.has(socketId)) {
        const player = waitingList.get(socketId);
        waitingList.delete(socketId);
        fastify.log.info(`Player ${player?.display_name} removed from waiting list. List size: ${waitingList.size}`);
    }
   // fastify.log.warn(`Player with socket ID ${socketId} not found in waiting list.`);
}

export function addPlayerToWaitingList(display_name: string, userId: string, socketId: string) {
   // check if display_name is already in waiting list
   if (waitingList.has(socketId)) {
        fastify.log.info(`Player ${display_name} with socket: ${socketId} is already in waiting list. List size: ${waitingList.size}`);
        return false;
    }
    // add display_name and socketId to waiting list
    waitingList.set(socketId, { display_name, userId, socketId } );
    fastify.log.info(`Player ${display_name} with socket: ${socketId} added to waiting list. List size: ${waitingList.size}`);
    return true;
}
