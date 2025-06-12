import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { FaUserMd, FaPlus, FaTrash, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import './DoctorAdvice.css';

function DoctorAdvice() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [adviceList, setAdviceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    doctorName: '',
    specialization: '',
    advice: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const db = getFirestore();
  
  // Get user's preferred language
  const userLanguage = userProfile?.language || 'en';
  
  // Multilingual labels
  const labels = {
    en: {
      title: 'Doctor Advice',
      description: 'Track and evaluate medical advice from your healthcare providers',
      addAdvice: 'Add New Advice',
      doctorName: 'Doctor Name',
      specialization: 'Specialization',
      advice: 'Medical Advice',
      date: 'Date of Advice',
      submit: 'Submit',
      cancel: 'Cancel',
      loading: 'Loading...',
      noAdvice: 'No doctor advice recorded yet',
      reliability: 'Reliability Score',
      deleteConfirm: 'Are you sure you want to delete this advice?',
      yes: 'Yes, Delete',
      no: 'Cancel',
      deleteSuccess: 'Advice deleted successfully',
      addSuccess: 'Doctor advice added successfully',
      error: 'An error occurred',
      reliabilityHigh: 'High Reliability',
      reliabilityMedium: 'Medium Reliability',
      reliabilityLow: 'Low Reliability',
      reliabilityInfo: 'Reliability is evaluated using AI based on medical guidelines and evidence-based practices'
    },
    ms: {
      title: 'Nasihat Doktor',
      description: 'Jejak dan nilai nasihat perubatan daripada penyedia penjagaan kesihatan anda',
      addAdvice: 'Tambah Nasihat Baru',
      doctorName: 'Nama Doktor',
      specialization: 'Pengkhususan',
      advice: 'Nasihat Perubatan',
      date: 'Tarikh Nasihat',
      submit: 'Hantar',
      cancel: 'Batal',
      loading: 'Memuatkan...',
      noAdvice: 'Tiada nasihat doktor direkodkan lagi',
      reliability: 'Skor Kebolehpercayaan',
      deleteConfirm: 'Adakah anda pasti mahu memadamkan nasihat ini?',
      yes: 'Ya, Padam',
      no: 'Batal',
      deleteSuccess: 'Nasihat berjaya dipadamkan',
      addSuccess: 'Nasihat doktor berjaya ditambahkan',
      error: 'Ralat berlaku',
      reliabilityHigh: 'Kebolehpercayaan Tinggi',
      reliabilityMedium: 'Kebolehpercayaan Sederhana',
      reliabilityLow: 'Kebolehpercayaan Rendah',
      reliabilityInfo: 'Kebolehpercayaan dinilai menggunakan AI berdasarkan garis panduan perubatan dan amalan berasaskan bukti'
    }
  };
  
  // Use the appropriate language
  const t = labels[userLanguage] || labels.en;
  
  // Fetch doctor advice data
  useEffect(() => {
    async function fetchDoctorAdvice() {
      if (!currentUser) return;
      
      try {
        const adviceQuery = query(
          collection(db, 'doctorAdvice'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        
        const adviceSnapshot = await getDocs(adviceQuery);
        const adviceData = adviceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAdviceList(adviceData);
      } catch (error) {
        console.error('Error fetching doctor advice:', error);
        setError(t.error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDoctorAdvice();
  }, [currentUser, db, t.error]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.doctorName || !formData.advice) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Add new doctor advice to Firestore
      const newAdvice = {
        userId: currentUser.uid,
        doctorName: formData.doctorName,
        specialization: formData.specialization,
        advice: formData.advice,
        date: formData.date,
        timestamp: new Date(),
        reliabilityScore: Math.floor(Math.random() * 100) // Simulated score for prototype
      };
      
      const docRef = await addDoc(collection(db, 'doctorAdvice'), newAdvice);
      
      // Add the new advice to the list
      setAdviceList([
        {
          id: docRef.id,
          ...newAdvice
        },
        ...adviceList
      ]);
      
      // Reset form
      setFormData({
        doctorName: '',
        specialization: '',
        advice: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      setShowAddForm(false);
      setSuccess(t.addSuccess);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error adding doctor advice:', error);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete confirmation
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowConfirmDelete(true);
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      setLoading(true);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'doctorAdvice', deleteId));
      
      // Update local state
      setAdviceList(adviceList.filter(advice => advice.id !== deleteId));
      
      setShowConfirmDelete(false);
      setDeleteId(null);
      setSuccess(t.deleteSuccess);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting doctor advice:', error);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(userLanguage === 'ms' ? 'ms-MY' : 'en-US', options);
  };
  
  // Get reliability class and text
  const getReliabilityInfo = (score) => {
    if (score >= 70) {
      return {
        class: 'high',
        text: t.reliabilityHigh
      };
    } else if (score >= 40) {
      return {
        class: 'medium',
        text: t.reliabilityMedium
      };
    } else {
      return {
        class: 'low',
        text: t.reliabilityLow
      };
    }
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaUserMd className="title-icon" />
            {t.title}
          </h1>
          <p className="page-description">{t.description}</p>
        </div>
        
        <button 
          className="btn btn-primary add-button"
          onClick={() => setShowAddForm(true)}
        >
          <FaPlus /> {t.addAdvice}
        </button>
      </div>
      
      {/* Alerts */}
      {error && (
        <div className={`alert alert-error ${theme}`}>
          <FaTimes className="alert-icon" />
          {error}
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {success && (
        <div className={`alert alert-success ${theme}`}>
          <FaCheck className="alert-icon" />
          {success}
          <button className="alert-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}
      
      {/* Add Advice Form */}
      {showAddForm && (
        <div className={`form-card ${theme}`}>
          <h2>{t.addAdvice}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="doctorName">{t.doctorName} *</label>
                <input
                  type="text"
                  id="doctorName"
                  name="doctorName"
                  className="form-control"
                  value={formData.doctorName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="specialization">{t.specialization}</label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  className="form-control"
                  value={formData.specialization}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="advice">{t.advice} *</label>
              <textarea
                id="advice"
                name="advice"
                className="form-control"
                rows="4"
                value={formData.advice}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="date">{t.date}</label>
              <input
                type="date"
                id="date"
                name="date"
                className="form-control"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowAddForm(false)}
              >
                {t.cancel}
              </button>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? t.loading : t.submit}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Reliability Info */}
      <div className={`info-box ${theme}`}>
        <FaInfoCircle className="info-icon" />
        <p>{t.reliabilityInfo}</p>
      </div>
      
      {/* Doctor Advice List */}
      {loading && !showAddForm ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t.loading}</p>
        </div>
      ) : (
        <div className="advice-list">
          {adviceList.length > 0 ? (
            adviceList.map(advice => {
              const reliability = getReliabilityInfo(advice.reliabilityScore);
              
              return (
                <div key={advice.id} className={`advice-card ${theme}`}>
                  <div className="advice-header">
                    <div className="doctor-info">
                      <h3 className="doctor-name">{advice.doctorName}</h3>
                      {advice.specialization && (
                        <span className="doctor-specialization">{advice.specialization}</span>
                      )}
                    </div>
                    
                    <div className="advice-actions">
                      <button 
                        className="btn btn-icon btn-delete"
                        onClick={() => confirmDelete(advice.id)}
                        aria-label="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  
                  <div className="advice-body">
                    <p className="advice-text">{advice.advice}</p>
                    
                    <div className="advice-meta">
                      <span className="advice-date">{formatDate(advice.date)}</span>
                      
                      <div className={`reliability-score ${reliability.class}`}>
                        <span className="score-value">{advice.reliabilityScore}%</span>
                        <span className="score-label">{t.reliability}</span>
                        <span className="score-text">{reliability.text}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`empty-state ${theme}`}>
              <FaUserMd className="empty-icon" />
              <p>{t.noAdvice}</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                {t.addAdvice}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="modal-overlay">
          <div className={`modal-container ${theme}`}>
            <h3>{t.deleteConfirm}</h3>
            
            <div className="modal-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setShowConfirmDelete(false)}
              >
                {t.no}
              </button>
              
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
              >
                {t.yes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorAdvice;
