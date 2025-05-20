import { fastify } from "../server.ts";
import type { Socket } from "socket.io";
import { waitingRoom, removePlayerFromWaitingList, addPlayerToWaitingList, getWaitingListSize } from "../utils/waitingRoom.ts";
import db from '../database/connectDB.ts';

import { fetchFirst, getRowById } from "../database/dbModels.ts";

const TIMEOUT_MS = 60000; // 1 minute
const timeouts: Map<string, NodeJS.Timeout> = new Map();

// --- Socket.io handler for local and remote games ---
export async function matchSocketHandler(socket: Socket): Promise<void> {
   
    fastify.log.info(`Player connected: ${socket.id}`); 

    localSocketEvents(socket);
    onlineSocketEvents(socket);
}

// --- Main function for remote game socket handling
function onlineSocketEvents(socket: Socket) {

    socket.on('authenticate', async (display_name: string) => {
        try {
            // store display_name and socket.id in waiting list if not already in        
            const newPlayer = await addPlayerToWaitingList(display_name, socket.id);
            
            if (newPlayer) {
                // set timeout of 1 min for matchmaking process
                const timeout = setTimeout(() => {
                    fastify.log.info(`Timeout of matchmaking for player: ${display_name}`);
                    socket.emit('matchTimeout');
                    removePlayerFromWaitingList(socket.id);
                    timeouts.delete(socket.id);
                }, TIMEOUT_MS);
                timeouts.set(socket.id, timeout);
            }
            // call to waiting room
            tryMatchPlayers();
        } catch (err: unknown) {
            fastify.log.error(`Error during matchmaking process: ${err}`);
        }
    });
    
    // optionnel ? a voir si besoin de ce listener
    socket.on('startOnlineGame', () => {
        fastify.log.info('Online game started');
        // update game_status to 'in_progress'
    });

    socket.on('playerMove', (movement) => {
        fastify.log.info(movement);
        // handlePlayerMove(); // la logique du jeu est ici (ca update le state du jeu)
    });

    // quit Button on game
    socket.on('quit', async (socketId: string) =>  {

        fastify.log.info(`Player with socket id ${socketId} quit the game`);
        // TODO: maybe need to check if game is Online ? 
        try {
            const opponentSocketId: string | null = await getOpponentSocketId(socketId);
            if (opponentSocketId) {
                fastify.io.to(opponentSocketId).emit('gameFinished', 'You won!');
                // update game_status to 'finished'
            }
        } catch (err: unknown) {
            fastify.log.error(`Failed to find opponentSocketId: ${err}`);
        }
    });

    socket.on('disconnect', () => {
        try {
            fastify.log.info(`Player disconnected: ${socket.id}`);
            // remove player from waiting list id nedeed
            removePlayerFromWaitingList(socket.id);
            clearMatchTimeout(socket.id);
            fastify.log.info(`Player removed: ${socket.id}`);
        } catch (error) {
            fastify.log.error(`Error during disconnection: ${error}`);
        }
    });
    
    // "cancel" button clicked on frontend while the player is in waitingRoom
    socket.on('cancelMatch', () => {
        try {
            fastify.log.info(`Player disconnected: ${socket.id}`);
            removePlayerFromWaitingList(socket.id);
            clearMatchTimeout(socket.id);
            fastify.log.info(`Player removed from waiting list: ${socket.id}`);
            
        } catch (error) {
            fastify.log.error(`Error during disconnection: ${error}`);
        }
    });
    

}

async function getOpponentSocketId(socketId: string): Promise<string | null> {
    const sql = `
        SELECT * FROM matches
        WHERE player1_socket = ? OR player2_socket = ?
        ORDER BY created_at DESC
        LIMIT 1
    `;

    try {
        const match = await fetchFirst(db, sql, [socketId, socketId]);
        if (!match) return null;       
        // fastify.log.info("PLAYER 1 SOCKET:" + match.player1_socket);
        // fastify.log.info("PLAYER 2 SOCKET:" + match.player2_socket);
        if (match.player1_socket === socketId) {
            return match.player2_socket;
        } else {
            return match.player1_socket;
        }
    } catch (err: unknown) {
        fastify.log.error(`Failed to find the match: ${err}`);
        return null;
    }
}

function localSocketEvents(socket: Socket) {
    
    // --- !!! TESTING FOR LOCAL ----
    socket.on('startLocalGame', () => {
        fastify.log.info('Game started locally');
        socket.emit('gameStarted');
    });
    // -------------------------------
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

export function clearMatchTimeout(socketId: string) {
    const timeout = timeouts.get(socketId);
    if (timeout) {
        clearTimeout(timeout);
        timeouts.delete(socketId);
    }
}
