'use client';
import { useState, useEffect } from 'react';
import { PiEyeLight, PiEyeSlash } from 'react-icons/pi';
import { useRouter } from 'next/navigation';
// import { signUp } from '@/lib/auth';

const SignUp = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        confirm_password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });


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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
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
            // Call the signup function from AuthContext
            const { status } = await signUp(
                formData.email,
                formData.password,
                `${formData.first_name} ${formData.last_name}`
            );
            console.log('Signup status:', status);

            if (status === 'success') {
                // Store email in sessionStorage for the email confirmation page
                sessionStorage.setItem('confirmationEmail', formData.email);
                router.push('/email-confirmation'); // Redirect to email confirmation page
            } else {
                setError(status || 'An error occurred during signup');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during signup');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center flex-col">
            <h1 className="text-4xl mb-8 text-green-100 font-extralight">StudentTradeHub</h1>
            <div className="bg-gray-50 p-8 rounded-lg shadow-md w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <h2 className="text-2xl mb-6 text-center text-blue-900">Sign Up</h2>
                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded-md">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-blue-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-blue-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`mt-1 block w-full px-3 py-2 border ${formData.email && !validateEmail(formData.email)
                                ? 'border-red-500'
                                : 'border-gray-300'
                                } rounded-md shadow-sm text-blue-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            required
                            disabled={isLoading}
                        />
                        {formData.email && !validateEmail(formData.email) && (
                            <p className="mt-1 text-xs text-red-600">Please enter a valid email address</p>
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
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-blue-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-blue-900"
                            >
                                {showPassword ? <PiEyeLight size={20} /> : <PiEyeSlash size={20} />}
                            </button>
                        </div>
                        {formData.password && (
                            <div className="mt-2">
                                <div className="flex items-center mb-1">
                                    <span className="text-xs mr-2 text-black">Password strength:</span>
                                    <span
                                        className={`text-xs font-medium`}
                                        style={{ color: getPasswordStrengthLabel().color }}
                                    >
                                        {getPasswordStrengthLabel().label}
                                    </span>
                                </div>
                                <div className="bg-gray-200 h-1 w-full rounded">
                                    <div
                                        className="h-1 rounded"
                                        style={{
                                            width: `${(passwordStrength.score / 5) * 100}%`,
                                            backgroundColor: getPasswordStrengthLabel().color
                                        }}
                                    ></div>
                                </div>
                                <ul className="mt-1 text-xs text-gray-600 pl-4 space-y-1">
                                    <li className={passwordStrength.hasMinLength ? "text-green-600" : ""}>
                                        At least 6 characters
                                    </li>
                                    <li className={passwordStrength.hasUpperCase ? "text-green-600" : ""}>
                                        Contains uppercase letter
                                    </li>
                                    <li className={passwordStrength.hasLowerCase ? "text-green-600" : ""}>
                                        Contains lowercase letter
                                    </li>
                                    <li className={passwordStrength.hasNumber ? "text-green-600" : ""}>
                                        Contains number
                                    </li>
                                    <li className={passwordStrength.hasSpecialChar ? "text-green-600" : ""}>
                                        Contains special character
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-blue-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-blue-900"
                            >
                                {showPassword ? <PiEyeLight size={20} /> : <PiEyeSlash size={20} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-900 text-white py-2 px-4 rounded-md hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="/login" className="text-sm text-blue-900 hover:underline hover:text-blue-400">
                        Already have an account? Log In
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
