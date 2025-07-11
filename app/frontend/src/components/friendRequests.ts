import { PendingFriendRequest, FriendRequestUserData } from '../shared/schemas/friendsSchemas.js';
import { t } from '../services/i18nService.js';
import { createActionButton, createElement } from '../utils/domUtils.js';

interface FriendRequestsProps {
	receivedRequests: PendingFriendRequest[];
	sentRequests: PendingFriendRequest[];
	onAcceptRequest: (friendshipId: number) => Promise<void>;
	onDeclineRequest: (friendshipId: number) => Promise<void>;
	onCancelRequest: (friendshipId: number) => Promise<void>;
}

function createRequestListItem(user: FriendRequestUserData | undefined, actionsElement: HTMLElement): HTMLLIElement {
	const displayName = user?.display_name || user?.username || 'Unknown User';
	const avatarSrc = user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=40`;

	const avatarImg = createElement('img', {
		src: avatarSrc,
		alt: `Avatar of ${displayName}`,
		className: 'w-10 h-10 rounded-full mr-3 object-cover'
	});

	const nameSpan = createElement('span', {
		textContent: displayName,
		className: 'text-gray-100 text-lg font-medium font-beach'
	});

	const userInfoContainer = createElement('div', {
		className: 'flex items-center'
	}, [avatarImg, nameSpan]);

	return createElement('li', {
		className: 'p-3 bg-black/20 border border-gray-500/30 rounded-lg flex justify-between items-center'
	}, [
		userInfoContainer,
		actionsElement
	]);
}


export function FriendRequestsComponent(props: FriendRequestsProps): HTMLElement {
	const { receivedRequests, sentRequests, onAcceptRequest, onDeclineRequest, onCancelRequest } = props;

	const section = createElement('div', { id: 'friend-requests-section' });

	const receivedCountSpan = createElement('span', { id: 'received-requests-count', textContent: receivedRequests.length.toString() });
	const receivedTitle = createElement('h3', { className: 'text-lg font-medium text-gray-200 mb-3' }, [
		`${t('friend.list.request.received')} (`,
		receivedCountSpan,
		`)`
	]);
	const receivedList = createElement('ul', { id: 'received-requests-list', className: 'space-y-3' }, renderReceivedItems(receivedRequests, onAcceptRequest, onDeclineRequest));
	const receivedContainer = createElement('div', {}, [receivedTitle, receivedList]);

	const sentCountSpan = createElement('span', { id: 'sent-requests-count', textContent: sentRequests.length.toString() });
	const sentTitle = createElement('h3', { className: 'text-lg font-medium text-gray-200 mb-3' }, [
		`${t('friend.list.request.sent')} (`,
		sentCountSpan,
		`)`
	]);
	const sentList = createElement('ul', { id: 'sent-requests-list', className: 'space-y-3' }, renderSentItems(sentRequests, onCancelRequest));
	const sentContainer = createElement('div', {}, [sentTitle, sentList]);

	section.append(
		createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' }, [
			receivedContainer,
			sentContainer
		])
	);

	return section;
}

function renderReceivedItems(requests: PendingFriendRequest[], onAccept: (id: number) => Promise<void>, onDecline: (id: number) => Promise<void>): (HTMLLIElement | Node)[] {
	if (!requests.length) {
		return [createElement('li', { textContent: t('friend.list.request.noRequests'), className: 'text-gray-300 italic' })];
	}
	return requests.map(req => {
		const acceptBtn = createActionButton({ text: t('friend.accept'), variant: 'success', onClick: () => onAccept(req.friendship_id) });
		const declineBtn = createActionButton({ text: t('friend.decline'), variant: 'danger', onClick: () => onDecline(req.friendship_id) });
		const actionContainer = createElement('div', { className: 'flex space-x-1' }, [acceptBtn, declineBtn]);

		return createRequestListItem(req.requester, actionContainer);
	});
}

function renderSentItems(requests: PendingFriendRequest[], onCancel: (id: number) => Promise<void>): (HTMLLIElement | Node)[] {
	if (!requests.length) {
		return [createElement('li', { textContent: t('friend.list.request.noSentRequests'), className: 'text-gray-300 italic' })];
	}
	return requests.map(req => {
		const cancelBtn = createActionButton({ text: t('friend.cancel'), variant: 'warning', onClick: () => onCancel(req.friendship_id) });

		return createRequestListItem(req.receiver, cancelBtn);
	});
}
