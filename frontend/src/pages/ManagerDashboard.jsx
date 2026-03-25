import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const LEAVE_ICONS = { CL: '🏖️', SL: '🤒', EL: '🌴', ML: '🤱', PL: '👨‍👶', CO: '⏱️', LWP: '💼', BL: '🕊️', SBL: '📚' };
const LEAVE_TYPE_NAMES = { CL: 'Casual Leave', SL: 'Sick Leave', EL: 'Earned Leave', ML: 'Maternity Leave', PL: 'Paternity Leave', CO: 'Comp-Off', LWP: 'Leave Without Pay', BL: 'Bereavement', SBL: 'Study Leave' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const NAV = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'leaves', label: 'Leave Requests', icon: '📝' },
    { id: 'wfh', label: 'WFH Requests', icon: '🏠' },
    { id: 'meetings', label: 'Meetings', icon: '📹' },
    { id: 'attendance', label: "Today's Attendance", icon: '🕐' },
    { id: 'balances', label: 'Leave Balances', icon: '💰' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'holidays', label: 'Manage Holidays', icon: '🎉' },
];

const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = d => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const ManagerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState('overview');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Data
    const [leaves, setLeaves] = useState([]);
    const [balances, setBalances] = useState([]);
    const [todayAtt, setTodayAtt] = useState([]);
    const [stats, setStats] = useState(null);
    const [holidays, setHolidays] = useState([]);
    const [wfhRequests, setWfhRequests] = useState([]);
    const [wfhStatusFilter, setWfhStatusFilter] = useState('all');
    const [wfhMsg, setWfhMsg] = useState({ type: '', text: '' });
    const [meetings, setMeetings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [meetForm, setMeetForm] = useState({ title: '', description: '', scheduledAt: '', participantIds: [] });
    const [meetMsg, setMeetMsg] = useState({ type: '', text: '' });
    const [meetLoading, setMeetLoading] = useState(false);
    const [activeMeetingRoom, setActiveMeetingRoom] = useState(null);
    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');

    // Reject modal
    const [rejectModal, setRejectModal] = useState({ open: false, leaveId: null, reason: '' });

    // Holiday form
    const [holForm, setHolForm] = useState({ name: '', date: '', type: 'national', description: '' });
    const [holMsg, setHolMsg] = useState({ type: '', text: '' });
    const [holLoading, setHolLoading] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'manager') { navigate('/login'); return; }
        fetchAll();
    }, [user, navigate]);

    useEffect(() => {
        if (!loading) fetchLeaves();
    }, [statusFilter]);

    const fetchAll = async () => {
        try {
            const [lR, bR, aR, sR, hR, wR, mR, eR] = await Promise.all([
                api.get('/leaves/all'),
                api.get('/balance/all'),
                api.get('/attendance/all'),
                api.get('/reports/overview').catch(() => ({ data: null })),
                api.get('/holidays'),
                api.get('/wfh/all'),
                api.get('/meetings'),
                api.get('/meetings/employees'),
            ]);
            setLeaves(lR.data.leaves || []);
            setBalances(bR.data.employees || []);
            setTodayAtt(aR.data.attendance || []);
            setStats(sR.data);
            setHolidays(hR.data.holidays || []);
            setWfhRequests(wR.data.wfhRequests || []);
            setMeetings(mR.data.meetings || []);
            setEmployees(eR.data.employees || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchWfhRequests = async () => {
        try {
            let url = '/wfh/all';
            if (wfhStatusFilter !== 'all') url += `?status=${wfhStatusFilter}`;
            const r = await api.get(url);
            setWfhRequests(r.data.wfhRequests || []);
        } catch (e) { console.error(e); }
    };

    const handleApproveWfh = async (id) => {
        setWfhMsg({ type: '', text: '' });
        try {
            const r = await api.put(`/wfh/${id}/approve`);
            setWfhMsg({ type: 'success', text: r.data.message });
            fetchWfhRequests();
        } catch (e) { setWfhMsg({ type: 'error', text: e.response?.data?.message || 'Failed' }); }
    };

    const handleRejectWfh = async (id) => {
        const reason = window.prompt('Rejection reason (optional):') || '';
        setWfhMsg({ type: '', text: '' });
        try {
            const r = await api.put(`/wfh/${id}/reject`, { rejectionReason: reason });
            setWfhMsg({ type: 'success', text: r.data.message });
            fetchWfhRequests();
        } catch (e) { setWfhMsg({ type: 'error', text: e.response?.data?.message || 'Failed' }); }
    };

    const handleScheduleMeeting = async (e) => {
        e.preventDefault();
        setMeetLoading(true); setMeetMsg({ type: '', text: '' });
        try {
            const r = await api.post('/meetings/schedule', meetForm);
            setMeetMsg({ type: 'success', text: r.data.message });
            setMeetForm({ title: '', description: '', scheduledAt: '', participantIds: [] });
            const mr = await api.get('/meetings');
            setMeetings(mr.data.meetings || []);
        } catch (e) { setMeetMsg({ type: 'error', text: e.response?.data?.message || 'Failed to schedule' }); }
        finally { setMeetLoading(false); }
    };

    const handleDeleteMeeting = async (id) => {
        if (!window.confirm('Delete this meeting?')) return;
        try {
            await api.delete(`/meetings/${id}`);
            setMeetings(m => m.filter(x => x._id !== id));
        } catch (e) { alert('Failed to delete'); }
    };

    const fetchLeaves = async () => {
        try {
            let url = '/leaves/all?';
            if (statusFilter !== 'all') url += `status=${statusFilter}`;
            const r = await api.get(url);
            setLeaves(r.data.leaves || []);
        } catch (e) { console.error(e); }
    };

    const handleApprove = async (id) => {
        setMessage({ type: '', text: '' });
        try {
            const r = await api.put(`/leaves/${id}/approve`);
            setMessage({ type: 'success', text: r.data.message });
            fetchLeaves();
        } catch (e) { setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to approve' }); }
    };

    const openRejectModal = (id) => setRejectModal({ open: true, leaveId: id, reason: '' });

    const handleReject = async () => {
        setMessage({ type: '', text: '' });
        try {
            const r = await api.put(`/leaves/${rejectModal.leaveId}/reject`, { rejectionReason: rejectModal.reason });
            setMessage({ type: 'success', text: r.data.message });
            setRejectModal({ open: false, leaveId: null, reason: '' });
            fetchLeaves();
        } catch (e) { setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to reject' }); }
    };

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        setHolLoading(true); setHolMsg({ type: '', text: '' });
        try {
            const r = await api.post('/holidays', holForm);
            setHolMsg({ type: 'success', text: r.data.message });
            setHolForm({ name: '', date: '', type: 'national', description: '' });
            const hR = await api.get('/holidays');
            setHolidays(hR.data.holidays || []);
        } catch (e) { setHolMsg({ type: 'error', text: e.response?.data?.message || 'Failed to add' }); }
        finally { setHolLoading(false); }
    };

    const handleSeedHolidays = async () => {
        setHolLoading(true);
        try {
            const r = await api.post('/holidays/seed');
            setHolMsg({ type: 'success', text: r.data.message });
            const hR = await api.get('/holidays');
            setHolidays(hR.data.holidays || []);
        } catch (e) { setHolMsg({ type: 'error', text: 'Failed to seed' }); }
        finally { setHolLoading(false); }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm('Delete this holiday?')) return;
        try {
            await api.delete(`/holidays/${id}`);
            setHolidays(h => h.filter(x => x._id !== id));
        } catch (e) { alert('Failed to delete'); }
    };

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    const pending = leaves.filter(l => l.status === 'pending').length;
    const approved = leaves.filter(l => l.status === 'approved').length;
    const rejected = leaves.filter(l => l.status === 'rejected').length;

    return (
        <div className="app-layout">
            {/* ========= SIDEBAR ========= */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">🏢</div>
                    <div className="sidebar-logo-text">
                        <span className="sidebar-logo-name">E-Leave</span>
                        <span className="sidebar-logo-sub">Manager Portal</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Management</div>
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            className={`sidebar-item ${tab === item.id ? 'active' : ''}`}
                            onClick={() => setTab(item.id)}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span>{item.label}</span>
                            {item.id === 'leaves' && pending > 0 && (
                                <span className="sidebar-badge">{pending}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ position: 'relative' }}>
                    <div className="sidebar-user" style={{ cursor: 'pointer' }} onClick={() => setShowUserMenu(m => !m)}>
                        <div className="sidebar-user-avatar">
                            {user?.profilePicture
                                ? <img src={`http://localhost:8080/${user.profilePicture}`} alt="Profile" />
                                : user?.name?.charAt(0)?.toUpperCase()
                            }
                        </div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.name}</div>
                            <div className="sidebar-user-role">{user?.role}</div>
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)', userSelect: 'none' }}>▲</span>
                    </div>
                    {showUserMenu && (
                        <div style={{
                            position: 'absolute', bottom: 80, left: 12, right: 12,
                            background: 'white', borderRadius: 'var(--radius)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                            border: '1px solid var(--border)', zIndex: 100, overflow: 'hidden'
                        }}>
                            <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>
                                Signed in as <strong>{user?.name}</strong>
                            </div>
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <button
                                style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, color: '#dc2626', fontWeight: 600 }}
                                onClick={async () => { await logout(); navigate('/login'); }}
                            >⏏ Logout</button>
                        </div>
                    )}
                </div>
            </aside>

            {/* ========= MAIN ========= */}
            <div className="main-content">
                <div className="topnav">
                    <div className="topnav-left">
                        <div className="topnav-title">{NAV.find(n => n.id === tab)?.label}</div>
                        <div className="topnav-subtitle">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                    <div className="topnav-right">
                        <span className={`badge badge-manager`}>Manager</span>
                        <div className="avatar-sm">{user?.name?.charAt(0)?.toUpperCase()}</div>
                    </div>
                </div>

                <div className="page-content">

                    {/* GLOBAL MESSAGE */}
                    {message.text && (
                        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* OVERVIEW TAB */}
                    {/* ============================================================ */}
                    {tab === 'overview' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <div className="page-title">Manager Overview</div>
                                    <div className="page-subtitle">Team leave and attendance at a glance</div>
                                </div>
                                <button className="btn btn-primary" onClick={() => setTab('leaves')}>
                                    Review Requests {pending > 0 && `(${pending})`}
                                </button>
                            </div>

                            <div className="stat-grid">
                                <div className="stat-card">
                                    <div className="stat-icon stat-icon-amber">⏳</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{pending}</div>
                                        <div className="stat-label">Pending Approvals</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon stat-icon-green">✅</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{approved}</div>
                                        <div className="stat-label">Approved Leaves</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon stat-icon-red">❌</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{rejected}</div>
                                        <div className="stat-label">Rejected</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon stat-icon-blue">👥</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{todayAtt.length}</div>
                                        <div className="stat-label">Present Today</div>
                                    </div>
                                </div>
                            </div>

                            {/* Leave type distribution */}
                            {stats?.typeDistribution?.length > 0 && (
                                <div className="card mb-5">
                                    <div className="card-header-row">
                                        <div className="card-title">Leave Distribution by Type</div>
                                    </div>
                                    <div className="card-body">
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                                            {stats.typeDistribution.map(t => (
                                                <div key={t._id} style={{ textAlign: 'center', padding: '14px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                                    <div style={{ fontSize: 22, marginBottom: 4 }}>{LEAVE_ICONS[t._id] || '📋'}</div>
                                                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-800)' }}>{t.count}</div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>{t._id}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t.totalDays}d taken</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent pending leaves */}
                            <div className="card">
                                <div className="card-header-row">
                                    <div className="card-title">Pending Approvals</div>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setTab('leaves')}>View All</button>
                                </div>
                                {leaves.filter(l => l.status === 'pending').length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">✅</div>
                                        <div className="empty-title">All caught up!</div>
                                        <div className="empty-desc">No pending leave requests</div>
                                    </div>
                                ) : (
                                    <div className="table-wrap">
                                        <table>
                                            <thead><tr>
                                                <th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Action</th>
                                            </tr></thead>
                                            <tbody>
                                                {leaves.filter(l => l.status === 'pending').slice(0, 5).map(l => (
                                                    <tr key={l._id}>
                                                        <td>
                                                            <div className="td-primary">{l.employeeId?.name}</div>
                                                            <div className="td-secondary">{l.employeeId?.department}</div>
                                                        </td>
                                                        <td><span className={`badge badge-${l.leaveType}`}>{LEAVE_ICONS[l.leaveType]} {l.leaveType}</span></td>
                                                        <td className="text-sm">{fmt(l.startDate)} — {fmt(l.endDate)}</td>
                                                        <td className="font-semibold">{l.numberOfDays}d</td>
                                                        <td>
                                                            <div className="flex gap-2">
                                                                <button className="btn btn-sm btn-success" onClick={() => handleApprove(l._id)}>✓ Approve</button>
                                                                <button className="btn btn-sm btn-danger" onClick={() => openRejectModal(l._id)}>✗ Reject</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* LEAVE REQUESTS TAB */}
                    {/* ============================================================ */}
                    {tab === 'leaves' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <div className="page-title">Leave Requests</div>
                                    <div className="page-subtitle">{leaves.length} total records</div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header-row" style={{ flexWrap: 'wrap', gap: 12 }}>
                                    <div className="filter-bar">
                                        {['all', 'pending', 'approved', 'rejected'].map(s => (
                                            <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
                                                onClick={() => setStatusFilter(s)}>
                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {leaves.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📝</div>
                                        <div className="empty-title">No leave requests found</div>
                                    </div>
                                ) : (
                                    <div className="table-wrap">
                                        <table>
                                            <thead><tr>
                                                <th>Employee</th><th>Type</th><th>Start</th><th>End</th>
                                                <th>Days</th><th>Reason</th><th>Balance</th><th>Status</th><th>Actions</th>
                                            </tr></thead>
                                            <tbody>
                                                {leaves.map(l => (
                                                    <tr key={l._id}>
                                                        <td>
                                                            <div className="td-primary">{l.employeeId?.name}</div>
                                                            <div className="td-secondary">{l.employeeId?.email}</div>
                                                        </td>
                                                        <td><span className={`badge badge-${l.leaveType}`}>{LEAVE_ICONS[l.leaveType]} {l.leaveType}</span></td>
                                                        <td>{fmt(l.startDate)}</td>
                                                        <td>{fmt(l.endDate)}</td>
                                                        <td className="font-semibold">{l.numberOfDays}{l.isHalfDay ? '(½)' : 'd'}</td>
                                                        <td style={{ maxWidth: 140, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: 12 }}>{l.reason}</td>
                                                        <td className="font-semibold">{l.employeeId?.leaveBalances?.[l.leaveType] ?? l.employeeId?.leaveBalance ?? '—'}d</td>
                                                        <td>
                                                            <span className={`badge badge-${l.status}`}>{l.status}</span>
                                                            {l.rejectionReason && <div className="text-sm text-muted mt-1">{l.rejectionReason}</div>}
                                                        </td>
                                                        <td>
                                                            {l.status === 'pending' && (
                                                                <div className="flex gap-2">
                                                                    <button className="btn btn-sm btn-success" onClick={() => handleApprove(l._id)}>✓</button>
                                                                    <button className="btn btn-sm btn-danger" onClick={() => openRejectModal(l._id)}>✗</button>
                                                                </div>
                                                            )}
                                                            {l.status !== 'pending' && (
                                                                <span className="text-sm text-muted">{l.reviewedBy?.name || '—'}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* ATTENDANCE TAB */}
                    {/* ============================================================ */}
                    {tab === 'attendance' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <div className="page-title">Today's Attendance</div>
                                    <div className="page-subtitle">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                                </div>
                                <div className="stat-card" style={{ margin: 0, padding: '12px 20px' }}>
                                    <div className="stat-icon stat-icon-green" style={{ width: 36, height: 36, fontSize: 16 }}>✅</div>
                                    <div className="stat-info">
                                        <div className="stat-value" style={{ fontSize: 20 }}>{todayAtt.length}</div>
                                        <div className="stat-label">Present</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                {todayAtt.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">🕐</div>
                                        <div className="empty-title">No employees clocked in yet</div>
                                    </div>
                                ) : (
                                    <div className="table-wrap">
                                        <table>
                                            <thead><tr>
                                                <th>Employee</th><th>Clock In</th><th>Clock Out</th><th>Total Hours</th><th>Status</th>
                                            </tr></thead>
                                            <tbody>
                                                {todayAtt.map(r => (
                                                    <tr key={r._id}>
                                                        <td>
                                                            <div className="td-primary">{r.employeeId?.name}</div>
                                                            <div className="td-secondary">{r.employeeId?.email}</div>
                                                        </td>
                                                        <td className="font-semibold">{fmtTime(r.clockIn)}</td>
                                                        <td>{fmtTime(r.clockOut)}</td>
                                                        <td className="font-semibold">{r.totalHours || '—'}h</td>
                                                        <td>
                                                            <span className={`badge ${r.clockOut ? 'badge-approved' : 'badge-pending'}`}>
                                                                {r.clockOut ? '✓ Done' : '● Working'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* LEAVE BALANCES TAB */}
                    {/* ============================================================ */}
                    {tab === 'balances' && (
                        <>
                            <div className="page-header">
                                <div className="page-title">Employee Leave Balances</div>
                            </div>
                            <div className="card">
                                {balances.length === 0 ? (
                                    <div className="empty-state"><div className="empty-icon">💰</div><div className="empty-title">No employees found</div></div>
                                ) : (
                                    <div className="table-wrap">
                                        <table>
                                            <thead><tr>
                                                <th>Employee</th><th>Dept</th>
                                                {Object.keys(LEAVE_ICONS).map(k => (
                                                    <th key={k} title={LEAVE_TYPE_NAMES[k]}>{LEAVE_ICONS[k]} {k}</th>
                                                ))}
                                            </tr></thead>
                                            <tbody>
                                                {balances.map(emp => (
                                                    <tr key={emp._id}>
                                                        <td>
                                                            <div className="td-primary">{emp.name}</div>
                                                            <div className="td-secondary">{emp.email}</div>
                                                        </td>
                                                        <td className="text-sm text-muted">{emp.department || '—'}</td>
                                                        {Object.keys(LEAVE_ICONS).map(k => (
                                                            <td key={k} className="font-semibold" style={{ textAlign: 'center' }}>
                                                                {emp.leaveBalances?.[k] ?? 0}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* REPORTS TAB */}
                    {/* ============================================================ */}
                    {tab === 'reports' && (
                        <>
                            <div className="page-header">
                                <div className="page-title">Reports & Analytics</div>
                            </div>

                            <div className="stat-grid mb-5">
                                <div className="stat-card">
                                    <div className="stat-icon stat-icon-blue">📋</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats?.totalLeaves || 0}</div>
                                        <div className="stat-label">Total Leave Requests</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon stat-icon-green">👥</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats?.totalEmployees || 0}</div>
                                        <div className="stat-label">Total Employees</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon stat-icon-amber">⏳</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats?.pendingLeaves || 0}</div>
                                        <div className="stat-label">Pending Reviews</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon stat-icon-purple">📊</div>
                                    <div className="stat-info">
                                        <div className="stat-value">
                                            {stats?.totalLeaves > 0 ? Math.round((stats.approvedLeaves / stats.totalLeaves) * 100) : 0}%
                                        </div>
                                        <div className="stat-label">Approval Rate</div>
                                    </div>
                                </div>
                            </div>

                            {/* Type distribution */}
                            <div className="card mb-5">
                                <div className="card-header-row"><div className="card-title">Leave Type Distribution</div></div>
                                <div className="card-body">
                                    {stats?.typeDistribution?.length > 0 ? (
                                        <div>
                                            {stats.typeDistribution.map(t => {
                                                const pct = stats.totalLeaves > 0 ? Math.round((t.count / stats.totalLeaves) * 100) : 0;
                                                return (
                                                    <div key={t._id} style={{ marginBottom: 14 }}>
                                                        <div className="flex-between mb-2">
                                                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                                                                {LEAVE_ICONS[t._id]} {t.name || t._id}
                                                            </span>
                                                            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                                                                {t.count} requests · {t.totalDays} days
                                                            </span>
                                                        </div>
                                                        <div style={{ background: 'var(--gray-100)', borderRadius: 20, height: 8, overflow: 'hidden' }}>
                                                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 20, transition: 'width 0.5s ease' }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">📊</div>
                                            <div className="empty-title">No data yet</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Monthly Trend */}
                            <div className="card">
                                <div className="card-header-row"><div className="card-title">Monthly Leave Trend ({new Date().getFullYear()})</div></div>
                                <div className="card-body">
                                    {stats?.monthlyTrend?.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8, alignItems: 'end', height: 120 }}>
                                            {Array(12).fill(null).map((_, i) => {
                                                const entry = stats.monthlyTrend?.find(m => m._id === i + 1);
                                                const count = entry?.count || 0;
                                                const max = Math.max(...(stats.monthlyTrend?.map(m => m.count) || [1]), 1);
                                                const height = `${Math.max(8, (count / max) * 100)}%`;
                                                const isCurrentMonth = i === new Date().getMonth();
                                                return (
                                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 4 }}>{count || ''}</div>
                                                        <div style={{
                                                            width: '100%',
                                                            height,
                                                            background: isCurrentMonth ? 'var(--primary)' : 'var(--primary-100)',
                                                            borderRadius: '4px 4px 0 0',
                                                            transition: 'height 0.5s ease'
                                                        }}></div>
                                                        <div style={{ fontSize: 10, color: 'var(--gray-500)', marginTop: 4 }}>{MONTHS[i]}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="empty-state"><div className="empty-icon">📈</div><div className="empty-title">No trend data yet</div></div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* WFH REQUESTS TAB */}
                    {/* ============================================================ */}
                    {tab === 'wfh' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <div className="page-title">🏠 WFH Requests</div>
                                    <div className="page-subtitle">Approve or reject employee Work From Home requests</div>
                                </div>
                            </div>
                            {wfhMsg.text && (
                                <div className={`alert alert-${wfhMsg.type === 'success' ? 'success' : 'error'}`}>{wfhMsg.text}</div>
                            )}
                            <div className="card">
                                <div className="card-header-row" style={{ flexWrap: 'wrap', gap: 12 }}>
                                    <div className="filter-bar">
                                        {['all', 'pending', 'approved', 'rejected'].map(s => (
                                            <button key={s}
                                                className={`filter-chip ${wfhStatusFilter === s ? 'active' : ''}`}
                                                onClick={() => { setWfhStatusFilter(s); }}>
                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    <button className="btn btn-sm btn-secondary" onClick={fetchWfhRequests}>Refresh</button>
                                </div>
                                {wfhRequests.filter(w => wfhStatusFilter === 'all' || w.status === wfhStatusFilter).length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">🏠</div>
                                        <div className="empty-title">No WFH requests found</div>
                                    </div>
                                ) : (
                                    <div className="table-wrap">
                                        <table>
                                            <thead><tr>
                                                <th>Employee</th><th>Date</th><th>Reason</th><th>Status</th><th>Actions</th>
                                            </tr></thead>
                                            <tbody>
                                                {wfhRequests
                                                    .filter(w => wfhStatusFilter === 'all' || w.status === wfhStatusFilter)
                                                    .map(w => (
                                                    <tr key={w._id}>
                                                        <td>
                                                            <div className="td-primary">{w.employeeId?.name}</div>
                                                            <div className="td-secondary">{w.employeeId?.department}</div>
                                                        </td>
                                                        <td>{fmt(w.date)}</td>
                                                        <td style={{ maxWidth: 200, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: 12 }}>{w.reason}</td>
                                                        <td><span className={`badge badge-${w.status}`}>{w.status}</span></td>
                                                        <td>
                                                            {w.status === 'pending' && (
                                                                <div className="flex gap-2">
                                                                    <button className="btn btn-sm btn-success" onClick={() => handleApproveWfh(w._id)}>✓ Approve</button>
                                                                    <button className="btn btn-sm btn-danger" onClick={() => handleRejectWfh(w._id)}>✗ Reject</button>
                                                                </div>
                                                            )}
                                                            {w.status !== 'pending' && (
                                                                <span className="text-sm text-muted">{w.reviewedBy?.name || '—'}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* MEETINGS TAB */}
                    {/* ============================================================ */}
                    {tab === 'meetings' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <div className="page-title">📹 Video Meetings</div>
                                    <div className="page-subtitle">Schedule and manage Jitsi video meetings</div>
                                </div>
                            </div>

                            {/* Active Jitsi Room */}
                            {activeMeetingRoom && (
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <div style={{ fontWeight: 700, fontSize: 16 }}>📹 In Meeting: {activeMeetingRoom.title}</div>
                                        <button className="btn btn-danger" onClick={() => setActiveMeetingRoom(null)}>✕ Leave Meeting</button>
                                    </div>
                                    <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', height: 520 }}>
                                        <iframe
                                            src={`https://meet.jit.si/${activeMeetingRoom.roomName}#userInfo.displayName="${encodeURIComponent(user?.name || 'Manager')}"`}
                                            style={{ width: '100%', height: '100%', border: 'none' }}
                                            allow="camera; microphone; fullscreen; display-capture"
                                            title="Jitsi Meeting"
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
                                {/* Meetings List */}
                                <div className="card">
                                    <div className="card-header-row">
                                        <div className="card-title">All Meetings</div>
                                    </div>
                                    {meetings.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-icon">📹</div>
                                            <div className="empty-title">No meetings yet</div>
                                            <div className="empty-desc">Schedule a meeting using the form</div>
                                        </div>
                                    ) : (
                                        <div className="table-wrap">
                                            <table>
                                                <thead><tr>
                                                    <th>Title</th><th>Scheduled</th><th>Participants</th><th>Actions</th>
                                                </tr></thead>
                                                <tbody>
                                                    {meetings.map(m => (
                                                        <tr key={m._id}>
                                                            <td className="td-primary">{m.title}</td>
                                                            <td>{new Date(m.scheduledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                                            <td className="text-sm text-muted">{m.participants?.length || 0} people</td>
                                                            <td>
                                                                <div className="flex gap-2">
                                                                    <button className="btn btn-sm btn-primary" onClick={() => setActiveMeetingRoom(m)}>📹 Join</button>
                                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteMeeting(m._id)}>✕</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Schedule Form */}
                                <div className="card" style={{ alignSelf: 'start' }}>
                                    <div className="card-header-row"><div className="card-title">Schedule Meeting</div></div>
                                    <div className="card-body">
                                        {meetMsg.text && (
                                            <div className={`alert alert-${meetMsg.type === 'success' ? 'success' : 'error'}`}>{meetMsg.text}</div>
                                        )}
                                        <form onSubmit={handleScheduleMeeting}>
                                            <div className="form-group">
                                                <label className="form-label">Title *</label>
                                                <input className="form-control" placeholder="e.g. Leave Review Meeting"
                                                    value={meetForm.title}
                                                    onChange={e => setMeetForm({ ...meetForm, title: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Date & Time *</label>
                                                <input type="datetime-local" className="form-control"
                                                    value={meetForm.scheduledAt}
                                                    onChange={e => setMeetForm({ ...meetForm, scheduledAt: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Participants</label>
                                                <select className="form-control" multiple style={{ height: 120 }}
                                                    value={meetForm.participantIds}
                                                    onChange={e => setMeetForm({ ...meetForm, participantIds: Array.from(e.target.selectedOptions, o => o.value) })}>
                                                    {employees.map(emp => (
                                                        <option key={emp._id} value={emp._id}>{emp.name} ({emp.department || 'General'})</option>
                                                    ))}
                                                </select>
                                                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>Hold Ctrl/Cmd to select multiple</div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Description</label>
                                                <input className="form-control" placeholder="Optional agenda..."
                                                    value={meetForm.description}
                                                    onChange={e => setMeetForm({ ...meetForm, description: e.target.value })} />
                                            </div>
                                            <button type="submit" className="btn btn-primary w-full" disabled={meetLoading}>
                                                {meetLoading ? 'Scheduling...' : '📹 Schedule Meeting'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* HOLIDAYS MANAGEMENT TAB */}
                    {/* ============================================================ */}
                    {tab === 'holidays' && (
                        <>
                            <div className="page-header">
                                <div className="page-title">Manage Holidays</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                                {/* Holiday list */}
                                <div className="card">
                                    <div className="card-header-row">
                                        <div className="card-title">Holiday Calendar</div>
                                        <button className="btn btn-sm btn-secondary" onClick={handleSeedHolidays} disabled={holLoading}>
                                            🌱 Seed Defaults
                                        </button>
                                    </div>
                                    {holMsg.text && (
                                        <div className={`alert alert-${holMsg.type === 'success' ? 'success' : 'error'}`} style={{ margin: '12px 20px 0' }}>
                                            {holMsg.text}
                                        </div>
                                    )}
                                    {holidays.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-icon">🎉</div>
                                            <div className="empty-title">No holidays added yet</div>
                                            <div className="empty-desc">Use the form or click "Seed Defaults" to add Indian holidays</div>
                                        </div>
                                    ) : holidays.map(h => {
                                        const d = new Date(h.date);
                                        return (
                                            <div key={h._id} className="holiday-item">
                                                <div className="holiday-date-badge">
                                                    <div className="holiday-date-day">{d.getDate()}</div>
                                                    <div className="holiday-date-month">{MONTHS[d.getMonth()]}</div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div className="holiday-name">{h.name}</div>
                                                    <div className="holiday-type-label">{h.type}</div>
                                                </div>
                                                <button className="btn btn-sm btn-danger" style={{ padding: '4px 10px' }} onClick={() => handleDeleteHoliday(h._id)}>✕</button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Add holiday form */}
                                <div className="card" style={{ alignSelf: 'start' }}>
                                    <div className="card-header-row"><div className="card-title">Add Holiday</div></div>
                                    <div className="card-body">
                                        <form onSubmit={handleAddHoliday}>
                                            <div className="form-group">
                                                <label className="form-label">Holiday Name *</label>
                                                <input className="form-control" placeholder="e.g. Republic Day" value={holForm.name}
                                                    onChange={e => setHolForm({ ...holForm, name: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Date *</label>
                                                <input type="date" className="form-control" value={holForm.date}
                                                    onChange={e => setHolForm({ ...holForm, date: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Type</label>
                                                <select className="form-control" value={holForm.type}
                                                    onChange={e => setHolForm({ ...holForm, type: e.target.value })}>
                                                    <option value="national">National</option>
                                                    <option value="regional">Regional</option>
                                                    <option value="optional">Optional</option>
                                                    <option value="company">Company</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Description</label>
                                                <input className="form-control" placeholder="Optional note" value={holForm.description}
                                                    onChange={e => setHolForm({ ...holForm, description: e.target.value })} />
                                            </div>
                                            <button type="submit" className="btn btn-primary w-full" disabled={holLoading}>
                                                {holLoading ? 'Adding...' : '+ Add Holiday'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>

            {/* ========= REJECT MODAL ========= */}
            {rejectModal.open && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
                }}>
                    <div style={{
                        background: 'white', borderRadius: 'var(--radius-xl)', padding: 28,
                        width: 440, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Reject Leave Request</h3>
                        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20 }}>
                            Provide a reason for rejection (optional but recommended)
                        </p>
                        <div className="form-group">
                            <label className="form-label">Rejection Reason</label>
                            <textarea
                                className="form-control"
                                rows={3}
                                placeholder="e.g. Insufficient notice period, critical project deadline..."
                                value={rejectModal.reason}
                                onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setRejectModal({ open: false, leaveId: null, reason: '' })}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleReject}>
                                Reject Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
