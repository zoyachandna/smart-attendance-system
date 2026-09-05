import React, { useState } from 'react';
import { FileText, Download, Loader, Calendar, Users, Activity } from 'lucide-react';
import { apiClient } from '../api/client';

export default function AdminReportsWidget() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadAttendance = async () => {
    try {
      setDownloading(true);
      setError('');
      
      const response = await apiClient.get('/admin/export/attendance', {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance_report.csv');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download the report. Please try again later.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ margin: 0 }}>Export Reports</h1>
        <p style={{ color: 'var(--text-muted)' }}>Generate and download CSV reports for external analytics and record-keeping.</p>
      </div>
      
      {error && (
        <div style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(247, 118, 142, 0.1)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-lg)' }}>
        
        {/* Master Attendance Report */}
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(122, 162, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <FileText size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Master Attendance Log</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Format: CSV File</div>
            </div>
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 'var(--space-lg)', flex: 1 }}>
            A complete historical log of all attendance records across all classes. Includes student ID, check-in time, location distance, and method.
          </p>
          
          <button 
            className="btn btn-primary" 
            onClick={handleDownloadAttendance} 
            disabled={downloading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {downloading ? <><Loader size={18} className="animate-spin" /> Generating...</> : <><Download size={18} /> Download CSV</>}
          </button>
        </div>

      </div>
    </div>
  );
}
