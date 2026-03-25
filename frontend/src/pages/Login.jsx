import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(email, password);
            if (data.user.role === 'employee') navigate('/employee-dashboard');
            else navigate('/manager-dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            {/* ──────────────────────────────────────────────
                LEFT PANEL
            ────────────────────────────────────────────── */}
            <div className="auth-left">
                <div className="auth-left-content">
                    <div className="auth-logo">🏢</div>
                    <div className="auth-app-name">E-Leave</div>
                    <div className="auth-app-desc">
                        Enterprise-grade Leave Management System for modern workplaces
                    </div>
                    <ul className="auth-features">
                        <li className="auth-feature-item"><span className="auth-feature-icon">📋</span> 9 Leave Types (CL, SL, EL, ML, CO...)</li>
                        <li className="auth-feature-item"><span className="auth-feature-icon">🕐</span> Attendance Clock-In / Clock-Out</li>
                        <li className="auth-feature-item"><span className="auth-feature-icon">📅</span> Interactive Leave Calendar</li>
                        <li className="auth-feature-item"><span className="auth-feature-icon">📊</span> Reports &amp; Analytics</li>
                        <li className="auth-feature-item"><span className="auth-feature-icon">🔔</span> Real-time Notifications</li>
                        <li className="auth-feature-item"><span className="auth-feature-icon">🎉</span> Public Holiday Management</li>
                    </ul>
                </div>
            </div>

            {/* ──────────────────────────────────────────────
                RIGHT PANEL — LOGIN FORM
            ────────────────────────────────────────────── */}
            <div className="auth-right">
                <div className="auth-form-box">
                    <div className="auth-form-title">Welcome back 👋</div>
                    <div className="auth-form-subtitle">Sign in to your E-Leave account</div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit} autoComplete="on">
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                className="form-control"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="you@company.com"
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                className="form-control"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                            {loading ? 'Signing in...' : '→ Sign In'}
                        </button>
                    </form>

                    <div className="auth-form-footer">
                        Don't have an account?{' '}
                        <Link to="/register" className="auth-link">Register here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
