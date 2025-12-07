import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

interface User {
    _id?: string;
    id?: number;
    name: string;
    email: string;
    role?: 'user' | 'admin';
    hasApiKey?: boolean;
    isVerified?: boolean;
    googleId?: string;
}
// Define the shape of the AuthContext

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount (for persistence)
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/check-auth`, {
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.user) {
                        setUser(data.user);
                        // Persist user to localStorage
                        localStorage.setItem('user', JSON.stringify(data.user));
                    } else {
                        // Clear if auth check fails
                        setUser(null);
                        localStorage.removeItem('user');
                    }
                } else {
                    setUser(null);
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setUser(null);
                localStorage.removeItem('user');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Sync Logout across tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'logout-event') {
                setUser(null);
                localStorage.removeItem('user');
            }
            if (e.key === 'login-event' && e.newValue) {
                try {
                    const newUser = JSON.parse(e.newValue);
                    setUser(newUser);
                } catch (e) {
                    console.error("Failed to parse login event", e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = (newUser: User) => {
        setUser(newUser);
        // Persist to localStorage
        localStorage.setItem('user', JSON.stringify(newUser));
        // Sync across tabs
        localStorage.setItem('login-event', JSON.stringify(newUser));
        localStorage.removeItem('login-event'); // Trigger event
    };

    const logout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.error("Logout failed", e);
        }
        setUser(null);
        localStorage.removeItem('user');
        localStorage.setItem('logout-event', Date.now().toString());
    };

    return (
        <AuthContext.Provider value={{ user, token: null, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
