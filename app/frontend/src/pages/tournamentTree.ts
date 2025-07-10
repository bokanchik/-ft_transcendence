// import { initLocalGame } from "../services/initLocalGame";
// import { createLocalMatch } from "../services/initLocalGame.js";
// import { createElement } from "../utils/domUtils.js";
// import { t } from '../services/i18nService.js'
// import { HeaderComponent } from '../components/headerComponent.js';
// import { navigateTo } from '../services/router.js';
// import { getUserDataFromStorage, checkAuthStatus } from '../services/authService.js';
// import { User } from '../shared/schemas/usersSchemas.js';

// type Match = {
//     id: string;
//     player1: string;
//     player2: string;
//     winner: string | null;
// };

// type Rounds = {
//     [round: number]: Match[];
// };

// type TournamentData = {
//     pairs: { player1: string, player2: string }[];  // Tableau des paires de joueurs
//     results: (number | null)[];  // Tableau des résultats des matchs (0 pour player1, 1 pour player2, null pour non déterminé)
//     round: number;  // Numéro du round actuel
// };

// export function TournamentPage(): HTMLElement {

//     const authData = getUserDataFromStorage();
//         const currentUser: User = authData as User;

//     const title = createElement('h2',
//         {   className : 'flex-shrink-0 text-3xl font-bold mb-6 text-center text-white',
//             textContent : t('tournament.title')
//         }, 
//     );

//     const tournamentContentContainer = createElement('div', {
// 		className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 items-center rounded-2xl shadow-2xl p-8 flex flex-col max-h-[90vh] w-1/3'
// 	}, [title]);

//     const pageWrapper = createElement('div', {
//             className: 'flex flex-col h-screen bg-cover bg-center bg-fixed'
//         }, [
//             HeaderComponent({ currentUser }),
//             createElement('div', {
//                 className: 'flex-grow flex items-center justify-center p-4 sm:p-8'
//             }, 
//             [tournamentContentContainer])
//         ]);
//         pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";
    
//     const rawData = sessionStorage.getItem('tournamentData');
//     if (!rawData) {
//         pageWrapper.innerHTML = `<div class="text-center text-red-500 text-lg">Aucune donnée de tournoi disponible.</div>`;
//         return pageWrapper;
//     }

//     let data: TournamentData;
//     try {
//         data = JSON.parse(rawData);
//         if (!data.results) {
//             data.results = new Array(data.pairs.length * 2).fill(null);
//     }
//     } catch (err) {
//         pageWrapper.innerHTML = `<div class="text-center text-red-500 text-lg">Erreur de parsing des données du tournoi.</div>`;
//         return pageWrapper;
//     }
    
//     // Build complete tournament structure from data
//     const { rounds, currentRound, totalRounds } = buildTournamentStructure(data);


//     const contentWrapper = createElement('div', {
//         className : 'w-full max-w-4xl'
//     });
//     tournamentContentContainer.appendChild(contentWrapper);

//     function buildTournamentStructure(tournamentData: TournamentData) {
//         const rounds: Rounds = {};
//         const initialPlayers = tournamentData.pairs.flatMap(pair => [pair.player1, pair.player2]);
        
//         // Calculate total rounds needed for tournament
//         const playerCount = initialPlayers.length;
//         const totalRounds = Math.ceil(Math.log2(playerCount));
        
//         // Initialize first round with initial pairs
//         rounds[1] = tournamentData.pairs.map((pair, index) => ({
//             id: `R1-${index}`,
//             player1: pair.player1,
//             player2: pair.player2,
//             winner: getMatchWinner(pair.player1, pair.player2, tournamentData.results[index])
//         }));

//         // Build subsequent rounds based on results
//         let currentRoundMatches = rounds[1];
//         let resultIndex = tournamentData.pairs.length; // Start after first round results
        
//         for (let roundNum = 2; roundNum <= totalRounds; roundNum++) {
//             const winners: string[] = [];
            
