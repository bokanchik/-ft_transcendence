// Game match schemas
import { z } from 'zod';

//-- Match creation schema with input sanitazing (strict renvoie le msg d'erreur)
export const createMatchSchema = z.object({
    player1: z.string(),
    player2: z.string(),
    isLocal: z.boolean(),
}).strict();


// export const accept = {

// };

// export const reject = {
// };

// export const start = {

// };
