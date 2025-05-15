import type { FastifyInstance } from 'fastify';
declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: {
            id: number;
        };
        user: {
            identifier: string;
            password: string;
        };
    }
}
declare const _default: (fastify: FastifyInstance, options: any) => Promise<void>;
export default _default;
