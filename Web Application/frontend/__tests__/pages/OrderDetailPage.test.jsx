import { render, screen, waitFor } from '@testing-library/react';
import OrderDetailPage from '@/app/orders/[id]/page';

const mockRouter = { push: jest.fn() };

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useParams: () => ({ id: 'order123' }),
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
    fetchOrderById: jest.fn(),
    updateOrderStatus: jest.fn(),
    addReview: jest.fn(),
}));

const { fetchOrderById } = require('@/libs/utlis');

describe('OrderDetailPage', () => {
    const mockOrder = {
        _id: 'order123',
        product: { name: 'Test Product', price: 50, imageUrl: 'test.jpg' },
        fulfillmentStatus: 'pending',
        amount: 50,
        quantity: 1,
        createdAt: '2025-01-01',
        seller: { firstName: 'Jane', lastName: 'Smith' },
        buyer: { firstName: 'John', lastName: 'Doe' },
    };

    beforeEach(() => {
        fetchOrderById.mockClear();
        mockRouter.push.mockClear();
    });

    it('should render order detail page', async () => {
        fetchOrderById.mockResolvedValue(mockOrder);

        render(<OrderDetailPage />);

        await waitFor(() => {
            expect(screen.getByText(/order details/i)).toBeInTheDocument();
        });
    });

    it('should display order information', async () => {
        fetchOrderById.mockResolvedValue(mockOrder);

        render(<OrderDetailPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Product')).toBeInTheDocument();
            expect(screen.getByText('$50.00')).toBeInTheDocument();
        });
    });

    it('should show loading state', () => {
        fetchOrderById.mockImplementation(() => new Promise(() => { }));

        render(<OrderDetailPage />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should handle fetch error', async () => {
        fetchOrderById.mockRejectedValue(new Error('Failed to fetch order'));

        render(<OrderDetailPage />);

        await waitFor(() => {
            expect(fetchOrderById).toHaveBeenCalled();
        });
    });

});
