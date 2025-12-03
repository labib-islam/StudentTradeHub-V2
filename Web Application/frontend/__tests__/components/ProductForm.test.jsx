import { render, screen, fireEvent } from '@testing-library/react';
import ProductForm from '@/components/ProductForm';

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

describe('ProductForm Component', () => {
    beforeEach(() => {
        mockOnSubmit.mockClear();
        mockOnCancel.mockClear();
    });

    it('should render product form', () => {
        render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
        expect(screen.getByText(/name/i)).toBeInTheDocument();
    });

    it('should render form inputs', () => {
        render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThan(0);
    });

    it('should handle input changes', () => {
        render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
        const inputs = screen.getAllByRole('textbox');
        fireEvent.change(inputs[0], { target: { name: 'name', value: 'Test Product' } });
        expect(inputs[0].value).toBe('Test Product');
    });

    it('should show submit button', () => {
        render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} submitButtonText="Create Product" />);
        expect(screen.getByText(/create product/i)).toBeInTheDocument();
    });

    it('should render with initial product data', () => {
        const product = { name: 'Existing Product', price: 100 };
        render(<ProductForm initialData={product} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
        expect(screen.getByDisplayValue('Existing Product')).toBeInTheDocument();
    });
});
