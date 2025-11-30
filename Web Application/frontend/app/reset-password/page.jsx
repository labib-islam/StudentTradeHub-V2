'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PiEyeLight, PiEyeSlash } from 'react-icons/pi';

const ResetPassword = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);

    useEffect(() => {
        // Get token from URL query parameters
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            setError('Invalid or missing reset token');
        }
    }, [searchParams]);

    // Validate password
    const validatePassword = (password) => {
        if (!password) {
            return 'Password is required';
        } else if (password.length < 8) {
            return 'Password must be at least 8 characters';
        }
        return '';
    };

    // Validate confirm password
    const validateConfirmPassword = (confirmPass, originalPass) => {
        if (!confirmPass) {
            return 'Please confirm your password';
        } else if (confirmPass !== originalPass) {
            return 'Passwords do not match';
        }
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsFormSubmitted(true);
        setError('');
        setMessage('');

        // Validate all fields
        const passwordError = validatePassword(newPassword);
        const confirmPasswordError = validateConfirmPassword(confirmPassword, newPassword);

        setValidationErrors({
            newPassword: passwordError,
            confirmPassword: confirmPasswordError
        });

        // Check if there are any validation errors
        if (passwordError || confirmPasswordError) {
            return;
        }

        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8800/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                setError(data.message || 'Failed to reset password');
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
                <p className="text-center text-gray-600 mb-8 text-sm">Create a new password for your account.</p>
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-3xl mb-6 text-center font-bold text-gray-900">Reset Password</h2>

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

                        <div className="mb-5">
                            <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`w-full px-4 py-3 pr-12 border ${isFormSubmitted && validationErrors.newPassword
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-slate-300 bg-white'
                                        } rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400`}
                                    placeholder="Enter new password"
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
                            {isFormSubmitted && validationErrors.newPassword && (
                                <p className="mt-1 text-xs text-red-600">{validationErrors.newPassword}</p>
                            )}
                        </div>

                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-3 pr-12 border ${isFormSubmitted && validationErrors.confirmPassword
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-slate-300 bg-white'
                                        } rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400`}
                                    placeholder="Confirm new password"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <PiEyeLight size={20} /> : <PiEyeSlash size={20} />}
                                </button>
                            </div>
                            {isFormSubmitted && validationErrors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading || !token}
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
