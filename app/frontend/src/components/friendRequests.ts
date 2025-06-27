import { PendingFriendRequest } from '../shared/schemas/friendsSchemas.js';
import { t } from '../services/i18nService.js';
import { showToast } from '../components/toast.js';

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
	// section.className = 'mt-8 p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm';
	section.className = '';
	// section.innerHTML = `
    //     <h2 class="text-2xl font-semibold text-indigo-800 mb-4">${t('friend.list.request.title')}</h2>
    //     <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    //         <div>
    //             <h3 class="text-xl font-medium text-indigo-700 mb-3">${t('friend.list.request.received')} (<span id="received-requests-count">${receivedRequests.length}</span>)</h3>
    //             <ul id="received-requests-list" class="space-y-3">
    //                 ${renderReceivedItems(receivedRequests)}
    //             </ul>
    //         </div>
    //         <div>
    //             <h3 class="text-xl font-medium text-indigo-700 mb-3">${t('friend.list.request.sent')} (<span id="sent-requests-count">${sentRequests.length}</span>)</h3>
    //             <ul id="sent-requests-list" class="space-y-3">
    //                 ${renderSentItems(sentRequests)}
    //             </ul>
    //         </div>
    //     </div>
    // `;
	section.innerHTML = `
        <h2 class="text-xl font-semibold text-white mb-6">${t('friend.list.request.title')}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-lg font-medium text-gray-200 mb-3">${t('friend.list.request.received')} (<span id="received-requests-count">${receivedRequests.length}</span>)</h3>
                <ul id="received-requests-list" class="space-y-3">
                    ${renderReceivedItems(receivedRequests)}
                </ul>
            </div>
            <div>
                <h3 class="text-lg font-medium text-gray-200 mb-3">${t('friend.list.request.sent')} (<span id="sent-requests-count">${sentRequests.length}</span>)</h3>
                <ul id="sent-requests-list" class="space-y-3">
                    ${renderSentItems(sentRequests)}
                </ul>
            </div>
        </div>
    `;

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
			if (action === 'accept') {
				await onAcceptRequest(friendshipId);
			} else if (action === 'decline') {
				await onDeclineRequest(friendshipId);
			} else if (action === 'cancel') {
				await onCancelRequest(friendshipId);
			}
		} catch (error: any) {
			console.error(`Error while attempting '${action}':`, error);
			alert(`Error: ${error.message || t('msg.error.any')}`);
			showToast(`${t('general.error')}: ${error.message || t('msg.error.any')}`, 'error');
			button.disabled = false;
			button.textContent = action.charAt(0).toUpperCase() + action.slice(1);
		}
	});

	return section;
}

function renderReceivedItems(requests: PendingFriendRequest[]): string {
	if (!requests.length) {
		// return `<li class="text-gray-500 italic">${t('friend.list.request.noRequests')}</li>`;
		return `<li class="text-gray-300 italic">${t('friend.list.request.noRequests')}</li>`;
	}
	// return requests.map(req => `
    //     <li data-friendship-id="${req.friendship_id}" class="p-3 bg-white border border-gray-200 rounded-md shadow-sm flex justify-between items-center">
    //         <div>
    //             <strong class="text-indigo-600">${req.requester?.display_name || req.requester?.username}</strong>
    //             <span class="text-xs text-gray-500 block">(${req.requester?.username})</span>
    //         </div>
    //         <div>
    //             <button data-action="accept" class="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded mr-1">${t('friend.accept')}</button>
    //             <button data-action="decline" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded">${t('friend.decline')}</button>
    //         </div>
    //     </li>
    // `).join('');
	return requests.map(req => `
        <li data-friendship-id="${req.friendship_id}" class="p-3 bg-black/20 border border-gray-500/30 rounded-lg flex justify-between items-center">
            <div>
                <strong class="text-gray-100">${req.requester?.display_name || req.requester?.username}</strong>
                <span class="text-xs text-gray-400 block">(${req.requester?.username})</span>
            </div>
            <div class="flex space-x-1">
                <button data-action="accept" class="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded border border-green-400/50 transition-colors duration-200">${t('friend.accept')}</button>
                <button data-action="decline" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded border border-red-400/50 transition-colors duration-200">${t('friend.decline')}</button>
            </div>
        </li>
    `).join('');
}

function renderSentItems(requests: PendingFriendRequest[]): string {
	if (!requests.length) {
		// return `<li class="text-gray-500 italic">${t('friend.list.request.noSentRequests')}</li>`;
		return `<li class="text-gray-300 italic">${t('friend.list.request.noSentRequests')}</li>`;
	}
	// return requests.map(req => `
    //     <li data-friendship-id="${req.friendship_id}" class="p-3 bg-white border border-gray-200 rounded-md shadow-sm flex justify-between items-center">
    //          <div>
    //             <strong class="text-indigo-600">${req.receiver?.display_name || req.receiver?.username}</strong>
    //              <span class="text-xs text-gray-500 block">(${req.receiver?.username})</span>
    //         </div>
    //         <button data-action="cancel" class="text-xs bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-1 px-2 rounded">${t('friend.cancel')}</button>
    //     </li>
    // `).join('');
	return requests.map(req => `
        <li data-friendship-id="${req.friendship_id}" class="p-3 bg-black/20 border border-gray-500/30 rounded-lg flex justify-between items-center">
             <div>
                <strong class="text-gray-100">${req.receiver?.display_name || req.receiver?.username}</strong>
                 <span class="text-xs text-gray-400 block">(${req.receiver?.username})</span>
            </div>
            <button data-action="cancel" class="text-xs bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-1 px-2 rounded border border-yellow-400/50 transition-colors duration-200">${t('friend.cancel')}</button>
        </li>
    `).join('');
}
