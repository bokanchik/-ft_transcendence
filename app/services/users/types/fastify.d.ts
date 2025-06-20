import 'fastify';
import { JWTPayload } from '../shared/schemas/usersSchemas';

// Ce code va "fusionner" notre définition avec celle de la librairie 'fastify'
declare module 'fastify' {
  // On déclare une nouvelle interface FastifyRequest qui contient notre propriété 'user'
  export interface FastifyRequest {
    user: JWTPayload;
  }
}