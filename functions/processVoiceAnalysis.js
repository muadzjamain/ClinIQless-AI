const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const { SpeechClient } = require('@google-cloud/speech');
const { VertexAI } = require('@google-cloud/vertexai');

// Initialize clients if admin not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Google Cloud clients
const storage = new Storage();
const speechClient = new SpeechClient();
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1',
});

/**
 * Process voice analysis when a new voice recording is uploaded
 * This function is triggered when a new document is created in the 'voiceAnalysis' collection
 */
exports.processVoiceAnalysis = functions.firestore
  .document('voiceAnalysis/{analysisId}')
  .onCreate(async (snapshot, context) => {
    try {
      const analysisData = snapshot.data();
      const analysisId = context.params.analysisId;
      
      // Only process if status is 'uploaded'
      if (analysisData.status !== 'uploaded') {
        console.log(`Voice analysis ${analysisId} is not in uploaded status. Skipping.`);
        return null;
      }
      
      // Update status to processing
      await snapshot.ref.update({
        status: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Get the audio file from Storage
      const filePath = analysisData.filePath;
      if (!filePath) {
        throw new Error('No audio file path found in analysis data');
      }
      
      const bucket = admin.storage().bucket();
      const [audioFile] = await bucket.file(filePath).download();
      
      // Step 1: Transcribe audio using Speech-to-Text
      await snapshot.ref.update({
        status: 'transcribing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // In a real implementation, this would use the Speech-to-Text API
      // For this prototype, we'll simulate a transcription
      const transcription = "I've been feeling very tired lately. I'm constantly thirsty and need to use the bathroom frequently. I've also noticed that I've lost some weight without trying. My vision is sometimes blurry, and I have numbness in my feet. My family has a history of diabetes, and I'm worried I might have it too. I'm 45 years old, overweight, and don't exercise regularly. My diet includes a lot of processed foods and sugary drinks.";
      
      // Update with transcription
      await snapshot.ref.update({
        transcription,
        status: 'analyzing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Step 2: Extract features and analyze for diabetes risk
      // In a real implementation, this would use a trained ML model on Vertex AI
      // For this prototype, we'll simulate an analysis based on keywords in the transcription
      
      // Extract features (simplified)
      const features = {
        symptoms: {
          fatigue: transcription.toLowerCase().includes('tired') || transcription.toLowerCase().includes('fatigue'),
          polyuria: transcription.toLowerCase().includes('urinate') || transcription.toLowerCase().includes('bathroom frequently'),
          polydipsia: transcription.toLowerCase().includes('thirsty'),
          weightLoss: transcription.toLowerCase().includes('weight loss') || transcription.toLowerCase().includes('lost weight'),
          blurredVision: transcription.toLowerCase().includes('blurry vision') || transcription.toLowerCase().includes('vision'),
          numbness: transcription.toLowerCase().includes('numbness'),
        },
        riskFactors: {
          familyHistory: transcription.toLowerCase().includes('family history') || transcription.toLowerCase().includes('family has'),
          age: extractAge(transcription),
          overweight: transcription.toLowerCase().includes('overweight') || transcription.toLowerCase().includes('obesity'),
          sedentaryLifestyle: !transcription.toLowerCase().includes('exercise regularly') || transcription.toLowerCase().includes("don't exercise"),
          poorDiet: transcription.toLowerCase().includes('processed foods') || transcription.toLowerCase().includes('sugary'),
        }
      };
      
      // Calculate risk score (simplified algorithm)
      let riskScore = 0;
      
      // Add points for symptoms
      Object.values(features.symptoms).forEach(present => {
        if (present) riskScore += 10;
      });
      
      // Add points for risk factors
      if (features.riskFactors.familyHistory) riskScore += 15;
      if (features.riskFactors.age > 40) riskScore += 10;
      if (features.riskFactors.overweight) riskScore += 15;
      if (features.riskFactors.sedentaryLifestyle) riskScore += 10;
      if (features.riskFactors.poorDiet) riskScore += 10;
      
      // Determine risk level
      let riskLevel;
      if (riskScore >= 60) {
        riskLevel = 'high';
      } else if (riskScore >= 30) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }
      
      // Generate recommendations based on risk level
      const recommendations = generateRecommendations(riskLevel, features);
      
      // Final analysis result
      const analysis = {
        transcription,
        features,
        riskScore,
        riskLevel,
        recommendations,
        analysisDate: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Update with analysis results
      await snapshot.ref.update({
        analysis,
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    } catch (error) {
      console.error('Error processing voice analysis:', error);
      
      // Update status to error
      await admin.firestore().collection('voiceAnalysis')
        .doc(context.params.analysisId)
        .update({
          status: 'error',
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      return null;
    }
  });

/**
 * Extract age from transcription text
 * @param {string} text - Transcription text
 * @returns {number} - Extracted age or default value
 */
function extractAge(text) {
  const ageMatch = text.match(/\b(\d{1,2})\s*(?:years|year|yrs|yr)?\s*old\b/i);
  return ageMatch ? parseInt(ageMatch[1]) : 45; // Default to 45 if not found
}

/**
 * Generate recommendations based on risk level and features
 * @param {string} riskLevel - Risk level (low, medium, high)
 * @param {object} features - Extracted features
 * @returns {object} - Recommendations
 */
function generateRecommendations(riskLevel, features) {
  const recommendations = {
    general: [
      'Maintain a balanced diet rich in fruits, vegetables, and whole grains',
      'Stay physically active with at least 150 minutes of moderate exercise per week',
      'Maintain a healthy weight',
      'Stay hydrated with water instead of sugary drinks',
      'Get regular check-ups with your healthcare provider'
    ],
    specific: []
  };
  
  // Add specific recommendations based on risk level
  if (riskLevel === 'high') {
    recommendations.specific = [
      'Schedule an appointment with your doctor immediately for diabetes screening',
      'Consider monitoring your blood glucose levels',
      'Limit intake of processed foods, sugary drinks, and high-carb meals',
      'Increase physical activity to at least 30 minutes daily',
      'Consider consulting with a dietitian for a personalized meal plan'
    ];
  } else if (riskLevel === 'medium') {
    recommendations.specific = [
      'Schedule a diabetes screening with your doctor in the next few weeks',
      'Reduce consumption of sugary foods and beverages',
      'Incorporate more physical activity into your daily routine',
      'Monitor for changes in symptoms and seek medical advice if they worsen'
    ];
  } else {
    recommendations.specific = [
      'Continue maintaining a healthy lifestyle',
      'Consider annual diabetes screening, especially if you have risk factors',
      'Stay informed about diabetes prevention strategies'
    ];
  }
  
  // Add recommendations based on specific features
  if (features.riskFactors.familyHistory) {
    recommendations.specific.push('Given your family history, consider more frequent diabetes screenings');
  }
  
  if (features.riskFactors.sedentaryLifestyle) {
    recommendations.specific.push('Gradually increase your physical activity levels, starting with short walks');
  }
  
  if (features.riskFactors.poorDiet) {
    recommendations.specific.push('Focus on reducing processed foods and added sugars in your diet');
  }
  
  return recommendations;
}

// Export the function
module.exports = exports;
