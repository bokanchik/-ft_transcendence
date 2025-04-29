import fastify from "../server.js";
import db from "../database/connectDB.js";

let waitingList = [];

// for http request POST /api/game/1v1/match
export async function waitingRoom() {
    fastify.log.info('matchmakinc process activated');
    // simple mathcmaking system : first in first out
    const player1 = waitingList.shift();
    const player2 = waitingList.shift();

    fastify.log.info("SOCKET ID PLAYER 1:",player1.socketId);
    // notify players that they are matched
    fastify.io.to(player1.socketId).emit('matchFound', { opponentId: player2.playerId });
    fastify.io.to(player2.socketId).emit('matchFound', { opponentId: player1.playerId });
  
}

export async function getWaitingList() {
    return waitingList;
}

export async function getWaitingListSize() {
    return waitingList.length;
}

export async function removePlayerFromWaitingList(socket) {
    waitingList.splice(0, waitingList.length, ...waitingList.filter(player => player.socketId !== socket.id));
}

export async function addPlayerToWaitingList(playerId, socketId) {
    waitingList.push({ playerId, socketId });
    fastify.log.info(`Player ${playerId} added to waiting list. List size: ${waitingList.length}`);
}
