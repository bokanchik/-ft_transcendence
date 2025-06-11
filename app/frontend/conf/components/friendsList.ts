// /components/friendsList.ts
import { Friend } from '../shared/schemas/friendsSchemas.js';
import { UserOnlineStatus } from '../shared/schemas/usersSchemas.js';
import { navigateTo } from '../services/router.js';
import { showCustomConfirm, showToast } from './toast.js';

interface FriendsListProps {
	friends: Friend[];
	onRemoveFriend: (friendshipId: number) => Promise<void>;
}

export function FriendsListComponent(props: FriendsListProps): HTMLElement {
	const { friends, onRemoveFriend } = props;

	const section = document.createElement('div');
	section.id = 'friends-list-section';
	section.className = 'mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-lg'; // Changed background for better contrast

	const title = document.createElement('h2');
	title.className = 'text-2xl font-semibold text-gray-800 mb-6';
	title.innerHTML = `Mes Amis (<span id="friends-count">${friends.length}</span>)`;

	const ul = document.createElement('ul');
	ul.id = 'friends-list';
	ul.className = 'space-y-4';

	if (!friends.length) {
		ul.innerHTML = `<li class="text-gray-500 italic p-4 text-center">Vous n'avez pas encore d'amis.</li>`;
	} else {
		friends.forEach(friend => {
			const displayName = friend.friend_display_name;
			const avatarUrl = friend.friend_avatar_url;
			const friendId = friend.friend_id;
			const friendshipId = friend.friendship_id;
			const status = friend.friend_online_status;
			const wins = friend.friend_wins ?? 0;
			const losses = friend.friend_losses ?? 0;

			// const avatarFallbackName = displayName.charAt(0).toUpperCase();
			const avatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=40`;

			let statusIndicatorClass = 'bg-gray-400';
			let statusText = 'Offline';

			if (status === UserOnlineStatus.ONLINE) {
				statusIndicatorClass = 'bg-green-500';
				statusText = 'Online';
			} else if (status === UserOnlineStatus.IN_GAME) {
				statusIndicatorClass = 'bg-yellow-500';
				statusText = 'In Game';
			}

			const li = document.createElement('li');
			li.dataset.friendId = friendId.toString();
			li.dataset.friendshipId = friendshipId.toString();
			li.className = 'p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0';
			li.innerHTML = `
                <div class="flex items-center w-full sm:w-auto">
                    <img src="${avatar}" alt="${displayName}" class="w-12 h-12 rounded-full mr-4 object-cover">
                    <div class="flex-grow">
                        <div class="flex items-center mb-1">
                            <span class="inline-block w-3 h-3 ${statusIndicatorClass} rounded-full mr-2" title="${statusText}"></span>
                            <strong class="text-lg text-gray-700">${displayName}</strong>
                        </div>
                        <div class="text-xs text-gray-500">
                            <span>Wins: ${wins}</span> | <span>Losses: ${losses}</span>
                        </div>
                    </div>
                </div>
                <div class="flex space-x-2 self-end sm:self-center pt-2 sm:pt-0">
                    <button data-action="view-profile" data-user-id="${friendId}" class="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-md">Profil</button>
                    <button data-action="remove-friend" data-friendship-id="${friendshipId}" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-3 rounded-md">Supprimer</button>
                </div>
            `;
			ul.appendChild(li);
		});
	}

	section.appendChild(title);
	section.appendChild(ul);

	ul.addEventListener('click', async (event) => {
		const target = event.target as HTMLElement;
		const button = target.closest('button[data-action]') as HTMLButtonElement | null;
		if (!button) return;

		const action = button.dataset.action;
		if (action === 'view-profile') {
			const userIdToView = button.dataset.userId; // Get userId from button
			if (userIdToView) {
				navigateTo(`/profile/${userIdToView}`);
			}
		} else if (action === 'remove-friend') {
			const friendshipIdToRemove = button.dataset.friendshipId; // Get friendshipId from button
			if (friendshipIdToRemove) {
				// Utilisation de la nouvelle boîte de dialogue personnalisée
				const confirmed = await showCustomConfirm(
					'Êtes-vous sûr de vouloir supprimer cet ami de votre liste ? Cette action est irréversible.',
					'Supprimer l\'ami' // Titre optionnel
				);

				if (confirmed) {
					button.disabled = true;
					button.textContent = '...';
					try {
						await onRemoveFriend(parseInt(friendshipIdToRemove, 10));
						// showToast('Ami supprimé avec succès.', 'success'); // Exemple
					} catch (error: any) {
						console.error('Erreur lors de la suppression de l\'ami:', error);
						showToast(`Erreur: ${error.message || 'Impossible de supprimer l\'ami.'}`, 'error');
						button.disabled = false;
						button.textContent = 'Supprimer';
					}
				}
			}
			// if (friendshipIdToRemove && confirm(`Êtes-vous sûr de vouloir supprimer cet ami ?`)) {
			//     button.disabled = true;
			//     button.textContent = '...';
			//     try {
			//         await onRemoveFriend(parseInt(friendshipIdToRemove, 10));
			//         // button.closest('li')?.remove();
			//     } catch (error: any) {
			//         console.error('Erreur lors de la suppression de l\'ami:', error);
			//         alert(`Erreur: ${error.message || 'Impossible de supprimer l\'ami.'}`);
			//         button.disabled = false;
			//         button.textContent = 'Supprimer';
			//     }
			// }
		}
	});

	return section;
}
