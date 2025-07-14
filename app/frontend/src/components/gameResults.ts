import { cleanupSocket } from "../services/initOnlineGame.js";
import { navigateTo } from "../services/router.js";
import socket from '../services/socket.js';
import { t } from '../services/i18nService.js';
import { createElement } from '../utils/domUtils.js'; // Assurez-vous d'importer createElement
import { TournamentData } from '../shared/schemas/matchesSchemas.js';

export function showGameResult(player1: string, player2: string, score1: number, score2: number, url1: string, url2: string, destinationUrl: string, destinationText: string) {

	const modal = createElement('div', {
        className: 'fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in'
    });

	const content = createElement('div', {
        className: 'bg-gray-900/70 backdrop-blur-lg border-2 border-yellow-400/30 rounded-2xl shadow-2xl p-6 sm:p-8 w-[90%] max-w-2xl text-center'
    });

	const title = createElement('h2', {
        className: 'text-5xl font-beach text-gray-300 mb-6 pb-4 border-b-2 border-yellow-400/20 [text-shadow:_0_3px_6px_rgb(0_0_0_/_50%)]',
        textContent: t('game.result.finished')
    });

	const playersContainer = createElement('div', {
        className: 'flex justify-around items-center gap-4 my-8'
    });

	const player1Container = createElement('div', {
        className: 'flex flex-col items-center flex-1 transition-all duration-300'
    });
	const img1 = createElement('img', {
        src: url1,
        alt: player1,
        className: 'w-32 h-32 object-cover rounded-full mb-4 border-4 border-teal-700 shadow-lg'
    });
	const name1 = createElement('p', {
        className: 'font-beach text-4xl text-gray-200 truncate w-full px-2',
        textContent: player1
    });
	const scoreText1 = createElement('p', {
        className: 'font-roar text-7xl text-teal-700 mt-2',
        textContent: String(score1)
    });
	player1Container.append(img1, name1, scoreText1);

	const vsText = createElement('span', {
        className: 'font-jurassic text-6xl text-gray-400 mx-4 self-center pb-8',
        textContent: t('game.vs')
    });

	const player2Container = createElement('div', {
        className: 'flex flex-col items-center flex-1 transition-all duration-300'
    });
	const img2 = createElement('img', {
        src: url2,
        alt: player2,
        className: 'w-32 h-32 object-cover rounded-full mb-4 border-4 border-red-700 shadow-lg'
    });
	const name2 = createElement('p', {
        className: 'font-beach text-4xl text-gray-200 truncate w-full px-2',
        textContent: player2
    });
	const scoreText2 = createElement('p', {
        className: 'font-roar text-7xl text-red-700 mt-2',
        textContent: String(score2)
    });
	player2Container.append(img2, name2, scoreText2);

	if (score1 > score2) {
		player1Container.classList.add('opacity-100', 'scale-105');
		player2Container.classList.add('opacity-60', 'scale-95');
        name1.classList.add('text-teal-700');
	} else if (score2 > score1) {
		player2Container.classList.add('opacity-100', 'scale-105');
		player1Container.classList.add('opacity-60', 'scale-95');
        name2.classList.add('text-red-700');
	}

	const closeButton = createElement('button', {
        id: 'close-modal',
        className: 'mt-8 px-10 py-4 bg-yellow-700 hover:bg-yellow-600 text-gray-300 font-beach text-2xl rounded-lg shadow-lg border-2 border-yellow-500/50 transition-all duration-200 transform hover:scale-105',
        textContent: destinationText
    });

	playersContainer.append(player1Container, vsText, player2Container);
	content.append(title, playersContainer, closeButton);
	modal.appendChild(content);
	document.body.appendChild(modal);
	
	const rawData = sessionStorage.getItem('tournamentData');
    if (rawData) {
		let data: TournamentData;
    	try {
    	    data = JSON.parse(rawData);
    	    if (!data.results) {
    	        data.results = new Array(data.pairs.length * 2).fill(null);
    		}			
    	} catch (err) {
			console.log("couldnt parse data")
    	}
        if (data!) {
            let i = 0
            while (data.results[i] != null)
                i++
            if (score1 > score2) {
                data.results[i] = 0;		
            } else if (score2 > score1) {
                data.results[i] = 1;		
            }
            console.log(data.results[i])
            sessionStorage.setItem('tournamentData', JSON.stringify(data))
        }
	}
	
	closeButton.addEventListener('click', () => {
		modal.remove();
        
        const onlineTournamentId = sessionStorage.getItem('onlineTournamentId');
        if (!onlineTournamentId) {
		    cleanupSocket(socket);
        }

        const gameMode = sessionStorage.getItem('gameMode');

        if (gameMode === 'tournament') {
            sessionStorage.removeItem('matchId');
            sessionStorage.removeItem('player1');
            sessionStorage.removeItem('player2');
        } else {
            sessionStorage.clear();
        }
		navigateTo(destinationUrl);
	});
}