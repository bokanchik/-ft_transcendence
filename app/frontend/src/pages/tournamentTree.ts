import { createLocalMatch } from "../services/initLocalGame.js";
import { cleanupSocket } from "../services/initOnlineGame.js";
import { createElement } from "../utils/domUtils.js";
import { t } from '../services/i18nService.js'
import { HeaderComponent } from '../components/headerComponent.js';
import { navigateTo } from '../services/router.js';
import { getUserDataFromStorage } from '../services/authService.js';
import socket from "../services/socket.js";
import { fetchUserPublicDetails } from '../services/authService.js';
import { UserPublic } from '../shared/schemas/usersSchemas.js';
import { createActionButton } from "../utils/domUtils.js";
import { initCountdown } from "../components/countdown.js";

type TournamentStateData = {
    rounds: Rounds;
    isFinished: boolean;
    winner_id?: number;
    totalRounds: number;
};

type Match = {
	id: string;
	player1: string;
	player2: string;
	winner: string | null;
	player1_id?: number;
	player2_id?: number;
	winner_id?: number | null;
	ready_players?: number[];
};

type Rounds = {
	[round: number]: Match[];
};

type TournamentData = {
	pairs: { player1: string, player2: string }[];
	results: (number | null)[];
	round: number;
};

export function TournamentPage(params?: { id?: string }): HTMLElement {
	if (params?.id) {
		return OnlineTournamentPage(params.id);
	} else {
		return LocalTournamentPage();
	}
}

