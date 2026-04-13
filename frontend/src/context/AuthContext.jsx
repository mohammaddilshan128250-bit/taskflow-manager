import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load user on app start
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            loadUser();
        } else {
            setIsLoading(false);
        }
    }, []);

    const loadUser = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/auth/me');
            setUser(response.data.data.user);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Failed to load user:', error);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await axios.post('http://localhost:5001/api/auth/login', {
                email,
                password
            });

            const { token, user } = response.data.data;

            // Store token
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Update state
            setUser(user);
            setIsAuthenticated(true);

            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const register = async (username, email, password) => {
        try {
            setError(null);
            const response = await axios.post('http://localhost:5001/api/auth/register', {
                username,
                email,
                password
            });

            const { token, user } = response.data.data;

            // Store token
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Update state
            setUser(user);
            setIsAuthenticated(true);

            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Registration failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            await axios.post('http://localhost:5001/api/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        error,
        token: localStorage.getItem('token'),
        login,
        register,
        logout,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};