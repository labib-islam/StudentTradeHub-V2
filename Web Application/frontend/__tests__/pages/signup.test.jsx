import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUp from '@/app/signup/page';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('SignUp Component', () => {
    let mockPush;

    beforeEach(() => {
        mockPush = jest.fn();

        useRouter.mockReturnValue({
            push: mockPush,
        });

        useAuth.mockReturnValue({
            user: null,
            loading: false,
            signup: jest.fn(),
            checkAuth: jest.fn(),
        });

        fetch.mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders signup form with all fields', () => {
        render(<SignUp />);

        expect(screen.getByText('StudentTradeHub')).toBeInTheDocument();
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    test('shows error for invalid email format', async () => {
        render(<SignUp />);

        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);
        const emailInput = screen.getByLabelText(/^email$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        // Fill in all fields with invalid email
        await userEvent.type(firstNameInput, 'John');
        await userEvent.type(lastNameInput, 'Doe');
        await userEvent.type(emailInput, 'test@gmail.com');
        await userEvent.type(passwordInput, 'Password123!');
        await userEvent.type(confirmPasswordInput, 'Password123!');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/please enter a valid mun email address/i)).toBeInTheDocument();
        });
    });

    test('accepts valid MUN email address', async () => {
        render(<SignUp />);

        const emailInput = screen.getByLabelText(/^email$/i);

        await userEvent.type(emailInput, 'student@mun.ca');

        // Should not show error for valid MUN email
        expect(screen.queryByText(/please enter a valid @mun.ca email address/i)).not.toBeInTheDocument();
    });

    test('shows error when passwords do not match', async () => {
        render(<SignUp />);

        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);
        const emailInput = screen.getByLabelText(/^email$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        await userEvent.type(firstNameInput, 'John');
        await userEvent.type(lastNameInput, 'Doe');
        await userEvent.type(emailInput, 'john@mun.ca');
        await userEvent.type(passwordInput, 'Password123!');
        await userEvent.type(confirmPasswordInput, 'Password456!');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        });
    });

    test('shows password strength indicator', async () => {
        render(<SignUp />);

        const passwordInput = screen.getByLabelText(/^password$/i);

        // Type a weak password
        await userEvent.type(passwordInput, 'pass');

        await waitFor(() => {
            expect(screen.getByText(/password strength:/i)).toBeInTheDocument();
            expect(screen.getByText(/weak/i)).toBeInTheDocument();
        });
    });

    test('validates password complexity requirements', async () => {
        render(<SignUp />);

        const passwordInput = screen.getByLabelText(/^password$/i);

        await userEvent.type(passwordInput, 'Password123!');

        await waitFor(() => {
            // Check that all requirements are shown
            expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
            expect(screen.getByText(/contains uppercase letter/i)).toBeInTheDocument();
            expect(screen.getByText(/contains lowercase letter/i)).toBeInTheDocument();
            expect(screen.getByText(/contains number/i)).toBeInTheDocument();
            expect(screen.getByText(/contains special character/i)).toBeInTheDocument();
        });
    });

    test('shows error for weak password on submit', async () => {
        render(<SignUp />);

        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);
        const emailInput = screen.getByLabelText(/^email$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        await userEvent.type(firstNameInput, 'John');
        await userEvent.type(lastNameInput, 'Doe');
        await userEvent.type(emailInput, 'john@mun.ca');
        await userEvent.type(passwordInput, 'weakpass');
        await userEvent.type(confirmPasswordInput, 'weakpass');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
        });
    });

    test('toggles password visibility for both password fields', async () => {
        render(<SignUp />);

        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const toggleButtons = screen.getAllByRole('button').filter(btn => btn.type === 'button');

        // Initially passwords should be hidden
        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');

        // Click first toggle button
        fireEvent.click(toggleButtons[0]);

        // Both should now be visible
        expect(passwordInput).toHaveAttribute('type', 'text');
        expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });

    test('successfully submits form with valid data', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Account created successfully! Please check your email to verify your account.' }),
        });

        render(<SignUp />);

        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);
        const emailInput = screen.getByLabelText(/^email$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        await userEvent.type(firstNameInput, 'John');
        await userEvent.type(lastNameInput, 'Doe');
        await userEvent.type(emailInput, 'john@mun.ca');
        await userEvent.type(passwordInput, 'Password123!');
        await userEvent.type(confirmPasswordInput, 'Password123!');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8800/api/auth/signup',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firstName: 'John',
                        lastName: 'Doe',
                        email: 'john@mun.ca',
                        password: 'Password123!',
                    }),
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByText(/account created successfully/i)).toBeInTheDocument();
        });
    });

    test('shows error message on signup failure', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Email already exists' }),
        });

        render(<SignUp />);

        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);
        const emailInput = screen.getByLabelText(/^email$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        await userEvent.type(firstNameInput, 'John');
        await userEvent.type(lastNameInput, 'Doe');
        await userEvent.type(emailInput, 'john@mun.ca');
        await userEvent.type(passwordInput, 'Password123!');
        await userEvent.type(confirmPasswordInput, 'Password123!');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
        });
    });

    test('disables form inputs while submitting', async () => {
        fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(<SignUp />);

        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);
        const emailInput = screen.getByLabelText(/^email$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        await userEvent.type(firstNameInput, 'John');
        await userEvent.type(lastNameInput, 'Doe');
        await userEvent.type(emailInput, 'john@mun.ca');
        await userEvent.type(passwordInput, 'Password123!');
        await userEvent.type(confirmPasswordInput, 'Password123!');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(submitButton).toBeDisabled();
            expect(screen.getByText(/signing up\.\.\./i)).toBeInTheDocument();
        });
    });

    test('redirects authenticated users to home page', () => {
        useAuth.mockReturnValue({
            user: { email: 'test@mun.ca' },
            loading: false,
            signup: jest.fn(),
            checkAuth: jest.fn(),
        });

        render(<SignUp />);

        expect(mockPush).toHaveBeenCalledWith('/');
    });

    test('displays login link', () => {
        render(<SignUp />);

        const loginLink = screen.getByText(/log in/i);
        expect(loginLink).toBeInTheDocument();
        expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });
});
