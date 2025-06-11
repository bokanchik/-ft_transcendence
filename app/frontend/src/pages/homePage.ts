export function HomePage(): HTMLElement {

	const container = document.createElement('div');
	// --- LE FOND JUNGLE ---
	container.className = 'relative bg-cover bg-center min-h-screen text-white flex flex-col items-center justify-between p-4 sm:p-8';
  container.style.backgroundImage = "url('https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8anVuZ2xlfGVufDB8fDB8fHww')";
	// container.style.backgroundImage = "url('https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8anVuZ2xlfGVufDB8fDB8fHww')";
	
  // --- SUPERPOSITION SOMBRE ---
	const overlay = document.createElement('div');
	overlay.className = 'absolute inset-0 bg-black/40';

	// --- EN-TÊTE (Login/Register) ---
	const header = document.createElement('header');
	header.className = 'relative z-10 w-full flex justify-between items-center';
	
	const logo = document.createElement('h1');
	logo.className = 'text-2xl sm:text-3xl font-bold tracking-wider text-shadow';
	logo.innerHTML = `🏓 <span class="hidden sm:inline">King-Pong</span>`;
	
	const authLinks = document.createElement('div');
	authLinks.className = 'flex items-center space-x-2 sm:space-x-4';
	authLinks.innerHTML = `
		<a href="/login" data-link class="text-sm sm:text-base font-semibold px-4 py-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-300">
			Login
		</a>
		<a href="/register" data-link class="text-sm sm:text-base bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-full shadow-lg transition-transform duration-300 transform hover:scale-105">
			Register
		</a>
	`;
	header.appendChild(logo);
	header.appendChild(authLinks);

	// --- SECTION PRINCIPALE (Titre et bouton PLAY) ---
	const mainContent = document.createElement('main');
	mainContent.className = 'relative z-10 flex flex-col items-center text-center';

	const title = document.createElement('h2');
	title.className = 'text-4xl sm:text-6xl md:text-7xl font-extrabold mb-4 text-shadow-lg';
	title.textContent = 'The Ultimate Jungle Pong';

	const subtitle = document.createElement('p');
	subtitle.className = 'text-lg sm:text-xl text-gray-200 mb-12 max-w-2xl text-shadow';
	subtitle.textContent = 'Dominate the table. Become the King.';
	
	const playButton = document.createElement('a');
	playButton.href = '/local-game';
	playButton.setAttribute('data-link', '');
	playButton.className = `
		bg-red-600 hover:bg-red-500 text-white font-black 
		text-2xl sm:text-4xl py-4 sm:py-6 px-10 sm:px-16 rounded-full shadow-2xl 
		uppercase tracking-widest 
		transition-all duration-300 ease-in-out 
		transform hover:scale-110 hover:shadow-red-500/50
	`;
	playButton.textContent = 'PLAY';

	mainContent.appendChild(title);
	mainContent.appendChild(subtitle);
	mainContent.appendChild(playButton);

	// --- PIED DE PAGE (Lien API discret) ---
	const footer = document.createElement('footer');
	footer.className = 'relative z-10 w-full text-center';
	
	const apiLink = document.createElement('a');
	apiLink.href = '/game';
	apiLink.setAttribute('data-link', '');
	apiLink.className = 'text-xs text-gray-400 hover:text-white hover:underline transition-colors duration-300';
	apiLink.textContent = 'Check Game API';
	
	footer.appendChild(apiLink);

	// --- Assemblage de la page ---
	container.appendChild(overlay);
	container.appendChild(header);
	container.appendChild(mainContent);
	container.appendChild(footer);

	// --- Ajout des styles ---
	const style = document.createElement('style');
	style.textContent = `
		.text-shadow { text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
		.text-shadow-lg { text-shadow: 0 4px 8px rgba(0,0,0,0.5); }
	`;
	container.appendChild(style);

	return container;
}


	
