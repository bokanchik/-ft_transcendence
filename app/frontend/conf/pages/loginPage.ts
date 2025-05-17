// /pages/loginPage.ts
import { attemptLogin } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
import { LoginForm } from '../components/loginForm.js';
import { LoginRequestBody, ApiResult } from '../shared/types.js';

export function LoginPage(): HTMLElement {
	const container = document.createElement('div');
	container.className = 'bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-center min-h-screen p-8';

	const formContainer = document.createElement('div');
	formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';

	const title = document.createElement('h2');
	title.className = 'text-3xl font-bold mb-6 text-center text-gray-800';
	title.textContent = 'Login';

	formContainer.appendChild(title);

	// Fonction de rappel pour la soumission du formulaire
	const handleLoginAttempt = async (credentials: LoginRequestBody): Promise<ApiResult> => {
		return attemptLogin(credentials);
	};

	// Fonction de rappel pour le succès de la connexion
	const handleLoginSuccess = (userData: any) => {
		// Le message de succès est déjà affiché dans le composant LoginForm.
		// La page se charge uniquement de la redirection.
		setTimeout(() => {
			navigateTo('/dashboard');
		}, 500); // Délai pour que l'utilisateur voie le message de succès
	};

	// Créer et ajouter le composant formulaire
	const loginFormComponent = LoginForm({
		onLoginAttempt: handleLoginAttempt,
		onLoginSuccess: handleLoginSuccess,
	});
	formContainer.appendChild(loginFormComponent);


	const linksDiv = document.createElement('div');
	linksDiv.className = 'mt-6 text-center';
	linksDiv.innerHTML = `
        <a href="/" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            Back to Home
        </a>
        <span class="mx-2 text-gray-400">|</span>
        <a href="/register" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            Don't have an account? Register
        </a>
    `;
	formContainer.appendChild(linksDiv);

	container.appendChild(formContainer);

	return container;
}
