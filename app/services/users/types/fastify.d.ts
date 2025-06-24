import 'fastify';
import { JWTPayload } from '../shared/schemas/usersSchemas';
import { FastifySessionObject } from '@fastify/session'

declare module 'fastify' {
  export interface FastifyRequest {
    user: JWTPayload;
  }
  export interface Session extends FastifySessionObject {
    '2fa_user_id'?: number;
    userId?: number;
  }
}