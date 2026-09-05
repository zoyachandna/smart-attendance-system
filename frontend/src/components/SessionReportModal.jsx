import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { X, Loader } from 'lucide-react';

export default function SessionReportModal({ sessionId, onClose }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await apiClient.get(`/sessions/${sessionId}/attendance`);
        setAttendance(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [sessionId]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel animate-in" style={{ padding: 'var(--space-xl)', width: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <div>
            <h2 style={{ margin: '0 0 var(--space-xs) 0' }}>Detailed Attendance Report</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Session ID: {sessionId}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 'var(--space-xs)' }}><X size={24}/></button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}><Loader className="animate-spin" /></div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: 'var(--space-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface-elevated)' }}>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)' }}>Student Name</th>
                  <th style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)' }}>Time</th>
                  <th style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)' }}>Method</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: 'var(--space-sm)' }}>{record.first_name} {record.last_name}</td>
                    <td style={{ padding: 'var(--space-sm)' }}>
                      <span style={{ 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 'var(--radius-full)', 
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: record.status === 'Present' ? 'rgba(158, 206, 106, 0.1)' : 'rgba(247, 118, 142, 0.1)',
                        color: record.status === 'Present' ? 'var(--success)' : 'var(--error)'
                      }}>
                        {record.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '--'}
                    </td>
                    <td style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {record.method || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
