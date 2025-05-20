import { User as ApiUser, Friend, PendingFriendRequest, FriendRequestUserData } from '../shared/types.js'; // Ajout de FriendRequestUserData si ce n'est pas déjà dans ApiUser

// Définition des props pour UserList
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
        li.className = 'flex items-center p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200';
        li.dataset.userId = user.id.toString();

        const avatar = document.createElement('img');
        avatar.className = 'w-12 h-12 rounded-full object-cover mr-4';
        const avatarFallbackName = user.display_name || user.username;
        avatar.src = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarFallbackName)}&background=random&color=fff&size=128`;
        avatar.alt = `${user.username} avatar`;

        const info = document.createElement('div');
        info.className = 'flex-1';

        const topInfo = document.createElement('div');
        topInfo.className = 'flex items-center justify-between mb-1';

        const username = document.createElement('h2');
        username.className = 'text-lg font-semibold text-blue-700';
        username.textContent = user.display_name || user.username;
        
        const displayName = document.createElement('span');
        displayName.className = 'text-gray-500 text-xs ml-2';
        // Afficher le username seulement s'il est différent du display_name ET que display_name existe
        if (user.display_name && user.display_name !== user.username) { 
            displayName.textContent = `(@${user.username})`;
        }


        let onlineStatusIndicator = '';
        const statusProperty = user.status;
        if (statusProperty) {
            const statusColor = statusProperty === 'online' ? 'bg-green-500' : (statusProperty === 'in-game' ? 'bg-yellow-500' : 'bg-gray-400');
            onlineStatusIndicator = `<span class="inline-block w-2.5 h-2.5 ${statusColor} rounded-full mr-2" title="${statusProperty}"></span>`;
        }
        
        const usernameWrapper = document.createElement('div');
        usernameWrapper.className = 'flex items-center';
        usernameWrapper.innerHTML = onlineStatusIndicator;
        usernameWrapper.appendChild(username);
        usernameWrapper.appendChild(displayName);

        topInfo.appendChild(usernameWrapper);

        const email = document.createElement('p');
        email.className = 'text-gray-600 text-xs';
        email.textContent = `📧 ${user.email}`;

        info.appendChild(topInfo);
        info.appendChild(email);

        li.appendChild(avatar);
        li.appendChild(info);

        const actionContainer = document.createElement('div');
        actionContainer.className = 'ml-4 flex flex-col items-end space-y-1 text-sm';

        const friendshipStatus = document.createElement('span');
        friendshipStatus.className = 'text-xs italic text-gray-500 mb-1';

        let actionButton: HTMLButtonElement | null = null;

        const isFriend = friends.some(f => f.friend_id === user.id);
        // CORRECTION ICI: Accéder à .id sur l'objet receiver/requester
        const sentRequestToThisUser = sentRequests.find(r => r.receiver?.id === user.id);
        const receivedRequestFromThisUser = receivedRequests.find(r => r.requester?.id === user.id);

        if (isFriend) {
            friendshipStatus.textContent = 'Ami';
            friendshipStatus.className += ' text-green-600 font-semibold';
            // if (props.onRemoveFriend) { // Vérifier si la prop est fournie
            //     actionButton = createActionButton('Supprimer', 'bg-red-500', () => props.onRemoveFriend!(user.id));
            // }
        } else if (sentRequestToThisUser) {
            friendshipStatus.textContent = 'Demande envoyée';
            friendshipStatus.className += ' text-yellow-600';
            actionButton = createActionButton('Annuler', 'bg-yellow-500 text-black', () => onCancelRequest(sentRequestToThisUser.friendship_id));
        } else if (receivedRequestFromThisUser) {
            friendshipStatus.textContent = 'Demande reçue';
            friendshipStatus.className += ' text-indigo-600';
            const receivedButtonsContainer = document.createElement('div');
            receivedButtonsContainer.className = 'flex space-x-1';
            const acceptBtn = createActionButton('Accepter', 'bg-green-500', () => onAcceptRequest(receivedRequestFromThisUser.friendship_id));
            const declineBtn = createActionButton('Refuser', 'bg-red-500', () => onDeclineRequest(receivedRequestFromThisUser.friendship_id));
            receivedButtonsContainer.appendChild(acceptBtn);
            receivedButtonsContainer.appendChild(declineBtn);
            actionContainer.appendChild(receivedButtonsContainer);
        } else {
            friendshipStatus.textContent = 'Non ami';
            actionButton = createActionButton('Inviter', 'bg-blue-500', () => onSendRequest(user.id));
        }
        
        actionContainer.prepend(friendshipStatus);
        if (actionButton && !actionContainer.querySelector('button')) {
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
        const originalText = button.textContent; // originalText est une string ici, pas null
        button.textContent = '...';
        try {
            await onClick();
        } catch (error) {
            // CORRECTION ICI: Vérifier originalText avant .toLowerCase()
            const actionText = originalText || 'action'; // Fournir une valeur par défaut
            console.error(`Error performing action "${actionText}":`, error);
            alert(`Failed to ${actionText.toLowerCase()}.`);
            button.textContent = originalText;
            button.disabled = false;
        }
    });
    return button;
}