function LocalTournamentPage(): HTMLElement {
	const currentUser = getUserDataFromStorage();
	if (!currentUser) { navigateTo('/login'); return createElement('div'); }

	const title = createElement('h2', { className: 'flex-shrink-0 text-3xl font-bold mb-6 text-center text-gray-300 font-beach', textContent: t('tournament.title') });

	const contentWrapper = createElement('div', { className: 'w-full flex-grow overflow-y-auto min-h-0 pr-4 -mr-4 space-y-6' });

	const tournamentContentContainer = createElement('div', {
		className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 items-center rounded-2xl shadow-2xl p-8 flex flex-col max-h-[85vh] w-full max-w-2xl'
	}, [title, contentWrapper]);

	const pageWrapper = createElement('div', { className: 'flex flex-col h-screen bg-cover bg-center bg-fixed' }, [
		HeaderComponent({ currentUser }),
		createElement('div', { className: 'flex-grow flex items-center justify-center p-4 sm:p-8' }, [tournamentContentContainer])
	]);

	const rawData = sessionStorage.getItem('tournamentData');
	if (!rawData) {
		tournamentContentContainer.innerHTML = `<div class="text-center text-red-500 text-lg">Aucune donnée de tournoi disponible.</div>`;
		return pageWrapper;
	}

	let data: TournamentData;
	try {
		data = JSON.parse(rawData);
		if (!data.pairs) throw new Error("Invalid tournament data structure.");
		if (!data.results) data.results = new Array(data.pairs.length * 2 - 1).fill(null);
	} catch (err) {
		tournamentContentContainer.innerHTML = `<div class="text-center text-red-500 text-lg">Erreur de parsing des données du tournoi.</div>`;
		return pageWrapper;
	}

	function buildTournamentStructure(tournamentData: TournamentData) {
		const rounds: Rounds = {};
		const initialPlayers = tournamentData.pairs.flatMap(pair => [pair.player1, pair.player2]);
		const playerCount = initialPlayers.length;
		const totalRounds = Math.ceil(Math.log2(playerCount));

		rounds[1] = tournamentData.pairs.map((pair, index) => ({
			id: `R1-${index}`,
			player1: pair.player1,
			player2: pair.player2,
			winner: getMatchWinner(pair.player1, pair.player2, tournamentData.results[index])
		}));

		let resultIndex = tournamentData.pairs.length;

		for (let roundNum = 2; roundNum <= totalRounds; roundNum++) {
			const previousRoundMatches = rounds[roundNum - 1];

			const allPreviousMatchesFinished = previousRoundMatches.every(match => match.winner !== null);
			if (!allPreviousMatchesFinished) {
				break;
			}

			const winners = previousRoundMatches.map(match => match.winner!);
			const nextRoundMatches: Match[] = [];
			for (let i = 0; i < winners.length; i += 2) {
				const player1 = winners[i];
				const player2 = winners[i + 1] || 'BYE';
				const matchResult = tournamentData.results[resultIndex];

				nextRoundMatches.push({
					id: `R${roundNum}-${i / 2}`,
					player1,
					player2,
					winner: player2 === 'BYE' ? player1 : getMatchWinner(player1, player2, matchResult)
				});
				if (player2 !== 'BYE') resultIndex++;
			}
			rounds[roundNum] = nextRoundMatches;
		}

		let activeRound = 1;
		for (let i = 1; i <= totalRounds; i++) {
			if (!rounds[i] || rounds[i].some(m => m.winner === null)) {
				activeRound = i;
				break;
			}
			if (i === totalRounds) activeRound = totalRounds + 1; // Tournoi fini
		}

		return { rounds, currentRound: activeRound, totalRounds };
	}

	function getMatchWinner(player1: string, player2: string, result: number | null): string | null {
		if (result === 0) return player1;
		if (result === 1) return player2;
		return null;
	}

	function renderLocalTournament() {
		const { rounds, currentRound, totalRounds } = buildTournamentStructure(data);
		contentWrapper.innerHTML = '';

		const finalRound = rounds[totalRounds];
		const tournamentWinner = (finalRound && finalRound.length === 1 && finalRound[0].winner) ? finalRound[0].winner : null;

		const sortedRounds = Object.entries(rounds).sort((a, b) => Number(a[0]) - Number(b[0]));
		for (const [roundNumStr, matches] of sortedRounds) {
			const roundNum = Number(roundNumStr);
			const isCurrentRound = roundNum === currentRound;

			const roundEl = createElement('div', { className: 'bg-blue-100/5 shadow-lg rounded-lg p-4 border border-blue-200/10' });

			const headerText = matches.length === 1 && roundNum === totalRounds ? t('tournament.finale') : `${t('tournament.round')} ${roundNumStr}`;
			const header = createElement('h2', { textContent: headerText, className: 'text-xl font-semibold font-beach mb-3 text-blue-300' });

			roundEl.appendChild(header);
			const list = createElement('ul', { className: 'space-y-2' });

			let hasPlayableMatch = false;
			for (const match of matches) {
				const li = createElement('li', { className: 'bg-black/20 p-3 rounded-md flex justify-between items-center' });

				const p1Class = match.winner === match.player1 ? 'font-bold text-green-400' : match.player1 === currentUser?.display_name ? 'font-bold text-blue-400' : 'font-medium text-gray-200';
				const p2Class = match.winner === match.player2 ? 'font-bold text-green-400' : match.player2 === currentUser?.display_name ? 'font-bold text-blue-400' : 'font-medium text-gray-200';

				const matchInfo = createElement('div', { className: 'flex items-center gap-3' }, [
					createElement('span', { textContent: match.player1, className: `font-beach text-xl ${p1Class}` }),
					createElement('span', { textContent: 'vs', className: 'text-gray-400 text-3xl font-jurassic' }),
					createElement('span', { textContent: match.player2, className: `font-beach text-xl ${p2Class}` }),
				]);

				if (match.winner) {
					li.append(matchInfo, createElement('span', { className: 'text-green-600 font-semibold text-xl font-beach', textContent: `${t('tournament.winnerShort')}: ${match.winner}` }));
				} else if (isCurrentRound && !hasPlayableMatch) {
					const startButton = createActionButton({
						text: t('tournament.playMatch'),
						variant: 'primary',
                        baseClass: 'bg-blue-700 hover:bg-blue-500 text-white border border-blue-600/50 text-lg font-beach font-thin py-1 px-2.5 rounded transition-all duration-200',
						onClick: () => createLocalMatch(match.player1, match.player2, true)
					});
					li.append(matchInfo, startButton);
					hasPlayableMatch = true;
				} else {
					li.append(matchInfo, createElement('span', { className: 'text-gray-400 italic text-sm', textContent: t('tournament.waiting') }));
				}
				list.appendChild(li);
			}
			roundEl.appendChild(list);
			contentWrapper.appendChild(roundEl);
		}

		if (tournamentWinner) {
			const winnerBanner = createElement('div', {
				textContent: `${t('tournament.winnerIs')} ${tournamentWinner}`,
				className: 'mt-6 p-4 bg-teal-700 text-gray-300 text-2xl font-beach text-center rounded-lg animate-pulse'
			});
			const newTournamentLink = createElement('a', {
				href: '/local-game',
				textContent: t('link.backToGame'),
				className: 'block text-center mt-4 text-blue-400 hover:text-blue-300 text-xl transition-colors'
			});
			newTournamentLink.setAttribute('data-link', '');
			newTournamentLink.addEventListener('click', (e) => {
				e.preventDefault();
				sessionStorage.clear();
				navigateTo('/local-game');
			});
			contentWrapper.appendChild(winnerBanner);
			contentWrapper.appendChild(newTournamentLink);
		}
	}

	renderLocalTournament();
	return pageWrapper;
}

