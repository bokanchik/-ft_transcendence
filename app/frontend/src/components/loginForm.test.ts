// src/components/loginForm.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/dom'; // On importe fireEvent
import userEvent from '@testing-library/user-event';
import { LoginForm } from './loginForm';
import { User, UserOnlineStatus } from '../shared/schemas/usersSchemas';

vi.mock('../services/i18nService.js', () => ({
    t: (key: string) => key,
}));

const onLoginAttemptMock = vi.fn();
const on2FAAttemptMock = vi.fn();
const onLoginSuccessMock = vi.fn();

const mockUser: User = {
    id: 1,
    username: 'testuser',
    display_name: 'Test User',
    email: 'test@example.com',
    avatar_url: null,
    wins: 10,
    losses: 5,
    status: UserOnlineStatus.ONLINE,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_two_fa_enabled: false,
};

describe('LoginForm', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    it('should render username and password fields initially', () => {
        const form = LoginForm({ onLoginAttempt: onLoginAttemptMock, on2FAAttempt: on2FAAttemptMock, onLoginSuccess: onLoginSuccessMock });
        document.body.appendChild(form);
        expect(screen.getByLabelText('login.identifierLabel')).toBeInTheDocument();
        expect(screen.getByLabelText('login.passwordLabel')).toBeInTheDocument();
    });

    // --- On va modifier tous les tests qui soumettent le formulaire ---

    it('should call onLoginSuccess when login is successful without 2FA', async () => {
        onLoginAttemptMock.mockResolvedValue({ success: true, data: { user: mockUser } });
        const formComponent = LoginForm({ onLoginAttempt: onLoginAttemptMock, on2FAAttempt: on2FAAttemptMock, onLoginSuccess: onLoginSuccessMock });
        document.body.appendChild(formComponent);
        const formElement = formComponent.querySelector('form')!;

        // On utilise fireEvent.submit directement sur l'élément du formulaire
        await fireEvent.submit(formElement);

        // On attend que les promesses soient résolues
        await vi.dynamicImportSettled();

        expect(onLoginAttemptMock).toHaveBeenCalled();
        expect(onLoginSuccessMock).toHaveBeenCalledWith(mockUser);
        expect(on2FAAttemptMock).not.toHaveBeenCalled();
    });

    it('should NOT call onLoginSuccess when 2FA is required', async () => {
        onLoginAttemptMock.mockResolvedValue({ success: true, data: { two_fa_required: true } });
        const formComponent = LoginForm({ onLoginAttempt: onLoginAttemptMock, on2FAAttempt: on2FAAttemptMock, onLoginSuccess: onLoginSuccessMock });
        document.body.appendChild(formComponent);
        const formElement = formComponent.querySelector('form')!;
        
        await fireEvent.submit(formElement);
        await vi.dynamicImportSettled();

        expect(onLoginAttemptMock).toHaveBeenCalled();
        expect(onLoginSuccessMock).not.toHaveBeenCalled();
    });

    it('should NOT call onLoginSuccess on failed login', async () => {
        onLoginAttemptMock.mockResolvedValue({ success: false, error: 'Invalid credentials' });
        const formComponent = LoginForm({ onLoginAttempt: onLoginAttemptMock, on2FAAttempt: on2FAAttemptMock, onLoginSuccess: onLoginSuccessMock });
        document.body.appendChild(formComponent);
        const formElement = formComponent.querySelector('form')!;
        
        await fireEvent.submit(formElement);
        await vi.dynamicImportSettled();

        expect(onLoginAttemptMock).toHaveBeenCalled();
        expect(onLoginSuccessMock).not.toHaveBeenCalled();
    });

    // On garde un test avec userEvent pour la saisie de texte, car c'est important.
    it('should call onLoginAttempt with correct credentials', async () => {
        onLoginAttemptMock.mockResolvedValue({ success: true, data: { user: mockUser } });
        const formComponent = LoginForm({ onLoginAttempt: onLoginAttemptMock, on2FAAttempt: on2FAAttemptMock, onLoginSuccess: onLoginSuccessMock });
        document.body.appendChild(formComponent);
        const formElement = formComponent.querySelector('form')!;

        await userEvent.type(screen.getByLabelText('login.identifierLabel'), 'testuser');
        await userEvent.type(screen.getByLabelText('login.passwordLabel'), 'password123');
        
        await fireEvent.submit(formElement);

        expect(onLoginAttemptMock).toHaveBeenCalledWith({
            identifier: 'testuser',
            password: 'password123',
        });
    });
});