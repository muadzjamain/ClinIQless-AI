import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { FaUserMd, FaMicrophone, FaStop, FaPlay, FaPause, FaTrash, FaCheck, FaTimes, FaInfoCircle, FaUpload } from 'react-icons/fa';
import './DoctorAdvice.css';

function DoctorAdvice() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  
  // Audio recording states
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElementRef = useRef(null);
  
  // Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [validationResult, setValidationResult] = useState(null);
  const [adviceHistory, setAdviceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const db = getFirestore();
  
  // Get user's preferred language
  const userLanguage = userProfile?.language || 'en';
  
  // Multilingual labels
  const labels = {
    en: {
      title: 'Doctor Advice',
      description: 'Record medical advice to validate its accuracy and reliability',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      uploadRecording: 'Upload Recording',
      selectAudioFile: 'Select audio file',
      fileSelected: 'File selected',
      invalidFile: 'Invalid file. Please select an audio file.',
      playRecording: 'Play Recording',
      pauseRecording: 'Pause',
      deleteRecording: 'Delete Recording',
      validateAdvice: 'Summarize Advice',
      analyzing: 'Analyzing medical advice...',
      reliability: 'Reliability Score',
      accurate: 'Accurate',
      partiallyAccurate: 'Partially Accurate',
      inaccurate: 'Inaccurate',
      recommendations: 'Recommendations',
      pastValidations: 'Past Validations',
      noValidations: 'No advice validations yet',
      deleteConfirm: 'Delete this validation?',
      validated: 'Validated',
      warning: 'Warning',
      safe: 'Safe'
    },
    ms: {
      title: 'Pengesah Nasihat Doktor',
      description: 'Rakam nasihat perubatan untuk mengesahkan ketepatan dan kebolehpercayaannya',
      startRecording: 'Mula Rakaman',
      stopRecording: 'Hentikan Rakaman',
      uploadRecording: 'Muat Naik Rakaman',
      selectAudioFile: 'Pilih fail audio',
      fileSelected: 'Fail dipilih',
      invalidFile: 'Fail tidak sah. Sila pilih fail audio.',
      playRecording: 'Main Rakaman',
      pauseRecording: 'Jeda',
      deleteRecording: 'Padam Rakaman',
      validateAdvice: 'Sahkan Nasihat',
      analyzing: 'Menganalisis nasihat perubatan...',
      reliability: 'Skor Kebolehpercayaan',
      accurate: 'Tepat',
      partiallyAccurate: 'Sebahagiannya Tepat',
      inaccurate: 'Tidak Tepat',
      recommendations: 'Cadangan',
      pastValidations: 'Pengesahan Lepas',
      noValidations: 'Tiada pengesahan nasihat lagi',
      deleteConfirm: 'Padam pengesahan ini?',
      validated: 'Disahkan',
      warning: 'Amaran',
      safe: 'Selamat'
    }
  };

  const t = labels[userLanguage];

  // Timer effect for recording
  useEffect(() => {
    if (recording && recordingTimer) {
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [recording, recordingTimer]);

  // Load past validations
  useEffect(() => {
    const loadValidations = async () => {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, 'adviceValidations'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const validations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));
        
        setAdviceHistory(validations);
      } catch (error) {
        console.error('Error loading validations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadValidations();
  }, [currentUser, db]);

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      setError('');
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioURL('');
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(100);
      setRecording(true);
      setRecordingTimer(Date.now());
    } catch (error) {
      setError('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setRecordingTimer(null);
    }
  };

  // Toggle playback
  const togglePlayback = () => {
    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
      } else {
        audioElementRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    setAudioBlob(null);
    setAudioURL('');
    setIsPlaying(false);
    setValidationResult(null);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if file is an audio file
    if (!file.type.startsWith('audio/')) {
      setError(t.invalidFile);
      return;
    }
    
    setError('');
    setAudioBlob(null);
    setAudioURL('');
    setValidationResult(null);
    
    // Create blob and URL
    const blob = new Blob([file], { type: file.type });
    setAudioBlob(blob);
    
    const url = URL.createObjectURL(blob);
    setAudioURL(url);
  };

  // Mock validation function
  const validateAdvice = async () => {
    if (!audioBlob) {
      setError('No recording available to validate');
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress(10);
    setError('');

    // Simulate analysis progress
    const progressSteps = [20, 40, 60, 80, 95];
    for (let step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnalysisProgress(step);
    }

    // Mock validation results
    const mockAdviceScenarios = [
      {
        advice: 'Take antibiotics for viral infections',
        accuracy: 'inaccurate',
        scoreRange: [10, 30],
        explanation: 'Antibiotics are ineffective against viral infections and should only be used for bacterial infections.',
        recommendations: [
          'Consult with a healthcare provider for proper diagnosis',
          'Use antiviral medications if prescribed',
          'Focus on symptomatic relief for viral infections'
        ],
        riskLevel: 'warning',
        corrections: [
          'Antibiotics do not work against viruses; they are only effective for bacterial infections.',
          'Taking antibiotics unnecessarily can lead to resistance and side effects.',
          'Proper diagnosis is needed before starting any medication.'
        ]
      },
      {
        advice: 'Drink plenty of water when you have a fever',
        accuracy: 'accurate',
        scoreRange: [90, 100],
        explanation: 'Staying hydrated is important when having a fever as it helps regulate body temperature and prevents dehydration.',
        recommendations: [
          'Continue hydration with water and electrolyte solutions',
          'Monitor temperature regularly',
          'Seek medical attention if fever persists or worsens'
        ],
        riskLevel: 'safe',
        corrections: []
      },
      {
        advice: 'Exercise vigorously when you have chest pain',
        accuracy: 'inaccurate',
        scoreRange: [5, 25],
        explanation: 'Vigorous exercise during chest pain can be dangerous and may indicate underlying cardiac issues.',
        recommendations: [
          'Stop all physical activity immediately',
          'Seek emergency medical attention for chest pain',
          'Never ignore chest pain symptoms'
        ],
        riskLevel: 'warning',
        corrections: [
          'Exercising with chest pain can worsen underlying heart problems.',
          'Chest pain should be evaluated by a healthcare professional immediately.',
          'Ignoring chest pain can be life-threatening.'
        ]
      },
      {
        advice: 'Check blood sugar levels regularly if you have diabetes',
        accuracy: 'accurate',
        scoreRange: [95, 100],
        explanation: 'Regular blood sugar monitoring is essential for diabetes management and helps prevent complications.',
        recommendations: [
          'Follow your healthcare provider\'s monitoring schedule',
          'Keep a log of your readings',
          'Adjust diet and medication as advised by your doctor'
        ],
        riskLevel: 'safe',
        corrections: []
      }
    ];

    // Randomly select a scenario for mockup
    const randomScenario = mockAdviceScenarios[Math.floor(Math.random() * mockAdviceScenarios.length)];
    // Generate a random score within the scenario's range
    const [minScore, maxScore] = randomScenario.scoreRange;
    const randomScore = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;

    const validationData = {
      ...randomScenario,
      score: randomScore,
      timestamp: new Date(),
      audioUrl: audioURL,
      duration: recordingTime
    };

    setValidationResult(validationData);
    setAnalysisProgress(100);

    // Save to Firestore (mockup)
    try {
      await addDoc(collection(db, 'adviceValidations'), {
        userId: currentUser.uid,
        ...validationData,
        timestamp: new Date()
      });

      // Update local state
      setAdviceHistory(prev => [validationData, ...prev]);
    } catch (error) {
      console.error('Error saving validation:', error);
    }

    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisProgress(0);
    }, 1000);
  };

  // Delete validation
  const deleteValidation = async (validationId) => {
    try {
      await deleteDoc(doc(db, 'adviceValidations', validationId));
      setAdviceHistory(prev => prev.filter(v => v.id !== validationId));
    } catch (error) {
      console.error('Error deleting validation:', error);
    }
  };

  return (
    <div className={`doctor-advice-page ${theme}`}>
      <div className="page-header">
        <div className="header-content">
          <FaUserMd className="page-icon" />
          <div>
            <h1>{t.title}</h1>
            <p>{t.description}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <FaTimes className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Recording Section */}
      <div className="recording-section">
        <div className="recording-controls">
          {!recording ? (
            <div className="recording-buttons">
              <button 
                className="btn btn-primary btn-record"
                onClick={startRecording}
                disabled={analyzing || audioURL}
              >
                <FaMicrophone style={{ fontSize: '1.5rem' }} />
                {t.startRecording}
              </button>
              
              <button 
                className="btn btn-primary btn-record"
                onClick={() => document.getElementById('audio-upload').click()}
                disabled={recording || analyzing || audioURL}
              >
                <FaUpload style={{ fontSize: '1.5rem' }} />
                {t.uploadRecording}
              </button>
              <input 
                type="file" 
                id="audio-upload" 
                accept="audio/*" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }}
                disabled={recording || analyzing || audioURL}
              />
            </div>
          ) : (
            <button 
              className="btn btn-danger btn-record"
              onClick={stopRecording}
            >
              <FaStop />
              {t.stopRecording}
            </button>
          )}

          {recording && (
            <div className="recording-timer">
              <span className="recording-indicator"></span>
              {formatTime(recordingTime)}
            </div>
          )}
        </div>

        {audioURL && (
          <div className="audio-controls">
            <button 
              className="btn btn-outline"
              onClick={togglePlayback}
              disabled={recording || analyzing}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
              {isPlaying ? t.pauseRecording : t.playRecording}
            </button>

            <button
              className="btn btn-outline btn-delete"
              onClick={deleteRecording}
              disabled={recording || analyzing}
            >
              <FaTrash />
              {t.deleteRecording}
            </button>

            <button
              className="btn btn-success"
              onClick={validateAdvice}
              disabled={recording || analyzing}
            >
              <FaCheck />
              {t.validateAdvice}
            </button>

            <audio
              ref={audioElementRef}
              src={audioURL}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Analysis Progress */}
      {analyzing && (
        <div className="analysis-progress">
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
          <div className="progress-status">
            {t.analyzing}
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="validation-results">
          {/* 1. Summary */}
          <div className="doctor-advice-summary">
            <h3>Summary</h3>
            <p>Dr. Sarah Chen recommends drinking plenty of water throughout the day, getting consistent rest to support your immune system and avoiding strenuous activity while you recover. She also suggests monitoring your symptoms closely, especially if they worsen or do not improve after a few days. In those cases, it's important to consult with a healthcare provider who can determine whether additional treatment is needed, such as antiviral medication or supportive care. Managing stress, eating balanced meals and avoiding alcohol or smoking can also help your body heal more effectively.</p>
          </div>

          {/* 2. Recommendations */}
          <div className="recommendations">
            <h4>{t.recommendations}</h4>
            <ul>
              {validationResult.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* 3. Advice Validation Result */}
          <div className="advice-validation-result">
            <div className="result-header">
              <h3>Advice Validation Result</h3>
              <div className={`risk-badge ${validationResult.riskLevel}`}>
                {validationResult.riskLevel === 'safe' ? <FaCheck /> : <FaInfoCircle />}
                {validationResult.riskLevel === 'safe' ? t.safe : t.warning}
              </div>
            </div>
            <div className="accuracy-score">
              <div className="score-circle">
                <span className="score-value">{validationResult.score}%</span>
                <span className="score-label">{t.reliability}</span>
              </div>
              <div className="accuracy-status">
                <h4>{validationResult.accuracy === 'accurate' ? t.accurate : 
                     validationResult.accuracy === 'partiallyAccurate' ? t.partiallyAccurate : t.inaccurate}</h4>
                <p>{validationResult.explanation}</p>
              </div>
            </div>
          </div>

          {/* 4. Correction (mocked, scenario-based, only if score <= 95%) */}
          {(validationResult.score <= 95) && validationResult.corrections && validationResult.corrections.length > 0 && (
            <div className="correction-section">
              <h4>Correction</h4>
              <ul>
                {validationResult.corrections.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Past Validations */}
      <div className="past-validations">
        <h2>{t.pastValidations}</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : adviceHistory.length > 0 ? (
          <div className="validations-list">
            {adviceHistory.map((validation, index) => (
              <div key={index} className="validation-item">
                <div className="validation-header">
                  <div className="validation-info">
                    <span className="validation-date">
                      {validation.timestamp?.toLocaleDateString()}
                    </span>
                    <div className={`validation-score ${validation.accuracy}`}>
                      {validation.score}% {t.reliability}
                    </div>
                  </div>
                  <button
                    className="btn-delete-small"
                    onClick={() => deleteValidation(validation.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
                <p className="validation-explanation">{validation.explanation}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FaUserMd className="empty-icon" />
            <p>{t.noValidations}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorAdvice;
