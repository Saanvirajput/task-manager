'use client';

import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (data: any) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
    };

    const syncUser = async () => {
        try {
            const api = (await import('@/lib/api')).default;
            const res = await api.get('/auth/me');
            localStorage.setItem('user', JSON.stringify(res.data));
            setUser(res.data);
        } catch (err) {
            console.error('Failed to sync user', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, syncUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
