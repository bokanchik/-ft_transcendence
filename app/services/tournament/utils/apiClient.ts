import { fastify } from '../server.js';
import { config } from '../shared/env.js';
import { UserOnlineStatus } from '../shared/schemas/usersSchemas.js';

const API_KEY = config.API_KEY;
const USER_SERVICE_URL = config.API_USER_URL;
const GAME_SERVICE_URL = config.API_GAME_URL;

export async function createMatchInGameService(payload: any): Promise<{ matchId: string }> {
    const url = `${GAME_SERVICE_URL}/api/game/match/internal/create`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to create match in game service");
    return response.json();
}

/**
 * Appelle le service utilisateur pour mettre à jour le statut en ligne d'un joueur.
 * @param userId L'ID de l'utilisateur à mettre à jour.
 * @param status 'online', 'offline', ou 'in-game'.
 */
export async function updateUserStatus(userId: number, status: UserOnlineStatus): Promise<void> {
    if (!API_KEY) {
        fastify.log.error('FATAL: API_KEY is not defined for inter-service communication.');
        return;
    }
    
    const url = `${USER_SERVICE_URL}/api/users/${userId}/status`;
  
    try {
        fastify.log.info(`[GameService] Notifying UserService: User ${userId} is now ${status}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            fastify.log.error(`[GameService] Failed to update user status for ${userId} to ${status}. Status: ${response.status}`, errorData);
        }

    } catch (error: any) {
        fastify.log.error(`[GameService] Network error while updating user status for ${userId}. URL: ${url}`, error.message);
    }
}

export async function startGameInGameService(payload: { matchId: string, player1_id: number, player2_id: number, tournament_id: string }): Promise<void> {
    const url = `${GAME_SERVICE_URL}/api/game/match/internal/start`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to start match in game service: ${response.status} - ${errorBody}`);
        }
    } catch (error) {
        fastify.log.error(error, 'Error calling game service to start match');
        throw error;
    }
}