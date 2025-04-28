import fastify from "fastify";
import waitingList from "../utils/waitingList.js";

export async function matchSocketHandler(socket) {
    fastify.io.on('connection', (socket) => {
        fastify.log.info('Player connected: ' + socket.id);
        // join a waiting room
        socket.on('joinWaitingRoom', async (playerId) => {
            socket.join('waitingRoom');
            fastify.log.info('Player ' + playerId + ' joined waiting room');
        });
            
        socket.on('disconnect', () => {
            fastify.log.info('Player disconnected: ' + socket.id);
            // remove player from waiting list
            waitingList = waitingList.filter(player => player.socketId !== socket.id);
        });
    });
}