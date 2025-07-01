// src/components/userList.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/dom';
import { UserList, UserListProps } from './userList';
import { User, UserOnlineStatus } from '../shared/schemas/usersSchemas';
import { Friend, PendingFriendRequest } from '../shared/schemas/friendsSchemas';

vi.mock('../services/i18nService.js', () => ({
    t: (key: string) => key,
}));

describe('UserList Component', () => {
    const mockCurrentUser_ID = 1;
    const mockUsers: User[] = [
        { id: 1, username: 'currentUser', display_name: 'Current User', email: 'a@a.com', status: UserOnlineStatus.ONLINE, language: 'en', created_at: '', updated_at: '', is_two_fa_enabled: false, wins: 0, losses: 0, avatar_url: null },
        { id: 2, username: 'friendUser', display_name: 'Friend User', email: 'b@b.com', status: UserOnlineStatus.ONLINE, language: 'en', created_at: '', updated_at: '', is_two_fa_enabled: false, wins: 0, losses: 0, avatar_url: null },
        { id: 3, username: 'pendingUser', display_name: 'Pending User', email: 'c@c.com', status: UserOnlineStatus.OFFLINE, language: 'en', created_at: '', updated_at: '', is_two_fa_enabled: false, wins: 0, losses: 0, avatar_url: null },
        { id: 4, username: 'requestUser', display_name: 'Request User', email: 'd@d.com', status: UserOnlineStatus.IN_GAME, language: 'en', created_at: '', updated_at: '', is_two_fa_enabled: false, wins: 0, losses: 0, avatar_url: null },
        { id: 5, username: 'strangerUser', display_name: 'Stranger User', email: 'e@e.com', status: UserOnlineStatus.OFFLINE, language: 'en', created_at: '', updated_at: '', is_two_fa_enabled: false, wins: 0, losses: 0, avatar_url: null },
    ];
    const mockFriends: Friend[] = [{
        friendship_id: 10, friendship_status: 'accepted', friend_id: 2, friend_username: 'friendUser',
        friend_display_name: 'Friend User', friend_avatar_url: null, friend_wins: 0, friend_losses: 0, friend_online_status: UserOnlineStatus.ONLINE,
    }];
    const mockSentRequests: PendingFriendRequest[] = [{
        friendship_id: 11, requester: { id: 1, username: 'currentUser', display_name: 'Current User', avatar_url: null },
        receiver: { id: 3, username: 'pendingUser', display_name: 'Pending User', avatar_url: null }, created_at: '',
    }];
    const mockReceivedRequests: PendingFriendRequest[] = [{
        friendship_id: 12, requester: { id: 4, username: 'requestUser', display_name: 'Request User', avatar_url: null },
        receiver: { id: 1, username: 'currentUser', display_name: 'Current User', avatar_url: null }, created_at: '',
    }];

    const defaultProps: UserListProps = {
        users: mockUsers,
        friends: mockFriends,
        sentRequests: mockSentRequests,
        receivedRequests: mockReceivedRequests,
        currentUserId: mockCurrentUser_ID,
        onSendRequest: vi.fn(),
        onCancelRequest: vi.fn(),
        onAcceptRequest: vi.fn(),
        onDeclineRequest: vi.fn(),
    };

    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('should not display the current user', () => {
        const list = UserList(defaultProps);
        document.body.appendChild(list);
        expect(screen.queryByText('Current User')).not.toBeInTheDocument();
    });

    it('should display "friend" status for a friend', () => {
        const list = UserList(defaultProps);
        document.body.appendChild(list);
        const friendItem = screen.getByText('Friend User').closest('li');
        expect(friendItem?.textContent).toContain('friend.status.friend');
    });

    it('should display "cancel" button for a sent request', () => {
        const list = UserList(defaultProps);
        document.body.appendChild(list);
        const pendingItem = screen.getByText('Pending User').closest('li');
        expect(pendingItem?.textContent).toContain('friend.requestSent');
        expect(pendingItem?.querySelector('button')?.textContent).toBe('friend.cancel');
    });

    it('should display "accept" and "decline" buttons for a received request', () => {
        const list = UserList(defaultProps);
        document.body.appendChild(list);
        const requestItem = screen.getByText('Request User').closest('li');
        expect(requestItem?.textContent).toContain('friend.requestReceived');
        const buttons = requestItem?.querySelectorAll('button');
        expect(buttons?.length).toBe(2);
        expect(buttons?.[0].textContent).toBe('friend.accept');
        expect(buttons?.[1].textContent).toBe('friend.decline');
    });

    it('should display "add friend" button for a user with no relationship', () => {
        const list = UserList(defaultProps);
        document.body.appendChild(list);
        const strangerItem = screen.getByText('Stranger User').closest('li');
        expect(strangerItem?.textContent).toContain('friend.status.notFriend');
        expect(strangerItem?.querySelector('button')?.textContent).toBe('friend.request');
    });
});