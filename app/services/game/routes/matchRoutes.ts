//import fastify from '../server.ts';
import type { FastifyInstance } from 'fastify';
import { createMatchHandler, getMatchIdHandler } from '../handlers/matchHandlers.ts'
import { createMatchSchema } from '../middleware/matchSchemas.ts';
import { ZodTypeProvider } from "fastify-type-provider-zod"

async function matchRoutes(fastify: FastifyInstance, _options: unknown) {

   fastify.withTypeProvider<ZodTypeProvider>().post('/', {  
      preHandler: async (req, reply) => {
         // validate incoming data with zod (--> middleware)
         const reqValidation = createMatchSchema.safeParse(req.body);
         if (!reqValidation.success) {
            req.log.error('Validation failed:', reqValidation.error.errors); // for debugging
            return reply.code(400).send({
               message: 'Invalid request body',
               errors: reqValidation.error.errors
            });
         }
        req.validatedBody = reqValidation.data;
      },
      handler: createMatchHandler,
   
   });
   fastify.get('/:matchId', { onRequest: [fastify.authenticate] }, getMatchIdHandler);
   
   // fastify.get('/match/:userId) -> qui donne tous les matchs pour cet user la
   
   // fastify.get('/match/:matchId/state', { schema: matchSchemas.idOnly }, getMatchStateHandler);
   // fastify.post('/match/:matchId/accept', { schema: matchSchemas.accept }, acceptMatchHandler);
   // fastify.post('/match/:matchId/reject', { schema: matchSchemas.reject }, rejectMatchHandler);
   // fastify.post('/match/:matchId/start', { schema: matchSchemas.start }, startMatchHandler);
   // fastify.post('/match/:matchId/quit', { schema: matchSchemas.quit }, quitMatchHandler);

   fastify.log.info('Remote Match routes registered');

}

export default matchRoutes;