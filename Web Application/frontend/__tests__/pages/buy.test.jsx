import { render, screen, waitFor } from '@testing-library/react';
import BuyPage from '@/app/buy/page';

// Mock UserRoute
jest.mock('@/components/UserRoute', () => {
    return function MockUserRoute({ children }) {
        return <div>{children}</div>;
    };
});

// Mock ProductCard
jest.mock('@/components/ProductCard', () => {
    return function MockProductCard({ product }) {
        return <div data-testid={`product-${product._id}`}>{product.name}</div>;
    };
});

// Mock SearchContext
jest.mock('@/context/SearchContext', () => ({
    useSearch: () => ({
        searchTerm: '',
        selectedCategory: 'all',
        selectedCondition: 'all',
    }),
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

const { useAuth } = require('@/context/AuthContext');

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(() => 'test-token'),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Buy Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Page Rendering', () => {
        it('renders buy page header', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: [] }),
            });

            render(<BuyPage />);

            expect(screen.getByText('Find quality items from trusted classmates')).toBeInTheDocument();
            expect(screen.getByText(/Browse textbooks, tech, furniture/)).toBeInTheDocument();
        });

        it('displays student marketplace label', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: [] }),
            });

            render(<BuyPage />);

            expect(screen.getByText('Student marketplace')).toBeInTheDocument();
        });

        it('shows list an item button', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: [] }),
            });

            render(<BuyPage />);

            const listButton = screen.getByText('List an item');
            expect(listButton).toBeInTheDocument();
            expect(listButton.closest('a')).toHaveAttribute('href', '/sell');
        });
    });

    describe('Loading State', () => {
        it('shows loading spinner while fetching products', () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockImplementation(() => new Promise(() => { })); // Never resolves

            render(<BuyPage />);

            expect(screen.getByText('Loading products...')).toBeInTheDocument();
        });

        it('shows loading spinner with animation', () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockImplementation(() => new Promise(() => { }));

            render(<BuyPage />);

            const spinner = screen.getByText('Loading products...').previousSibling;
            expect(spinner).toHaveClass('animate-spin');
        });
    });

    describe('Products Display', () => {
        it('fetches and displays products', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            const mockProducts = [
                { _id: '1', name: 'Laptop', createdBy: { _id: 'seller-1' } },
                { _id: '2', name: 'Book', createdBy: { _id: 'seller-2' } },
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: mockProducts }),
            });

            render(<BuyPage />);

            await waitFor(() => {
                expect(screen.getByTestId('product-1')).toBeInTheDocument();
                expect(screen.getByTestId('product-2')).toBeInTheDocument();
            });

            expect(screen.getByText('Laptop')).toBeInTheDocument();
            expect(screen.getByText('Book')).toBeInTheDocument();
        });

        it('displays correct product count', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            const mockProducts = [
                { _id: '1', name: 'Laptop', createdBy: { _id: 'seller-1' } },
                { _id: '2', name: 'Book', createdBy: { _id: 'seller-2' } },
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: mockProducts }),
            });

            render(<BuyPage />);

            await waitFor(() => {
                expect(screen.getByText('Showing 2 products')).toBeInTheDocument();
            });
        });

        it('shows singular product when count is 1', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            const mockProducts = [{ _id: '1', name: 'Laptop', createdBy: { _id: 'seller-1' } }];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: mockProducts }),
            });

            render(<BuyPage />);

            await waitFor(() => {
                expect(screen.getByText('Showing 1 product')).toBeInTheDocument();
            });
        });

        it('filters out products created by current user', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            const mockProducts = [
                { _id: '1', name: 'My Product', createdBy: { _id: 'user-123' } },
                { _id: '2', name: 'Other Product', createdBy: { _id: 'seller-2' } },
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: mockProducts }),
            });

            render(<BuyPage />);

            await waitFor(() => {
                expect(screen.queryByText('My Product')).not.toBeInTheDocument();
                expect(screen.getByText('Other Product')).toBeInTheDocument();
            });
        });

        it('filters out products when createdBy is string ID', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            const mockProducts = [
                { _id: '1', name: 'My Product', createdBy: 'user-123' },
                { _id: '2', name: 'Other Product', createdBy: 'seller-2' },
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: mockProducts }),
            });

            render(<BuyPage />);

            await waitFor(() => {
                expect(screen.queryByText('My Product')).not.toBeInTheDocument();
            });
        });
    });

    describe('Empty State', () => {
        it('shows empty state when no products', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: [] }),
            });

            render(<BuyPage />);

            await waitFor(() => {
                expect(screen.getByText('No products found')).toBeInTheDocument();
            });

            expect(screen.getByText(/Try adjusting your search or filters/)).toBeInTheDocument();
        });

        it('shows empty state icon', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: [] }),
            });

            render(<BuyPage />);

            await waitFor(() => {
                expect(screen.getByText('No products found')).toBeInTheDocument();
            });

            const emptyIcon = screen.getByText('No products found').parentElement.querySelector('svg');
            expect(emptyIcon).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('displays error message when fetch fails', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockResolvedValueOnce({
                ok: false,
            });

            render(<BuyPage />);

            await waitFor(() => {
                expect(screen.getByText('⚠ Error loading products')).toBeInTheDocument();
            });

            expect(screen.getByText('Failed to fetch products')).toBeInTheDocument();
        });

        it('displays error with red styling', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockResolvedValueOnce({
                ok: false,
            });

            render(<BuyPage />);

            await waitFor(() => {
                const errorBox = screen.getByText('⚠ Error loading products').parentElement;
                expect(errorBox).toHaveClass('bg-red-50', 'border-red-500');
            });
        });

        it('handles network errors', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockRejectedValueOnce(new Error('Network error'));

            render(<BuyPage />);

            await waitFor(() => {
                expect(screen.getByText('Network error')).toBeInTheDocument();
            });
        });
    });

    describe('API Integration', () => {
        it('includes authorization token in request', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: [] }),
            });

            render(<BuyPage />);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    expect.stringContaining('http://localhost:8800/api/products/'),
                    expect.objectContaining({
                        headers: { Authorization: 'Bearer test-token' },
                    })
                );
            });
        });

        it('filters by active status', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: [] }),
            });

            render(<BuyPage />);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    expect.stringContaining('status=active'),
                    expect.any(Object)
                );
            });
        });

        it('handles products array directly', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            const mockProducts = [{ _id: '1', name: 'Product', createdBy: 'seller-1' }];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockProducts, // Direct array without products wrapper
            });

            render(<BuyPage />);

            await waitFor(() => {
                expect(screen.getByText('Showing 0 products')).toBeInTheDocument();
            });
        });
    });

    describe('Responsive Design', () => {
        it('renders product grid layout', async () => {
            useAuth.mockReturnValue({ user: { _id: 'user-123' } });
            const mockProducts = [
                { _id: '1', name: 'Product 1', createdBy: 'seller-1' },
                { _id: '2', name: 'Product 2', createdBy: 'seller-2' },
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ products: mockProducts }),
            });

            render(<BuyPage />);

            await waitFor(() => {
                const grid = screen.getByTestId('product-1').parentElement;
                expect(grid).toHaveClass('grid');
            });
        });
    });
});
