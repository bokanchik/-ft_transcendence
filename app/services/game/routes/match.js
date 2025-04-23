import { getMatchHandler, postMatchHandler } from '../handlers/matchHandlers.js'
import postMatchSchema from '../schemas/matchSchemas.js'

async function matchRoutes(fastify, options) {
   // fastify.get('/api/game/1v1/match', getMatchHandler)

   fastify.post('/api/game/1v1/match', { schema: postMatchSchema }, postMatchHandler)
}

export default matchRoutes;