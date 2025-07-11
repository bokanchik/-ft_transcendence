import { Friend, PendingFriendRequest } from '../shared/schemas/friendsSchemas.js';
import { User as ApiUser, UserOnlineStatus } from '../shared/schemas/usersSchemas.js';
import { createActionButton } from '../utils/domUtils.js';
import { t } from '../services/i18nService.js';

export interface UserListProps {
	users: ApiUser[];
	friends: Friend[];
	sentRequests: PendingFriendRequest[];
	receivedRequests: PendingFriendRequest[];
	currentUserId: number;
	onSendRequest: (targetUserId: number) => Promise<void>;
	onCancelRequest: (friendshipId: number) => Promise<void>;
	onAcceptRequest: (friendshipId: number) => Promise<void>;
	onDeclineRequest: (friendshipId: number) => Promise<void>;
	onRemoveFriend?: (targetUserId: number) => Promise<void>;
}

export function UserList(props: UserListProps): HTMLElement {
	const {
		users,
		friends,
		sentRequests,
		receivedRequests,
		currentUserId,
		onSendRequest,
		onCancelRequest,
		onAcceptRequest,
		onDeclineRequest
	} = props;

	const ul = document.createElement('ul');
	ul.className = 'space-y-4';

	const otherUsers = users.filter(user => user.id !== currentUserId);

	if (otherUsers.length === 0) {
		const li = document.createElement('li');
		li.className = 'text-center text-gray-300 py-4';
		li.textContent = t('user.noUser');
		ul.appendChild(li);
		return ul;
	}

	otherUsers.forEach(user => {
		const li = document.createElement('li');
		li.className = 'p-4 bg-black/20 border border-gray-500/30 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 hover:bg-black/30 transition-colors duration-200';

		li.dataset.userId = user.id.toString();

		const userPrimaryInfoContainer = document.createElement('div');
		userPrimaryInfoContainer.className = 'flex items-center w-full sm:w-auto';

		const displayName = user.display_name || user.username;
		const avatarUrl = user.avatar_url;
		const status: UserOnlineStatus = user.status as UserOnlineStatus;
		const wins = user.wins ?? 0;
		const losses = user.losses ?? 0;

		const avatarSrc = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=40`;

		let statusIndicatorClass = 'bg-gray-400';
		let statusText = t('user.status.offline');

		if (status === UserOnlineStatus.ONLINE) {
			statusIndicatorClass = 'bg-green-500';
			statusText = t('user.status.online');
		} else if (status === UserOnlineStatus.IN_GAME) {
			statusIndicatorClass = 'bg-yellow-500';
			statusText = t('user.status.inGame');
		}
		const avatarImg = document.createElement('img');
		avatarImg.src = avatarSrc;
		avatarImg.alt = displayName;
		avatarImg.className = 'w-12 h-12 rounded-full mr-4 object-cover';

		const infoDiv = document.createElement('div');
		infoDiv.className = 'flex-grow';

		const nameContainer = document.createElement('div');
		nameContainer.className = 'flex items-center mb-1';

		const statusIndicator = document.createElement('span');
		statusIndicator.className = `inline-block w-3 h-3 ${statusIndicatorClass} rounded-full mr-2`;
		statusIndicator.title = statusText;

		const nameStrong = document.createElement('strong');
		nameStrong.className = 'text-lg text-gray-200 font-medium font-beach';
		nameStrong.textContent = displayName;

		nameContainer.append(statusIndicator, nameStrong);

		const statsDiv = document.createElement('div');
		statsDiv.className = 'text-xs text-gray-400';

		const winsSpan = document.createElement('span');
		winsSpan.textContent = `${t('user.wins')}: ${wins}`;

		const lossesSpan = document.createElement('span');
		lossesSpan.textContent = `${t('user.losses')}: ${losses}`;

		statsDiv.append(winsSpan, ' | ', lossesSpan);
		infoDiv.append(nameContainer, statsDiv);
		userPrimaryInfoContainer.append(avatarImg, infoDiv);
		li.appendChild(userPrimaryInfoContainer);

		const actionContainer = document.createElement('div');
		actionContainer.className = 'flex flex-col items-end space-y-1 text-sm self-end sm:self-center pt-2 sm:pt-0 sm:ml-4';


		const friendshipStatus = document.createElement('span');
		friendshipStatus.className = 'text-xs italic text-gray-400 mb-1';

		let actionButton: HTMLButtonElement | null = null;
		let actionButtonsContainer: HTMLElement | null = null;

		const isFriend = friends.some(f => f.friend_id === user.id);
		const sentRequestToThisUser = sentRequests.find(r => r.receiver?.id === user.id);
		const receivedRequestFromThisUser = receivedRequests.find(r => r.requester?.id === user.id);

		if (isFriend) {
			friendshipStatus.textContent = t('friend.status.friend');
			friendshipStatus.className += ' text-green-400 font-semibold';
		} else if (sentRequestToThisUser) {
			friendshipStatus.textContent = t('friend.requestSent');
			friendshipStatus.className += ' text-yellow-400';
			actionButton = createActionButton({
				text: t('friend.cancel'),
				variant: 'warning',
				onClick: () => onCancelRequest(sentRequestToThisUser.friendship_id)
			});
		} else if (receivedRequestFromThisUser) {
			friendshipStatus.textContent = t('friend.requestReceived');
			friendshipStatus.className += ' text-indigo-400';

			actionButtonsContainer = document.createElement('div');
			actionButtonsContainer.className = 'flex space-x-1';
			const acceptBtn = createActionButton({
				text: t('friend.accept'),
				variant: 'success',
				onClick: () => onAcceptRequest(receivedRequestFromThisUser.friendship_id)
			});
			const declineBtn = createActionButton({
				text: t('friend.decline'),
				variant: 'danger',
				onClick: () => onDeclineRequest(receivedRequestFromThisUser.friendship_id)
			});
			actionButtonsContainer.appendChild(acceptBtn);
			actionButtonsContainer.appendChild(declineBtn);
		} else {
			friendshipStatus.textContent = t('friend.status.notFriend');
			actionButton = createActionButton({
				text: t('friend.request'),
				variant: 'primary',
				onClick: () => onSendRequest(user.id)
			});
		}

		actionContainer.prepend(friendshipStatus);

		if (actionButtonsContainer) {
			actionContainer.appendChild(actionButtonsContainer);
		} else if (actionButton) {
			actionContainer.appendChild(actionButton);
		}

		li.appendChild(actionContainer);

		ul.appendChild(li);
	});

	return ul;
}

