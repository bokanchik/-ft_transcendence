import { Friend } from '../shared/schemas/friendsSchemas.js';
import { UserOnlineStatus } from '../shared/schemas/usersSchemas.js';
import { navigateTo } from '../services/router.js';
import { showCustomConfirm, showToast } from './toast.js';
import { t } from '../services/i18nService.js';

interface FriendsListProps {
	friends: Friend[];
	onRemoveFriend: (friendshipId: number) => Promise<void>;
}

export function FriendsListComponent(props: FriendsListProps): HTMLElement {
	const { friends, onRemoveFriend } = props;

	const section = document.createElement('div');
	section.id = 'friends-list-section';
	section.className = '';

	const title = document.createElement('h2');
	title.className = 'text-xl font-semibold text-white mb-4';
	title.innerHTML = `${t('friend.list.accepted.title')} (<span id="friends-count">${friends.length}</span>)`;

	const ul = document.createElement('ul');
	ul.id = 'friends-list';
	ul.className = 'space-y-4';

	if (!friends.length) {
		ul.innerHTML = `<li class="text-gray-300 italic p-4 text-center">${t('friend.list.accepted.noFriends')}</li>`;
	} else {
		friends.forEach(friend => {
			const displayName = friend.friend_display_name;
			const avatarUrl = friend.friend_avatar_url;
			const friendId = friend.friend_id;
			const friendshipId = friend.friendship_id;
			const status = friend.friend_online_status;
			const wins = friend.friend_wins ?? 0;
			const losses = friend.friend_losses ?? 0;

			const avatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=40`;

			let statusIndicatorClass = 'bg-gray-400';
			let statusText = t('user.status.offline');

			if (status === UserOnlineStatus.ONLINE) {
				statusIndicatorClass = 'bg-green-500';
				statusText = t('user.status.online');
			} else if (status === UserOnlineStatus.IN_GAME) {
				statusIndicatorClass = 'bg-yellow-500';
				statusText = t('user.status.inGame');
			}

			const li = document.createElement('li');
			li.dataset.friendId = friendId.toString();
			li.dataset.friendshipId = friendshipId.toString();
			li.className = 'p-4 bg-black/20 border border-gray-500/30 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 hover:bg-black/30 transition-colors duration-200';
			li.innerHTML = `
                <div class="flex items-center w-full sm:w-auto">
                    <img src="${avatar}" alt="${displayName}" class="w-12 h-12 rounded-full mr-4 object-cover">
                    <div class="flex-grow">
                        <div class="flex items-center mb-1">
                            <span class="inline-block w-3 h-3 ${statusIndicatorClass} rounded-full mr-2" title="${statusText}"></span>
                            <strong class="text-lg text-gray-100">${displayName}</strong>
                        </div>
                        <div class="text-xs text-gray-400">
                            <span>${t('user.wins')}: ${wins}</span> | <span>${t('user.losses')}: ${losses}</span>
                        </div>
                    </div>
                </div>
                <div class="flex space-x-2 self-end sm:self-center pt-2 sm:pt-0">
                    <button data-action="view-profile" data-user-id="${friendId}" class="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-md border border-blue-400/50 transition-colors duration-200">${t('friend.list.accepted.viewProfile')}</button>
                    <button data-action="remove-friend" data-friendship-id="${friendshipId}" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-3 rounded-md border border-red-400/50 transition-colors duration-200">${t('friend.remove')}</button>
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
				const confirmed = await showCustomConfirm(t('friend.list.accepted.removeMsg'), t('friend.list.accepted.removeMsgTitle'));

				if (confirmed) {
					button.disabled = true;
					button.textContent = '...';
					try {
						await onRemoveFriend(parseInt(friendshipIdToRemove, 10));
						showToast(t('friend.list.accepted.removeSuccess'), 'success');
					} catch (error: any) {
						console.error('Error while removing friend: ', error);
						showToast(`${t('general.error')}: ${error.message || t('friend.list.accepted.removeError')}`, 'error');
						button.disabled = false;
						button.textContent = t('friend.remove');
					}
				}
			}
		}
	});

	return section;
}
