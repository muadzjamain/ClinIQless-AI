import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaCamera, FaUpload, FaImage, FaInfoCircle, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import './SkinAnalysis.css';

function SkinAnalysis() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [pastAnalyses, setPastAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  
  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  
  const db = getFirestore();
  const storage = getStorage();
  
  // Get user's preferred language
  const userLanguage = userProfile?.language || 'en';
  
  // Multilingual labels
  const labels = {
    en: {
      title: 'Skin Analysis',
      description: 'Upload or take a photo of your skin concern for AI analysis',
      uploadImage: 'Upload Image',
      takePhoto: 'Take Photo',
      analyzeImage: 'Analyze Image',
      analyzing: 'Analyzing...',
      uploadAnother: 'Upload Another Image',
      pastAnalyses: 'Past Analyses',
      noPastAnalyses: 'No past skin analyses found',
      capturePhoto: 'Capture Photo',
      retake: 'Retake',
      loading: 'Loading...',
      errorCamera: 'Error accessing camera',
      errorUpload: 'Error uploading image',
      errorAnalysis: 'Error analyzing image',
      disclaimer: 'This tool is for informational purposes only and should not replace professional medical advice.',
      condition: 'Condition',
      confidence: 'Confidence',
      recommendation: 'Recommendation',
      date: 'Date',
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    },
    ms: {
      title: 'Analisis Kulit',
      description: 'Muat naik atau ambil gambar masalah kulit anda untuk analisis AI',
      uploadImage: 'Muat Naik Imej',
      takePhoto: 'Ambil Gambar',
      analyzeImage: 'Analisis Imej',
      analyzing: 'Menganalisis...',
      uploadAnother: 'Muat Naik Imej Lain',
      pastAnalyses: 'Analisis Lepas',
      noPastAnalyses: 'Tiada analisis kulit lepas ditemui',
      capturePhoto: 'Tangkap Gambar',
      retake: 'Ambil Semula',
      loading: 'Memuatkan...',
      errorCamera: 'Ralat mengakses kamera',
      errorUpload: 'Ralat memuat naik imej',
      errorAnalysis: 'Ralat menganalisis imej',
      disclaimer: 'Alat ini adalah untuk tujuan informasi sahaja dan tidak boleh menggantikan nasihat perubatan profesional.',
      condition: 'Keadaan',
      confidence: 'Keyakinan',
      recommendation: 'Cadangan',
      date: 'Tarikh',
      high: 'Tinggi',
      medium: 'Sederhana',
      low: 'Rendah'
    }
  };
  
  // Use the appropriate language
  const t = labels[userLanguage] || labels.en;
  
  // Fetch past skin analyses
  useEffect(() => {
    async function fetchPastAnalyses() {
      if (!currentUser) return;
      
      try {
        const analysesQuery = query(
          collection(db, 'skinAnalyses'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        
        const analysesSnapshot = await getDocs(analysesQuery);
        const analysesData = analysesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPastAnalyses(analysesData);
      } catch (error) {
        console.error('Error fetching past analyses:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPastAnalyses();
  }, [currentUser, db]);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }
    
    // Check if file size is less than 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalysisResult(null);
    setError('');
  };
  
  // Handle camera access
  const startCamera = async () => {
    setShowCamera(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError(t.errorCamera);
      setShowCamera(false);
    }
  };
  
  // Handle taking photo
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      setImage(blob);
      setImagePreview(canvas.toDataURL('image/jpeg'));
      
      // Stop camera stream
      const stream = video.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      setShowCamera(false);
      setAnalysisResult(null);
    }, 'image/jpeg', 0.8);
  };
  
  // Handle analyze image
  const analyzeImage = async () => {
    if (!image) {
      setError('Please upload or take a photo first');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `skinImages/${currentUser.uid}/${Date.now()}`);
      await uploadBytes(storageRef, image);
      const imageUrl = await getDownloadURL(storageRef);
      
      setUploading(false);
      setAnalyzing(true);
      
      // In a real implementation, we would call an AI API for analysis
      // For demo purposes, simulate an analysis result after a delay
      setTimeout(async () => {
        // Generate a simulated analysis result
        const result = generateSimulatedResult();
        
        // Save analysis to Firestore
        const analysisData = {
          userId: currentUser.uid,
          imageUrl,
          result,
          timestamp: new Date()
        };
        
        const docRef = await addDoc(collection(db, 'skinAnalyses'), analysisData);
        
        // Set analysis result and update past analyses
        setAnalysisResult(result);
        setPastAnalyses([
          {
            id: docRef.id,
            ...analysisData
          },
          ...pastAnalyses
        ]);
        
        setAnalyzing(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError(t.errorAnalysis);
      setUploading(false);
      setAnalyzing(false);
    }
  };
  
  // Generate simulated analysis result
  const generateSimulatedResult = () => {
    const conditions = [
      {
        name: 'Acne',
        confidence: Math.floor(70 + Math.random() * 30),
        recommendations: [
          'Keep the affected area clean with a gentle cleanser',
          'Avoid touching or picking at the affected area',
          'Consider over-the-counter products containing benzoyl peroxide or salicylic acid',
          'If severe, consult a dermatologist for prescription treatment'
        ]
      },
      {
        name: 'Eczema',
        confidence: Math.floor(60 + Math.random() * 30),
        recommendations: [
          'Use moisturizers regularly to prevent dry skin',
          'Avoid harsh soaps and irritants',
          'Apply cool compresses to relieve itching',
          'Consider using over-the-counter hydrocortisone cream for mild symptoms'
        ]
      },
      {
        name: 'Psoriasis',
        confidence: Math.floor(65 + Math.random() * 30),
        recommendations: [
          'Keep skin moisturized with fragrance-free products',
          'Avoid triggers like stress and skin injuries',
          'Consider light therapy under medical supervision',
          'Consult a dermatologist for prescription treatments'
        ]
      },
      {
        name: 'Contact Dermatitis',
        confidence: Math.floor(75 + Math.random() * 25),
        recommendations: [
          'Identify and avoid the irritant or allergen',
          'Use cool compresses to relieve symptoms',
          'Apply over-the-counter hydrocortisone cream',
          'If severe or persistent, consult a healthcare provider'
        ]
      },
      {
        name: 'Rosacea',
        confidence: Math.floor(65 + Math.random() * 30),
        recommendations: [
          'Avoid triggers like spicy foods, alcohol, and extreme temperatures',
          'Use gentle, non-abrasive cleansers',
          'Apply broad-spectrum sunscreen daily',
          'Consider prescription treatments from a dermatologist'
        ]
      }
    ];
    
    // Randomly select a condition
    const selectedCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return selectedCondition;
  };
  
  // Reset image and analysis
  const resetImage = () => {
    setImage(null);
    setImagePreview('');
    setAnalysisResult(null);
    setError('');
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return new Intl.DateTimeFormat(userLanguage === 'ms' ? 'ms-MY' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get confidence level class and text
  const getConfidenceLevel = (score) => {
    if (score >= 80) {
      return { class: 'high', text: t.high };
    } else if (score >= 60) {
      return { class: 'medium', text: t.medium };
    } else {
      return { class: 'low', text: t.low };
    }
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <FaCamera className="title-icon" />
          {t.title}
        </h1>
        <p className="page-description">{t.description}</p>
      </div>
      
      {/* Disclaimer */}
      <div className={`disclaimer ${theme}`}>
        <FaInfoCircle className="disclaimer-icon" />
        <p>{t.disclaimer}</p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className={`alert alert-error ${theme}`}>
          <FaTimes className="alert-icon" />
          {error}
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {/* Camera View */}
      {showCamera && (
        <div className={`camera-container ${theme}`}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
            className="camera-view"
          ></video>
          
          <div className="camera-controls">
            <button 
              className="btn btn-primary btn-capture"
              onClick={capturePhoto}
            >
              <FaCamera />
              {t.capturePhoto}
            </button>
            
            <button 
              className="btn btn-outline"
              onClick={() => setShowCamera(false)}
            >
              {t.retake}
            </button>
          </div>
          
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </div>
      )}
      
      {/* Image Upload and Analysis */}
      {!showCamera && (
        <div className={`analysis-container ${theme}`}>
          <div className="image-section">
            {imagePreview ? (
              <div className="image-preview-container">
                <img 
                  src={imagePreview} 
                  alt="Skin" 
                  className="image-preview"
                />
                
                {!analysisResult && (
                  <div className="image-actions">
                    <button 
                      className="btn btn-outline"
                      onClick={resetImage}
                    >
                      {t.uploadAnother}
                    </button>
                    
                    <button 
                      className="btn btn-primary"
                      onClick={analyzeImage}
                      disabled={uploading || analyzing}
                    >
                      {uploading ? (
                        <FaSpinner className="spinner-icon" />
                      ) : analyzing ? (
                        <>
                          <FaSpinner className="spinner-icon" />
                          {t.analyzing}
                        </>
                      ) : (
                        <>
                          <FaImage />
                          {t.analyzeImage}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="upload-options">
                <div className="upload-option">
                  <button 
                    className="btn btn-primary btn-upload"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <FaUpload />
                    {t.uploadImage}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
                
                <div className="upload-option">
                  <button 
                    className="btn btn-primary btn-camera"
                    onClick={startCamera}
                  >
                    <FaCamera />
                    {t.takePhoto}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Analysis Result */}
          {analysisResult && (
            <div className="result-section">
              <div className="result-header">
                <h2 className="condition-name">{analysisResult.name}</h2>
                
                <div className={`confidence-badge ${getConfidenceLevel(analysisResult.confidence).class}`}>
                  <span className="confidence-score">{analysisResult.confidence}%</span>
                  <span className="confidence-label">{t.confidence}</span>
                </div>
              </div>
              
              <div className="recommendations">
                <h3>{t.recommendation}</h3>
                <ul className="recommendation-list">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
              
              <div className="result-actions">
                <button 
                  className="btn btn-primary"
                  onClick={resetImage}
                >
                  {t.uploadAnother}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Past Analyses */}
      <div className="section-header">
        <h2>{t.pastAnalyses}</h2>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t.loading}</p>
        </div>
      ) : (
        <div className="past-analyses">
          {pastAnalyses.length > 0 ? (
            pastAnalyses.map(analysis => {
              // Add null checks for analysis.result
              if (!analysis || !analysis.result) {
                return null; // Skip rendering this item if result is missing
              }
              
              const confidence = analysis.result.confidence ? getConfidenceLevel(analysis.result.confidence) : { class: 'medium', text: t.medium };
              
              return (
                <div key={analysis.id} className={`analysis-card ${theme}`}>
                  <div className="analysis-image">
                    <img src={analysis.imageUrl || ''} alt="Skin" />
                  </div>
                  
                  <div className="analysis-content">
                    <div className="analysis-header">
                      <h3 className="condition-name">{analysis.result.name || 'Unknown'}</h3>
                      
                      <div className={`confidence-badge ${confidence.class}`}>
                        <span className="confidence-score">{analysis.result.confidence || 0}%</span>
                      </div>
                    </div>
                    
                    <div className="analysis-recommendations">
                      <ul>
                        {(analysis.result.recommendations || []).slice(0, 2).map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="analysis-date">
                      {formatDate(analysis.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`empty-state ${theme}`}>
              <FaCamera className="empty-icon" />
              <p>{t.noPastAnalyses}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SkinAnalysis;
