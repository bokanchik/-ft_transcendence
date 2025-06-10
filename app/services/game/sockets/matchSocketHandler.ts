import { fastify } from "../server.ts";
import type { Socket } from "socket.io";
import db from '../database/connectDB.ts';
import { waitingRoom, removePlayerFromWaitingList, addPlayerToWaitingList, getWaitingListSize } from "../utils/waitingRoom.ts";
import { fetchFirst, setGameResult } from "../database/dbModels.ts";
// import { handlePlayerMove } from "./pongGame.ts";
// import { PongGame } from "../sockets/pongGame.ts";
import { createGameState, resetScore } from "./pongGame.ts";
// @ts-ignore
import { GameState, FRAME_RATE, TIMEOUT_MS } from "../shared/gameTypes.js";
import { gameLoop, handleKeydown, handleKeyup} from "./pongGame.ts";

const timeouts: Map<string, NodeJS.Timeout> = new Map();
//export let gameList: Map<string, PongGame> = new Map(); // string pour matchId

// --- Socket.io handler for local and remote games ---
export async function matchSocketHandler(socket: Socket): Promise<void> {
   
    fastify.log.info(`Player connected: ${socket.id}`); 

    onlineGameInit(socket);
    serverSocketEvents(socket);
}

// --- Main function for remote game socket handling
async function onlineGameInit(socket: Socket) {
    waitingRoomHandler(socket);
    disconnectionHandler(socket);
}

async function waitingRoomHandler(socket: Socket) {
    
    socket.on('authenticate', async ({ display_name, userId }) => {
        try {
            // store display_name and socket.id in waiting list if not already in        
            const newPlayer = await addPlayerToWaitingList(display_name, userId, socket.id);
            
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

const clientRooms = {};
const state = {};
const gameModes = {};

function serverSocketEvents(socket: Socket) {
    
    socket.on('startRemote', () => {
        fastify.log.info('Game started in remote mode');
        gameModes[socket.id] = 'remote';
        startRemoteGame(socket);
    })
    

    socket.on('startLocal',  () => {    
        fastify.log.info('Game started locally'); 
        gameModes[socket.id] = 'local';
        const state: GameState = createGameState();
        startLocalGameInterval(state, socket);      
    });
    
    socket.on('keydown', (keyCode: string) => {
        if (gameModes[socket.id] === 'remote') {
            if (keyCode !== '38' && keyCode !== '40') return;
        }
        handleKeydown(parseInt(keyCode))
    });
    
    socket.on('keyup', (keyCode: string) => {
        if (gameModes[socket.id] === 'remote') {
            if (keyCode !== '38' && keyCode !== '40') return;
        }
        handleKeyup(parseInt(keyCode));
    });
    
}


function startRemoteGame(client: Socket) {
    fastify.log.info(`Client socket: ` + client.id);
    
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    // emit roomName ?
    state[roomName] = createGameState();
    client.join(roomName);
    
    fastify.log.info(state[roomName]);
    // start game for this room
    startRemoteGameInterval(state[roomName], client, roomName);
    
}

function startRemoteGameInterval(state: GameState, socket: Socket, roomName: string) {
    const intervalId = setInterval(() => {
        const winner: number = gameLoop(state, socket); // if == 0, game continue, == 1, player 1 win, == 2 player 2 won
        
        if (!winner) {
            socket.to(roomName).emit('gameState', state);
            socket.emit('gameState', state);
        } else {
            socket.emit('gameOver');
            resetScore();
            clearInterval(intervalId);
        }
    }, 1000 / FRAME_RATE);
    
    socket.on('quitGame', () => {
        resetScore();
        clearInterval(intervalId);
        return ;
    })
}


function startLocalGameInterval(state: GameState, socket: Socket) {
    const intervalId = setInterval(() => {
        const winner: number = gameLoop(state, socket); // if == 0, game continue, == 1, player 1 win, == 2 player 2 won
        
        if (!winner) {
            socket.emit('gameState', state);
        } else {
            socket.emit('gameOver');
            resetScore();
            clearInterval(intervalId);
        }
    }, 1000 / FRAME_RATE);
    
    socket.on('quitGame', () => {
        resetScore();
        clearInterval(intervalId);
        return ;
    })
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
   //     resetScore();
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

function makeid(length: number) {
    let res = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charLen = characters.length;
    for (let i = 0; i < length; i++) {
        res += characters.charAt(Math.floor(Math.random() * charLen));
    }
    
    return res;
}