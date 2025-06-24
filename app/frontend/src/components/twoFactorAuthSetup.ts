// app/frontend/src/components/twoFactorAuthSetup.ts
import { fetchWithCsrf } from '../services/csrf.js';

interface TwoFactorAuthSetupProps {
    qrCodeDataURL: string;
    onVerified: () => void;
    onCancel: () => void;
}

export function TwoFactorAuthSetup(props: TwoFactorAuthSetupProps): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">Set Up 2FA</h3>
        <p class="text-sm text-gray-600 mb-4">1. Scan this QR code with your authenticator app.</p>
        <div class="flex justify-center my-4">
            <img src="${props.qrCodeDataURL}" alt="2FA QR Code" class="border p-2 bg-white">
        </div>
        <p class="text-sm text-gray-600 mb-2">2. Enter the 6-digit code to verify.</p>
        <div class="flex items-center space-x-2">
            <input type="text" id="2fa-token-input" placeholder="123456" maxlength="6" class="p-2 border rounded-md w-full">
            <button id="verify-2fa-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Verify</button>
            <button id="cancel-2fa-btn" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancel</button>
        </div>
        <div id="2fa-verify-message" class="text-red-500 text-sm mt-2"></div>
    `;

    const tokenInput = container.querySelector<HTMLInputElement>('#2fa-token-input');
    const verifyBtn = container.querySelector<HTMLButtonElement>('#verify-2fa-btn');
    const cancelBtn = container.querySelector<HTMLButtonElement>('#cancel-2fa-btn');
    const messageDiv = container.querySelector<HTMLDivElement>('#2fa-verify-message');

    verifyBtn?.addEventListener('click', async () => {
        const token = tokenInput?.value.trim();
        if (!token || !/^\d{6}$/.test(token)) {
            if (messageDiv) messageDiv.textContent = 'Please enter a 6-digit code.';
            return;
        }

        try {
            const response = await fetchWithCsrf('/api/users/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Verification failed.');
            }
            props.onVerified();
        } catch (error: any) {
            if (messageDiv) messageDiv.textContent = error.message;
        }
    });

    cancelBtn?.addEventListener('click', props.onCancel);
    return container;
}