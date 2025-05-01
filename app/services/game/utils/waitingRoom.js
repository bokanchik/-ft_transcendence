import fastify from "../server.js";
import db from "../database/connectDB.js";
import { create } from "../schemas/matchSchemas.js";
// import Game from "../models/gameModel.js";

let waitingList = new Map();

// for http request POST /api/game/1v1/match
export async function waitingRoom() {
    fastify.log.info('matchmaking process activated');
    const player1 = firstInFirstOut();
    const player2 = firstInFirstOut();
    
    // TODO: put players id in database, generate a gameId and store it in the database

    // notify players that they are matched
    fastify.io.to(player1.socketId).emit('matchFound', { opponentId: player2.playerId });
    fastify.io.to(player2.socketId).emit('matchFound', { opponentId: player1.playerId });
    
    // const gameId = new Game(player1.playerId, player2.playerId);
    // fastify.log.info("Game created with ID:", gameId); // how to generate a gameId ?
    
}

// simple mathcmaking system : first in first out
function firstInFirstOut() {
    for (const [id, socket] of waitingList.entries()){
        waitingList.delete(id);
        fastify.log.info(`Player ${id} with socket ${socket} removed from waiting list. List size: ${waitingList.size}`);
        return { playerId: id, socketId: socket };
    }
    return null;;
}

export async function getWaitingList() {
    return waitingList;
}

export async function getWaitingListSize() {
    return waitingList.size;
}

export async function removePlayerFromWaitingList(socket) {
    for (const [id, socketCopy] of waitingList) {
        fastify.log.info(`Type of socket: ${typeof socketCopy}`);
        fastify.log.info(`Type of socket.id: ${typeof socket.id}`);
        if (socketCopy === socket) {
            waitingList.delete(id);
            fastify.log.info(`Player ${id} removed from waiting list. List size: ${waitingList.length}`);
            return;
        }
    }
}

export async function addPlayerToWaitingList(playerId, socketId) {
   // check if playerId is already in waiting list
   if (waitingList.has(playerId)) {
        fastify.log.info(`Player ${playerId} with socket: ${socketId} is already in waiting list. List size: ${waitingList.size}`);
        return false;
    }
    // add playerId and socketId to waiting list
    waitingList.set(playerId, socketId );
    fastify.log.info(`Player ${playerId} with socket: ${socketId} added to waiting list. List size: ${waitingList.size}`);
    return true;
}
