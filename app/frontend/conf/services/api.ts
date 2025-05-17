export interface User {
	id: number;
	username: string;
	email: string;
	display_name: string;
	avatar_url: string | null;
	wins: number;
	losses: number;
	created_at: string;
	updated_at: string;
}

export async function fetchUsers(): Promise<User[]> {
	try {
		const response = await fetch('/api/users/'); // NGINX ADDRESS
		if (!response.ok) {
			console.error(`HTTP error! status: ${response.status}`);
			return [];
		}
		const users = await response.json() as User[];
		return users;
	} catch (error) {
		console.error("Failed to fetch users:", error);
		return [];
	}
}
