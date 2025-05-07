// Game match schemas
import { z } from 'zod';

//-- Match creation schema
export const createMatchSchema = z.object({
    player1: z.string(),
    player2: z.string().optional(), // if mathcmaking is enabled ?
    gameMode: z.enum(['1v1', 'tournament', 'battleRoyale']),
});


// export const accept = {

// };

// export const reject = {
// };

// export const start = {

// };
