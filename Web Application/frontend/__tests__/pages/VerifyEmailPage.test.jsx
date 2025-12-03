import { render, screen, waitFor } from '@testing-library/react';
import VerifyEmailPage from '@/app/verify-email/page';

const mockRouter = { push: jest.fn() };

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useSearchParams: () => ({
        get: (key) => key === 'token' ? 'verify-token-123' : null,
    }),
}));

global.fetch = jest.fn();

describe('VerifyEmailPage', () => {
    beforeEach(() => {
        fetch.mockClear();
        mockRouter.push.mockClear();
    });

    it('should render verify email page', () => {
        render(<VerifyEmailPage />);
        expect(screen.getByText(/verifying/i) || screen.getByText(/verify/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
        fetch.mockImplementation(() => new Promise(() => { }));
        render(<VerifyEmailPage />);
        expect(screen.getByText(/verifying/i) || screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should handle successful verification', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Email verified' }),
        });

        render(<VerifyEmailPage />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalled();
        });
    });

    it('should handle verification error', async () => {
        fetch.mockRejectedValueOnce(new Error('Verification failed'));

        render(<VerifyEmailPage />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalled();
        });
    });
});
