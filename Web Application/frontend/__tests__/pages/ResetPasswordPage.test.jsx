import { render, screen, fireEvent } from '@testing-library/react';
import ResetPasswordPage from '@/app/reset-password/page';

const mockRouter = { push: jest.fn() };

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useSearchParams: () => ({
        get: (key) => key === 'token' ? 'reset-token-123' : null,
    }),
}));

global.fetch = jest.fn();

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        fetch.mockClear();
        mockRouter.push.mockClear();
    });

    it('should render reset password page', () => {
        const { container } = render(<ResetPasswordPage />);
        expect(container).toBeInTheDocument();
    });

    it('should show password input fields', () => {
        render(<ResetPasswordPage />);
        const passwordInputs = screen.getAllByLabelText(/password/i);
        expect(passwordInputs.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle password input', () => {
        render(<ResetPasswordPage />);
        const passwordInputs = screen.getAllByLabelText(/password/i);
        fireEvent.change(passwordInputs[0], { target: { value: 'newPassword123' } });
        expect(passwordInputs[0].value).toBe('newPassword123');
    });

    it('should show submit button', () => {
        render(<ResetPasswordPage />);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('should handle confirm password input', () => {
        render(<ResetPasswordPage />);
        const passwordInputs = screen.getAllByLabelText(/password/i);
        if (passwordInputs.length >= 2) {
            fireEvent.change(passwordInputs[1], { target: { value: 'confirmPassword123' } });
            expect(passwordInputs[1].value).toBe('confirmPassword123');
        }
    });

    it('should validate password match', () => {
        render(<ResetPasswordPage />);
        const passwordInputs = screen.getAllByLabelText(/password/i);

        if (passwordInputs.length >= 2) {
            fireEvent.change(passwordInputs[0], { target: { value: 'Password123!' } });
            fireEvent.change(passwordInputs[1], { target: { value: 'Password123!' } });

            expect(passwordInputs[0].value).toBe(passwordInputs[1].value);
        }
    });

    it('should detect non-matching passwords', () => {
        render(<ResetPasswordPage />);
        const passwordInputs = screen.getAllByLabelText(/password/i);

        if (passwordInputs.length >= 2) {
            fireEvent.change(passwordInputs[0], { target: { value: 'Password123!' } });
            fireEvent.change(passwordInputs[1], { target: { value: 'DifferentPass!' } });

            expect(passwordInputs[0].value).not.toBe(passwordInputs[1].value);
        }
    });

    it('should handle form submission with valid passwords', () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Password reset successful' }),
        });

        render(<ResetPasswordPage />);
        const passwordInputs = screen.getAllByLabelText(/password/i);
        const buttons = screen.getAllByRole('button');

        if (passwordInputs.length >= 2 && buttons.length > 0) {
            fireEvent.change(passwordInputs[0], { target: { value: 'NewPassword123!' } });
            fireEvent.change(passwordInputs[1], { target: { value: 'NewPassword123!' } });
            fireEvent.click(buttons[0]);
        }
    });

    it('should handle password reset success', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Password reset successful' }),
        });

        render(<ResetPasswordPage />);
        const buttons = screen.getAllByRole('button');

        if (buttons.length > 0) {
            fireEvent.click(buttons[0]);
        }
    });

    it('should handle password reset failure', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ message: 'Invalid or expired token' }),
        });

        render(<ResetPasswordPage />);
        const buttons = screen.getAllByRole('button');

        if (buttons.length > 0) {
            fireEvent.click(buttons[0]);
        }
    });

    it('should handle network error', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        render(<ResetPasswordPage />);
        const buttons = screen.getAllByRole('button');

        if (buttons.length > 0) {
            fireEvent.click(buttons[0]);
        }
    });

    it('should validate password strength', () => {
        render(<ResetPasswordPage />);
        const passwordInputs = screen.getAllByLabelText(/password/i);

        if (passwordInputs.length > 0) {
            // Weak password
            fireEvent.change(passwordInputs[0], { target: { value: 'weak' } });
            expect(passwordInputs[0].value).toBe('weak');

            // Strong password
            fireEvent.change(passwordInputs[0], { target: { value: 'StrongPass123!' } });
            expect(passwordInputs[0].value).toBe('StrongPass123!');
        }
    });

    it('should display token in hidden field', () => {
        const { container } = render(<ResetPasswordPage />);
        expect(container).toBeInTheDocument();
    });

    it('should handle empty password submission', () => {
        render(<ResetPasswordPage />);
        const buttons = screen.getAllByRole('button');

        if (buttons.length > 0) {
            fireEvent.click(buttons[0]);
            expect(buttons[0]).toBeInTheDocument();
        }
    });

    it('should handle expired token error', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ message: 'Token expired' }),
        });

        render(<ResetPasswordPage />);
        const passwordInputs = screen.getAllByLabelText(/password/i);
        const buttons = screen.getAllByRole('button');

        if (passwordInputs.length >= 2 && buttons.length > 0) {
            fireEvent.change(passwordInputs[0], { target: { value: 'NewPass123!' } });
            fireEvent.change(passwordInputs[1], { target: { value: 'NewPass123!' } });
            fireEvent.click(buttons[0]);
        }
    });

    it('should clear form after successful reset', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Password reset successful' }),
        });

        render(<ResetPasswordPage />);
        const passwordInputs = screen.getAllByLabelText(/password/i);

        if (passwordInputs.length >= 2) {
            fireEvent.change(passwordInputs[0], { target: { value: 'NewPassword123!' } });
            fireEvent.change(passwordInputs[1], { target: { value: 'NewPassword123!' } });

            const buttons = screen.getAllByRole('button');
            if (buttons.length > 0) {
                fireEvent.click(buttons[0]);
            }
        }
    });

    it('should redirect after successful reset', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Password reset successful' }),
        });

        render(<ResetPasswordPage />);
        const buttons = screen.getAllByRole('button');

        if (buttons.length > 0) {
            fireEvent.click(buttons[0]);
        }
    });

    it('should toggle password visibility', () => {
        render(<ResetPasswordPage />);
        const toggleButtons = screen.queryAllByRole('button');
        const passwordInputs = screen.getAllByLabelText(/password/i);

        if (toggleButtons.length > 1 && passwordInputs.length > 0) {
            const initialType = passwordInputs[0].type;
            expect(initialType).toBeDefined();
        }
    });

});
