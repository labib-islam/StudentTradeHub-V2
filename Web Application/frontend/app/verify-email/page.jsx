'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const VerifyEmail = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const [token, setToken] = useState('');

    useEffect(() => {
        // Get token from URL query parameters
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
            verifyEmailToken(tokenFromUrl);
        } else {
            setStatus('error');
            setMessage('Invalid or missing verification token');
        }
    }, [searchParams]);

    const verifyEmailToken = async (verificationToken) => {
        try {
            const response = await fetch('http://localhost:8800/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: verificationToken }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setStatus('error');
                setMessage(data.message || 'Failed to verify email');
            }
        } catch (err) {
            console.error('Error:', err);
            setStatus('error');
            setMessage('An error occurred. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center flex-col bg-slate-100 p-4">
            <div className="w-full max-w-md">
                <h1 className="text-4xl mb-2 text-center font-semibold text-slate-900">
                    StudentTradeHub
                </h1>
                <p className="text-center text-gray-600 mb-8 text-sm">Email Verification</p>
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                    {status === 'verifying' && (
                        <div className="text-center">
                            <div className="mb-4">
                                <svg
                                    className="animate-spin h-12 w-12 text-blue-600 mx-auto"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h2>
                            <p className="text-gray-600">Please wait while we verify your email address...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center">
                            <div className="mb-4">
                                <svg
                                    className="h-16 w-16 text-green-500 mx-auto"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    ></path>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded-lg mb-4">
                                <p className="font-semibold">✓ Success</p>
                                <p className="mt-1">{message}</p>
                            </div>
                            <p className="text-gray-600 mb-6">Redirecting you to login...</p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full bg-slate-900 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <div className="mb-4">
                                <svg
                                    className="h-16 w-16 text-red-500 mx-auto"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    ></path>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg mb-4">
                                <p className="font-semibold">⚠ Error</p>
                                <p className="mt-1">{message}</p>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Your verification link may have expired or is invalid. Please try signing up again or contact support.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/signup')}
                                    className="w-full bg-slate-900 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                                >
                                    Go to Sign Up
                                </button>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full bg-white hover:bg-slate-50 text-slate-900 py-3 px-4 rounded-lg font-semibold border border-slate-300 transition-colors"
                                >
                                    Go to Login
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
