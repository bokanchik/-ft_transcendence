import { User } from '../services/api.js';

export function UserList(users: User[]): HTMLElement {
	const ul = document.createElement('ul');
	ul.className = 'space-y-4';

	users.forEach(user => {
		const li = document.createElement('li');
		li.className = 'p-4 border border-gray-300 rounded-md bg-white shadow-sm';

		const idSpan = document.createElement('span');
		idSpan.className = 'font-bold text-blue-600';
		idSpan.textContent = `ID: ${user.id}`;

		const usernameP = document.createElement('p');
		usernameP.className = 'text-gray-800';
		usernameP.textContent = `Username: ${user.username}`;

		const emailP = document.createElement('p');
		emailP.className = 'text-gray-600 italic text-sm';
		emailP.textContent = `Email: ${user.email}`;

		li.appendChild(idSpan);
		li.appendChild(usernameP);
		li.appendChild(emailP);
		ul.appendChild(li);
	});

	return ul;
}
