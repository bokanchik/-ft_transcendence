// Game match schemas
import { z } from 'zod';
export var MatchStatus;
(function (MatchStatus) {
    MatchStatus["PENDING"] = "pending";
    MatchStatus["IN_PROGRESS"] = "in_progress";
    MatchStatus["FINISHED"] = "finished";
})(MatchStatus || (MatchStatus = {}));
export const MatchStatusSchema = z.nativeEnum(MatchStatus);
// --- Base Schemas ---
export const MatchBaseSchema = z.object({
    id: z.number().int(),
    matchId: z.string(), // ou i min
    player1_id: z.number().int(),
    player2_id: z.number().int(),
    player1_socket: z.string(),
    player2_socket: z.string(),
    player1_score: z.number().int(),
    player2_score: z.number().int(),
    winner_id: z.number().nullable(),
    win_type: z.string().nullable(),
    created_at: z.string(), // Ou z.date()
    // game_type: z.string(), // ajout arthur au cas ou
    // tournament_id: z.number().int().nullable(), // ajout arthur au cas ou
    // isLocal: z.boolean().default(false), // ajout arthur au cas ou
    status: MatchStatusSchema.default(MatchStatus.PENDING)
});
// --- Schemas for API requests (Body, Params, Responses) ---
//-- Match creation for localGame
export const createLocalMatchBody = z.object({
    player1: z.string().min(1),
    player2: z.string().min(1),
}).strict();
export const createLocalMatchRouteSchema = {
    body: createLocalMatchBody,
    response: {
        201: z.object({ message: z.string() })
    }
};
// GET MATCH by MATCH_ID (unique URL)
export const MatchIdParamsSchema = z.object({
    matchId: z.string().uuid()
});
export const GetMatchIdRouteSchema = {
    params: MatchIdParamsSchema,
    response: {
        200: MatchBaseSchema,
        404: z.object({ error: z.string() })
    }
};
// GET MATCH HISTORY by USER_ID
export const MatchUserIdParamsSchema = z.object({
    userId: z.string().regex(/^\d+$/, "User ID must be a positive integer."),
    // userId: z.number().int(), // check avec arthur ? pourquoi il utilise regex -> parce que fastify t'envoie une string
});
export const GetMatchByUserIdRouteSchema = {
    params: MatchUserIdParamsSchema,
    response: {
        200: z.array(MatchBaseSchema),
        400: z.object({ error: z.string() }),
        500: z.object({ error: z.string() })
    }
};
