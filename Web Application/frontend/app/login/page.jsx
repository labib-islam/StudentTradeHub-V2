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
        <div className="min-h-screen flex items-center justify-center flex-col bg-slate-100 p-4">
            <div className="w-full max-w-md">
                <h1 className="text-4xl mb-2 text-center font-semibold text-slate-900">
                    StudentTradeHub
                </h1>
                <p className="text-center text-gray-600 mb-8 text-sm">Welcome back! Please sign in to continue.</p>
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-3xl mb-6 text-center font-bold text-gray-900">Login</h2>
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg">
                                <p className="font-semibold">⚠ Error</p>
                                <p className="mt-1">{error}</p>
                            </div>
                        )}
                        <div className="mb-5">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                className={`w-full px-4 py-3 border ${isFormSubmitted && validationErrors.email ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'
                                    } rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400`}
                                placeholder="Enter your email"
                                required
                                disabled={isLoading}
                            />
                            {isFormSubmitted && validationErrors.email && (
                                <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
                            )}
                        </div>
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    value={password}
                                    className={`w-full px-4 py-3 pr-12 border ${isFormSubmitted && validationErrors.password ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'
                                        } rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400`}
                                    placeholder="Enter your password"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700"
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
                            className="w-full bg-slate-900 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center space-y-2">
                        <a href="/forgot-password" className="block text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium">
                            Forgot Password?
                        </a>
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <a href="/signup" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                                Sign Up
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
