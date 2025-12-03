import { render, screen, waitFor } from '@testing-library/react';
import ReviewPrompt from '@/components/ReviewPrompt';

jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

global.fetch = jest.fn();

const { useAuth } = require('@/context/AuthContext');

describe('ReviewPrompt Component', () => {
    beforeEach(() => {
        fetch.mockClear();
        useAuth.mockReturnValue({ user: null });
        Storage.prototype.getItem = jest.fn();
    });

    it('should render without crashing', () => {
        const { container } = render(<ReviewPrompt />);
        expect(container).toBeInTheDocument();
    });

    it('should not fetch reviews when user is not logged in', () => {
        useAuth.mockReturnValue({ user: null });
        render(<ReviewPrompt />);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch pending reviews when user is logged in', async () => {
        useAuth.mockReturnValue({ user: { _id: 'user1' } });
        Storage.prototype.getItem = jest.fn(() => 'test-token');
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ pendingOrders: [] }),
        });

        render(<ReviewPrompt />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8800/api/reviews/pending',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-token',
                    }),
                })
            );
        });
    });

    it('should handle fetch error gracefully', async () => {
        useAuth.mockReturnValue({ user: { _id: 'user1' } });
        Storage.prototype.getItem = jest.fn(() => 'test-token');
        fetch.mockRejectedValueOnce(new Error('Network error'));

        const { container } = render(<ReviewPrompt />);

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });
    });

    it('should not fetch reviews multiple times', async () => {
        useAuth.mockReturnValue({ user: { _id: 'user1' } });
        Storage.prototype.getItem = jest.fn(() => 'test-token');
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ pendingOrders: [] }),
        });

        const { rerender } = render(<ReviewPrompt />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        rerender(<ReviewPrompt />);

        // Should still be 1 call due to hasChecked flag
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle missing token', () => {
        useAuth.mockReturnValue({ user: { _id: 'user1' } });
        Storage.prototype.getItem = jest.fn(() => null);

        render(<ReviewPrompt />);

        expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle non-ok response', async () => {
        useAuth.mockReturnValue({ user: { _id: 'user1' } });
        Storage.prototype.getItem = jest.fn(() => 'test-token');
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
        });

        render(<ReviewPrompt />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalled();
        });
    });
});
