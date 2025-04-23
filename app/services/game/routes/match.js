import { createMatchHandler } from '../handlers/matchHandlers.js'
import { createMatchSchema } from '../schemas/matchSchemas.js'

async function matchRoutes(fastify, options) {
   fastify.post('/api/game/1v1/match', { schema: createMatchSchema }, createMatchHandler)
}

export default matchRoutes;