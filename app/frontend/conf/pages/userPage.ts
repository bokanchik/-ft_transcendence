import { fetchUsers } from '../services/authService.js';
import { UserList } from '../components/userList.js';

export async function UsersPage(): Promise<HTMLElement> {
	const container = document.createElement('div');
	container.className = 'container mx-auto p-8';

	const title = document.createElement('h1');
	title.className = 'text-3xl font-bold mb-6 text-center text-blue-700';
	title.textContent = '🏓 King-Pong User List 🏓';

	const userListElement = document.createElement('div');
	userListElement.id = 'user-list';
	userListElement.className = 'mt-6 bg-white p-6 rounded-lg shadow-md';
	userListElement.innerHTML = '<p class="text-center text-gray-500">Loading users...</p>';

	container.appendChild(title);
	container.appendChild(userListElement);

	try {
		const users = await fetchUsers();
		userListElement.innerHTML = '';

		// Fournir des valeurs par défaut pour les props requises
		const userListProps = {
			users,
			friends: [],
			sentRequests: [],
			receivedRequests: [],
			currentUserId: -1, // ou null/undefined si tu adaptes UserList
			onSendRequest: async () => { },
			onCancelRequest: async () => { },
			onAcceptRequest: async () => { },
			onDeclineRequest: async () => { },
		};
		userListElement.appendChild(UserList(userListProps));
	} catch (error) {
		console.error("Failed to load users for UsersPage:", error);
		userListElement.innerHTML = '<p class="text-center text-red-500">Error loading users.</p>';
	}

	return container;
}
// app/frontend/conf/pages/userPage.ts
// import { fetchUsers } from '../services/authService.js';
// import { UserList, UserListProps } from '../components/userList.js';
// import { HeaderComponent } from '../components/headerComponent.js';
// import { getUserDataFromStorage } from '../services/authService.js';
// import {
//     getFriendsList,
//     getSentFriendRequests,
//     getReceivedFriendRequests,
//     sendFriendRequest,
//     cancelFriendRequest,
//     acceptFriendRequest,
//     declineFriendRequest
// } from '../services/friendService.js';
// import { showToast } from '../components/toast.js';
// import { User as ApiUserType, Friend, PendingFriendRequest } from '../shared/schemas/usersSchemas.js'; // Import Friend and PendingFriendRequest
// import { User as ApiUserType, Friend, PendingFriendRequest } from '../shared/schemas/friendsSchemas.js'; // Import Friend and PendingFriendRequest
// import { createElement } from '../utils/domUtils.js';
// import { navigateTo } from '../services/router.js';
// import { router } from '../main.js';

// export async function UsersPage(): Promise<HTMLElement> {
//     const currentUser = getUserDataFromStorage();

//     const pageContainer = createElement('div', { className: 'min-h-screen bg-gray-100' });

//     if (currentUser) {
//         const headerElement = HeaderComponent({ currentUser });
//         pageContainer.appendChild(headerElement);
//     }

//     const contentContainer = createElement('div', { className: 'container mx-auto p-4 md:p-8' });

//     const title = createElement('h1', {
//         className: 'text-3xl font-bold mb-6 text-center text-blue-700',
//         textContent: '🏓 All King-Pong Users 🏓'
//     });
//     contentContainer.appendChild(title);

//     const userListElement = createElement('div', {
//         id: 'user-list-container',
//         className: 'mt-6 bg-white p-6 rounded-lg shadow-xl',
//         innerHTML: '<p class="text-center text-gray-500 py-10">Loading users...</p>'
//     });
//     contentContainer.appendChild(userListElement);
//     pageContainer.appendChild(contentContainer);

//     try {
//         const usersPromise = fetchUsers();
//         // --- FIX: Explicitly type the promises ---
//         let friendsPromise: Promise<Friend[]> = Promise.resolve([]);
//         let sentRequestsPromise: Promise<PendingFriendRequest[]> = Promise.resolve([]);
//         let receivedRequestsPromise: Promise<PendingFriendRequest[]> = Promise.resolve([]);

//         if (currentUser) {
//             friendsPromise = getFriendsList();
//             sentRequestsPromise = getSentFriendRequests();
//             receivedRequestsPromise = getReceivedFriendRequests();
//         }

//         const [users, friends, sentRequests, receivedRequests] = await Promise.all([
//             usersPromise,
//             friendsPromise,
//             sentRequestsPromise,
//             receivedRequestsPromise
//         ]);

//         userListElement.innerHTML = '';

//         const createHandler = (action: Function, successMsg?: string) => async (id: number) => {
//             if (!currentUser) {
//                 showToast('Please log in to perform this action.', 'error');
//                 navigateTo('/login'); // Error TS2552 was here
//                 return;
//             }
//             try {
//                 const result = await action(id);
//                 showToast(successMsg || result.message || 'Action successful!', 'success');
//                 router(); // Error TS2304 was here
//             } catch (e: any) {
//                 showToast(e.message || 'An error occurred.', 'error');
//             }
//         };

//         const userListProps: UserListProps = {
//             users: users as ApiUserType[],
//             friends: friends,
//             sentRequests: sentRequests,
//             receivedRequests: receivedRequests,
//             currentUserId: currentUser ? currentUser.id : -1,
//             onSendRequest: createHandler(sendFriendRequest, 'Friend request sent!'),
//             onCancelRequest: createHandler(cancelFriendRequest, 'Request cancelled.'),
//             onAcceptRequest: createHandler(acceptFriendRequest, 'Friend request accepted!'),
//             onDeclineRequest: createHandler(declineFriendRequest, 'Request declined.'),
//         };
//         userListElement.appendChild(UserList(userListProps));

//     } catch (error) {
//         console.error("Failed to load data for UsersPage:", error);
//         userListElement.innerHTML = '<p class="text-center text-red-500 py-10">Error loading user data.</p>';
//     }

//     return pageContainer;
// }
