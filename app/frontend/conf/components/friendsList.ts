// /components/friendsList.ts
import { Friend } from '../shared/types.js';
import { navigateTo } from '../services/router.js'; // Pour l'action "view-profile"

interface FriendsListProps {
	friends: Friend[];
	onRemoveFriend: (friendId: number) => Promise<void>; // Callback pour supprimer un ami
	// onBlockFriend: (friendId: number) => Promise<void>; // Exemple d'autre action
}

export function FriendsListComponent(props: FriendsListProps): HTMLElement {
	const { friends, onRemoveFriend } = props;

	const section = document.createElement('div');
	section.id = 'friends-list-section';
	section.className = 'mt-8 p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm';

	const title = document.createElement('h2');
	title.className = 'text-2xl font-semibold text-green-800 mb-4';
	title.innerHTML = `Mes Amis (<span id="friends-count">${friends.length}</span>)`;

	const ul = document.createElement('ul');
	ul.id = 'friends-list';
	ul.className = 'space-y-3';

	if (!friends.length) {
		ul.innerHTML = `<li class="text-gray-500 italic">Vous n'avez pas encore d'amis.</li>`;
	} else {
		friends.forEach(friend => {
			const actualFriendshipId = friend.friendship_id;
			const actualDisplayName = friend.friend_display_name || friend.friend_username;
			const actualUsername = friend.friend_username;
			const actualAvatarUrl = friend.friend_avatar_url;
			const actualFriendId = friend.friend_id;
			const actualStatus = friend.friend_online_status;

			const avatarFallbackChar = actualDisplayName ? actualDisplayName.charAt(0).toUpperCase() : 'U';
			const avatar = actualAvatarUrl || `https://via.placeholder.com/40/007bff/ffffff?text=${avatarFallbackChar}`;

			let statusIndicator = '';
			if (actualStatus) {
				const statusColor = actualStatus === 'online' ? 'bg-green-500' : (actualStatus === 'in-game' ? 'bg-yellow-500' : 'bg-gray-400');
				statusIndicator = `<span class="inline-block w-3 h-3 ${statusColor} rounded-full mr-2" title="${actualStatus}"></span>`;
			}

			const li = document.createElement('li');
			li.dataset.friendId = actualFriendId.toString();
			li.dataset.friendshipId = actualFriendshipId.toString();
			li.className = 'p-3 bg-white border border-gray-200 rounded-md shadow-sm flex justify-between items-center';
			li.innerHTML = `
                <div class="flex items-center">
                    <img src="${avatar}" alt="${actualDisplayName}" class="w-10 h-10 rounded-full mr-3 object-cover">
                    <div>
                        ${statusIndicator}
                        <strong class="text-green-700">${actualDisplayName}</strong>
                        <span class="text-xs text-gray-500 block">(${actualUsername})</span>
                    </div>
                </div>
                <div>
                    <button data-action="view-profile" data-user-id="${actualFriendId}" class="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-2 rounded mr-1">Profil</button>
                    <button data-action="remove-friend" data-user-id="${actualFriendshipId}" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded">Supprimer</button>
                </div>
            `;
			ul.appendChild(li);
		});
	}

	section.appendChild(title);
	section.appendChild(ul);

	// Gestionnaire d'événements pour la liste d'amis
	ul.addEventListener('click', async (event) => {
		const target = event.target as HTMLElement;
		if (target.tagName !== 'BUTTON' || !target.dataset.action) return;

		const button = target as HTMLButtonElement;
		const listItem = target.closest('li[data-friend-id]') as HTMLLIElement;
		if (!listItem) return;

		const friendId = parseInt(listItem.dataset.friendId || '', 10);
		const friendshipId = parseInt(listItem.dataset.friendshipId || '', 10);
		if (isNaN(friendId) || isNaN(friendshipId)) return;

		const action = target.dataset.action;

		if (action === 'view-profile') {
			navigateTo(`/profile/${friendId}`);
		} else if (action === 'remove-friend') {
			if (confirm(`Êtes-vous sûr de vouloir supprimer cet ami ?`)) {
				button.disabled = true;
				button.textContent = '...';
				try {
					await onRemoveFriend(friendshipId);
				} catch (error: any) {
					console.error('Erreur lors de la suppression de l\'ami:', error);
					alert(`Erreur: ${error.message || 'Impossible de supprimer l\'ami.'}`);
					button.disabled = false;
					button.textContent = 'Supprimer';
				}
			}
		}
	});

	return section;
}