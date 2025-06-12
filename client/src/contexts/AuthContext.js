import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebase';

// Create context
const AuthContext = createContext();

// Hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  // Register a new user
  async function register(email, password, displayName) {
    try {
      setError('');
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName,
        createdAt: new Date().toISOString(),
        language: 'en', // Default language
        preferences: {
          theme: 'light',
          notifications: true
        }
      });
      
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }
  
  // Login user
  async function login(email, password) {
    try {
      setError('');
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }
  
  // Logout user
  async function logout() {
    try {
      setError('');
      setUserProfile(null);
      return await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }
  
  // Reset password
  async function resetPassword(email) {
    try {
      setError('');
      return await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }
  
  // Update user profile
  async function updateUserProfile(data) {
    try {
      setError('');
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, data, { merge: true });
      
      // Update local user profile state
      const updatedProfile = { ...userProfile, ...data };
      setUserProfile(updatedProfile);
      
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }
  
  // Fetch user profile from Firestore
  async function fetchUserProfile(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserProfile(userData);
        return userData;
      } else {
        setUserProfile(null);
        return null;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUserProfile(null);
      return null;
    }
  }
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    register,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    fetchUserProfile
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
