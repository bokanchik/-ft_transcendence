import { z } from 'zod';
import { tournamentRoutes } from '../routes/tournaments.ts';


// --- Create Local Tournament ----
export const LocalTournamentBodySchema = z.object({
    players: z.array(z.string().min(1, "Aliases must not be empty")).min(2).max(10),
}).strict();

export type LocalTournamentRequestBody = z.infer<typeof LocalTournamentBodySchema>;

export const LocalTournamentResponseSchema = z.object({
  tournamentId: z.string().uuid()
});

export const LocalTournamentRouteSchema = {
    body: LocalTournamentBodySchema,
    response: {
        200: LocalTournamentResponseSchema,
    }
}

// --- Renvoie l'information sur le tournement (par ID)
const MatchSchema = z.object({
    id: z.string(),
    round: z.number(),
    player1: z.string(),
    player2: z.string(),
    score1: z.number().optional(),
    score2: z.number().optional(),
    winner: z.string().optional(),
});

const TournamentSchema = z.object({
    id: z.string(),
    matches: z.array(MatchSchema),
});

export const getTournamentByIdParams = z.object({
  tournamentId: z.string(),
}).strict();

export type GetTournamentByIdParams = z.infer<typeof getTournamentByIdParams>;

export const getTournamentByIdRouteSchema = {
  params: getTournamentByIdParams,
  response: {
      200: TournamentSchema,
      404: z.object({ error: z.string() }),
  }
}

// --- Update score 
export const updateScoreParams = z.object({
  tournamentId: z.string(),
}).strict();

export type UpdateScoreParams = z.infer<typeof updateScoreParams>;

export const updateScoreBodySchema = z.object({
  // score1
  // score2
})