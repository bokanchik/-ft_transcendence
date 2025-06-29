import { navigateTo } from '../services/router.js';
import { getUserDataFromStorage, fetchUsers, checkAuthStatus } from '../services/authService.js';
import { fetchCsrfToken } from '../services/csrf.js';
import { User } from '../shared/schemas/usersSchemas.js';
import {
	getReceivedFriendRequests,
	getSentFriendRequests,
	acceptFriendRequest,
	declineFriendRequest,
	cancelFriendRequest,
	getFriendsList,
	sendFriendRequest,
	removeFriend,
} from '../services/friendService.js';
import { FriendsListComponent } from '../components/friendsList.js';
import { FriendRequestsComponent } from '../components/friendRequests.js';
import { UserList, UserListProps } from '../components/userList.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { showToast } from '../components/toast.js';
import { MatchHistoryComponent } from '../components/matchHistoryComponent.js';
import { t } from '../services/i18nService.js';
import { translateResultMessage } from '../services/responseService.js';

export async function DashboardPage(): Promise<HTMLElement> {
	let currentUser: User | null = getUserDataFromStorage();

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

	const pageContainer = document.createElement('div');
	// pageContainer.className = 'min-h-screen p-4 sm:p-8 flex flex-col items-center bg-cover bg-center bg-fixed';
	// pageContainer.style.backgroundImage = "url('/assets/background.jpg')";
	pageContainer.className = 'flex flex-col h-screen';

	const dashboardWrapper = document.createElement('div');
	// dashboardWrapper.className = `bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden`;
	dashboardWrapper.className = `bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 w-full max-w-6xl mx-auto my-8 rounded-2xl shadow-2xl flex flex-col flex-1 min-h-0`;

	const headerElement = HeaderComponent({ currentUser: currentUser! });

	const mainSection = document.createElement('div');
	// mainSection.className = 'flex flex-1 min-h-[calc(100vh-150px)]';
	mainSection.className = 'flex flex-1 min-h-0';

	const sidebar = document.createElement('div');
	// sidebar.className = 'w-1/4 p-6 border-r border-gray-400/30 space-y-3 overflow-y-auto';
	sidebar.className = 'w-1/4 p-6 border-r border-gray-400/30 space-y-3 overflow-y-auto';

	function populateSidebar(user: User) {
		sidebar.innerHTML = '';
		const profileHeader = document.createElement('div');
		profileHeader.className = 'flex flex-col items-center pb-4 mb-4 border-b border-gray-400/20';

		const avatarImg = document.createElement('img');
		avatarImg.src = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name)}&background=random&color=fff&size=128`;
		avatarImg.alt = `Avatar de ${user.display_name}`;
		avatarImg.className = 'w-24 h-24 rounded-full object-cover border-4 border-gray-400/30 shadow-lg mb-3';

		const displayNameEl = document.createElement('h2');
		displayNameEl.className = 'text-xl font-bold text-gray-300 text-center font-roar';
		displayNameEl.textContent = user.display_name;

		profileHeader.appendChild(avatarImg);
		// profileHeader.appendChild(displayNameEl);
		sidebar.appendChild(profileHeader);

		sidebar.appendChild(createSidebarItem(t('user.username'), user.username));
		sidebar.appendChild(createSidebarItem(t('user.displayName'), user.display_name));
		sidebar.appendChild(createSidebarItem(t('user.email'), user.email));
		sidebar.appendChild(createSidebarItem(t('user.createdAt'), new Date(user.created_at)));
		sidebar.appendChild(createSidebarItem(t('user.wins'), user.wins));
		sidebar.appendChild(createSidebarItem(t('user.losses'), user.losses));
	}

	function createSidebarItem(label: string, value: string | number | Date | undefined | null): HTMLElement {
		const item = document.createElement('div');
		item.className = 'p-4 bg-black/20 border border-gray-400/20 rounded-lg';

		const labelEl = document.createElement('span');
		labelEl.className = 'text-sm text-gray-300 block mb-1';
		labelEl.textContent = label;

		const valueEl = document.createElement('p');
		if (label === t('user.email')) {
			valueEl.className = 'text-base text-gray-300 font-semibold truncate font-roar';
		} else {
			valueEl.className = 'text-lg text-gray-300 font-semibold truncate font-roar';
		}

		if (value instanceof Date) {
			valueEl.textContent = value.toLocaleDateString();
		} else {
			valueEl.textContent = value?.toString() || 'N/A';
		}
		item.appendChild(labelEl);
		item.appendChild(valueEl);
		return item;
	}

	populateSidebar(currentUser);

	const tabContentWrapper = document.createElement('div');
	// tabContentWrapper.className = 'w-3/4 p-6 flex flex-col overflow-y-auto';
	tabContentWrapper.className = 'w-3/4 p-6 flex flex-col overflow-y-auto';
	
	const tabNavigation = document.createElement('div');
	tabNavigation.className = 'flex space-x-1 border-b border-gray-400/30 mb-6';

	const TABS = [
		{ id: 'users', label: t('dashboard.tabs.users'), componentLoader: loadUsersContent },
		{ id: 'friends', label: t('dashboard.tabs.friends'), componentLoader: loadFriendsContent },
		{ id: 'pending', label: t('dashboard.tabs.pending'), componentLoader: loadPendingRequestsContent },
		{ id: 'history', label: t('dashboard.tabs.history'), componentLoader: loadMatchHistoryContent },
	];
	let activeTabId = TABS[0].id;

	const activeTabContentContainer = document.createElement('div');
	activeTabContentContainer.id = 'active-tab-content';
	activeTabContentContainer.className = 'flex-1';

	TABS.forEach(tabInfo => {
		const tabButton = document.createElement('button');
		tabButton.dataset.tabId = tabInfo.id;
		tabButton.textContent = tabInfo.label;
		const baseClasses = 'py-2 px-4 text-lg font-roar focus:outline-none transition-colors';
		let stateClasses = '';
		if (tabInfo.id === activeTabId) {
			stateClasses = 'border-b-2 border-blue-400 text-white';
		} else {
			stateClasses = 'text-gray-300 hover:text-white hover:border-gray-300/70';
		}
		tabButton.className = `${baseClasses} ${stateClasses}`;
		tabButton.addEventListener('click', () => switchTab(tabInfo.id));
		tabNavigation.appendChild(tabButton);
	});

	tabContentWrapper.appendChild(tabNavigation);
	tabContentWrapper.appendChild(activeTabContentContainer);

	mainSection.appendChild(sidebar);
	mainSection.appendChild(tabContentWrapper);

	dashboardWrapper.appendChild(headerElement);
	dashboardWrapper.appendChild(mainSection);
	pageContainer.appendChild(dashboardWrapper);

	const handleSendFriendRequest = async (targetUserId: number) => {
		const result = await sendFriendRequest(targetUserId);
		showToast(translateResultMessage(result.message), 'success');
		if (activeTabId === 'users' || activeTabId === 'pending') await loadActiveTabContent(); // Recharger si l'onglet users ou pending est actif
	};

	const handleCancelFriendRequest = async (friendshipId: number) => {
		const result = await cancelFriendRequest(friendshipId);
		showToast(translateResultMessage(result.message), 'success');
		if (activeTabId === 'users' || activeTabId === 'pending') await loadActiveTabContent();
	};

	const handleAcceptFriendRequest = async (friendshipId: number) => {
		const result = await acceptFriendRequest(friendshipId);
		showToast(translateResultMessage(result.message), 'success');
		if (['users', 'pending', 'friends'].includes(activeTabId)) await loadActiveTabContent();
	};

	const handleDeclineFriendRequest = async (friendshipId: number) => {
		const result = await declineFriendRequest(friendshipId);
		showToast(translateResultMessage(result.message), 'success');
		if (activeTabId === 'users' || activeTabId === 'pending') await loadActiveTabContent();
	};

	async function switchTab(tabId: string) {
		activeTabId = tabId;
		const baseClasses = 'py-2 px-4 text-lg font-roar focus:outline-none transition-colors';
		tabNavigation.querySelectorAll('button').forEach(btn => {
		const button = btn as HTMLButtonElement;
        let stateClasses = '';
			if (btn.dataset.tabId === tabId) {
				stateClasses = 'border-b-2 border-blue-400 text-white';
			} else {
				stateClasses = 'text-gray-300 hover:text-white hover:border-gray-300/70';
			}
			button.className = `${baseClasses} ${stateClasses}`;
		});
		await loadActiveTabContent();
	}

	async function loadActiveTabContent() {
		activeTabContentContainer.innerHTML = '<p class="text-center text-gray-200 py-10">Loading...</p>';
		const currentTab = TABS.find(t => t.id === activeTabId);
		if (currentTab) {
			try {
				const contentElement = await currentTab.componentLoader();
				activeTabContentContainer.innerHTML = '';
				activeTabContentContainer.appendChild(contentElement);
			} catch (error) {
				console.error(`Error loading content for tab ${activeTabId}:`, error);
				activeTabContentContainer.innerHTML = `<p class="text-center text-red-400 py-10">Error loading content for ${activeTabId}.</p>`;
			}
		}
	}

	async function loadUsersContent(): Promise<HTMLElement> {
		const [usersData, friendsData, sentRequestsData, receivedRequestsData] = await Promise.all([
			fetchUsers(),
			getFriendsList(),
			getSentFriendRequests(),
			getReceivedFriendRequests()
		]);

		const userListProps: UserListProps = {
			users: usersData as User[],
			friends: friendsData,
			sentRequests: sentRequestsData,
			receivedRequests: receivedRequestsData,
			currentUserId: currentUser!.id,
			onSendRequest: handleSendFriendRequest,
			onCancelRequest: handleCancelFriendRequest,
			onAcceptRequest: handleAcceptFriendRequest,
			onDeclineRequest: handleDeclineFriendRequest,
		};
		return UserList(userListProps);
	}

	async function loadFriendsContent(): Promise<HTMLElement> {
		const friends = await getFriendsList();
		return FriendsListComponent({
			friends: friends,
			onRemoveFriend: async (friendshipId) => {
				const result = await removeFriend(friendshipId);
				showToast(translateResultMessage(result.message), 'success');
				if (['friends', 'users'].includes(activeTabId)) await loadActiveTabContent();
			},
		});
	}

	async function loadPendingRequestsContent(): Promise<HTMLElement> {
		const [received, sent] = await Promise.all([
			getReceivedFriendRequests(),
			getSentFriendRequests(),
		]);
		return FriendRequestsComponent({
			receivedRequests: received,
			sentRequests: sent,
			onAcceptRequest: handleAcceptFriendRequest,
			onDeclineRequest: handleDeclineFriendRequest,
			onCancelRequest: handleCancelFriendRequest,
		});
	}

	async function loadMatchHistoryContent(): Promise<HTMLElement> {
		if (currentUser) {
			return await MatchHistoryComponent({ userId: currentUser.id });
		} else {
			const errorMsg = document.createElement('div');
			errorMsg.className = 'min-h-screen flex items-center justify-center text-xl text-red-500';
			errorMsg.textContent = t('msg.error.user.notFound');
			return errorMsg;
		}
	}

	await loadActiveTabContent();

	checkAuthStatus().then(freshUser => {
		if (freshUser) {
			currentUser = freshUser;
			populateSidebar(freshUser);
			const newHeader = HeaderComponent({ currentUser: freshUser });
			headerElement.replaceWith(newHeader);
		}
	}).catch(err => {
		console.error("Could not refresh user data in the background:", err);
	});

	return pageContainer;
}
