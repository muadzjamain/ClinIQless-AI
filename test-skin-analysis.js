// Test script for skin analysis functionality
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { analyzeSkin } = require('./server/services/ai');

async function testSkinAnalysis() {
  try {
    console.log('Testing skin analysis with Gemini AI...');
    
    // Path to a test image (replace with an actual image path)
    const imagePath = path.join(__dirname, 'test-skin-image.jpg');
    
    // Check if the test image exists
    if (!fs.existsSync(imagePath)) {
      console.error('Test image not found. Please place a test image named "test-skin-image.jpg" in the project root.');
      return;
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    console.log('Analyzing skin image...');
    const result = await analyzeSkin(imageBuffer, 'image/jpeg');
    
    console.log('\nSkin Analysis Results:');
    console.log('====================');
    console.log(`Overall Score: ${result.overallScore}`);
    console.log(`Skin Age: ${result.skinAge}`);
    console.log(`Skin Type: ${result.skinType.type} (${result.skinType.score})`);
    console.log(`Description: ${result.skinType.description}`);
    
    console.log('\nSkin Conditions:');
    result.conditions.forEach(condition => {
      console.log(`- ${condition.name}: ${condition.severity} (${condition.probability}% probability)`);
    });
    
    console.log('\nSkin Metrics:');
    Object.entries(result.metrics).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });
    
    console.log('\nRecommendations:');
    if (result.recommendations) {
      console.log(`Morning Routine: ${result.recommendations.morningRoutine.join(', ')}`);
      console.log(`Evening Routine: ${result.recommendations.eveningRoutine.join(', ')}`);
      console.log(`Weekly Treatments: ${result.recommendations.weeklyTreatments.join(', ')}`);
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing skin analysis:', error);
  }
}

// Run the test
testSkinAnalysis();
