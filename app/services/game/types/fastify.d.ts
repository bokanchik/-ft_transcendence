import { FastifyRequest, FastifyReply } from 'fastify';
import { Server } from 'socket.io';
import { createMatchSchema } from '../shared/schemas/matchSchemas.ts';
import z from "zod";
import { JWTPayload } from '../shared/schemas/usersSchemas.js';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    validatedBody: z.infer<typeof createMatchSchema>;
    user: JWTPayload;
  }
}

