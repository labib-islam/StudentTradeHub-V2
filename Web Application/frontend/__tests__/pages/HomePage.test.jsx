import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '../../app/page';

// Mock useRouter and useAuth
const mockPush = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

jest.mock('@/context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

// Mock UserRoute component
jest.mock('@/components/UserRoute', () => {
    return function MockUserRoute({ children }) {
        return <div data-testid="user-route">{children}</div>;
    };
});

describe('DashboardPage (Home Page)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the redirecting message', () => {
            mockUseAuth.mockReturnValue({ user: null, loading: true });
            render(<DashboardPage />);

            expect(screen.getByText('Redirecting...')).toBeInTheDocument();
        });

        it('should wrap content in UserRoute component', () => {
            mockUseAuth.mockReturnValue({ user: null, loading: true });
            render(<DashboardPage />);

            expect(screen.getByTestId('user-route')).toBeInTheDocument();
        });

        it('should render with proper styling classes', () => {
            mockUseAuth.mockReturnValue({ user: null, loading: true });
            const { container } = render(<DashboardPage />);

            const mainDiv = container.querySelector('.min-h-screen');
            expect(mainDiv).toBeInTheDocument();
            expect(mainDiv).toHaveClass('flex', 'items-center', 'justify-center');
        });
    });

    describe('Redirect Behavior', () => {
        it('should redirect to /buy when loading is false', async () => {
            mockUseAuth.mockReturnValue({ user: { id: '123' }, loading: false });
            render(<DashboardPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/buy');
            });
        });

        it('should not redirect while loading is true', () => {
            mockUseAuth.mockReturnValue({ user: null, loading: true });
            render(<DashboardPage />);

            expect(mockPush).not.toHaveBeenCalled();
        });

        it('should redirect when loading changes from true to false', async () => {
            const { rerender } = render(<DashboardPage />);

            mockUseAuth.mockReturnValue({ user: null, loading: true });
            rerender(<DashboardPage />);

            expect(mockPush).not.toHaveBeenCalled();

            mockUseAuth.mockReturnValue({ user: { id: '123' }, loading: false });
            rerender(<DashboardPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/buy');
            });
        });

        it('should redirect even when user is null but loading is false', async () => {
            mockUseAuth.mockReturnValue({ user: null, loading: false });
            render(<DashboardPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/buy');
            });
        });

        it('should only call push once per render', async () => {
            mockUseAuth.mockReturnValue({ user: { id: '123' }, loading: false });
            render(<DashboardPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Loading States', () => {
        it('should display content while loading', () => {
            mockUseAuth.mockReturnValue({ user: null, loading: true });
            render(<DashboardPage />);

            expect(screen.getByText('Redirecting...')).toBeInTheDocument();
        });

        it('should display content before redirect', () => {
            mockUseAuth.mockReturnValue({ user: { id: '123' }, loading: false });
            render(<DashboardPage />);

            expect(screen.getByText('Redirecting...')).toBeInTheDocument();
        });
    });

    describe('User Authentication States', () => {
        it('should handle authenticated user', async () => {
            const mockUser = {
                id: '123',
                email: 'test@example.com',
                role: 'user'
            };
            mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

            render(<DashboardPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/buy');
            });
        });

        it('should handle unauthenticated user', async () => {
            mockUseAuth.mockReturnValue({ user: null, loading: false });

            render(<DashboardPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/buy');
            });
        });

        it('should handle admin user', async () => {
            const adminUser = {
                id: '456',
                email: 'admin@example.com',
                role: 'admin'
            };
            mockUseAuth.mockReturnValue({ user: adminUser, loading: false });

            render(<DashboardPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/buy');
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid loading state changes', async () => {
            const { rerender } = render(<DashboardPage />);

            mockUseAuth.mockReturnValue({ user: null, loading: true });
            rerender(<DashboardPage />);

            mockUseAuth.mockReturnValue({ user: null, loading: false });
            rerender(<DashboardPage />);

            mockUseAuth.mockReturnValue({ user: { id: '123' }, loading: false });
            rerender(<DashboardPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalled();
            });
        });

        it('should maintain redirect intention across multiple renders', async () => {
            mockUseAuth.mockReturnValue({ user: { id: '123' }, loading: false });
            const { rerender } = render(<DashboardPage />);

            rerender(<DashboardPage />);
            rerender(<DashboardPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/buy');
            });
        });
    });

    describe('Integration', () => {
        it('should work with UserRoute protection', () => {
            mockUseAuth.mockReturnValue({ user: { id: '123' }, loading: false });
            render(<DashboardPage />);

            const userRoute = screen.getByTestId('user-route');
            expect(userRoute).toBeInTheDocument();
            expect(userRoute).toContainElement(screen.getByText('Redirecting...'));
        });
    });
});
