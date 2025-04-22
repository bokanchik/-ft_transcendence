import { fetchUsers } from '../services/api.js';
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

  const users = await fetchUsers();
  userListElement.innerHTML = '';
  userListElement.appendChild(UserList(users));

  return container;
}
