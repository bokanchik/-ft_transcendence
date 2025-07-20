import { handleApiResponse } from './responseService.js';
import { z } from 'zod';

const TOURNAMENT_API_PREFIX = '/api/tournament'; 

const PlayerStatusResponseSchema = z.object({
    activeTournamentId: z.string().uuid().nullable(),
});

export async function checkPlayerTournamentStatus(): Promise<string | null> {
    try {
        const response = await fetch(`${TOURNAMENT_API_PREFIX}/player-status`, {
             credentials: 'include',
        });
        
        if (response.status === 401) {
            return null;
        }
        
        const data = await handleApiResponse(response, { 200: PlayerStatusResponseSchema });
        return data.activeTournamentId;
    } catch (error) {
        console.error("Failed to check player tournament status:", error);
        return null;
    }
}