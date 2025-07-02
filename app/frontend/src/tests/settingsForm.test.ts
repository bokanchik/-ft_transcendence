// src/components/settingsForm.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { SettingsForm } from '@/components/settingsForm';
import { User, UserOnlineStatus } from '@/shared/schemas/usersSchemas';
import { showToast } from '@/components/toast';
import { navigateTo } from '@/services/router';

vi.mock('@/components/toast.js', () => ({ showToast: vi.fn() }));
vi.mock('@/services/router.js', () => ({ navigateTo: vi.fn() }));
vi.mock('@/services/i18nService.js', () => ({
    t: (key: string) => key,
    getLanguage: () => 'en',
    setLanguage: vi.fn().mockResolvedValue(undefined),
}));

const mockUser: User = {
    id: 1, username: 'testuser', display_name: 'Test User', email: 'test@example.com',
    avatar_url: 'http://example.com/avatar.png', wins: 10, losses: 5, status: UserOnlineStatus.ONLINE,
    language: 'en', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    is_two_fa_enabled: false,
};

describe('SettingsForm', () => {
    const onProfileUpdateMock = vi.fn();
    const onGenerate2FAMock = vi.fn();
    const onVerifyAndEnable2FAMock = vi.fn();
    const onDisable2FAMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
        onProfileUpdateMock.mockResolvedValue({ success: true, data: { message: 'Updated', user: mockUser } });
        onGenerate2FAMock.mockResolvedValue({ qrCodeDataURL: 'data:image/png;base64,qrcode' });
        onVerifyAndEnable2FAMock.mockResolvedValue({ message: 'Enabled' });
        onDisable2FAMock.mockResolvedValue({ message: 'Disabled' });
    });

    it('should render the form with user data', () => {
        const form = SettingsForm({
            user: mockUser,
            onProfileUpdate: onProfileUpdateMock,
            onGenerate2FA: onGenerate2FAMock,
            onVerifyAndEnable2FA: onVerifyAndEnable2FAMock,
            onDisable2FA: onDisable2FAMock,
        });
        document.body.appendChild(form);

        expect(screen.getByLabelText('user.displayName')).toHaveValue('Test User');
        expect(screen.getByLabelText('user.email')).toHaveValue('test@example.com');
        expect(screen.getByLabelText('register.avatarUrl')).toHaveValue('http://example.com/avatar.png');
    });

    it('should call onProfileUpdate with changed data on submit', async () => {
        const form = SettingsForm({ user: mockUser, onProfileUpdate: onProfileUpdateMock, onGenerate2FA: onGenerate2FAMock, onVerifyAndEnable2FA: onVerifyAndEnable2FAMock, onDisable2FA: onDisable2FAMock });
        document.body.appendChild(form);

        const displayNameInput = screen.getByLabelText('user.displayName');
        await fireEvent.input(displayNameInput, { target: { value: 'New Name' } });
        
        const submitButton = screen.getByRole('button', { name: 'user.settings.button' });
        await fireEvent.click(submitButton);

        await waitFor(() => {
            expect(onProfileUpdateMock).toHaveBeenCalledWith({ display_name: 'New Name' });
            expect(showToast).toHaveBeenCalledWith('user.settings.success', 'success');
            expect(navigateTo).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('should enable 2FA', async () => {
        const form = SettingsForm({ user: mockUser, onProfileUpdate: onProfileUpdateMock, onGenerate2FA: onGenerate2FAMock, onVerifyAndEnable2FA: onVerifyAndEnable2FAMock, onDisable2FA: onDisable2FAMock });
        document.body.appendChild(form);

        const twoFaCheckbox = screen.getByLabelText('user.settings.enable2FA');
        await fireEvent.click(twoFaCheckbox);

        await waitFor(() => {
            expect(onGenerate2FAMock).toHaveBeenCalled();
            expect(screen.getByAltText('user.settings.qrCodeAlt')).toBeInTheDocument();
        });

        const tokenInput = screen.getByLabelText('user.settings.verificationCode');
        await fireEvent.input(tokenInput, { target: { value: '123456' } });

        const submitButton = screen.getByRole('button', { name: 'user.settings.button' });
        await fireEvent.click(submitButton);

        await waitFor(() => {
            expect(onVerifyAndEnable2FAMock).toHaveBeenCalledWith('123456');
        });
    });
});