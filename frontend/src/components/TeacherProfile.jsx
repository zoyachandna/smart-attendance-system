import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Building, Briefcase, Book, Lock, Edit2, Check, X, Shield } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

export default function TeacherProfile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/users/me/profile');
      setProfileData(res.data.user);
      setStats(res.data.stats);
      setEditForm({
        first_name: res.data.user.first_name || '',
        last_name: res.data.user.last_name || '',
        phone_number: res.data.user.phone_number || '',
        department: res.data.user.department || '',
        designation: res.data.user.designation || '',
        subjects_taught: res.data.user.subjects_taught || ''
      });
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put('/users/me/profile', editForm);
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    try {
      await apiClient.put('/users/me/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setIsChangingPassword(false), 2000);
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update password' });
    }
  };

  if (loading || !profileData) {
    return <div className="animate-in" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading profile...</div>;
  }

  return (
    <div className="animate-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--space-lg)' }}>My Profile</h1>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="glass-panel" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--primary)' }}>{stats?.total_classes || 0}</h3>
          <p style={{ margin: 'var(--space-xs) 0 0 0', color: 'var(--text-muted)' }}>Classes Assigned</p>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--primary)' }}>{stats?.total_sessions || 0}</h3>
          <p style={{ margin: 'var(--space-xs) 0 0 0', color: 'var(--text-muted)' }}>Sessions Conducted</p>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--primary)' }}>{stats?.total_students || 0}</h3>
          <p style={{ margin: 'var(--space-xs) 0 0 0', color: 'var(--text-muted)' }}>Students Managed</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        
        {/* Profile Info */}
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}><User size={24} color="var(--primary)"/> Personal Information</h2>
            {!isEditing && (
              <button className="btn btn-secondary" onClick={() => setIsEditing(true)} style={{ padding: '0.4rem 0.8rem' }}>
                <Edit2 size={16} /> Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem' }}>First Name</label>
                  <input type="text" className="input-field" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem' }}>Last Name</label>
                  <input type="text" className="input-field" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Phone Number</label>
                <input type="text" className="input-field" value={editForm.phone_number} onChange={e => setEditForm({...editForm, phone_number: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Department</label>
                <input type="text" className="input-field" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Designation</label>
                <input type="text" className="input-field" value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Subjects Taught</label>
                <input type="text" className="input-field" value={editForm.subjects_taught} onChange={e => setEditForm({...editForm, subjects_taught: e.target.value})} placeholder="e.g. Operating Systems, Networks" />
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Check size={18}/> Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)} style={{ flex: 1 }}><X size={18}/> Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                  {profileData.first_name[0]}{profileData.last_name[0]}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '1.5rem' }}>{profileData.first_name} {profileData.last_name}</h3>
                  <div style={{ color: 'var(--primary)', fontWeight: 500 }}>{profileData.designation || 'Faculty Member'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}><Mail size={18} color="var(--text-muted)"/> <strong>Email:</strong> {profileData.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}><Phone size={18} color="var(--text-muted)"/> <strong>Phone:</strong> {profileData.phone_number || 'Not provided'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}><Building size={18} color="var(--text-muted)"/> <strong>Department:</strong> {profileData.department || 'Not provided'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}><Briefcase size={18} color="var(--text-muted)"/> <strong>Employee ID:</strong> {profileData.employee_id || 'Not provided'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}><Book size={18} color="var(--text-muted)"/> <strong>Subjects:</strong> {profileData.subjects_taught || 'Not provided'}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Security & Password */}
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}><Shield size={24} color="var(--primary)"/> Security</h2>
          </div>
          
          {isChangingPassword ? (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {passwordMessage.text && (
                <div style={{ padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', backgroundColor: passwordMessage.type === 'error' ? 'rgba(247, 118, 142, 0.1)' : 'rgba(158, 206, 106, 0.1)', color: passwordMessage.type === 'error' ? 'var(--error)' : 'var(--success)', textAlign: 'center', fontSize: '0.9rem' }}>
                  {passwordMessage.text}
                </div>
              )}
              
              <div>
                <label style={{ fontSize: '0.85rem' }}>Current Password</label>
                <input type="password" className="input-field" required value={passwordForm.current_password} onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>New Password</label>
                <input type="password" className="input-field" required value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Confirm New Password</label>
                <input type="password" className="input-field" required value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Password</button>
                <button type="button" className="btn btn-secondary" onClick={() => {setIsChangingPassword(false); setPasswordMessage({type:'', text:''});}} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Keep your account secure by using a strong password. If you feel your account has been compromised, change it immediately.</p>
              <button className="btn btn-secondary" onClick={() => setIsChangingPassword(true)} style={{ width: '100%', justifyContent: 'center' }}>
                <Lock size={18} /> Change Password
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
