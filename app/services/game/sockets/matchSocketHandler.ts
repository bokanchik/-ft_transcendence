import { fastify } from "../server.ts";
import type { Socket } from "socket.io";
import { waitingRoomHandler, cleanOnDisconnection } from "../utils/waitingRoom.ts";
import { getOpponentSocketId, setGameResult } from "../database/dbModels.ts";
import { createGameState, resetScore } from "./pongGame.ts";
// @ts-ignore
import { GameState, FRAME_RATE } from "../shared/gameTypes.js";
import { gameLoop, handleKeydown, handleKeyup} from "./pongGame.ts";

const timeouts: Map<string, NodeJS.Timeout> = new Map();

// --- Socket.io handler for local and remote games ---
export async function matchSocketHandler(socket: Socket): Promise<void> {
    onlineGameInit(socket);
    serverSocketEvents(socket);
}

// --- Main function for waiting room handling
async function onlineGameInit(socket: Socket) {
    waitingRoomHandler(socket);
    disconnectionHandler(socket);
}

const clientRooms = {};
const state = {};
const players = {};

function serverSocketEvents(socket: Socket) {
    
    socket.on('startRemote', () => {
        fastify.log.info('Game started in remote mode');
        fastify.log.info('New client connected with id: ' + socket.id);
        startRemoteGame(socket);
    })
    
    socket.on('startLocal',  () => {    
        fastify.log.info('Game started locally'); 
        const state = createGameState();
        startLocalGameInterval(state, socket);      
    });
    
    socket.on('keydown', (keyCode: string) => {
        handleKeydown(parseInt(keyCode))
    });
    
    socket.on('keyup', (keyCode: string) => {
        handleKeyup(parseInt(keyCode));
    });
    
}


function startRemoteGame(client: Socket) {    
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
            socket.emit('gameState');
        } else {
            socket.to(roomName).emit('gameOver');
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
            return;
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


// --- HELPER FUNCTIONS ---- //
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