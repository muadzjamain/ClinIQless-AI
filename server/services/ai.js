const { VertexAI } = require('@google-cloud/vertexai');
const speech = require('@google-cloud/speech');
const { TextServiceClient } = require('@google-ai/generativelanguage').v1beta;
const { GoogleAuth } = require('google-auth-library');

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1',
});

// Initialize Speech-to-Text client
const speechClient = new speech.SpeechClient();

// Initialize Gemini API client
const MODEL_NAME = 'models/gemini-1.5-pro';
const API_KEY = process.env.GEMINI_API_KEY;

const textServiceClient = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(API_KEY),
});

/**
 * Analyzes voice recording for diabetes risk prediction
 * @param {Buffer} audioBuffer - Audio file buffer
 * @returns {Object} Analysis results
 */
const analyzeVoice = async (audioBuffer) => {
  try {
    // Convert audio to text for analysis
    const [transcription] = await speechToText(audioBuffer);
    
    // Extract voice features for analysis
    const voiceFeatures = await extractVoiceFeatures(audioBuffer);
    
    // Predict diabetes risk using Vertex AI model
    const predictionResults = await predictDiabetesRisk(voiceFeatures);
    
    return {
      transcription,
      features: voiceFeatures,
      prediction: predictionResults,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Voice analysis error:', error);
    throw new Error(`Failed to analyze voice: ${error.message}`);
  }
};

/**
 * Converts speech to text using Google Cloud Speech-to-Text
 * @param {Buffer} audioBuffer - Audio file buffer
 * @returns {Array} Transcription results
 */
const speechToText = async (audioBuffer) => {
  try {
    const audio = {
      content: audioBuffer.toString('base64'),
    };
    
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      alternativeLanguageCodes: ['ms-MY'], // Support for Malay
      enableAutomaticPunctuation: true,
      model: 'default',
    };
    
    const request = {
      audio: audio,
      config: config,
    };
    
    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    
    return [transcription, response.results];
  } catch (error) {
    console.error('Speech-to-Text error:', error);
    throw new Error(`Speech-to-Text failed: ${error.message}`);
  }
};

/**
 * Extracts voice features from audio for analysis
 * @param {Buffer} audioBuffer - Audio file buffer
 * @returns {Object} Voice features
 */
const extractVoiceFeatures = async (audioBuffer) => {
  try {
    // In a real implementation, this would use specialized audio processing
    // libraries to extract features like jitter, shimmer, pitch, etc.
    // For this prototype, we'll return placeholder values
    
    return {
      jitter: 0.012,
      shimmer: 0.085,
      pitch: {
        mean: 120.5,
        std: 15.2,
        range: 45.8
      },
      formants: {
        f1: 550,
        f2: 1700,
        f3: 2500
      },
      energy: 75.3,
      spectralFeatures: {
        centroid: 1250,
        flux: 0.45,
        rolloff: 3200
      }
    };
  } catch (error) {
    console.error('Voice feature extraction error:', error);
    throw new Error(`Feature extraction failed: ${error.message}`);
  }
};

/**
 * Predicts diabetes risk based on voice features
 * @param {Object} voiceFeatures - Extracted voice features
 * @returns {Object} Prediction results
 */
