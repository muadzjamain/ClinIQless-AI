# ClinIQless AI: Holistic Health Companion

ClinIQless AI is a comprehensive digital health companion that leverages artificial intelligence and multimodal capabilities to empower users in managing their well-being, from chronic disease risk assessment to personalized skincare recommendations.

## Project Overview

**Core Vision:** To provide an intelligent, user-friendly platform for proactive health management, early disease detection, and personalized well-being advice.

**Target Languages:** Malay, English

**Key Technologies:**
- Google Cloud Platform (Vertex AI, Cloud Storage, Speech-to-Text, Cloud Functions)
- Firebase (Firestore, Authentication)
- Gemini API
- React.js
- Node.js

## Features

### 1. Voice-based Diabetes Risk Prediction
Analyze short voice samples to predict the likelihood of diabetes or blood sugar irregularities using machine learning.

### 2. Personal Health Tracker Dashboard
A comprehensive dashboard for tracking health metrics, visualizing test results, logging readings, setting goals, and receiving alerts.

### 3. Doctor Advice Reliability Tracker
Track and evaluate the reliability and consistency of medical advice received from healthcare providers.

### 4. User & Doctor Conversation Recording & Summarization
Record, transcribe, and summarize doctor conversations, providing key points and "doctor tips."

### 5. Health Chatbot (Multilingual)
A reliable chatbot answering questions about diabetes in both Malay and English.

### 6. AI-Powered Skin Type Analysis & Skincare Recommendation
Analyze facial images to detect skin type and provide personalized skincare recommendations.

## SDG Alignment

This project aligns with multiple Sustainable Development Goals:
- **SDG 3:** Good Health and Well-being
- **SDG 9:** Industry, Innovation and Infrastructure

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Firebase account
- Google Cloud Platform account with enabled APIs

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/cliniqless-ai.git
cd cliniqless-ai
```

2. Install dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Set up environment variables
```bash
# Copy example env files
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env
```

4. Start development servers
```bash
# Start frontend
cd client
npm start

# Start backend
cd ../server
npm run dev
```

## Deployment

The application is configured for deployment on Firebase Hosting (frontend) and Google Cloud Run (backend).

```bash
# Deploy frontend
cd client
npm run build
firebase deploy --only hosting

# Deploy backend
cd ../server
gcloud run deploy
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
