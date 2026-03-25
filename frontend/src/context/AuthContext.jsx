import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await api.get('/auth/profile');
            setUser(response.data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        setUser(response.data.user);
        return response.data;
    };

    const register = async (name, email, password, role, department = '', designation = '', gender = 'male') => {
        const response = await api.post('/auth/register', { name, email, password, role, department, designation, gender });
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        await api.get('/auth/logout');
        setUser(null);
    };

    const value = {
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isEmployee: user?.role === 'employee',
        isManager: user?.role === 'manager',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
