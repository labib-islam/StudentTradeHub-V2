import { render, screen, waitFor } from '@testing-library/react';
import ProductDetailPage from '@/app/product/[pid]/page';

const mockRouter = { push: jest.fn() };
const mockParams = { pid: '123' };

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useParams: () => mockParams,
}));

jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({ user: { _id: 'user1' } }),
}));

jest.mock('@/components/UserRoute', () => {
    return function UserRoute({ children }) {
        return <div>{children}</div>;
    };
});

global.fetch = jest.fn();

describe('ProductDetailPage', () => {
    const mockProduct = {
        _id: '123',
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        condition: 'Like New',
        category: 'Electronics',
        quantity: 5,
        status: 'active',
        imageUrl: 'test.jpg',
        createdBy: { _id: 'seller1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }
    };

    beforeEach(() => {
        fetch.mockClear();
        mockRouter.push.mockClear();
    });

    it('should render product details', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ product: mockProduct }),
        });

        render(<ProductDetailPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Product')).toBeInTheDocument();
            expect(screen.getByText('Test description')).toBeInTheDocument();
            expect(screen.getByText('$100.00')).toBeInTheDocument();
        });
    });

    it('should show loading state', () => {
        fetch.mockImplementation(() => new Promise(() => { }));

        render(<ProductDetailPage />);
        expect(screen.getByText(/loading product/i)).toBeInTheDocument();
    });

    it('should handle fetch error', async () => {
        fetch.mockRejectedValueOnce(new Error('Failed to load product.'));

        render(<ProductDetailPage />);

        await waitFor(() => {
            expect(screen.getByText(/unable to load product/i)).toBeInTheDocument();
        });
    });

    it('should display seller information', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ product: mockProduct }),
        });

        render(<ProductDetailPage />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('john@test.com')).toBeInTheDocument();
        });
    });
});
