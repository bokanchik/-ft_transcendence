import { fastify } from '../server.js';
import { config } from '../shared/env.js';
import { UserOnlineStatus } from '../shared/schemas/usersSchemas.js';

const API_KEY = config.API_KEY;
const USER_SERVICE_URL = config.API_USER_URL;

/**
 * Appelle le service utilisateur pour mettre à jour les statistiques d'un joueur.
 * @param userId L'ID de l'utilisateur à mettre à jour.
 * @param result 'win' ou 'loss'.
 */
export async function updatePlayerStats(userId: number, result: 'win' | 'loss'): Promise<void> {
    if (!API_KEY) {
        fastify.log.error('FATAL: GAME_SERVICE_API_KEY is not defined!');
        return;
    }

    try {
        const response = await fetch(`${USER_SERVICE_URL}/api/users/${userId}/stats`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
            },
            body: JSON.stringify({ result }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            fastify.log.error(`Failed to update stats for user ${userId}. Status: ${response.status}`, errorData);
        } else {
            fastify.log.info(`Successfully updated stats for user ${userId} with result: ${result}`);
        }
    } catch (error) {
        fastify.log.error(`Network error while trying to update stats for user ${userId}:`, error);
    }
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