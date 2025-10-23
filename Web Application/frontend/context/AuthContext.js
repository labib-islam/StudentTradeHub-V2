// context/AuthContext.js
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, signup, logout, checkAuth } from '@/libs/auth';

const AuthContext = createContext();
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check if user is logged in on mount
    useEffect(() => {
        checkAuth()
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await fetch(`${API_URL}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                } else {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                localStorage.removeItem('token');
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signup, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};