//             // Get winners from previous round
//             currentRoundMatches.forEach(match => {
//                 if (match.winner) {
//                     winners.push(match.winner);
//                 }
//             });
            
//             // If we don't have enough winners, break (tournament not progressed that far)
//             if (winners.length < 2) break;
            
//             // Create next round matches
//             const nextRoundMatches: Match[] = [];
//             for (let i = 0; i < winners.length; i += 2) {
//                 const player1 = winners[i];
//                 const player2 = winners[i + 1] || 'BYE';
//                 const matchResult = tournamentData.results[resultIndex];
                
//                 nextRoundMatches.push({
//                     id: `R${roundNum}-${Math.floor(i / 2)}`,
//                     player1,
//                     player2,
//                     winner: player2 === 'BYE' ? player1 : getMatchWinner(player1, player2, matchResult)
//                 });
                
//                 if (player2 !== 'BYE') {
//                     resultIndex++;
//                 }
//             }
            
//             rounds[roundNum] = nextRoundMatches;
//             currentRoundMatches = nextRoundMatches;
//         }
        
//         // Determine current active round
//         let activeRound = 1;
//         for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
//             if (!rounds[roundNum]) break;
            
//             const hasUnfinishedMatch = rounds[roundNum].some(match => match.winner === null);
//             if (hasUnfinishedMatch) {
//                 activeRound = roundNum;
//                 break;
//             }
//             activeRound = roundNum + 1;
//         }
        
//         return { rounds, currentRound: activeRound, totalRounds };
//     }

//     function getMatchWinner(player1: string, player2: string, result: number | null): string | null {
//         if (result === 0) return player1;
//         if (result === 1) return player2;
//         return null;
//     }

//     function render() {
//         contentWrapper.innerHTML = '';

//         const sortedRounds = Object.entries(rounds).sort((a, b) => Number(a[0]) - Number(b[0]));

//         for (const [roundNumStr, matches] of sortedRounds) {
//             const roundNum = Number(roundNumStr);
//             const roundEl = document.createElement('div');
            
//             // Style rounds differently based on their status
//             const isCurrentRound = roundNum === currentRound;
//             const isFinishedRound = roundNum < currentRound;
            
//             if (isFinishedRound) {
//                 roundEl.className = 'mb-8 bg-green-50 shadow-lg rounded-lg p-6 border border-green-200';
//             } else if (isCurrentRound) {
//                 roundEl.className = 'mb-8 bg-blue-50 shadow-lg rounded-lg p-6 border border-blue-200 ring-2 ring-blue-300';
//             } else {
//                 roundEl.className = 'mb-8 bg-gray-50 shadow-lg rounded-lg p-6 border border-gray-200 opacity-60';
//             }

//             const header = document.createElement('h2');
//             if (isFinishedRound) {
//                 header.className = 'text-2xl font-semibold mb-4 text-green-600';
//             } else if (isCurrentRound) {
//                 header.className = 'text-2xl font-semibold mb-4 text-blue-600';
//             } else {
//                 header.className = 'text-2xl font-semibold mb-4 text-gray-500';
//             }
            
//             if (matches.length === 1 && roundNum === totalRounds) {
//                 header.textContent = t('tournament.finale');
//             } else {
//                 header.textContent = t('tournament.round') + ` ${roundNum}`;
//             }
            
//             // Add status indicator
//             if (isCurrentRound) {
//                 const statusSpan = createElement('span', {
//                     className : 'ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full',
//                     textContent : t('tournament.current')
//                 });
//                 header.appendChild(statusSpan);
//             } else if (isFinishedRound) {
//                 const statusSpan = createElement('span',{
//                     className : 'ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full',
//                     textContent : t('tournament.completed')
//                 });
//                 header.appendChild(statusSpan);
//             }
            
//             roundEl.appendChild(header);

//             const list = createElement('ul', {
//                 className : 'space-y-3'
//             });
            
