import { fetchUserPublicDetails } from '../services/authService.js';
import { fetchMatchHistoryForUser } from '../services/authService.js';
import { t } from '../services/i18nService.js';
import { createElement } from '../utils/domUtils.js';
import { formatTimeAgo, formatFullDate } from '../utils/format.js';
import { MatchHistoryComponentProps } from '../shared/schemas/matchesSchemas.js';

const opponentsDetailsCache: { [key: number]: { display_name: string; avatar_url: string | null } } = {};

export async function MatchHistoryComponent(props: MatchHistoryComponentProps): Promise<HTMLElement> {
	const { userId: profiledUserId } = props;

	const el = createElement('div');

	const loadingMessage = createElement('p', { textContent: t('match.history.loading'), className: 'text-gray-300 italic' });
	el.appendChild(loadingMessage);

	try {
		const matches = await fetchMatchHistoryForUser(profiledUserId);
		loadingMessage.remove();

		if (!matches || matches.length === 0) {
			const noMatchesMsg = createElement('p', { textContent: t('match.history.noMatches'), className: 'text-gray-300' });
			el.appendChild(noMatchesMsg);
			return el;
		}

		const list = createElement('ul', { className: 'space-y-3' });

		for (const match of matches) {
			let opponentId: number;
			let profiledUserScore: number;
			let opponentScore: number;

			if (match.player1_id === profiledUserId) {
				opponentId = match.player2_id;
				profiledUserScore = match.player1_score;
				opponentScore = match.player2_score;
			} else {
				opponentId = match.player1_id;
				profiledUserScore = match.player2_score;
				opponentScore = match.player1_score;
			}

			if (!opponentsDetailsCache[opponentId]) {
				try {
					const opponentUser = await fetchUserPublicDetails(opponentId);
					opponentsDetailsCache[opponentId] = {
						display_name: opponentUser?.display_name || `${t('match.details.player')} ${opponentId}`,
						avatar_url: opponentUser?.avatar_url || null
					};
				} catch (e) {
					opponentsDetailsCache[opponentId] = {
						display_name: `${t('match.details.player')} ${opponentId}`,
						avatar_url: null
					};
				}
			}
			const { display_name: opponentDisplayName, avatar_url: opponentAvatarUrl } = opponentsDetailsCache[opponentId];
			const initials = opponentDisplayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
			const avatarSrc = opponentAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=e2e8f0&color=111827&size=96&bold=true`;

			const isWin = match.winner_id === profiledUserId;
			const isDraw = !match.winner_id;
			const resultText = isWin ? t('match.history.victory') : (isDraw ? t('match.history.draw') : t('match.history.defeat'));
			const resultColorClass = isWin ? 'text-green-400' : (isDraw ? 'text-gray-400' : 'text-red-500');
			let backgroundClass = 'bg-[#111827]';
			if (isWin) backgroundClass = 'bg-green-900/30 hover:bg-green-800/40';
			else if (!isDraw) backgroundClass = 'bg-red-900/30 hover:bg-red-800/40';

			const dateFromDb = new Date(match.created_at + 'Z');
			const formattedTime = formatTimeAgo(dateFromDb);
			const fullDate = formatFullDate(dateFromDb);

			// 1. VS + Avatar
			const vsSpan = createElement('span', { textContent: 'VS', className: `text-5xl font-jurassic ${resultColorClass}` });
			const opponentAvatar = createElement('img', { src: avatarSrc, alt: opponentDisplayName, className: 'h-16 w-16 rounded-full object-cover' });
			const leftBlock = createElement('div', { className: 'flex items-center gap-5 flex-shrink-0' }, [vsSpan, opponentAvatar]);

			// 2. Bloc central
			const opponentNameSpan = createElement('span', { textContent: opponentDisplayName, className: 'text-lg text-gray-300 font-beach' });
			const opponentNameBlock = createElement('div', { className: 'text-left' }, [opponentNameSpan]);

			const resultTextSpan = createElement('span', { textContent: resultText.toUpperCase(), className: `text-5xl font-jurassic tracking-wide ${resultColorClass}` });
			const resultTextBlock = createElement('div', { className: 'text-center' }, [resultTextSpan]);

			const userScoreSpan = createElement('span', { textContent: profiledUserScore.toString(), className: `${isWin ? 'text-white' : 'text-gray-400'}` });
			const separatorSpan = createElement('span', { textContent: '/', className: 'mx-3 text-gray-600' });
			const opponentScoreSpan = createElement('span', { textContent: opponentScore.toString(), className: `${!isWin && !isDraw ? 'text-white' : 'text-gray-400'}` });
			const scoreBlock = createElement('div', { className: 'flex justify-end items-baseline text-3xl font-roar font-light' }, [userScoreSpan, separatorSpan, opponentScoreSpan]);

			const centerBlock = createElement('div', { className: 'flex-grow flex justify-between items-center px-4' }, [opponentNameBlock, resultTextBlock, scoreBlock]);

			// 3. Date / Type
			const timeAgoSpan = createElement('span', { textContent: formattedTime, title: fullDate, className: 'text-sm text-gray-400' });

			let matchTypeIcon: HTMLImageElement;
			if (match.tournament_id) {
				matchTypeIcon = createElement('img', {
                    src: '/assets/tournoi.png',
                    alt: t('match.type.tournament'),
                    title: t('match.type.tournament'),
                    className: 'w-8 h-8'
                });
			} else {
				matchTypeIcon = createElement('img', {
                    src: '/assets/quick.png',
                    alt: t('match.type.quickMatch'),
                    title: t('match.type.quickMatch'),
                    className: 'w-8 h-8'
                });
			}
			
			const rightBlock = createElement('div', { 
                className: 'flex flex-col justify-center items-end text-right w-28 flex-shrink-0 space-y-1' 
            }, [timeAgoSpan, matchTypeIcon]);

			const item = createElement('li', { className: `h-24 border border-gray-700/50 rounded-lg flex items-center p-4 gap-4 transition-colors duration-200 ${backgroundClass}` }, [
				leftBlock,
				centerBlock,
				rightBlock
			]);

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