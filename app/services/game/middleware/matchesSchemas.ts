// Game match schemas
import { z } from 'zod';

export enum MatchStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    FINISHED = 'finished'
}

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

export type Match = z.infer<typeof MatchBaseSchema>;

// --- Schemas for API requests (Body, Params, Responses) ---

//-- Create a local match ---
export const createLocalMatchBody = z.object({
    player1: z.string().min(1),
    player2: z.string().min(1),
}).strict();

export type createLocalMatchRequestBody = z.infer<typeof createLocalMatchBody>;

export const createLocalMatchRouteSchema = {
    body: createLocalMatchBody,
    response: {
        201: z.object({ message: z.string() })
    }
};

//  --- Invite a friend to play --- 
export const inviteFriendBody = z.object({
    friendUserId: z.string().regex(/^\d+$/, "User ID must be a positive integer."),
    // inviterDisplayName: z.string(),
}).strict();

export type inviteFriendRequestBody = z.infer<typeof inviteFriendBody>;

export const InviteFriendRouteSchema = {
    body: inviteFriendBody,
    response: {
        201: z.object({ message: z.string() })
    }
};

// --- Get Match by MatchId (which is unique URL) ---
export const MatchIdParamsSchema = z.object({
    matchId: z.string().uuid()
})

export type MatchIdParams = z.infer<typeof MatchIdParamsSchema>;

export const GetMatchIdRouteSchema = {
    params: MatchIdParamsSchema,
    response: {
        200: MatchBaseSchema,
        404: z.object({ error: z.string() })
    }
};

// --- Get Match History by UserID --- 
export const MatchUserIdParamsSchema = z.object({
    userId: z.string().regex(/^\d+$/, "User ID must be a positive integer."),
});

export type MatchUserIdParams = z.infer<typeof MatchUserIdParamsSchema>;

export const GetMatchByUserIdRouteSchema = {
    params: MatchUserIdParamsSchema,
    response: {
        200: z.array(MatchBaseSchema),
        400: z.object({ error: z.string() }),
        500: z.object({ error: z.string() })
    }
}

