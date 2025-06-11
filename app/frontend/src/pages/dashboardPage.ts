import { navigateTo } from '../services/router.js';
import { getUserDataFromStorage } from '../services/authService.js';
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
import { fetchUsers } from '../services/authService.js';
import { FriendsListComponent } from '../components/friendsList.js';
import { FriendRequestsComponent } from '../components/friendRequests.js';
import { UserList, UserListProps } from '../components/userList.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { showToast } from '../components/toast.js';
import { MatchHistoryComponent } from '../components/matchHistoryComponent.js';
import { t } from '../services/i18nService.js';

export async function DashboardPage(): Promise<HTMLElement> {
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

	// --- Conteneur principal de la page ---
	const pageContainer = document.createElement('div');
	pageContainer.className = 'min-h-screen bg-gray-200 p-4 sm:p-8 flex flex-col items-center';

	// --- Le "Dashboard" lui-même ---
	const dashboardWrapper = document.createElement('div');
	dashboardWrapper.className = 'bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden';

	// --- Section du haut (Langue, User Header) ---
	const headerElement = HeaderComponent({ currentUser: currentUser! });
	// Note: The global click listener for menu close is in HeaderComponent.

	// --- Section principale (Sidebar + Contenu à onglets) ---
	const mainSection = document.createElement('div');
	mainSection.className = 'flex flex-1 min-h-[calc(100vh-150px)]'; // Hauteur minimale pour le contenu

	// --- Sidebar ---
	const sidebar = document.createElement('div');
	sidebar.className = 'w-1/4 p-6 bg-gray-50 border-r border-gray-200 space-y-3 overflow-y-auto';

	function createSidebarItem(label: string, value: string | number | Date | undefined | null): HTMLElement {
		const item = document.createElement('div');
		item.className = 'p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm';
		const labelEl = document.createElement('span');
		labelEl.className = 'text-xs text-gray-500 block mb-0.5';
		labelEl.textContent = label;
		const valueEl = document.createElement('p');
		valueEl.className = 'text-sm text-gray-800 font-medium truncate';
		if (value instanceof Date) {
			valueEl.textContent = value.toLocaleDateString();
		} else {
			valueEl.textContent = value?.toString() || 'N/A';
		}
		item.appendChild(labelEl);
		item.appendChild(valueEl);
		return item;
	}

	sidebar.appendChild(createSidebarItem(t('sidebar.username'), currentUser.username));
	sidebar.appendChild(createSidebarItem(t('sidebar.displayName'), currentUser.display_name));
	sidebar.appendChild(createSidebarItem(t('sidebar.email'), currentUser.email));
	sidebar.appendChild(createSidebarItem(t('sidebar.createdAt'), new Date(currentUser.created_at)));
	sidebar.appendChild(createSidebarItem(t('sidebar.wins'), currentUser.wins ?? 'N/A'));
	sidebar.appendChild(createSidebarItem(t('sidebar.losses'), currentUser.losses ?? 'N/A'));

	// --- Contenu à onglets ---
	const tabContentWrapper = document.createElement('div');
	tabContentWrapper.className = 'w-3/4 p-6 flex flex-col overflow-y-auto';

	const tabNavigation = document.createElement('div');
	tabNavigation.className = 'flex space-x-1 border-b border-gray-200 mb-6';

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
		tabButton.className = `py-2 px-4 text-sm font-medium focus:outline-none transition-colors`;
		if (tabInfo.id === activeTabId) {
			tabButton.classList.add('border-b-2', 'border-blue-600', 'text-blue-600');
		} else {
			tabButton.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
		}
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

	// --- Fonctions de rappel pour les actions d'amitié (utilisées par UserList) ---
	const handleSendFriendRequest = async (targetUserId: number) => {
		const result = await sendFriendRequest(targetUserId);
		showToast(result.message);
		if (activeTabId === 'users' || activeTabId === 'pending') await loadActiveTabContent(); // Recharger si l'onglet users ou pending est actif
	};

	const handleCancelFriendRequest = async (friendshipId: number) => {
		const result = await cancelFriendRequest(friendshipId);
		showToast(result.message);
		if (activeTabId === 'users' || activeTabId === 'pending') await loadActiveTabContent();
	};

	const handleAcceptFriendRequest = async (friendshipId: number) => {
		const result = await acceptFriendRequest(friendshipId);
		showToast(result.message, 'success');
		if (['users', 'pending', 'friends'].includes(activeTabId)) await loadActiveTabContent();
	};

	const handleDeclineFriendRequest = async (friendshipId: number) => {
		const result = await declineFriendRequest(friendshipId);
		showToast(result.message, 'success');
		if (activeTabId === 'users' || activeTabId === 'pending') await loadActiveTabContent();
	};

	// --- Logique de chargement et de changement d'onglet ---
	async function switchTab(tabId: string) {
		activeTabId = tabId;
		tabNavigation.querySelectorAll('button').forEach(btn => {
			if (btn.dataset.tabId === tabId) {
				btn.className = 'py-2 px-4 text-sm font-medium focus:outline-none transition-colors border-b-2 border-blue-600 text-blue-600';
			} else {
				btn.className = 'py-2 px-4 text-sm font-medium focus:outline-none transition-colors text-gray-500 hover:text-gray-700 hover:border-gray-300';
			}
		});
		await loadActiveTabContent();
	}

	async function loadActiveTabContent() {
		activeTabContentContainer.innerHTML = '<p class="text-center text-gray-500 py-10">Loading...</p>';
		const currentTab = TABS.find(t => t.id === activeTabId);
		if (currentTab) {
			try {
				const contentElement = await currentTab.componentLoader();
				activeTabContentContainer.innerHTML = '';
				activeTabContentContainer.appendChild(contentElement);
			} catch (error) {
				console.error(`Error loading content for tab ${activeTabId}:`, error);
				activeTabContentContainer.innerHTML = `<p class="text-center text-red-500 py-10">Error loading content for ${activeTabId}.</p>`;
			}
		}
	}

	// --- Fonctions de chargement spécifiques pour chaque onglet ---
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
				showToast(result.message);
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
			onAcceptRequest: handleAcceptFriendRequest, // Réutilisation du handler global
			onDeclineRequest: handleDeclineFriendRequest, // Réutilisation du handler global
			onCancelRequest: handleCancelFriendRequest, // Réutilisation du handler global
		});
	}

	async function loadMatchHistoryContent(): Promise<HTMLElement> {
		if (currentUser) {
			return await MatchHistoryComponent({ userId: currentUser.id });
		} else {
			const errorMsg = document.createElement('div');
			errorMsg.className = 'min-h-screen flex items-center justify-center text-xl text-red-500';
			errorMsg.textContent = t('msg.user.notFound');
			return errorMsg;
		}
	}

	await loadActiveTabContent();

	return pageContainer;
}
