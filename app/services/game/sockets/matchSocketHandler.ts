import { fastify } from "../server.ts";
import type { Socket } from "socket.io";
import { waitingRoomHandler, cleanOnDisconnection } from "../utils/waitingRoom.ts";
import { getOpponentSocketId, getRowByMatchId, setGameResult } from "../database/dbModels.ts";
import { createGameState } from "./pongGame.ts";
// @ts-ignore
import { GameState, FRAME_RATE } from "../shared/gameTypes.js";
import { gameLoop, handleKeydown, handleKeyup, handleKeydownRemote, handleKeyupRemote} from "./pongGame.ts";

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

const gameRooms = {};
const state = {};
const players = {};

function serverSocketEvents(socket: Socket) {
    
    
    socket.on('startLocal',  () => {    
        fastify.log.info('Game started locally'); 
        const state = createGameState();
        startLocalGameInterval(state, socket);      
    });
    
    socket.on('keydown', (keyCode: string) => {
        const roomName = gameRooms[socket.id];
        const playerSide = players[socket.id];
        if (roomName && playerSide){
            handleKeydownRemote(parseInt(keyCode), playerSide, state);
        }
    });
    
    socket.on('keyup', (keyCode: string) => {
        const roomName = gameRooms[socket.id];
        const playerSide = players[socket.id];
        if (roomName && playerSide) {
            handleKeyupRemote(parseInt(keyCode), playerSide, state);
        }
    })
    
}


export function startRemoteGame(client1: Socket, client2: Socket, matchId: string) {    
    let roomName = makeid(5);

    client1.join(roomName);
    client2.join(roomName);

    gameRooms[client1.id] = roomName;
    gameRooms[client2.id] = roomName;

    players[client1.id] = 'left';
    players[client2.id] = 'right';

    state[roomName] = createGameState();
    
    startRemoteGameInterval(state[roomName], roomName, matchId);
    
}

async function startRemoteGameInterval(state: GameState, roomName: string, matchId: string) {

    const intervalId = setInterval(async ()  => {
        const winner: number = gameLoop(state, 'remote'); // if == 0, game continue, == 1, player 1 win, == 2 player 2 won
        
        if (!winner) {
            fastify.io.to(roomName).emit('gameState', state);
        } else {
            fastify.io.to(roomName).emit('gameOver');
            
            const match = await getRowByMatchId(matchId);
            if (winner == 1) {
                setGameResult(matchId, state.score1, state.score2, match.player1_id, 'score');
            } else if (winner == 2) {
                setGameResult(matchId, state.score1, state.score2, match.player2_id, 'score');
            }
            clearInterval(intervalId);
        }
    }, 1000 / FRAME_RATE);
    
    timeouts.set(roomName, intervalId);
}


function startLocalGameInterval(state: GameState, socket: Socket) {

    socket.on('keydown', (keyCode: string) => {
        handleKeydown(parseInt(keyCode))
    });
    
    socket.on('keyup', (keyCode: string) => {
        handleKeyup(parseInt(keyCode));
    });
    
    const intervalId = setInterval(() => {
        const winner: number = gameLoop(state, 'local'); // if == 0, game continue, == 1, player 1 win, == 2 player 2 won
        
        if (!winner) {
            socket.emit('gameState', state);
        } else {
            socket.emit('gameOver');
            clearInterval(intervalId);
            return;
        }
    }, 1000 / FRAME_RATE);
    
    socket.on('quitGame', () => {
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