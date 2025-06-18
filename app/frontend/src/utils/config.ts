// app/frontend/conf/services/config.ts

const USER_API_PREFIX = '/api/users';
const GAME_API_PREFIX = '/api/game';

export const config = {
    api: {
        users: {
            // URL_ALL_USERS
            all: `${USER_API_PREFIX}/`,
            // URL_USER
            byId: (userId: number | string) => `${USER_API_PREFIX}/${userId}`,
            // URL_USER_ME
            me: `${USER_API_PREFIX}/me`,
            // URL_USER_MATCH
            matchesByUserId: (userId: number | string) => `${USER_API_PREFIX}/${userId}/matches`,
        },
        auth: {
            // URL_LOGIN
            login: `${USER_API_PREFIX}/auth/login`,
            // URL_REGISTER
            register: `${USER_API_PREFIX}/auth/register`,
            // URL_LOGOUT
            logout: `${USER_API_PREFIX}/auth/logout`,
            // URL_CSRF
            csrf: `${USER_API_PREFIX}/csrf-token`,
        },
        friends: {
            // URL_FRIEND_LIST
            list: `${USER_API_PREFIX}/friends/friends`,
            // URL_FRIEND_REQUEST (pour envoyer une demande)
            sendRequest: `${USER_API_PREFIX}/friends/requests`,
            // URL_FRIEND_RECEIVED
            receivedRequests: `${USER_API_PREFIX}/friends/requests/received`,
            // URL_FRIEND_SENT
            sentRequests: `${USER_API_PREFIX}/friends/requests/sent`,
            // URL_FRIEND_ACCEPT
            acceptRequest: (friendshipId: number) => `${USER_API_PREFIX}/friends/requests/${friendshipId}/accept`,
            // URL_FRIEND_DECLINE
            declineRequest: (friendshipId: number) => `${USER_API_PREFIX}/friends/requests/${friendshipId}/decline`,
            // URL_FRIEND_CANCEL
            cancelRequest: (friendshipId: number) => `${USER_API_PREFIX}/friends/requests/${friendshipId}/cancel`,
            // URL_FRIEND_REMOVE
            remove: (friendshipId: number) => `${USER_API_PREFIX}/friends/${friendshipId}/remove`,
        },
        game: {
            // URL_MATCH (POST pour créer, GET pour récupérer)
            match: (matchId?: string) => matchId ? `${GAME_API_PREFIX}/match/remote/${matchId}` : `${GAME_API_PREFIX}/match`,
            // URL_MATCH_USER
            matchHistory: (userId: number | string) => `${GAME_API_PREFIX}/history/${userId}`,
        }
    }
};