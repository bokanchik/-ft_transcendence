// Gère les requêtes Fastify (req, reply)
import { createUserAccount, loginUser } from '../services/userService.js';

export async function registerHandler(req, reply) {
	const newUser = await createUserAccount(req.body);
	return reply.code(201).send(newUser);
}

export async function loginHandler(req, reply) {
	const user = await loginUser(req.body);
	const tokenPayload = { id: user.id, username: user.username };
	const token = req.server.jwt.sign(tokenPayload);
	req.log.info(`Token generated for ${user.username}`);
	return reply.send({
		message: 'Connexion accepted',
		token: token,
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
		}
	});
}
