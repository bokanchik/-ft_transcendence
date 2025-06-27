import { cleanupSocket } from "../services/initOnlineGame.js";
import { navigateTo } from "../services/router.js";
import socket from '../services/socket.js';
import { t } from '../services/i18nService.js';

export function showGameResult(player1: string, player2: string, score1: number, score2: number, url1: string, url2: string) {
	const modal = document.createElement('div');
	modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm';

	const content = document.createElement('div');
	content.className = 'bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-[90%] max-w-lg text-center border border-gray-300';

	// Titre
	const title = document.createElement('h2');
	title.className = 'text-3xl font-bold text-gray-800 mb-6';
	title.textContent = t('game.result.finished');

	// Container des joueurs
	const playersContainer = document.createElement('div');
	playersContainer.className = 'flex justify-between items-center gap-4 mb-6';

	// Joueur 1
	const player1Container = document.createElement('div');
	player1Container.className = 'flex flex-col items-center flex-1';

	const img1 = document.createElement('img');
	// TODO: fetch a la base de donne d'Arthur -> Done dans le back (appel de updatePlayerStats dans setGameResult)
	img1.src = url1;
	img1.className = 'w-20 h-20 object-cover rounded-full mb-2 border-4 border-blue-500 shadow';

	const name1 = document.createElement('p');
	name1.className = 'font-semibold text-lg text-gray-800';
	name1.textContent = player1;

	const scoreText1 = document.createElement('p');
	scoreText1.className = 'text-2xl font-bold text-blue-600';
	scoreText1.textContent = String(score1);

	player1Container.appendChild(img1);
	player1Container.appendChild(name1);
	player1Container.appendChild(scoreText1);

	// "vs" texte
	const vsText = document.createElement('span');
	vsText.className = 'text-3xl font-bold text-gray-700';
	vsText.textContent = t('game.vs');

	// Joueur 2
	const player2Container = document.createElement('div');
	player2Container.className = 'flex flex-col items-center flex-1';

	const img2 = document.createElement('img');
	img2.src = url2;
	img2.className = 'w-20 h-20 object-cover rounded-full mb-2 border-4 border-red-500 shadow';

	const name2 = document.createElement('p');
	name2.className = 'font-semibold text-lg text-gray-800';
	name2.textContent = player2;

	const scoreText2 = document.createElement('p');
	scoreText2.className = 'text-2xl font-bold text-red-600';
	scoreText2.textContent = String(score2);

	player2Container.appendChild(img2);
	player2Container.appendChild(name2);
	player2Container.appendChild(scoreText2);

	// Bouton retour au lobby
	const closeButton = document.createElement('button');
	closeButton.id = 'close-modal';
	closeButton.className = 'mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition';
	closeButton.textContent = t('link.lobby');

	// Assemble tout
	playersContainer.appendChild(player1Container);
	playersContainer.appendChild(vsText);
	playersContainer.appendChild(player2Container);

	content.appendChild(title);
	content.appendChild(playersContainer);
	content.appendChild(closeButton);
	modal.appendChild(content);
	document.body.appendChild(modal);

	// --- Event: Close bouton
	closeButton.addEventListener('click', () => {
		modal.remove();
		cleanupSocket(socket);
		sessionStorage.clear();
		navigateTo('/game');
	});
}
