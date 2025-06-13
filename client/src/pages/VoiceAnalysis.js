import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaStop, FaPlay, FaPause, FaInfoCircle, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
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

  const [glucoseLevel, setGlucoseLevel] = useState(null);
  
  // Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState('');
  
  
  // Get user's preferred language
  const userLanguage = userProfile?.language || 'en';
  
  // Language labels
  const labels = {
    en: {
      title: 'Diabetes Voice Analysis',
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
      pastAnalyses: 'Past Analyses',
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
      title: 'Analisis Suara Diabetes',
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
  
  // Component mount effect
  useEffect(() => {
    // No need to fetch past analyses anymore
  }, [currentUser]);
  
  // Initialize audio recording when component mounts
  useEffect(() => {
    // Clean up function to handle component unmount
    return () => {
      // Clean up any MediaRecorder resources
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = null;
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
      
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [recordingTimer, audioURL]);
  
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
    setGlucoseLevel(null);
    setError('');
  };
  
  // Handle done recording - now using handleDoneButtonClick instead
  
  // Handle the "Done" button click - analyze glucose level based on voice recording
  const handleDoneButtonClick = async () => {
    if (recording) {
      await stopRecording();
    }
    
    // No need to check for audioBlob - we want mock output without actual recording
    
    setAnalyzing(true);
    setError('');
    
    try {
      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 150);
      
      // Simulate AI analysis delay - shorter for better user experience
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a random glucose level between 4.0 and 14.0 mmol/L
      const glucoseValueMmol = (Math.random() * 10 + 4).toFixed(1);
      const glucoseValueMgDl = Math.round(glucoseValueMmol * 18); // Convert to mg/dL
      
      // Determine glucose status
      let statusClass;
      
      if (glucoseValueMmol < 5.6) {
        statusClass = 'normal';
      } else if (glucoseValueMmol < 7.0) {
        statusClass = 'medium';
      } else {
        statusClass = 'high';
      }
      
      setGlucoseLevel({
        mmol: glucoseValueMmol,
        mgdl: glucoseValueMgDl,
        status: statusClass
      });
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
    } catch (error) {
      console.error('Error analyzing glucose level:', error);
      setError('Failed to analyze glucose level: ' + error.message);
    } finally {
      setAnalyzing(false);
      // Don't reset progress immediately to ensure results are visible
      setTimeout(() => setAnalysisProgress(0), 2000);
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
            <p>{t.diabetesPassage}</p>
          </div>
          <p className="time-limit-note">{t.recordingTimeLimit}</p>
        </div>
        
        <div className="recording-controls">
          {recording ? (
            <>
              <button 
                className="btn btn-primary btn-stop"
                onClick={stopRecording}
              >
                <FaStop />
                {t.stopRecording}
              </button>
              <button 
                className="btn btn-success btn-done"
                onClick={handleDoneButtonClick}
              >
                <FaCheck />
                {t.doneRecording}
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-primary btn-record"
                onClick={startRecording}
                disabled={analyzing}
              >
                <FaMicrophone />
                {t.startRecording}
              </button>
              <button 
                className="btn btn-success btn-done"
                onClick={handleDoneButtonClick}
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
                <FaExclamationTriangle />
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
          ) : null}
        {/* Diabetes-specific prompt */}
        <div className="diabetes-prompt">
          <h3>{t.diabetesPrompt}</h3>
          <div className={`diabetes-passage ${theme}`}>
            <p>"{t.diabetesPassage}"</p>
          </div>
          <p className="time-limit-note">{t.recordingTimeLimit}</p>
        </div>
        
        <div className="recording-controls">
          {recording ? (
            <>
              <button 
                className="btn btn-primary btn-stop"
                onClick={stopRecording}
              >
                <FaStop />
                {t.stopRecording}
              </button>
              <button 
                className="btn btn-success btn-done"
                onClick={handleDoneButtonClick}
              >
                <FaCheck />
                {t.doneRecording}
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-primary btn-record"
                onClick={startRecording}
                disabled={analyzing}
              >
                <FaMicrophone />
                {t.startRecording}
              </button>
              <button 
                className="btn btn-success btn-done"
                onClick={handleDoneButtonClick}
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
                <FaExclamationTriangle />
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
              {audioURL && (
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
              )}
            </div>
          )}
        </div>
        
        {/* Removed Analyze Voice button */}
        
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
                 glucoseLevel.status === 'medium' ? 'Pre-diabetic' : 'Diabetic'}
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
    </div>
  );
}

export default VoiceAnalysis;
      </div>
    </div>
  );
}

export default VoiceAnalysis;
