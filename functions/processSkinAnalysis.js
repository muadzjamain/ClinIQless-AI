const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleAuth } = require('google-auth-library');
const { TextServiceClient } = require('@google-ai/generativelanguage').v1beta;

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Gemini API client
const MODEL_NAME = 'models/gemini-pro-vision';
const API_KEY = process.env.GEMINI_API_KEY;

/**
 * Process skin analysis when a new skin image is uploaded
 * This function is triggered when a new document is created in the 'skinAnalysis' collection
 */
exports.processSkinAnalysis = functions.firestore
  .document('skinAnalysis/{analysisId}')
  .onCreate(async (snapshot, context) => {
    try {
      const analysisData = snapshot.data();
      const analysisId = context.params.analysisId;
      
      // Only process if status is 'uploaded' or not set
      if (analysisData.status && analysisData.status !== 'uploaded') {
        console.log(`Skin analysis ${analysisId} is not in uploaded status. Skipping.`);
        return null;
      }
      
      // Update status to processing
      await snapshot.ref.update({
        status: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Get the image file from Storage
      const filePath = analysisData.filePath;
      if (!filePath) {
        throw new Error('No image file path found in analysis data');
      }
      
      const bucket = admin.storage().bucket();
      const [imageFile] = await bucket.file(filePath).download();
      
      // In a real implementation, this would use the Gemini API with vision capabilities
      // For this prototype, we'll simulate an analysis based on the body part
      const bodyPart = analysisData.bodyPart || 'face';
      
      // Simulate skin analysis based on body part
      let skinAnalysis;
      
      if (bodyPart.toLowerCase() === 'face') {
        skinAnalysis = {
          skinType: 'Combination',
          concerns: ['Mild acne', 'Uneven skin tone', 'Visible pores'],
          recommendations: {
            skinType: 'Combination',
            concerns: ['Mild acne', 'Uneven skin tone', 'Visible pores'],
            products: [
              {
                type: 'Cleanser',
                recommendation: 'Gentle foaming cleanser with salicylic acid',
                ingredients: ['Salicylic Acid', 'Glycerin', 'Niacinamide']
              },
              {
                type: 'Toner',
                recommendation: 'Alcohol-free toner with witch hazel',
                ingredients: ['Witch Hazel', 'Aloe Vera', 'Glycerin']
              },
              {
                type: 'Serum',
                recommendation: 'Niacinamide serum for pore reduction and oil control',
                ingredients: ['Niacinamide', 'Zinc PCA', 'Hyaluronic Acid']
              },
              {
                type: 'Moisturizer',
                recommendation: 'Lightweight, oil-free gel moisturizer',
                ingredients: ['Hyaluronic Acid', 'Ceramides', 'Glycerin']
              },
              {
                type: 'Sunscreen',
                recommendation: 'Oil-free, non-comedogenic SPF 50',
                ingredients: ['Zinc Oxide', 'Titanium Dioxide']
              }
            ],
            routine: {
              morning: [
                'Cleanse with gentle foaming cleanser',
                'Apply alcohol-free toner',
                'Apply niacinamide serum',
                'Apply lightweight gel moisturizer',
                'Finish with oil-free SPF 50'
              ],
              evening: [
                'Cleanse with gentle foaming cleanser',
                'Apply alcohol-free toner',
                'Apply niacinamide serum',
                'Apply lightweight gel moisturizer',
                'Spot treat acne with benzoyl peroxide if needed'
              ]
            },
            lifestyle: [
              'Stay hydrated by drinking plenty of water',
              'Avoid touching your face throughout the day',
              'Change pillowcases frequently',
              'Maintain a balanced diet rich in antioxidants',
              'Manage stress through meditation or exercise'
            ]
          }
        };
      } else if (bodyPart.toLowerCase().includes('hand')) {
        skinAnalysis = {
          skinType: 'Dry',
          concerns: ['Dryness', 'Rough texture', 'Fine lines'],
          recommendations: {
            skinType: 'Dry',
            concerns: ['Dryness', 'Rough texture', 'Fine lines'],
            products: [
              {
                type: 'Hand Wash',
                recommendation: 'Moisturizing hand wash with ceramides',
                ingredients: ['Ceramides', 'Glycerin', 'Aloe Vera']
              },
              {
                type: 'Hand Cream',
                recommendation: 'Rich hand cream with shea butter and ceramides',
                ingredients: ['Shea Butter', 'Ceramides', 'Glycerin', 'Vitamin E']
              },
              {
                type: 'Hand Mask',
                recommendation: 'Weekly moisturizing hand mask',
                ingredients: ['Hyaluronic Acid', 'Glycerin', 'Shea Butter']
              },
              {
                type: 'Hand Sunscreen',
                recommendation: 'SPF 30 hand cream for daily use',
                ingredients: ['Zinc Oxide', 'Titanium Dioxide', 'Vitamin E']
              }
            ],
            routine: {
              daily: [
                'Use moisturizing hand wash',
                'Apply rich hand cream multiple times throughout the day',
                'Apply SPF hand cream before going outside',
                'Use hand mask once a week before bedtime'
              ]
            },
            lifestyle: [
              'Wear gloves when washing dishes or cleaning',
              'Use lukewarm water instead of hot water',
              'Stay hydrated',
              'Consider using a humidifier in dry environments'
            ]
          }
        };
      } else {
        skinAnalysis = {
          skinType: 'Normal to Dry',
          concerns: ['Dryness', 'Uneven skin tone'],
          recommendations: {
            skinType: 'Normal to Dry',
            concerns: ['Dryness', 'Uneven skin tone'],
            products: [
              {
                type: 'Body Wash',
                recommendation: 'Moisturizing body wash with natural oils',
                ingredients: ['Coconut Oil', 'Shea Butter', 'Glycerin']
              },
              {
                type: 'Body Lotion',
                recommendation: 'Rich body lotion with ceramides',
                ingredients: ['Ceramides', 'Hyaluronic Acid', 'Glycerin']
              },
              {
                type: 'Body Sunscreen',
                recommendation: 'Broad-spectrum SPF 30+ body sunscreen',
                ingredients: ['Zinc Oxide', 'Titanium Dioxide', 'Vitamin E']
              },
              {
                type: 'Exfoliator',
                recommendation: 'Gentle chemical exfoliator with AHAs',
                ingredients: ['Glycolic Acid', 'Lactic Acid', 'Aloe Vera']
              }
            ],
            routine: {
              daily: [
                'Cleanse with moisturizing body wash',
                'Apply rich body lotion after showering',
                'Apply sunscreen to exposed areas before going outside'
              ],
              weekly: [
                'Exfoliate 1-2 times per week',
                'Use a moisturizing body mask for extra hydration'
              ]
            },
            lifestyle: [
              'Take shorter, lukewarm showers instead of hot baths',
              'Stay hydrated by drinking plenty of water',
              'Use a humidifier in dry environments',
              'Wear protective clothing in extreme weather conditions'
            ]
          }
        };
      }
      
      // Update with analysis results
      await snapshot.ref.update({
        analysis: skinAnalysis,
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    } catch (error) {
      console.error('Error processing skin analysis:', error);
      
      // Update status to error
      await admin.firestore().collection('skinAnalysis')
        .doc(context.params.analysisId)
        .update({
          status: 'error',
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      return null;
    }
  });

// Export the function
module.exports = exports;
