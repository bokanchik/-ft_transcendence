import { z } from 'zod';

export const LocalTournamentBodySchema = z.object({
    players: z.array(z.string().min(1, "Aliases must not be empty")).min(2).max(10),
}).strict();

export type LocalTournamentRequestBody = z.infer<typeof LocalTournamentBodySchema>;


export const LocalTournamentResponseSchema = z.object({
  pairs: z.array(z.object({
    round: z.number(),
    player1: z.string(),
    player2: z.string(),
  })),
});


export const LocalTournamentRouteSchema = {
    body: LocalTournamentBodySchema,
    response: {
        200: LocalTournamentResponseSchema,
    }
}
