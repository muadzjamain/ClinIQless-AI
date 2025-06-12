import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaUser, FaCamera, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import './Profile.css';

function Profile() {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    language: 'en',
    medicalConditions: '',
    allergies: '',
    emergencyContact: '',
    emergencyPhone: ''
  });
  
  const fileInputRef = useRef();
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const db = getFirestore();
  const storage = getStorage();
  
  // Get user's preferred language
  const userLanguage = userProfile?.language || 'en';
  
  // Multilingual labels
  const labels = {
    en: {
      title: 'Profile',
      description: 'Manage your personal information and preferences',
      personalInfo: 'Personal Information',
      displayName: 'Full Name',
      email: 'Email Address',
      phoneNumber: 'Phone Number',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      genderMale: 'Male',
      genderFemale: 'Female',
      genderOther: 'Other',
      genderPreferNotToSay: 'Prefer not to say',
      language: 'Preferred Language',
      languageEn: 'English',
      languageMs: 'Bahasa Melayu',
      medicalInfo: 'Medical Information',
      medicalConditions: 'Medical Conditions',
      medicalConditionsPlaceholder: 'List any medical conditions or health issues',
      allergies: 'Allergies',
      allergiesPlaceholder: 'List any allergies or sensitivities',
      emergencyContact: 'Emergency Contact Name',
      emergencyPhone: 'Emergency Contact Phone',
      save: 'Save Changes',
      saving: 'Saving...',
      changePhoto: 'Change Photo',
      uploadingPhoto: 'Uploading...',
      successUpdate: 'Profile updated successfully',
      errorUpdate: 'Error updating profile',
      required: 'Required'
    },
    ms: {
      title: 'Profil',
      description: 'Urus maklumat peribadi dan keutamaan anda',
      personalInfo: 'Maklumat Peribadi',
      displayName: 'Nama Penuh',
      email: 'Alamat Emel',
      phoneNumber: 'Nombor Telefon',
      dateOfBirth: 'Tarikh Lahir',
      gender: 'Jantina',
      genderMale: 'Lelaki',
      genderFemale: 'Perempuan',
      genderOther: 'Lain-lain',
      genderPreferNotToSay: 'Tidak mahu menyatakan',
      language: 'Bahasa Pilihan',
      languageEn: 'Bahasa Inggeris',
      languageMs: 'Bahasa Melayu',
      medicalInfo: 'Maklumat Perubatan',
      medicalConditions: 'Keadaan Perubatan',
      medicalConditionsPlaceholder: 'Senaraikan sebarang keadaan perubatan atau masalah kesihatan',
      allergies: 'Alahan',
      allergiesPlaceholder: 'Senaraikan sebarang alahan atau kepekaan',
      emergencyContact: 'Nama Hubungan Kecemasan',
      emergencyPhone: 'Telefon Hubungan Kecemasan',
      save: 'Simpan Perubahan',
      saving: 'Menyimpan...',
      changePhoto: 'Tukar Foto',
      uploadingPhoto: 'Memuat naik...',
      successUpdate: 'Profil berjaya dikemas kini',
      errorUpdate: 'Ralat mengemaskini profil',
      required: 'Diperlukan'
    }
  };
  
  // Use the appropriate language
  const t = labels[userLanguage] || labels.en;
  
  // Initialize form data with user profile
  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || currentUser?.displayName || '',
        email: currentUser?.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        dateOfBirth: userProfile.dateOfBirth || '',
        gender: userProfile.gender || '',
        language: userProfile.language || 'en',
        medicalConditions: userProfile.medicalConditions || '',
        allergies: userProfile.allergies || '',
        emergencyContact: userProfile.emergencyContact || '',
        emergencyPhone: userProfile.emergencyPhone || ''
      });
      
      if (userProfile.photoURL || currentUser?.photoURL) {
        setImagePreview(userProfile.photoURL || currentUser?.photoURL);
      }
    }
  }, [userProfile, currentUser]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
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
    
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Upload profile image if changed
      let photoURL = userProfile?.photoURL;
      
      if (profileImage) {
        setUploadingImage(true);
        const storageRef = ref(storage, `profileImages/${currentUser.uid}`);
        await uploadBytes(storageRef, profileImage);
        photoURL = await getDownloadURL(storageRef);
        setUploadingImage(false);
      }
      
      // Update user profile in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const updatedProfile = {
        ...formData,
        photoURL,
        updatedAt: new Date()
      };
      
      await updateDoc(userRef, updatedProfile);
      
      // Update context
      await updateUserProfile(updatedProfile);
      
      setSuccess(t.successUpdate);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(t.errorUpdate);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <FaUser className="title-icon" />
          {t.title}
        </h1>
        <p className="page-description">{t.description}</p>
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
      
      <div className={`profile-container ${theme}`}>
        {/* Profile Image Section */}
        <div className="profile-image-section">
          <div className="profile-image-container">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="profile-image" />
            ) : (
              <div className="profile-image-placeholder">
                <FaUser />
              </div>
            )}
            
            <button 
              type="button" 
              className="change-photo-button"
              onClick={() => fileInputRef.current.click()}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <>
                  <FaSpinner className="spinner-icon" />
                  {t.uploadingPhoto}
                </>
              ) : (
                <>
                  <FaCamera />
                  {t.changePhoto}
                </>
              )}
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
        </div>
        
        {/* Profile Form */}
        <form className="profile-form" onSubmit={handleSubmit}>
          {/* Personal Information Section */}
          <div className="form-section">
            <h2 className="section-title">{t.personalInfo}</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="displayName">
                  {t.displayName} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  className="form-control"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">
                  {t.email} <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  disabled
                />
                <small className="form-text">Email cannot be changed</small>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">{t.phoneNumber}</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  className="form-control"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dateOfBirth">{t.dateOfBirth}</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  className="form-control"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">{t.gender}</label>
                <select
                  id="gender"
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">-- Select --</option>
                  <option value="male">{t.genderMale}</option>
                  <option value="female">{t.genderFemale}</option>
                  <option value="other">{t.genderOther}</option>
                  <option value="prefer-not-to-say">{t.genderPreferNotToSay}</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="language">{t.language}</label>
                <select
                  id="language"
                  name="language"
                  className="form-control"
                  value={formData.language}
                  onChange={handleInputChange}
                >
                  <option value="en">{t.languageEn}</option>
                  <option value="ms">{t.languageMs}</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Medical Information Section */}
          <div className="form-section">
            <h2 className="section-title">{t.medicalInfo}</h2>
            
            <div className="form-group">
              <label htmlFor="medicalConditions">{t.medicalConditions}</label>
              <textarea
                id="medicalConditions"
                name="medicalConditions"
                className="form-control"
                rows="3"
                placeholder={t.medicalConditionsPlaceholder}
                value={formData.medicalConditions}
                onChange={handleInputChange}
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="allergies">{t.allergies}</label>
              <textarea
                id="allergies"
                name="allergies"
                className="form-control"
                rows="3"
                placeholder={t.allergiesPlaceholder}
                value={formData.allergies}
                onChange={handleInputChange}
              ></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="emergencyContact">{t.emergencyContact}</label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
                  className="form-control"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="emergencyPhone">{t.emergencyPhone}</label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
                  className="form-control"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary btn-save"
              disabled={loading || uploadingImage}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner-icon" />
                  {t.saving}
                </>
              ) : (
                t.save
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
