import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { ArrowLeft, Users, Calendar, PlayCircle, Loader, X, Edit, Trash2 } from 'lucide-react';
import SessionReportModal from './SessionReportModal';

export default function TeacherClassDetail({ classId, onBack }) {
  const [classDetail, setClassDetail] = useState(null);
  const [roster, setRoster] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('roster');
  
  // Start Session Modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [attendanceWindow, setAttendanceWindow] = useState(5);
  const [allowedRadius, setAllowedRadius] = useState(50);
  const [teacherLocation, setTeacherLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, fetching, success, error
  const [startingSession, setStartingSession] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  // Edit Class Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Class Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);

  // Session Report Modal
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, rosterRes, sessionsRes] = await Promise.all([
        apiClient.get(`/classes/${classId}`),
        apiClient.get(`/classes/${classId}/roster`),
        apiClient.get(`/classes/${classId}/sessions`)
      ]);
      setClassDetail(classRes.data);
      setRoster(rosterRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setStartingSession(true);
    try {
      const payload = {
        class_room_id: classId,
        attendance_window_minutes: parseInt(attendanceWindow),
        latitude: teacherLocation?.lat || null,
        longitude: teacherLocation?.lng || null,
        allowed_radius_meters: parseFloat(allowedRadius)
      };
      
      const res = await apiClient.post('/sessions/', payload);
      setActiveSession(res.data);
      setShowStartModal(false);
      fetchData(); // Refresh history
      setActiveTab('history');
    } catch (err) {
      alert('Failed to start session');
    } finally {
      setStartingSession(false);
    }
  };

  const openStartModal = () => {
    setShowStartModal(true);
    setLocationStatus('fetching');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTeacherLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationStatus('success');
        },
        (err) => {
          console.error(err);
          setLocationStatus('error');
        }
      );
    } else {
      setLocationStatus('error');
    }
  };

  const openEditModal = () => {
    setEditData({
      name: classDetail.name,
      subject: classDetail.subject,
      section: classDetail.section,
      room_number: classDetail.room_number || '',
      description: classDetail.description || '',
      latitude: classDetail.latitude || '',
      longitude: classDetail.longitude || '',
      allowed_radius_meters: classDetail.allowed_radius_meters || 50,
      total_students_count: classDetail.total_students_count || '',
      teacher_display_name: classDetail.teacher_display_name || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const payload = {
        ...editData,
        latitude: editData.latitude ? parseFloat(editData.latitude) : null,
        longitude: editData.longitude ? parseFloat(editData.longitude) : null,
        allowed_radius_meters: editData.allowed_radius_meters ? parseFloat(editData.allowed_radius_meters) : 50,
        total_students_count: parseInt(editData.total_students_count),
        teacher_display_name: editData.teacher_display_name || null
      };
      await apiClient.put(`/classes/${classId}`, payload);
      setShowEditModal(false);
      fetchData(); // Refresh details
    } catch (err) {
      alert('Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClass = async () => {
    setDeletingClass(true);
    try {
      await apiClient.delete(`/classes/${classId}`);
      onBack(); // Go back to dashboard
    } catch (err) {
      alert('Failed to delete class');
      setDeletingClass(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}><Loader className="animate-spin" /></div>;
  if (!classDetail) return <div>Class not found.</div>;

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to My Classes
        </button>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary" onClick={openEditModal} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <Edit size={16} /> Edit
          </button>
          <button className="btn" onClick={() => setShowDeleteModal(true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: 'rgba(247, 118, 142, 0.1)', color: 'var(--error)', border: '1px solid var(--error)' }}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
      
      {activeSession && (
        <div className="glass-panel animate-in" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'var(--primary)' }}>
          <h3 style={{ color: 'var(--primary)', margin: '0 0 var(--space-xs) 0' }}>Session Started Successfully!</h3>
          <p style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            Tell your students to check-in using Session Code: 
            <strong style={{ color: '#fff', fontSize: '1.8rem', letterSpacing: '2px', marginLeft: '12px', padding: '4px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
              {activeSession.session_code}
            </strong>
          </p>
          <p style={{ margin: 'var(--space-xs) 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            This code will expire in {activeSession.attendance_window_minutes} minutes (at {new Date(activeSession.expires_at).toLocaleTimeString()}).
          </p>
        </div>
      )}

      <div className="glass-panel" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--primary)' }}>{classDetail.name}-{classDetail.section}</h1>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500 }}>Subject: {classDetail.subject}</h2>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-sm)', color: 'var(--text-muted)' }}>
            <span>Join Code: <strong>{classDetail.join_code}</strong></span>
            {classDetail.room_number && <span>Room: <strong>{classDetail.room_number}</strong></span>}
            <span>Total Students: <strong>{roster.length}</strong></span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openStartModal} style={{ fontSize: '1.1rem', padding: '0.8rem 1.5rem', boxShadow: 'var(--shadow-glow)' }}>
          <PlayCircle size={20} /> Start Class
        </button>
      </div>

      {showStartModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <form onSubmit={handleStartSession} className="glass-panel animate-in" style={{ padding: 'var(--space-xl)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Start New Session</h3>
              <button type="button" onClick={() => setShowStartModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Select how long the Session Code will be valid for.</p>
            
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Attendance Window</label>
                <select className="input-field" value={attendanceWindow} onChange={e => setAttendanceWindow(e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Allowed Radius</label>
                <select className="input-field" value={allowedRadius} onChange={e => setAllowedRadius(e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value={10}>10 Meters (Strict)</option>
                  <option value={20}>20 Meters</option>
                  <option value={50}>50 Meters (Standard)</option>
                  <option value={100}>100 Meters (Large Hall)</option>
                  <option value={500}>500 Meters (Campus Wide)</option>
                  <option value={9999999}>No Limit (Remote / Testing)</option>
                </select>
              </div>
            </div>
            
            <div style={{ padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
              {locationStatus === 'fetching' && <div style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}><Loader size={14} className="animate-spin" /> Fetching your location...</div>}
              {locationStatus === 'success' && <div style={{ color: 'var(--success)' }}>✓ Location acquired. Students must be within {allowedRadius}m of your current position.</div>}
              {locationStatus === 'error' && <div style={{ color: 'var(--error)' }}>⚠️ Could not fetch your location. Please ensure location services are enabled, otherwise the default classroom location will be used.</div>}
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={startingSession} style={{ marginTop: 'var(--space-sm)' }}>
              {startingSession ? <Loader className="animate-spin" size={18} /> : 'Create Session'}
            </button>
          </form>
        </div>
      )}

      {showEditModal && editData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <form onSubmit={handleSaveEdit} className="glass-panel animate-in" style={{ padding: 'var(--space-xl)', width: '500px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Edit Class</h3>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <input type="text" placeholder="Class Name" className="input-field" required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input type="text" placeholder="Subject" className="input-field" required value={editData.subject} onChange={e => setEditData({...editData, subject: e.target.value})} />
              <input type="text" placeholder="Section" className="input-field" required value={editData.section} onChange={e => setEditData({...editData, section: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input type="text" placeholder="Room Number (optional)" className="input-field" value={editData.room_number} onChange={e => setEditData({...editData, room_number: e.target.value})} />
              <input type="number" placeholder="Total Expected Students" className="input-field" required value={editData.total_students_count} onChange={e => setEditData({...editData, total_students_count: e.target.value})} />
            </div>
            <input type="text" placeholder="Your Name (Shown to Students)" className="input-field" required value={editData.teacher_display_name} onChange={e => setEditData({...editData, teacher_display_name: e.target.value})} />
            <textarea placeholder="Description (optional)" className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
            
            <button type="submit" className="btn btn-primary" disabled={savingEdit} style={{ marginTop: 'var(--space-sm)' }}>
              {savingEdit ? <Loader className="animate-spin" size={18} /> : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-in" style={{ padding: 'var(--space-xl)', width: '450px', border: '1px solid var(--error)' }}>
            <h3 style={{ color: 'var(--error)', marginTop: 0 }}>Delete Class</h3>
            <p>Are you absolutely sure you want to delete <strong>{classDetail.name}</strong>?</p>
            <p style={{ color: 'var(--error)', fontWeight: 600, fontSize: '0.9rem', backgroundColor: 'rgba(247, 118, 142, 0.1)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
              WARNING: Deleting this class will permanently remove all of its past sessions and attendance records. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} style={{ flex: 1 }} disabled={deletingClass}>Cancel</button>
              <button className="btn" onClick={handleDeleteClass} style={{ flex: 1, backgroundColor: 'var(--error)', color: 'white', border: 'none' }} disabled={deletingClass}>
                {deletingClass ? <Loader className="animate-spin" size={18} /> : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 'var(--space-sm)' }}>
        <button className={`btn ${activeTab === 'roster' ? 'btn-primary' : ''}`} style={{ background: activeTab === 'roster' ? '' : 'transparent', boxShadow: 'none' }} onClick={() => setActiveTab('roster')}>
          <Users size={18} /> Class Roster
        </button>
        <button className={`btn ${activeTab === 'history' ? 'btn-primary' : ''}`} style={{ background: activeTab === 'history' ? '' : 'transparent', boxShadow: 'none' }} onClick={() => setActiveTab('history')}>
          <Calendar size={18} /> Attendance History
        </button>
      </div>

      {activeTab === 'roster' && (
        <div className="glass-panel" style={{ padding: 'var(--space-xl)' }}>
          {roster.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No students are enrolled in this class yet. Share the join code!</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)' }}>Student Name</th>
                  <th style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)' }}>Email</th>
                </tr>
              </thead>
              <tbody>
                {roster.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: 'var(--space-sm)' }}>
                      {student.first_name} {student.last_name}
                      {student.is_on_leave_today && (
                        <span style={{ 
                          marginLeft: '12px', 
                          padding: '2px 8px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          backgroundColor: 'rgba(255, 158, 100, 0.2)', 
                          color: '#ff9e64', 
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 158, 100, 0.4)'
                        }}>
                          On Leave
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)' }}>{student.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {sessions.length === 0 ? (
            <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>No sessions have been started for this class yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {sessions.map(session => (
                <div key={session.id} className="glass-panel" style={{ padding: 'var(--space-md) var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setSelectedSessionId(session.id)}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{new Date(session.start_time).toLocaleDateString()} at {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Code: {session.session_code || session.id.substring(0,6)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>{session.present_count}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Present</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--error)' }}>{session.absent_count}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Absent</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSessionId && (
        <SessionReportModal 
          sessionId={selectedSessionId} 
          onClose={() => setSelectedSessionId(null)} 
        />
      )}
    </div>
  );
}
