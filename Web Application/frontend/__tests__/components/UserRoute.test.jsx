import { render, screen } from '@testing-library/react';
import UserRoute from '@/components/UserRoute';

const mockRouter = { push: jest.fn() };

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

const { useAuth } = require('@/context/AuthContext');

describe('UserRoute Component', () => {
    beforeEach(() => {
        mockRouter.push.mockClear();
    });

    it('should render children when user has user role', () => {
        useAuth.mockReturnValue({ user: { _id: 'user1', role: 'user' }, loading: false });

        render(
            <UserRoute>
                <div>User Content</div>
            </UserRoute>
        );

        expect(screen.getByText('User Content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', () => {
        useAuth.mockReturnValue({ user: null, loading: false });

        render(
            <UserRoute>
                <div>User Content</div>
            </UserRoute>
        );

        expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    it('should redirect to admin when user has admin role', () => {
        useAuth.mockReturnValue({ user: { _id: 'admin1', role: 'admin' }, loading: false });

        render(
            <UserRoute>
                <div>User Content</div>
            </UserRoute>
        );

        expect(mockRouter.push).toHaveBeenCalledWith('/admin');
    });

    it('should show loading state', () => {
        useAuth.mockReturnValue({ user: null, loading: true });

        render(
            <UserRoute>
                <div>User Content</div>
            </UserRoute>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should not render children when not authenticated', () => {
        useAuth.mockReturnValue({ user: null, loading: false });

        render(
            <UserRoute>
                <div>User Content</div>
            </UserRoute>
        );

        expect(screen.queryByText('User Content')).not.toBeInTheDocument();
    });

    it('should not redirect when loading', () => {
        useAuth.mockReturnValue({ user: null, loading: true });

        render(
            <UserRoute>
                <div>User Content</div>
            </UserRoute>
        );

        expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should not render children for admin users', () => {
        useAuth.mockReturnValue({ user: { _id: 'admin1', role: 'admin' }, loading: false });

        render(
            <UserRoute>
                <div>User Content</div>
            </UserRoute>
        );

        expect(screen.queryByText('User Content')).not.toBeInTheDocument();
    });
});
