import db from '../database/connectDB.js'

export async function createMatchHandler(req, reply) {
    
}

// Handler to get match details by matchId
export async function getMatchHandler(req, reply) {
    const matchId = req.params.matchId;

    if (!matchId) {
        return reply.status(400).send({ error: 'Match ID is required' });
    }

    //reply.set('Content-Type', 'application/json');
    let sql = "SELECT * FROM matches WHERE id = ?";
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

export async function acceptMatchHandler(req, reply) {

}

export async function rejectMatchHandler(req, reply) {

}

export async function startMatchHandler(req, reply) {

}

export async function quitMatchHandler(req, reply) {

}