import { render, screen } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';

const mockRouter = { push: jest.fn() };

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();

describe('ProductCard Management Mode', () => {
    const mockProduct = {
        _id: '123',
        name: 'Test Product',
        price: 50,
        quantity: 5,
        status: 'active',
        condition: 'Like New',
        category: 'Electronics',
        imageUrl: 'test.jpg',
        createdBy: { _id: 'user1', firstName: 'John', lastName: 'Doe' },
    };

    beforeEach(() => {
        mockRouter.push.mockClear();
        mockOnEdit.mockClear();
        mockOnDelete.mockClear();
    });

    it('should render product information', () => {
        render(<ProductCard product={mockProduct} currentUserId="user1" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('$50.00')).toBeInTheDocument();
    });

    it('should display product status', () => {
        render(<ProductCard product={mockProduct} currentUserId="user1" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
        expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    it('should display product quantity', () => {
        render(<ProductCard product={mockProduct} currentUserId="user1" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
        expect(screen.getByText(/Qty: 5/i)).toBeInTheDocument();
    });

    it('should show edit button for owner', () => {
        render(<ProductCard product={mockProduct} currentUserId="user1" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
        expect(screen.getByText(/edit/i)).toBeInTheDocument();
    });

    it('should show delete button for owner', () => {
        render(<ProductCard product={mockProduct} currentUserId="user1" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
        expect(screen.getByText(/delete/i)).toBeInTheDocument();
    });

    it('should display product image', () => {
        render(<ProductCard product={mockProduct} currentUserId="user1" onEdit={mockOnEdit} onDelete={mockOnDelete} />);
        const image = screen.getByAltText('Test Product');
        expect(image).toBeInTheDocument();
    });
});
