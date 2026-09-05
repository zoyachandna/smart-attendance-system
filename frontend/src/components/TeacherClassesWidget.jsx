import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { PlusCircle, PlayCircle, Loader, BookOpen } from 'lucide-react';
import TeacherClassDetail from './TeacherClassDetail';
import { ErrorBoundary } from './ErrorBoundary';

export default function TeacherClassesWidget() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Class State
  const [showCreate, setShowCreate] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', subject: '', section: '', room_number: '', description: '', join_code: '', latitude: '', longitude: '', allowed_radius_meters: 50, total_students_count: '', teacher_display_name: '' });
  const [activeClassId, setActiveClassId] = useState(null);
  
  const [activeSession, setActiveSession] = useState(null);

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get('/classes/');
      setClasses(res.data);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  if (activeClassId) {
    return (
      <ErrorBoundary>
        <TeacherClassDetail classId={activeClassId} onBack={() => {
          setActiveClassId(null);
          fetchClasses(); // refresh after coming back just in case
        }} />
      </ErrorBoundary>
    );
  }

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const lat = parseFloat(newClass.latitude);
      const lon = parseFloat(newClass.longitude);
      
      if (isNaN(lat) || isNaN(lon)) {
        alert("Please provide valid latitude and longitude coordinates.");
        return;
      }

      const payload = {
        ...newClass,
        latitude: lat,
        longitude: lon,
        allowed_radius_meters: parseFloat(newClass.allowed_radius_meters),
        total_students_count: parseInt(newClass.total_students_count),
        teacher_display_name: newClass.teacher_display_name || null
      };
      
      await apiClient.post('/classes/', payload);
      setShowCreate(false);
      fetchClasses();
    } catch (err) {
      const errorMsg = err.response?.data?.detail 
        ? (typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail))
        : err.message;
      alert(`Error creating class: ${errorMsg}`);
    }
  };

  const autoDetectLocation = (e) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewClass(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      },
      (error) => {
        alert('Unable to retrieve location. Please make sure location permissions are granted.');
      }
    );
  };

  const startSession = async (classId) => {
    try {
      const payload = {
        class_room_id: classId,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      };
      const res = await apiClient.post('/sessions/', payload);
      setActiveSession(res.data);
    } catch (err) {
      alert('Failed to start session');
    }
  };

  if (loading) return <div style={{ textAlign: 'center' }}><Loader className="animate-spin" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h2>My Managed Classes</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <PlusCircle size={18} /> {showCreate ? 'Cancel' : 'Create New Class'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateClass} className="glass-panel" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <h3>Create Class</h3>
          <input type="text" placeholder="Class Name (e.g. Intro to CS)" className="input-field" required value={newClass.name} onChange={e => setNewClass(prev => ({...prev, name: e.target.value}))} />
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input type="text" placeholder="Subject (e.g. CS101)" className="input-field" required value={newClass.subject} onChange={e => setNewClass(prev => ({...prev, subject: e.target.value}))} />
            <input type="text" placeholder="Section (e.g. CSE-A)" className="input-field" required value={newClass.section} onChange={e => setNewClass(prev => ({...prev, section: e.target.value}))} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input type="text" placeholder="Room Number (e.g. 101)" className="input-field" value={newClass.room_number} onChange={e => setNewClass(prev => ({...prev, room_number: e.target.value}))} />
            <input type="text" placeholder="Join Code (e.g. CS101-2026)" className="input-field" required value={newClass.join_code} onChange={e => setNewClass(prev => ({...prev, join_code: e.target.value}))} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <input type="number" step="any" placeholder="Latitude" className="input-field" style={{ flex: 1 }} required value={newClass.latitude} onChange={e => setNewClass(prev => ({...prev, latitude: e.target.value}))} />
            <input type="number" step="any" placeholder="Longitude" className="input-field" style={{ flex: 1 }} required value={newClass.longitude} onChange={e => setNewClass(prev => ({...prev, longitude: e.target.value}))} />
            <button type="button" className="btn btn-secondary" onClick={autoDetectLocation} style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              📍 Detect My Location
            </button>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.9rem', marginBottom: 'var(--space-xs)' }}>Allowed Radius (meters)</label>
              <input type="number" placeholder="50" className="input-field" required value={newClass.allowed_radius_meters} onChange={e => setNewClass(prev => ({...prev, allowed_radius_meters: e.target.value}))} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.9rem', marginBottom: 'var(--space-xs)' }}>Total Expected Students</label>
              <input type="number" placeholder="e.g. 70" className="input-field" required value={newClass.total_students_count} onChange={e => setNewClass(prev => ({...prev, total_students_count: e.target.value}))} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.9rem', marginBottom: 'var(--space-xs)' }}>Your Name (Shown to Students)</label>
            <input type="text" placeholder="e.g. Prof. Smith" className="input-field" required value={newClass.teacher_display_name} onChange={e => setNewClass(prev => ({...prev, teacher_display_name: e.target.value}))} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hint: For testing, you can set the radius to a massive number (e.g. 50000) to bypass strict GPS checking.</p>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save Class</button>
        </form>
      )}

      {activeSession && (
        <div className="glass-panel" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'var(--primary)' }}>
          <h3 style={{ color: 'var(--primary)' }}>Active Session Running!</h3>
          <p>Tell your students to check-in using this Session ID:</p>
          <code style={{ fontSize: '1.2rem', display: 'block', margin: 'var(--space-sm) 0', padding: 'var(--space-sm)', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>
            {activeSession.id}
          </code>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="glass-panel animate-in" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <BookOpen size={48} style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-main)' }}>No Classes Found</h3>
          <p>You haven't created any classes yet. Click "Create New Class" to get started.</p>
        </div>
      ) : (
        <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {classes.map(c => (
            <div key={c.id} className="glass-panel" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--gradient-primary)' }} />
              <div>
                <h3 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '1.25rem', color: 'var(--primary)' }}>{c.name}-{c.section}</h3>
                <h4 style={{ margin: '0 0 var(--space-sm) 0', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>Subject: {c.subject}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>Code: {c.join_code}</span>
                  {c.room_number && <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>Room: {c.room_number}</span>}
                </div>
              </div>
              
              <div style={{ padding: 'var(--space-sm)', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Last Class:</span>
                  <span style={{ color: 'var(--text-main)' }}>{c.latest_session_date ? new Date(c.latest_session_date).toLocaleDateString() : 'Never'}</span>
                </div>
                {c.latest_session_date && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Recent Attendance:</span>
                    <strong style={{ color: 'var(--success)' }}>{c.latest_session_present}/{c.total_students_count} Present</strong>
                  </div>
                )}
              </div>
              
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1, margin: 0 }}>
                {c.description || 'No description provided.'}
              </p>
              
              <button className="btn btn-secondary" onClick={() => setActiveClassId(c.id)} style={{ width: '100%', marginTop: 'auto', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                <BookOpen size={18} /> View Class Dashboard
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
