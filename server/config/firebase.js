const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin SDK
// In production, use service account credentials from environment variables
// For local development, you can use a service account key file
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // For local development only
    serviceAccount = require('../serviceAccountKey.json');
  }
} catch (error) {
  console.warn('Firebase service account not found, using application default credentials');
}

// Initialize the app
admin.initializeApp({
  credential: serviceAccount 
    ? admin.credential.cert(serviceAccount)
    : admin.credential.applicationDefault(),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'cliniqless-ai.appspot.com'
});

// Export Firebase services
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  auth,
  storage
};
