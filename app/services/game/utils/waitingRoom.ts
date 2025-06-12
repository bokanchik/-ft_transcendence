import { fastify } from "../server.ts";
import { clearMatchTimeout, startRemoteGame } from "../sockets/matchSocketHandler.ts";
import { insertMatchToDB } from "../database/dbModels.ts";
import { updateStatus } from "../database/dbModels.ts";
import type { Socket } from "socket.io";
// @ts-ignore
import { TIMEOUT_MS } from "../shared/gameTypes.ts";
const timeouts: Map<string, NodeJS.Timeout> = new Map();

// import Game from "../models/gameModel.js";

type PlayerInfo = {
    display_name: string;
    userId: number;
    socket: Socket;
}

let waitingList: Map<string, PlayerInfo> = new Map();

export async function waitingRoomHandler(socket: Socket) {
    
    socket.on('authenticate', async ({ display_name, userId }) => {
        try {
            // store display_name and socket.id in waiting list if not already in        
            const newPlayer = await addPlayerToWaitingList(display_name, userId, socket);
            
            if (newPlayer) {
                socket.emit('inQueue');
                // set timeout of 1 min for matchmaking process
                const timeout = setTimeout(() => {
                    fastify.log.info(`Timeout of matchmaking for player: ${display_name}`);
                    socket.emit('matchTimeout');
                    cleanOnDisconnection(socket.id);
                }, TIMEOUT_MS);
                timeouts.set(socket.id, timeout);
            }
            // call to waiting room
            await tryMatchPlayers();
        } catch (err: unknown) {
            fastify.log.error(`Error during matchmaking process: ${err}`);
            throw err;
        }
    });

}

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
        clearMatchTimeout(player1.socket.id);
        clearMatchTimeout(player2.socket.id);

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
        
        if (player1 && player2) {

            insertMatchToDB({
                matchId,
                player1_id: player1.userId,
                player2_id: player2.userId,
                player1_socket: player1.socket.id,
                player2_socket: player2.socket.id
            });
            
            updateStatus('in_progress', matchId);

            // notify players that they are matched
            fastify.io.to(player1.socket.id).emit('matchFound', player1Data);
            fastify.io.to(player2.socket.id).emit('matchFound', player2Data);
            
            removePlayerFromWaitingList(player1.socket.id);
            removePlayerFromWaitingList(player2.socket.id);

            startRemoteGame(player1.socket, player2.socket, matchId);
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

export function addPlayerToWaitingList(display_name: string, userId: number, socket: Socket) {
   // check if display_name is already in waiting list
   if (waitingList.has(socket.id)) {
        fastify.log.info(`Player ${display_name} with socket: ${socket.id} is already in waiting list. List size: ${waitingList.size}`);
        return false;
    }
    // add display_name and socket.id to waiting list
    waitingList.set(socket.id, { display_name, userId, socket } );
    fastify.log.info(`Player ${display_name} with socket: ${socket.id} added to waiting list. List size: ${waitingList.size}`);
    return true;
}

// --- Helper functions
let matchmakingLock = false;

async function tryMatchPlayers() {
    if (matchmakingLock || getWaitingListSize() < 2) return;
    matchmakingLock = true;
    try {
        await waitingRoom();
    } finally {
        matchmakingLock = false;
    }
}

export function cleanOnDisconnection(socketId: string) {
    fastify.log.info(`Player disconnected: ${socketId}`);
    removePlayerFromWaitingList(socketId);
    clearMatchTimeout(socketId);
}
