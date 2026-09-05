import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { BookOpen, Plus, CheckCircle2, AlertCircle, RefreshCw, Edit2, Trash2, Folder, ArrowLeft, ChevronRight } from 'lucide-react';

export default function AdminClassesWidget() {
  const [allClasses, setAllClasses] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('folders'); // 'folders', 'list', 'add'
  
  const [formData, setFormData] = useState({
    id: '', name: '', subject: '', course: '', branch: '', section: '', room_number: '', 
    description: '', total_students_count: 50, teacher_id: ''
  });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clsRes, tchRes, cohortsRes] = await Promise.all([
        apiClient.get('/classes'),
        apiClient.get('/admin/teachers'),
        apiClient.get('/admin/students/classes')
      ]);
      const clsData = clsRes.data;
      const cohortsData = cohortsRes.data;
      setAllClasses(clsData);
      
      const grouped = {};
      
      // First, initialize folders for all student cohorts
      cohortsData.forEach(cohort => {
        const key = `${cohort.course || ''}_${cohort.branch || ''}_${cohort.section || ''}`;
        grouped[key] = { 
          course: cohort.course, 
          branch: cohort.branch, 
          section: cohort.section, 
          classes: [],
          student_count: cohort.student_count
        };
      });
      
      // Then, add the actual classes into those folders
      clsData.forEach(c => {
        const key = `${c.course || ''}_${c.branch || ''}_${c.section || ''}`;
        if (!grouped[key]) {
          grouped[key] = { course: c.course, branch: c.branch, section: c.section, classes: [], student_count: 0 };
        }
        grouped[key].classes.push(c);
      });
      
      setFolders(Object.values(grouped));
      
      setTeachers(tchRes.data);
    } catch (err) {
      console.error('Failed to fetch classes/teachers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });
    
    // Find the teacher display name
    const selectedTeacher = teachers.find(t => t.id === formData.teacher_id);
    const teacher_display_name = selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : undefined;

    const payload = {
      ...formData,
      teacher_display_name
    };
    
    try {
      if (formData.id) {
        await apiClient.put(`/classes/${formData.id}`, payload);
        setFormMsg({ type: 'success', text: 'Class updated successfully.' });
      } else {
        await apiClient.post('/classes/', payload);
        setFormMsg({ type: 'success', text: 'Class created successfully.' });
      }
      
      fetchData();
      setTimeout(() => setViewMode('list'), 2000);
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to save class.' });
    }
  };

  const handleEdit = (cls) => {
    setFormData({
      id: cls.id,
      name: cls.name,
      subject: cls.subject,
      course: cls.course || '',
      branch: cls.branch || '',
      section: cls.section,
      room_number: cls.room_number || '',
      description: cls.description || '',
      total_students_count: cls.total_students_count || 50,
      teacher_id: cls.teacher_id || ''
    });
    setFormMsg({ type: '', text: '' });
    setViewMode('add');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class? This will also delete all associated sessions and attendance records.')) return;
    try {
      await apiClient.delete(`/classes/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete class.');
    }
  };


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--space-xs) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <BookOpen size={28} color="var(--primary)" /> Class Management
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Create classes and assign teachers.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className={`btn ${viewMode === 'folders' || viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setViewMode('folders'); setFormMsg({ type: '', text: '' }); }}>
            <BookOpen size={16} /> View All
          </button>
          <button className={`btn ${viewMode === 'add' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { 
            setFormData({ 
              id: '', name: '', subject: '', 
              course: activeFolder ? (activeFolder.course || '') : '', 
              branch: activeFolder ? (activeFolder.branch || '') : '', 
              section: activeFolder ? (activeFolder.section || '') : '', 
              room_number: '', description: '', total_students_count: activeFolder ? (activeFolder.student_count || 50) : 50, teacher_id: '' 
            });
            setFormMsg({ type: '', text: '' });
            setViewMode('add'); 
          }}>
            <Plus size={16} /> Create Class
          </button>
        </div>
      </div>

      {viewMode === 'folders' && (
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-md)' }}>
            <button className="btn btn-secondary" onClick={fetchData} style={{ padding: '0.4rem 0.8rem' }}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading classes...</div>
          ) : folders.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
              No cohorts found. Import students to generate cohort folders, or create a class manually to get started.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
              {folders.map((folder, idx) => {
                const title = [folder.course, folder.branch, folder.section].filter(Boolean).join(' ') || 'Unassigned Cohort';
                return (
                  <div key={idx} className="glass-panel" style={{ padding: 'var(--space-lg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', transition: 'all 0.2s ease', ':hover': { transform: 'translateY(-2px)' } }} onClick={() => { setActiveFolder(folder); setViewMode('list'); }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--primary)' }}>
                      <Folder size={24} />
                      <h3 style={{ margin: 0 }}>{title}</h3>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {folder.classes.length} Subject(s)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="glass-panel animate-in" style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setViewMode('folders')}>
                <ArrowLeft size={16} />
              </button>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                Cohorts <ChevronRight size={16} color="var(--text-muted)" /> 
                {activeFolder ? [activeFolder.course, activeFolder.branch, activeFolder.section].filter(Boolean).join(' ') || 'Unassigned Cohort' : 'All Classes'}
              </h3>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: 'var(--space-sm)' }}>Class Name</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Subject</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Section</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Assigned Teacher</th>
                  <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading classes...</td></tr>
                ) : !activeFolder || activeFolder.classes.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>No subjects found for this cohort.</td></tr>
                ) : (
                  activeFolder.classes.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 'var(--space-sm)', fontWeight: 500 }}>{c.name}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>{c.subject}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>{c.section}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>{c.teacher_display_name || <span style={{color: 'var(--warning)'}}>Unassigned</span>}</td>
                      <td style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px', border: 'none', background: 'transparent' }} onClick={() => handleEdit(c)}>
                          <Edit2 size={16} color="var(--primary)" />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '4px', border: 'none', background: 'transparent', marginLeft: '4px' }} onClick={() => handleDelete(c.id)}>
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
            <Plus size={24} color="var(--primary)" /> {formData.id ? 'Edit Class' : 'Create New Class'}
          </h2>
          
          {formMsg.text && (
            <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', backgroundColor: formMsg.type === 'error' ? 'rgba(247, 118, 142, 0.1)' : 'rgba(158, 206, 106, 0.1)', color: formMsg.type === 'error' ? 'var(--error)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              {formMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{formMsg.text}</span>
            </div>
          )}
          
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Class Name *</label>
              <input type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. B.Tech CSE Semester 4" required />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Course *</label>
                <input type="text" className="input-field" value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} placeholder="e.g. B.Tech" required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Branch *</label>
                <input type="text" className="input-field" value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})} placeholder="e.g. CSE" required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Subject *</label>
                <input type="text" className="input-field" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Section *</label>
                <input type="text" className="input-field" value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} placeholder="e.g. A" required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Assign Teacher *</label>
              <select className="input-field" value={formData.teacher_id} onChange={(e) => setFormData({...formData, teacher_id: e.target.value})} required style={{ cursor: 'pointer', appearance: 'auto' }}>
                <option value="" disabled>Select a teacher</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.employee_id})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Room Number</label>
                <input type="text" className="input-field" value={formData.room_number} onChange={(e) => setFormData({...formData, room_number: e.target.value})} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Class Capacity *</label>
                <input type="number" className="input-field" value={formData.total_students_count} onChange={(e) => setFormData({...formData, total_students_count: parseInt(e.target.value)})} min="1" required />
              </div>
            </div>


            <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-sm)' }}>
              {formData.id ? 'Save Changes' : 'Create Class'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
