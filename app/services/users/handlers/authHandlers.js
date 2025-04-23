// Gère les requêtes Fastify (req, reply)
import { registerUser, loginUser } from '../services/userService.js';

export async function registerHandler(req, reply) {
  try {
    const { username, email, password, display_name } = req.body;
    const user = await registerUser({ username, email, password, display_name });
    return reply.send({ message: 'User registered successfully', userId: user.id });
  } catch (err) {
    if (err.message === 'Username already exists') {
      return reply.status(400).send({ error: err.message });
    }
    return reply.status(500).send({ error: 'Erreur serveur', detail: err.message });
  }
}

export async function loginHandler(req, reply) {
  const { username, password } = req.body;

  try {
    const token = await loginUser({ username, password });
    return reply.send({ token });
  } catch (err) {
    if (err.message === 'Invalid credentials') {
      return reply.status(401).send({ error: err.message });
    }
    return reply.status(500).send({ error: 'Erreur serveur', detail: err.message });
  }
}

