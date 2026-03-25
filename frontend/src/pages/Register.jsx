import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        role: 'employee', department: '', designation: '', gender: 'male'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
        if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            const data = await register(
                formData.name, formData.email, formData.password,
                formData.role, formData.department, formData.designation, formData.gender
            );
            navigate(data.user.role === 'employee' ? '/employee-dashboard' : '/manager-dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-left-content">
                    <div className="auth-logo">🏢</div>
                    <div className="auth-app-name">E-Leave</div>
                    <div className="auth-app-desc">
                        Create your account and start managing leaves efficiently
                    </div>
                    <ul className="auth-features">
                        <li className="auth-feature-item"><span className="auth-feature-icon">✅</span> Multi-level approval workflow</li>
                        <li className="auth-feature-item"><span className="auth-feature-icon">📊</span> Real-time balance tracking</li>
                        <li className="auth-feature-item"><span className="auth-feature-icon">🎉</span> Holiday calendar integration</li>
                        <li className="auth-feature-item"><span className="auth-feature-icon">🔔</span> Instant notifications</li>
                        <li className="auth-feature-item"><span className="auth-feature-icon">📈</span> Analytics &amp; reports</li>
                    </ul>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-form-box">
                    <div className="auth-form-title">Create Account</div>
                    <div className="auth-form-subtitle">Join your company's leave management portal</div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit} autoComplete="on">
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input className="form-control" type="text" name="name" value={formData.name}
                                    onChange={handleChange} required placeholder="John Doe"
                                    autoComplete="name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role *</label>
                                <select className="form-control" name="role" value={formData.role} onChange={handleChange}>
                                    <option value="employee">Employee</option>
                                    <option value="manager">Manager</option>
                                </select>
                            </div>
                        </div>

                        {/* Gender Field */}
                        <div className="form-group">
                            <label className="form-label">Gender *
                                <span style={{ fontWeight: 400, color: 'var(--gray-500)', fontSize: 11, marginLeft: 6 }}>
                                    (determines Maternity / Paternity leave eligibility)
                                </span>
                            </label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {[
                                    { value: 'male', label: '👨 Male' },
                                    { value: 'female', label: '👩 Female' },
                                    { value: 'other', label: '🧑 Other' }
                                ].map(opt => (
                                    <label key={opt.value} style={{
                                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                                        border: `2px solid ${formData.gender === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                                        background: formData.gender === opt.value ? 'var(--primary-50, #eef2ff)' : 'white',
                                        transition: 'all 0.2s', userSelect: 'none'
                                    }}>
                                        <input type="radio" name="gender" value={opt.value}
                                            checked={formData.gender === opt.value}
                                            onChange={handleChange}
                                            style={{ display: 'none' }} />
                                        <span style={{ fontSize: 20, marginBottom: 3 }}>{opt.label.split(' ')[0]}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-800)' }}>{opt.label.split(' ').slice(1).join(' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address *</label>
                            <input className="form-control" type="email" name="email" value={formData.email}
                                onChange={handleChange} required placeholder="you@company.com"
                                autoComplete="username" />
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Department</label>
                                <input className="form-control" type="text" name="department" value={formData.department}
                                    onChange={handleChange} placeholder="e.g. Engineering" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Designation</label>
                                <input className="form-control" type="text" name="designation" value={formData.designation}
                                    onChange={handleChange} placeholder="e.g. Software Engineer" />
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Password *</label>
                                <input className="form-control" type="password" name="password" value={formData.password}
                                    onChange={handleChange} required placeholder="••••••••" minLength="6"
                                    autoComplete="new-password" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password *</label>
                                <input className="form-control" type="password" name="confirmPassword" value={formData.confirmPassword}
                                    onChange={handleChange} required placeholder="••••••••"
                                    autoComplete="new-password" />
                            </div>
                        </div>



                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                            {loading ? 'Creating account...' : '→ Create Account'}
                        </button>
                    </form>

                    <div className="auth-form-footer">
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">Sign in here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
