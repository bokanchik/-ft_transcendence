// Game match schemas
import { z } from 'zod';

//-- Match creation schema
export const createMatchSchema = z.object({
    player1: z.string().optional(),
    player2: z.string().optional(),
    isLocal: z.boolean(),
});


// export const accept = {

// };

// export const reject = {
// };

// export const start = {

// };
