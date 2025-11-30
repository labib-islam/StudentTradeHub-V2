'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ForgotPassword = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsFormSubmitted(true);
        setError('');
        setMessage('');

        // Validate email
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8800/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setEmail(''); // Clear the form
                setIsFormSubmitted(false);
            } else {
                setError(data.message || 'Failed to send reset email');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('An error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center flex-col bg-slate-100 p-4">
            <div className="w-full max-w-md">
                <h1 className="text-4xl mb-2 text-center font-semibold text-slate-900">
                    StudentTradeHub
                </h1>
                <p className="text-center text-gray-600 mb-8 text-sm">Reset your password by entering your email below.</p>
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-3xl mb-6 text-center font-bold text-gray-900">Forgot Password</h2>

                        {message && (
                            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded-lg">
                                <p className="font-semibold">✓ Success</p>
                                <p className="mt-1">{message}</p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg">
                                <p className="font-semibold">⚠ Error</p>
                                <p className="mt-1">{error}</p>
                            </div>
                        )}

                        <div className="mb-6">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 bg-white rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                placeholder="Enter your email"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => router.push('/login')}
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
