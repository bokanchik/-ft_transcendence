import { FastifyReply, FastifyRequest } from 'fastify';
import { LocalTournamentBodySchema } from '../middleware/tournaments.schemas.ts';
import { shuffle, makePairs } from '../utils/matchmaking.tournament.ts';

export async function createLocalTournament(req: FastifyRequest, reply: FastifyReply) {
    const parseResult = LocalTournamentBodySchema.safeParse(req.body);

    if (!parseResult.success) {
        return reply.code(400).send({ error: parseResult.error.errors });
    }

    const { players } = parseResult.data;

    console.log("Before shuffle: ", players);

    const shuffledPlayers = shuffle(players);
    
    console.log("After shuffle: ", shuffledPlayers);

    const { pairs, oddElem } = makePairs(shuffledPlayers);

    console.log("Pairs: " + pairs, " OddElem: ", oddElem);

    return reply.code(200).send('ok');
};

