import { getUserDataFromStorage } from "../services/authService.js";
import { navigateTo } from "../services/router.js";
import { User } from "../shared/schemas/usersSchemas.js";
import { HeaderComponent } from '../components/headerComponent.js';
import { t } from '../services/i18nService.js';
import { getFriendsList } from "../services/friendService.js";
import { showToast, showWaitingToast } from "./toast.js";
import { fetchCsrfToken } from "../services/csrf.js";
import socket from "../services/socket.js";

const WAITING_TIME = 60;

export async function PlayAFriendPage(): Promise<HTMLDivElement> {
    const currentUser: User | null = getUserDataFromStorage();

    if (!currentUser) {
        navigateTo('/login');
        const redirectMsg = document.createElement('div');
        redirectMsg.className = 'min-h-screen flex items-center justify-center text-xl';
        redirectMsg.textContent = t('msg.redirect.login');
        return redirectMsg;
    }

    try {
        await fetchCsrfToken();
    } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'min-h-screen flex items-center justify-center text-xl text-red-500';
        errorMsg.textContent = t('msg.error.initializing');
        return errorMsg;
    }

    const page: HTMLDivElement = document.createElement('div');
    page.className = 'flex flex-col min-h-screen bg-gray-100';

    const header: HTMLElement = HeaderComponent({ currentUser });
    page.appendChild(header);

    const container: HTMLDivElement = document.createElement('div');
    container.className = 'flex flex-col items-center p-8';

    const title: HTMLHeadElement = document.createElement('h2');
    title.textContent = 'Invite a Friend';
    title.className = 'text-3xl font-bold mb-6 text-gray-800';
    container.appendChild(title);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search by username or display name';
    searchInput.className = 'w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500';
    container.appendChild(searchInput);

    const friendList = document.createElement('div');
    friendList.className = 'w-full max-w-md space-y-4';
    container.appendChild(friendList);

    await loadFriends(friendList, searchInput);

    page.appendChild(container);
    return page;
}

async function loadFriends(friendList: HTMLDivElement, searchInput: HTMLInputElement) {
    
    try {
        const friends = await getFriendsList();
        
        for (const friend of friends) {
            
            const card = document.createElement('div');
            card.className = 'flex items-center justify-between p-4 bg-white rounded-xl shadow hover:shadow-md transition duration-200';
            card.setAttribute('data-name', `${friend.friend_username} ${friend.friend_display_name}`);
            
            const info = document.createElement('div');
            info.className = 'flex flex-col';
            
            const avatar = document.createElement('img');
            avatar.src = friend.friend_avatar_url || '/https://mariopartylegacy.com/wp-content/uploads/2011/08/dkprofile.png';
            avatar.className = 'w-12 h-12 rounded-full object-cover mb-2';
            
            const displayName = document.createElement('span');
            displayName.className = 'text-lg font-semibold text-gray-800';
            displayName.textContent = friend.friend_display_name;
            
            const username = document.createElement('span');
            username.className = 'text-sm text-gray-500';
            username.textContent = `@${friend.friend_username}`;
            
            info.appendChild(avatar);
            info.appendChild(displayName);
            info.appendChild(username);
            
            const inviteButton = document.createElement('button');
            inviteButton.textContent = 'Invite';
            inviteButton.className = 'bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition duration-200';
            
            let currentInvitatoinController: AbortController | null = null;

            inviteButton.addEventListener('click', async () => {
                try {
                    if (!currentInvitatoinController) {
                        const controller = new AbortController();
                        currentInvitatoinController = controller;

                        // send invite
                        await inviteFriendToGame(controller, friend.friend_id);

                        const allInviteButtons = friendList.querySelectorAll('button');
                        allInviteButtons.forEach(btn => {
                            if (btn === inviteButton) {
                                btn.textContent = 'Invited';
                                btn.classList.add('bg-red-500');
                            }
                            (btn as HTMLButtonElement).disabled = true;
                            btn.classList.add('opacity-50', 'cursor-not-allowed');
                        })
                        controller.signal.addEventListener('abort', () => {
                            resetButtons(controller, friendList);
                        });
                        
                    } else {
                        // cancel invite
                        currentInvitatoinController.abort();
                        currentInvitatoinController = null;
                    }
                } catch (err: unknown) {
                    showToast('Error while inviting a friend');
                }
            });
            
            card.appendChild(info);
            card.appendChild(inviteButton);
            friendList.appendChild(card);
        };
        
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            Array.from(friendList.children).forEach((child) => {
                const element = child as HTMLDivElement;
                const name = element.getAttribute('data-name')?.toLowerCase() || '';
                element.style.display = name.includes(query) ? '' : 'none';
            });
        });
    } catch (err: unknown) {
        console.error("Error loading friends:", err);
        friendList.textContent = t('msg.error.loadingFriends') || "Failed to load friends.";
    }
}

async function inviteFriendToGame(controller: AbortController, friend_id: number) {
    
    // socket.on('connect', () => {
        
    // });
    console.log(`Friend id: ${friend_id}`);
    try {
        const response = await fetch('/api/game/match/invites', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                friend_id,

            }),
        });
        if (!response.ok) {
             throw new Error(`Failed to send an invitation: ${await response.text}`);
        }
    } catch (err: unknown) {

    }
    showWaitingToast(socket, controller, WAITING_TIME);
}

function resetButtons(controller: AbortController | null, friendList: HTMLDivElement) {
    const allInviteButtons = friendList.querySelectorAll('button');
    allInviteButtons.forEach(btn => {
        (btn as HTMLButtonElement).disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.textContent = 'Invite';
        btn.className = 'bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition duration-200';
    });
    controller = null;
}