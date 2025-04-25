import Fastify from 'fastify';
import dotenv from 'dotenv';
import { initializeDb } from './config/database.js';
import { registerJWTPlugin } from './utils/authUtils.js'; // Importe la fonction d'enregistrement
import userRoutes from './routes/userRoutes.js';

// Charger les variables d'environnement depuis .env
dotenv.config();

// Créer l'instance Fastify
const fastify = Fastify({
  logger: true // Activer le logging (utile pour le développement)
});

async function buildApp() {
  try {
    // 1. Initialiser la base de données
    await initializeDb();
    fastify.log.info('Base de données initialisée avec succès.');

    // 2. Enregistrer le plugin JWT
    await registerJWTPlugin(fastify); // Utilise la fonction importée

    // 3. Ajouter un décorateur pour la vérification JWT sur les routes protégées
    fastify.decorate("authenticate", async function(request, reply) {
      try {
        // Vérifie le token JWT présent dans l'en-tête Authorization (Bearer)
        await request.jwtVerify();
        // Si la vérification réussit, `request.user` contient le payload décodé
      } catch (err) {
        fastify.log.warn(`Échec de l'authentification JWT: ${err.message}`);
        reply.code(401).send({ error: 'Authentification requise ou token invalide.' });
      }
    });

    // 4. Enregistrer les routes
    fastify.register(userRoutes, { prefix: '/api/v1' }); // Préfixe les routes utilisateur avec /api/v1
    // Enregistrer d'autres groupes de routes ici (ex: fastify.register(matchRoutes, { prefix: '/api/v1' });)

    // Route de santé simple
    fastify.get('/health', async (request, reply) => {
      return { status: 'ok' };
    });

    return fastify;

  } catch (err) {
    fastify.log.error('Erreur lors de la construction de l\'application Fastify:', err);
    process.exit(1);
  }
}

// Démarrer le serveur
async function startServer() {
    const app = await buildApp();
    const port = process.env.PORT || 4000;
    try {
        await app.listen({ port: port, host: '0.0.0.0' }); // Écoute sur toutes les interfaces (utile pour Docker)
        app.log.info(`Serveur démarré sur le port ${port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

// Lancer le démarrage
startServer();
