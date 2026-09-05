import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { CalendarOff, PlusCircle, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';

export default function StudentLeaveWidget() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [newLeave, setNewLeave] = useState({ start_date: '', end_date: '', reason: '' });

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

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/leaves/', {
        ...newLeave,
        start_date: new Date(newLeave.start_date).toISOString(),
        end_date: new Date(newLeave.end_date).toISOString()
      });
      setShowApply(false);
      setNewLeave({ start_date: '', end_date: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      alert('Failed to apply for leave. Please ensure dates are correct.');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Approved': return <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> Approved</span>;
      case 'Rejected': return <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14}/> Rejected</span>;
      default: return <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> Pending</span>;
    }
  };

  if (loading) return <div style={{ textAlign: 'center' }}><Loader className="animate-spin" /></div>;

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ margin: 0 }}>Leave Requests</h1>
          <p style={{ color: 'var(--text-muted)' }}>Apply for medical or personal leaves</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowApply(!showApply)}>
          <PlusCircle size={18} /> {showApply ? 'Cancel' : 'Apply for Leave'}
        </button>
      </div>

      {showApply && (
        <form onSubmit={handleApply} className="glass-panel animate-in" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h3 style={{ margin: 0 }}>New Leave Application</h3>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.9rem' }}>Start Date</label>
              <input type="date" className="input-field" required value={newLeave.start_date} onChange={e => setNewLeave({...newLeave, start_date: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.9rem' }}>End Date</label>
              <input type="date" className="input-field" required value={newLeave.end_date} onChange={e => setNewLeave({...newLeave, end_date: e.target.value})} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.9rem' }}>Reason</label>
            <textarea className="input-field" rows={3} required placeholder="Please explain why you need to take a leave..." value={newLeave.reason} onChange={e => setNewLeave({...newLeave, reason: e.target.value})}></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Submit Application</button>
        </form>
      )}

      {leaves.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <CalendarOff size={48} style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-main)' }}>No Leave Records</h3>
          <p>You haven't applied for any leaves yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {leaves.map(leave => (
            <div key={leave.id} className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: leave.status === 'Approved' ? 'var(--success)' : leave.status === 'Rejected' ? 'var(--error)' : 'var(--warning)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {new Date(leave.start_date).toLocaleDateString()} &mdash; {new Date(leave.end_date).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
                  {getStatusBadge(leave.status)}
                </div>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 'var(--space-sm) 0' }}>
                {leave.reason}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
