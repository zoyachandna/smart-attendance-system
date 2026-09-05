import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../api/client';
import { Users, Upload, Plus, CheckCircle2, AlertCircle, RefreshCw, GraduationCap, Folder, ChevronRight, Search, ArrowLeft, Edit2, Trash2 } from 'lucide-react';

export default function AdminStudentsWidget() {
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('classes'); // 'classes', 'list', 'import', 'add'
  const [activeClass, setActiveClass] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  
  const [formData, setFormData] = useState({
    student_id: '', full_name: '', roll_number: '', department: '',
    course: '', branch: '', semester: '', section: '', academic_year: ''
  });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/students/classes');
      setClasses(res.data);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      let params = new URLSearchParams();
      if (activeClass) {
        if (activeClass.course) params.append('course', activeClass.course);
        if (activeClass.branch) params.append('branch', activeClass.branch);
        if (activeClass.section) params.append('section', activeClass.section);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const res = await apiClient.get(`/admin/students/?${params.toString()}`);
      setRecords(res.data.records);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  }, [activeClass, searchQuery]);

  useEffect(() => {
    if (viewMode === 'classes') {
      fetchClasses();
    } else if (viewMode === 'list') {
      fetchRecords();
    }
  }, [viewMode, fetchRecords]);

  // Debounced search
  useEffect(() => {
    if (viewMode === 'list') {
      const timer = setTimeout(() => {
        fetchRecords();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, viewMode, fetchRecords]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImporting(true);
    setImportResult(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await apiClient.post('/admin/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult({ type: 'success', data: res.data });
      if (viewMode === 'classes') fetchClasses();
    } catch (err) {
      setImportResult({ type: 'error', text: err.response?.data?.detail || 'Failed to import file' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });
    try {
      const res = await apiClient.post('/admin/students/', formData);
      setFormMsg({ type: 'success', text: `Successfully ${res.data.status === 'updated' ? 'updated' : 'added'} student record.` });
      setFormData({
        student_id: '', full_name: '', roll_number: '', department: '',
        course: '', branch: '', semester: '', section: '', academic_year: ''
      });
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to save student record.' });
    }
  };

  const handleEdit = (record) => {
    setFormData({
      student_id: record.student_id || '',
      full_name: record.full_name || '',
      roll_number: record.roll_number || '',
      department: record.department || '',
      course: record.course || '',
      branch: record.branch || '',
      semester: record.semester || '',
      section: record.section || '',
      academic_year: record.academic_year || ''
    });
    setFormMsg({ type: '', text: '' });
    setViewMode('add');
  };

  const handleDelete = async (student_id) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) return;
    try {
      await apiClient.delete(`/admin/students/${student_id}`);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete student.');
    }
  };

  const openClass = (cls) => {
    setActiveClass(cls);
    setSearchQuery('');
    setViewMode('list');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--space-xs) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <GraduationCap size={28} color="var(--primary)" /> Student Data Management
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Centrally manage student academic records.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className={`btn ${viewMode === 'classes' || viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('classes')}>
            <Users size={16} /> Classes
          </button>
          <button className={`btn ${viewMode === 'import' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('import')}>
            <Upload size={16} /> Bulk Import
          </button>
          <button className={`btn ${viewMode === 'add' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('add')}>
            <Plus size={16} /> Add Manually
          </button>
        </div>
      </div>

      {viewMode === 'classes' && (
        <div className="animate-in">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading classes...</div>
          ) : classes.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
              No classes found. Import students to automatically generate class folders.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
              {classes.map((cls, idx) => {
                const title = [cls.course, cls.branch, cls.section].filter(Boolean).join(' ') || 'Unassigned';
                return (
                  <div key={idx} className="glass-panel" style={{ padding: 'var(--space-lg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', transition: 'all 0.2s ease', ':hover': { transform: 'translateY(-2px)' } }} onClick={() => openClass(cls)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--primary)' }}>
                      <Folder size={24} />
                      <h3 style={{ margin: 0 }}>{title}</h3>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {cls.student_count} Students
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
              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setViewMode('classes')}>
                <ArrowLeft size={16} />
              </button>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                Classes <ChevronRight size={16} color="var(--text-muted)" /> 
                {activeClass ? [activeClass.course, activeClass.branch, activeClass.section].filter(Boolean).join(' ') || 'Unassigned' : 'All Students'}
              </h3>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total: {total}</div>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search by student name or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
            <button className="btn btn-secondary" onClick={fetchRecords} style={{ padding: '0.4rem 0.8rem' }}>
              <RefreshCw size={16} />
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: 'var(--space-sm)' }}>Student ID</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Name</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Roll No</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Sem/Sec</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Attendance</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Status</th>
                  <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading records...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>No records match your search.</td></tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.student_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 'var(--space-sm)', fontWeight: 500 }}>{r.student_id}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>{r.full_name}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>{r.roll_number || '-'}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>{r.semester || '-'}/{r.section || '-'}</td>
                      <td style={{ padding: 'var(--space-sm)' }}>
                        {r.attendance_percentage !== null && r.attendance_percentage !== undefined ? (
                          <span style={{ fontWeight: '500', color: r.attendance_percentage >= 75 ? 'var(--success)' : r.attendance_percentage >= 50 ? 'var(--warning)' : 'var(--error)' }}>
                            {r.attendance_percentage}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-sm)' }}>
                        {r.is_registered ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.8rem', padding: '2px 8px', backgroundColor: 'rgba(158, 206, 106, 0.1)', borderRadius: '12px' }}>
                            <CheckCircle2 size={12} /> Registered
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', fontSize: '0.8rem', padding: '2px 8px', backgroundColor: 'rgba(224, 175, 104, 0.1)', borderRadius: '12px' }}>
                            <AlertCircle size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px', border: 'none', background: 'transparent' }} onClick={() => handleEdit(r)}>
                          <Edit2 size={16} color="var(--primary)" />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '4px', border: 'none', background: 'transparent', marginLeft: '4px' }} onClick={() => handleDelete(r.student_id)}>
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

      {viewMode === 'import' && (
        <div className="glass-panel animate-in" style={{ padding: 'var(--space-xl)', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <Upload size={48} style={{ color: 'var(--primary)', marginBottom: 'var(--space-md)' }} />
          <h2 style={{ margin: '0 0 var(--space-sm) 0' }}>Bulk Import Students</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
            Upload a CSV or Excel (.xlsx) file to automatically import or update student records. 
            The file must contain a <strong>student_id</strong> column.
          </p>
          
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', margin: '0 auto' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Importing...' : 'Select File to Upload'}
          </button>
          
          {importResult && (
            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', backgroundColor: importResult.type === 'error' ? 'rgba(247, 118, 142, 0.1)' : 'rgba(158, 206, 106, 0.1)', textAlign: 'left' }}>
              {importResult.type === 'error' ? (
                <div style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <AlertCircle size={20} />
                  <span>{importResult.text}</span>
                </div>
              ) : (
                <div style={{ color: 'var(--success)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)', fontWeight: 'bold' }}>
                    <CheckCircle2 size={20} />
                    <span>{importResult.data.message}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '2rem', fontSize: '0.9rem' }}>
                    <li>Records newly added: {importResult.data.added}</li>
                    <li>Records updated: {importResult.data.updated}</li>
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div style={{ marginTop: 'var(--space-xl)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-base)', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)' }}>
            <strong>Supported Columns (Header Row):</strong><br/>
            student_id, full_name, roll_number, department, course, branch, semester, section, academic_year
          </div>
        </div>
      )}

      {viewMode === 'add' && (
        <div className="glass-panel animate-in" style={{ padding: 'var(--space-xl)', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 var(--space-lg) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Plus size={24} color="var(--primary)" /> Add / Update Student
          </h2>
          
          {formMsg.text && (
            <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', backgroundColor: formMsg.type === 'error' ? 'rgba(247, 118, 142, 0.1)' : 'rgba(158, 206, 106, 0.1)', color: formMsg.type === 'error' ? 'var(--error)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              {formMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{formMsg.text}</span>
            </div>
          )}
          
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Student ID *</label>
              <input type="text" name="student_id" className="input-field" value={formData.student_id} onChange={(e) => setFormData({...formData, student_id: e.target.value})} required />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Used for registration. If it exists, the record will be updated.</div>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Full Name *</label>
                <input type="text" name="full_name" className="input-field" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Roll Number</label>
                <input type="text" name="roll_number" className="input-field" value={formData.roll_number} onChange={(e) => setFormData({...formData, roll_number: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Course</label>
                <input type="text" name="course" className="input-field" value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} placeholder="e.g. B.Tech" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Branch/Department</label>
                <input type="text" name="branch" className="input-field" value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})} placeholder="e.g. CSE" />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Semester</label>
                <input type="text" name="semester" className="input-field" value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})} placeholder="e.g. 5" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>Section</label>
                <input type="text" name="section" className="input-field" value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} placeholder="e.g. A" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-sm)' }}>
              Save Student Record
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
