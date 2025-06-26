import { fastify } from '../server.js';
import { config } from '../shared/env.js';

const API_KEY = config.API_KEY;

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
        const response = await fetch(`http://users:4000/api/users/${userId}/stats`, {
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