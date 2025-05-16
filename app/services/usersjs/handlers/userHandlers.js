// Gère les requêtes Fastify (req, reply)
import { getAllUsers, getUserById, getUserMatches, updateUserProfile } from '../services/userService.js';

export async function getUsersHandler(req, reply) {
	const users = await getAllUsers();
	return reply.code(200).send(users);
}

export async function getUserMeHandler(req, reply) {
	const user = await getUserById(req.user.id);
	return reply.code(200).send(user);
}

export async function getUserMeMatchHandler(req, reply) {
	const matches = await getUserMatches(req.user.id);
	return reply.code(200).send(matches);
}

export async function updateUserMeHandler(req, reply) {
	const userId = req.user.id; // Récupère l'ID de l'utilisateur authentifié
	const updates = req.body; // Récupère les données à mettre à jour depuis le corps de la requête

	req.log.info({ userId, updates }, 'Attempting to update user profile');

	// Appelle la fonction de service pour effectuer la mise à jour
	const updatedUser = await updateUserProfile(userId, updates);

	// Renvoie une réponse de succès avec les données utilisateur mises à jour
	return reply.code(200).send({
		message: 'User updated successfully',
		user: updatedUser // Renvoie l'objet utilisateur mis à jour (sans le mot de passe)
	});
}
