import { render, screen } from '@testing-library/react';
import AdminRoute from '@/components/AdminRoute';

const mockRouter = { push: jest.fn() };

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

const { useAuth } = require('@/context/AuthContext');

describe('AdminRoute Component', () => {
    beforeEach(() => {
        mockRouter.push.mockClear();
    });

    it('should render children when user is admin', () => {
        useAuth.mockReturnValue({ user: { _id: 'admin1', role: 'admin' }, loading: false });

        render(
            <AdminRoute>
                <div>Admin Panel</div>
            </AdminRoute>
        );

        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    it('should redirect to buy when user is not admin', () => {
        useAuth.mockReturnValue({ user: { _id: 'user1', role: 'user' }, loading: false });

        render(
            <AdminRoute>
                <div>Admin Panel</div>
            </AdminRoute>
        );

        expect(mockRouter.push).toHaveBeenCalledWith('/buy');
    });

    it('should redirect to login when user is not authenticated', () => {
        useAuth.mockReturnValue({ user: null, loading: false });

        render(
            <AdminRoute>
                <div>Admin Panel</div>
            </AdminRoute>
        );

        expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    it('should show loading state', () => {
        useAuth.mockReturnValue({ user: null, loading: true });

        render(
            <AdminRoute>
                <div>Admin Panel</div>
            </AdminRoute>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should not render admin content for non-admin', () => {
        useAuth.mockReturnValue({ user: { _id: 'user1', role: 'user' }, loading: false });

        render(
            <AdminRoute>
                <div>Admin Panel</div>
            </AdminRoute>
        );

        expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    });

    it('should check user role properly', () => {
        useAuth.mockReturnValue({ user: { _id: 'admin1', role: 'admin' }, loading: false });

        render(
            <AdminRoute>
                <div>Sensitive Data</div>
            </AdminRoute>
        );

        expect(screen.getByText('Sensitive Data')).toBeInTheDocument();
        expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should handle missing role property', () => {
        useAuth.mockReturnValue({ user: { _id: 'user1' }, loading: false });

        render(
            <AdminRoute>
                <div>Admin Panel</div>
            </AdminRoute>
        );

        expect(mockRouter.push).toHaveBeenCalledWith('/buy');
    });
});
