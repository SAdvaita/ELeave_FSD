const checkAuth = async () => {
    try {
        const response = await api.get('/api/auth/profile');
        setUser(response.data.user);
    } catch (error) {
        setUser(null);
    } finally {
        setLoading(false);
    }
};

const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    setUser(response.data.user);
    return response.data;
};

const register = async (name, email, password, role, department = '', designation = '', gender = 'male') => {
    const response = await api.post('/api/auth/register', { name, email, password, role, department, designation, gender });
    setUser(response.data.user);
    return response.data;
};

const logout = async () => {
    await api.get('/api/auth/logout');
    setUser(null);
};