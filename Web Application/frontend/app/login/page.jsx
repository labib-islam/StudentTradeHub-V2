'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PiEyeLight, PiEyeSlash } from 'react-icons/pi';
import { useAuth } from '@/context/AuthContext';

const Login = () => {
    const router = useRouter();
    const { user, loading, login, checkAuth } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        email: '',
        password: ''
    });
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if user is already logged in
    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);

    // Validate email format
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            return 'Email is required';
        } else if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return '';
    };

    // Validate password
    const validatePassword = (password) => {
        if (!password) {
            return 'Password is required';
        } else if (password.length < 6) {
            return 'Password must be at least 6 characters';
        }
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsFormSubmitted(true);

        // Validate all fields
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);

        // Update validation errors
        setValidationErrors({
            email: emailError,
            password: passwordError
        });

        // Check if there are any validation errors
        if (emailError || passwordError) {
            return;
        }

        setIsLoading(true);
        setError('');

        // Proceed with login
        try {
            await login({ email, password });
            await checkAuth();
            router.push('/'); // Redirect to home page on success
        }
        catch (err) {
            setError(err.message || 'An error occurred while signing in');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // Don't render the form if user is authenticated
    if (user) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center flex-col">
            <h1 className="text-4xl mb-8 text-green-100 font-extralight">StudentTradeHub</h1>
            <div className="bg-gray-50 p-8 rounded-lg shadow-md w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <h2 className="text-2xl mb-6 text-center text-blue-900">Login</h2>
                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded-md">
                            {error}
                        </div>
                    )}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            className={`mt-1 block w-full px-3 py-2 border ${isFormSubmitted && validationErrors.email ? 'border-red-500' : 'border-gray-300'
                                } rounded-md shadow-sm text-blue-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            required
                            disabled={isLoading}
                        />
                        {isFormSubmitted && validationErrors.email && (
                            <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
                        )}
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                className={`mt-1 block w-full px-3 py-2 border ${isFormSubmitted && validationErrors.password ? 'border-red-500' : 'border-gray-300'
                                    } rounded-md shadow-sm text-blue-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 p-4 flex items-center text-sm text-blue-900"
                            >
                                {showPassword ? <PiEyeLight size={20} /> : <PiEyeSlash size={20} />}
                            </button>
                        </div>
                        {isFormSubmitted && validationErrors.password && (
                            <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-900 text-white py-2 px-4 rounded-md hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center flex flex-col">
                    <a href="/forgot-password" className="text-sm text-blue-900 hover:underline hover:text-blue-400 p-2">
                        Forgot Password?
                    </a>
                    <a href="/signup" className="text-sm text-blue-900 hover:underline hover:text-blue-400">
                        Don't have an account yet? Sign Up
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;
