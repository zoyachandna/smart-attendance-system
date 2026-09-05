import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Users, Plus, CheckCircle2, AlertCircle, RefreshCw, Edit2, Trash2 } from 'lucide-react';

export default function AdminTeachersWidget() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'add'
  
  const [formData, setFormData] = useState({
    id: '', first_name: '', last_name: '', email: '', employee_id: '', department: '', subjects_taught: ''
  });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error('Failed to fetch teachers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });
    
    try {
      if (formData.id) {
        await apiClient.put(`/admin/teachers/${formData.id}`, formData);
        setFormMsg({ type: 'success', text: 'Teacher updated successfully.' });
      } else {
        const res = await apiClient.post('/admin/teachers/', formData);
        setFormMsg({ type: 'success', text: res.data.message });
      }
      
      setFormData({ id: '', first_name: '', last_name: '', email: '', employee_id: '', department: '', subjects_taught: '' });
      fetchTeachers();
      setTimeout(() => setViewMode('list'), 2000);
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to save teacher.' });
    }
  };

  const handleEdit = (teacher) => {
    setFormData({
      id: teacher.id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
      employee_id: teacher.employee_id || '',
      department: teacher.department || '',
      subjects_taught: teacher.subjects_taught || ''
    });
    setFormMsg({ type: '', text: '' });
    setViewMode('add');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/admin/teachers/${id}`);
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete teacher.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--space-xs) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Users size={28} color="var(--primary)" /> Teacher Management
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Centrally manage faculty accounts and details.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setViewMode('list'); setFormMsg({ type: '', text: '' }); }}>
            <Users size={16} /> View All
          </button>
          <button className={`btn ${viewMode === 'add' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { 
            setFormData({ id: '', first_name: '', last_name: '', email: '', employee_id: '', department: '', subjects_taught: '' });
            setFormMsg({ type: '', text: '' });
            setViewMode('add'); 
          }}>
            <Plus size={16} /> Add Teacher
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="glass-panel animate-in" style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ margin: 0 }}>Total Teachers: {teachers.length}</h3>
            <button className="btn btn-secondary" onClick={fetchTeachers} style={{ padding: '0.4rem 0.8rem' }}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: 'var(--space-sm)' }}>Employee ID</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Name</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Email</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Department</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Subjects Taught</th>
                  <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading teachers...</td></tr>
                ) : teachers.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>No teachers found. Add one to get started.</td></tr>
                ) : (
                  teachers.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 'var(--space-sm)', fontWeight: 500 }}>{t.employee_id || '-'}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>{t.first_name} {t.last_name}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>{t.email}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>{t.department || '-'}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>{t.subjects_taught || '-'}</td>
                      <td style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px', border: 'none', background: 'transparent' }} onClick={() => handleEdit(t)}>
                          <Edit2 size={16} color="var(--primary)" />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '4px', border: 'none', background: 'transparent', marginLeft: '4px' }} onClick={() => handleDelete(t.id)}>
                          <Trash2 size={16} color="var(--error)" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'add' && (
        <div className="glass-panel animate-in" style={{ padding: 'var(--space-xl)', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 var(--space-lg) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Plus size={24} color="var(--primary)" /> {formData.id ? 'Edit Teacher' : 'Add New Teacher'}
          </h2>
          
          {formMsg.text && (
            <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', backgroundColor: formMsg.type === 'error' ? 'rgba(247, 118, 142, 0.1)' : 'rgba(158, 206, 106, 0.1)', color: formMsg.type === 'error' ? 'var(--error)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              {formMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{formMsg.text}</span>
            </div>
          )}
          
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>First Name *</label>
                <input type="text" className="input-field" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Last Name *</label>
                <input type="text" className="input-field" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Email Address *</label>
              <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required disabled={!!formData.id} />
              {!!formData.id && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Email cannot be changed after creation.</div>}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Employee ID *</label>
                <input type="text" className="input-field" value={formData.employee_id} onChange={(e) => setFormData({...formData, employee_id: e.target.value})} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Department *</label>
                <input type="text" className="input-field" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Subjects Taught (comma-separated)</label>
              <input type="text" className="input-field" value={formData.subjects_taught} onChange={(e) => setFormData({...formData, subjects_taught: e.target.value})} placeholder="e.g. Operating Systems, Computer Networks" />
            </div>

            {!formData.id && (
              <div style={{ padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.05)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Note:</strong> A default password of <code>Welcome@123</code> will be assigned. The teacher can change this upon their first login.
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-sm)' }}>
              {formData.id ? 'Save Changes' : 'Create Teacher Account'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
