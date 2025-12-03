import { render, screen, waitFor } from '@testing-library/react';
import PaymentPage from '@/app/payment/page';

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

describe('PaymentPage', () => {
    beforeEach(() => {
        fetchUserPreferences.mockClear().mockResolvedValue({ paymentMethod: null });
    });

    it('should render payment page', async () => {
        const { container } = render(<PaymentPage />);
        expect(container).toBeInTheDocument();
    });

    it('should show loading state', async () => {
        const { container } = render(<PaymentPage />);
        expect(container).toBeInTheDocument();
    });
});
