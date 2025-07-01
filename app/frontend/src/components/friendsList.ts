import { Friend } from '../shared/schemas/friendsSchemas.js';
import { UserOnlineStatus } from '../shared/schemas/usersSchemas.js';
import { navigateTo } from '../services/router.js';
import { showCustomConfirm, showToast } from './toast.js';
import { t } from '../services/i18nService.js';
import { createElement, createActionButton } from '../utils/domUtils.js';

interface FriendsListProps {
	friends: Friend[];
	onRemoveFriend: (friendshipId: number) => Promise<void>;
}

export function FriendsListComponent(props: FriendsListProps): HTMLElement {
	const { friends, onRemoveFriend } = props;

	const section = createElement('div', { id: 'friends-list-section' });
	const ul = createElement('ul', { id: 'friends-list', className: 'space-y-4' });

	if (!friends.length) {
		const li = createElement('li', {
			className: 'text-gray-300 italic p-4 text-center',
			textContent: t('friend.list.accepted.noFriends')
		});
		ul.append(li)
	} else {
		friends.forEach(friend => {
			const displayName = friend.friend_display_name;
			const avatar = friend.friend_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=40`;

			let statusIndicatorClass = 'bg-gray-400', statusText = t('user.status.offline');
			if (friend.friend_online_status === UserOnlineStatus.ONLINE) {
				statusIndicatorClass = 'bg-green-500'; statusText = t('user.status.online');
			} else if (friend.friend_online_status === UserOnlineStatus.IN_GAME) {
				statusIndicatorClass = 'bg-yellow-500'; statusText = t('user.status.inGame');
			}

			const avatarImg = createElement('img', { src: avatar, alt: displayName, className: 'w-12 h-12 rounded-full mr-4 object-cover' });
			const statusIndicator = createElement('span', { className: `inline-block w-3 h-3 ${statusIndicatorClass} rounded-full mr-2`, title: statusText });
			const nameStrong = createElement('strong', { textContent: displayName, className: 'text-lg text-gray-100 font-medium font-roar' });
			const nameContainer = createElement('div', { className: 'flex items-center mb-1' }, [statusIndicator, nameStrong]);
			const winsSpan = createElement('span', { textContent: `${t('user.wins')}: ${friend.friend_wins ?? 0}` });
			const lossesSpan = createElement('span', { textContent: `${t('user.losses')}: ${friend.friend_losses ?? 0}` });
			const statsDiv = createElement('div', { className: 'text-xs text-gray-400' }, [winsSpan, ' | ', lossesSpan]);

			const infoDiv = createElement('div', { className: 'flex-grow' }, [nameContainer, statsDiv]);
			const userPrimaryInfoContainer = createElement('div', { className: 'flex items-center w-full sm:w-auto' }, [avatarImg, infoDiv]);

			const viewProfileBtn = createActionButton({
				text: t('friend.list.accepted.viewProfile'),
				variant: 'primary',
				onClick: () => navigateTo(`/profile/${friend.friend_id}`)
			});

			const removeFriendBtn = createActionButton({
				text: t('friend.remove'),
				variant: 'danger',
				onClick: async () => {
					const confirmed = await showCustomConfirm(t('friend.list.accepted.removeMsg'), t('friend.list.accepted.removeMsgTitle'));
					if (confirmed) {
						await onRemoveFriend(friend.friendship_id);
						showToast(t('friend.list.accepted.removeSuccess'), 'success');
					}
				}
			});

			const actionContainer = createElement('div', { className: 'flex space-x-2 self-end sm:self-center pt-2 sm:pt-0' }, [viewProfileBtn, removeFriendBtn]);

			const li = createElement('li', {
				className: 'p-4 bg-black/20 border border-gray-500/30 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 hover:bg-black/30 transition-colors duration-200'
			}, [userPrimaryInfoContainer, actionContainer]);

			li.dataset.friendId = friend.friend_id.toString();
			li.dataset.friendshipId = friend.friendship_id.toString();
			ul.append(li);
		});
	}

	section.append(ul);
	return section;
}
