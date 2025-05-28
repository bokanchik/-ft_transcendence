//import fastify from '../server.ts';
import type { FastifyInstance } from 'fastify';
import { createMatchHandler, getMatchIdHandler, getMatchByUserHandler } from '../handlers/matchHandlers.ts'
import { createMatchSchema } from '../middleware/matchSchemas.ts';
import { ZodTypeProvider } from "fastify-type-provider-zod"

function matchRoutes(fastify: FastifyInstance, _options: unknown) {

   fastify.withTypeProvider<ZodTypeProvider>().post('/match/', {  
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
   // ---- TODO ----
   // POST /match/:matchId/move
   // GET /match/:matchId/status

   fastify.get('/match/:matchId', { onRequest: [fastify.authenticate] }, getMatchIdHandler);
   fastify.get('/history/:userId', { onRequest: [fastify.authenticate] }, getMatchByUserHandler);
   
   // fastify.get('/match/:matchId/state', { schema: matchSchemas.idOnly }, getMatchStateHandler);
   // fastify.post('/match/:matchId/accept', { schema: matchSchemas.accept }, acceptMatchHandler);
   // fastify.post('/match/:matchId/reject', { schema: matchSchemas.reject }, rejectMatchHandler);
   // fastify.post('/match/:matchId/start', { schema: matchSchemas.start }, startMatchHandler);
   // fastify.post('/match/:matchId/quit', { schema: matchSchemas.quit }, quitMatchHandler);

   fastify.log.info('Remote Match routes registered');

}

export default matchRoutes;