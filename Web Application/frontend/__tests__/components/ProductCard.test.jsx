import { render, screen } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';

const mockRouter = { push: jest.fn() };
jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

describe('ProductCard Component', () => {
    const mockProduct = {
        _id: '123',
        name: 'Test Product',
        price: 50,
        condition: 'Like New',
        category: 'Electronics',
        quantity: 5,
        status: 'active',
        imageUrl: 'test.jpg',
        description: 'Test description',
        createdBy: { _id: 'seller1', firstName: 'John', lastName: 'Doe' }
    };

    beforeEach(() => {
        mockRouter.push.mockClear();
    });

    it('should render product name', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should render product price', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText('$50.00')).toBeInTheDocument();
    });

    it('should display product image', () => {
        render(<ProductCard product={mockProduct} />);
        const image = screen.getByAltText('Test Product');
        expect(image).toBeInTheDocument();
    });

    it('should show condition badge', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText('Like New')).toBeInTheDocument();
    });

    it('should display seller name', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should show quantity', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText('Qty: 5')).toBeInTheDocument();
    });

    it('should show View Details button for available products', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('should show Out of Stock for zero quantity', () => {
        const outOfStockProduct = { ...mockProduct, quantity: 0 };
        render(<ProductCard product={outOfStockProduct} />);
        const outOfStockElements = screen.getAllByText('Out of Stock');
        expect(outOfStockElements.length).toBeGreaterThan(0);
    });
});
