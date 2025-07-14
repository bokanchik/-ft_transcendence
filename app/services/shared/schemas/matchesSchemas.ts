// Game match schemas
import { z } from 'zod';

export enum MatchStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    FINISHED = 'finished'
}
export const MatchStatusSchema = z.nativeEnum(MatchStatus);

export type GameMode = 'local' | 'remote' | 'tournament' | 'onlineTournament';

// --- Local Match Schemas  ---
export const LocalMatchBaseSchema = z.object({
    matchId: z.string().uuid(),
    player1: z.string(),
    player2: z.string(),
    startTime: z.string().datetime(),
});

export const LocalMatchStateSchema = z.object({
    leftPaddle: z.object({
        y: z.number(),
    }),
    rightPaddle: z.object({
        y: z.number(),
    }),
    ball: z.object({
        x: z.number(),
        y: z.number(),
    }),
    score1: z.number(),
    score2: z.number(),
});

//--- Create a local match ---
export const createLocalMatchBody = z.object({
    player1: z.string().min(1),
    player2: z.string().min(1),
}).strict();
export type createLocalMatchRequestBody = z.infer<typeof createLocalMatchBody>;

export const createLocalMatchRouteSchema = {
    body: createLocalMatchBody,
    response: {
        201: LocalMatchBaseSchema,
    }
};

// --- Get Local Match State ----
export const getLocalMatchStateParams = z.object({
    matchId: z.string().uuid()
}).strict();

export const getLocalMatchStateRouteSchema = {
    params: getLocalMatchStateParams,
    response: {
        200: LocalMatchStateSchema,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() })
    }
}

//--- Cancel local match ---
export const cancelLocalMatchBody = z.object({
    matchId: z.string().uuid()
}).strict();

export const cancelLocalMatchRouteSchema = {
    body: cancelLocalMatchBody,
    response: {
        200: z.object({ message: z.string() }),
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() })
    }
}

// ---------------------------------------------------------------------------------------- //

// --- Base Schemas ---
export const MatchBaseSchema = z.object({
    id: z.number().int(),
    matchId: z.string(), // ou i min
    player1_id: z.number().int(),
    player2_id: z.number().int(),
    player1_socket: z.string().nullable(), // Nullable if player is not connected
    player2_socket: z.string().nullable(), // Nullable if player is not connected
    player1_score: z.number().int().default(0),
    player2_score: z.number().int().default(0),
    winner_id: z.number().nullable(),
    win_type: z.string().nullable(),
    created_at: z.string(), // Ou z.date()
    tournament_id: z.string().nullable(),
    status: MatchStatusSchema.default(MatchStatus.PENDING)
});
export type Match = z.infer<typeof MatchBaseSchema>;

// GET MATCH by MATCH_ID (unique URL)
export const MatchIdParamsSchema = z.object({
    matchId: z.string().uuid()
})

export type MatchIdParams = z.infer<typeof MatchIdParamsSchema>;

export const GetMatchIdRouteSchema = {
    params: MatchIdParamsSchema,
    response: {
        200: MatchBaseSchema,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
        500: z.object({ error: z.string() })
    }
};

// GET MATCH HISTORY by USER_ID
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

export interface MatchHistoryComponentProps {
	userId: number;
}