import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaCamera, FaUpload, FaImage, FaInfoCircle, FaSpinner, FaTimes, FaTrash } from 'react-icons/fa';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { 
  WaterDrop, 
  Balance, 
  Opacity, 
  Grain, 
  Face, 
  RemoveRedEye, 
  Brightness3, 
  FaceRetouchingOff, 
  CleaningServices, 
  Elderly 
} from '@mui/icons-material';
import './SkinAnalysis.css';

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

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
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState(null);
  
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
      recommendation: 'Recommendations',
      confidence: 'Confidence',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      skinReport: 'Your skin report',
      skinScore: 'Skin score',
      skinAge: 'Skin age',
      yourSkin: 'Your skin',
      skinInfoText: 'You can view and edit your skin information in profile setting',
      type: 'Type',
      tone: 'Tone',
      dry: 'Dry',
      normal: 'Normal',
      combination: 'Combination',
      oily: 'Oily',
      skinTypeIs: 'Your skin type is',
      tips: 'Tips',
      skinConditions: 'Skin conditions',
      sensitivity: 'Sensitivity',
      darkCircles: 'Dark circles',
      acne: 'Acne',
      comedones: 'Comedones',
      wrinkles: 'Wrinkles',
      yourSkinIs: 'Your skin is',
      excellent: 'excellent',
      moderate: 'moderate',
      strong: 'Strong',
      sensitive: 'Sensitive',
      weak: 'Weak',
      post: 'Post',
      share: 'Share',
      rescan: 'Rescan',
      smoothness: 'Smoothness',
      fineness: 'Fineness',
      homogeneity: 'Homogeneity',
      moisture: 'Moisture',
      elasticity: 'Elasticity'
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
      noPastAnalyses: 'Tiada analisis kulit lepas dijumpai',
      capturePhoto: 'Tangkap Gambar',
      retake: 'Ambil Semula',
      loading: 'Memuatkan...',
      errorCamera: 'Ralat mengakses kamera',
      errorUpload: 'Ralat memuat naik imej',
      errorAnalysis: 'Ralat menganalisis imej',
      disclaimer: 'Alat ini adalah untuk tujuan maklumat sahaja dan tidak boleh menggantikan nasihat perubatan profesional.',
      recommendation: 'Cadangan',
      confidence: 'Keyakinan',
      high: 'Tinggi',
      medium: 'Sederhana',
      low: 'Rendah',
      skinReport: 'Laporan kulit anda',
      skinScore: 'Skor kulit',
      skinAge: 'Umur kulit',
      yourSkin: 'Kulit anda',
      skinInfoText: 'Anda boleh melihat dan mengedit maklumat kulit anda dalam tetapan profil',
      type: 'Jenis',
      tone: 'Tona',
      dry: 'Kering',
      normal: 'Normal',
      combination: 'Kombinasi',
      oily: 'Berminyak',
      skinTypeIs: 'Jenis kulit anda adalah',
      tips: 'Tip',
      skinConditions: 'Keadaan kulit',
      sensitivity: 'Kepekaan',
      darkCircles: 'Lingkaran gelap',
      acne: 'Jerawat',
      comedones: 'Komedo',
      wrinkles: 'Kedutan',
      yourSkinIs: 'Kulit anda adalah',
      excellent: 'cemerlang',
      moderate: 'sederhana',
      strong: 'Kuat',
      sensitive: 'Sensitif',
      weak: 'Lemah',
      post: 'Hantar',
      share: 'Kongsi',
      rescan: 'Imbas Semula',
      smoothness: 'Kelancaran',
      fineness: 'Kehalusan',
      homogeneity: 'Kehomogenan',
      moisture: 'Kelembapan',
      elasticity: 'Keanjalan'
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
    // Generate skin metrics for radar chart
    const skinMetrics = {
      smoothness: Math.floor(60 + Math.random() * 40),
      fineness: Math.floor(60 + Math.random() * 40),
      homogeneity: Math.floor(60 + Math.random() * 40),
      moisture: Math.floor(60 + Math.random() * 40),
      elasticity: Math.floor(60 + Math.random() * 40),
      sensitivity: Math.floor(60 + Math.random() * 40)
    };
    
    // Calculate overall skin score (0-100)
    const skinScore = Math.floor(
      (skinMetrics.smoothness + 
       skinMetrics.fineness + 
       skinMetrics.homogeneity + 
       skinMetrics.moisture + 
       skinMetrics.elasticity) / 5
    );
    
    // Calculate skin age (typically -5 to +5 years from actual age)
    const userAge = userProfile?.age || 25;
    const ageDifference = Math.floor(Math.random() * 10) - 5;
    const skinAge = Math.max(16, userAge + ageDifference);
    
    // Determine skin type
    const skinTypes = ['dry', 'normal', 'combination', 'oily'];
    const skinType = skinTypes[Math.floor(Math.random() * skinTypes.length)];
    
    // Determine skin tone
    const skinTone = userProfile?.skinTone || 'medium';
    
    // Determine skin conditions
    const possibleConditions = [
      {
        id: 'sensitivity',
        name: 'Sensitivity',
        detected: skinMetrics.sensitivity > 70,
        level: skinMetrics.sensitivity > 80 ? 'high' : 'moderate',
        description: 'Sensitive skin is more prone to redness, itchy, and burning etc. Special care is needed for your skin to maintain a healthy glow.',
        tips: [
          'Only use products for sensitive skin.',
          'Avoid products with fragrances, alcohol, and harsh chemicals.'
        ]
      },
      {
        id: 'darkCircles',
        name: 'Dark circles',
        detected: Math.random() > 0.7,
        level: Math.random() > 0.5 ? 'high' : 'moderate',
        description: 'Dark circles appear as darkened skin under the eyes, often due to fatigue, aging, or genetics.',
        tips: [
          'Get adequate sleep and stay hydrated.',
          'Use eye creams with vitamin C, retinol, or caffeine.'
        ]
      },
      {
        id: 'acne',
        name: 'Acne',
        detected: skinType === 'oily' && Math.random() > 0.5,
        level: Math.random() > 0.5 ? 'high' : 'moderate',
        description: 'Acne occurs when hair follicles become clogged with oil and dead skin cells, leading to pimples, blackheads, or whiteheads.',
        tips: [
          'Cleanse your face twice daily with a gentle cleanser.',
          'Use non-comedogenic products and consider products with salicylic acid or benzoyl peroxide.'
        ]
      },
      {
        id: 'comedones',
        name: 'Comedones',
        detected: skinType === 'oily' && Math.random() > 0.6,
        level: Math.random() > 0.5 ? 'high' : 'moderate',
        description: 'Comedones are small, flesh-colored, white, or dark bumps that give the skin a rough texture.',
        tips: [
          'Use products with retinoids or salicylic acid.',
          'Exfoliate regularly but gently.'
        ]
      },
      {
        id: 'wrinkles',
        name: 'Wrinkles',
        detected: skinAge > 30 && Math.random() > 0.6,
        level: Math.random() > 0.5 ? 'high' : 'moderate',
        description: 'Wrinkles are creases or folds in the skin that typically appear as we age due to decreased collagen production.',
        tips: [
          'Use products with retinol, peptides, and antioxidants.',
          'Always wear sunscreen to prevent further damage.'
        ]
      }
    ];
    
    // Filter detected conditions
    const detectedConditions = possibleConditions.filter(condition => condition.detected);
    
    // If no conditions detected, add a positive message
    if (detectedConditions.length === 0) {
      detectedConditions.push({
        id: 'healthy',
        name: 'Healthy Skin',
        detected: true,
        level: 'excellent',
        description: 'Your skin is amazing. Stick to your current skincare routines.',
        tips: [
          'Continue with your current skincare routine.',
          'Stay hydrated and maintain a balanced diet.'
        ]
      });
    }
    
    // Generate tips based on skin type
    const skinTypeTips = {
      dry: [
        'Use a gentle, hydrating cleanser that doesn\'t strip your skin of natural oils.',
        'Apply a rich moisturizer immediately after washing your face or showering.',
        'Consider using a humidifier to add moisture to the air, especially during winter.'
      ],
      normal: [
        'Maintain your balanced skin with a consistent skincare routine.',
        'Use a gentle cleanser and lightweight moisturizer.',
        'Don\'t forget to apply sunscreen daily to protect your skin.'
      ],
      combination: [
        'Use different products for different areas of your face - lighter products on oily areas and richer ones on dry areas.',
        'Consider using a balancing toner after cleansing.',
        'Exfoliate regularly but gently to remove dead skin cells.'
      ],
      oily: [
        'Cleanse your face twice daily with oil-free cleansers. Don\'t wash or scrub your face too much, which might cause a lack of moisture and the sebaceous glands to produce more oil.',
        'Follow up with toner after washing your face. And exfoliate your skin regularly to clear dead skin cells.',
        'Use oil-free and non-comedogenic moisturizers and sunscreens.'
      ]
    };
    
    return {
      skinMetrics,
      skinScore,
      skinAge,
      skinType,
      skinTone,
      conditions: detectedConditions,
      typeTips: skinTypeTips[skinType],
      overallMessage: skinScore > 90 
        ? "Your skin is amazing. Stick to your current skincare routines." 
        : "Your skin is healthy. Continue with a consistent skincare routine."
    };
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
  
  // Delete an analysis
  const handleDeleteAnalysis = (analysisId) => {
    setAnalysisToDelete(analysisId);
    setShowDeleteConfirm(true);
  };
  
  // Confirm deletion of an analysis
  const confirmDeleteAnalysis = async () => {
    try {
      const analysisToDeleteDoc = pastAnalyses.find(a => a.id === analysisToDelete);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'skinAnalyses', analysisToDelete));
      
      // Delete the image file from Storage if it exists
      if (analysisToDeleteDoc?.imageUrl) {
        const imageRef = ref(storage, analysisToDeleteDoc.imageUrl);
        await deleteObject(imageRef).catch(err => console.log('Image file may have already been deleted', err));
      }
      
      // Update the analyses list
      setPastAnalyses(pastAnalyses.filter(analysis => analysis.id !== analysisToDelete));
      
      // Reset states
      setShowDeleteConfirm(false);
      setAnalysisToDelete(null);
      
    } catch (error) {
      console.error('Error deleting analysis:', error);
      setError('Failed to delete analysis');
      setShowDeleteConfirm(false);
    }
  };
  
  // Cancel deletion
  const cancelDeleteAnalysis = () => {
    setShowDeleteConfirm(false);
    setAnalysisToDelete(null);
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
      
      {/* Disclaimer removed */}
      
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
              {/* Skin Report Header */}
              <div className="report-header">
                <h2>{t.skinReport}</h2>
                <div className="report-date">
                  {formatDate(new Date())}
                </div>
              </div>
              
              {/* User Info */}
              <div className="user-info">
                <div className="user-avatar">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" />
                  ) : (
                    <div className="avatar-placeholder">{currentUser?.displayName?.[0] || currentUser?.email?.[0] || '?'}</div>
                  )}
                </div>
                <div className="user-name">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </div>
                <div className="overall-message">
                  {analysisResult.overallMessage}
                </div>
              </div>
              
              {/* Skin Metrics */}
              <div className="skin-metrics">
                <div className="metric-box">
                  <div className="metric-label">{t.skinScore}</div>
                  <div className="metric-value score">{analysisResult.skinScore}</div>
                </div>
                
                <div className="metric-box">
                  <div className="metric-label">{t.skinAge}</div>
                  <div className="metric-value age">{analysisResult.skinAge}</div>
                </div>
              </div>
              
              {/* Radar Chart - using Chart.js */}
              <div className="radar-chart">
                <div className="radar-chart-container">
                  <Radar
                    data={{
                      labels: [t.smoothness, t.fineness, t.homogeneity, t.moisture, t.sensitivity || t.elasticity],
                      datasets: [
                        {
                          data: [
                            analysisResult.skinMetrics.smoothness,
                            analysisResult.skinMetrics.fineness,
                            analysisResult.skinMetrics.homogeneity,
                            analysisResult.skinMetrics.moisture,
                            analysisResult.skinMetrics.elasticity || analysisResult.skinMetrics.sensitivity
                          ],
                          backgroundColor: 'rgba(77, 166, 255, 0.5)',
                          borderColor: 'rgba(77, 166, 255, 0.8)',
                          borderWidth: 1,
                          pointBackgroundColor: 'rgba(77, 166, 255, 0)',
                          pointBorderColor: 'rgba(77, 166, 255, 0)',
                          pointHoverBackgroundColor: 'rgba(77, 166, 255, 1)',
                          pointHoverBorderColor: '#fff',
                          pointRadius: 0,
                          fill: true
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      scales: {
                        r: {
                          min: 0,
                          max: 100,
                          beginAtZero: true,
                          ticks: {
                            display: false,
                            stepSize: 20
                          },
                          pointLabels: {
                            font: {
                              size: 12,
                              family: "'Poppins', sans-serif",
                              weight: '500'
                            },
                            color: theme === 'dark' ? '#aaa' : '#666',
                            padding: 15
                          },
                          grid: {
                            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            circular: true
                          },
                          angleLines: {
                            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            lineWidth: 1
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          enabled: true,
                          backgroundColor: theme === 'dark' ? 'rgba(40, 44, 52, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                          titleColor: theme === 'dark' ? '#fff' : '#333',
                          bodyColor: theme === 'dark' ? '#fff' : '#333',
                          titleFont: {
                            size: 12,
                            family: "'Poppins', sans-serif"
                          },
                          bodyFont: {
                            size: 12,
                            family: "'Poppins', sans-serif"
                          },
                          padding: 8,
                          cornerRadius: 4,
                          displayColors: false,
                          callbacks: {
                            title: function(context) {
                              return context[0].label;
                            },
                            label: function(context) {
                              return context.raw + '/100';
                            }
                          }
                        }
                      },
                      elements: {
                        line: {
                          tension: 0.2
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Skin Type */}
              <div className="skin-type-section">
                <h3>{t.yourSkin}</h3>
                <p className="skin-info-text">{t.skinInfoText}</p>
                
                <div className="skin-type-container">
                  <div className="skin-property">
                    <div className="property-label">{t.type}</div>
                    <div className="skin-type-options">
                      <div className={`skin-type-option ${analysisResult.skinType === 'dry' ? 'selected' : ''}`}>
                        <div className="type-icon dry">
                          <WaterDrop sx={{ color: '#8B4513', fontSize: 24 }} />
                        </div>
                        <div className="type-label">{t.dry}</div>
                      </div>
                      <div className={`skin-type-option ${analysisResult.skinType === 'normal' ? 'selected' : ''}`}>
                        <div className="type-icon normal">
                          <Balance sx={{ color: '#4CAF50', fontSize: 24 }} />
                        </div>
                        <div className="type-label">{t.normal}</div>
                      </div>
                      <div className={`skin-type-option ${analysisResult.skinType === 'combination' ? 'selected' : ''}`}>
                        <div className="type-icon combination">
                          <Grain sx={{ color: '#9C27B0', fontSize: 24 }} />
                        </div>
                        <div className="type-label">{t.combination}</div>
                      </div>
                      <div className={`skin-type-option ${analysisResult.skinType === 'oily' ? 'selected' : ''}`}>
                        <div className="type-icon oily">
                          <Opacity sx={{ color: '#2196F3', fontSize: 24 }} />
                        </div>
                        <div className="type-label">{t.oily}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="skin-type-description">
                  <p>{t.skinTypeIs} <strong>{t[analysisResult.skinType]}</strong></p>
                </div>
                
                <div className="skin-tips">
                  <h4>{t.tips}</h4>
                  <ol className="tips-list">
                    {analysisResult.typeTips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ol>
                </div>
              </div>
              
              {/* Skin Conditions */}
              <div className="skin-conditions-section">
                <h3>{t.skinConditions}</h3>
                
                <div className="conditions-tabs">
                  {['sensitivity', 'darkCircles', 'acne', 'comedones', 'wrinkles'].map(conditionId => {
                    const condition = analysisResult.conditions.find(c => c.id === conditionId);
                    const isSelected = selectedCondition === conditionId;
                    
                    // Get appropriate icon for each condition
                    let ConditionIcon;
                    switch(conditionId) {
                      case 'sensitivity':
                        ConditionIcon = RemoveRedEye;
                        break;
                      case 'darkCircles':
                        ConditionIcon = Brightness3;
                        break;
                      case 'acne':
                        ConditionIcon = FaceRetouchingOff;
                        break;
                      case 'comedones':
                        ConditionIcon = CleaningServices;
                        break;
                      case 'wrinkles':
                        ConditionIcon = Elderly;
                        break;
                      default:
                        ConditionIcon = Face;
                    }
                    
                    return (
                      <div 
                        key={conditionId} 
                        className={`condition-tab ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedCondition(isSelected ? null : conditionId)}
                      >
                        <ConditionIcon fontSize="small" />
                        <span className="condition-name">{t[conditionId]}</span>
                      </div>
                    );
                  })}
                </div>
                
                {selectedCondition && (
                  <div className="condition-detail-container">
                    {(() => {
                      const condition = analysisResult.conditions.find(c => c.id === selectedCondition);
                      
                      if (!condition) {
                        // Create a placeholder for conditions not detected
                        const placeholderCondition = {
                          id: selectedCondition,
                          name: t[selectedCondition],
                          level: 'excellent',
                          description: selectedCondition === 'darkCircles' 
                            ? 'Dark circles under eyes refer to the condition when the skin beneath eyes darkens.'
                            : selectedCondition === 'acne'
                            ? 'Acne refers to the condition when your skin follicles are clogged.'
                            : selectedCondition === 'comedones'
                            ? 'Comedones are pores that are blocked with oil and dead skin cells.'
                            : selectedCondition === 'wrinkles'
                            ? 'Wrinkles are the lines that form in your skin. Getting wrinkles is a natural part of aging.'
                            : 'Sensitivity refers to how your skin reacts to external factors.',
                          tips: [
                            selectedCondition === 'darkCircles' 
                              ? 'Get adequate sleep and stay hydrated.'
                              : selectedCondition === 'acne'
                              ? 'Clean your face thoroughly everyday with gentle cleanser.'
                              : selectedCondition === 'comedones'
                              ? 'Cleanse your face twice daily with lukewarm water.'
                              : selectedCondition === 'wrinkles'
                              ? 'Always use sunscreen to protect your skin against the sun.'
                              : 'Use gentle, fragrance-free skincare products.',
                            'Maintain a healthy diet rich in fruits and vegetables.',
                            'Stay hydrated and get enough sleep.'
                          ]
                        };
                        
                        return (
                          <div className="condition-detail">
                            <h4>{placeholderCondition.name}</h4>
                            <p>
                              {selectedCondition === 'darkCircles' 
                                ? "You don't have any dark circles"
                                : selectedCondition === 'acne'
                                ? "You don't have any acne"
                                : selectedCondition === 'comedones'
                                ? "You don't have any comedones"
                                : selectedCondition === 'wrinkles'
                                ? "You have some fine wrinkles"
                                : "Your skin is strong"}
                            </p>
                            
                            <div className="condition-level-indicator">
                              <div className="level-label">
                                {selectedCondition === 'sensitivity' ? 'Strong' : 'Healthy'}
                              </div>
                              <div className="level-bar">
                                <div className="level-progress level-low" style={{ width: '25%' }}></div>
                              </div>
                            </div>
                            
                            <div className="condition-tips">
                              <h4>{t.tips}</h4>
                              <p>{placeholderCondition.description}</p>
                              <ol>
                                {placeholderCondition.tips.map((tip, index) => (
                                  <li key={index}>{tip}</li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        );
                      }
                      
                      // For detected conditions
                      return (
                        <div className="condition-detail">
                          <h4>{condition.name}</h4>
                          <p>{t.yourSkinIs} <strong>{condition.level === 'high' ? t.high : condition.level === 'moderate' ? t.moderate : t.excellent}</strong></p>
                          
                          <div className="condition-level-indicator">
                            <div className="level-label">
                              {condition.level === 'high' ? 'High' : condition.level === 'moderate' ? 'Moderate' : 'Mild'}
                            </div>
                            <div className="level-bar">
                              <div 
                                className={`level-progress ${condition.level === 'high' ? 'level-high' : condition.level === 'moderate' ? 'level-medium' : 'level-low'}`} 
                                style={{ 
                                  width: condition.level === 'high' ? '75%' : condition.level === 'moderate' ? '50%' : '25%' 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="condition-tips">
                            <h4>{t.tips}</h4>
                            <p>{condition.description}</p>
                            <ol>
                              {condition.tips.map((tip, index) => (
                                <li key={index}>{tip}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="btn btn-outline">{t.post}</button>
                <button className="btn btn-primary">{t.share}</button>
              </div>
              
              <div className="result-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={resetImage}
                >
                  {t.uploadAnother}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className={`modal-content ${theme}`}>
            <h3>{t.deleteConfirm || 'Are you sure you want to delete this analysis?'}</h3>
            <div className="modal-actions">
              <button 
                className="btn btn-danger" 
                onClick={confirmDeleteAnalysis}
              >
                <FaTrash /> {t.yes || 'Yes, Delete'}
              </button>
              <button 
                className="btn btn-outline" 
                onClick={cancelDeleteAnalysis}
              >
                {t.no || 'Cancel'}
              </button>
            </div>
          </div>
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
                      
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        aria-label="Delete analysis"
                      >
                        <FaTrash />
                      </button>
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
