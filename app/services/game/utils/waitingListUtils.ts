import type { Socket } from "socket.io";
import { fastify } from "../server.ts";

export let waitingList: Map<string, PlayerInfo> = new Map();

type PlayerInfo = {
    display_name: string;
    userId: number;
    socket: Socket;
}

// --- Simple mathcmaking system : first in first out ---
export function firstInFirstOut() {
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