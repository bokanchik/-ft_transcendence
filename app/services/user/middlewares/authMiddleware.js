import { verifyJWT } from '../utils/jwtUtils.js';

export async function verifyAuth(request, reply) {
  const auth = request.headers.authorization;
  if (!auth) return reply.status(401).send({ error: 'Missing auth header' });

  try {
    const token = auth.split(' ')[1];
    request.user = verifyJWT(token);
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}
