import { http, HttpResponse } from 'msw';
import { config } from '../../utils/config';
import { UserOnlineStatus } from '../../shared/schemas/usersSchemas';

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@user.com',
  display_name: 'Test User',
  avatar_url: null,
  wins: 10,
  losses: 5,
  status: UserOnlineStatus.ONLINE,
  language: 'en',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_two_fa_enabled: false,
};

export const handlers = [
  http.get(config.api.users.me, () => {
    return HttpResponse.json(mockUser);
  }),

  http.get(config.api.friends.list, () => {
    return HttpResponse.json([
      {
        friendship_id: 10,
        friendship_status: 'accepted',
        friend_id: 2,
        friend_username: 'friend1',
        friend_display_name: 'Friendly Friend',
        friend_avatar_url: null,
        friend_wins: 20,
        friend_losses: 10,
        friend_online_status: UserOnlineStatus.ONLINE,
      }
    ]);
  }),

  http.get(config.api.friends.receivedRequests, () => {
      return HttpResponse.json([]);
  }),

  http.get(config.api.friends.sentRequests, () => {
    return HttpResponse.json([]);
  }),
  
  http.get(config.api.users.all, () => {
    return HttpResponse.json([
      mockUser,
      { ...mockUser, id: 2, username: 'friend1', display_name: 'Friendly Friend' },
      { ...mockUser, id: 3, username: 'newbie', display_name: 'New Player' },
    ]);
  }),

  http.get(config.api.auth.csrf, () => {
    return HttpResponse.json({ csrfToken: 'fake-csrf-token' });
  }),
];