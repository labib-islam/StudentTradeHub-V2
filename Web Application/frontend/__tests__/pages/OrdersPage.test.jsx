import { render, screen, waitFor } from '@testing-library/react';
import OrdersPage from '@/app/orders/page';

const mockRouter = { push: jest.fn() };

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({ user: { _id: 'user1', firstName: 'John' } }),
}));

jest.mock('@/context/SearchContext', () => ({
    useSearch: () => ({
        searchTerm: '',
        selectedStatus: 'all',
        setSearchTerm: jest.fn(),
        setSelectedStatus: jest.fn()
    }),
}));

jest.mock('@/components/UserRoute', () => {
    return function UserRoute({ children }) {
        return <div>{children}</div>;
    };
});

jest.mock('@/libs/utlis', () => ({
    fetchOrders: jest.fn(),
}));

const { fetchOrders } = require('@/libs/utlis');

describe('OrdersPage', () => {
    const mockOrders = [
        {
            _id: 'order1',
            product: { name: 'Product 1', price: 50, imageUrl: 'test.jpg' },
            fulfillmentStatus: 'pending',
            amount: 50,
            quantity: 1,
            createdAt: '2025-01-01',
            seller: { firstName: 'Jane', lastName: 'Smith' }
        },
        {
            _id: 'order2',
            product: { name: 'Product 2', price: 100, imageUrl: 'test2.jpg' },
            fulfillmentStatus: 'delivered',
            amount: 100,
            quantity: 2,
            createdAt: '2025-01-02',
            seller: { firstName: 'Bob', lastName: 'Jones' }
        }
    ];

    beforeEach(() => {
        fetchOrders.mockClear();
        mockRouter.push.mockClear();
    });

    it('should render orders page', async () => {
        fetchOrders.mockResolvedValue(mockOrders);

        render(<OrdersPage />);

        await waitFor(() => {
            expect(screen.getByText(/your orders/i)).toBeInTheDocument();
        });
    });

    it('should display list of orders', async () => {
        fetchOrders.mockResolvedValue(mockOrders);

        render(<OrdersPage />);

        await waitFor(() => {
            expect(screen.getByText('Product 1')).toBeInTheDocument();
            expect(screen.getByText('Product 2')).toBeInTheDocument();
        });
    });

    it('should show empty state when no orders', async () => {
        fetchOrders.mockResolvedValue([]);

        render(<OrdersPage />);

        await waitFor(() => {
            expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
        });
    });

    it('should show loading state', () => {
        fetchOrders.mockImplementation(() => new Promise(() => { }));

        render(<OrdersPage />);
        expect(screen.getByText(/loading your orders/i)).toBeInTheDocument();
    });
});
