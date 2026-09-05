import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, CheckSquare, LogOut, User as UserIcon, CalendarOff } from 'lucide-react';
import TeacherClassesWidget from '../components/TeacherClassesWidget';
import TeacherProfile from '../components/TeacherProfile';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('classes');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', backgroundColor: 'var(--bg-surface)', padding: 'var(--space-xl) var(--space-md)', display: 'flex', flexDirection: 'column', borderRight: 'var(--border-subtle)', boxShadow: 'var(--shadow-lg)', zIndex: 10 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', padding: '0 var(--space-sm)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>A</span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
            Teacher<span style={{ color: 'var(--primary)' }}>Portal</span>
          </h2>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', flex: 1 }}>
          <button className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('classes')} style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}>
            <BookOpen size={18} /> My Classes
          </button>
          <button className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('profile')} style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}>
            <UserIcon size={18} /> My Profile
          </button>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: 'var(--border-subtle)', paddingTop: 'var(--space-lg)' }}>
          <div style={{ marginBottom: 'var(--space-md)', fontSize: '0.9rem', padding: '0 var(--space-sm)' }}>
            Signed in as <br/><strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{user?.first_name} {user?.last_name}</strong>
          </div>
          <button className="btn btn-secondary" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 'var(--space-xl)' }} className="animate-in">
        {activeTab === 'classes' && (
          <TeacherClassesWidget />
        )}
        
        {activeTab === 'profile' && (
          <TeacherProfile />
        )}
      </div>
    </div>
  );
}