//             let hasPlayableMatch = false;
            
//             for (const match of matches) {
//                 const li = document.createElement('li');
                
//                 if (match.winner) {
//                     li.className = 'bg-green-100 p-3 rounded-md flex justify-between items-center shadow-sm border border-green-200';
//                 } else if (isCurrentRound) {
//                     li.className = 'bg-blue-100 p-3 rounded-md flex justify-between items-center shadow-sm border border-blue-200';
//                 } else {
//                     li.className = 'bg-gray-100 p-3 rounded-md flex justify-between items-center shadow-sm';
//                 }

//                 const matchInfo = createElement('div', {
//                     className : 'flex items-center gap-3'
//                 });

//                 const player1Span = createElement('span', {
//                     textContent : match.player1,
//                     className : match.winner === match.player1 ? 'font-bold text-green-700' : 'font-medium text-gray-700'
//                 });

//                 const vsSpan = createElement('span', {
//                     textContent : 'vs',
//                     className : 'text-gray-500'
//                 });

//                 const player2Span = createElement('span', {
//                     textContent : match.player2,
//                     className : match.winner === match.player2 ? 'font-bold text-green-700' : 'font-medium text-gray-700'
//                 });

//                 matchInfo.append(player1Span, vsSpan, player2Span);

//                 const actionDiv = createElement('div', {
//                     className : 'flex items-center gap-2'
//                 });

//                 if (match.winner) {
//                     const winnerSpan = createElement('span', {
//                         className : 'text-green-600 font-semibold',
//                         textContent : t('tournament.winner') + ` ${match.winner}`
//                     });
//                     actionDiv.appendChild(winnerSpan);
//                 } else if (isCurrentRound && !hasPlayableMatch) {
//                     const startButton = createElement('button', {
//                         textContent : t('tournament.playMatch') || 'Play Match',
//                         className : 'px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm'
//                     });
//                     startButton.addEventListener('click', () => {
//                         createLocalMatch(match.player1, match.player2, true);
//                     });

//                     actionDiv.appendChild(startButton);
//                     hasPlayableMatch = true;
//                 } else if (!match.winner) {
//                     const waitingSpan = document.createElement('span');
//                     waitingSpan.className = 'text-gray-500 italic';
//                     waitingSpan.textContent = t('tournament.waiting') || 'Waiting...';
//                     actionDiv.appendChild(waitingSpan);
//                 }

//                 li.append(matchInfo, actionDiv);
//                 list.appendChild(li);
//             }
            
//             roundEl.appendChild(list);
//             contentWrapper.appendChild(roundEl);
//         }
//     }

//     function canGenerateNextRound(): boolean {
//         const currentRoundMatches = rounds[currentRound];
//         if (!currentRoundMatches) return false;
        
//         return currentRoundMatches.every(match => match.winner !== null);
//     }

//     function generateNextRound() {
//         if (!canGenerateNextRound()) {
//             alert(t('tournament.notOver'));
//             return;
//         }

//         const currentRoundMatches = rounds[currentRound];
//         const winners = currentRoundMatches.map(match => match.winner!).filter(winner => winner !== null);

//         if (winners.length === 1) {
//             alert(t('tournament.winnerIs') + winners[0] + ' !');
//             return;
//         }

//         // Update tournament data and rebuild structure
//         data.round = currentRound + 1;
//         sessionStorage.setItem('tournamentData', JSON.stringify(data));
        
//         // Rebuild tournament structure to reflect new state
//         const newStructure = buildTournamentStructure(data);
//         Object.assign(rounds, newStructure.rounds);
        
//         render();
//     }

//     function shouldShowNextRoundButton(): boolean {
//         // Show button if current round is complete and there's more than 1 winner
//         if (!canGenerateNextRound()) return false;
        
//         const currentRoundMatches = rounds[currentRound];
//         if (!currentRoundMatches) return false;
        
