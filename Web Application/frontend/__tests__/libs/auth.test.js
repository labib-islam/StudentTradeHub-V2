import { signup, login, logout } from '@/libs/auth';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
});

// Mock console.error and console.log
global.console = {
    ...console,
    error: jest.fn(),
    log: jest.fn(),
};

describe('auth.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    describe('signup', () => {
        it('should successfully sign up a user', async () => {
            const mockResponse = {
                token: 'test-token-123',
                user: {
                    _id: 'user-123',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@mun.ca',
                },
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@mun.ca',
                password: 'StrongP@ss123',
            };

            const result = await signup(userData);

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8800/api/auth/signup',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData),
                }
            );
            expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token-123');
            expect(result).toEqual(mockResponse);
        });

        it('should throw error if firstName is missing', async () => {
            const userData = {
                lastName: 'Doe',
                email: 'john.doe@mun.ca',
                password: 'StrongP@ss123',
            };

            await expect(signup(userData)).rejects.toThrow('Please enter all required fields.');
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should throw error if lastName is missing', async () => {
            const userData = {
                firstName: 'John',
                email: 'john.doe@mun.ca',
                password: 'StrongP@ss123',
            };

            await expect(signup(userData)).rejects.toThrow('Please enter all required fields.');
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should throw error if email is missing', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                password: 'StrongP@ss123',
            };

            await expect(signup(userData)).rejects.toThrow('Please enter all required fields.');
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should throw error if password is missing', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@mun.ca',
            };

            await expect(signup(userData)).rejects.toThrow('Please enter all required fields.');
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should throw error if signup fails with error message', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: 'Email already exists' }),
            });

            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@mun.ca',
                password: 'StrongP@ss123',
            };

            await expect(signup(userData)).rejects.toThrow('Email already exists');
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });

        it('should throw default error message if no message provided', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            });

            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@mun.ca',
                password: 'StrongP@ss123',
            };

            await expect(signup(userData)).rejects.toThrow('Signup failed');
        });

        it('should not store token if not provided in response', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ user: { _id: 'user-123' } }),
            });

            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@mun.ca',
                password: 'StrongP@ss123',
            };

            await signup(userData);
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should successfully log in a user', async () => {
            const mockResponse = {
                token: 'login-token-456',
                user: {
                    _id: 'user-456',
                    email: 'test@mun.ca',
                },
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const credentials = {
                email: 'test@mun.ca',
                password: 'password123',
            };

            const result = await login(credentials);

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8800/api/auth/login',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(credentials),
                }
            );
            expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'login-token-456');
            expect(result).toEqual(mockResponse);
        });

        it('should throw error if email is missing', async () => {
            const credentials = {
                password: 'password123',
            };

            await expect(login(credentials)).rejects.toThrow('Please enter all required fields.');
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should throw error if password is missing', async () => {
            const credentials = {
                email: 'test@mun.ca',
            };

            await expect(login(credentials)).rejects.toThrow('Please enter all required fields.');
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should throw error if login fails with error message', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: 'Invalid credentials' }),
            });

            const credentials = {
                email: 'test@mun.ca',
                password: 'wrongpassword',
            };

            await expect(login(credentials)).rejects.toThrow('Invalid credentials');
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });

        it('should throw default error message if no message provided', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            });

            const credentials = {
                email: 'test@mun.ca',
                password: 'wrongpassword',
            };

            await expect(login(credentials)).rejects.toThrow('Login failed');
        });

        it('should not store token if not provided in response', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ user: { _id: 'user-123' } }),
            });

            const credentials = {
                email: 'test@mun.ca',
                password: 'password123',
            };

            await login(credentials);
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('should successfully log out with token', async () => {
            localStorageMock.setItem('token', 'existing-token');

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Logged out successfully' }),
            });

            await logout();

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8800/api/auth/logout',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer existing-token',
                    },
                }
            );
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
        });

        it('should remove token even if no token exists', async () => {
            await logout();

            expect(fetch).not.toHaveBeenCalled();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
        });

        it('should remove token even if logout request fails', async () => {
            localStorageMock.setItem('token', 'existing-token');

            fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(logout()).rejects.toThrow('Network error');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
        });

        it('should handle logout when fetch fails with non-ok response', async () => {
            localStorageMock.setItem('token', 'existing-token');

            fetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: 'Logout failed' }),
            });

            // Even if the request isn't ok, logout should still remove token
            await logout();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
        });
    });
});
