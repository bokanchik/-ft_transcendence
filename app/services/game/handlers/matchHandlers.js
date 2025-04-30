import db from '../database/connectDB.js'

// http post /api/game/1v1/match
export async function createMatchHandler(req, reply) {
    // check JWT token of a player 
    req.log.info('createMatchHandler activated');
    // on peut verifier si le joueur est authentifié avec JWT ici, et l'enregistrer dans la base de données
    try {
        // need to check with JWT 
        // const playerId = req.user.id;
        // const socketId = getSocketId(playerId);
        // if (!socketId) {
        //     return reply.code(400).send({ error: 'Socket not connected' });
        // }
        // creation du lobby avec player1_id et player2_id

        return reply.code(201).send({ message: 'Player added to waiting room' });
    } catch (err) {
        req.log.error(err);
        return reply.code(500).send({ error: err.message });
    }

}

export async function getMatchHandler(req, reply) {
    return reply.code(200).send({ message: 'Game service is running' });
}

// Handler to get match details by matchId
export async function getMatchIdHandler(req, reply) {
    const matchId = req.params.matchId;
   // req.log.info(`Fetching match details for matchId: ${matchId}`);
    if (!matchId) {
        return reply.status(400).send({ error: 'Match ID is required' });
    }

    let sql = "SELECT * FROM matches WHERE id = ?"; // refaire avec model
    try {
        db.get(sql, [matchId], (err, row) => {
            if (err) {
                return reply.code(500).send({ error: err.message });
            }

            if (!row) {
                return reply.code(404).send({ error: 'Match not found' });
            }

            let data = {
                id: row.id,
                player1_id: row.player1_id,
                player2_id: row.player2_id,
                winner_id: row.winner_id,
                created_at: row.created_at,
                state: row.state
            };

            return reply.code(200).send({ data });

        });

    } catch (err) { 
        return reply.code(500).send({ error: err.message });
    }
}

export async function getMatchStateHandler(req, reply) {

}

export async function quitMatchHandler(req, reply) {

}

// MAYBE BE DEPRECATED
export async function startMatchHandler(req, reply) {

}

// FOR INVITATION FUNCTIONALITY
export async function acceptMatchHandler(req, reply) {

}

export async function rejectMatchHandler(req, reply) {

}
