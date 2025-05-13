// models/friendModel.js
import { getDb } from '../utils/dbConfig.js';

/**
 * Crée une nouvelle demande d'amitié dans la base de données.
 * @param {number} user1Id - ID de l'utilisateur qui envoie la demande.
 * @param {number} user2Id - ID de l'utilisateur qui reçoit la demande.
 * @returns {Promise<object>} L'objet de l'amitié créée avec son ID.
 */
export async function createFriendshipRequestInDb(user1Id, user2Id, initiatorId) {
    const db = getDb();
    const [id1, id2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    const result = await db.run(
        `INSERT INTO friendships (user1_id, user2_id, initiator_id, status) VALUES (?, ?, ?, 'pending')`,
        [id1, id2, initiatorId]
    );
    return { id: result.lastID, user1_id: id1, user2_id: id2, initiator_id: initiatorId, status: 'pending' };
}

/**
 * Récupère une amitié spécifique par les IDs des deux utilisateurs.
 * @param {number} user1Id
 * @param {number} user2Id
 * @returns {Promise<object|undefined>} L'objet amitié ou undefined si non trouvé.
 */
export async function getFriendshipByUsersInDb(user1Id, user2Id) {
    const db = getDb();
    const [id1, id2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    return db.get(
        `SELECT * FROM friendships WHERE user1_id = ? AND user2_id = ?`,
        [id1, id2]
    );
}

/**
 * Récupère une amitié par son ID.
 * @param {number} friendshipId
 * @returns {Promise<object|undefined>} L'objet amitié ou undefined si non trouvé.
 */
export async function getFriendshipByIdInDb(friendshipId) {
    const db = getDb();
    return db.get(`SELECT * FROM friendships WHERE id = ?`, [friendshipId]);
}


/**
 * Met à jour le statut d'une amitié.
 * @param {number} friendshipId - ID de l'amitié à mettre à jour.
 * @param {string} status - Nouveau statut ('accepted', 'declined', 'blocked').
 * @returns {Promise<object>} Résultat de l'opération de base de données.
 */
export async function updateFriendshipStatusInDb(friendshipId, status) {
    const db = getDb();
    return db.run(
        `UPDATE friendships SET status = ? WHERE id = ?`,
        [status, friendshipId]
    );
}

/**
 * Supprime une amitié de la base de données.
 * @param {number} friendshipId - ID de l'amitié à supprimer.
 * @returns {Promise<object>} Résultat de l'opération de base de données.
 */
export async function deleteFriendshipInDb(friendshipId) {
    const db = getDb();
    return db.run(`DELETE FROM friendships WHERE id = ?`, [friendshipId]);
}

/**
 * Récupère toutes les amitiés acceptées d'un utilisateur spécifique.
 * Inclut les informations de l'ami (display_name, wins, losses, status, avatar_url).
 * @param {number} userId - ID de l'utilisateur.
 * @returns {Promise<Array<object>>} Liste des amis avec leurs détails.
 */
export async function getAcceptedFriendsForUserInDb(userId) {
    const db = getDb();
    // On doit joindre la table users deux fois, une pour user1_id et une pour user2_id
    // et sélectionner les infos de l'autre utilisateur dans l'amitié.
    const query = `
        SELECT
            f.id as friendship_id,
            f.status as friendship_status,
            CASE
                WHEN f.user1_id = ? THEN u2.id
                ELSE u1.id
            END as friend_id,
            CASE
                WHEN f.user1_id = ? THEN u2.display_name
                ELSE u1.display_name
            END as friend_display_name,
            CASE
                WHEN f.user1_id = ? THEN u2.username -- Ajout du username de l'ami
                ELSE u1.username
            END as friend_username,
            CASE
                WHEN f.user1_id = ? THEN u2.wins
                ELSE u1.wins
            END as friend_wins,
            CASE
                WHEN f.user1_id = ? THEN u2.losses
                ELSE u1.losses
            END as friend_losses,
            CASE
                WHEN f.user1_id = ? THEN u2.status -- status en ligne/hors ligne de l'ami
                ELSE u1.status
            END as friend_online_status,
            CASE
                WHEN f.user1_id = ? THEN u2.avatar_url
                ELSE u1.avatar_url
            END as friend_avatar_url
        FROM friendships f
        JOIN users u1 ON f.user1_id = u1.id
        JOIN users u2 ON f.user2_id = u2.id
        WHERE (f.user1_id = ? OR f.user2_id = ?) AND f.status = 'accepted'
    `;
    // On répète userId pour chaque ? dans la clause CASE et WHERE
    return db.all(query, [userId, userId, userId, userId, userId, userId, userId, userId, userId]);
}

/**
 * Récupère toutes les demandes d'amitié reçues (en attente) par un utilisateur.
 * Inclut les informations du demandeur.
 * @param {number} userId - ID de l'utilisateur qui a reçu les demandes.
 * @returns {Promise<Array<object>>} Liste des demandes reçues avec détails du demandeur.
 */
export async function getPendingReceivedFriendRequestsInDb(userId) {
    const db = getDb();
    const query = `
        SELECT
            f.id as friendship_id,
            u_initiator.id as requester_id,
            u_initiator.username as requester_username,
            u_initiator.display_name as requester_display_name,
            u_initiator.avatar_url as requester_avatar_url,
            f.created_at
        FROM friendships f
        JOIN users u_initiator ON f.initiator_id = u_initiator.id
        WHERE
            (f.user1_id = ? OR f.user2_id = ?) -- L'utilisateur est impliqué
            AND f.status = 'pending'
            AND f.initiator_id != ? -- La demande n'a pas été initiée par l'utilisateur actuel
        ORDER BY f.created_at DESC;
    `;
    return db.all(query, [userId, userId, userId]);
}

/**
 * Récupère toutes les demandes d'amitié envoyées (en attente) par un utilisateur.
 * Inclut les informations du destinataire.
 * @param {number} userId - ID de l'utilisateur qui a envoyé les demandes.
 * @returns {Promise<Array<object>>} Liste des demandes envoyées avec détails du destinataire.
 */
export async function getPendingSentFriendRequestsInDb(userId) {
    const db = getDb();
    const queryWithInitiator = `
        SELECT
            f.id as friendship_id,
            -- Sélectionner l'utilisateur qui N'EST PAS l'initiateur
            CASE
                WHEN f.user1_id = f.initiator_id THEN u2.id
                ELSE u1.id
            END as receiver_id,
            CASE
                WHEN f.user1_id = f.initiator_id THEN u2.username
                ELSE u1.username
            END as receiver_username,
            CASE
                WHEN f.user1_id = f.initiator_id THEN u2.display_name
                ELSE u1.display_name
            END as receiver_display_name,
            CASE
                WHEN f.user1_id = f.initiator_id THEN u2.avatar_url
                ELSE u1.avatar_url
            END as receiver_avatar_url,
            f.created_at
        FROM friendships f
        JOIN users u1 ON f.user1_id = u1.id
        JOIN users u2 ON f.user2_id = u2.id
        WHERE
            f.initiator_id = ?
            AND f.status = 'pending'
        ORDER BY f.created_at DESC;
    `;
    return db.all(queryWithInitiator, [userId]);
}

/**
 * Récupère toutes les relations d'amitié, quel que soit leur statut.
 * Utile pour l'admin ou le debug.
 * @returns {Promise<Array<object>>}
 */
export async function getAllFriendshipsInDb() {
    const db = getDb();
    return db.all(`
        SELECT
            f.id, f.user1_id, u1.username as user1_username,
            f.user2_id, u2.username as user2_username,
            f.initiator_id, ui.username as initiator_username,
            f.status, f.created_at
        FROM friendships f
        JOIN users u1 ON f.user1_id = u1.id
        JOIN users u2 ON f.user2_id = u2.id
        JOIN users ui ON f.initiator_id = ui.id
    `);
}
