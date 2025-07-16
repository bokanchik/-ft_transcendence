import  { timeouts } from "../pong/matchSocketHandler.ts";
import { waitingList, removePlayerFromWaitingList } from "./waitingListUtils.ts";
import  { fastify } from "../server.ts";
import { updateUserStatus } from "./apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.ts";

// --- HELPER FUNCTIONS ---- //
export function clearMatchmakingTimeout(socketId: string) {
    const timeout = timeouts.get(socketId);
    if (timeout) {
        clearTimeout(timeout);
        timeouts.delete(socketId);
    }
}

export async function cleanOnDisconnection(socketId: string) {
    fastify.log.info(`Player disconnected: ${socketId}`);
    
    const playerInfo = waitingList.get(socketId);
    await removePlayerFromWaitingList(socketId);
    clearMatchmakingTimeout(socketId);

    if (playerInfo) {
        await updateUserStatus(playerInfo.userId, UserOnlineStatus.ONLINE);
    }
}

export function makeid(length: number) {
    let res = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charLen = characters.length;
    for (let i = 0; i < length; i++) {
        res += characters.charAt(Math.floor(Math.random() * charLen));
    }
    
    return res;
}