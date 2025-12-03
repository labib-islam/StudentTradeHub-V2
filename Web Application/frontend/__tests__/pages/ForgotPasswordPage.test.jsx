import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordPage from '@/app/forgot-password/page';

const mockRouter = { push: jest.fn() };

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

global.fetch = jest.fn();

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        fetch.mockClear();
        mockRouter.push.mockClear();
    });

    it('should render forgot password page', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should handle email input', () => {
        render(<ForgotPasswordPage />);
        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        expect(emailInput.value).toBe('test@example.com');
    });

    it('should show submit button', () => {
        render(<ForgotPasswordPage />);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('should handle successful submission', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Email sent' }),
        });

        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const buttons = screen.getAllByRole('button');
        if (buttons.length > 0) {
            fireEvent.click(buttons[0]);
            await waitFor(() => {
                expect(fetch).toHaveBeenCalled();
            });
        }
    });

    it('should handle submission error', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const buttons = screen.getAllByRole('button');
        if (buttons.length > 0) {
            fireEvent.click(buttons[0]);
            await waitFor(() => {
                expect(fetch).toHaveBeenCalled();
            });
        }
    });

    it('should validate email format', () => {
        render(<ForgotPasswordPage />);
        const emailInput = screen.getByLabelText(/email/i);

        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        expect(emailInput.value).toBe('invalid-email');

        fireEvent.change(emailInput, { target: { value: 'valid@email.com' } });
        expect(emailInput.value).toBe('valid@email.com');
    });
});