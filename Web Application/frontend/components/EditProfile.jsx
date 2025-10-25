"use client";
import { useState, useEffect, useRef } from 'react';
import { MdClose, MdCloudUpload } from 'react-icons/md';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import ProtectedRoute from './ProtectedRoute';
import { updateUserInfo, updateUserInfoWithPicture } from '@/libs/utlis';

export default function EditProfile({ isOpen, onClose, userData, onProfileUpdate }) {
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        profile_pic: null
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);


    // Reset form when modal opens/closes or userData changes
    useEffect(() => {
        if (isOpen && userData) {
            setProfileData({
                first_name: userData.firstName || '',
                last_name: userData.lastName || '',
                profile_pic: userData.profilePic || null
            });
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPreviewUrl(userData.profilePic || '');
            setSelectedFile(null);
            setError(null);
            setSuccess(false);
        }
    }, [isOpen, userData]);

    // Check password strength when new password changes
    useEffect(() => {
        const password = passwordData.newPassword;
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
    }, [passwordData.newPassword]);

    const getPasswordStrengthLabel = () => {
        const { score } = passwordStrength;
        if (score <= 2) return { label: 'Weak', color: 'red' };
        if (score <= 4) return { label: 'Good', color: 'orange' };
        return { label: 'Strong', color: 'green' };
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle password input changes
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Toggle password visibility
    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                setError('Please select a valid image file (JPEG, PNG, or WebP)');
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                setError('File size must be less than 5MB');
                return;
            }

            setSelectedFile(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);

            setError('');
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!profileData.first_name.trim()) {
            setError('First name is required');
            return;
        }

        if (!profileData.last_name.trim()) {
            setError('Last name is required');
            return;
        }

        // Validate password fields if any are filled
        const isPasswordFieldFilled = passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword;

        if (isPasswordFieldFilled) {
            if (!passwordData.currentPassword) {
                setError('Current password is required to change password');
                return;
            }

            if (!passwordData.newPassword) {
                setError('New password is required');
                return;
            }

            if (passwordData.newPassword.length < 6) {
                setError('New password must be at least 6 characters long');
                return;
            }

            // Check for password complexity (same as signup)
            const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
            const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
            const hasNumbers = /\d/.test(passwordData.newPassword);

            if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
                setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
                return;
            }

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                setError('New passwords do not match');
                return;
            }
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            let result;

            const userId = userData._id || userData.id;
            console.log('Updating user with ID:', userId);

            const updatePayload = {
                firstName: profileData.first_name.trim(),
                lastName: profileData.last_name.trim()
            };

            // Add password to payload if changing password
            if (isPasswordFieldFilled) {
                updatePayload.currentPassword = passwordData.currentPassword;
                updatePayload.password = passwordData.newPassword;
            }

            // Check if we have a file to upload
            if (selectedFile) {
                // Use the function that handles file upload
                result = await updateUserInfoWithPicture(
                    userId,
                    updatePayload,
                    selectedFile
                );
            } else {
                // Use regular update function
                result = await updateUserInfo(userId, {
                    ...updatePayload,
                    profile_pic: profileData.profile_pic
                });
            }

            const { data, error: updateError } = result;

            if (updateError) {
                throw updateError;
            }

            console.log('Profile updated successfully:', data);
            setSuccess(true);

            // Call the callback function to update parent component
            if (onProfileUpdate && data) {
                onProfileUpdate(data);
            }

            // Close modal after a brief delay to show success message
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 1500);

        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
            window.location.reload();
        }
    };

    // Handle modal close
    const handleClose = () => {
        if (!loading) {
            onClose();
            setError(null);
            setSuccess(false);
            setSelectedFile(null);
            setPreviewUrl(userData?.profile_pic || '');
        }
    };

    // Don't render if modal is not open
    if (!isOpen) return null;

    return (
        <ProtectedRoute>
            <div className="fixed inset-0 bg-slate-400/50 flex items-center justify-center z-50 p-2">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-black">
                        <h2 className="text-xl text-center text-black">Edit Profile</h2>
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="text-slate-400 px-2 hover:text-gray-600 transition-colors disabled:opacity-50"
                        >
                            <MdClose size={24} />
                        </button>
                    </div>

                    {/* Form - with scrollable content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                        <form onSubmit={handleSubmit} className="flex flex-col p-3 space-y-3 bg-white rounded-lg">
                            {/* Profile Picture */}
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Profile Picture
                                </label>

                                {/* Current/Preview Image */}
                                <div className="flex justify-center mb-4">
                                    {previewUrl && (
                                        <img
                                            src={previewUrl}
                                            alt="Profile preview"
                                            className="w-20 h-20 rounded-full object-cover border-2 border-black"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>

                                {/* File Upload Button */}
                                <div className="flex flex-col items-center space-y-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-400 text-slate-800 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-50"
                                    >
                                        <MdCloudUpload size={20} />
                                        <span>Choose New Photo</span>
                                    </button>
                                    {selectedFile && (
                                        <p className="text-sm text-green-400">
                                            New file selected: {selectedFile.name}
                                        </p>
                                    )}
                                    <span className="text-xs text-slate-500">Max size: 5MB (JPEG, PNG, WebP)</span>
                                </div>
                            </div>

                            {/* Email Name */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                                    Email
                                </label>
                                <label htmlFor="email" className="block text-sm font-medium bg-slate-200 px-3 py-2 rounded-lg text-slate-500 mb-2">
                                    {userData?.email}
                                </label>
                            </div>
                            {/* First Name */}
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-black mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={profileData.first_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-700"
                                    placeholder="Enter your first name"
                                />
                            </div>

                            {/* Last Name */}
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-black mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={profileData.last_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-700"
                                    placeholder="Enter your last name"
                                />
                            </div>

                            {/* Change Password Section */}
                            <div className="border-t border-slate-300 pt-4 mt-4">
                                <h3 className="text-sm font-semibold text-black mb-3">Change Password (Optional)</h3>

                                {/* Current Password */}
                                <div className="mb-3">
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-black mb-2">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 pr-10 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-700"
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('current')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                                        >
                                            {showPasswords.current ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="mb-3">
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-black mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            id="newPassword"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 pr-10 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-700"
                                            placeholder="Enter new password (min 6 characters)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('new')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                                        >
                                            {showPasswords.new ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                        </button>
                                    </div>

                                    {/* Password Strength Indicator */}
                                    {passwordData.newPassword && (
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
                                                    className="h-1 rounded transition-all duration-300"
                                                    style={{
                                                        width: `${(passwordStrength.score / 5) * 100}%`,
                                                        backgroundColor: getPasswordStrengthLabel().color
                                                    }}
                                                ></div>
                                            </div>
                                            <ul className="mt-1 text-xs text-gray-600 space-y-1">
                                                <li className={passwordStrength.hasMinLength ? "text-green-600" : ""}>
                                                    ✓ At least 6 characters
                                                </li>
                                                <li className={passwordStrength.hasUpperCase ? "text-green-600" : ""}>
                                                    ✓ Contains uppercase letter
                                                </li>
                                                <li className={passwordStrength.hasLowerCase ? "text-green-600" : ""}>
                                                    ✓ Contains lowercase letter
                                                </li>
                                                <li className={passwordStrength.hasNumber ? "text-green-600" : ""}>
                                                    ✓ Contains number
                                                </li>
                                                <li className={passwordStrength.hasSpecialChar ? "text-green-600" : ""}>
                                                    ✓ Contains special character (optional)
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 pr-10 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-700"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('confirm')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                                        >
                                            {showPasswords.confirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                                    Profile updated successfully!
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 text-white bg-red-700 border border-black rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !profileData.first_name.trim() || !profileData.last_name.trim()}
                                    className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Updating...' : 'Update Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}