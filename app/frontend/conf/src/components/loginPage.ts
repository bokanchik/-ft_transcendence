import { attemptLogin, LoginSuccessResponse } from '../services/authService.js';

export function LoginPage(): HTMLElement {
	const container = document.createElement('div');
	container.className = 'bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-center min-h-screen p-8';

	const formContainer = document.createElement('div');
	formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';

	formContainer.innerHTML = `
        <h2 class="text-3xl font-bold mb-6 text-center text-gray-800">Login</h2>
        <form id="login-form">
            <div class="mb-4">
                <label for="username" class="block text-gray-700 text-sm font-bold mb-2">Username</label>
                <input type="text" id="username" name="username" required
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-6">
                <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <input type="password" id="password" name="password" required
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="flex items-center justify-between">
                <button type="submit" id="login-button"
                        class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out">
                    Sign In
                </button>
            </div>
        </form>
        <div id="login-message" class="mt-4 text-center text-sm"></div> <!-- Pour les messages d'erreur/succès -->
        <div class="mt-6 text-center">
          <a href="/" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            Back to Home
          </a>
          <span class="mx-2 text-gray-400">|</span>
          <a href="/register" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            Don't have an account? Register
          </a>
        </div>
    `;

	container.appendChild(formContainer);

	// --- Ajout de la logique du formulaire ---
	const form = container.querySelector('#login-form') as HTMLFormElement;
	const usernameInput = container.querySelector('#username') as HTMLInputElement;
	const passwordInput = container.querySelector('#password') as HTMLInputElement;
	const messageDiv = container.querySelector('#login-message') as HTMLDivElement;
	const loginButton = container.querySelector('#login-button') as HTMLButtonElement;

	form.addEventListener('submit', async (event) => {
		event.preventDefault(); // Empêche le rechargement de la page
		messageDiv.textContent = 'Attempting login...'; // Message d'attente
		messageDiv.className = 'mt-4 text-center text-sm text-gray-600'; // Style neutre
		loginButton.disabled = true; // Désactive le bouton pendant la requête
		loginButton.textContent = 'Signing In...';

		const username = usernameInput.value.trim();
		const password = passwordInput.value; // Pas de .trim() pour le mot de passe

		if (!username || !password) {
			messageDiv.textContent = 'Please enter both username and password.';
			messageDiv.className = 'mt-4 text-center text-sm text-red-600'; // Style erreur
			loginButton.disabled = false;
			loginButton.textContent = 'Sign In';
			return;
		}

		const result: LoginSuccessResponse | null = await attemptLogin({ username, password });

		loginButton.disabled = false; // Réactive le bouton
		loginButton.textContent = 'Sign In';


		if (result && result.token) {
			// Succès !
			messageDiv.textContent = `Login successful! Welcome ${result.user.display_name || result.user.username}! Token stored.`;
			messageDiv.className = 'mt-4 text-center text-sm text-green-600'; // Style succès

			// Optionnel : Rediriger l'utilisateur après un court délai
			setTimeout(() => {
				// Rediriger vers une page protégée, ex: tableau de bord ou page d'accueil si elle change après login
				window.location.href = '/dashboard'; // Ou utilisez votre système de routage: router.navigate('/dashboard');
			}, 1500); // Délai de 1.5 secondes

		} else {
			// Échec (géré par alert dans attemptLogin, mais on peut aussi mettre à jour messageDiv)
			messageDiv.textContent = 'Login failed. Please check your credentials.'; // Message générique post-alert
			messageDiv.className = 'mt-4 text-center text-sm text-red-600'; // Style erreur
			passwordInput.value = ''; // Vide le champ mot de passe par sécurité
		}
	});
	return container;
}
