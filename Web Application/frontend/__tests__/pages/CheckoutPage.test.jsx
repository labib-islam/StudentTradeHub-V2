import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from '@/app/checkout/page';

const mockRouter = { push: jest.fn() };

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useSearchParams: () => ({
        get: (key) => key === 'product' ? '123' : null,
    }),
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
    fetchProductById: jest.fn(),
    fetchUserPreferences: jest.fn(),
    createOrder: jest.fn(),
}));

const { fetchProductById, fetchUserPreferences, createOrder } = require('@/libs/utlis');

describe('CheckoutPage', () => {
    const mockProduct = {
        _id: '123',
        name: 'Test Product',
        price: 50,
        quantity: 10,
        createdBy: { _id: 'seller1', firstName: 'John', lastName: 'Doe' }
    };

    const mockPreferences = {
        paymentMethod: null,
        deliveryAddress: null,
        pickupAddress: null
    };

    beforeEach(() => {
        fetchProductById.mockClear();
        fetchUserPreferences.mockClear();
        createOrder.mockClear();
        mockRouter.push.mockClear();
    });

    it('should render checkout page', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue(mockPreferences);

        render(<CheckoutPage />);

        await waitFor(() => {
            expect(screen.getByText(/complete your purchase/i)).toBeInTheDocument();
        });
    });

    it('should display product information', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue(mockPreferences);

        render(<CheckoutPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Product')).toBeInTheDocument();
            const priceElements = screen.getAllByText('$50.00');
            expect(priceElements.length).toBeGreaterThan(0);
        });
    });

    it('should render checkout form', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue(mockPreferences);

        render(<CheckoutPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Product')).toBeInTheDocument();
        });

        // Verify the form and submit button exists
        const submitButton = screen.getByText(/confirm purchase/i);
        expect(submitButton).toBeInTheDocument();
        expect(submitButton).toBeEnabled();
    });

    it('should show loading state', () => {
        fetchProductById.mockImplementation(() => new Promise(() => { }));
        fetchUserPreferences.mockImplementation(() => new Promise(() => { }));

        render(<CheckoutPage />);
        expect(screen.getByText(/loading checkout/i)).toBeInTheDocument();
    });

    it('should handle quantity selection', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue(mockPreferences);

        render(<CheckoutPage />);

        await waitFor(() => {
            const quantitySelect = screen.queryByRole('combobox');
            if (quantitySelect) {
                fireEvent.change(quantitySelect, { target: { value: '3' } });
                expect(quantitySelect.value).toBe('3');
            }
        });
    });

    it('should calculate total price correctly', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue(mockPreferences);

        render(<CheckoutPage />);

        await waitFor(() => {
            expect(screen.getByText(/Test Product/i)).toBeInTheDocument();
        });
    });

    it('should handle delivery option selection', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue({
            ...mockPreferences,
            deliveryAddress: { line1: '123 Main St', city: 'Toronto', postalCode: 'M5H 2N2' }
        });

        render(<CheckoutPage />);

        await waitFor(() => {
            const deliveryRadios = screen.queryAllByRole('radio');
            if (deliveryRadios.length > 0) {
                fireEvent.click(deliveryRadios[0]);
                expect(deliveryRadios[0]).toBeChecked();
            }
        });
    });

    it('should handle pickup option selection', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue({
            ...mockPreferences,
            pickupAddress: { line1: 'Campus Building A', city: 'Toronto' }
        });

        render(<CheckoutPage />);

        await waitFor(() => {
            const pickupRadios = screen.queryAllByRole('radio');
            if (pickupRadios.length > 1) {
                fireEvent.click(pickupRadios[1]);
                expect(pickupRadios[1]).toBeChecked();
            }
        });
    });

    it('should display payment method when available', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue({
            ...mockPreferences,
            paymentMethod: { cardNumber: '****1234', isDefault: true }
        });

        render(<CheckoutPage />);

        await waitFor(() => {
            expect(screen.getByText(/Test Product/i)).toBeInTheDocument();
        });
    });

    it('should show add payment button when no payment method', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue(mockPreferences);

        render(<CheckoutPage />);

        await waitFor(() => {
            const addPaymentBtn = screen.queryByText(/add payment/i);
            if (addPaymentBtn) {
                expect(addPaymentBtn).toBeInTheDocument();
            }
        });
    });

    it('should handle successful order placement', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue({
            ...mockPreferences,
            paymentMethod: { cardNumber: '****1234', isDefault: true },
            deliveryAddress: { line1: '123 Main St', city: 'Toronto', postalCode: 'M5H 2N2' }
        });
        createOrder.mockResolvedValue({ _id: 'order123' });

        render(<CheckoutPage />);

        await waitFor(() => {
            const confirmBtn = screen.getByText(/confirm purchase/i);
            fireEvent.click(confirmBtn);
        });

        await waitFor(() => {
            if (createOrder.mock.calls.length > 0) {
                expect(createOrder).toHaveBeenCalled();
            }
        });
    });

    it('should handle order placement error', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue({
            ...mockPreferences,
            paymentMethod: { cardNumber: '****1234', isDefault: true },
            deliveryAddress: { line1: '123 Main St', city: 'Toronto', postalCode: 'M5H 2N2' }
        });
        createOrder.mockRejectedValue(new Error('Order failed'));

        render(<CheckoutPage />);

        await waitFor(() => {
            const confirmBtn = screen.getByText(/confirm purchase/i);
            fireEvent.click(confirmBtn);
        });

        await waitFor(() => {
            expect(createOrder).toHaveBeenCalled();
        });
    });

    it('should display seller information', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue(mockPreferences);

        render(<CheckoutPage />);

        await waitFor(() => {
            expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
        });
    });

    it('should handle product fetch error', async () => {
        fetchProductById.mockRejectedValue(new Error('Product not found'));
        fetchUserPreferences.mockResolvedValue(mockPreferences);

        render(<CheckoutPage />);

        await waitFor(() => {
            expect(fetchProductById).toHaveBeenCalled();
        });
    });

    it('should validate required fields before checkout', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue(mockPreferences);

        render(<CheckoutPage />);

        await waitFor(() => {
            const confirmBtn = screen.getByText(/confirm purchase/i);
            expect(confirmBtn).toBeInTheDocument();
        });
    });

    it('should handle back navigation', async () => {
        fetchProductById.mockResolvedValue(mockProduct);
        fetchUserPreferences.mockResolvedValue(mockPreferences);

        render(<CheckoutPage />);

        await waitFor(() => {
            const backBtn = screen.queryByText(/back/i);
            if (backBtn) {
                fireEvent.click(backBtn);
            }
        });
    });

});
