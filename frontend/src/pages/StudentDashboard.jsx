import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Camera, CalendarOff, LogOut, User as UserIcon } from 'lucide-react';
import CheckInWidget from '../components/CheckInWidget';
import StudentLeaveWidget from '../components/StudentLeaveWidget';
import StudentClassesWidget from '../components/StudentClassesWidget';
import StudentProfile from '../components/StudentProfile';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('classes');
  const [sessionCodeToJoin, setSessionCodeToJoin] = useState('');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', backgroundColor: 'var(--bg-surface)', padding: 'var(--space-xl) var(--space-md)', display: 'flex', flexDirection: 'column', borderRight: 'var(--border-subtle)', boxShadow: 'var(--shadow-lg)', zIndex: 10 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', padding: '0 var(--space-sm)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>A</span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
            Student<span style={{ color: 'var(--primary)' }}>Portal</span>
          </h2>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', flex: 1 }}>
          <button className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('classes')} style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}>
            <BookOpen size={18} /> My Classes
          </button>
          <button className={`btn ${activeTab === 'checkin' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('checkin')} style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}>
            <Camera size={18} /> Check-In
          </button>
          <button className={`btn ${activeTab === 'leave' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('leave')} style={{ justifyContent: 'flex-start', padding: '0.8rem 1rem' }}>
            <CalendarOff size={18} /> Leave Requests
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
          <StudentClassesWidget />
        )}
        
        {activeTab === 'checkin' && (
          <div className="animate-in">
            <h1 style={{ margin: '0 0 var(--space-xs) 0' }}>Check-In to Class</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>Enter the Session Code provided by your teacher to verify your attendance.</p>
            
            <div className="glass-panel" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Active Session Code</label>
              <input 
                type="text" 
                className="input-field" 
                style={{ fontSize: '1.2rem', padding: '1rem', letterSpacing: '1px', textTransform: 'uppercase' }}
                placeholder="Enter 6-character code..." 
                value={sessionCodeToJoin}
                onChange={(e) => setSessionCodeToJoin(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>

            {sessionCodeToJoin.length === 6 ? (
              <CheckInWidget sessionCode={sessionCodeToJoin} />
            ) : (
              <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.2)' }}>
                <Camera size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
                <p>Please enter the 6-character Session Code above to begin the AI Check-In process.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'leave' && (
          <StudentLeaveWidget />
        )}
        
        {activeTab === 'profile' && (
          <StudentProfile />
        )}
      </div>
    </div>
  );
}