function OnlineTournamentPage(tournamentId: string): HTMLElement {
	const currentUser = getUserDataFromStorage();
	if (!currentUser) {
		navigateTo('/login');
		return createElement('div');
	}

	const pageWrapper = createElement('div', { className: 'flex flex-col h-screen bg-cover bg-center bg-fixed' });

	const title = createElement('h2', { className: 'flex-shrink-0 text-3xl font-bold mb-6 text-center text-gray-200 font-beach', textContent: t('tournament.titleOnline') });
	const bracketContainer = createElement('div', {
		id: `bracket-container-${tournamentId}`,
		className: 'w-full flex-grow overflow-y-auto min-h-0 pr-4 -mr-4'
	});
	const tournamentContentContainer = createElement('div', { className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 items-center rounded-2xl shadow-2xl p-8 flex flex-col max-h-[90vh] w-2/3' }, [
		title,
		bracketContainer
	]);

	pageWrapper.append(
		HeaderComponent({ currentUser }),
		createElement('div', { className: 'flex-grow flex items-center justify-center p-4 sm:p-8' }, [tournamentContentContainer])
	);

	if (!socket.connected) socket.connect();
	socket.removeAllListeners();

	const handleTournamentState = async (data: TournamentStateData) => {
		await renderOnlineBracket(data, bracketContainer, currentUser.id, tournamentId);
		if (data.isFinished && data.winner_id) {
			await displayTournamentWinner(data.winner_id, bracketContainer, tournamentContentContainer);
		}
	};

	socket.on('connect', () => {
		socket.emit('authenticate', { display_name: currentUser.display_name, userId: currentUser.id });
		socket.emit('joinTournamentRoom', { tournamentId });
	});
	if (socket.connected) {
		socket.emit('authenticate', { display_name: currentUser.display_name, userId: currentUser.id });
		socket.emit('joinTournamentRoom', { tournamentId });
	}

	socket.on('tournamentState', handleTournamentState);

	socket.on('startTournamentMatch', async ({ matchId, side, opponent }: { matchId: string, side: string, opponent: string }) => {
		sessionStorage.setItem('onlineTournamentId', tournamentId);
		sessionStorage.setItem('gameMode', 'onlineTournament');
		sessionStorage.setItem('matchId', matchId);
		sessionStorage.setItem('side', side);
		sessionStorage.setItem('opponent', opponent);
		sessionStorage.setItem('displayName', currentUser.display_name);

		const countdownContainer = createElement('div');
		countdownContainer.className = `
            fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50
            text-white text-7xl font-beach [text-shadow:_0_3px_6px_rgb(0_0_0_/_50%)]
        `;
		document.body.appendChild(countdownContainer);

		await initCountdown(countdownContainer);

		navigateTo(`/game-room?matchId=${matchId}`);
	});

	return pageWrapper;
}

const userDetailsCache: { [key: number]: Partial<UserPublic> } = {};
async function getPlayerDetails(playerId: number): Promise<Partial<UserPublic>> {
	if (userDetailsCache[playerId]) return userDetailsCache[playerId];
	try {
		const user = await fetchUserPublicDetails(playerId);
		userDetailsCache[playerId] = user;
		return user;
	} catch (error) {
		return { id: playerId, display_name: `Player ${playerId}` };
	}
}

