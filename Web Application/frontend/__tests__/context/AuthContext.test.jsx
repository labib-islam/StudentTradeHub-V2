import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const mockRouter = { push: jest.fn(), refresh: jest.fn() };
jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

jest.mock('@/libs/auth', () => ({
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    checkAuth: jest.fn(),
}));

const { login: mockLogin, logout: mockLogout } = require('@/libs/auth');

const TestComponent = () => {
    const { user, login, logout, loading } = useAuth();
    return (
        <div>
            <div>{loading ? 'Loading' : 'Ready'}</div>
            <div data-testid="user-display">{user ? `User: ${user.firstName}` : 'No user'}</div>
            <button onClick={() => login('test@example.com', 'password')}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        mockRouter.push.mockClear();
        mockLogin.mockClear();
        mockLogout.mockClear();
    });

    it('should provide auth context', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Ready')).toBeInTheDocument();
        });

        expect(screen.getByTestId('user-display')).toHaveTextContent('No user');
    });

    it('should handle successful login', async () => {
        mockLogin.mockResolvedValueOnce({ firstName: 'John' });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Ready')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
        });
    });

    it('should handle logout', async () => {
        mockLogout.mockResolvedValueOnce(null);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Ready')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Logout'));

        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalled();
        });
    });
});
