import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { apiClient } from '../api/client';
import { Camera, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function CheckInWidget({ sessionCode }) {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, capturing, locating, verifying, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    return imageSrc;
  }, [webcamRef]);

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => {
            reject(new Error('Unable to retrieve your location. Please allow location access.'));
          }
        );
      }
    });
  };

  const handleCheckIn = async () => {
    setStatus('capturing');
    setErrorMsg('');
    const image = capture();
    
    setStatus('locating');
    try {
      const coords = await getLocation();
      setLocation(coords);
      
      setStatus('verifying');
      const payload = {
        image_base64: image,
        latitude: coords.lat,
        longitude: coords.lng
      };
      
      await apiClient.post(`/sessions/code/${sessionCode}/checkin`, payload);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || err.message || 'Check-in failed');
    }
  };

  const reset = () => {
    setImgSrc(null);
    setLocation(null);
    setStatus('idle');
    setErrorMsg('');
  };

  return (
    <div className="glass-panel" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
      <h3 style={{ marginBottom: 'var(--space-md)' }}>Advanced Check-In</h3>
      
      {status === 'success' ? (
        <div style={{ color: 'var(--primary)', padding: 'var(--space-xl)' }}>
          <CheckCircle size={64} style={{ margin: '0 auto var(--space-md)' }} />
          <h2>Checked In Successfully!</h2>
          <p>Your attendance has been recorded via Face ID & Geolocation.</p>
        </div>
      ) : (
        <>
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '400px', 
            margin: '0 auto var(--space-md)', 
            borderRadius: 'var(--radius-md)', 
            overflow: 'hidden',
            border: '2px solid var(--border)'
          }}>
            {!imgSrc ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                videoConstraints={{ facingMode: "user" }}
              />
            ) : (
              <img src={imgSrc} alt="Captured" style={{ width: '100%' }} />
            )}
          </div>
          
          {status === 'error' && (
            <div style={{ color: 'var(--error)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}>
              <XCircle size={20} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
            {status === 'idle' || status === 'error' ? (
              <button className="btn btn-primary" onClick={handleCheckIn} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                <Camera size={18} /> Verify Identity & Location
              </button>
            ) : (
              <button className="btn btn-secondary" disabled style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                <Loader size={18} className="animate-spin" /> {
                  status === 'capturing' ? 'Capturing Face...' :
                  status === 'locating' ? 'Verifying GPS...' :
                  'Running AI Verification...'
                }
              </button>
            )}
            
            {status === 'error' && (
              <button className="btn btn-secondary" onClick={reset}>Try Again</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
