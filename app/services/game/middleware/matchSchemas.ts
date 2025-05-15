// Game match schemas
import { z } from 'zod';

//-- Match creation schema with input validation (strict renvoie le msg d'erreur)
export const createMatchSchema = z.object({
    player1: z.string(),
    player2: z.string(),
    isLocal: z.boolean(),
}).strict();


// on peut extend le schema:
// const extendedMatch = createMatchSchema({
// newVal: z.sting();
// }); --> pick() or omit() for certain properties
// in existing schema
// export const accept = {

// };

// export const reject = {
// };

// export const start = {

// };
