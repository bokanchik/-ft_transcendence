import { fetchUserDetails } from '../services/authService.js';
import { fetchMatchHistoryForUser } from '../services/authService.js';
import { t } from '../services/i18nService.js';

export interface MatchHistoryComponentProps {
	userId: number;
}

export async function MatchHistoryComponent(props: MatchHistoryComponentProps): Promise<HTMLElement> {
	const { userId: profiledUserId } = props;

	const el = document.createElement('div');
	el.className = 'p-4';
	// el.innerHTML = `<h3 class="text-xl font-semibold mb-4 text-gray-800">${t('match.history.title')}</h3>`;
	el.innerHTML = `<h3 class="text-xl font-semibold mb-4 text-white">${t('match.history.title')}</h3>`;

	const loadingMessage = document.createElement('p');
	// loadingMessage.className = 'text-gray-500 italic';
	loadingMessage.className = 'text-gray-300 italic';

	loadingMessage.textContent = t('match.history.loading');
	el.appendChild(loadingMessage);

	try {
		const matches = await fetchMatchHistoryForUser(profiledUserId);
		loadingMessage.remove();

		if (!matches || matches.length === 0) {
			// el.innerHTML += `<p class="text-gray-500">${t('match.history.noMatches')}</p>`;
			el.innerHTML += `<p class="text-gray-300">${t('match.history.noMatches')}</p>`;

			return el;
		}

		const opponentsDetailsCache: { [key: number]: { display_name: string } } = {};
		const list = document.createElement('ul');
		list.className = 'space-y-3';

		for (const match of matches) {
			let opponentId: number;
			let profiledUserScore: number;
			let opponentScore: number;
			let opponentDisplayName = t('match.history.unknownOpponent');

			if (match.player1_id === profiledUserId) {
				opponentId = match.player2_id;
				profiledUserScore = match.player1_score;
				opponentScore = match.player2_score;
			} else if (match.player2_id === profiledUserId) {
				opponentId = match.player1_id;
				profiledUserScore = match.player2_score;
				opponentScore = match.player1_score;
			} else {
				console.warn("Error while searching opponent:", match);
				continue;
			}

			if (!opponentsDetailsCache[opponentId]) {
				try {
					const opponentUser = await fetchUserDetails(opponentId);
					opponentsDetailsCache[opponentId] = { display_name: opponentUser?.display_name || `${t('match.details.player')} ${opponentId}` };
				} catch (e) {
					console.error(`${t('match.details.detailsError')} ${opponentId}`, e);
					opponentsDetailsCache[opponentId] = { display_name: `${t('match.details.player')} ${opponentId}` };
				}
			}
			opponentDisplayName = opponentsDetailsCache[opponentId].display_name;

			const resultText = match.winner_id === profiledUserId ? t('match.history.victory') : (match.winner_id ? t('match.history.defeat') : t('match.history.draw'));
			// const resultColor = match.winner_id === profiledUserId ? 'text-green-600' : (match.winner_id ? 'text-red-600' : 'text-gray-600');
			const resultColor = match.winner_id === profiledUserId ? 'text-green-400' : (match.winner_id ? 'text-red-400' : 'text-gray-300');


			const item = document.createElement('li');
			// item.className = 'p-3 bg-gray-100 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow';
			item.className = 'p-3 bg-black/20 border border-gray-500/30 rounded-lg hover:bg-black/30 transition-colors duration-200';
			// item.innerHTML = `
            //     <div class="flex justify-between items-center mb-1">
            //         <span class="font-medium text-gray-700">${t('match.history.opponent')} : ${opponentDisplayName}</span>
            //         <span class="font-semibold ${resultColor}">${resultText}</span>
            //     </div>
            //     <div class="text-sm text-gray-600">
            //         ${t('match.details.score')} : ${profiledUserScore} - ${opponentScore}
            //         <span class="mx-1">|</span>
            //         ${t('match.details.type')} : ${match.win_type}
            //         <span class="mx-1">|</span>
            //         ${t('match.details.date')} : ${new Date(match.created_at).toLocaleDateString()}
            //     </div>
            // `;
			item.innerHTML = `
			    <div class="flex justify-between items-center mb-1">
                    <span class="font-medium text-gray-100">${t('match.history.opponent')} : ${opponentDisplayName}</span>
                    <span class="font-semibold ${resultColor}">${resultText}</span>
                </div>
                <div class="text-sm text-gray-400">
                    ${t('match.details.score')} : ${profiledUserScore} - ${opponentScore}
                    <span class="mx-1">|</span>
                    ${t('match.details.type')} : ${match.win_type}
                    <span class="mx-1">|</span>
                    ${t('match.details.date')} : ${new Date(match.created_at).toLocaleDateString()}
                </div>
            `;
			list.appendChild(item);
		}
		el.appendChild(list);

	} catch (error) {
		console.error("Error while loading Match history.", error);
		loadingMessage.textContent = `${t('match.history.error')}: ${(error as Error).message}`;
		loadingMessage.classList.remove('text-gray-300', 'italic');
		loadingMessage.classList.add('text-red-400');
	}

	return el;
}
