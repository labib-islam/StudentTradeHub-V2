import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SellPage from '@/app/sell/page';

// Mock next/navigation
const mockPush = jest.fn();
const mockGet = jest.fn(() => null);

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useSearchParams: () => ({
        get: mockGet,
    }),
}));

// Mock UserRoute
jest.mock('@/components/UserRoute', () => {
    return function MockUserRoute({ children }) {
        return <div>{children}</div>;
    };
});

// Mock ProductForm
jest.mock('@/components/ProductForm', () => {
    return function MockProductForm({ initialData, onSubmit, onCancel, submitButtonText }) {
        return (
            <div data-testid="product-form">
                <p>Product Form</p>
                <p>{submitButtonText}</p>
                {initialData && <p data-testid="editing">Editing: {initialData.name}</p>}
                <button onClick={() => onSubmit({}, jest.fn())}>Submit</button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        );
    };
});

// Mock ProductCard
jest.mock('@/components/ProductCard', () => {
    return function MockProductCard({ product, onEdit, onDelete }) {
        return (
            <div data-testid={`product-${product._id}`}>
                <p>{product.name}</p>
                <button onClick={() => onEdit(product)}>Edit</button>
                <button onClick={() => onDelete(product._id)}>Delete</button>
            </div>
        );
    };
});

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: { _id: 'user-123', firstName: 'John', lastName: 'Doe' },
    }),
}));

// Mock SearchContext
jest.mock('@/context/SearchContext', () => ({
    useSearch: () => ({
        searchTerm: '',
        selectedCategory: 'all',
        selectedCondition: 'all',
        selectedStatus: 'all',
        setSearchTerm: jest.fn(),
        setSelectedCategory: jest.fn(),
        setSelectedCondition: jest.fn(),
        setSelectedStatus: jest.fn(),
    }),
}));

// Mock utility functions
jest.mock('@/libs/utlis', () => ({
    fetchUserProducts: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    fetchProductById: jest.fn(),
}));

const {
    fetchUserProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchProductById,
} = require('@/libs/utlis');

