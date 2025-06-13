import React, { useState, useRef, useEffect } from 'react';
import { FaCamera, FaTimes, FaRedo, FaCheck } from 'react-icons/fa';
import './CameraCapture.css';

function CameraCapture({ onCapture, onCancel }) {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize camera when component mounts
  useEffect(() => {
    startCamera();
    
    // Cleanup function to stop camera when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  // Start camera with specified facing mode
  const startCamera = async () => {
    try {
      setCameraError('');
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Reset captured image when restarting camera
      setCapturedImage(null);
      
      // Start face detection
      startFaceDetection();
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Could not access camera. Please ensure you have granted camera permissions.');
    }
  };

  // Simple face detection simulation
  // In a production app, you would use a real face detection library
  const startFaceDetection = () => {
    // Simulate face detection after 1.5 seconds
    // In production, replace with actual face detection API
    setTimeout(() => {
      setIsFaceDetected(true);
    }, 1500);
  };

  // Switch between front and back camera
  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  // Capture image from video stream
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Start countdown
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          
          // Capture the image
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get image as data URL
          const imageDataURL = canvas.toDataURL('image/jpeg');
          setCapturedImage(imageDataURL);
          
          // Convert to blob for upload
          canvas.toBlob(blob => {
            if (blob) {
              // Pass the captured image blob to parent component
              onCapture(blob, imageDataURL);
            }
          }, 'image/jpeg', 0.95);
          
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Cancel and close camera
  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  return (
    <div className={`camera-capture-container ${capturedImage ? 'preview-mode' : ''}`}>
      {cameraError ? (
        <div className="camera-error">
          <FaTimes className="error-icon" />
          <p>{cameraError}</p>
          <button className="btn-primary" onClick={handleCancel}>Close</button>
        </div>
      ) : (
        <>
          {!capturedImage ? (
            <>
              <div className="video-container">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                />
                
                {/* Face guide overlay */}
                <div className="face-guide">
                  <div className="face-outline"></div>
                  <p className="guide-text">Make sure nothing is blocking your face</p>
                </div>
                
                {/* Countdown overlay */}
                {countdown && (
                  <div className="countdown-overlay">
                    <span className="countdown-number">{countdown}</span>
                  </div>
                )}
              </div>
              
              <div className="camera-controls">
                <button 
                  className="btn-icon" 
                  onClick={handleCancel}
                >
                  <FaTimes />
                </button>
                
                <button 
                  className="btn-capture" 
                  onClick={captureImage}
                  disabled={!isFaceDetected}
                >
                  <FaCamera />
                </button>
                
                <button 
                  className="btn-icon" 
                  onClick={switchCamera}
                >
                  <FaRedo />
                </button>
              </div>
              
              {!isFaceDetected && (
                <div className="face-detection-message">
                  <p>Detecting face...</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="preview-container">
                <img src={capturedImage} alt="Captured" className="captured-image" />
              </div>
              
              <div className="preview-controls">
                <button 
                  className="btn-secondary" 
                  onClick={retakePhoto}
                >
                  <FaRedo /> Retake
                </button>
                
                <button 
                  className="btn-primary" 
                  onClick={() => onCapture(null, capturedImage)}
                >
                  <FaCheck /> Use Photo
                </button>
              </div>
            </>
          )}
        </>
      )}
      
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default CameraCapture;
