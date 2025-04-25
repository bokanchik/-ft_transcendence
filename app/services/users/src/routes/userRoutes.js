import * as userService from '../services/userService.js';

// Fonction pour enregistrer les routes utilisateur auprès de Fastify
export default async function userRoutes(fastify, options) {

  // --- Route d'enregistrement ---
  fastify.post('/register', {
    schema: { // Ajout de validation de schéma (bonne pratique)
      body: {
        type: 'object',
        required: ['username', 'email', 'password', 'display_name'],
        properties: {
          username: { type: 'string', minLength: 3 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          display_name: { type: 'string', minLength: 1 },
          avatar_url: { type: 'string', format: 'url', nullable: true }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const newUser = await userService.registerUser(request.body);
      // Ne pas renvoyer le hash du mot de passe
      reply.code(201).send({ message: 'Utilisateur créé avec succès', user: newUser });
    } catch (error) {
      fastify.log.error(`Erreur /register: ${error.message}`);
      // Gérer les erreurs spécifiques (ex: utilisateur déjà existant)
      if (error.message.includes('déjà pris') || error.message.includes('déjà utilisée')) {
          reply.code(409).send({ error: error.message }); // 409 Conflict
      } else {
          reply.code(400).send({ error: error.message }); // 400 Bad Request pour les autres erreurs attendues
      }
    }
  });

  // --- Route de connexion ---
  fastify.post('/login', {
     schema: {
       body: {
         type: 'object',
         required: ['username', 'password'],
         properties: {
           username: { type: 'string' },
           password: { type: 'string' }
         }
       }
     }
  }, async (request, reply) => {
    try {
      const user = await userService.loginUser(request.body);
      // Génération du token JWT ici, car on a accès à `fastify.jwt`
      const tokenPayload = { id: user.id, username: user.username };
      const token = fastify.jwt.sign(tokenPayload);

      reply.send({ message: 'Connexion réussie', token: token, user: user }); // Renvoie le token et les infos user (sans mdp)
    } catch (error) {
      fastify.log.error(`Erreur /login: ${error.message}`);
      if (error.message === 'Identifiants invalides.') {
        reply.code(401).send({ error: error.message }); // 401 Unauthorized
      } else {
        reply.code(500).send({ error: 'Erreur interne du serveur' });
      }
    }
  });

  // --- Routes Protégées (Exemple) ---
  // Ces routes nécessiteront une authentification JWT

  // Récupérer le profil de l'utilisateur connecté
  fastify.get('/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    // `fastify.authenticate` (défini dans app.js via le hook JWT)
    // ajoute `request.user` avec le payload du token vérifié.
    try {
        // On utilise l'ID du token pour être sûr de récupérer le bon utilisateur
        const userProfile = await userService.getUserById(request.user.id);
        reply.send(userProfile);
    } catch (error) {
        fastify.log.error(`Erreur /me: ${error.message}`);
        reply.code(404).send({ error: "Profil utilisateur non trouvé."});
    }
  });

  // Récupérer la liste des utilisateurs (exemple, pourrait nécessiter des droits admin)
  fastify.get('/users', { onRequest: [fastify.authenticate] }, async (request, reply) => {
      // Ajouter une vérification de rôle si nécessaire (ex: if (!request.user.isAdmin) return reply.code(403)...)
      try {
          const users = await userService.getAllUsers();
          reply.send(users);
      } catch(error) {
          fastify.log.error(`Erreur /users: ${error.message}`);
          reply.code(500).send({ error: 'Erreur lors de la récupération des utilisateurs.' });
      }
  });

    // Récupérer un utilisateur spécifique par ID (exemple)
    fastify.get('/users/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = parseInt(request.params.id, 10); // Assure que l'ID est un nombre
            if (isNaN(userId)) {
                return reply.code(400).send({ error: "ID utilisateur invalide." });
            }
            const user = await userService.getUserById(userId);
            reply.send(user);
        } catch(error) {
            fastify.log.error(`Erreur /users/:id : ${error.message}`);
            if (error.message === 'Utilisateur non trouvé.') {
                reply.code(404).send({ error: error.message });
            } else {
                reply.code(500).send({ error: 'Erreur interne du serveur.' });
            }
        }
    });

    // Récupérer les matchs d'un utilisateur (soit le sien, soit un autre si autorisé)
    fastify.get('/users/:id/matches', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = parseInt(request.params.id, 10);
            if (isNaN(userId)) {
                return reply.code(400).send({ error: "ID utilisateur invalide." });
            }

            // Vérification simple : l'utilisateur connecté ne peut voir que ses propres matchs
            // Pourrait être étendu pour les admins ou amis, etc.
            if (request.user.id !== userId) {
                 return reply.code(403).send({ error: "Vous n'êtes pas autorisé à voir les matchs de cet utilisateur." });
            }

            const matches = await userService.getUserMatches(userId);
            reply.send(matches);
        } catch (error) {
            fastify.log.error(`Erreur /users/:id/matches : ${error.message}`);
            reply.code(500).send({ error: 'Erreur lors de la récupération des matchs.' });
        }
    });

  // Ajouter d'autres routes ici (ex: PUT /me pour mettre à jour le profil, etc.)
}
