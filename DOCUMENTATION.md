# KisanSaathi Project Documentation
> Comprehensive system design, model implementation, and technical approach overview.

KisanSaathi is an agentic AI companion designed for Indian farmers. The application predicts localized agricultural risks, provides crop insurance advisory, scans government documents via AI vision, and generates ready-to-submit official policy applications as PDFs—all via voice in Punjabi, Hindi, and English.

---

## 1. Executive Summary

Indian agriculture represents the livelihood of over 146 million farmers. However, the farming community is highly vulnerable to climate anomalies, pest outbreaks, and financial instability. Although government crop insurance schemes like PMFBY (Pradhan Mantri Fasal Bima Yojana) exist, less than 10% of farmers in regions like Punjab are enrolled. The primary barriers are low digital literacy, language barriers (interfaces in English), complex land record parsing, and strict 72-hour filing windows for crop damage claims.

KisanSaathi addresses these issues with a zero-typing, voice-first mobile web application. By combining native Web Speech APIs with multimodal Gemini 3.1 Flash Lite models, farmers can enroll in policy plans, scan verification records, obtain localized advisory, and file claims entirely in Gurmukhi Punjabi, Devanagari Hindi, or English.

---

## 2. Technical Approach and Core Principles

The implementation is guided by three technical design principles:

### A. Zero-Typing Usability (Voice and Vision First)
To accommodate varying levels of digital literacy, typing is completely optional. Forms are populated by extracting data from images (OCR) or voice queries:
* **Identification:** Aadhaar OCR replaces manual text entry for name, ID numbers, and date of birth.
* **Land records:** Jamabandi OCR replaces text entry for district, land size, and irrigation status.
* **Commands:** Intent routing translates voice queries into actions (e.g., redirecting to enrollment pages or triggering claims filing).

### B. Offline-First State Synchronization
Rural network connectivity is notoriously unstable. To prevent application crashes or data loss during document scans:
* **Double-Cache Architecture:** The application maintains states in memory, writes them instantly to `localStorage`, and triggers background synchronization with Firebase Firestore when network connectivity is available.
* **Resilient Fallbacks:** If the remote databases are unreachable or Gemini API limits are hit, the application falls back to localized mock responders and caches, ensuring uninterrupted runtime.

### C. Zero Paid APIs
The system operates entirely on free resources to demonstrate financial viability at scale:
* **AI Model Engine:** Gemini 3.1 Flash Lite via the Google AI Studio free tier (60 RPM limits).
* **Telemetry Data:** Weather forecasts fetched via Open-Meteo (open-access, keyless).
* **Speech Engine:** Web Speech API (native browser-based engines for zero latency and cost).
* **Application Compilation:** Client-side binary compiling using jsPDF (eliminating costly backend document rendering servers).

---

## 3. Implementation Architecture

The application coordinates multiple client, service, and database components:

### A. Route Management
The frontend routes are managed via React Router Dom:
* `/` (Landing): Implements language initialization (Punjabi, Hindi, English).
* `/onboard` (Onboarding): Collects crop types, farm sizes, and location metadata.
* `/dashboard` (Dashboard): Renders meteorological charts, localized pest risks, and quick-access wizard links.
* `/enroll` (Enrollment Wizard): A 4-step camera and OCR parsing pipeline.
* `/chat` (Voice Agent): Real-time speech chat interface.
* `/claim` (Claim Filing): Vision-based crop damage diagnostics.
* `/status` (Claim Tracker): Real-time countdown tracking and status timeline.

### B. The AI and OCR Model Pipelines
The system leverages Gemini 3.1 Flash Lite to process three types of structured intelligence:

#### 1. Multimodal Document Processing (Aadhaar & Jamabandi OCR)
When a user uploads or takes a photo of a document:
* The image file is read as a binary array, encoded into a base64 string, and dispatched via HTTP POST to the Gemini endpoint.
* A zero-shot system instruction template forces the model to respond only in a raw, valid JSON schema.
* **Aadhaar Schema:** `{ name: string, aadhaarNumber: string, dob: string }`
* **Jamabandi Schema:** `{ district: string, totalAcres: number, landType: string }`
* **Name Match Cross-Validation:** The system runs a script comparing the extracted name strings. If a mismatch is detected, a warning badge is displayed to warn the user of potential database discrepancies.

#### 2. Localized Crop Risk Synthesis
* The dashboard calls the Open-Meteo API to fetch 14-day forecasts for the user's district.
* Telemetry arrays (daily maximums, precipitation indexes, wind speed) are compiled and sent to Gemini along with the farmer's crop type.
* The model analyzes the crop's threshold metrics to calculate a localized risk rating (0-100 score), outline top threats (e.g. Whitefly in cotton due to high humidity), and generate weekly sowing schedules.

#### 3. Conversational Intent Routing
* User text is parsed in parallel calls: one for conversational replies and one for intent classification.
* To prevent prompt leakage or option-matching bugs, the intent classifier isolates the raw user text from the prompt template.
* It routes the input to one of seven structured intent enums (`RISK_QUESTION`, `POLICY_QUESTION`, `CLAIM_START`, `ENROLL_REQUEST`, `FARMING_ADVICE`, `GREETING`, or `OTHER`) to trigger automatic UI transitions.

### C. Client-Side Document Compiler (PDF Builder)
Upon wizard completion, the application compiles an official crop insurance application:
* Reads local profile state variables.
* Incorporates the base64 Aadhaar and Jamabandi photo attachments.
* Renders a layout featuring filled form grids, signature areas, and submission guidelines.
* Resolves binary image embedding using the jsPDF `addImage` canvas method, downloading a ready-to-print file locally without server-side overhead.

---

## 4. Verification and Validation Results

The application's compilation and routing integrity were validated through the following procedures:
1. **Production Bundle Compilation:** Executed `npm run build` locally to verify that all modules compile cleanly with Vite, resolving dependencies (such as jsPDF and Recharts) without syntax errors or runtime conflicts.
2. **Robustness Testing under API Rate Limits:** Tested model fallbacks by simulating 429 Resource Exhausted API blocks. Verified that the isolated mock intent classifiers continue to route pages and identify languages correctly.
3. **Multi-Language Flow Verification:** Validated that selecting English, Hindi, or Punjabi on the landing page updates all text translations, voice prompts, and OCR forms.
