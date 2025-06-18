import { z } from 'zod';

export const LocalTournamentBodySchema = z.object({
    players: z.array(z.string().min(1, "Aliases must not be empty")).min(2).max(10),
}).strict();

export type LocalTournamentRequestBody = z.infer<typeof LocalTournamentBodySchema>;

export const LocalTournamentRouteSchema = {
    body: LocalTournamentBodySchema,
    response: {
        200: z.object({ message: z.string() }), // a changer apres
    }
}
