import { UserData } from './authService.js'; // Ou le chemin correct

// Interfaces pour les données d'amitié (adaptez selon ce que votre API renvoie)
export interface FriendRequestUserData {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string | null;
}

export interface PendingFriendRequest {
    friendship_id: number;
    requester?: FriendRequestUserData; // Utilisé pour les demandes reçues
    receiver?: FriendRequestUserData; // Utilisé pour les demandes envoyées
    created_at: string;
}

export interface ApiErrorResponse {
	error: string;
    details?: any;
}

// export interface Friend {
//     id: number;
//     username: string;
//     display_name?: string;
//     avatar_url?: string;
//     status?: 'online' | 'offline' | 'in-game';
//     wins?: number;
//     loses?: number;
//     // Ajoutez d'autres champs si nécessaire (ex: date d'amitié, etc.)
// }

export interface Friend {
    friendship_id: number;
    friendship_status: string;
    friend_id: number;             // Utilisé pour data-friend-id et data-user-id
    friend_username: string;       // Utilisé pour l'affichage
    friend_display_name?: string;  // Utilisé pour l'affichage
    friend_avatar_url?: string;    // Utilisé pour l'avatar
    friend_wins?: number;
    friend_losses?: number;
    friend_online_status?: 'online' | 'offline' | 'in-game'; // Utilisé pour l'indicateur de statut
}

type FriendRequestResult =
	| { success: true; data: PendingFriendRequest[] }
	| { success: false; error: string };

type FriendActionResult =
    | { success: true; message: string }
    | { success: false; error: string };


const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        let errorData: ApiErrorResponse = { error: `Server error (${response.status})` };
        try {
            errorData = await response.json();
        } catch (jsonError) {
            // L'erreur n'est pas du JSON, utiliser le statusText
        }
        throw new Error(errorData.error || response.statusText);
    }
    return response.json();
};

// --- Fonctions pour interagir avec l'API des amis ---

/**
 * Récupère les demandes d'amitié reçues par l'utilisateur connecté.
 */
export async function getReceivedFriendRequests(): Promise<PendingFriendRequest[]> {
    const response = await fetch('/api/friends/requests/received', { // Adaptez l'URL
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important pour les cookies
    });
    return handleApiResponse(response);
}

/**
 * Récupère la liste des amis de l'utilisateur connecté.
 */
export async function getFriendsList(): Promise<Friend[]> {
    const response = await fetch('/api/friends/friends', { // Adaptez l'URL de l'API si besoin
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse(response); // Réutilise votre gestionnaire de réponse
}

/**
 * Récupère les demandes d'amitié envoyées par l'utilisateur connecté.
 */
export async function getSentFriendRequests(): Promise<PendingFriendRequest[]> {
     const response = await fetch('/api/friends/requests/sent', { // Adaptez l'URL
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse(response);
}

/**
 * Accepte une demande d'amitié.
 * @param friendshipId ID de la relation d'amitié (obtenu d'une demande reçue)
 */
export async function acceptFriendRequest(friendshipId: number): Promise<{ message: string }> {
    const response = await fetch(`/api/friends/requests/${friendshipId}/accept`, { // Adaptez l'URL
        method: 'POST',
        //headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse(response);
}

/**
 * Refuse une demande d'amitié reçue.
 * @param friendshipId ID de la relation d'amitié
 */
export async function declineFriendRequest(friendshipId: number): Promise<{ message: string }> {
    const response = await fetch(`/api/friends/requests/${friendshipId}/decline`, { // Adaptez l'URL
        method: 'POST', // ou DELETE selon votre API
        //headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse(response);
}

/**
 * Annule une demande d'amitié envoyée.
 * @param friendshipId ID de la relation d'amitié
 */
export async function cancelFriendRequest(friendshipId: number): Promise<{ message: string }> {
    const response = await fetch(`/api/friends/requests/${friendshipId}/cancel`, { // Adaptez l'URL
        method: 'POST', // ou DELETE selon votre API
        //headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse(response);
}
