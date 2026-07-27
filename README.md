# KisanSaathi (ਕਿਸਾਨ ਸਾਥੀ | किसान साथी)
> Technical documentation and system architecture for the KisanSaathi agricultural AI companion.

KisanSaathi is an agentic AI companion designed for Indian farmers. It predicts localized agricultural risks, provides personalized crop insurance advisory, scans government documents via AI vision, and generates ready-to-submit official policy applications as PDFs—all via voice in Punjabi, Hindi, and English.

Designed mobile-first with zero paid APIs (running entirely on free tiers), it serves as a digital bridge to protect India's 146 million farmers from devastating crop losses.

---

## Live Demo and Production Builds

* **Live Demo URL:**[https://kisan-sathi.web.app](https://kisan-sathi-xi.vercel.app/)
* **GitHub Repository:** [https://github.com/arpit7007/Kisan-Sathi](https://github.com/arpit7007/Kisan-Sathi)
* **Video Demonstration:** [Link to Demonstration Video]

---

## System Architecture

The following diagram illustrates the high-level system architecture of the KisanSaathi application, showing how the client-side React UI interacts with the free API tiers, database services, browser-native APIs, and generative AI models:

![App Screenshot](src/assets/screenshot1.png)


---

## AI Architecture and Model Execution Pipelines

KisanSaathi coordinates multiple lightweight, free-tier models and browser APIs to execute complex agricultural intelligence tasks. Below is the detailed orchestration flow of user queries, base64 image data streams, and intent routing:

```mermaid
graph TD
    subgraph Client Application Layer
        UserSpeech[User Speech Input] -->|Web Speech STT| UserText[Raw English/Hindi/Punjabi Text]
        Docs[Aadhaar / Jamabandi Scans] -->|Base64 Conversion| ImageStream[Base64 Image Streams]
    end

    subgraph Orchestration Router
        UserText -->|Low-Temp Intent Call| IntentClassifier[Gemini 3.1 Flash Lite Intent Classifier]
        IntentClassifier -->|Classified Intent| Router{Routing Logic}
    end

    subgraph Service Handlers
        Router -->|ENROLL_REQUEST| EnrollService[Enrollment Wizard Process]
        Router -->|CLAIM_START| ClaimService[AI Crop Doctor Vision Analysis]
        Router -->|RISK_QUESTION| RiskService[Open-Meteo Weather Analytics]
        Router -->|OTHER / GREETING| ConversationalService[Gemini Chat Response]
    end

    subgraph AI Processing Engine
        EnrollService & ClaimService -->|Image + Structured Prompt| GeminiVision[Gemini 3.1 Flash Lite Vision Model]
        RiskService -->|Telemetry + Profile Prompt| GeminiText[Gemini 3.1 Flash Lite Text Model]
        ConversationalService -->|System Prompt Context| GeminiText
    end

    subgraph Document Compilation
        GeminiVision -->|Structured OCR JSON| LocalState[React Application State]
        LocalState -->|jsPDF Generator| PDFFile[Signed PDF Application Document]
    end
```
##  Comprehensive System Flowchart

The diagram below details the entire application structure, including initialization, multi-lingual navigation, offline caching, and the AI agent loop.

```mermaid
flowchart TD
    %% Base Styles
    classDef startClass fill:#16a34a,stroke:#14532d,stroke-width:2px,color:#fff;
    classDef pageClass fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef serviceClass fill:#fef08a,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef aiClass fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e40af;
    classDef cacheClass fill:#ffedd5,stroke:#ea580c,stroke-width:2px,color:#7c2d12;
    classDef offlineClass fill:#f3f4f6,stroke:#4b5563,stroke-width:2px,color:#1f2937;

    %% Entry Points
    Start([Farmer Enters Website]) --> Landing[Landing Page: Landing.jsx]:::pageClass
    Landing --> LangChoose{Select Language}
    LangChoose -- Punjabi --> SetPa[Set Language 'pa']
    LangChoose -- Hindi --> SetHi[Set Language 'hi']
    LangChoose -- English --> SetEn[Set Language 'en']
    
    SetPa & SetHi & SetEn --> InitAuth[Authenticate Farmer: firebase.js]:::serviceClass

    %% Auth & Cache Flow
    InitAuth --> CheckConfig{Is Firebase Configured?}
    CheckConfig -- Yes --> AuthFirebase[Firebase Anonymous Sign-In]:::serviceClass
    CheckConfig -- No --> AuthLocal[Generate Local Mock UID & Cache]:::cacheClass
    
    AuthFirebase & AuthLocal --> RegisterUID[Store UID in localStorage: kisan_current_uid]:::cacheClass
    RegisterUID --> CheckProfile{Does Profile Exist?}
    
    CheckProfile -- No --> Onboarding[Onboarding Page: Onboarding.jsx]:::pageClass
    CheckProfile -- Yes --> Dashboard[Dashboard Page: Dashboard.jsx]:::pageClass
    
    %% Onboarding Input
    Onboarding --> InputProfile[Enter Name, Aadhaar, District, Primary Crop, Land Size]
    InputProfile --> SaveProfile[Save Profile: saveFarmerProfile]:::serviceClass
    SaveProfile --> SaveDB{Firebase Configured?}
    SaveDB -- Yes --> WriteFirestore[Write to Firestore 'farmers' Collection]:::serviceClass
    SaveDB -- No --> WriteLocalCache[Write to localStorage: kisan_profile_uid]:::cacheClass
    WriteFirestore & WriteLocalCache --> Dashboard
    
    %% Dashboard Flow
    Dashboard --> LoadProfile[Fetch Profile details]:::serviceClass
    LoadProfile --> ParallelCalls[Trigger Parallel API Requests]
    
    %% Weather Cache Flow
    ParallelCalls --> FetchWeather[Weather Request: getWeatherForecast]:::serviceClass
    FetchWeather --> CheckWeatherCache{Weather cached & < 6 hours old?}
    CheckWeatherCache -- Yes --> UseCachedWeather[Load cached weather data]:::cacheClass
    CheckWeatherCache -- No --> CallOpenMeteo[Fetch from Open-Meteo REST API]:::serviceClass
    CallOpenMeteo --> SaveWeatherCache[Cache weather with Timestamp]:::cacheClass
    UseCachedWeather & SaveWeatherCache --> RenderWeatherCard[Render 14-day Weather Dashboard]
    
    %% Risk Agent Flow
    ParallelCalls --> FetchRisk[Call Risk Agent: callGemini]:::aiClass
    FetchRisk --> SendRiskPrompt[Prompt: Analysing crop risk for crop + district + weather]
    SendRiskPrompt --> RunRiskAI{Is Gemini API Key Present?}
    RunRiskAI -- Yes --> CallGeminiRisk[Fetch live Gemini JSON Response]:::aiClass
    RunRiskAI -- No --> RunMockRisk[Load Localised Punjab/Malwa Mock Threats]:::cacheClass
    CallGeminiRisk & RunMockRisk --> ExtractRiskJSON[Extract JSON & Parse Structure]:::serviceClass
    ExtractRiskJSON --> RenderRiskPanel[Display Risk Level, Score, Top Threats & Sowing Advice]

    %% Voice Assistant Agent Flow
    Dashboard --> ClickVoice[Navigate to Voice Agent: Chat.jsx]:::pageClass
    ClickVoice --> SpeechInit{Browser supports Web Speech API?}
    SpeechInit -- Yes --> ListenUser[Active Listening: startListening]:::serviceClass
    SpeechInit -- No --> ManualTextInput[Enable Standard Text Input Chat]
    
    ListenUser --> SpeakWords[Farmer Speaks in pa/hi/en]
    SpeakWords --> STTConvert[Web Speech STT: Convert Speech to Text]:::serviceClass
    STTConvert --> IntentAgent[Intent Classification Agent: callGemini]:::aiClass
    IntentAgent --> ClassifyIntent{Determine Farmer Intent}
    
    ClassifyIntent -- CLAIM_START --> RedirectClaim[Redirect to Claim Filing Page]
    ClassifyIntent -- POLICY_QUESTION --> RedirectPolicy[Redirect to Policy Advisor Page]
    ClassifyIntent -- RISK_QUESTION | FARMING_ADVICE | GREETING --> GenerateAIAnswer[Generate Conversational Response]:::aiClass
    ClassifyIntent -- OTHER --> GenerateAIAnswer
    
    GenerateAIAnswer --> TTSConvert[Web Speech TTS: Speak Response Out Loud]:::serviceClass
    TTSConvert --> UpdateChatWindow[Append to Conversation Bubble UI]
    
    %% Policy Recommendation Flow
    Dashboard --> ClickPolicy[Navigate to Policy Advisor: PolicyAdvisor.jsx]:::pageClass
    ClickPolicy --> LoadPolicyData[Query Advisor Agent: callGemini]:::aiClass
    LoadPolicyData --> MatchPolicyPrompt[Match Crop & District against PMFBY, RWBCIS, UPIS, Kshema]
    MatchPolicyPrompt --> RunPolicyAI{Is Gemini API Key Present?}
    RunPolicyAI -- Yes --> CallGeminiPolicy[Fetch Recommended Policy JSON]:::aiClass
    RunPolicyAI -- No --> FallbackPolicy[Return Mock Recommendation: RWBCIS for Cotton / PMFBY for Wheat]:::cacheClass
    CallGeminiPolicy & FallbackPolicy --> RenderRecommendation[Display Recommended Policy Card, Reason, Premium & Coverage]
    RenderRecommendation --> EnrollAction[Farmer Clicks Enroll]
    EnrollAction --> SaveEnrollment[Update Profile enrolledPolicy field]:::serviceClass
    SaveEnrollment --> SyncProfileDB{Firebase Configured?}
    SyncProfileDB -- Yes --> FirestoreUpdate[Update Firestore Document]:::serviceClass
    SyncProfileDB -- No --> LocalUpdate[Update localStorage: kisan_profile_uid]:::cacheClass
    FirestoreUpdate & LocalUpdate --> UpdateNavbarName[Navbar Profile Indicator Updates]
    
    %% Claim Filing & Vision Flow
    Dashboard & RedirectClaim --> ClickClaim[Navigate to Claim Filing: ClaimFiling.jsx]:::pageClass
    ClickClaim --> ClaimStep1[Step 1: Enter Crop Damage details & Date]
    ClaimStep1 --> CapturePhoto[Upload/Capture Crop Leaf Image]
    CapturePhoto --> Base64Conv[Convert Image to Base64 String]:::serviceClass
    
    Base64Conv --> ClaimStep2[Step 2: Vision Analysis: callGeminiVision]:::aiClass
    ClaimStep2 --> VisionKeyCheck{Is Gemini API Key Present?}
    VisionKeyCheck -- Yes --> CallGeminiVisionAPI[Send Base64 + Prompts to Gemini Vision]:::aiClass
    VisionKeyCheck -- No --> VisionMockFallback[Return Pest: Whitefly, Severity: Severe, Conf: 95%]:::cacheClass
    CallGeminiVisionAPI & VisionMockFallback --> RenderVisionResult[Display Analysis: Identified Crop, Damage Type, Severity, AI Notes]
    
    RenderVisionResult --> ClaimStep3[Step 3: Auto-fill bank, Aadhaar, select policy]
    ClaimStep3 --> SubmitClaim[Submit Claim: saveClaim]:::serviceClass
    SubmitClaim --> DBClaimSync{Firebase Configured?}
    DBClaimSync -- Yes --> WriteFirestoreClaim[Save to claims Collection + Cache locally]:::serviceClass
    DBClaimSync -- No --> WriteLocalClaim[Save to localStorage: kisan_claims_uid]:::cacheClass
    
    WriteFirestoreClaim & WriteLocalClaim --> ClaimSuccess[Filing Success Screen]
    ClaimSuccess --> LaunchCountdown[Start 72-Hour Claim Filing Deadline Countdown]:::serviceClass
    
    %% Claim Status Tracker Flow
    Dashboard & RedirectPolicy --> ClickTracker[Navigate to Claim Tracker: ClaimTracker.jsx]:::pageClass
    ClickTracker --> FetchClaimsList[Load Claims: getClaims]:::serviceClass
    FetchClaimsList --> DBCClaimsSync{Firebase Configured?}
    DBCClaimsSync -- Yes --> FetchFirestoreClaims[Get from Firestore & Cache locally]:::serviceClass
    DBCClaimsSync -- No --> FetchLocalClaims[Get from localStorage: kisan_claims_uid]:::cacheClass
    
    FetchFirestoreClaims & FetchLocalClaims --> RenderClaimList[Render List of Active Claims]
    RenderClaimList --> ClickClaimDetail[View Selected Claim Detail Timeline]
    ClickClaimDetail --> DisplayTimeline[Timeline Status Steps: Filed -> Under Review -> Approved -> Disbursed]
    DisplayTimeline --> ClaimActionStatus[Display Countdown Timer or Disbursement Progress]
```

### 1. Zero-Typing Enrollment Pipeline
* **Step 1: Aadhaar OCR Analysis:** The user takes or uploads a photo of their Aadhaar card. The binary image is converted to a base64-encoded string and dispatched to Gemini 3.1 Flash Lite via the REST vision API. The model executes zero-shot OCR extraction, returning structured JSON containing `name`, `aadhaarNumber`, and `dob`.
* **Step 2: Jamabandi (official land revenue document that tracks property ownership, cultivation, and rights) Land Record OCR Analysis:** The user uploads their land record document. Gemini Vision extracts the `district`, `totalAcres`, and `landType` (irrigated or rainfed).
* **Step 3: Name Mismatch Cross-Validation:** To prevent fraud and application rejections, the application state controller executes a name-matching script comparing the extracted name from Aadhaar with the name on the Jamabandi record. If a difference is detected, a warning badge is rendered, alerting the farmer of the discrepancy prior to submission.
* **Step 4: Algorithmic Policy Recommendation:** A structured request containing the farmer's crop profiles and current district weather forecasts is sent to Gemini. It evaluates risk parameters (such as drought indices or pest warnings) to recommend either the yield-based PMFBY (Pradhan Mantri Fasal Bima Yojana) or the weather-based RWBCIS (Restructured Weather Based Crop Insurance Scheme).
* **Step 5: Client-Side PDF Generation:** The compiled data, including metadata and base64 document attachments, is parsed by the jsPDF engine. It compiles a two-page official application format, integrates signature spaces, embeds the scanned document images, and downloads the PDF directly onto the device.

### 2. Conversational Intent Routing and User Input Isolation
To guarantee robust operations when utilizing free-tier fallbacks, the system employs an input isolation routing strategy:
* The raw user query is separated from the larger instructions template using a distinct parsing marker.
* The system evaluates the raw text parameters to classify the query into one of seven enums: `RISK_QUESTION`, `POLICY_QUESTION`, `CLAIM_START`, `ENROLL_REQUEST`, `FARMING_ADVICE`, `GREETING`, or `OTHER`.
* This isolation prevents the AI model from matching options in the system prompt instructions, eliminating false-positive routing bugs.

### 3. Generative Agricultural Risk Synthesis
The risk scoring system updates dynamically using real-time meteorology:
* The system queries the Open-Meteo API for 14-day forecasts matching the coordinates of the farmer's district.
* It transmits a structured telemetry array (temperature trends, precipitation totals, humidity thresholds) to Gemini along with the farmer's crop type.
* The model analyzes the crop's threshold metrics (e.g. humidity bounds for cotton pests like Whitefly) to calculate a localized risk rating (0-100 score), outline top threats, and generate weekly sowing schedules.

---

## Data Management and Sync Architecture

KisanSaathi combines client-side caching with cloud synchronization to support offline-first operations in rural areas where network access may be unstable:

```mermaid
graph LR
    LocalUI[React App State] -->|Double-Cache Sync| LocalCache[(Browser LocalStorage)]
    LocalCache -->|Background Sync| Firestore[(Firebase Firestore DB)]
    Firestore -->|Data Restoration| LocalCache
```

* **Local Storage Caching:** All onboarded farmer profiles and filed claims are cached instantly in the browser's LocalStorage.
* **Firestore Sync Layer:** When internet connectivity is active, data syncs automatically with Firestore using Firebase Spark anonymous authentication.
* **Graceful Degradation:** If cloud transactions fail or API limits are hit, the application falls back to local data and local mock models, ensuring uninterrupted service.

---

## Core Tech Stack

| Technology | Role | Tier & Pricing |
| :--- | :--- | :--- |
| **Vite + React 18** | Frontend Application Framework | Open-Source |
| **TailwindCSS** | Clean, Modern UI & Mobile Layouts | Open-Source |
| **Gemini 3.1 Flash Lite** | OCR, Intent Classification, Risk Assessment | Free Tier (60 RPM / 1500 daily requests) |
| **Web Speech API** | Punjabi & Hindi Speech-to-Text / Text-to-Speech | Free (Native Browser Engines) |
| **jsPDF** | Image embedding & filled application downloads | Open-Source |
| **Firebase Spark** | Firestore Database & Anonymous Auth | Free Tier (1GB DB size, 50k reads/day) |
| **Open-Meteo API** | 14-day weather forecasts | Free (No API Key Required) |

---

## Project Structure and Route Organization

* [App.jsx](file:///c:/Users/mailt/OneDrive/Desktop/KISAN%20SATHI/src/App.jsx): Registers application routes:
  * `/` : Landing portal with language preferences.
  * `/onboard` : Wizard onboarding profile (Name, District, Crops).
  * `/dashboard` : Core panel showcasing the Risk circular gauge, weather charts, and active claims.
  * `/enroll` : 4-step OCR scan wizard and PDF generator.
  * `/chat` : Voice agent conversation dashboard.
  * `/claim` : Crop damage assessment & filing page.
  * `/status` : Claim progress and countdown tracking screen.
* [gemini.js](file:///c:/Users/mailt/OneDrive/Desktop/KISAN%20SATHI/src/services/gemini.js): Houses Google Gemini AI integration.
* [pdf.js](file:///c:/Users/mailt/OneDrive/Desktop/KISAN%20SATHI/src/services/pdf.js): Controls PDF document structuring and image encoding.
* [firebase.js](file:///c:/Users/mailt/OneDrive/Desktop/KISAN%20SATHI/src/services/firebase.js): Handles database transactions.
* [voice.js](file:///c:/Users/mailt/OneDrive/Desktop/KISAN%20SATHI/src/services/voice.js): Orchestrates speech-to-text listener and text-to-speech outputs.

---

## How to Run Locally

### 1. Set Up Environment Variables
Create a `.env` file in the root directory and add the following keys:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` to run the application.

---

## Step-by-Step Judge Demonstration Script

To evaluate the application's capabilities, follow this verification workflow:
1. **Language Initialization:** Click "Start in Punjabi" on the Landing Page.
2. **Farmer Profiling:** On the onboarding screen, enter a name, choose **Mansa** district, choose **Cotton** crop, and select **No** for crop insurance.
3. **Risk Scoring Review:** Observe the circular **Risk Score Gauge** on the Dashboard. Cotton in Mansa will trigger a high threat level due to humidity and Whitefly pest warnings.
4. **Initiate Wizard:** Tap **Get Insurance** under Quick Actions.
5. **Document Scanner Execution:**
   - **Step 1 (Scan Aadhaar):** Upload a mock Aadhaar photo. Confirm the extracted name and DOB.
   - **Step 2 (Scan Land Record):** Upload a mock land record sheet. Check the extracted district and acreage details.
6. **Policy Recommendation:** On Step 3, listen to the voice companion recommend **RWBCIS** due to Mansa's high-humidity pest thresholds. Confirm and click Next.
7. **PDF Validation:** Click **Download Application PDF** on Step 4. Inspect the downloaded document containing your details and both scanned images.
8. **Claim Filing:** Navigate to **File a Claim**. Upload a crop damage photo to see Gemini analyze pest damage severity. Submit and review the 72-hour countdown timer in the active tracking list.
