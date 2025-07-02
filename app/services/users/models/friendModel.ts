// app/services/users/models/friendModel.ts
import { getDb } from '../utils/dbConfig.js';
import { Friendship, Friend, FriendshipStatus, PendingFriendRequest, AdminFullFriendship } from '../shared/schemas/friendsSchemas.js';

/**
 * Creates a new friendship request in the database.
 * @param {number} user1Id - ID of the first user.
 * @param {number} user2Id - ID of the second user.
 * @param {number} initiatorId - ID of the user initiating the request.
 * @returns {Promise<Friendship>} The created friendship object with its ID.
 */
export async function createFriendshipRequestInDb(user1Id: number, user2Id: number, initiatorId: number): Promise<Friendship> {
	const db = getDb();
	const [id1, id2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
	const newFriendship = await db.get<Friendship>(
		`INSERT INTO friendships (user1_id, user2_id, initiator_id, status)
         VALUES (?, ?, ?, ?)
         RETURNING *`,
		[id1, id2, initiatorId, FriendshipStatus.PENDING]
	);


	if (!newFriendship) {
		throw new Error("Failed to create friendship or retrieve the created row using RETURNING.");
	}
	return newFriendship;
}

/**
 * Retrieves a specific friendship by the IDs of the two users.
 * @param {number} user1Id - ID of the first user.
 * @param {number} user2Id - ID of the second user.
 * @returns {Promise<Friendship | undefined>} The friendship object or undefined if not found.
 */
export async function getFriendshipByUsersInDb(user1Id: number, user2Id: number): Promise<Friendship | undefined> {
	const db = getDb();
	const [id1, id2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
	return db.get<Friendship>(
		`SELECT * FROM friendships WHERE user1_id = ? AND user2_id = ?`,
		[id1, id2]
	);
}

/**
 * Retrieves a friendship by its ID.
 * @param {number} friendshipId - ID of the friendship.
 * @returns {Promise<Friendship | undefined>} The friendship object or undefined if not found.
 */
export async function getFriendshipByIdInDb(friendshipId: number): Promise<Friendship | undefined> {
	const db = getDb();
	return db.get<Friendship>(`SELECT * FROM friendships WHERE id = ?`, [friendshipId]);
}

interface UpdateResult {
	changes?: number;
}
/**
 * Updates the status of a friendship.
 * @param {number} friendshipId - ID of the friendship to update.
 * @param {string} status - New status ('accepted', 'declined', 'blocked').
 * @returns {Promise<UpdateResult>} The result of the database operation.
 */
export async function updateFriendshipStatusInDb(friendshipId: number, status: FriendshipStatus): Promise<UpdateResult> {
	const db = getDb();
	const result = await db.run(
		`UPDATE friendships SET status = ? WHERE id = ?`,
		[status, friendshipId]
	);
	return { changes: result.changes };
}

/**
 * Deletes a friendship from the database.
 * @param {number} friendshipId - ID of the friendship to delete.
 * @returns {Promise<UpdateResult>} The result of the database operation.
 */
export async function deleteFriendshipInDb(friendshipId: number): Promise<UpdateResult> {
	const db = getDb();
	const result = await db.run(`DELETE FROM friendships WHERE id = ?`, [friendshipId]);
	return { changes: result.changes };
}

/**
 * Retrieves all accepted friendships for a specific user.
 * Includes details about the friend (display_name, wins, losses, status, avatar_url).
 * @param {number} userId - ID of the user.
 * @returns {Promise<Friend[]>} List of friends with their details.
 */
export async function getAcceptedFriendsForUserInDb(userId: number): Promise<Friend[]> {
	const db = getDb();
	// Le query est long, on assume qu'il retourne les champs correspondants à DetailedFriend
	const query = `
        SELECT
            f.id as friendship_id,
            f.status as friendship_status,
            CASE WHEN f.user1_id = ? THEN u2.id ELSE u1.id END as friend_id,
            CASE WHEN f.user1_id = ? THEN u2.display_name ELSE u1.display_name END as friend_display_name,
            CASE WHEN f.user1_id = ? THEN u2.username ELSE u1.username END as friend_username,
            CASE WHEN f.user1_id = ? THEN u2.wins ELSE u1.wins END as friend_wins,
            CASE WHEN f.user1_id = ? THEN u2.losses ELSE u1.losses END as friend_losses,
            CASE WHEN f.user1_id = ? THEN u2.status ELSE u1.status END as friend_online_status,
            CASE WHEN f.user1_id = ? THEN u2.avatar_url ELSE u1.avatar_url END as friend_avatar_url
        FROM friendships f
        JOIN users u1 ON f.user1_id = u1.id
        JOIN users u2 ON f.user2_id = u2.id
        WHERE (f.user1_id = ? OR f.user2_id = ?) AND f.status = 'accepted'
    `;
	return db.all<Friend[]>(query, userId, userId, userId, userId, userId, userId, userId, userId, userId);
}

/**
 * Retrieves all pending friend requests received by a user.
 * Includes details about the requester.
 * @param {number} userId - ID of the user who received the requests.
 * @returns {Promise<PendingFriendRequest[]>} List of received requests with requester details.
 */
export async function getPendingReceivedFriendRequestsInDb(userId: number): Promise<PendingFriendRequest[]> {
	const db = getDb();
	const query = `
        SELECT
            f.id as friendship_id, f.created_at,
            u_initiator.id, u_initiator.username, u_initiator.email,
            u_initiator.display_name, u_initiator.avatar_url
        FROM friendships f
        JOIN users u_initiator ON f.initiator_id = u_initiator.id
        WHERE (f.user1_id = ? OR f.user2_id = ?) AND f.status = 'pending' AND f.initiator_id != ?
        ORDER BY f.created_at DESC;
    `;
	const rows = await db.all<any[]>(query, userId, userId, userId); // any[] pour l'instant
	return rows.map(row => ({
		friendship_id: row.friendship_id,
		created_at: row.created_at,
		requester: {
			id: row.id, 
			username: row.username,
			display_name: row.display_name,
			avatar_url: row.avatar_url,
		},
	}));
}

/**
 * Retrieves all pending friend requests sent by a user.
 * Includes details about the receiver.
 * @param {number} userId - ID of the user who sent the requests.
 * @returns {Promise<PendingFriendRequest[]>} List of sent requests with receiver details.
 */
export async function getPendingSentFriendRequestsInDb(userId: number): Promise<PendingFriendRequest[]> {
	const db = getDb();
	const query = `
        SELECT
            f.id as friendship_id, f.created_at,
            CASE WHEN f.user1_id = f.initiator_id THEN u2.id ELSE u1.id END as id,
            CASE WHEN f.user1_id = f.initiator_id THEN u2.username ELSE u1.username END as username,
            CASE WHEN f.user1_id = f.initiator_id THEN u2.email ELSE u1.email END as email,
            CASE WHEN f.user1_id = f.initiator_id THEN u2.display_name ELSE u1.display_name END as display_name,
            CASE WHEN f.user1_id = f.initiator_id THEN u2.avatar_url ELSE u1.avatar_url END as avatar_url
        FROM friendships f
        JOIN users u1 ON f.user1_id = u1.id
        JOIN users u2 ON f.user2_id = u2.id
        WHERE f.initiator_id = ? AND f.status = 'pending'
        ORDER BY f.created_at DESC;
    `;
	const rows = await db.all<any[]>(query, userId); // any[] pour l'instant
	return rows.map(row => ({
		friendship_id: row.friendship_id,
		created_at: row.created_at,
		receiver: {
			id: row.id,
			username: row.username,
			display_name: row.display_name,
			avatar_url: row.avatar_url,
		},
	}));
}

/**
 * Retrieves all friendships, regardless of their status.
 * @returns {Promise<AdminFullFriendship[]>} List of all friendships.
 */
export async function getAllFriendshipsInDb(): Promise<AdminFullFriendship[]> {
	const db = getDb();
	return db.all<AdminFullFriendship[]>(`
        SELECT
            f.*, u1.username as user1_username, u2.username as user2_username, ui.username as initiator_username
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
 * @returns {Promise<Friendship[]>} List of friends with their details.
 */
export async function getFriends(userId: number, limit: number = 10, offset: number = 0): Promise<Friendship[]> {
	const db = getDb();
	const query = `
        SELECT * FROM friendships
        WHERE (user1_id = ? OR user2_id = ?) AND status = 'accepted'
        LIMIT ? OFFSET ?
    `;
	return db.all<Friendship[]>(query, userId, userId, limit, offset);
}

/**
 * Checks if a friendship with 'accepted' status exists between two users.
 * @param {number} userId1 - ID of the first user.
 * @param {number} userId2 - ID of the second user.
 * @returns {Promise<boolean>} True if they are friends, false otherwise.
 */
export async function areUsersFriendsInDb(userId1: number, userId2: number): Promise<boolean> {
	if (userId1 === userId2) return false;
	const db = getDb();
	const [id1, id2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

	const friendship = await db.get< { status: FriendshipStatus } >(
		`SELECT status FROM friendships WHERE user1_id = ? AND user2_id = ? AND status = 'accepted'`,
		[id1, id2]
	);
	
	return !!friendship;
}