const predictDiabetesRisk = async (voiceFeatures) => {
  try {
    // In a real implementation, this would call a trained ML model
    // For this prototype, we'll simulate a prediction
    
    // Sample prediction logic (would be replaced with actual model)
    const jitterWeight = 15;
    const shimmerWeight = 20;
    const pitchWeight = 25;
    const energyWeight = 20;
    const spectralWeight = 20;
    
    const jitterScore = voiceFeatures.jitter > 0.01 ? 
      voiceFeatures.jitter * jitterWeight * 100 : 0;
      
    const shimmerScore = voiceFeatures.shimmer > 0.08 ? 
      voiceFeatures.shimmer * shimmerWeight * 100 : 0;
      
    const pitchScore = (voiceFeatures.pitch.std / voiceFeatures.pitch.mean) * pitchWeight * 10;
    
    const energyScore = (voiceFeatures.energy < 70) ? 
      (70 - voiceFeatures.energy) / 70 * energyWeight * 10 : 0;
      
    const spectralScore = (voiceFeatures.spectralFeatures.flux > 0.4) ? 
      voiceFeatures.spectralFeatures.flux * spectralWeight * 10 : 0;
    
    const totalScore = jitterScore + shimmerScore + pitchScore + energyScore + spectralScore;
    const riskPercentage = Math.min(Math.max(totalScore, 5), 95);
    
    let riskLevel;
    if (riskPercentage < 20) riskLevel = 'low';
    else if (riskPercentage < 50) riskLevel = 'moderate';
    else if (riskPercentage < 75) riskLevel = 'high';
    else riskLevel = 'very high';
    
    return {
      riskPercentage,
      riskLevel,
      confidence: 0.85,
      featureImportance: {
        jitter: jitterScore / totalScore,
        shimmer: shimmerScore / totalScore,
        pitch: pitchScore / totalScore,
        energy: energyScore / totalScore,
        spectral: spectralScore / totalScore
      }
    };
  } catch (error) {
    console.error('Diabetes risk prediction error:', error);
    throw new Error(`Risk prediction failed: ${error.message}`);
  }
};

/**
 * Analyzes skin image for skin type detection
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {Object} Analysis results
 */
const analyzeSkin = async (imageBuffer) => {
  try {
    // In a real implementation, this would use a trained computer vision model
    // For this prototype, we'll simulate a prediction
    
    // Placeholder for skin analysis results
    const skinTypes = ['oily', 'dry', 'combination', 'normal'];
    const randomIndex = Math.floor(Math.random() * skinTypes.length);
    const skinType = skinTypes[randomIndex];
    
    // Generate skincare recommendations using Gemini API
    const recommendations = await generateSkincareRecommendations(skinType);
    
    return {
      skinType,
      confidence: 0.85,
      recommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Skin analysis error:', error);
    throw new Error(`Failed to analyze skin: ${error.message}`);
  }
};

/**
 * Generates skincare recommendations based on skin type using Gemini API
 * @param {string} skinType - Detected skin type
 * @returns {Object} Skincare recommendations
 */
const generateSkincareRecommendations = async (skinType) => {
  try {
    const prompt = `Generate personalized skincare recommendations for ${skinType} skin type. 
    Include morning routine, evening routine, and recommended ingredients to look for. 
    Format the response as JSON with the following structure:
    {
      "morningRoutine": [list of steps],
      "eveningRoutine": [list of steps],
      "recommendedIngredients": [list of ingredients with benefits],
      "productsToAvoid": [list of products or ingredients to avoid]
    }`;
    
    const result = await textServiceClient.generateText({
      model: MODEL_NAME,
      prompt: {
        text: prompt,
      },
    });
    
    const generatedText = result[0]?.candidates[0]?.output;
    
    if (!generatedText) {
      throw new Error('No recommendations generated');
    }
    
    // Extract JSON from the generated text
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid recommendation format');
    }
    
    const recommendations = JSON.parse(jsonMatch[0]);
    return recommendations;
  } catch (error) {
    console.error('Skincare recommendation generation error:', error);
    
    // Fallback recommendations if API fails
    return {
      morningRoutine: [
        'Gentle cleanser',
        'Toner',
        'Moisturizer',
        'Sunscreen'
      ],
      eveningRoutine: [
        'Makeup remover',
        'Cleanser',
        'Treatment product',
        'Night cream'
      ],
      recommendedIngredients: [
        'Hyaluronic acid - hydration',
        'Niacinamide - balances oil production',
        'Ceramides - strengthens skin barrier'
      ],
      productsToAvoid: [
        'Harsh exfoliants',
        'Alcohol-based products'
      ]
    };
  }
};

/**
 * Summarizes doctor conversation using Gemini API
 * @param {string} transcription - Conversation transcription
 * @returns {Object} Conversation summary and insights
 */
