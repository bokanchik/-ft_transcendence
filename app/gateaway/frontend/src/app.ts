// frontend/src/app.ts

// Définir l'interface pour un utilisateur (adapte si les champs sont différents)
interface User {
  id: number; // Ou string si l'ID n'est pas numérique
  username: string;
  email: string;
  // Ajoute d'autres champs si ton API en renvoie
}

// Fonction pour récupérer les utilisateurs depuis l'API
async function fetchUsers(): Promise<User[]> {
  try {
    // IMPORTANT: On appelle le chemin tel qu'exposé par Nginx
    const response = await fetch('/api/users/');

    if (!response.ok) {
      // Gérer les erreurs HTTP (ex: 404, 500)
      console.error(`HTTP error! status: ${response.status}`);
      return []; // Retourner un tableau vide en cas d'erreur
    }

    // Parser la réponse JSON et la typer
    const users = await response.json() as User[];
    return users;

  } catch (error) {
    // Gérer les erreurs réseau ou autres exceptions
    console.error("Failed to fetch users:", error);
    return []; // Retourner un tableau vide en cas d'erreur
  }
}

// Fonction pour afficher les utilisateurs dans le DOM
function displayUsers(users: User[]): void {
  const userListElement = document.getElementById('user-list');

  // Vérifier si l'élément existe
  if (!userListElement) {
    console.error("Element with ID 'user-list' not found.");
    return;
  }

  // Vider le contenu précédent (ex: message "Loading...")
  userListElement.innerHTML = '';

  if (users.length === 0) {
    userListElement.innerHTML = '<p class="text-gray-500">No users found or failed to load.</p>';
    return;
  }

  // Créer une liste non ordonnée avec des classes Tailwind
  const ul = document.createElement('ul');
  ul.className = 'space-y-4'; // Ajoute de l'espace vertical entre les éléments de la liste

  users.forEach(user => {
    const li = document.createElement('li');
    // Classes Tailwind pour chaque élément de liste: padding, bordure, coins arrondis, fond
    li.className = 'p-4 border border-gray-300 rounded-md bg-white shadow-sm';

    // Créer des éléments pour afficher les détails de l'utilisateur
    const idSpan = document.createElement('span');
    idSpan.className = 'font-bold text-blue-600'; // Classe Tailwind
    idSpan.textContent = `ID: ${user.id}`;

    const usernameP = document.createElement('p');
    usernameP.className = 'text-gray-800'; // Classe Tailwind
    usernameP.textContent = `Username: ${user.username}`;

    const emailP = document.createElement('p');
    emailP.className = 'text-gray-600 italic text-sm'; // Classe Tailwind
    emailP.textContent = `Email: ${user.email}`;

    // Ajouter les détails à l'élément li
    li.appendChild(idSpan);
    li.appendChild(usernameP);
    li.appendChild(emailP);

    // Ajouter l'élément li à la liste ul
    ul.appendChild(li);
  });

  // Ajouter la liste complète à l'élément conteneur
  userListElement.appendChild(ul);
}

// Point d'entrée: Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', async () => {
  const userListElement = document.getElementById('user-list');
  if (userListElement) {
    // Afficher un message de chargement initial
    userListElement.innerHTML = '<p class="text-center text-gray-500">Loading users...</p>';
  }

  // Récupérer les utilisateurs
  const users = await fetchUsers();

  // Afficher les utilisateurs
  displayUsers(users);
});
