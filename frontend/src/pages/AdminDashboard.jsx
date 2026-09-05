import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, BookOpen, Calendar, FileText, LogOut, GraduationCap, UserCheck } from 'lucide-react';
import AdminStudentsWidget from '../components/AdminStudentsWidget';
import AdminTeachersWidget from '../components/AdminTeachersWidget';
import AdminClassesWidget from '../components/AdminClassesWidget';
import AdminLeaveWidget from '../components/AdminLeaveWidget';
import AdminReportsWidget from '../components/AdminReportsWidget';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ total_students: 0, total_teachers: 0, total_classes: 0 });

  React.useEffect(() => {
    if (activeTab === 'overview') {
      import('../api/client').then(({ apiClient }) => {
        apiClient.get('/admin/dashboard/stats')
          .then(res => setStats(res.data))
          .catch(err => console.error('Failed to fetch dashboard stats', err));
      });
    }
  }, [activeTab]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: 'var(--bg-surface)', padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', borderRight: 'var(--border-subtle)' }}>
        <h2 style={{ marginBottom: 'var(--space-xl)', color: 'var(--primary)', textAlign: 'center' }}>Admin Portal</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', flex: 1 }}>
          <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('overview')} style={{ justifyContent: 'flex-start' }}>
            <Users size={18} /> Overview
          </button>
          <button className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('students')} style={{ justifyContent: 'flex-start' }}>
            <GraduationCap size={18} /> Student Management
          </button>
          <button className={`btn ${activeTab === 'teachers' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('teachers')} style={{ justifyContent: 'flex-start' }}>
            <UserCheck size={18} /> Teacher Management
          </button>
          <button className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('classes')} style={{ justifyContent: 'flex-start' }}>
            <BookOpen size={18} /> Class Management
          </button>
          <button className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('leaves')} style={{ justifyContent: 'flex-start' }}>
            <Calendar size={18} /> Leave Requests
          </button>
          <button className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('reports')} style={{ justifyContent: 'flex-start' }}>
            <FileText size={18} /> Export Reports
          </button>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: 'var(--border-subtle)', paddingTop: 'var(--space-md)' }}>
          <div style={{ marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
            Signed in as <br/><strong style={{ color: 'var(--text-main)' }}>{user?.first_name} {user?.last_name}</strong>
          </div>
          <button className="btn btn-secondary" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 'var(--space-xl)' }} className="animate-in">
        {activeTab === 'overview' && (
          <div>
            <h1>Dashboard Overview</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>Welcome back to the Admin control center.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
              <div className="glass-panel" style={{ padding: 'var(--space-lg)' }}>
                <h3 style={{ color: 'var(--text-muted)' }}>Total Students</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.total_students}</p>
              </div>
              <div className="glass-panel" style={{ padding: 'var(--space-lg)' }}>
                <h3 style={{ color: 'var(--text-muted)' }}>Total Teachers</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.total_teachers}</p>
              </div>
              <div className="glass-panel" style={{ padding: 'var(--space-lg)' }}>
                <h3 style={{ color: 'var(--text-muted)' }}>Active Classes</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.total_classes}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <AdminStudentsWidget />
        )}

        {activeTab === 'teachers' && (
          <AdminTeachersWidget />
        )}

        {activeTab === 'classes' && (
          <AdminClassesWidget />
        )}
        
        {activeTab === 'leaves' && (
          <AdminLeaveWidget />
        )}
        
        {activeTab === 'reports' && (
          <AdminReportsWidget />
        )}
        
        {/* Placeholder for other tabs */}
        {activeTab !== 'overview' && activeTab !== 'students' && activeTab !== 'teachers' && activeTab !== 'classes' && activeTab !== 'leaves' && activeTab !== 'reports' && (
          <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Component for <strong>{activeTab}</strong> will be built in Phase 3/4.</p>
          </div>
        )}
      </div>
    </div>
  );
}
