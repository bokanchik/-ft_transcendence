import { getDb } from '../config/database.js';

export async function getAllUsersFromDb() {
  const db = getDb();
  // Sélectionne uniquement les colonnes pertinentes (évite password_hash)
  return db.all('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users');
}

// Recherche par username (pour login, vérification d'existence)
export async function getUserByUsernameFromDb(username) {
  const db = getDb();
  // Sélectionne toutes les colonnes y compris le hash pour la vérification du mot de passe
  return db.get('SELECT * FROM users WHERE username = ?', [username]);
}

// Recherche par ID (pour récupérer les détails d'un utilisateur authentifié/spécifique)
export async function getUserByIdFromDb(userId) {
  const db = getDb();
  // Évite de renvoyer le hash du mot de passe
  return db.get('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users WHERE id = ?', [userId]);
}

// Créer un nouvel utilisateur (utilisé par le service register/create)
export async function createUserInDb({ username, email, password_hash, display_name, avatar_url = null }) {
  const db = getDb();
  const result = await db.run(
    `INSERT INTO users (username, email, password_hash, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)`,
    [username, email, password_hash, display_name, avatar_url]
  );
  // Retourne l'ID du nouvel utilisateur créé
  if (result.lastID) {
    // Récupère l'utilisateur complet (sans le hash) pour confirmation/retour
    return getUserByIdFromDb(result.lastID);
  } else {
    throw new Error("Échec de la création de l'utilisateur dans la base de données.");
  }
}

// Exemple pour les matchs (à adapter selon la logique exacte voulue)
export async function getUserMatchesFromDb(userId) {
  const db = getDb();
  // Requête exemple : récupère les matchs où l'utilisateur est joueur 1 ou joueur 2
  // Joindre avec la table users pour obtenir les noms des adversaires pourrait être utile
  return db.all(`
    SELECT m.*,
           p1.display_name as player1_name,
           p2.display_name as player2_name,
           w.display_name as winner_name
    FROM matches m
    JOIN users p1 ON m.player1_id = p1.id
    JOIN users p2 ON m.player2_id = p2.id
    LEFT JOIN users w ON m.winner_id = w.id
    WHERE m.player1_id = ? OR m.player2_id = ?
    ORDER BY m.match_date DESC
  `, [userId, userId]);
}

// Ajouter ici d'autres fonctions d'accès aux données si nécessaire (update user, delete user, etc.)
