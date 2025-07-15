import { config } from '../shared/env.js';

const API_KEY = config.API_KEY;
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