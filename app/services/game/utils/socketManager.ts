import { AuthenticatedSocket } from "../types/AuthenticatedSocket";

// Map pour une recherche O(1)
const userIdToSocketMap = new Map<number, AuthenticatedSocket>();

export function addSocket(socket: AuthenticatedSocket): void {
    if (socket.playerInfo) {
        // Gérer le cas où un utilisateur se connecte depuis plusieurs onglets
        const existingSocket = userIdToSocketMap.get(socket.playerInfo.userId);
        if (existingSocket && existingSocket.id !== socket.id) {
            existingSocket.emit('forceDisconnect', { message: 'Vous vous êtes connecté depuis un autre appareil.' });
            existingSocket.disconnect();
        }
        userIdToSocketMap.set(socket.playerInfo.userId, socket);
    }
}

export function removeSocket(socket: AuthenticatedSocket): void {
    if (socket.playerInfo) {
        // On ne supprime que si le socket est le même que celui enregistré
        // pour éviter qu'une ancienne connexion ne supprime la nouvelle.
        const storedSocket = userIdToSocketMap.get(socket.playerInfo.userId);
        if (storedSocket && storedSocket.id === socket.id) {
            userIdToSocketMap.delete(socket.playerInfo.userId);
        }
    }
}

export function findSocketByUserId(userId: number): AuthenticatedSocket | undefined {
    return userIdToSocketMap.get(userId);
}