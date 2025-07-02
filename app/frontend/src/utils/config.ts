const USER_API_PREFIX = '/api/users';
const GAME_API_PREFIX = '/api/game';

export const config = {
    api: {
        users: {
            all: `${USER_API_PREFIX}/`, // URL_ALL_USERS
            byId: (userId: number | string) => `${USER_API_PREFIX}/${userId}`, // URL_USER
            public: (userId: number | string) => `${USER_API_PREFIX}/${userId}/public`, // URL_USER_PUBLIC
            me: `${USER_API_PREFIX}/me`, // URL_USER_ME
            matchesByUserId: (userId: number | string) => `${USER_API_PREFIX}/${userId}/matches`, // URL_USER_MATCH
            twoFa: {
                generate: `${USER_API_PREFIX}/2fa/generate`, // URL_2FA
                verify: `${USER_API_PREFIX}/2fa/verify`, // URL_2FA_VERIFY
                disable: `${USER_API_PREFIX}/2fa/disable`, // URL_2FA_DISABLE
                login: `${USER_API_PREFIX}/2fa/login`, // URL_2FA_LOGIN
            },
        },
        auth: {
            login: `${USER_API_PREFIX}/auth/login`, // URL_LOGIN
            register: `${USER_API_PREFIX}/auth/register`, // URL_REGISTER
            logout: `${USER_API_PREFIX}/auth/logout`, // URL_LOGOUT
            csrf: `${USER_API_PREFIX}/csrf-token`, // URL_CSRF
        },
        friends: {
            list: `${USER_API_PREFIX}/friends/friends`, // URL_FRIEND_LIST
            sendRequest: `${USER_API_PREFIX}/friends/requests`, // URL_FRIEND_REQUEST
            receivedRequests: `${USER_API_PREFIX}/friends/requests/received`, // URL_FRIEND_RECEIVED
            sentRequests: `${USER_API_PREFIX}/friends/requests/sent`, // URL_FRIEND_SENT
            acceptRequest: (friendshipId: number) => `${USER_API_PREFIX}/friends/requests/${friendshipId}/accept`, // URL_FRIEND_ACCEPT
            declineRequest: (friendshipId: number) => `${USER_API_PREFIX}/friends/requests/${friendshipId}/decline`, // URL_FRIEND_DECLINE
            cancelRequest: (friendshipId: number) => `${USER_API_PREFIX}/friends/requests/${friendshipId}/cancel`, // URL_FRIEND_CANCEL
            remove: (friendshipId: number) => `${USER_API_PREFIX}/friends/${friendshipId}/remove`, // URL_FRIEND_REMOVE
        },
        game: {
            match: (matchId?: string) => matchId ? `${GAME_API_PREFIX}/match/remote/${matchId}` : `${GAME_API_PREFIX}/match`, // URL_MATCH
            matchHistory: (userId: number | string) => `${GAME_API_PREFIX}/history/${userId}`, // URL_MATCH_USER
        }
    }
};