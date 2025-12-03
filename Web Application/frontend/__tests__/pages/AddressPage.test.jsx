import { render, screen, waitFor } from '@testing-library/react';
import AddressPage from '@/app/address/page';

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({ user: { _id: 'user1' } }),
}));

jest.mock('@/components/UserRoute', () => {
    return function UserRoute({ children }) {
        return <div>{children}</div>;
    };
});

jest.mock('@/libs/utlis', () => ({
    fetchUserPreferences: jest.fn(),
    updateUserPreferences: jest.fn(),
}));

const { fetchUserPreferences } = require('@/libs/utlis');

describe('AddressPage', () => {
    beforeEach(() => {
        fetchUserPreferences.mockClear();
    });

    it('should render address page', async () => {
        fetchUserPreferences.mockResolvedValue({
            deliveryAddress: null,
            pickupAddress: null,
        });

        render(<AddressPage />);

        await waitFor(() => {
            expect(fetchUserPreferences).toHaveBeenCalled();
        });
    });

    it('should show loading state', () => {
        fetchUserPreferences.mockImplementation(() => new Promise(() => { }));

        render(<AddressPage />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display delivery address section', async () => {
        fetchUserPreferences.mockResolvedValue({
            deliveryAddress: { line1: '123 Main St', city: 'Toronto', postalCode: 'M1M 1M1' },
            pickupAddress: null,
        });

        render(<AddressPage />);

        await waitFor(() => {
            expect(screen.getByText(/delivery address/i)).toBeInTheDocument();
        });
    });

});
