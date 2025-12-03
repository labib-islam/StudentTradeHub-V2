import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/Navbar';
import * as utils from '@/libs/utlis';

// Mock next/navigation
const mockPush = jest.fn();
const mockPathname = '/buy';

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    usePathname: () => mockPathname,
}));

// Mock AuthContext
const mockLogout = jest.fn();
const mockCheckAuth = jest.fn();

jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

// Mock SearchContext
const mockSetSearchTerm = jest.fn();
const mockSetSelectedCategory = jest.fn();
const mockSetSelectedCondition = jest.fn();
const mockSetSelectedStatus = jest.fn();

jest.mock('@/context/SearchContext', () => ({
    useSearch: () => ({
        searchTerm: '',
        setSearchTerm: mockSetSearchTerm,
        selectedCategory: 'all',
        setSelectedCategory: mockSetSelectedCategory,
        selectedCondition: 'all',
        setSelectedCondition: mockSetSelectedCondition,
        selectedStatus: 'all',
        setSelectedStatus: mockSetSelectedStatus,
    }),
}));

// Mock EditProfile component
jest.mock('@/components/EditProfile', () => {
    return function MockEditProfile({ isOpen, onClose }) {
        return isOpen ? <div data-testid="edit-profile-modal">Edit Profile Modal</div> : null;
    };
});

// Mock utils functions
jest.mock('@/libs/utlis', () => ({
    fetchUserProfile: jest.fn(),
}));

const { useAuth } = require('@/context/AuthContext');

