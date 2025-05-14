// models/friendModel.js
import { getDb } from '../utils/dbConfig.js';

/**
 * Creates a new friendship request in the database.
 * @param {number} user1Id - ID of the first user.
 * @param {number} user2Id - ID of the second user.
 * @param {number} initiatorId - ID of the user initiating the request.
 * @returns {Promise<object>} The created friendship object with its ID.
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
 * Retrieves a specific friendship by the IDs of the two users.
 * @param {number} user1Id - ID of the first user.
 * @param {number} user2Id - ID of the second user.
 * @returns {Promise<object|undefined>} The friendship object or undefined if not found.
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
 * Retrieves a friendship by its ID.
 * @param {number} friendshipId - ID of the friendship.
 * @returns {Promise<object|undefined>} The friendship object or undefined if not found.
 */
export async function getFriendshipByIdInDb(friendshipId) {
    const db = getDb();
    return db.get(`SELECT * FROM friendships WHERE id = ?`, [friendshipId]);
}

/**
 * Updates the status of a friendship.
 * @param {number} friendshipId - ID of the friendship to update.
 * @param {string} status - New status ('accepted', 'declined', 'blocked').
 * @returns {Promise<object>} The result of the database operation.
 */
export async function updateFriendshipStatusInDb(friendshipId, status) {
    const db = getDb();
    return db.run(
        `UPDATE friendships SET status = ? WHERE id = ?`,
        [status, friendshipId]
    );
}

/**
 * Deletes a friendship from the database.
 * @param {number} friendshipId - ID of the friendship to delete.
 * @returns {Promise<object>} The result of the database operation.
 */
export async function deleteFriendshipInDb(friendshipId) {
    const db = getDb();
    return db.run(`DELETE FROM friendships WHERE id = ?`, [friendshipId]);
}

/**
 * Retrieves all accepted friendships for a specific user.
 * Includes details about the friend (display_name, wins, losses, status, avatar_url).
 * @param {number} userId - ID of the user.
 * @returns {Promise<Array<object>>} List of friends with their details.
 */
export async function getAcceptedFriendsForUserInDb(userId) {
    const db = getDb();
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
                WHEN f.user1_id = ? THEN u2.username
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
                WHEN f.user1_id = ? THEN u2.status
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
    return db.all(query, [userId, userId, userId, userId, userId, userId, userId, userId, userId]);
}

/**
 * Retrieves all pending friend requests received by a user.
 * Includes details about the requester.
 * @param {number} userId - ID of the user who received the requests.
 * @returns {Promise<Array<object>>} List of received requests with requester details.
 */
export async function getPendingReceivedFriendRequestsInDb(userId) {
    const db = getDb();
    const query = `
        SELECT
            f.id as friendship_id,
            f.created_at,
            u_initiator.id as id,
            u_initiator.username,
            u_initiator.email,
            u_initiator.display_name,
            u_initiator.avatar_url
        FROM friendships f
        JOIN users u_initiator ON f.initiator_id = u_initiator.id
        WHERE
            (f.user1_id = ? OR f.user2_id = ?)
            AND f.status = 'pending'
            AND f.initiator_id != ?
        ORDER BY f.created_at DESC;
    `;
    const rows = await db.all(query, [userId, userId, userId]);
    return rows.map(row => ({
        friendship_id: row.friendship_id,
        created_at: row.created_at,
        requester: {
            id: row.id,
            username: row.username,
            email: row.email,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
        },
    }));
}

/**
 * Retrieves all pending friend requests sent by a user.
 * Includes details about the receiver.
 * @param {number} userId - ID of the user who sent the requests.
 * @returns {Promise<Array<object>>} List of sent requests with receiver details.
 */
export async function getPendingSentFriendRequestsInDb(userId) {
    const db = getDb();
    const query = `
        SELECT
            f.id as friendship_id,
            f.created_at,
            CASE
                WHEN f.user1_id = f.initiator_id THEN u2.id
                ELSE u1.id
            END as id,
            CASE
                WHEN f.user1_id = f.initiator_id THEN u2.username
                ELSE u1.username
            END as username,
            CASE
                WHEN f.user1_id = f.initiator_id THEN u2.email
                ELSE u1.email
            END as email,
            CASE
                WHEN f.user1_id = f.initiator_id THEN u2.display_name
                ELSE u1.display_name
            END as display_name,
            CASE
                WHEN f.user1_id = f.initiator_id THEN u2.avatar_url
                ELSE u1.avatar_url
            END as avatar_url
        FROM friendships f
        JOIN users u1 ON f.user1_id = u1.id
        JOIN users u2 ON f.user2_id = u2.id
        WHERE
            f.initiator_id = ?
            AND f.status = 'pending'
        ORDER BY f.created_at DESC;
    `;
    const rows = await db.all(query, [userId]);
    return rows.map(row => ({
        friendship_id: row.friendship_id,
        created_at: row.created_at,
        receiver: {
            id: row.id,
            username: row.username,
            email: row.email,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
        },
    }));
}

/**
 * Retrieves all friendships, regardless of their status.
 * Useful for admin or debugging purposes.
 * @returns {Promise<Array<object>>} List of all friendships.
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

/**
 * Retrieves a paginated list of friends for a specific user.
 * @param {number} userId - ID of the user.
 * @param {number} limit - Maximum number of friends to retrieve.
 * @param {number} offset - Number of records to skip.
 * @returns {Promise<Array<object>>} List of friends with their details.
 */
export async function getFriends(userId, limit = 10, offset = 0) {
    const db = getDb();
    const query = `
        SELECT * FROM friendships
        WHERE (user1_id = ? OR user2_id = ?) AND status = 'accepted'
        LIMIT ? OFFSET ?
    `;
    return db.all(query, [userId, userId, limit, offset]);
}
