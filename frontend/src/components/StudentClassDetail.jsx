import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { ArrowLeft, Loader, CheckCircle, XCircle } from 'lucide-react';

export default function StudentClassDetail({ classId, onBack }) {
  const [classDetail, setClassDetail] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, attendanceRes] = await Promise.all([
        apiClient.get(`/classes/${classId}`),
        apiClient.get(`/classes/${classId}/student-attendance`)
      ]);
      setClassDetail(classRes.data);
      setAttendance(attendanceRes.data);
    } catch (err) {
      console.error('Failed to fetch student class details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}><Loader className="animate-spin" /></div>;
  if (!classDetail || !attendance) return <div>Class not found.</div>;

  const percentage = attendance.total_sessions > 0 
    ? Math.round((attendance.attended_sessions / attendance.total_sessions) * 100) 
    : 0;

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to My Classes
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--primary)' }}>{classDetail.name}-{classDetail.section}</h1>
        <h2 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '1.2rem', fontWeight: 500 }}>Subject: {classDetail.subject}</h2>
        {classDetail.teacher_display_name && (
          <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem' }}>Teacher: {classDetail.teacher_display_name}</div>
        )}
        {classDetail.description && <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>{classDetail.description}</p>}
      </div>

      {/* Attendance Summary Widget */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="glass-panel" style={{ flex: 1, padding: 'var(--space-xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ margin: '0 0 var(--space-sm) 0', color: 'var(--text-muted)', fontSize: '1rem' }}>Overall Attendance</h3>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, color: percentage >= 75 ? 'var(--success)' : (percentage >= 50 ? '#fbbf24' : 'var(--error)'), lineHeight: 1 }}>
            {percentage}%
          </div>
        </div>
        
        <div className="glass-panel" style={{ flex: 1, padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Total Classes Conducted:</span>
            <strong style={{ fontSize: '1.2rem' }}>{attendance.total_sessions}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Classes Attended:</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--success)' }}>{attendance.attended_sessions}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Classes Missed:</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--error)' }}>{attendance.total_sessions - attendance.attended_sessions}</strong>
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: 'var(--space-md)' }}>Chronological Session History</h3>
      
      {attendance.history.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
          No classes have been conducted for this subject yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {attendance.history.map((session, index) => {
            const isPresent = session.status === 'Present';
            return (
              <div key={session.session_id} className="glass-panel" style={{ padding: 'var(--space-md) var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {attendance.history.length - index}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{new Date(session.date).toLocaleDateString()}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
                
                {isPresent ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                    <CheckCircle size={18} /> Present
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', backgroundColor: 'rgba(247, 118, 142, 0.1)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                    <XCircle size={18} /> Absent
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
