import 'fastify';
import { JWTPayload } from '../shared/schemas/usersSchemas';
// import { FastifySessionObject } from '@fastify/session'

declare module 'fastify' {
  export interface FastifyRequest {
    user: JWTPayload;
  }
  export interface FastifyReply {
    generateCsrf: (options?: { userInfo?: string }) => Promise<string>;
  }
}