//         const winners = currentRoundMatches.map(match => match.winner!).filter(winner => winner !== null);
//         return winners.length > 1;
//     }

//     const nextRoundButton = createElement('button', {
//         textContent : t('tournament.nextRound'),
//         className : 'mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition',
//     });
//     nextRoundButton.onclick = generateNextRound;
    
//     // Only show next round button if appropriate
//     if (shouldShowNextRoundButton()) {
//         tournamentContentContainer.appendChild(nextRoundButton);
//     }

//     render();
//     return pageWrapper;
// }

// app/frontend/src/pages/tournamentTree.ts
import { createLocalMatch } from "../services/initLocalGame.js";
import { createElement } from "../utils/domUtils.js";
import { t } from '../services/i18nService.js'
import { HeaderComponent } from '../components/headerComponent.js';
import { navigateTo } from '../services/router.js';
import { getUserDataFromStorage, checkAuthStatus } from '../services/authService.js';
import { User } from '../shared/schemas/usersSchemas.js';
import socket from "../services/socket.js";

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
    results: (number | null)[];  // Tableau des résultats des matchs (0 pour player1, 1 pour player2, null pour non déterminé)
    round: number;  // Numéro du round actuel
};

// Nouvelle fonction pour gérer les tournois en ligne
function OnlineTournamentPage(tournamentId: string): HTMLElement {
    const currentUser = getUserDataFromStorage()!;
    const pageWrapper = createElement('div', { className: 'flex flex-col h-screen bg-cover bg-center bg-fixed' });
    pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";

    const title = createElement('h2', { className: 'flex-shrink-0 text-3xl font-bold mb-6 text-center text-white', textContent: t('tournament.titleOnline') });
    const tournamentContentContainer = createElement('div', { className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 items-center rounded-2xl shadow-2xl p-8 flex flex-col max-h-[90vh] w-2/3' }, [title]);
    const contentWrapper = createElement('div', { className: 'w-full max-w-4xl' });
    tournamentContentContainer.appendChild(contentWrapper);

    pageWrapper.append(
        HeaderComponent({ currentUser }),
        createElement('div', { className: 'flex-grow flex items-center justify-center p-4 sm:p-8' }, [tournamentContentContainer])
    );

    if (!socket.connected) {
        socket.connect();
    }
    socket.emit('joinTournamentRoom', { tournamentId });

    socket.on('tournamentState', (data: { rounds: Rounds, isFinished: boolean, winner?: string }) => {
        renderOnlineBracket(data.rounds, data.isFinished, data.winner, contentWrapper, currentUser.display_name);
    });

    // Correction : Ajout du type pour le paramètre déstructuré
    socket.on('startTournamentMatch', ({ matchId }: { matchId: string }) => {
        sessionStorage.setItem('gameMode', 'tournament'); // pour la redirection post-match
        sessionStorage.setItem('matchId', matchId);
        navigateTo(`/game-room?matchId=${matchId}`);
    });

    return pageWrapper;
}

function renderOnlineBracket(rounds: Rounds, isFinished: boolean, winner: string | undefined, container: HTMLElement, currentUserDisplayName: string) {
    container.innerHTML = '';
    const sortedRounds = Object.entries(rounds).sort((a, b) => Number(a[0]) - Number(b[0]));

    for (const [roundNumStr, matches] of sortedRounds) {
        const roundEl = createElement('div', { className: 'mb-8 bg-blue-50 shadow-lg rounded-lg p-6 border border-blue-200' });
        const header = createElement('h2', { textContent: `${t('tournament.round')} ${roundNumStr}`, className: 'text-2xl font-semibold mb-4 text-blue-600' });
        roundEl.appendChild(header);

        const list = createElement('ul', { className: 'space-y-3' });
        for (const match of matches) {
            const li = createElement('li', { className: 'bg-blue-100 p-3 rounded-md flex justify-between items-center shadow-sm' });
            
            const p1Class = match.winner === match.player1 ? 'font-bold text-green-700' : (match.player1 === currentUserDisplayName ? 'font-bold text-blue-700' : 'font-medium text-gray-700');
            const p2Class = match.winner === match.player2 ? 'font-bold text-green-700' : (match.player2 === currentUserDisplayName ? 'font-bold text-blue-700' : 'font-medium text-gray-700');

            const matchInfo = createElement('div', { className: 'flex items-center gap-3' }, [
                createElement('span', { textContent: match.player1, className: p1Class }),
                createElement('span', { textContent: 'vs', className: 'text-gray-500' }),
                createElement('span', { textContent: match.player2, className: p2Class })
            ]);

            if (match.winner) {
                const winnerSpan = createElement('span', { textContent: `${t('tournament.winner')} ${match.winner}`, className: 'text-green-600 font-semibold' });
                li.append(matchInfo, winnerSpan);
            } else {
                li.append(matchInfo);
            }
            list.appendChild(li);
        }
        roundEl.appendChild(list);
        container.appendChild(roundEl);
    }
    if (isFinished && winner) {
        const winnerBanner = createElement('div', { textContent: `${t('tournament.winnerIs')} ${winner}!`, className: 'mt-6 p-4 bg-yellow-400 text-black text-2xl font-bold text-center rounded-lg' });
        container.appendChild(winnerBanner);
    }
}


// --- Main Entry ---
export function TournamentPage(params?: { id?: string }): HTMLElement {
    if (params?.id) {
        // Mode tournoi en ligne
        return OnlineTournamentPage(params.id);
    } else {
        // Mode tournoi local
        return LocalTournamentPage();
    }
}

// --- Logique pour le tournoi LOCAL ---
function LocalTournamentPage(): HTMLElement {
    const authData = getUserDataFromStorage();
    const currentUser: User = authData as User;

    const title = createElement('h2', { className : 'flex-shrink-0 text-3xl font-bold mb-6 text-center text-white', textContent : t('tournament.title') });
    const tournamentContentContainer = createElement('div', { className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 items-center rounded-2xl shadow-2xl p-8 flex flex-col max-h-[90vh] w-1/3' }, [title]);
    const pageWrapper = createElement('div', { className: 'flex flex-col h-screen bg-cover bg-center bg-fixed' }, [
        HeaderComponent({ currentUser }),
        createElement('div', { className: 'flex-grow flex items-center justify-center p-4 sm:p-8' }, [tournamentContentContainer])
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
    
    const { rounds, currentRound, totalRounds } = buildTournamentStructure(data);
    const contentWrapper = createElement('div', { className : 'w-full max-w-4xl' });
    tournamentContentContainer.appendChild(contentWrapper);

    function buildTournamentStructure(tournamentData: TournamentData) {
        const rounds: Rounds = {};
        const initialPlayers = tournamentData.pairs.flatMap(pair => [pair.player1, pair.player2]);
        const playerCount = initialPlayers.length;
        const totalRounds = Math.ceil(Math.log2(playerCount));
        
        rounds[1] = tournamentData.pairs.map((pair, index) => ({
            id: `R1-${index}`, player1: pair.player1, player2: pair.player2, winner: getMatchWinner(pair.player1, pair.player2, tournamentData.results[index])
        }));

        let currentRoundMatches = rounds[1];
        let resultIndex = tournamentData.pairs.length;
        
        for (let roundNum = 2; roundNum <= totalRounds; roundNum++) {
            const winners = currentRoundMatches.map(match => match.winner).filter((w): w is string => w !== null);
            if (winners.length < 2 && roundNum > 2) break;
            
            const nextRoundMatches: Match[] = [];
            for (let i = 0; i < winners.length; i += 2) {
                const player1 = winners[i];
                const player2 = winners[i + 1] || 'BYE';
                const matchResult = tournamentData.results[resultIndex];
                
                nextRoundMatches.push({
                    id: `R${roundNum}-${i/2}`, player1, player2, winner: player2 === 'BYE' ? player1 : getMatchWinner(player1, player2, matchResult)
                });
                
                if (player2 !== 'BYE') resultIndex++;
            }
            rounds[roundNum] = nextRoundMatches;
            currentRoundMatches = nextRoundMatches;
        }
        
        let activeRound = 1;
        for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
            if (!rounds[roundNum] || rounds[roundNum].some(match => match.winner === null)) {
                activeRound = roundNum;
                break;
            }
            if (roundNum === totalRounds) activeRound = totalRounds + 1;
        }
        
        return { rounds, currentRound: activeRound, totalRounds };
    }

    function getMatchWinner(player1: string, player2: string, result: number | null): string | null {
        if (result === 0) return player1;
        if (result === 1) return player2;
        return null;
    }

    function render() {
        contentWrapper.innerHTML = '';
        const sortedRounds = Object.entries(rounds).sort((a, b) => Number(a[0]) - Number(b[0]));

        for (const [roundNumStr, matches] of sortedRounds) {
            const roundNum = Number(roundNumStr);
            const isCurrentRound = roundNum === currentRound;
            const isFinishedRound = roundNum < currentRound;
            
            const roundEl = createElement('div', { className: `mb-8 shadow-lg rounded-lg p-6 border ${isFinishedRound ? 'bg-green-50 border-green-200' : isCurrentRound ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-300' : 'bg-gray-50 border-gray-200 opacity-60'}` });
            const header = createElement('h2', { className: `text-2xl font-semibold mb-4 ${isFinishedRound ? 'text-green-600' : isCurrentRound ? 'text-blue-600' : 'text-gray-500'}` });
            header.textContent = matches.length === 1 && roundNum === totalRounds ? t('tournament.finale') : `${t('tournament.round')} ${roundNum}`;

            if (isCurrentRound) header.appendChild(createElement('span', { className: 'ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full', textContent: t('tournament.current') }));
            else if (isFinishedRound) header.appendChild(createElement('span', { className: 'ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full', textContent: t('tournament.completed') }));
            
            roundEl.appendChild(header);
            const list = createElement('ul', { className: 'space-y-3' });
            
            let hasPlayableMatch = false;
            for (const match of matches) {
                const li = createElement('li', { className: `p-3 rounded-md flex justify-between items-center shadow-sm border ${match.winner ? 'bg-green-100 border-green-200' : isCurrentRound ? 'bg-blue-100 border-blue-200' : 'bg-gray-100'}` });

                const matchInfo = createElement('div', { className: 'flex items-center gap-3' }, [
                    createElement('span', { textContent: match.player1, className: match.winner === match.player1 ? 'font-bold text-green-700' : 'font-medium text-gray-700' }),
                    createElement('span', { textContent: 'vs', className: 'text-gray-500' }),
                    createElement('span', { textContent: match.player2, className: match.winner === match.player2 ? 'font-bold text-green-700' : 'font-medium text-gray-700' }),
                ]);

                if (match.winner) {
                    li.append(matchInfo, createElement('span', { className: 'text-green-600 font-semibold', textContent: `${t('tournament.winner')} ${match.winner}` }));
                } else if (isCurrentRound && !hasPlayableMatch) {
                    const startButton = createElement('button', { textContent: t('tournament.playMatch'), className: 'px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm' });
                    startButton.addEventListener('click', () => createLocalMatch(match.player1, match.player2, true));
                    li.append(matchInfo, startButton);
                    hasPlayableMatch = true;
                } else {
                    li.append(matchInfo, createElement('span', { className: 'text-gray-500 italic', textContent: t('tournament.waiting') }));
                }
                list.appendChild(li);
            }
            roundEl.appendChild(list);
            contentWrapper.appendChild(roundEl);
        }
    }

    render();
    return pageWrapper;
}