async function renderOnlineBracket(data: TournamentStateData, container: HTMLElement, currentUserId: number, tournamentId: string) {
	const { rounds, totalRounds } = data;
    if (!rounds) {
		container.innerHTML = `<p class="text-white text-center">${t('general.loading')}</p>`;
		return;
	}

	const bracketContent = container.querySelector('.bracket-content') || createElement('div', { className: 'bracket-content space-y-6' });
	bracketContent.innerHTML = '';

	const sortedRounds = Object.entries(rounds).sort((a, b) => Number(a[0]) - Number(b[0]));

	for (const [roundNumStr, matches] of sortedRounds) {
        const roundNum = Number(roundNumStr);
		const roundEl = createElement('div', { className: 'bg-blue-100/5 shadow-lg rounded-lg p-4 border border-blue-200/10' });
		// const header = createElement('h2', { textContent: `${t('tournament.round')} ${roundNumStr}`, className: 'text-xl font-semibold font-beach mb-3 text-blue-300' });
        const isFinal = roundNum === totalRounds && matches.length === 1;
        const headerText = isFinal ? t('tournament.finale') : `${t('tournament.round')} ${roundNumStr}`;
		const header = createElement('h2', { textContent: headerText, className: 'text-xl font-semibold font-beach mb-3 text-blue-300' });

		roundEl.appendChild(header);

		const list = createElement('ul', { className: 'space-y-2' });
		for (const match of matches) {
			const li = createElement('li', { className: 'bg-black/20 p-3 rounded-md flex justify-between items-center' });

			const [p1Details, p2Details] = await Promise.all([
				match.player1_id ? getPlayerDetails(match.player1_id) : Promise.resolve({ display_name: t('tournament.tbd') }),
				match.player2_id ? getPlayerDetails(match.player2_id) : Promise.resolve({ display_name: t('tournament.tbd') })
			]);

			const winnerDetails = match.winner_id ? await getPlayerDetails(match.winner_id) : null;

			const p1Class = winnerDetails?.id === match.player1_id ? 'font-bold text-green-400' : match.player1_id === currentUserId ? 'font-bold text-blue-400' : 'font-medium text-gray-200';
			const p2Class = winnerDetails?.id === match.player2_id ? 'font-bold text-green-400' : match.player2_id === currentUserId ? 'font-bold text-blue-400' : 'font-medium text-gray-200';

			const matchInfo = createElement('div', { className: 'flex items-center gap-3' }, [
				createElement('span', { textContent: p1Details.display_name, className: `font-beach text-xl ${p1Class}` }),
				createElement('span', { textContent: 'vs', className: 'text-gray-400 text-3xl font-jurassic' }),
				createElement('span', { textContent: p2Details.display_name, className: `font-beach text-xl ${p2Class}` })
			]);

			const actionContainer = createElement('div', { className: 'flex items-center gap-2' });

			if (winnerDetails) {
				actionContainer.appendChild(createElement('span', { textContent: `${t('tournament.winnerShort')}: ${winnerDetails.display_name}`, className: 'text-green-500 font-beach text-xl' }));
			} else if (match.player1_id && match.player2_id) {
				const isPlayerInMatch = match.player1_id === currentUserId || match.player2_id === currentUserId;
				const isPlayerReady = (match.ready_players || []).includes(currentUserId);

				if (isPlayerInMatch && !isPlayerReady) {
					const readyButton = createActionButton({
						text: t('tournament.ready'),
						variant: 'primary',
                        baseClass: 'bg-blue-700 hover:bg-blue-500 text-white border border-blue-600/50 text-lg font-beach font-thin py-1 px-2.5 rounded transition-all duration-200',
						onClick: () => {
							socket.emit('playerReadyForTournamentMatch', { tournamentId, matchId: match.id });
						}
					});
					actionContainer.appendChild(readyButton);
				} else if (isPlayerInMatch && isPlayerReady) {
					actionContainer.appendChild(createElement('span', { textContent: t('tournament.waitingForOpponent'), className: 'text-yellow-400 italic text-base' }));
				} else {
					actionContainer.appendChild(createElement('span', { textContent: t('tournament.inProgress'), className: 'text-gray-400 italic text-base' }));
				}
			}
			li.append(matchInfo, actionContainer);
			list.appendChild(li);
		}
		roundEl.appendChild(list);
		bracketContent.appendChild(roundEl);
	}

	if (!container.contains(bracketContent)) {
		container.innerHTML = '';
		container.appendChild(bracketContent);
	}
}

async function displayTournamentWinner(winnerId: number, bracketContainer: HTMLElement, mainContainer: HTMLElement) {
	if (bracketContainer.querySelector('.tournament-winner-banner')) {
		return;
	}

	const winnerDetails = await getPlayerDetails(winnerId);

	const winnerBanner = createElement('div', {
		className: 'tournament-winner-banner mt-6 p-4 bg-teal-700 text-gray-300 text-2xl font-beach text-center rounded-lg animate-pulse'
	});
	winnerBanner.textContent = `${t('tournament.winnerIs')} ${winnerDetails.display_name}`;
	const backToGameLink = createElement('a', {
		href: '/game',
		textContent: t('link.backToGame'),
		className: 'block text-center mt-4 text-blue-400 hover:text-blue-300 text-lg transition-colors'
	});
	backToGameLink.setAttribute('data-link', '');
	backToGameLink.addEventListener('click', (e) => {
		e.preventDefault();
		sessionStorage.removeItem('onlineTournamentId');
		sessionStorage.removeItem('gameMode');
		cleanupSocket(socket);
		navigateTo('/game');
	});

	mainContainer.appendChild(winnerBanner);
	mainContainer.appendChild(backToGameLink);
}
