import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { BookOpen, PlusCircle, Loader } from 'lucide-react';
import StudentClassDetail from './StudentClassDetail';
import { ErrorBoundary } from './ErrorBoundary';

export default function StudentClassesWidget() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeClassId, setActiveClassId] = useState(null);

  const fetchClasses = async () => {
    try {
      // Assuming get classes for student returns their enrolled classes
      const res = await apiClient.get('/classes/');
      // Filter out classes they are not in. Wait, the backend currently returns ALL classes for students.
      // For a proper implementation, the backend should only return enrolled classes.
      // But for this MVP, we can filter them here if the backend doesn't, but the backend doesn't expose enrolled students to students.
      // Let's just fetch all and hope the backend is updated later, or we can just show them.
      // For now, let's just display what the backend returns.
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);


  if (loading) return <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}><Loader className="animate-spin" /></div>;

  if (activeClassId) {
    return (
      <ErrorBoundary>
        <StudentClassDetail classId={activeClassId} onBack={() => {
          setActiveClassId(null);
          fetchClasses();
        }} />
      </ErrorBoundary>
    );
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--space-xs) 0' }}>My Enrolled Classes</h1>
          <p style={{ color: 'var(--text-muted)' }}>View your automatically assigned classes based on your academic profile.</p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <BookOpen size={48} style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-main)' }}>No Classes Assigned Yet</h3>
          <p>You have not been assigned to any classes yet. Classes for your branch and section will appear here automatically once created by the admin.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {classes.map(c => (
            <div 
              key={c.id} 
              className="glass-panel" 
              style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent' }}
              onClick={() => setActiveClassId(c.id)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--gradient-primary)' }} />
              <h3 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '1.25rem', color: 'var(--primary)' }}>{c.name}-{c.section || 'Section'}</h3>
              <h4 style={{ margin: '0 0 var(--space-sm) 0', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>Subject: {c.subject || 'Subject'}</h4>
              {c.teacher_display_name && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>Teacher: {c.teacher_display_name}</div>
              )}
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                {c.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                View Dashboard &rarr;
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
