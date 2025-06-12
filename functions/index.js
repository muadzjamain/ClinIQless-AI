const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Import all cloud functions
const { processConversationRecording } = require('./processConversation');
const { processVoiceAnalysis } = require('./processVoiceAnalysis');
const { processSkinAnalysis } = require('./processSkinAnalysis');

// Export all cloud functions
exports.processConversationRecording = processConversationRecording;
exports.processVoiceAnalysis = processVoiceAnalysis;
exports.processSkinAnalysis = processSkinAnalysis;

/**
 * Process conversation recording when a new conversation is added
 * This function is triggered when a new document is created in the 'conversations' collection
 */
exports.processConversationRecording = functions.firestore
  .document('conversations/{conversationId}')
  .onCreate(async (snapshot, context) => {
    try {
      const conversationData = snapshot.data();
      const conversationId = context.params.conversationId;
      
      // Only process if status is 'processing'
      if (conversationData.status !== 'processing') {
        console.log(`Conversation ${conversationId} is not in processing status. Skipping.`);
        return null;
      }
      
      // Update status to transcribing
      await snapshot.ref.update({
        status: 'transcribing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Get the audio file from Storage
      const filePath = conversationData.filePath;
      if (!filePath) {
        throw new Error('No audio file path found in conversation data');
      }
      
      const bucket = admin.storage().bucket();
      const [audioFile] = await bucket.file(filePath).download();
      
      // Transcribe audio using Speech-to-Text
      // In a real implementation, this would use the Speech-to-Text API
      // For this prototype, we'll simulate a transcription
      const transcription = `
        Doctor: Good morning. How are you feeling today?
        Patient: I've been feeling tired lately, and I'm thirsty all the time.
        Doctor: How long has this been going on?
        Patient: About two weeks now. I'm also urinating more frequently.
        Doctor: Those symptoms could indicate several conditions. Let's run some tests. I'd like to check your blood sugar levels.
        Patient: Do you think it might be diabetes?
        Doctor: It's a possibility we need to rule out. Frequent urination, increased thirst, and fatigue are common symptoms of diabetes. But let's not jump to conclusions before we have the test results.
        Patient: My father has type 2 diabetes. Does that increase my risk?
        Doctor: Yes, family history is a risk factor. We'll check your fasting blood glucose and HbA1c levels. In the meantime, try to reduce your sugar intake and increase physical activity.
        Patient: How soon can we get the results?
        Doctor: The blood work should be ready in 2-3 days. I'll call you as soon as I have the results. If your blood sugar is elevated, we'll discuss treatment options, which might include lifestyle changes, medication, or both.
        Patient: Thank you, doctor. I'll wait for your call.
        Doctor: Before you go, do you have any other concerns or questions?
        Patient: No, that's all for now.
        Doctor: Alright. The nurse will help you schedule the blood tests. Take care, and I'll talk to you soon.
      `;
      
      // Update with transcription
      await snapshot.ref.update({
        transcription,
        status: 'summarizing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Summarize the conversation using Gemini API
      // In a real implementation, this would use the Gemini API
      // For this prototype, we'll simulate a summary
      const summary = {
        mainComplaints: [
          'Fatigue',
          'Increased thirst',
          'Frequent urination'
        ],
        possibleDiagnosis: 'Potential diabetes (to be confirmed with tests)',
        recommendedTests: [
          'Fasting blood glucose',
          'HbA1c levels'
        ],
        recommendations: [
          'Reduce sugar intake',
          'Increase physical activity',
          'Wait for blood test results (2-3 days)'
        ],
        followUp: 'Doctor will call with test results'
      };
      
      // Update with summary
      await snapshot.ref.update({
        summary,
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    } catch (error) {
      console.error('Error processing conversation recording:', error);
      
      // Update status to error
      await admin.firestore().collection('conversations')
        .doc(context.params.conversationId)
        .update({
          status: 'error',
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      return null;
    }
  });
