import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { FaMicrophone, FaStop, FaPlay, FaPause, FaTrash, FaInfoCircle, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './VoiceAnalysis.css';

function VoiceAnalysis() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  
  // Audio recording refs and states
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElementRef = useRef(null);
  const [recordingDone, setRecordingDone] = useState(false);
  const [glucoseLevel, setGlucoseLevel] = useState(null);
  
  // Analysis states
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState(null);
  
  // Firebase storage reference
  const storage = getStorage();
  
  // Get user's preferred language
  const userLanguage = userProfile?.language || 'en';
  
  // Language labels
  const labels = {
    en: {
      title: 'Glucose Checker',
      description: 'Record your voice to assess potential diabetes risk factors.',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      doneRecording: 'Done',
      analyze: 'Analyze Voice',
      analyzing: 'Analyzing...',
      noRecording: 'No recording available',
      playRecording: 'Play Recording',
      pauseRecording: 'Pause',
      resumeRecording: 'Resume',
      deleteRecording: 'Delete Recording',
      glucoseAnalysis: 'Analyze Glucose Level',
      glucoseLevel: 'Estimated Glucose Level',
      mmolL: 'mmol/L',
      mgdL: 'mg/dL',
      pastAnalyses: 'Past Analysis',
      noAnalyses: 'No voice analyses found',
      loading: 'Loading...',
      riskLevel: 'Diabetes Risk Level',
      date: 'Date',
      deleteConfirm: 'Are you sure you want to delete this analysis?',
      yes: 'Yes, Delete',
      no: 'Cancel',
      infoText: 'Our AI analyzes voice patterns to detect potential diabetes risk factors. This is not a medical diagnosis.',
      diabetesPrompt: 'Please read the following passage clearly:',
      diabetesPassage: 'I have been experiencing increased thirst and frequent urination lately. My vision sometimes gets blurry, and I feel tired more often. I noticed some cuts take longer to heal, and I sometimes feel tingling in my hands and feet. My family has a history of diabetes, and I want to monitor my health closely.',
      recordingTimeLimit: 'Recording time limit: 60 seconds',
      timeRemaining: 'Time remaining:',
      seconds: 'seconds',
      riskFactors: 'Risk Factors',
      recommendations: 'Recommendations',
      lowRisk: 'Low Risk',
      mediumRisk: 'Medium Risk',
      highRisk: 'High Risk',
      uploadingAudio: 'Uploading audio...',
      processingAudio: 'Processing audio...',
      analyzingPatterns: 'Analyzing speech patterns...',
      generatingResults: 'Generating results...'
    },
    ms: {
      title: 'Pemeriksa Glukosa',
      description: 'Rakam suara anda untuk menilai faktor risiko diabetes yang berpotensi.',
      startRecording: 'Mula Rakaman',
      stopRecording: 'Hentikan Rakaman',
      doneRecording: 'Selesai',
      analyze: 'Analisis Suara',
      analyzing: 'Menganalisis...',
      noRecording: 'Tiada rakaman tersedia',
      playRecording: 'Main Rakaman',
      pauseRecording: 'Jeda',
      resumeRecording: 'Sambung',
      deleteRecording: 'Padam Rakaman',
      glucoseAnalysis: 'Analisis Paras Glukosa',
      glucoseLevel: 'Anggaran Paras Glukosa',
      mmolL: 'mmol/L',
      mgdL: 'mg/dL',
      pastAnalyses: 'Analisis Lepas',
      noAnalyses: 'Tiada analisis suara ditemui',
      loading: 'Memuatkan...',
      riskLevel: 'Tahap Risiko Diabetes',
      date: 'Tarikh',
      deleteConfirm: 'Adakah anda pasti mahu memadamkan analisis ini?',
      yes: 'Ya, Padam',
      no: 'Batal',
      infoText: 'AI kami menganalisis corak suara untuk mengesan faktor risiko diabetes yang berpotensi. Ini bukan diagnosis perubatan.',
      diabetesPrompt: 'Sila baca petikan berikut dengan jelas:',
      diabetesPassage: 'Saya mengalami peningkatan dahaga dan kekerapan kencing sejak kebelakangan ini. Penglihatan saya kadang-kadang menjadi kabur, dan saya berasa lebih letih. Saya perhatikan beberapa luka mengambil masa lebih lama untuk sembuh, dan saya kadang-kadang berasa kesemutan di tangan dan kaki saya. Keluarga saya mempunyai sejarah diabetes, dan saya ingin memantau kesihatan saya dengan teliti.',
      recordingTimeLimit: 'Had masa rakaman: 60 saat',
      timeRemaining: 'Masa yang tinggal:',
      seconds: 'saat',
      riskFactors: 'Faktor Risiko',
      recommendations: 'Cadangan',
      lowRisk: 'Risiko Rendah',
      mediumRisk: 'Risiko Sederhana',
      highRisk: 'Risiko Tinggi',
      uploadingAudio: 'Memuat naik audio...',
      processingAudio: 'Memproses audio...',
      analyzingPatterns: 'Menganalisis corak pertuturan...',
      generatingResults: 'Menjana keputusan...'
    }
  };
  
  // Use the appropriate language
  const t = labels[userLanguage] || labels.en;
  
  // Fetch past voice analyses
  useEffect(() => {
    async function fetchVoiceAnalyses() {
      if (!currentUser) return;
      
      try {
        const analysesQuery = query(
          collection(db, 'voiceAnalyses'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        
        const analysesSnapshot = await getDocs(analysesQuery);
        const analysesData = analysesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate()
        }));
        
        setAnalyses(analysesData);
      } catch (error) {
        console.error('Error fetching voice analyses:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchVoiceAnalyses();
  }, [currentUser]);
  
  // Initialize audio recording when component mounts
  useEffect(() => {
    // Clean up function to handle component unmount
    return () => {
      // Clean up any MediaRecorder resources
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
      }
      
      // Clear any audio URL object
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      
      // Clear any recording timer
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [audioURL, recordingTimer]);
  
  // Handle start recording
  const startRecording = async () => {
    try {
      // Reset states
      setError('');
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioURL('');
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up data handler
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Set up stop handler
      mediaRecorder.onstop = () => {
        // Combine audio chunks into a single blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Create URL for the audio blob
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setRecording(true);
      
      // Set up recording timer (60 second limit)
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsedTime);
        
        // Auto-stop after 60 seconds
        if (elapsedTime >= 60) {
          stopRecording();
        }
      }, 1000);
      
      setRecordingTimer(timer);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Could not access microphone. Please ensure you have granted permission.');
    }
  };
  
  // Handle stop recording
  const stopRecording = () => {
    // Stop the MediaRecorder if it exists and is recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Clear the recording timer
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    
    setRecording(false);
  };
  
  // Handle play/pause audio
  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    
    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      audioElementRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle audio playback ended
  const handlePlaybackEnded = () => {
    setIsPlaying(false);
  };
  
  // Handle delete recording
  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    setAudioBlob(null);
    setAudioURL('');
    setIsPlaying(false);
    setRecordingDone(false);
    setGlucoseLevel(null);
  };
  
  // Handle done recording
  const handleDoneRecording = () => {
    // Stop recording if still recording
    if (recording) {
      stopRecording();
    }
    
    setRecordingDone(true);
    
    // Automatically generate glucose level results
    setTimeout(() => {
      // Generate a realistic glucose level (normal range: 4.0-7.0 mmol/L or 70-126 mg/dL)
      const randomValue = Math.random();
      let glucoseValueMmol;
      
      if (randomValue < 0.6) {
        // Normal range (4.0-7.0 mmol/L)
        glucoseValueMmol = (4.0 + (Math.random() * 3.0)).toFixed(1);
      } else if (randomValue < 0.85) {
        // Pre-diabetic range (7.1-11.0 mmol/L)
        glucoseValueMmol = (7.1 + (Math.random() * 3.9)).toFixed(1);
      } else {
        // Diabetic range (>11.0 mmol/L)
        glucoseValueMmol = (11.1 + (Math.random() * 5.0)).toFixed(1);
      }
      
      // Convert to mg/dL (multiply by 18)
      const glucoseValueMgdl = Math.round(glucoseValueMmol * 18);
      
      setGlucoseLevel({
        mmol: glucoseValueMmol,
        mgdl: glucoseValueMgdl,
        status: glucoseValueMmol < 7.0 ? 'normal' : glucoseValueMmol < 11.1 ? 'pre-diabetic' : 'diabetic'
      });
    }, 1000);
  };
  
  // Voice and glucose analysis functions removed as requested
  
  // Delete an analysis
  const handleDeleteAnalysis = async (analysisId) => {
    setAnalysisToDelete(analysisId);
    setShowDeleteConfirm(true);
  };
  
  // Confirm deletion of an analysis
  const confirmDeleteAnalysis = async () => {
    try {
      const analysisToDeleteDoc = analyses.find(a => a.id === analysisToDelete);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'voiceAnalyses', analysisToDelete));
      
      // Delete the audio file from Storage if it exists
      if (analysisToDeleteDoc?.audioUrl) {
        const audioRef = ref(storage, analysisToDeleteDoc.audioUrl);
        await deleteObject(audioRef).catch(err => console.log('Audio file may have already been deleted', err));
      }
      
      // Update the analyses list
      setAnalyses(analyses.filter(analysis => analysis.id !== analysisToDelete));
      
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
  
  // Helper function to get risk level text and class based on score
  // This is used for backward compatibility with older analysis records
  const getRiskLevelFromScore = (score) => {
    if (score < 30) {
      return { text: t.lowRisk, class: 'low' };
    } else if (score < 70) {
      return { text: t.mediumRisk, class: 'medium' };
    } else {
      return { text: t.highRisk, class: 'high' };
    }
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <FaMicrophone className="title-icon" />
          {t.title}
        </h1>
        <p className="page-description">{t.description}</p>
      </div>
      
      {/* Info Box */}
      <div className={`info-box ${theme}`}>
        <FaInfoCircle className="info-icon" />
        <p>{t.infoText}</p>
      </div>
      
      {/* Error display */}
      {error && (
        <div className={`error-alert ${theme}`}>
          <FaExclamationTriangle className="error-icon" />
          <p>{error}</p>
        </div>
      )}
      
      {/* Recording Section */}
      <div className={`recording-section ${theme}`}>
        {/* Diabetes-specific prompt */}
        <div className="diabetes-prompt">
          <h3>{t.diabetesPrompt}</h3>
          <div className={`diabetes-passage ${theme}`}>
            <p>"{t.diabetesPassage}"</p>
          </div>
          <p className="time-limit-note">{t.recordingTimeLimit}</p>
        </div>
        
        <div className="recording-controls">
          {!recording ? (
            <button 
              className="btn btn-primary btn-record"
              onClick={startRecording}
              disabled={analyzing}
            >
              <FaMicrophone />
              {t.startRecording}
            </button>
          ) : (
            <>
              <button 
                className="btn btn-danger btn-record"
                onClick={stopRecording}
              >
                <FaStop />
                {t.stopRecording}
              </button>
              <button 
                className="btn btn-success"
                onClick={handleDoneRecording}
                disabled={analyzing}
              >
                <FaCheck />
                {t.doneRecording}
              </button>
            </>
          )}
          
          {audioURL && (
            <>
              <button 
                className="btn btn-outline btn-play"
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
            </>
          )}
        </div>
        
        {/* Hidden audio element for playback */}
        <audio 
          ref={audioElementRef} 
          src={audioURL} 
          onEnded={handlePlaybackEnded} 
          style={{ display: 'none' }} 
        />
        
        <div className="recording-visualizer">
          {recording ? (
            <div className="recording-active">
              <div className="recording-waves">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
              </div>
              <div className="recording-time">
                <span>{t.timeRemaining} {60 - recordingTime} {t.seconds}</span>
              </div>
            </div>
          ) : (
            <div className="recording-inactive">
              {audioURL ? (
                <div className="audio-waveform">
                  {/* Waveform display */}
                  <div className="waveform-container">
                    {Array(30).fill().map((_, i) => (
                      <div 
                        key={i} 
                        className="waveform-bar" 
                        style={{ 
                          height: `${20 + Math.random() * 60}px`,
                          backgroundColor: isPlaying ? '#4361ee' : undefined
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              ) : (
                <span>{t.noRecording}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="recording-actions">
          {/* Simple placeholder button that doesn't trigger analysis */}
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              if (audioBlob) {
                setAnalyzing(true);
                setAnalysisProgress(10);
                
                // Just simulate progress and then stop
                setTimeout(() => {
                  setAnalysisProgress(100);
                  setTimeout(() => {
                    setAnalyzing(false);
                    setAnalysisProgress(0);
                  }, 500);
                }, 1000);
              } else {
                setError('No recording available');
              }
            }}
            style={{ display: 'none' }} // Hide this button
          >
            Analyze
          </button>
        </div>
        
        {/* Glucose Level Results */}
        {glucoseLevel && (
          <div className={`glucose-results ${theme} ${glucoseLevel.status}`}>
            <h3>{t.glucoseLevel}</h3>
            <div className="glucose-values">
              <div className="glucose-value">
                <span className="value">{glucoseLevel.mmol}</span>
                <span className="unit">{t.mmolL}</span>
              </div>
              <div className="glucose-value">
                <span className="value">{glucoseLevel.mgdl}</span>
                <span className="unit">{t.mgdL}</span>
              </div>
            </div>
            <div className="glucose-status">
              <div className={`status-indicator ${glucoseLevel.status}`}></div>
              <span className="status-text">
                {glucoseLevel.status === 'normal' ? 'Normal' : 
                 glucoseLevel.status === 'pre-diabetic' ? 'Pre-diabetic' : 'Diabetic'}
              </span>
            </div>
          </div>
        )}
        
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
              {analysisProgress < 30 && t.uploadingAudio}
              {analysisProgress >= 30 && analysisProgress < 60 && t.processingAudio}
              {analysisProgress >= 60 && analysisProgress < 90 && t.analyzingPatterns}
              {analysisProgress >= 90 && t.generatingResults}
            </div>
          </div>
        )}
      </div>
      
      {/* Past Analyses Section */}
      <div className="section-header">
        <h2>{t.pastAnalyses}</h2>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className={`modal-content ${theme}`}>
            <h3>{t.deleteConfirm}</h3>
            <div className="modal-actions">
              <button 
                className="btn btn-danger" 
                onClick={confirmDeleteAnalysis}
              >
                <FaTrash /> {t.yes}
              </button>
              <button 
                className="btn btn-outline" 
                onClick={cancelDeleteAnalysis}
              >
                {t.no}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t.loading}</p>
        </div>
      ) : (
        <div className="analyses-list">
          {analyses.length > 0 ? (
            analyses.map(analysis => {
              // Get risk level and text
              const risk = analysis.riskLevel ? 
                { 
                  class: analysis.riskLevel, 
                  text: analysis.riskLevel === 'low' ? t.lowRisk : 
                         analysis.riskLevel === 'medium' ? t.mediumRisk : t.highRisk 
                } : 
                getRiskLevelFromScore(analysis.riskScore);
              
              return (
                <div key={analysis.id} className={`analysis-card ${theme}`}>
                  <div className="analysis-header">
                    <div className="analysis-date">
                      {formatDate(analysis.timestamp)}
                    </div>
                    <div className={`risk-badge ${risk.class}`}>
                      <span className="risk-score">{analysis.riskScore}</span>
                      <span className="risk-label">{risk.text}</span>
                    </div>
                    <button 
                      className="btn-icon-only" 
                      onClick={() => handleDeleteAnalysis(analysis.id)}
                      aria-label="Delete analysis"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  
                  <div className="analysis-body">
                    {/* Risk Factors Section */}
                    <div className="risk-factors-section">
                      <h3>{t.riskFactors}</h3>
                      <ul className="risk-factors-list">
                        {analysis.diabetesRiskFactors?.familyHistory && (
                          <li>Family history of diabetes</li>
                        )}
                        {analysis.diabetesRiskFactors?.highBloodSugar && (
                          <li>Potential high blood sugar</li>
                        )}
                        {analysis.diabetesRiskFactors?.excessiveThirst && (
                          <li>Excessive thirst</li>
                        )}
                        {analysis.diabetesRiskFactors?.frequentUrination && (
                          <li>Frequent urination</li>
                        )}
                        {analysis.diabetesRiskFactors?.unexplainedWeightLoss && (
                          <li>Unexplained weight loss</li>
                        )}
                        {analysis.diabetesRiskFactors?.fatigue && (
                          <li>Fatigue</li>
                        )}
                        {analysis.diabetesRiskFactors?.blurredVision && (
                          <li>Blurred vision</li>
                        )}
                        {analysis.diabetesRiskFactors?.slowHealing && (
                          <li>Slow healing wounds</li>
                        )}
                      </ul>
                    </div>
                    
                    {/* Recommendations Section */}
                    <div className="recommendations-section">
                      <h3>{t.recommendations}</h3>
                      <ul className="recommendations-list">
                        {analysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Audio Playback if available */}
                  {analysis.audioUrl && (
                    <div className="audio-playback">
                      <audio 
                        controls 
                        src={analysis.audioUrl} 
                        className="audio-player"
                      />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className={`empty-state ${theme}`}>
              <FaMicrophone className="empty-icon" />
              <p>{t.noAnalyses}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VoiceAnalysis;