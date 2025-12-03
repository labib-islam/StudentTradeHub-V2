import { render, screen, fireEvent } from '@testing-library/react';
import EditProfile from '@/components/EditProfile';

jest.mock('@/components/UserRoute', () => {
    return function UserRoute({ children }) {
        return <div>{children}</div>;
    };
});

jest.mock('@/libs/utlis', () => ({
    updateUserInfo: jest.fn(),
    updateUserInfoWithPicture: jest.fn(),
}));

const mockOnClose = jest.fn();
const mockOnUpdate = jest.fn();

describe('EditProfile Component', () => {
    const mockUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
    };

    beforeEach(() => {
        mockOnClose.mockClear();
        mockOnUpdate.mockClear();
    });

    it('should render when open', () => {
        render(<EditProfile isOpen={true} userData={mockUser} onClose={mockOnClose} onProfileUpdate={mockOnUpdate} />);
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThan(0);
    });

    it('should display user information', () => {
        render(<EditProfile isOpen={true} userData={mockUser} onClose={mockOnClose} onProfileUpdate={mockOnUpdate} />);
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    });

    it('should handle input changes', () => {
        render(<EditProfile isOpen={true} userData={mockUser} onClose={mockOnClose} onProfileUpdate={mockOnUpdate} />);
        const firstNameInput = screen.getByDisplayValue('John');
        fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
        expect(firstNameInput.value).toBe('Jane');
    });

    it('should show save button', () => {
        render(<EditProfile isOpen={true} userData={mockUser} onClose={mockOnClose} onProfileUpdate={mockOnUpdate} />);
        expect(screen.getByText(/save|update/i)).toBeInTheDocument();
    });
});
