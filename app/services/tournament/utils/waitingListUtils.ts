import type { Socket } from "socket.io";
import { fastify } from "../server.ts";

export type PlayerInfo = {
    display_name: string;
    userId: number;
    socket: Socket;
}

export const tournamentQueues: Map<number, PlayerInfo[]> = new Map([
    [2, []],
    [4, []],
    [8, []],
]);

export function removePlayerFromTournamentQueues(socketId: string) {
    for (const [size, queue] of tournamentQueues.entries()) {
        const index = queue.findIndex(p => p.socket.id === socketId);
        if (index > -1) {
            const player = queue.splice(index, 1)[0];
            fastify.log.info(`Player ${player.display_name} removed from tournament queue size ${size}.`);
            return;
        }
    }
}