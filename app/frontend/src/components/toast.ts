import { t } from '../services/i18nService.js';
import { createElement } from '../utils/domUtils.js';
import socket, { tournamentSocket } from '../services/socket.js';
import { cleanupSocket } from '../services/initOnlineGame.js';

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
	const existingToast = document.querySelector('.custom-toast');
	if (existingToast) {
		existingToast.remove();
	}

	let toastClasses = '';
	switch (type) {
		case 'error':
			toastClasses = 'bg-red-900/80 border-red-700/50';
			break;
		case 'info':
			toastClasses = 'bg-blue-700/80 border-blue-500/50';
			break;
		case 'success':
		default:
			toastClasses = 'bg-teal-800/80 border-teal-600/50';
			break;
	}

	const toast = createElement('div', {
		textContent: message,
		className: `custom-toast fixed top-5 left-5 transform z-[1000] px-6 py-3 rounded-xl shadow-2xl text-white font-semibold transition-all duration-300 ease-in-out backdrop-blur-md border ${toastClasses}`
	});

	toast.style.opacity = '0';
	toast.style.transform = 'translateX(-20px)';

	document.body.appendChild(toast);

	setTimeout(() => {
		toast.style.opacity = '1';
		toast.style.transform = 'translateX(0)';
	}, 10);

	setTimeout(() => {
		toast.style.opacity = '0';
		toast.style.transform = 'translateX(-20px)';
		setTimeout(() => toast.remove(), 300);
	}, 3000);
}


export function showCustomConfirm(message: string, title: string = "Confirmation"): Promise<boolean> {
	return new Promise((resolve) => {
		const existingDialog = document.querySelector('.custom-confirm-overlay');
		if (existingDialog) {
			existingDialog.remove();
		}

		const confirmButton = createElement('button', {
			textContent: t('general.yes'),
			className: 'px-4 py-2 rounded-md text-sm font-medium text-white bg-red-800 hover:bg-red-600 border border-red-700/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors'
		});

		const cancelButton = createElement('button', {
			textContent: t('general.no'),
			className: 'px-4 py-2 rounded-md text-sm font-medium text-gray-200 bg-white/10 hover:bg-white/20 border border-white/20 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors'
		});

		const dialog = createElement('div', {
			className: 'bg-gray-900/70 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-200 ease-out'
		}, [
			createElement('h3', { textContent: title, className: 'text-lg font-semibold text-white px-6 py-4 border-b border-gray-500/30' }),
			createElement('p', { textContent: message, className: 'text-gray-300 px-6 py-5' }),
			createElement('div', { className: 'px-6 py-3 bg-black/20 rounded-b-2xl flex justify-end space-x-3' }, [
				cancelButton,
				confirmButton
			])
		]);
		dialog.style.opacity = '0';
		dialog.style.transform = 'scale(0.95)';

		const overlay = createElement('div', {
			className: 'custom-confirm-overlay fixed inset-0 flex items-center justify-center z-[999] p-4 bg-black/50 transition-opacity duration-200 ease-out'
		}, [dialog]);
		overlay.style.backdropFilter = 'blur(4px)';
		overlay.style.opacity = '0';

		const closeDialog = (value: boolean) => {
			overlay.style.opacity = '0';
			dialog.style.transform = 'scale(0.95)';
			setTimeout(() => {
				overlay.remove();
				resolve(value);
				window.removeEventListener('keydown', handleEscKey);
			}, 200);
		};

		confirmButton.onclick = () => closeDialog(true);
		cancelButton.onclick = () => closeDialog(false);

		const handleEscKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				closeDialog(false);
			}
		};
		window.addEventListener('keydown', handleEscKey);

		document.body.appendChild(overlay);

		requestAnimationFrame(() => {
			overlay.style.opacity = '1';
			dialog.style.opacity = '1';
			dialog.style.transform = 'scale(1)';
		});
	});
}

export function showWaitingToast(socket: SocketIOClient.Socket, controller: AbortController, timeLeft: number, initialMessage: string) {
	const existingToast = document.querySelector('.custom-waiting-toast');
	if (existingToast) {
		const messageEl = existingToast.querySelector('p');
		if (messageEl) messageEl.textContent = initialMessage;
		return;
	}

	const timer = createElement('div', { textContent: formatTime(timeLeft), className: 'absolute inset-0 flex items-center justify-center text-lg font-bold text-green-300' });
	const spinnerContainer = createElement('div', { className: 'relative w-16 h-16' }, [
		createElement('div', { className: 'absolute inset-0 rounded-full border-4 border-green-400 border-t-transparent animate-spin' }),
		timer
	]);
	const message = createElement('p', { textContent: initialMessage, className: 'text-center text-sm font-medium text-gray-300' });
	const cancelBtn = createElement('button', { textContent: t('general.cancel'), className: 'bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-4 rounded-lg border border-red-500/50 transition-colors' });

	const toast = createElement('div', {
		className: 'custom-waiting-toast fixed bottom-6 right-6 z-[1000] bg-gray-900/60 backdrop-blur-lg text-white shadow-2xl rounded-full w-48 h-48 p-4 flex flex-col items-center justify-center gap-4 transition-all duration-300 ease-in-out border border-gray-400/30'
	}, [spinnerContainer, message, cancelBtn]);

	toast.style.opacity = '0';
	toast.style.transform = 'translateY(20px)';
	document.body.appendChild(toast);

	setTimeout(() => {
		toast.style.opacity = '1';
		toast.style.transform = 'translateY(0)';
	}, 10);

	const countdown = setInterval(() => {
		timeLeft--;
		timer.textContent = formatTime(timeLeft);
		if (timeLeft <= 0) clearInterval(countdown);
	}, 1000);

	cancelBtn.addEventListener('click', () => {
		clearInterval(countdown);
		controller.abort();
		socket.emit('cancelMatch');
		cancelAllSearches();
	});
}

export function removeWaitingToast(instant: boolean = false) {
    const toast = document.querySelector('.custom-waiting-toast');
    if (instant && toast instanceof HTMLElement) {
        toast.remove();
        console.log("Waiting toast removed immediately.");
    } else if (toast instanceof HTMLElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }
}

function sendLeaveEvent(socketInstance: SocketIOClient.Socket, eventName: string) {
    if (socketInstance.connected) {
        socketInstance.emit(eventName);
        cleanupSocket(socketInstance);
        return;
    }
}

export function cancelAllSearches(instant: boolean = false) {
	console.log("Cancelling all game search.");
	removeWaitingToast(instant);
	sendLeaveEvent(socket, 'leaveQueue');
    sendLeaveEvent(tournamentSocket, 'leaveTournamentQueue');
	// cleanupSocket(socket);
	// cleanupSocket(tournamentSocket);
	sessionStorage.removeItem('gameMode');
    sessionStorage.removeItem('onlineTournamentId');
    sessionStorage.removeItem('matchId');
}

function formatTime(timeLeft: number): string {
	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	const paddedMinutes = String(minutes).padStart(2, '0');
	const paddedSeconds = String(seconds).padStart(2, '0');
	return `${paddedMinutes}:${paddedSeconds}`;
}
