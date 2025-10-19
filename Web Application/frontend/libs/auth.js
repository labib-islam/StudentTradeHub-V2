// Authentication API functions for the frontend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';

export const signup = async ({ firstName, lastName, email, password }) => {
    try {
        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            throw new Error('Please enter all required fields.');
        }

        const response = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firstName, lastName, email, password }),
        });
        console.log('Signup response status:', response);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Signup failed');
        }

        // Store token in localStorage
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        return data;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
};

export const login = async ({ email, password }) => {
    try {
        // Validate required fields
        if (!email || !password) {
            throw new Error('Please enter all required fields.');
        }

        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token in localStorage
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        const token = localStorage.getItem('token');

        if (token) {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
        }

        // Remove token from localStorage
        localStorage.removeItem('token');
    } catch (error) {
        console.error('Logout error:', error);
        // Still remove token even if request fails
        localStorage.removeItem('token');
        throw error;
    }
};
