// src/components/loginForm.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/loginForm';
import { User, UserOnlineStatus } from '@/shared/schemas/usersSchemas';

vi.mock('@/services/i18nService.js', () => ({
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
    created_at: '2024-01-01 12:00:00',
    updated_at: '2024-01-01 12:00:00',
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

    it('should call onLoginSuccess when login is successful without 2FA', async () => {
        onLoginAttemptMock.mockResolvedValue({ success: true, data: { user: mockUser } });
        const formComponent = LoginForm({ onLoginAttempt: onLoginAttemptMock, on2FAAttempt: on2FAAttemptMock, onLoginSuccess: onLoginSuccessMock });
        document.body.appendChild(formComponent);
        const formElement = formComponent.querySelector('form')!;

        await fireEvent.submit(formElement);
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