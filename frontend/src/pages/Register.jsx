import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Camera, UploadCloud } from 'lucide-react';
import Webcam from 'react-webcam';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'Student',
    reference_image_base64: null,
    student_id: ''
  });
  const [error, setError] = useState('');
  const [useWebcam, setUseWebcam] = useState(false);
  const webcamRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const capture = useCallback((e) => {
    e.preventDefault();
    const imageSrc = webcamRef.current.getScreenshot();
    setFormData({ ...formData, reference_image_base64: imageSrc });
    setUseWebcam(false);
  }, [webcamRef, formData]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, reference_image_base64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (formData.role === 'Student' && !formData.reference_image_base64) {
      setError('Students must upload a reference photo for facial recognition.');
      return;
    }
    
    if (formData.role === 'Student' && !formData.student_id) {
      setError('Students must provide a Student ID.');
      return;
    }

    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="animate-in" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: 'var(--space-md)'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: 'var(--space-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <UserPlus size={40} color="var(--primary)" style={{ marginBottom: 'var(--space-sm)' }} />
          <h2>Create Account</h2>
          <p style={{ color: 'var(--text-muted)' }}>Join the Class Attendance System</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(247, 118, 142, 0.1)', color: 'var(--error)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-md)', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.9rem' }}>First Name</label>
              <input type="text" name="first_name" className="input-field" required onChange={handleChange} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.9rem' }}>Last Name</label>
              <input type="text" name="last_name" className="input-field" required onChange={handleChange} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.9rem' }}>Email</label>
            <input type="email" name="email" className="input-field" required onChange={handleChange} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.9rem' }}>Password</label>
            <input type="password" name="password" className="input-field" required onChange={handleChange} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.9rem' }}>Role</label>
            <select name="role" className="input-field" onChange={handleChange} value={formData.role}>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          
          {formData.role === 'Student' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.9rem' }}>Student ID</label>
                <input type="text" name="student_id" className="input-field" required onChange={handleChange} />
              </div>
              
              <div style={{ 
                border: '1px dashed var(--border)', 
                padding: 'var(--space-md)', 
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                backgroundColor: 'var(--background)'
              }}>
              <Camera size={24} style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-muted)' }} />
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.9rem', fontWeight: '500' }}>
                Face Recognition Setup
              </label>
              
              {useWebcam ? (
                <div style={{ marginBottom: 'var(--space-sm)' }}>
                  <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      width="100%"
                      videoConstraints={{ facingMode: "user" }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={capture} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Take Photo</button>
                    <button className="btn btn-secondary" onClick={(e) => { e.preventDefault(); setUseWebcam(false); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                    Upload or take a clear photo of your face for automated check-in.
                  </p>
                  
                  {formData.reference_image_base64 ? (
                    <div style={{ marginBottom: 'var(--space-sm)' }}>
                      <img src={formData.reference_image_base64} alt="Face Reference" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--primary)', marginBottom: 'var(--space-xs)' }} />
                      <div style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>✓ Photo attached</div>
                      <button className="btn btn-secondary" onClick={(e) => { e.preventDefault(); setFormData({...formData, reference_image_base64: null}); }} style={{ marginTop: 'var(--space-xs)', padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}>Remove</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                      <button className="btn btn-secondary" onClick={(e) => { e.preventDefault(); setUseWebcam(true); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-xs)', fontSize: '0.8rem' }}>
                        <Camera size={16} /> Take a Picture
                      </button>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OR</div>
                      <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-xs)', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <UploadCloud size={16} /> Upload a File
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                </>
              )}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
            Register
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-lg)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
