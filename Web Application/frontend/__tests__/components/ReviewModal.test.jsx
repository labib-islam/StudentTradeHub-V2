import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewModal from '@/components/ReviewModal';

const mockOnClose = jest.fn();
const mockOnSubmit = jest.fn();
const mockOnSkip = jest.fn();

describe('ReviewModal Component', () => {
    const mockOrder = {
        _id: 'order123',
        product: {
            _id: 'product123',
            name: 'Test Product',
            imageUrl: '/test.jpg',
        },
    };

    beforeEach(() => {
        mockOnClose.mockClear();
        mockOnSubmit.mockClear();
        mockOnSkip.mockClear();
        jest.spyOn(window, 'alert').mockImplementation(() => { });
    });

    afterEach(() => {
        window.alert.mockRestore();
    });

    it('should render modal with order details', () => {
        render(<ReviewModal order={mockOrder} onClose={mockOnClose} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);
        expect(screen.getByText(/rate your experience/i)).toBeInTheDocument();
    });

    it('should display product name', () => {
        render(<ReviewModal order={mockOrder} onClose={mockOnClose} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);
        expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
        render(<ReviewModal order={mockOrder} onClose={mockOnClose} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

        const closeButton = screen.getByText('×');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle rating selection', () => {
        render(<ReviewModal order={mockOrder} onClose={mockOnClose} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

        const starButtons = screen.getAllByRole('button');
        const starButton = starButtons.find(btn => btn.className?.includes('text-4xl'));

        if (starButton) {
            fireEvent.click(starButton);
        }
    });

    it('should handle comment input', () => {
        render(<ReviewModal order={mockOrder} onClose={mockOnClose} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'Great product!' } });

        expect(textarea.value).toBe('Great product!');
    });

    it('should show alert when submitting without rating', () => {
        render(<ReviewModal order={mockOrder} onClose={mockOnClose} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

        const submitButton = screen.getByText(/submit review/i);
        fireEvent.click(submitButton);

        expect(window.alert).toHaveBeenCalledWith('Please select a rating');
    });

    it('should call onSkip when skip button is clicked', async () => {
        mockOnSkip.mockResolvedValue({});

        render(<ReviewModal order={mockOrder} onClose={mockOnClose} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

        const skipButton = screen.getByText(/skip/i);
        fireEvent.click(skipButton);

        await waitFor(() => {
            expect(mockOnSkip).toHaveBeenCalledWith('order123');
        });
    });

    it('should render without product image', () => {
        const orderWithoutImage = {
            ...mockOrder,
            product: {
                ...mockOrder.product,
                imageUrl: null,
            },
        };

        render(<ReviewModal order={orderWithoutImage} onClose={mockOnClose} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);
        expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
});
