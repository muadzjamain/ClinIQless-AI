const { VertexAI } = require('@google-cloud/vertexai');
const speech = require('@google-cloud/speech');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1',
});

// Initialize Speech-to-Text client
const speechClient = new speech.SpeechClient();

// Initialize Gemini API client
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

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
 * Analyzes skin image for skin type detection using Gemini API
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
 * @returns {Object} Analysis results
 */
const analyzeSkin = async (imageBuffer, mimeType = 'image/jpeg') => {
  try {
    // Convert image buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Use the Gemini API client initialized at the top of the file
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Create a prompt for skin analysis
    const prompt = `Analyze this facial skin image and provide detailed information about:
    1. Skin type (dry, oily, combination, normal, sensitive)
    2. Skin conditions (acne, sensitivity, dryness, etc.)
    3. Skin metrics (moisture, oiliness, sensitivity, pigmentation, wrinkles, pores) on a scale of 0-100
    4. Overall skin health score (0-100)
    5. Estimated skin age
    
    Format your response as a JSON object with the following structure:
    {
      "overallScore": number,
      "skinAge": number,
      "skinType": {
        "type": string,
        "score": number,
        "description": string
      },
      "conditions": [
        {
          "name": string,
          "severity": string,
          "probability": number,
          "active": boolean
        }
      ],
      "metrics": {
        "moisture": number,
        "oiliness": number,
        "sensitivity": number,
        "pigmentation": number,
        "wrinkles": number,
        "pores": number
      }
    }`;
    
    // Create parts with text and image
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    };
    
    // Generate content with the image and prompt
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    // Parse the skin analysis results
    const skinAnalysis = JSON.parse(jsonMatch[0]);
    
    // Generate skincare recommendations based on the analysis
    const recommendations = await generateSkincareRecommendations(skinAnalysis);
    
    // Combine analysis and recommendations
    return {
      ...skinAnalysis,
      recommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Skin analysis error:', error);
    
    // Provide a fallback response if the API fails
    const fallbackSkinType = {
      type: 'combination',
      score: 75,
      description: 'Your skin appears to have both oily and dry areas.'
    };
    
    const fallbackAnalysis = {
      overallScore: 70,
      skinAge: 30,
      skinType: fallbackSkinType,
      conditions: [
        { name: 'Sensitivity', severity: 'mild', probability: 65, active: true },
        { name: 'Dryness', severity: 'moderate', probability: 80, active: true }
      ],
      metrics: {
        moisture: 65,
        oiliness: 70,
        sensitivity: 60,
        pigmentation: 75,
        wrinkles: 65,
        pores: 70
      }
    };
    
    // Get recommendations for the fallback skin type
    const recommendations = await generateSkincareRecommendations(fallbackAnalysis);
    
    return {
      ...fallbackAnalysis,
      recommendations,
      timestamp: new Date().toISOString(),
      error: error.message,
      note: 'Using fallback analysis due to API error'
    };
  }
};

/**
 * Generates skincare recommendations based on skin analysis using Gemini API
 * @param {Object} skinAnalysis - Detected skin analysis results
 * @returns {Object} Skincare recommendations
 */
const generateSkincareRecommendations = async (skinAnalysis) => {
  try {
    // Initialize the Gemini API client
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Create a detailed prompt based on the full skin analysis
    const prompt = `Based on the following skin analysis data, provide personalized skincare recommendations:
    ${JSON.stringify(skinAnalysis, null, 2)}
    
    Format your response as JSON with the following structure:
    {
      "skincare": {
        "morning": [list of steps as strings],
        "evening": [list of steps as strings]
      },
      "products": [
        { "name": "Product Name", "description": "Product description and benefits" }
      ],
      "lifestyle": [list of lifestyle recommendations as strings]
    }`;
    
    // Generate content with the prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the generated text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid recommendation format from Gemini API');
    }
    
    // Parse the recommendations
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `Summarize the following doctor-patient conversation.
    Extract key medical information, diagnoses, treatments, and follow-up instructions.
    Format the response as JSON with the following structure:
    {
      "summary": "brief summary of the conversation",
      "diagnoses": [list of potential diagnoses mentioned],
      "treatments": [list of treatments or medications prescribed],
      "followUp": [list of follow-up instructions],
      "keyPoints": [list of other important points from the conversation]
    }
    
    Conversation transcription:
    ${transcription}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const text = response.text();
    
    if (!text) {
      throw new Error('No summary generated');
    }
    
    // Extract JSON from the generated text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
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
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const text = response.text();
    
    if (!text) {
      throw new Error('No evaluation generated');
    }
    
    // Extract JSON from the generated text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `You are a helpful healthcare assistant providing information about diabetes and general health.
    Respond to the following query in ${language === 'en' ? 'English' : 'Malay'} language.
    Keep your response concise, informative, and helpful.
    
    User query: ${query}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const text = response.text();
    
    if (!text) {
      return 'I apologize, but I couldn\'t process your query. Please try again.';
    }
    
    return text.trim();
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
