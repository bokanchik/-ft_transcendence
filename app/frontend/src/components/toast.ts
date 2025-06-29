import { time } from "console";
import { t } from '../services/i18nService.js'

export function showToast(message: string, type: 'success' | 'error' = 'success') {
	const existingToast = document.querySelector('.custom-toast');
	if (existingToast) {
		existingToast.remove();
	}

	const toast = document.createElement('div');
	toast.textContent = message;

	const successClasses = 'bg-green-600/80 border-green-400/50';
	const errorClasses = 'bg-red-600/80 border-red-500/50';
	toast.className = `custom-toast fixed top-5 left-1/2 -translate-x-1/2 transform z-[1000] px-6 py-3 rounded-xl shadow-2xl text-white font-semibold transition-all duration-300 ease-in-out backdrop-blur-md border ${type === 'success' ? successClasses : errorClasses}`;

	toast.style.opacity = '0';
	toast.style.transform = 'translateY(-20px)';

	document.body.appendChild(toast);

	setTimeout(() => {
		toast.style.opacity = '1';
		toast.style.transform = 'translateY(0)';
	}, 10);

	setTimeout(() => {
		toast.style.opacity = '0';
		toast.style.transform = 'translateY(-20px)';
		setTimeout(() => toast.remove(), 300);
	}, 3000);
}

export function showCustomConfirm(message: string, title: string = "Confirmation"): Promise<boolean> {
	return new Promise((resolve) => {
		const existingDialog = document.querySelector('.custom-confirm-overlay');
		if (existingDialog) {
			existingDialog.remove();
		}

		const overlay = document.createElement('div');
		overlay.className = 'custom-confirm-overlay fixed inset-0 flex items-center justify-center z-[999] p-4 bg-black/50 transition-opacity duration-200 ease-out';
		overlay.style.backdropFilter = 'blur(4px)';
		overlay.style.opacity = '0';

		// Dialog Box 
		const dialog = document.createElement('div');
		dialog.className = 'bg-gray-900/70 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-200 ease-out';
		dialog.style.opacity = '0';
		dialog.style.transform = 'scale(0.95)';

		// Title 
		const titleElement = document.createElement('h3');
		titleElement.className = 'text-lg font-semibold text-white px-6 py-4 border-b border-gray-500/30';
		titleElement.textContent = title;

		// Message
		const messageElement = document.createElement('p');
		messageElement.className = 'text-gray-300 px-6 py-5';
		messageElement.textContent = message;

		// Buttons Container
		const buttonsContainer = document.createElement('div');
		buttonsContainer.className = 'px-6 py-3 bg-black/20 rounded-b-2xl flex justify-end space-x-3';

		// Confirm Button
		const confirmButton = document.createElement('button');
		confirmButton.textContent = t('general.yes');
		confirmButton.className = 'px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors';

		// Cancel Button
		const cancelButton = document.createElement('button');
		cancelButton.textContent = t('general.no');
		cancelButton.className = 'px-4 py-2 rounded-md text-sm font-medium text-gray-200 bg-white/10 hover:bg-white/20 border border-white/20 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors';

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

		buttonsContainer.appendChild(cancelButton);
		buttonsContainer.appendChild(confirmButton);
		dialog.appendChild(titleElement);
		dialog.appendChild(messageElement);
		dialog.appendChild(buttonsContainer);
		overlay.appendChild(dialog);
		document.body.appendChild(overlay);

		requestAnimationFrame(() => {
			overlay.style.opacity = '1';
			dialog.style.opacity = '1';
			dialog.style.transform = 'scale(1)';
		});
	});
}

export function showWaitingToast(socket: SocketIOClient.Socket, controller: AbortController, timeLeft: number) {
	const existingToast = document.querySelector('.custom-waiting-toast');
	if (existingToast) {
		existingToast.remove();
	}

	const toast = document.createElement('div') as HTMLElement;
	// toast.className = `custom-waiting-toast fixed bottom-6 right-6 z-[1000]
	//                    bg-white text-gray-800 shadow-lg rounded-full w-48 h-48 p-4 
	//                    flex flex-col items-center justify-center gap-4
	//                    transition-all duration-300 ease-in-out border border-gray-300`;
	toast.className = `custom-waiting-toast fixed bottom-6 right-6 z-[1000]
                       bg-gray-900/60 backdrop-blur-lg text-white shadow-2xl rounded-full w-48 h-48 p-4 
                       flex flex-col items-center justify-center gap-4
                       transition-all duration-300 ease-in-out border border-gray-400/30`;

	// Spinner container
	const spinnerContainer = document.createElement('div');
	spinnerContainer.className = 'relative w-16 h-16';

	// Spinner ring (outer border)
	const spinner = document.createElement('div');
	// spinner.className = `absolute inset-0 rounded-full border-4 
	//                      border-green-500 border-t-transparent animate-spin`;
	spinner.className = 'absolute inset-0 rounded-full border-4 border-green-400 border-t-transparent animate-spin';

	// Message
	const message = document.createElement('p');
	message.textContent = t('game.waitOpponent');
	// message.className = 'text-center text-sm font-medium';
	message.className = 'text-center text-sm font-medium text-gray-300';


	// Timer
	const timer = document.createElement('div');
	timer.textContent = formatTime(timeLeft);
	// timer.className = 'absolute inset-0 flex items-center justify-center text-lg font-bold text-green-700';
	timer.className = 'absolute inset-0 flex items-center justify-center text-lg font-bold text-green-300';

	spinnerContainer.appendChild(spinner);
	spinnerContainer.appendChild(timer);

	// Cancel button
	const cancelBtn = document.createElement('button');
	cancelBtn.textContent = t('general.cancel');
	// cancelBtn.className = `bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-4 rounded`;
	cancelBtn.className = `bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-4 rounded-lg border border-red-500/50 transition-colors`;

	toast.appendChild(spinnerContainer);
	toast.appendChild(message);
	toast.appendChild(cancelBtn);
	document.body.appendChild(toast);

	// Animation d'apparition
	toast.style.opacity = '0';
	toast.style.transform = 'translateY(20px)';
	setTimeout(() => {
		toast.style.opacity = '1';
		toast.style.transform = 'translateY(0)';
	}, 10);

	// Timer countdown
	let secondsLeft = timeLeft;
	const countdown = setInterval(() => {
		secondsLeft--;
		timer.textContent = formatTime(secondsLeft);
		if (secondsLeft <= 0) {
			clearInterval(countdown);
		}
	}, 1000);

	// Cancel logic
	cancelBtn.addEventListener('click', () => {
		clearInterval(countdown);
		controller.abort();
		socket.emit('cancelMatch');
		socket.disconnect();
		removeWaitingToast();
	});
}


export function removeWaitingToast() {
	const toast = document.querySelector('.custom-waiting-toast');
	if (toast instanceof HTMLElement) {
		toast.style.opacity = '0';
		toast.style.transform = 'translateY(20px)';
		setTimeout(() => toast.remove(), 300);
	}
}

function formatTime(timeLeft: number): string {
	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	const paddedMinutes = String(minutes).padStart(2, '0');
	const paddedSeconds = String(seconds).padStart(2, '0');
	return `${paddedMinutes}:${paddedSeconds}`;
}
