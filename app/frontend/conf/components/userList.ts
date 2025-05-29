//@ts-ignore
import { User as ApiUser, Friend, PendingFriendRequest, UserOnlineStatus } from '../shared/types.js';

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
    onRemoveFriend?: (targetUserId: number) => Promise<void>; // Rendu optionnel
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
        ul.innerHTML = '<li class="text-center text-gray-500 py-4">Aucun autre utilisateur à afficher.</li>';
        return ul;
    }

    otherUsers.forEach(user => {
        const li = document.createElement('li');
        li.className = 'p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 hover:shadow-md transition-shadow duration-200';
        li.dataset.userId = user.id.toString();

        const userPrimaryInfoContainer = document.createElement('div');
        userPrimaryInfoContainer.className = 'flex items-center w-full sm:w-auto';

        const displayName = user.display_name || user.username;
        const avatarUrl = user.avatar_url;
        const status: UserOnlineStatus = user.status as UserOnlineStatus;
        const wins = user.wins ?? 0;
        const losses = user.losses ?? 0;

        const avatarSrc = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=40`;

        let statusIndicatorClass = 'bg-gray-400'; // Offline par défaut
        let statusText = 'Offline';

        if (status === UserOnlineStatus.ONLINE) {
            statusIndicatorClass = 'bg-green-500';
            statusText = 'Online';
        } else if (status === UserOnlineStatus.IN_GAME) {
            statusIndicatorClass = 'bg-yellow-500';
            statusText = 'In Game';
        }

        userPrimaryInfoContainer.innerHTML = `
            <img src="${avatarSrc}" alt="${displayName}" class="w-12 h-12 rounded-full mr-4 object-cover">
            <div class="flex-grow">
                <div class="flex items-center mb-1">
                    <span class="inline-block w-3 h-3 ${statusIndicatorClass} rounded-full mr-2" title="${statusText}"></span>
                    <strong class="text-lg text-gray-700">${displayName}</strong>
                    <!-- Le (@username) a été enlevé d'ici -->
                </div>
                <div class="text-xs text-gray-500">
                    <span>Wins: ${wins}</span> | <span>Losses: ${losses}</span>
                </div>
            </div>
        `;
        li.appendChild(userPrimaryInfoContainer);

        const actionContainer = document.createElement('div');
        actionContainer.className = 'flex flex-col items-end space-y-1 text-sm self-end sm:self-center pt-2 sm:pt-0 sm:ml-4';


        const friendshipStatus = document.createElement('span');
        friendshipStatus.className = 'text-xs italic text-gray-500 mb-1';

        let actionButton: HTMLButtonElement | null = null;
        let actionButtonsContainer: HTMLElement | null = null;

        const isFriend = friends.some(f => f.friend_id === user.id);
        const sentRequestToThisUser = sentRequests.find(r => r.receiver?.id === user.id);
        const receivedRequestFromThisUser = receivedRequests.find(r => r.requester?.id === user.id);

        if (isFriend) {
            friendshipStatus.textContent = 'Ami';
            friendshipStatus.className += ' text-green-600 font-semibold';
        } else if (sentRequestToThisUser) {
            friendshipStatus.textContent = 'Demande envoyée';
            friendshipStatus.className += ' text-yellow-600';
            actionButton = createActionButton('Annuler', 'bg-yellow-500 text-black', () => onCancelRequest(sentRequestToThisUser.friendship_id));
        } else if (receivedRequestFromThisUser) {
            friendshipStatus.textContent = 'Demande reçue';
            friendshipStatus.className += ' text-indigo-600';
            
            actionButtonsContainer = document.createElement('div');
            actionButtonsContainer.className = 'flex space-x-1'; // Mettre les boutons côte à côte
            const acceptBtn = createActionButton('Accepter', 'bg-green-500', () => onAcceptRequest(receivedRequestFromThisUser.friendship_id));
            const declineBtn = createActionButton('Refuser', 'bg-red-500', () => onDeclineRequest(receivedRequestFromThisUser.friendship_id));
            actionButtonsContainer.appendChild(acceptBtn);
            actionButtonsContainer.appendChild(declineBtn);
        } else {
            friendshipStatus.textContent = 'Non ami'; // Statut par défaut si aucune des conditions
            actionButton = createActionButton('Inviter', 'bg-blue-500', () => onSendRequest(user.id));
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

function createActionButton(text: string, baseClass: string, onClick: () => Promise<void>): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `${baseClass} text-white text-xs font-semibold py-1 px-2.5 rounded hover:opacity-80 transition-opacity disabled:opacity-50`;
    button.addEventListener('click', async (e) => {
        e.stopPropagation();
        button.disabled = true;
        const originalText = button.textContent; 
        button.textContent = '...';
        try {
            await onClick();
        } catch (error) {
            const actionText = originalText || 'action'; 
            console.error(`Error performing action "${actionText}":`, error);
            alert(`Failed to ${actionText.toLowerCase()}.`);
            button.textContent = originalText;
            button.disabled = false;
        }
    });
    return button;
}