import bcrypt from 'bcrypt';
import fastifyJwt from '@fastify/jwt'; // Pour l'enregistrement du plugin

// --- Configuration et Enregistrement Plugin JWT ---

// Fonction pour enregistrer le plugin Fastify JWT
export async function registerJWTPlugin(fastify) {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'super-secret-change-me-in-.env', // IMPORTANT: Utiliser .env
    sign: { expiresIn: '7d' }, // Le JWT expirera après 7 jours
  });
  console.log('Plugin Fastify JWT enregistré.');
}

// --- Utilitaires Mot de passe ---

export async function hashPassword(password) {
  if (!password) {
    throw new Error('Password cannot be empty');
  }
  // Le 'salt round' (ici 10) détermine la complexité du hashage
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  if (!password || !hash) {
    return false; // Évite les erreurs si l'un des arguments est manquant
  }
  return await bcrypt.compare(password, hash);
}

// --- Utilitaires JWT (peuvent être utilisés par Fastify ou indépendamment) ---

// Générer un JWT (utilisé par Fastify via `fastify.jwt.sign`)
// Note : La génération se fera typiquement dans les routes où l'instance `fastify` est disponible.
// Cette fonction est donc moins utile ici si on suit les bonnes pratiques Fastify.

// Vérifier un JWT (utilisé par Fastify via `fastify.jwt.verify` ou le hook `authenticate`)
// Cette fonction peut servir de wrapper si nécessaire, mais Fastify gère souvent cela.
export function verifyToken(token, secret) {
    try {
        // Utilisation de la librairie jsonwebtoken standard si besoin hors contexte Fastify
        return jwt.verify(token, secret || process.env.JWT_SECRET);
    } catch (err) {
        console.error("Erreur de vérification JWT:", err.message);
        throw new Error('Token invalide ou expiré');
    }
}

// Helper pour obtenir le secret (évite la répétition)
export function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.warn("Attention: JWT_SECRET n'est pas défini dans les variables d'environnement. Utilisation d'une valeur par défaut peu sécurisée.");
        return 'super-secret-change-me-in-.env';
    }
    return secret;
}
