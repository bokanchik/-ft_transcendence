import { fastify } from "../server.ts";
import type { Socket } from "socket.io";
import { waitingRoom, removePlayerFromWaitingList, addPlayerToWaitingList, getWaitingListSize } from "../utils/waitingRoom.ts";
import db from '../database/connectDB.ts';

import { fetchFirst, getRowByMatchId, setGameResult, updateStatus } from "../database/dbModels.ts";

const TIMEOUT_MS = 60000; // 1 minute
const timeouts: Map<string, NodeJS.Timeout> = new Map();

// --- Socket.io handler for local and remote games ---
export async function matchSocketHandler(socket: Socket): Promise<void> {
   
    fastify.log.info(`Player connected: ${socket.id}`); 

    localSocketEvents(socket);
    onlineSocketEvents(socket);
}

// --- Main function for remote game socket handling
async function onlineSocketEvents(socket: Socket) {
    waitingRoomHandler(socket);
    gameRoutine(socket);
    disconnectionHandler(socket);
}

async function waitingRoomHandler(socket: Socket) {
    
    socket.on('authenticate', async ({ display_name, username }) => {
        try {
            // store display_name and socket.id in waiting list if not already in        
            const newPlayer = await addPlayerToWaitingList(display_name,username, socket.id);
            
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

// --- Main function for game routine handling 
async function gameRoutine(socket: Socket) {
    socket.on('playerMove', (movement) => {
        fastify.log.info(movement);
        // handlePlayerMove(); // la logique du jeu est ici (ca update le state du jeu)
    });
}

async function disconnectionHandler(socket: Socket)  {
    
    // quit Button on game
    socket.on('quit', async (matchId: string, opponentId: string) =>  {
        
        fastify.log.info(`Player with socket id ${socket.id} quit the game`);
        try {
            const opponentSocketId: string | null = await getOpponentSocketId(socket.id);
            if (opponentSocketId) {
                fastify.io.to(opponentSocketId).emit('gameFinished', matchId);
                // --- TEST ---
                // : on a besoin de recuperer le score !! pour le test 0:0
                await setGameResult(matchId, 0, 0, opponentId, 'opponent left the game');
                // -------------
            }
        } catch (err: unknown) {
            fastify.log.error(`Failed to find opponentSocketId: ${err}`);
            throw err;
        }
    });
    
    socket.on('disconnect', () => {
        cleanOnDisconnection(socket.id)
    });
    
    // "cancel" button clicked on frontend while the player is in waitingRoom
    socket.on('cancelMatch', () => {
        cleanOnDisconnection(socket.id);
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

function cleanOnDisconnection(socketId: string) {
    fastify.log.info(`Player disconnected: ${socketId}`);
    removePlayerFromWaitingList(socketId);
    clearMatchTimeout(socketId);
}

export function clearMatchTimeout(socketId: string) {
    const timeout = timeouts.get(socketId);
    if (timeout) {
        clearTimeout(timeout);
        timeouts.delete(socketId);
    }
}
