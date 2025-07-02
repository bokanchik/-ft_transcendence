import { initLocalGame } from "../services/initLocalGame";
import { createLocalMatch } from "../services/initLocalGame.js";

type Match = {
    id: string;
    player1: string;
    player2: string;
    winner: string | null;
};

type Rounds = {
    [round: number]: Match[];
};

export function TournamentPage(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'p-8 flex flex-col items-center';

    const rawData = sessionStorage.getItem('tournamentData');
    if (!rawData) {
        container.innerHTML = `<div class="text-center text-red-500 text-lg">Aucune donnée de tournoi disponible.</div>`;
        return container;
    }

    let data;
    try {
        data = JSON.parse(rawData);
    } catch (err) {
        container.innerHTML = `<div class="text-center text-red-500 text-lg">Erreur de parsing des données du tournoi.</div>`;
        return container;
    }

    const title = document.createElement('h1');
    title.className = 'text-3xl font-bold mb-6 text-center';
    title.textContent = 'King-Pong Tournoi';
    container.appendChild(title);

    // Initialize first round
    const rounds: Rounds = {};
    let currentRound = 1;
    rounds[currentRound] = data.pairs.map((pair: any, index: number) => ({
        id: `R${currentRound}-${index}`,
        player1: pair.player1,
        player2: pair.player2,
        winner: null,
    }));

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'w-full max-w-4xl';
    container.appendChild(contentWrapper);

    function render() {
        contentWrapper.innerHTML = '';

        const sortedRounds = Object.entries(rounds).sort((a, b) => Number(a[0]) - Number(b[0]));

        for (const [roundStr, matches] of sortedRounds) {
            const roundNum = parseInt(roundStr, 10);
            const roundEl = document.createElement('div');
            roundEl.className = 'mb-8 bg-white shadow-lg rounded-lg p-6 border border-gray-200';

            const header = document.createElement('h2');
            header.className = 'text-2xl font-semibold mb-4 text-indigo-600';
            header.textContent = roundNum === currentRound && matches.length === 1 ? 'Finale' : `Round ${roundNum}`;
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

                const startButton = document.createElement('button');
                startButton.textContent = 'Next Match';
                startButton.className = 'mt-10 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition';

                startButton.addEventListener('click', () => {
                    createLocalMatch(match.player2, match.player1, true);
                });
                buttonsDiv.appendChild(startButton);

                // const btn1 = document.createElement('button');
                // btn1.textContent = `${match.player1} gagne`;
                // btn1.className = 'px-2 py-1 bg-green-500 text-white rounded';
                // btn1.onclick = () => {
                //     match.winner = match.player1;
                //     render();
                // };

                // const btn2 = document.createElement('button');
                // btn2.textContent = `${match.player2} gagne`;
                // btn2.className = 'px-2 py-1 bg-blue-500 text-white rounded';
                // btn2.onclick = () => {
                //     match.winner = match.player2;
                //     render();
                // };

                // buttonsDiv.appendChild(btn1);
                // buttonsDiv.appendChild(btn2);
                const searchParams = new URLSearchParams(window.location.search);
                const score = searchParams.get("score");
                //need to add the recever for the winner
                console.log(`score ${searchParams.get("score")}`);
                const scoreSpan = document.createElement('span');
                if (score) {
                    const [score1, score2] = score.split('-').map(Number);
                    const score1Span = document.createElement('span');
                    score1Span.textContent = `${match.player1} ${score1}`;
                    score1Span.className = 'text-gray-500';
                    const score2Span = document.createElement('span');
                    score2Span.textContent = `${match.player2} ${score2}`;
                    score2Span.className = 'text-gray-500';
                    li.append(player1Span, vsSpan, player2Span, score1Span, score2Span);
                    console.log(`Match: ${match.player1} vs ${match.player2}, Score: ${score1}-${score2}`);
                    // scoreSpan.className = 'text-gray-500 ml-4';
                    // scoreSpan.textContent = `${match.player1} ${score1} - ${match.player2} ${score2}`;
                    // li.append(player1Span, vsSpan, player2Span, scoreSpan);
                    const player1 = searchParams.get("player1");
                    const player2 = searchParams.get("player2");
                    console.log(`Player1: ${player1}, Player2: ${player2}`);
                    if (match.player2 == player1 && match.player2 == player1) {
                        if (score1 < score2) {
                            match.winner = match.player2;
                            console.log(`Match: ${match.player1} vs ${match.player2}, Winner: ${match.winner}`);
                        } else if (score1 > score2) {
                            match.winner = match.player1;
                            console.log(`Match: ${match.player1} vs ${match.player2}, Winner: ${match.winner}`);
                        }
                        else {
                            console.log(`Match: ${match.player1} vs ${match.player2}, No winner`);
                            li.append(player1Span, vsSpan, player2Span);
                        }
                    }
                } else {
                    li.append(player1Span, vsSpan, player2Span);
                }
                if (match.winner) {
                    li.classList.add('bg-green-100');
                    const winnerSpan = document.createElement('span');
                    winnerSpan.className = 'ml-4 text-green-600 font-semibold';
                    winnerSpan.textContent = `✔️ ${match.winner} vainqueur`;
                    li.append(player1Span, vsSpan, player2Span, winnerSpan);
                } else {
                    li.append(player1Span, vsSpan, player2Span, buttonsDiv);
                }

                list.appendChild(li);
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
            alert('Tous les matchs ne sont pas terminés.');
            return;
        }

        const winners = rounds[currentRound].map(m => m.winner!) as string[];

        if (winners.length === 1) {
            alert(`🏆 Le gagnant du tournoi est ${winners[0]} !`);
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
        rounds[currentRound] = nextRound;
        render();
    }

    const nextRoundButton = document.createElement('button');
    nextRoundButton.textContent = 'Lancer le round suivant';
    nextRoundButton.className = 'mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition';
    nextRoundButton.onclick = generateNextRound;
    container.appendChild(nextRoundButton);

    render();
    return container;
}
