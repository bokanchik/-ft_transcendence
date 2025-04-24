// Gère les requêtes Fastify (req, reply)
import { createUserAccount, loginUser } from '../services/userService.js';

export async function registerHandler(req, reply) {
	try {
		const newUser = await createUserAccount(req.body);
		return reply.status(201).send(newUser);
	} catch (err) {
		console.error('Error while inscription:', err);
		if (err.message.includes('already exists')) {
			return reply.status(409).send({ error: err.message });
		} else {
			return reply.status(400).send({ error: err.message });
		}
	}
}

export async function loginHandler(req, reply) {
	try {
		const user = await loginUser(req.body);
		const tokenPayload = { id: user.id, username: user.username };
		const token = req.server.jwt.sign(tokenPayload);
		console.log(`Token generated for ${user.username}`);
		return reply.send({ message: 'Connexion accepted', token: token, user: user });
	} catch (err) {
		console.error('Error while login:', err);
		if (err.message.includes('Invalid credentials')) {
			return reply.status(401).send({ error: err.message });
		}
		return reply.status(500).send({ error: 'Erreur serveur', detail: err.message });
	}
}
