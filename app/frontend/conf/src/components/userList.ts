import { User } from '../services/api.js';

export function UserList(users: User[]): HTMLElement {
	const ul = document.createElement('ul');
	ul.className = 'space-y-6';

	users.forEach(user => {
		const li = document.createElement('li');
		li.className = 'flex items-center p-6 border border-gray-200 rounded-lg bg-white shadow-md';

		// Avatar
		const avatar = document.createElement('img');
		avatar.className = 'w-16 h-16 rounded-full object-cover mr-6';
		avatar.src = user.avatar_url || 'https://via.placeholder.com/150'; // Fallback image if avatar_url is null
		avatar.alt = `${user.username} avatar`;

		// Info container
		const info = document.createElement('div');
		info.className = 'flex-1';

		const topInfo = document.createElement('div');
		topInfo.className = 'flex items-center justify-between mb-2';

		const username = document.createElement('h2');
		username.className = 'text-xl font-semibold text-blue-700';
		username.textContent = user.username;

		const displayName = document.createElement('span');
		displayName.className = 'text-gray-500 text-sm italic';
		displayName.textContent = user.display_name;

		topInfo.appendChild(username);
		topInfo.appendChild(displayName);

		const email = document.createElement('p');
		email.className = 'text-gray-600 text-sm';
		email.textContent = `📧 ${user.email}`;

		const stats = document.createElement('div');
		stats.className = 'flex space-x-4 mt-2 text-sm text-gray-700';

		const wins = document.createElement('span');
		wins.textContent = `🏆 Wins: ${user.wins}`;

		const losses = document.createElement('span');
		losses.textContent = `❌ Losses: ${user.losses}`;

		const createdAt = document.createElement('p');
		createdAt.className = 'text-gray-400 text-xs mt-2';
		const date = new Date(user.created_at);
		createdAt.textContent = `Joined: ${date.toLocaleDateString()}`;

		stats.appendChild(wins);
		stats.appendChild(losses);

		info.appendChild(topInfo);
		info.appendChild(email);
		info.appendChild(stats);
		info.appendChild(createdAt);

		li.appendChild(avatar);
		li.appendChild(info);
		ul.appendChild(li);
	});

	return ul;
}
