import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { CalendarOff, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';

export default function AdminLeaveWidget() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const res = await apiClient.get('/leaves/');
      setLeaves(res.data);
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (leaveId, status) => {
    try {
      await apiClient.put(`/leaves/${leaveId}/status`, { status });
      fetchLeaves();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div style={{ textAlign: 'center' }}><Loader className="animate-spin" /></div>;

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ margin: 0 }}>Student Leave Requests</h1>
        <p style={{ color: 'var(--text-muted)' }}>Review and manage pending medical or personal leaves</p>
      </div>

      {leaves.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <CalendarOff size={48} style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-main)' }}>All Caught Up</h3>
          <p>There are no pending leave requests to review.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-md)' }}>
          {leaves.map(leave => (
            <div key={leave.id} className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: leave.status === 'Approved' ? 'var(--success)' : leave.status === 'Rejected' ? 'var(--error)' : 'var(--warning)' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div>
                  <h4 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--primary)' }}>{leave.student_name}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    ID: {leave.student_id} | Class: {leave.course} - {leave.branch} {leave.section}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-full)', color: leave.status === 'Approved' ? 'var(--success)' : leave.status === 'Rejected' ? 'var(--error)' : 'var(--warning)' }}>
                  {leave.status}
                </div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-md)', flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{leave.reason}</p>
              </div>

              {leave.status === 'Pending' && (
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button className="btn" style={{ flex: 1, backgroundColor: 'rgba(158, 206, 106, 0.1)', color: 'var(--success)', border: '1px solid var(--success)' }} onClick={() => handleUpdateStatus(leave.id, 'Approved')}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button className="btn" style={{ flex: 1, backgroundColor: 'rgba(247, 118, 142, 0.1)', color: 'var(--error)', border: '1px solid var(--error)' }} onClick={() => handleUpdateStatus(leave.id, 'Rejected')}>
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
