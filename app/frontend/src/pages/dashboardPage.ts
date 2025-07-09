import { navigateTo } from '../services/router.js';
import { getUserDataFromStorage, fetchUsers, checkAuthStatus } from '../services/authService.js';
import { fetchCsrfToken } from '../services/csrf.js';
import { User } from '../shared/schemas/usersSchemas.js';
import * as FriendService from '../services/friendService.js';
import { FriendsListComponent } from '../components/friendsList.js';
import { FriendRequestsComponent } from '../components/friendRequests.js';
import { UserList } from '../components/userList.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { showToast } from '../components/toast.js';
import { MatchHistoryComponent } from '../components/matchHistoryComponent.js';
import { t, getLanguage } from '../services/i18nService.js';
import { translateResultMessage } from '../services/responseService.js';
import { createElement, clearElement } from '../utils/domUtils.js';

const DASHBOARD_ACTIVE_TAB_KEY = 'dashboardActiveTab';

function nextFrame(): Promise<void> {
	return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

export async function adjustFontSizeToFit(
	element: HTMLElement,
	fontSizes: string[] = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs'],
	truncateClass: string = 'truncate'
) {
	element.classList.add('whitespace-nowrap', 'overflow-hidden');

	await nextFrame();

	for (const sizeClass of fontSizes) {
		fontSizes.forEach(s => element.classList.remove(s));
		element.classList.add(sizeClass);

		await nextFrame();

		if (element.scrollWidth <= element.clientWidth) {
			element.classList.remove(truncateClass);
			return;
		}
	}

	element.classList.add(truncateClass);
}

export async function DashboardPage(): Promise<HTMLElement> {
	let currentUser: User | null = getUserDataFromStorage();

	if (!currentUser) {
		navigateTo('/login');
		return createElement('div', { textContent: t('msg.redirect.login'), className: 'min-h-screen flex items-center justify-center text-xl' });
	}

	try {
		await fetchCsrfToken();
	} catch (error) {
		console.error("Failed to fetch CSRF token:", error);
		return createElement('div', { textContent: t('msg.error.initializing'), className: 'min-h-screen flex items-center justify-center text-xl text-red-500' });
	}

	const sidebar = createElement('div', { className: 'w-1/4 p-6 border-r border-gray-400/30 space-y-3 overflow-y-auto' });
	// ajout pour test
	sidebar.dataset.testid = 'sidebar';
	const activeTabContentContainer = createElement('div', { id: 'active-tab-content', className: 'flex-grow overflow-y-auto min-h-0' });
	const tabNavigation = createElement('div', { className: 'flex-shrink-0 flex space-x-1 border-b border-gray-400/30 mb-6' });
	const tabContentWrapper = createElement('div', { className: 'w-3/4 p-6 flex flex-col' }, [tabNavigation, activeTabContentContainer]);
	const mainSection = createElement('div', { className: 'flex flex-1 min-h-0' }, [sidebar, tabContentWrapper]);
	let headerElement = HeaderComponent({ currentUser: currentUser! });

	const dashboardWrapper = createElement('div', {
		className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 w-full max-w-6xl mx-auto my-8 rounded-2xl shadow-2xl flex flex-col flex-1 min-h-0'
	}, [mainSection]);

	const pageContainer = createElement('div', { className: 'flex flex-col h-screen' }, [headerElement, dashboardWrapper]);

	function createSidebarItem(label: string, value: string | number | Date | undefined | null): HTMLElement {
		const isEmailField = label === t('user.email');
		const isDateField = value instanceof Date;

		const valueClass = 'font-beach font-medium text-2xl text-gray-200 overflow-hidden whitespace-nowrap';

		let valueText: string;
		let titleText: string | undefined;

		if (isDateField) {
			const date = value as Date;
			const currentAppLanguage = getLanguage();
			valueText = new Intl.DateTimeFormat(currentAppLanguage, {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			}).format(date);

			const datePart = date.toLocaleDateString(currentAppLanguage);
			const timePart = date.toLocaleTimeString(currentAppLanguage);
			titleText = `${t('general.on')} ${datePart} ${t('general.at')} ${timePart}`;
		} else {
			valueText = value?.toString() || 'N/A';
			if (isEmailField) {
				titleText = valueText;
			}
		}

		const valueElement = createElement('p', {
			textContent: valueText,
			className: valueClass,
			title: titleText
		});
		adjustFontSizeToFit(valueElement, ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs']);

		return createElement('div', { className: 'p-4 bg-black/20 border border-gray-400/20 rounded-lg' }, [
			createElement('span', { textContent: label, className: 'text-sm text-gray-300 block mb-1' }),
			valueElement
		]);
	}

	function populateSidebar(user: User) {
		clearElement(sidebar);

		const avatarImg = createElement('img', {
			src: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name)}&background=random&color=fff&size=128`,
			alt: `Avatar de ${user.display_name}`,
			className: 'w-24 h-24 rounded-full object-cover border-4 border-gray-400/30 shadow-lg mb-3'
		});

		const profileHeader = createElement('div', { className: 'flex flex-col items-center pb-4 mb-4 border-b border-gray-400/20' }, [
			avatarImg,
		]);

		sidebar.append(
			profileHeader,
			createSidebarItem(t('user.username'), user.username),
			createSidebarItem(t('user.displayName'), user.display_name),
			createSidebarItem(t('user.email'), user.email),
			createSidebarItem(t('user.createdAt'), new Date(user.created_at)),
			createSidebarItem(t('user.wins'), user.wins),
			createSidebarItem(t('user.losses'), user.losses)
		);
	}

	populateSidebar(currentUser);

	const TABS = [
		{ id: 'users', label: t('dashboard.tabs.users'), componentLoader: loadUsersContent },
		{ id: 'friends', label: t('dashboard.tabs.friends'), componentLoader: loadFriendsContent },
		{ id: 'pending', label: t('dashboard.tabs.pending'), componentLoader: loadPendingRequestsContent },
		{ id: 'history', label: t('dashboard.tabs.history'), componentLoader: loadMatchHistoryContent },
	];

	const savedTabId = sessionStorage.getItem(DASHBOARD_ACTIVE_TAB_KEY);
	let activeTabId = (savedTabId && TABS.some(t => t.id === savedTabId)) ? savedTabId : TABS[0].id;

	function switchTab(tabId: string) {
		activeTabId = tabId;
		sessionStorage.setItem(DASHBOARD_ACTIVE_TAB_KEY, tabId);
		tabNavigation.querySelectorAll('button').forEach(btn => {
			const isActive = btn.dataset.tabId === tabId;
			btn.className = `py-2 px-4 text-2xl font-beach focus:outline-none transition-colors ${isActive ? 'border-b-2 border-blue-400 text-white' : 'text-gray-300 hover:text-white hover:border-gray-300/70'
				}`;
		});
		loadActiveTabContent();
	}

	TABS.forEach(tabInfo => {
		const tabButton = createElement('button', {
			textContent: tabInfo.label,
			className: `py-2 px-4 text-2xl font-beach focus:outline-none transition-colors ${tabInfo.id === activeTabId ? 'border-b-2 border-blue-400 text-white' : 'text-gray-300 hover:text-white hover:border-gray-300/70'
				}`
		});
		tabButton.dataset.tabId = tabInfo.id;
		tabButton.addEventListener('click', () => switchTab(tabInfo.id));
		tabNavigation.appendChild(tabButton);
	});

	async function loadActiveTabContent() {
		clearElement(activeTabContentContainer);
		activeTabContentContainer.appendChild(createElement('p', { textContent: t('general.loading'), className: 'text-center text-gray-200 py-10' }));
		const currentTab = TABS.find(t => t.id === activeTabId);
		if (currentTab) {
			try {
				const contentElement = await currentTab.componentLoader();
				clearElement(activeTabContentContainer);
				activeTabContentContainer.appendChild(contentElement);
			} catch (error) {
				console.error(`Error loading content for tab ${activeTabId}:`, error);
				clearElement(activeTabContentContainer);
				activeTabContentContainer.appendChild(createElement('p', { textContent: t('msg.error.loadingContent'), className: 'text-center text-red-400 py-10' }));
			}
		}
	}

	const handleSendFriendRequest = async (targetUserId: number) => {
		const result = await FriendService.sendFriendRequest(targetUserId);
		showToast(translateResultMessage(result.message), 'success');
		if (activeTabId === 'users' || activeTabId === 'pending') await loadActiveTabContent();
	};

	const handleCancelFriendRequest = async (friendshipId: number) => {
		const result = await FriendService.cancelFriendRequest(friendshipId);
		showToast(translateResultMessage(result.message), 'success');
		if (activeTabId === 'users' || activeTabId === 'pending') await loadActiveTabContent();
	};

	const handleAcceptFriendRequest = async (friendshipId: number) => {
		const result = await FriendService.acceptFriendRequest(friendshipId);
		showToast(translateResultMessage(result.message), 'success');
		if (['users', 'pending', 'friends'].includes(activeTabId)) await loadActiveTabContent();
	};

	const handleDeclineFriendRequest = async (friendshipId: number) => {
		const result = await FriendService.declineFriendRequest(friendshipId);
		showToast(translateResultMessage(result.message), 'success');
		if (activeTabId === 'users' || activeTabId === 'pending') await loadActiveTabContent();
	};

	async function loadUsersContent(): Promise<HTMLElement> {
		const [usersData, friendsData, sentRequestsData, receivedRequestsData] = await Promise.all([
			fetchUsers(), FriendService.getFriendsList(), FriendService.getSentFriendRequests(), FriendService.getReceivedFriendRequests()
		]);
		return UserList({
			users: usersData as User[], friends: friendsData, sentRequests: sentRequestsData,
			receivedRequests: receivedRequestsData, currentUserId: currentUser!.id,
			onSendRequest: handleSendFriendRequest, onCancelRequest: handleCancelFriendRequest,
			onAcceptRequest: handleAcceptFriendRequest, onDeclineRequest: handleDeclineFriendRequest,
		});
	}

	async function loadFriendsContent(): Promise<HTMLElement> {
		const friends = await FriendService.getFriendsList();
		return FriendsListComponent({
			friends: friends,
			onRemoveFriend: async (friendshipId) => {
				const result = await FriendService.removeFriend(friendshipId);
				showToast(translateResultMessage(result.message), 'success');
				if (['friends', 'users'].includes(activeTabId)) await loadActiveTabContent();
			},
		});
	}

	async function loadPendingRequestsContent(): Promise<HTMLElement> {
		const [received, sent] = await Promise.all([FriendService.getReceivedFriendRequests(), FriendService.getSentFriendRequests()]);
		return FriendRequestsComponent({
			receivedRequests: received, sentRequests: sent,
			onAcceptRequest: handleAcceptFriendRequest, onDeclineRequest: handleDeclineFriendRequest,
			onCancelRequest: handleCancelFriendRequest,
		});
	}

	async function loadMatchHistoryContent(): Promise<HTMLElement> {
		return MatchHistoryComponent({ userId: currentUser!.id });
	}


	await loadActiveTabContent();

	checkAuthStatus().then(freshUser => {
		if (freshUser) {
			currentUser = freshUser;
			populateSidebar(freshUser);
			const newHeader = HeaderComponent({ currentUser: freshUser });
			dashboardWrapper.replaceChild(newHeader, headerElement);
			headerElement = newHeader;
		}
	}).catch(err => {
		console.error("Could not refresh user data in the background:", err);
	});

	return pageContainer;
}