describe('Navbar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock fetchUserProfile to return user data
        utils.fetchUserProfile.mockResolvedValue({
            user_id: '123',
            first_name: 'John',
            last_name: 'Doe',
            rating: 4.5
        });
    });

    describe('Authentication and Visibility', () => {
        it('does not render when user is not logged in', () => {
            useAuth.mockReturnValue({ user: null, logout: mockLogout, checkAuth: mockCheckAuth });

            const { container } = render(<Navbar />);
            expect(container.firstChild).toBeNull();
        });

        it('renders when user is logged in', () => {
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe', email: 'john@mun.ca' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);
            expect(screen.getByText('StudentTradeHub')).toBeInTheDocument();
        });
    });

    describe('User Profile Display', () => {
        it('displays user name and initials', async () => {
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe', email: 'john@mun.ca' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            await waitFor(() => {
                expect(screen.getByText('John Doe')).toBeInTheDocument();
            });
            expect(screen.getByText('JD')).toBeInTheDocument();
        });

        it('displays seller rating when available', () => {
            useAuth.mockReturnValue({
                user: {
                    _id: '123',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@mun.ca',
                    sellerRating: { averageRating: 4.5, totalReviews: 10 },
                },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);
            expect(screen.getByText('4.5')).toBeInTheDocument();
            expect(screen.getByText('(10)')).toBeInTheDocument();
        });

        it('does not display rating when no reviews', () => {
            useAuth.mockReturnValue({
                user: {
                    _id: '123',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@mun.ca',
                    sellerRating: { totalReviews: 0 },
                },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);
            const ratingElements = screen.queryAllByText(/★/);
            expect(ratingElements).toHaveLength(0);
        });
    });

    describe('Profile Dropdown', () => {
        it('opens dropdown when profile button is clicked', async () => {
            const user = userEvent.setup();
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe', email: 'john@mun.ca' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const profileButton = screen.getAllByText('John Doe')[0].closest('button');
            await user.click(profileButton);

            expect(screen.getByText('Edit Profile')).toBeInTheDocument();
            expect(screen.getByText('Payment details')).toBeInTheDocument();
            expect(screen.getByText('Address preferences')).toBeInTheDocument();
            expect(screen.getByText('Logout')).toBeInTheDocument();
        });

        it('displays user email in dropdown', async () => {
            const user = userEvent.setup();
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe', email: 'john@mun.ca' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const profileButton = screen.getAllByText('John Doe')[0].closest('button');
            await user.click(profileButton);

            expect(screen.getByText('john@mun.ca')).toBeInTheDocument();
        });

        it('closes dropdown when clicking outside', async () => {
            const user = userEvent.setup();
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe', email: 'john@mun.ca' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const profileButton = screen.getAllByText('John Doe')[0].closest('button');
            await user.click(profileButton);
            expect(screen.getByText('Edit Profile')).toBeInTheDocument();

            await user.click(document.body);

            await waitFor(() => {
                expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
            });
        });

        it('opens edit profile modal when clicked', async () => {
            const user = userEvent.setup();
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe', email: 'john@mun.ca' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const profileButton = screen.getAllByText('John Doe')[0].closest('button');
            await user.click(profileButton);

            const editButton = screen.getByText('Edit Profile');
            await user.click(editButton);

            expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument();
        });
    });

    describe('Logout Functionality', () => {
        it('calls logout and redirects when logout is clicked', async () => {
            const user = userEvent.setup();
            mockLogout.mockResolvedValue();

            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe', email: 'john@mun.ca' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const profileButton = screen.getAllByText('John Doe')[0].closest('button');
            await user.click(profileButton);

            const logoutButton = screen.getByText('Logout');
            await user.click(logoutButton);

            expect(mockLogout).toHaveBeenCalled();
            await waitFor(() => {
                expect(mockCheckAuth).toHaveBeenCalled();
                expect(mockPush).toHaveBeenCalledWith('/login');
            });
        });

        it('redirects to login even if logout fails', async () => {
            const user = userEvent.setup();
            mockLogout.mockRejectedValue(new Error('Logout failed'));

            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe', email: 'john@mun.ca' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const profileButton = screen.getAllByText('John Doe')[0].closest('button');
            await user.click(profileButton);

            const logoutButton = screen.getByText('Logout');
            await user.click(logoutButton);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/login');
            });
        });
    });

    describe('Navigation Links', () => {
        it('displays Buy, Sell, Orders links for regular users', () => {
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe', role: 'user' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            expect(screen.getByText('Buy')).toBeInTheDocument();
            expect(screen.getByText('Sell')).toBeInTheDocument();
            expect(screen.getByText('Orders')).toBeInTheDocument();
        });

        it('displays Admin link for admin users', () => {
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'Admin', lastName: 'User', role: 'admin' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            expect(screen.getByText('Admin')).toBeInTheDocument();
            expect(screen.queryByText('Buy')).not.toBeInTheDocument();
        });

        it('highlights active navigation link', () => {
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe', role: 'user' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const buyLink = screen.getByText('Buy').closest('a');
            expect(buyLink).toHaveClass('bg-slate-900', 'text-white');
        });
    });

    describe('Search Functionality', () => {
        it('renders search input with correct placeholder', () => {
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const searchInputs = screen.getAllByPlaceholderText('Search products...');
            expect(searchInputs.length).toBeGreaterThan(0);
        });

        it('updates search term when typing', async () => {
            const user = userEvent.setup();
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const searchInput = screen.getAllByPlaceholderText('Search products...')[0];
            await user.type(searchInput, 'laptop');

            expect(mockSetSearchTerm).toHaveBeenCalled();
        });
    });

    describe('Filter Dropdowns', () => {
        it('opens category filter when clicked', async () => {
            const user = userEvent.setup();
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const categoryButton = screen.getByText(/Category: All/);
            await user.click(categoryButton);

            expect(screen.getByText('Choose category')).toBeInTheDocument();
            expect(screen.getByText('Electronics')).toBeInTheDocument();
            expect(screen.getByText('Books')).toBeInTheDocument();
        });

        it('selects category and closes dropdown', async () => {
            const user = userEvent.setup();
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const categoryButton = screen.getByText(/Category: All/);
            await user.click(categoryButton);

            const electronicsOption = screen.getByText('Electronics');
            await user.click(electronicsOption);

            expect(mockSetSelectedCategory).toHaveBeenCalledWith('Electronics');
        });

        it('opens condition filter when clicked', async () => {
            const user = userEvent.setup();
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const conditionButton = screen.getByText(/Condition: All/);
            await user.click(conditionButton);

            expect(screen.getByText('Choose condition')).toBeInTheDocument();
            expect(screen.getByText('Brand New')).toBeInTheDocument();
        });

        it('selects condition and closes dropdown', async () => {
            const user = userEvent.setup();
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const conditionButton = screen.getByText(/Condition: All/);
            await user.click(conditionButton);

            const likeNewOption = screen.getByText('Like New');
            await user.click(likeNewOption);

            expect(mockSetSelectedCondition).toHaveBeenCalledWith('Like New');
        });
    });

    describe('Logo Link', () => {
        it('logo links to home page', () => {
            useAuth.mockReturnValue({
                user: { _id: '123', firstName: 'John', lastName: 'Doe' },
                logout: mockLogout,
                checkAuth: mockCheckAuth,
            });

            render(<Navbar />);

            const logo = screen.getByText('StudentTradeHub').closest('a');
            expect(logo).toHaveAttribute('href', '/');
        });
    });
});
