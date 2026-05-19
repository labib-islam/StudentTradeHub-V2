'use client';
import { useState, useEffect } from 'react';
import { PiEyeLight, PiEyeSlash } from 'react-icons/pi';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800";

const SignUp = () => {
    const router = useRouter();
    const { user, loading, signup, checkAuth } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        confirm_password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });

    // Redirect if user is already logged in
    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);


    // Check password strength when password changes
    useEffect(() => {
        const password = formData.password;
        const strength = {
            score: 0,
            hasMinLength: password.length >= 6,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        let scoreCount = 0;
        if (strength.hasMinLength) scoreCount++;
        if (strength.hasUpperCase) scoreCount++;
        if (strength.hasLowerCase) scoreCount++;
        if (strength.hasNumber) scoreCount++;
        if (strength.hasSpecialChar) scoreCount++;

        strength.score = scoreCount;
        setPasswordStrength(strength);
    }, [formData.password]);

    const getPasswordStrengthLabel = () => {
        const { score } = passwordStrength;
        if (score <= 2) return { label: 'Weak', color: 'red' };
        if (score <= 4) return { label: 'Good', color: 'orange' };
        return { label: 'Strong', color: 'green' };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Validate email format
    const validateEmail = (email) => {
        // Accept emails that end with @mun.ca (case-insensitive)
        const emailRegex = /^[^\s@]+@mun\.ca$/i;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate email format
        if (!validateEmail(formData.email)) {
            setError('Please enter a valid MUN email address');
            return;
        }

        // Validate required fields
        if (!formData.first_name || formData.first_name.trim().length === 0) {
            setError('First name is required');
            return;
        }

        if (!formData.last_name || formData.last_name.trim().length === 0) {
            setError('Last name is required');
            return;
        }

        // Validate passwords match
        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        // Check for password complexity
        const hasUpperCase = /[A-Z]/.test(formData.password);
        const hasLowerCase = /[a-z]/.test(formData.password);
        const hasNumbers = /\d/.test(formData.password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

        if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
            setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: formData.first_name,
                    lastName: formData.last_name,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message);
                // Clear form
                setFormData({
                    email: '',
                    first_name: '',
                    last_name: '',
                    password: '',
                    confirm_password: '',
                });
            } else {
                setError(data.message || 'An error occurred during signup');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during signup');
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
                <p className="text-center text-gray-600 mb-8 text-sm">Create your account to start trading</p>
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-3xl mb-6 text-center font-bold text-gray-900">Sign Up</h2>
                        {success && (
                            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded-lg">
                                <p className="font-semibold">✓ Success</p>
                                <p className="mt-1">{success}</p>
                                <p className="mt-2 text-xs">Please check your email inbox and click the verification link.</p>
                            </div>
                        )}
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg">
                                <p className="font-semibold">⚠ Error</p>
                                <p className="mt-1">{error}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-900 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    placeholder="John"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-900 mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    placeholder="Doe"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="mb-5">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border ${formData.email && !validateEmail(formData.email)
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-slate-300 bg-white'
                                    } rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400`}
                                placeholder="yourname@mun.ca"
                                required
                                disabled={isLoading}
                            />
                            {formData.email && !validateEmail(formData.email) && (
                                <p className="mt-1 text-xs text-red-600">Please enter a valid @mun.ca email address</p>
                            )}
                        </div>
                        <div className="mb-5">
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg bg-white text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    placeholder="Create a strong password"
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
                            {formData.password && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-700">Password strength:</span>
                                        <span
                                            className={`text-xs font-semibold`}
                                            style={{ color: getPasswordStrengthLabel().color }}
                                        >
                                            {getPasswordStrengthLabel().label}
                                        </span>
                                    </div>
                                    <div className="bg-gray-200 h-2 w-full rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{
                                                width: `${(passwordStrength.score / 5) * 100}%`,
                                                backgroundColor: getPasswordStrengthLabel().color
                                            }}
                                        ></div>
                                    </div>
                                    <ul className="mt-3 text-xs text-gray-600 space-y-1.5">
                                        <li className={`flex items-center gap-2 ${passwordStrength.hasMinLength ? "text-green-600" : "text-gray-500"}`}>
                                            <span>{passwordStrength.hasMinLength ? "✓" : "○"}</span>
                                            At least 6 characters
                                        </li>
                                        <li className={`flex items-center gap-2 ${passwordStrength.hasUpperCase ? "text-green-600" : "text-gray-500"}`}>
                                            <span>{passwordStrength.hasUpperCase ? "✓" : "○"}</span>
                                            Contains uppercase letter
                                        </li>
                                        <li className={`flex items-center gap-2 ${passwordStrength.hasLowerCase ? "text-green-600" : "text-gray-500"}`}>
                                            <span>{passwordStrength.hasLowerCase ? "✓" : "○"}</span>
                                            Contains lowercase letter
                                        </li>
                                        <li className={`flex items-center gap-2 ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-500"}`}>
                                            <span>{passwordStrength.hasNumber ? "✓" : "○"}</span>
                                            Contains number
                                        </li>
                                        <li className={`flex items-center gap-2 ${passwordStrength.hasSpecialChar ? "text-green-600" : "text-gray-500"}`}>
                                            <span>{passwordStrength.hasSpecialChar ? "✓" : "○"}</span>
                                            Contains special character
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg bg-white text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    placeholder="Confirm your password"
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
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing Up...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <a href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                                Log In
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