const summarizeConversation = async (transcription) => {
  try {
    const prompt = `Summarize the following doctor-patient conversation. 
    Extract key points, medical advice, medication instructions, and follow-up actions.
    Also identify any medical terms that might need explanation.
    Format the response as JSON with the following structure:
    {
      "summary": "brief summary of the conversation",
      "keyPoints": [list of key points],
      "medicalAdvice": [list of advice given],
      "medications": [list of medications with instructions],
      "followUp": [list of follow-up actions],
      "medicalTerms": [list of medical terms with explanations]
    }
    
    Conversation transcript:
    ${transcription}`;
    
    const result = await textServiceClient.generateText({
      model: MODEL_NAME,
      prompt: {
        text: prompt,
      },
    });
    
    const generatedText = result[0]?.candidates[0]?.output;
    
    if (!generatedText) {
      throw new Error('No summary generated');
    }
    
    // Extract JSON from the generated text
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid summary format');
    }
    
    const summary = JSON.parse(jsonMatch[0]);
    return summary;
  } catch (error) {
    console.error('Conversation summarization error:', error);
    throw new Error(`Summarization failed: ${error.message}`);
  }
};

/**
 * Evaluates doctor advice reliability using Gemini API
 * @param {string} advice - Doctor advice to evaluate
 * @returns {Object} Reliability evaluation
 */
const evaluateDoctorAdvice = async (advice) => {
  try {
    const prompt = `Evaluate the reliability of the following medical advice given by a doctor.
    Check for consistency with general medical guidelines and best practices.
    Do NOT provide medical advice, just evaluate the given advice.
    Format the response as JSON with the following structure:
    {
      "consistencyScore": number between 0-100,
      "evaluation": "brief evaluation of the advice",
      "potentialConcerns": [list of potential concerns or inconsistencies, if any],
      "suggestedQuestions": [list of follow-up questions the patient might want to ask]
    }
    
    Doctor's advice:
    ${advice}`;
    
    const result = await textServiceClient.generateText({
      model: MODEL_NAME,
      prompt: {
        text: prompt,
      },
    });
    
    const generatedText = result[0]?.candidates[0]?.output;
    
    if (!generatedText) {
      throw new Error('No evaluation generated');
    }
    
    // Extract JSON from the generated text
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid evaluation format');
    }
    
    const evaluation = JSON.parse(jsonMatch[0]);
    return evaluation;
  } catch (error) {
    console.error('Doctor advice evaluation error:', error);
    throw new Error(`Evaluation failed: ${error.message}`);
  }
};

/**
 * Processes chatbot query using Gemini API
 * @param {string} query - User query
 * @param {string} language - Query language ('en' or 'ms')
 * @returns {string} Chatbot response
 */
const processChatbotQuery = async (query, language = 'en') => {
  try {
    const systemPrompt = language === 'en' 
      ? `You are a helpful health assistant specializing in diabetes information. 
         Provide accurate, evidence-based information about diabetes. 
         Keep responses concise and informative. 
         If you don't know something, say so rather than making up information.`
      : `Anda adalah pembantu kesihatan yang pakar dalam maklumat diabetes. 
         Berikan maklumat yang tepat dan berasaskan bukti tentang diabetes. 
         Pastikan jawapan ringkas dan informatif. 
         Jika anda tidak tahu sesuatu, katakan dengan jujur dan jangan cipta maklumat.`;
    
    const prompt = `${systemPrompt}
    
    User query: ${query}`;
    
    const result = await textServiceClient.generateText({
      model: MODEL_NAME,
      prompt: {
        text: prompt,
      },
    });
    
    const response = result[0]?.candidates[0]?.output;
    
    if (!response) {
      throw new Error('No response generated');
    }
    
    return response;
  } catch (error) {
    console.error('Chatbot query processing error:', error);
    
    // Fallback response if API fails
    return language === 'en'
      ? "I'm sorry, I'm having trouble processing your request right now. Please try again later."
      : "Maaf, saya menghadapi masalah memproses permintaan anda sekarang. Sila cuba lagi kemudian.";
  }
};

module.exports = {
  analyzeVoice,
  analyzeSkin,
  summarizeConversation,
  evaluateDoctorAdvice,
  processChatbotQuery
};
