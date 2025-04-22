export interface User {
  id: number;
  username: string;
  email: string;
}

export async function fetchUsers(): Promise<User[]> {
  try {
    // IMPORTANT: On appelle le chemin tel qu'exposé par Nginx
    const response = await fetch('/api/users/');

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