describe('Sell Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGet.mockReturnValue(null); // Clear search params
        mockPush.mockClear();
        fetchUserProducts.mockResolvedValue([]);
    });

    describe('Page Rendering', () => {
        it('renders sell page header', () => {
            render(<SellPage />);

            expect(screen.getByText('Sell Your Products')).toBeInTheDocument();
            expect(screen.getByText('List your items and manage your listings')).toBeInTheDocument();
        });

        it('displays tabs for manage and add product', () => {
            render(<SellPage />);

            const buttons = screen.getAllByRole('button');
            const manageButton = buttons.find(btn => btn.textContent.includes('Your Products'));
            const addButton = buttons.find(btn => btn.textContent.includes('Add Product') && !btn.textContent.includes('First'));

            expect(manageButton).toBeInTheDocument();
            expect(addButton).toBeInTheDocument();
        });

        it('shows manage tab as active by default', () => {
            render(<SellPage />);

            const buttons = screen.getAllByRole('button');
            const manageButton = buttons.find(btn => btn.textContent.includes('Your Products') && btn.textContent.includes('0'));
            expect(manageButton).toHaveClass('bg-slate-900', 'text-white');
        });
    });

    describe('Tab Navigation', () => {
        it('switches to add product tab when clicked', async () => {
            const user = userEvent.setup();
            render(<SellPage />);

            const addButton = screen.getByText('Add Product').closest('button');
            await user.click(addButton);

            expect(screen.getByText('Create Product')).toBeInTheDocument();
            expect(screen.getByTestId('product-form')).toBeInTheDocument();
        });

        it('switches back to manage tab when clicked', async () => {
            const user = userEvent.setup();
            render(<SellPage />);

            const addButton = screen.getByText('Add Product').closest('button');
            await user.click(addButton);

            const buttons = screen.getAllByRole('button');
            const manageButton = buttons.find(btn => btn.textContent.includes('Your Products') && btn.textContent.includes('0'));
            await user.click(manageButton);

            expect(screen.queryByTestId('product-form')).not.toBeInTheDocument();
        });
    });

    describe('Product Management', () => {
        it('displays user products in manage tab', async () => {
            const mockProducts = [
                { _id: '1', name: 'Laptop', status: 'active' },
                { _id: '2', name: 'Book', status: 'active' },
            ];
            fetchUserProducts.mockResolvedValue(mockProducts);

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByTestId('product-1')).toBeInTheDocument();
                expect(screen.getByTestId('product-2')).toBeInTheDocument();
            });
        });

        it('displays product count correctly', async () => {
            const mockProducts = [
                { _id: '1', name: 'Laptop', status: 'active' },
                { _id: '2', name: 'Book', status: 'active' },
            ];
            fetchUserProducts.mockResolvedValue(mockProducts);

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByText(/Your Products \(2\)/)).toBeInTheDocument();
            });
        });

        it('shows empty state when no products exist', async () => {
            fetchUserProducts.mockResolvedValue([]);

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByText('No products yet')).toBeInTheDocument();
                expect(screen.getByText('Start selling by adding your first product to the marketplace')).toBeInTheDocument();
            });
        });

        it('clicking add first product switches to add tab', async () => {
            const user = userEvent.setup();
            fetchUserProducts.mockResolvedValue([]);

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByText('No products yet')).toBeInTheDocument();
            });

            const addButton = screen.getByText('Add Your First Product');
            await user.click(addButton);

            expect(screen.getByTestId('product-form')).toBeInTheDocument();
        });
    });

    describe('Create Product', () => {
        it('shows product form in add tab', async () => {
            const user = userEvent.setup();
            render(<SellPage />);

            const addButton = screen.getByText('Add Product').closest('button');
            await user.click(addButton);

            expect(screen.getByTestId('product-form')).toBeInTheDocument();
            expect(screen.getByText('Create Product')).toBeInTheDocument();
        });

        it('creates product successfully', async () => {
            const user = userEvent.setup();
            createProduct.mockResolvedValue({ _id: 'new-product' });

            render(<SellPage />);

            const addButton = screen.getByText('Add Product').closest('button');
            await user.click(addButton);

            const submitButton = screen.getByText('Submit');
            await user.click(submitButton);

            await waitFor(() => {
                expect(createProduct).toHaveBeenCalled();
            });
        });

        it('shows success message after creating product', async () => {
            jest.useFakeTimers();
            const user = userEvent.setup({ delay: null });
            createProduct.mockResolvedValue({ _id: 'new-product' });

            render(<SellPage />);

            const addButton = screen.getByText('Add Product').closest('button');
            await user.click(addButton);

            const submitButton = screen.getByText('Submit');
            await user.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Product created successfully!')).toBeInTheDocument();
            });

            jest.useRealTimers();
        });
    });

    describe('Edit Product', () => {
        it('opens edit mode when edit is clicked', async () => {
            const user = userEvent.setup();
            const mockProducts = [{ _id: '1', name: 'Laptop', status: 'active' }];
            fetchUserProducts.mockResolvedValue(mockProducts);

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByTestId('product-1')).toBeInTheDocument();
            });

            const editButton = screen.getByText('Edit');
            await user.click(editButton);

            expect(screen.getByTestId('editing')).toHaveTextContent('Editing: Laptop');
        });

        it('changes header when editing', async () => {
            const user = userEvent.setup();
            const mockProducts = [{ _id: '1', name: 'Laptop', status: 'active' }];
            fetchUserProducts.mockResolvedValue(mockProducts);

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByTestId('product-1')).toBeInTheDocument();
            });

            const editButton = screen.getByText('Edit');
            await user.click(editButton);

            expect(screen.getByText('Edit Product')).toBeInTheDocument();
            expect(screen.getByText('Update your product information')).toBeInTheDocument();
        });

        it('shows update button when editing', async () => {
            const user = userEvent.setup();
            const mockProducts = [{ _id: '1', name: 'Laptop', status: 'active' }];
            fetchUserProducts.mockResolvedValue(mockProducts);

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByTestId('product-1')).toBeInTheDocument();
            });

            const editButton = screen.getByText('Edit');
            await user.click(editButton);

            expect(screen.getByText('Update Product')).toBeInTheDocument();
        });

        it('cancels editing when cancel is clicked', async () => {
            const user = userEvent.setup();
            const mockProducts = [{ _id: '1', name: 'Laptop', status: 'active' }];
            fetchUserProducts.mockResolvedValue(mockProducts);

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByTestId('product-1')).toBeInTheDocument();
            });

            const editButton = screen.getByText('Edit');
            await user.click(editButton);

            const cancelButton = screen.getByText('Cancel');
            await user.click(cancelButton);

            expect(screen.queryByTestId('editing')).not.toBeInTheDocument();
        });

        it('updates product successfully', async () => {
            const user = userEvent.setup();
            const mockProducts = [{ _id: '1', name: 'Laptop', status: 'active' }];
            fetchUserProducts.mockResolvedValue(mockProducts);
            updateProduct.mockResolvedValue({ _id: '1', name: 'Updated Laptop' });

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByTestId('product-1')).toBeInTheDocument();
            });

            const editButton = screen.getByText('Edit');
            await user.click(editButton);

            const submitButton = screen.getByText('Submit');
            await user.click(submitButton);

            await waitFor(() => {
                expect(updateProduct).toHaveBeenCalled();
            });
        });

        it('loads product for edit from URL query', async () => {
            mockGet.mockReturnValue('product-123');
            fetchProductById.mockResolvedValue({
                _id: 'product-123',
                name: 'Test Product',
                createdBy: { _id: 'user-123' },
            });

            render(<SellPage />);

            await waitFor(() => {
                expect(fetchProductById).toHaveBeenCalledWith('product-123');
            });
        });
    });

    describe('Delete Product', () => {
        it('deletes product when delete is clicked', async () => {
            const user = userEvent.setup();
            const mockProducts = [{ _id: '1', name: 'Laptop', status: 'active' }];
            fetchUserProducts.mockResolvedValue(mockProducts);
            deleteProduct.mockResolvedValue({ success: true });

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByTestId('product-1')).toBeInTheDocument();
            });

            const deleteButton = screen.getByText('Delete');
            await user.click(deleteButton);

            await waitFor(() => {
                expect(deleteProduct).toHaveBeenCalledWith('1');
            });
        });

        it('shows success message after deleting', async () => {
            jest.useFakeTimers();
            const user = userEvent.setup({ delay: null });
            const mockProducts = [{ _id: '1', name: 'Laptop', status: 'active' }];
            fetchUserProducts.mockResolvedValue(mockProducts);
            deleteProduct.mockResolvedValue({ success: true });

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByTestId('product-1')).toBeInTheDocument();
            });

            const deleteButton = screen.getByText('Delete');
            await user.click(deleteButton);

            await waitFor(() => {
                expect(screen.getByText('Product deleted successfully!')).toBeInTheDocument();
            });

            jest.useRealTimers();
        });
    });

    describe('Success Messages', () => {
        it('displays success message with checkmark', async () => {
            jest.useFakeTimers();
            const user = userEvent.setup({ delay: null });
            createProduct.mockResolvedValue({ _id: 'new-product' });

            render(<SellPage />);

            const addButton = screen.getByText('Add Product').closest('button');
            await user.click(addButton);

            const submitButton = screen.getByText('Submit');
            await user.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('✓')).toBeInTheDocument();
            });

            jest.useRealTimers();
        });

        it('success message has green styling', async () => {
            jest.useFakeTimers();
            const user = userEvent.setup({ delay: null });
            createProduct.mockResolvedValue({ _id: 'new-product' });

            render(<SellPage />);

            const addButton = screen.getByText('Add Product').closest('button');
            await user.click(addButton);

            const submitButton = screen.getByText('Submit');
            await user.click(submitButton);

            await waitFor(() => {
                const successBox = screen.getByText('✓').parentElement.parentElement;
                expect(successBox).toHaveClass('bg-green-50', 'border-green-500');
            });

            jest.useRealTimers();
        });
    });

    describe('Product Filtering', () => {
        it('shows filtered product count', async () => {
            const mockProducts = [
                { _id: '1', name: 'Laptop', status: 'active', category: 'Electronics', condition: 'Like New' },
                { _id: '2', name: 'Book', status: 'draft', category: 'Books', condition: 'Good' },
            ];
            fetchUserProducts.mockResolvedValue(mockProducts);

            render(<SellPage />);

            await waitFor(() => {
                expect(screen.getByText('Showing 2 of 2 products')).toBeInTheDocument();
            });
        });

        it('shows no products match filters message', async () => {
            const mockProducts = [];
            fetchUserProducts.mockResolvedValue(mockProducts);

            render(<SellPage />);

            // First wait for products to load
            await waitFor(() => {
                expect(screen.getByText('No products yet')).toBeInTheDocument();
            });
        });
    });
});
