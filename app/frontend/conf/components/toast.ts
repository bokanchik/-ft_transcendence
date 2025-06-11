export function showToast(message: string, type: 'success' | 'error' = 'success') {
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.textContent = message;

    const successBgClass = 'bg-green-400'; // Ou bg-teal-400, bg-emerald-400
    const errorBgClass = 'bg-red-500';

    toast.className = `custom-toast fixed top-6 left-6 transform z-[1000] px-6 py-3 
                       rounded-lg shadow-lg text-white font-medium transition-all duration-300 ease-in-out
                       ${type === 'success' ? successBgClass : errorBgClass}`;
    
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0.8';
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
        overlay.className = `custom-confirm-overlay fixed inset-0 
                             flex items-center justify-center z-[999] p-4 
                             transition-opacity duration-200 ease-out`;
        overlay.style.backdropFilter = 'blur(2px)'; // flou

        overlay.style.opacity = '0';

        // Dialog Box 
        const dialog = document.createElement('div');
        dialog.className = 'bg-white rounded-lg shadow-xl w-full max-w-sm transform transition-all duration-200 ease-out';
        dialog.style.opacity = '0';
        dialog.style.transform = 'scale(0.95)';

        // Title 
        const titleElement = document.createElement('h3');
        titleElement.className = 'text-lg font-semibold text-gray-800 px-6 py-4 border-b border-gray-200';
        titleElement.textContent = title;

        // Message
        const messageElement = document.createElement('p');
        messageElement.className = 'text-gray-600 px-6 py-5 text-sm';
        messageElement.textContent = message;

        // Buttons Container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'px-6 py-3 bg-gray-50 rounded-b-lg flex justify-end space-x-3';

        // Confirm Button
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Yes';
        confirmButton.className = 'px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2';
        
        // Cancel Button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'No';
        cancelButton.className = 'px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2';

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

export function showWaitingToast(socket: SocketIOClient.Socket, controller: AbortController) {
    const existingToast = document.querySelector('.custom-waiting-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div') as HTMLElement;
     toast.className = `custom-waiting-toast fixed bottom-6 right-6 z-[1000]
                       bg-white text-gray-800 shadow-lg rounded-full w-48 h-48 p-4 
                       flex flex-col items-center justify-center gap-4
                       transition-all duration-300 ease-in-out border border-gray-300`;

     // Spinner container
    const spinnerContainer = document.createElement('div');
    spinnerContainer.className = 'relative w-16 h-16';

    // Spinner ring (outer border)
    const spinner = document.createElement('div');
    spinner.className = `absolute inset-0 rounded-full border-4 
                         border-green-500 border-t-transparent animate-spin`;

    // Message
    const message = document.createElement('p');
    message.textContent = 'Looking for an opponent...';
    message.className = 'text-center text-sm font-medium';

    // Timer
    const timer = document.createElement('div');
    timer.textContent = '60';
    timer.className = 'absolute inset-0 flex items-center justify-center text-lg font-bold text-green-700';
    
    spinnerContainer.appendChild(spinner);
    spinnerContainer.appendChild(timer);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = `bg-red-600 hover:bg-red-700 text-white 
                           font-medium py-1 px-4 rounded`;
                           
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
    let secondsLeft = 60;
    const countdown = setInterval(() => {
        secondsLeft--;
        timer.textContent = `${secondsLeft}`;
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
