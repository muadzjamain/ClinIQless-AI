import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaCamera, FaUpload, FaInfoCircle, FaSpinner, FaTimes, FaHistory } from 'react-icons/fa';
import CameraCapture from '../components/skin/CameraCapture';
import ResultsView from '../components/skin/ResultsView';
import './SkinAnalysis.css';

function SkinAnalysis() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [pastAnalyses, setPastAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('main'); // 'main', 'camera', 'results', 'history'
  
  const fileInputRef = useRef();
  
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
  
  // Use the appropriate language labels
  const currentLabels = labels[userLanguage] || labels.en;
  
  // Fetch past analyses from Firestore
  const fetchPastAnalyses = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const q = query(
        collection(db, 'skinAnalyses'),
        where('userId', '==', currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const analyses = [];
      
      querySnapshot.forEach((doc) => {
        analyses.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPastAnalyses(analyses);
    } catch (err) {
      console.error('Error fetching past analyses:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, db]);
  
  // Load past analyses
  useEffect(() => {
    if (currentUser) {
      fetchPastAnalyses();
    } else {
      setPastAnalyses([]);
      setLoading(false);
    }
  }, [currentUser, fetchPastAnalyses]);
  
  // Handle file upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setError('');
    
    // Check file type
    if (!file.type.match('image.*')) {
      setError(labels[userLanguage].errorFileType);
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(labels[userLanguage].errorFileSize);
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    setImage(file);
    setAnalysisResult(null);
  };
  
  // Reset image
  const resetImage = () => {
    setImage(null);
    setImagePreview('');
    setAnalysisResult(null);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Reset analysis
  const resetAnalysis = () => {
    setAnalysisResult(null);
    setImagePreview('');
    setImage(null);
    setActiveView('main');
  };
  
  // Handle camera capture
  const handleCameraStart = () => {
    setError('');
    setActiveView('camera');
  };
  
  const handleCameraCapture = (capturedImage) => {
    setImage(capturedImage);
    setImagePreview(URL.createObjectURL(capturedImage));
    setActiveView('main');
  };
  
  const handleCameraCancel = () => {
    setActiveView('main');
  };
  
  // Handle analyze image
  const analyzeImage = async () => {
    if (!image) return;
    
    try {
      setAnalyzing(true);
      setError('');
      
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `skinImages/${currentUser.uid}/${Date.now()}`);
      await uploadBytes(storageRef, image);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('image', image);
      formData.append('imageUrl', downloadURL);
      formData.append('lightCondition', 'indoor'); // Could be detected or selected by user
      formData.append('bodyPart', 'face');
      formData.append('notes', '');
      
      // Get the user's ID token for authentication
      const idToken = await currentUser.getIdToken();
      
      // Call the backend API for skin analysis
      const response = await fetch('/api/skin/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze skin image');
      }
      
      // Get the analysis result
      const analysisData = await response.json();
      const result = analysisData.data;
      
      // Add user information to the result
      result.userName = userProfile?.displayName || currentUser.email;
      result.imageUrl = downloadURL;
      
      // Convert conditions format for compatibility with existing UI
      result.skinConditions = result.conditions?.map(c => ({
        name: c.name,
        active: c.active,
        type: c.name.toLowerCase().replace(' ', '-')
      })) || [];
      
      // For compatibility with existing code
      result.skinScore = result.overallScore;
      result.recommendation = 'Based on our analysis, we recommend following the personalized skincare routine provided.';
      
      // Set the analysis result
      setAnalysisResult(result);
      
      // No need to save to Firestore again as the backend already did that
      
      // Show results view
      setActiveView('results');
      
      // Refresh past analyses
      fetchPastAnalyses();
      
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError(currentLabels.errorAnalysis);
    } finally {
      setAnalyzing(false);
    }
  };
  
  // View a past analysis
  const viewPastAnalysis = (analysis) => {
    setAnalysisResult(analysis);
    setImagePreview(analysis.imageUrl);
    setActiveView('results');
  };
  
  return (
    <div className={`skin-analysis-container ${theme}`}>
      {activeView === 'main' && (
        <>
          <div className="skin-analysis-header">
            <h1>{currentLabels.title}</h1>
            <p className="description">
              <FaInfoCircle className="info-icon" />
              {currentLabels.description}
            </p>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <FaSpinner className="spinner" />
              <p>{currentLabels.loading}</p>
            </div>
          ) : error ? (
            <div className="error-container">
              {error && <p className="error-message">{error}</p>}
              <FaTimes className="error-icon" />
              <p>{currentLabels.intro}</p>
            </div>
          ) : (
            <div className="skin-analysis-content">
              {!imagePreview ? (
                <div className="upload-section">
                  <div className="upload-options">
                    <button className="upload-option" onClick={() => fileInputRef.current.click()}>
                      <FaUpload className="option-icon" />
                      <span>{currentLabels.uploadImage}</span>
                    </button>
                    
                    <button className="upload-option" onClick={handleCameraStart}>
                      <FaCamera className="option-icon" />
                      <span>{currentLabels.takePhoto}</span>
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                </div>
              ) : analysisResult ? (
                <div className="result-section">
                  <div className="result-header">
                    <h2>Analysis Results</h2>
                    <button className="btn-primary" onClick={resetAnalysis}>
                      {currentLabels.uploadAnother}
                    </button>
                  </div>
                  
                  <ResultsView 
                    result={analysisResult} 
                    onShare={() => console.log('Share result')} 
                    onSave={() => console.log('Save result')} 
                  />
                </div>
              ) : (
                <div className="upload-progress">
                  {analyzing ? (
                    <div className="analyzing-indicator">
                      <FaSpinner className="spinner" /> {currentLabels.analyzing}
                    </div>
                  ) : null}
                  <div className="preview-section">
                    <div className="preview-image">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                    
                    <div className="preview-actions">
                      <button className="btn-secondary" onClick={resetImage}>
                        {currentLabels.uploadAnother}
                      </button>
                      
                      <button 
                        className="btn-primary" 
                        onClick={analyzeImage}
                        disabled={analyzing}
                      >
                        {analyzing ? (
                          <>
                            <FaSpinner className="spinner" />
                            {currentLabels.analyzing}
                          </>
                        ) : (
                          currentLabels.analyzeImage
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Past analyses section */}
              {pastAnalyses.length > 0 && (
                <div className="past-analyses-section">
                  <h2>
                    <FaHistory className="section-icon" />
                    {currentLabels.pastAnalyses}
                  </h2>
                  <div className="past-analyses-list">
                    {pastAnalyses.map((analysis, index) => (
                      <div key={index} className="past-analysis-item" onClick={() => viewPastAnalysis(analysis)}>
                        <div className="past-analysis-image">
                          <img src={analysis.imageUrl} alt={`Past analysis ${index + 1}`} />
                        </div>
                        <div className="past-analysis-info">
                          <p className="past-analysis-date">
                            {new Date(analysis.timestamp).toLocaleDateString()}
                          </p>
                          <p className="past-analysis-type">{analysis.skinType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="disclaimer">
            <FaInfoCircle className="disclaimer-icon" />
            <p>{labels[userLanguage].disclaimer}</p>
          </div>
        </>
      )}
      
      {activeView === 'camera' && (
        <CameraCapture 
          onCapture={handleCameraCapture} 
          onCancel={handleCameraCancel} 
        />
      )}
      
      {activeView === 'results' && analysisResult && (
        <ResultsView 
          result={analysisResult} 
          onShare={() => console.log('Share result')} 
          onSave={() => {
            setActiveView('main');
            console.log('Save result');
          }} 
        />
      )}
    </div>
  );
}

export default SkinAnalysis;
