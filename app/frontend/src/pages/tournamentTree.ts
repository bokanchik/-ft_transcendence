import { initLocalGame } from "../services/initLocalGame";
import { createLocalMatch } from "../services/initLocalGame.js";
import { createElement } from "../utils/domUtils.js";
import { t } from '../services/i18nService.js'
import { HeaderComponent } from '../components/headerComponent.js';
import { navigateTo } from '../services/router.js';
import { getUserDataFromStorage, checkAuthStatus } from '../services/authService.js';
import { User } from '../shared/schemas/usersSchemas.js';

type Match = {
    id: string;
    player1: string;
    player2: string;
    winner: string | null;
};

type Rounds = {
    [round: number]: Match[];
};

type TournamentData = {
    pairs: { player1: string, player2: string }[];  // Tableau des paires de joueurs
    results: (number | null)[];  // Tableau des résultats des matchs (1 pour player1, 0 pour player2, null pour non déterminé)
    round: number;  // Numéro du round actuel
};

export function TournamentPage(): HTMLElement {

    const authData = getUserDataFromStorage();
        const currentUser: User = authData as User;

    const title = createElement('h2',
        {   className : 'flex-shrink-0 text-3xl font-bold mb-6 text-center text-white',
            textContent : t('tournament.title')
        }, 
    );

    const tournamentContentContainer = createElement('div', {
		className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col max-h-[90vh]'
	}, [title]);

    const pageWrapper = createElement('div', {
            className: 'flex flex-col h-screen bg-cover bg-center bg-fixed'
        }, [
            HeaderComponent({ currentUser }),
            createElement('div', {
                className: 'flex-grow flex items-center justify-center p-4 sm:p-8'
            }, 
            [tournamentContentContainer])
        ]);
        pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";
    
    const rawData = sessionStorage.getItem('tournamentData');
    if (!rawData) {
        pageWrapper.innerHTML = `<div class="text-center text-red-500 text-lg">Aucune donnée de tournoi disponible.</div>`;
        return pageWrapper;
    }

    let data: TournamentData;
    try {
        data = JSON.parse(rawData);
        if (!data.results) {
            data.results = new Array(data.pairs.length * 2).fill(null);
    }
    } catch (err) {
        pageWrapper.innerHTML = `<div class="text-center text-red-500 text-lg">Erreur de parsing des données du tournoi.</div>`;
        return pageWrapper;
    }
    
    // Initialize first round
    const rounds: Rounds = {};
    let currentRound = data.round || 1;
    rounds[currentRound] = data.pairs.map((pair: any, index: number) => ({
        id: `R${currentRound}-${index}`,
        player1: pair.player1,
        player2: pair.player2,
        winner: null,
    }));

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'w-full max-w-4xl';
    tournamentContentContainer.appendChild(contentWrapper);

    function render() {
        contentWrapper.innerHTML = '';

        const sortedRounds = Object.entries(rounds).sort((a, b) => Number(a[0]) - Number(b[0]));

        let index = 0;
        for (let roundNum = 1; roundNum <= currentRound; roundNum++) {
            const matches = rounds[roundNum];
            if (!matches) continue;
            const roundEl = document.createElement('div');
            roundEl.className = 'mb-8 bg-white shadow-lg rounded-lg p-6 border border-gray-200';

            const header = document.createElement('h2');
            header.className = 'text-2xl font-semibold mb-4 text-indigo-600';
            header.textContent = roundNum === currentRound && matches.length === 1 ? t('tournament.finale') : t('tournament.round') + ` ${roundNum}`;
            roundEl.appendChild(header);

            const list = document.createElement('ul');
            list.className = 'space-y-3';

            for (const match of matches) {
                const li = document.createElement('li');
                li.className = 'bg-gray-100 p-3 rounded-md flex justify-between items-center shadow-sm';

                const player1Span = document.createElement('span');
                player1Span.textContent = match.player1;
                player1Span.className = 'font-medium text-gray-700';

                const vsSpan = document.createElement('span');
                vsSpan.textContent = 'vs';
                vsSpan.className = 'text-gray-500';

                const player2Span = document.createElement('span');
                player2Span.textContent = match.player2;
                player2Span.className = 'font-medium text-gray-700';

                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'flex gap-2';

                if (roundNum === currentRound && match.winner === null) {
                    const startButton = document.createElement('button');
                    startButton.textContent = t('tournament.nextMatch');
                    startButton.className = 'mt-10 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition';

                    startButton.addEventListener('click', () => {
                        createLocalMatch(match.player2, match.player1, true);
                    });

                    buttonsDiv.appendChild(startButton);
                }

                const searchParams = new URLSearchParams(window.location.search);
                const score = searchParams.get("score");
                const scoreSpan = document.createElement('span');
                if (data.results[index] == 1){
                    match.winner = match.player1;
                }
                else if (data.results[index] == 0) {
                    match.winner = match.player2;
                }
                else {
                    match.winner = null;
                }
                if (!match.winner && score) {
                    const [score1, score2] = score.split('-').map(Number);

                    console.log(`Match: ${match.player1} vs ${match.player2}, Score: ${score1}-${score2}`);
                    const player1 = searchParams.get("player1");
                    const player2 = searchParams.get("player2");
                    console.log(`Player1: ${player1}, Player2: ${player2}`);
                    if (match.player2 == player1 && match.player2 == player1) {
                        if (score1 < score2) {
                            match.winner = match.player2;
                            data.results[index] = 1;
                            console.log(`Match: ${match.player1} vs ${match.player2}, Winner: ${match.winner}`);
                        } else if (score1 > score2) {
                            data.results[index] = 0;
                            match.winner = match.player1;
                            console.log(`Match: ${match.player1} vs ${match.player2}, Winner: ${match.winner}`);
                        }
                        else {
                            console.log(`Match: ${match.player1} vs ${match.player2}, No winner`);
                            li.append(player1Span, vsSpan, player2Span);
                        }
                    }
                    sessionStorage.setItem('tournamentData', JSON.stringify(data));
                } else {
                    li.append(player1Span, vsSpan, player2Span);
                }
                if (match.winner) {
                    li.classList.add('bg-green-100');
                    const winnerSpan = document.createElement('span');
                    winnerSpan.className = 'ml-4 text-green-600 font-semibold';
                    winnerSpan.textContent = t('tournamentContentContainer.winner');
                    li.append(player1Span, vsSpan, player2Span, winnerSpan);
                } else {
                    li.append(player1Span, vsSpan, player2Span, buttonsDiv);
                }
                list.appendChild(li);
                index++;
            }
            roundEl.appendChild(list);
            contentWrapper.appendChild(roundEl);
        }
    }

    function canGenerateNextRound(): boolean {
        const matches = rounds[currentRound];
        return matches.every(m => m.winner !== null);
    }

    function generateNextRound() {
        if (!canGenerateNextRound()) {
            alert(t('tournament.notOver'));
            return;
        }

        const winners = rounds[currentRound].map(m => m.winner!) as string[];

        if (winners.length === 1) {
            alert(t('tournament.winnerIs'));
            return;
        }

        const nextRound: Match[] = [];
        for (let i = 0; i < winners.length; i += 2) {
            const player1 = winners[i];
            const player2 = winners[i + 1] ?? 'BYE';
            nextRound.push({
                id: `R${currentRound + 1}-${i}`,
                player1,
                player2,
                winner: player2 === 'BYE' ? player1 : null,
            });
        }
        currentRound++;
        data.round = currentRound;
        sessionStorage.setItem('tournamentData', JSON.stringify(data));
        rounds[currentRound] = nextRound;
        render();
    }

    const nextRoundButton = document.createElement('button');
    nextRoundButton.textContent = t('tournament.nextRound');
    nextRoundButton.className = 'mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition';
    nextRoundButton.onclick = generateNextRound;
    tournamentContentContainer.appendChild(nextRoundButton);

    render();
    return pageWrapper;
}
