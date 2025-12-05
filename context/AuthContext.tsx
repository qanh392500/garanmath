import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role?: 'user' | 'admin';
    hasApiKey?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            console.error("Failed to parse user from local storage", e);
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/auth/me', {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("AuthContext: Cookie valid, user:", data.user.email);
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                } else {
                    if (response.status === 401 || response.status === 403) {
                        console.warn("AuthContext: Cookie invalid (401/403), clearing.");
                        setUser(null);
                        localStorage.removeItem('user');
                    }
                }
            } catch (error) {
                console.error("AuthContext: Auth check failed (Network/Server Error):", error);
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    // Sync Logout across tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user' && e.newValue === null) {
                console.log("AuthContext: User removed in another tab. Logging out.");
                setUser(null);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = (newToken: string, newUser: User) => {
        console.log("AuthContext: Login called.");
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const logout = async () => {
        try {
            await fetch('http://localhost:3001/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.error("Logout failed", e);
        }
        setUser(null);
        localStorage.removeItem('user');
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
