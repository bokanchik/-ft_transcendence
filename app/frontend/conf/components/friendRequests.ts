// /components/friendRequests.ts
import { PendingFriendRequest } from '../shared/types.js';

interface FriendRequestsProps {
	receivedRequests: PendingFriendRequest[];
	sentRequests: PendingFriendRequest[];
	onAcceptRequest: (friendshipId: number) => Promise<void>;
	onDeclineRequest: (friendshipId: number) => Promise<void>;
	onCancelRequest: (friendshipId: number) => Promise<void>;
}

export function FriendRequestsComponent(props: FriendRequestsProps): HTMLElement {
	const { receivedRequests, sentRequests, onAcceptRequest, onDeclineRequest, onCancelRequest } = props;

	const section = document.createElement('div');
	section.id = 'friend-requests-section';
	section.className = 'mt-8 p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm';
	section.innerHTML = `
        <h2 class="text-2xl font-semibold text-indigo-800 mb-4">Demandes d'amis</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-xl font-medium text-indigo-700 mb-3">Reçues (<span id="received-requests-count">${receivedRequests.length}</span>)</h3>
                <ul id="received-requests-list" class="space-y-3">
                    ${renderReceivedItems(receivedRequests)}
                </ul>
            </div>
            <div>
                <h3 class="text-xl font-medium text-indigo-700 mb-3">Envoyées (<span id="sent-requests-count">${sentRequests.length}</span>)</h3>
                <ul id="sent-requests-list" class="space-y-3">
                    ${renderSentItems(sentRequests)}
                </ul>
            </div>
        </div>
    `;

	// Gestionnaire d'événements unifié pour les demandes d'amis
	section.addEventListener('click', async (event) => {
		const target = event.target as HTMLElement;
		if (target.tagName !== 'BUTTON' || !target.dataset.action) return;

		const button = target as HTMLButtonElement;
		const listItem = target.closest('li[data-friendship-id]') as HTMLLIElement;
		if (!listItem) return;

		const friendshipId = parseInt(listItem.dataset.friendshipId || '', 10);
		if (isNaN(friendshipId)) return;

		const action = target.dataset.action;
		button.disabled = true;
		button.textContent = '...';

		try {
			let message = '';
			if (action === 'accept') {
				await onAcceptRequest(friendshipId);
			} else if (action === 'decline') {
				await onDeclineRequest(friendshipId);
			} else if (action === 'cancel') {
				await onCancelRequest(friendshipId);
			}
		} catch (error: any) {
			console.error(`Erreur lors de l'action '${action}':`, error);
			alert(`Erreur: ${error.message || 'Une erreur est survenue.'}`);
			button.disabled = false; // Restaurer le bouton en cas d'erreur
			button.textContent = action.charAt(0).toUpperCase() + action.slice(1); // Restaurer le texte original
		}
	});

	return section;
}

// Fonctions utilitaires de rendu (pourrait être dans le composant ou séparées)
function renderReceivedItems(requests: PendingFriendRequest[]): string {
	if (!requests.length) {
		return `<li class="text-gray-500 italic">Aucune demande reçue.</li>`;
	}
	return requests.map(req => `
        <li data-friendship-id="${req.friendship_id}" class="p-3 bg-white border border-gray-200 rounded-md shadow-sm flex justify-between items-center">
            <div>
                <strong class="text-indigo-600">${req.requester?.display_name || req.requester?.username}</strong>
                <span class="text-xs text-gray-500 block">(${req.requester?.username})</span>
            </div>
            <div>
                <button data-action="accept" class="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded mr-1">Accepter</button>
                <button data-action="decline" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded">Refuser</button>
            </div>
        </li>
    `).join('');
}

function renderSentItems(requests: PendingFriendRequest[]): string {
	if (!requests.length) {
		return `<li class="text-gray-500 italic">Aucune demande envoyée.</li>`;
	}
	return requests.map(req => `
        <li data-friendship-id="${req.friendship_id}" class="p-3 bg-white border border-gray-200 rounded-md shadow-sm flex justify-between items-center">
             <div>
                <strong class="text-indigo-600">${req.receiver?.display_name || req.receiver?.username}</strong>
                 <span class="text-xs text-gray-500 block">(${req.receiver?.username})</span>
            </div>
            <button data-action="cancel" class="text-xs bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-1 px-2 rounded">Annuler</button>
        </li>
    `).join('');
}