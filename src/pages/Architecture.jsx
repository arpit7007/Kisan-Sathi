import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, 
  Bot, 
  Code, 
  Cloud, 
  Layers, 
  ChevronRight, 
  Sparkles, 
  Database, 
  Terminal, 
  ArrowRight, 
  Volume2, 
  FileText, 
  ShieldCheck,
  Activity,
  Mic,
  Camera,
  Languages,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';

export default function Architecture() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('slide'); // 'slide' | 'flowchart' | 'mermaid'
  const [activeSlideLayer, setActiveSlideLayer] = useState('ai'); // 'ai' | 'agents' | 'backend' | 'cloud'
  const [activeFlow, setActiveFlow] = useState('all'); // 'all' | 'auth' | 'dashboard' | 'voice' | 'claim'
  const [copied, setCopied] = useState(false);

  // Technical data for slide deck
  const slideLayers = {
    ai: {
      title: "AI / Model Layer",
      subtitle: "Large Language Models & Computer Vision",
      icon: Cpu,
      badge: "Gemini 3.5 Flash",
      techs: ["gemini-3.5-flash", "Gemini Vision API", "Prompt Engineering"],
      summary: "KisanSaathi uses Google's Gemini models to perform multilingual comprehension, dialog management, and image analysis. Crucially, the system features a zero-cost API fallback system to prevent app crashes when API keys are absent.",
      bullets: [
        "Gemini 3.5 Flash: Serves as the primary natural language brain. Executes conversational replies and parses complex queries in English, Hindi, and Punjabi.",
        "Gemini 1.5 Vision: Inspects uploaded crop leaf photos to identify plant diseases (such as whitefly infestations in cotton) and evaluate severity levels.",
        "JSON Response Structuring: Prompts are engineered to force Gemini to respond in raw JSON which the client parses to display dynamic cards (e.g. weather threats, policy rankings).",
        "Deterministic Mock Fail-safes: Local dataset models simulate exact API outputs when keys are unconfigured, ensuring smooth offline or zero-cost evaluations."
      ],
      code: `// From src/services/gemini.js
export async function callGeminiVision(prompt, base64Image, mimeType = 'image/jpeg') {
  if (!API_KEY || API_KEY === 'your_free_key_from_aistudio.google.com') {
    return JSON.stringify({
      cropIdentified: "Cotton (ਕਪਾਹ)",
      damageType: "Pest attack: Whitefly (ਚਿੱਟੀ ਮੱਖੀ ਦਾ ਹਮਲਾ)",
      severity: "Severe",
      confidence: "95%",
      notes: "The uploaded image shows clear whitefly spots on cotton leaves..."
    });
  }
  // Fetch from live google generative language API
  const response = await fetch(\`https://generativelanguage.googleapis.com...\`);
}`
    },
    agents: {
      title: "Agents & Automation",
      subtitle: "Autonomous Workflows & Voice Integration",
      icon: Bot,
      badge: "Web Speech + Semantic Intents",
      techs: ["Web Speech STT / TTS", "Intent Classifier Agent", "Crop Risk Agent", "Insurance Advisory Agent"],
      summary: "Multiple specialized agents manage individual features. They translate user intentions, analyze district-level risk from weather metrics, and synthesize natural audio responses.",
      bullets: [
        "Voice Assistant Agent: Client-side Speech-to-Text and Text-to-Speech via the Web Speech API. Speaks back to the farmer in Punjabi/Hindi/English with customized rate (0.95) and pitch.",
        "Intent Classifier Agent: Intercepts raw text or audio transcripts to categorize statements into specific actions (e.g. CLAIM_START -> routes directly to filing page).",
        "Crop Risk Analyst Agent: Matches crop type, local district details, and 14-day forecasts to output regional threats and localized sowing guides.",
        "Insurance Advisor Agent: Reviews farmer profiles and generates personalized comparisons of government schemes (PMFBY, RWBCIS) vs. private policies."
      ],
      code: `// From src/pages/Chat.jsx & gemini.js
// Intent router in Voice Chat:
const reply = await callGemini(userText, INTENT_CLASSIFICATION_CONTEXT);
const intent = extractIntent(reply); // e.g. "CLAIM_START"

if (intent === 'CLAIM_START') {
  speak("ਸਮਝ ਗਿਆ, ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ ਦਰਜ ਕਰਦੇ ਹਾਂ।", language); // TTS
  navigate('/claim'); // Route automation
} else {
  const speechText = await callGemini(userText, CONVERSATIONAL_CONTEXT);
  speak(speechText, language); // TTS Response
}`
    },
    backend: {
      title: "App & Backend",
      subtitle: "Frontend Stack & Double-Caching Sync Layer",
      icon: Code,
      badge: "React 18 + Firebase + LocalStorage Fallback",
      techs: ["React 18 (Vite)", "Tailwind CSS", "Firestore", "Anonymous Auth", "Dual-Write Caching"],
      summary: "Built for accessibility and reliability in remote farming regions. It utilizes a fully integrated cloud-to-local fallback engine that caches all inputs, allowing offline execution.",
      bullets: [
        "Responsive SPA Architecture: Powered by React 18, Vite, and Tailwind CSS. The design relies on a premium, soothing agricultural color palette (farmBg, primary-green, wheat-gold).",
        "Zero-Friction Anonymous Auth: Farmers are signed in anonymously on boot, establishing a unique UID without requiring email/password or OTP during testing.",
        "Dual-Write Caching Engine: All reads and writes target cloud Firestore if connected, but mirror to localStorage. The app defaults to local caches instantly on network failure.",
        "Gurmukhi & Devanagari Font Support: Dynamically applies native Punjabi and Devanagari typography based on active context settings."
      ],
      code: `// From src/services/firebase.js
// Dual-write cache mechanism:
export async function saveClaim(uid, claimData) {
  if (useLocalDb) {
    return localDb.saveClaim(uid, claimData); // LocalStorage
  }
  try {
    const claimId = \`KS-\${Math.floor(100000 + Math.random() * 900000)}\`;
    const newClaim = { ...claimData, claimId, farmerId: uid, dateOfFiling: new Date().toISOString() };
    await setDoc(doc(db, "claims", claimId), newClaim); // Firestore
    localDb.saveToCache(uid, newClaim); // Cache duplication
    return claimId;
  } catch (error) {
    return localDb.saveClaim(uid, claimData); // Automatic fallback
  }
}`
    },
    cloud: {
      title: "Cloud & APIs",
      subtitle: "Deployment, Weather REST APIs & Cache Limits",
      icon: Cloud,
      badge: "Open-Meteo REST + Google Cloud Platforms",
      techs: ["Open-Meteo Weather API", "Firebase Hosting", "Vite Env Environment"],
      summary: "Utilizes external REST APIs for granular environmental forecasting and is configured for rapid cloud hosting.",
      bullets: [
        "Open-Meteo Integration: Pulls live 14-day forecasts (temperatures, precipitation sums, wind speeds, relative humidity) for malwa coordinates.",
        "6-Hour Caching Constraint: Prevents throttling and API rate limit locks by caching weather payloads in localStorage, updating only after 6 hours.",
        "Secure Environment Setup: Uses Vite environment variables (\`import.meta.env\`) to toggle credentials. Allows safe distribution of build configurations.",
        "Production Build Pipeline: Bundled using Vite and optimized for zero-configuration deployments on serverless hosting targets (e.g. Firebase Hosting, Vercel)."
      ],
      code: `// From src/services/weather.js
export async function getWeatherForecast(lat, lon, districtName) {
  const cacheKey = \`kisan_weather_\${districtName || \`\${lat}_\${lon}\`}\`;
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    if (Date.now() - timestamp < 6 * 60 * 60 * 1000) {
      return data; // Return cached weather (under 6h old)
    }
  }
  const res = await fetch(\`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lon}...\`);
  const data = await res.json();
  localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  return data;
}`
    }
  };

  const copyMermaidToClipboard = () => {
    const mermaidCode = `flowchart TD
    Start([Farmer Enters Website]) --> Landing[Landing Page: Landing.jsx]
    Landing --> LangChoose{Select Language}
    LangChoose -- Punjabi --> SetPa[Set Language 'pa']
    LangChoose -- Hindi --> SetHi[Set Language 'hi']
    LangChoose -- English --> SetEn[Set Language 'en']
    SetPa & SetHi & SetEn --> InitAuth[Authenticate Farmer: firebase.js]
    InitAuth --> CheckConfig{Is Firebase Configured?}
    CheckConfig -- Yes --> AuthFirebase[Firebase Anonymous Sign-In]
    CheckConfig -- No --> AuthLocal[Generate Local Mock UID & Cache]
    AuthFirebase & AuthLocal --> RegisterUID[Store UID in localStorage]
    RegisterUID --> CheckProfile{Does Profile Exist?}
    CheckProfile -- No --> Onboarding[Onboarding Page: Onboarding.jsx]
    CheckProfile -- Yes --> Dashboard[Dashboard Page: Dashboard.jsx]
    Dashboard --> LoadProfile[Fetch Profile details]
    LoadProfile --> ParallelCalls[Trigger Parallel API Requests]
    ParallelCalls --> FetchWeather[Weather Request: getWeatherForecast]
    FetchWeather --> CheckWeatherCache{Weather cached < 6h?}
    CheckWeatherCache -- Yes --> UseCachedWeather[Load cached weather]
    CheckWeatherCache -- No --> CallOpenMeteo[Fetch from Open-Meteo REST API]
    ParallelCalls --> FetchRisk[Call Risk Agent: callGemini]
    Dashboard --> ClickVoice[Navigate to Voice Agent: Chat.jsx]
    ClickVoice --> SpeechInit{STT Supported?}
    SpeechInit -- Yes --> STTConvert[Web Speech STT]
    STTConvert --> IntentAgent[Intent Classification Agent]
    IntentAgent --> ClassifyIntent{Intent Router}
    ClassifyIntent -- CLAIM_START --> RedirectClaim[Redirect to Claim Page]
    ClassifyIntent -- POLICY_QUESTION --> RedirectPolicy[Redirect to Policy Advisor]
    ClassifyIntent -- OTHER --> GenerateAIAnswer[Generate Conversational Response]
    GenerateAIAnswer --> TTSConvert[Web Speech TTS]
    Dashboard --> ClickPolicy[Navigate to Policy Advisor]
    ClickPolicy --> LoadPolicyData[Query Advisor Agent]
    LoadPolicyData --> MatchPolicyPrompt[Gemini Scheme Matcher]
    Dashboard & RedirectClaim --> ClickClaim[Navigate to Claim Filing]
    ClickClaim --> UploadPhoto[Capture Crop Leaf Image]
    UploadPhoto --> Base64Conv[Convert to Base64]
    Base64Conv --> VisionAnalysis[Vision Analysis: callGeminiVision]
    VisionAnalysis --> SubmitClaim[Save Claim]
    SubmitClaim --> SuccessScreen[Start 72-Hour Filing Countdown]`;

    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SelectedIcon = slideLayers[activeSlideLayer].icon;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-16">
      
      {/* Top Header Section */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                KisanSaathi System Architecture
              </h1>
              <p className="text-xs text-slate-400">Technical presentation deck & system interactions mapping</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-750">
            <button
              onClick={() => setActiveTab('slide')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'slide' 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🖥️ Tech Stack Slide
            </button>
            <button
              onClick={() => setActiveTab('flowchart')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'flowchart' 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📊 Interactive Flowchart
            </button>
            <button
              onClick={() => setActiveTab('mermaid')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'mermaid' 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📄 Mermaid Spec
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 mt-8">
        
        {/* TAB 1: TECH STACK SLIDE PRESENTATION */}
        {activeTab === 'slide' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 md:p-10 shadow-2xl relative overflow-hidden">
              {/* Decorative background grid */}
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-6 mb-8 gap-4">
                <div>
                  <span className="text-emerald-400 text-xs font-extrabold uppercase tracking-widest px-2.5 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    Project Blueprint
                  </span>
                  <h2 className="text-3xl font-black text-white mt-2">Technology Stack</h2>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p className="font-semibold text-slate-300">KisanSaathi (ਕਿਸਾਨ ਸਾਥੀ)</p>
                  <p>Punjab Agriculture Hackathon</p>
                </div>
              </div>

              {/* Slide Layout: Left column categories, Right column interactive inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative">
                
                {/* Left Categories List (Mirroring User Image Structure) */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Category Card: AI Layer */}
                  <button
                    onClick={() => setActiveSlideLayer('ai')}
                    className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                      activeSlideLayer === 'ai'
                        ? 'bg-slate-750 border-emerald-500 shadow-lg ring-1 ring-emerald-500/30'
                        : 'bg-slate-850 border-slate-750 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${activeSlideLayer === 'ai' ? 'bg-emerald-500/25 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-base text-white">AI / Model Layer</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${activeSlideLayer === 'ai' ? 'text-emerald-400 translate-x-1' : 'text-slate-500'}`} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">Gemini 1.5 Flash (LLM), Gemini Vision (Pests detection)</p>
                    </div>
                  </button>

                  {/* Category Card: Agents & Automation */}
                  <button
                    onClick={() => setActiveSlideLayer('agents')}
                    className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                      activeSlideLayer === 'agents'
                        ? 'bg-slate-750 border-emerald-500 shadow-lg ring-1 ring-emerald-500/30'
                        : 'bg-slate-850 border-slate-750 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${activeSlideLayer === 'agents' ? 'bg-emerald-500/25 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                      <Bot className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-base text-white">Agents & Automation</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${activeSlideLayer === 'agents' ? 'text-emerald-400 translate-x-1' : 'text-slate-500'}`} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">Web Speech STT/TTS, Intent Classification, Risk Alert Agents</p>
                    </div>
                  </button>

                  {/* Category Card: App & Backend */}
                  <button
                    onClick={() => setActiveSlideLayer('backend')}
                    className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                      activeSlideLayer === 'backend'
                        ? 'bg-slate-750 border-emerald-500 shadow-lg ring-1 ring-emerald-500/30'
                        : 'bg-slate-850 border-slate-750 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${activeSlideLayer === 'backend' ? 'bg-emerald-500/25 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                      <Code className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-base text-white">App & Backend</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${activeSlideLayer === 'backend' ? 'text-emerald-400 translate-x-1' : 'text-slate-500'}`} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">React 18, Vite, Tailwind CSS, Firestore, LocalStorage sync</p>
                    </div>
                  </button>

                  {/* Category Card: Cloud & APIs */}
                  <button
                    onClick={() => setActiveSlideLayer('cloud')}
                    className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                      activeSlideLayer === 'cloud'
                        ? 'bg-slate-750 border-emerald-500 shadow-lg ring-1 ring-emerald-500/30'
                        : 'bg-slate-850 border-slate-750 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${activeSlideLayer === 'cloud' ? 'bg-emerald-500/25 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                      <Cloud className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-base text-white">Cloud & APIs</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${activeSlideLayer === 'cloud' ? 'text-emerald-400 translate-x-1' : 'text-slate-500'}`} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">Gemini API endpoints, Open-Meteo REST Weather, Firebase hosting</p>
                    </div>
                  </button>

                </div>

                {/* Right Details Panel (Interactive Inspector) */}
                <div className="lg:col-span-7 bg-slate-850 border border-slate-750 rounded-2xl p-6 flex flex-col justify-between shadow-inner">
                  <div className="space-y-6">
                    {/* Header of Inspector */}
                    <div className="flex items-center gap-3 border-b border-slate-750 pb-4">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                        <SelectedIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-lg text-white">{slideLayers[activeSlideLayer].title}</h3>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                            {slideLayers[activeSlideLayer].badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{slideLayers[activeSlideLayer].subtitle}</p>
                      </div>
                    </div>

                    {/* Explanatory summary text */}
                    <p className="text-sm text-slate-300 leading-relaxed font-medium bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      {slideLayers[activeSlideLayer].summary}
                    </p>

                    {/* Detail bullets list */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Implementation Specs</h4>
                      <ul className="space-y-2.5">
                        {slideLayers[activeSlideLayer].bullets.map((bullet, idx) => {
                          const [bold, normal] = bullet.split(':');
                          return (
                            <li key={idx} className="text-xs flex items-start gap-2.5 leading-relaxed text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                              <span>
                                <strong className="text-white font-bold">{bold}:</strong>
                                {normal}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  {/* Live Code Reference */}
                  <div className="mt-6 border-t border-slate-750 pt-5">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-2">
                      <Terminal className="w-3.5 h-3.5" />
                      <span className="font-bold tracking-wide uppercase">Source Code Sample</span>
                    </div>
                    <pre className="text-[10px] bg-slate-900 p-4 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto font-mono max-h-48 whitespace-pre-wrap">
                      <code>{slideLayers[activeSlideLayer].code}</code>
                    </pre>
                  </div>

                </div>

              </div>

              {/* Horizontal Flowchart at the bottom of the slide */}
              <div className="mt-8 pt-8 border-t border-slate-700/80 z-10 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">System Flow: Farmer Journey</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-750 px-2 py-0.5 rounded border border-slate-700 font-semibold">
                    4-Step Execution Cycle
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                  
                  {/* Step 1 */}
                  <div className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-750 hover:border-emerald-500/30 p-4 rounded-xl transition-all flex flex-col justify-between relative min-h-[150px] group">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center justify-center">1</span>
                        <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wide">1. Setup & Cloud Sync</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Anonymous credentials on boot. Cloud-to-local fallback ensures complete database operations when offline or unconfigured.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded">Firestore</span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded">LocalStorage</span>
                    </div>
                    {/* Arrow to Step 2 */}
                    <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 hidden md:flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 z-20 shadow">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-750 hover:border-emerald-500/30 p-4 rounded-xl transition-all flex flex-col justify-between relative min-h-[150px] group">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center justify-center">2</span>
                        <Cloud className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wide">2. Weather & AI Risk</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Pulls 14-day Open-Meteo predictions using coordinates. Writes to 6-hour cache. Gemini extracts regional threat probabilities.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded">REST API</span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded">Gemini LLM</span>
                    </div>
                    {/* Arrow to Step 3 */}
                    <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 hidden md:flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 z-20 shadow">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-750 hover:border-emerald-500/30 p-4 rounded-xl transition-all flex flex-col justify-between relative min-h-[150px] group">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center justify-center">3</span>
                        <Mic className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wide">3. Voice Routing</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Browser STT/TTS in Punjabi, Hindi & English. Intent Classification Agent triggers hands-free redirect commands.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded">Web Speech</span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded">Intent Agent</span>
                    </div>
                    {/* Arrow to Step 4 */}
                    <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 hidden md:flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 z-20 shadow">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-750 hover:border-emerald-500/30 p-4 rounded-xl transition-all flex flex-col justify-between relative min-h-[150px] group">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center justify-center">4</span>
                        <Camera className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wide">4. AI Crop Vision</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Farmer uploads leaf photo. Gemini Vision detects disease/pests and severity. Auto-files claims under 72-hour window.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded">Gemini Vision</span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded">72h Tracker</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE FLOWCHART TIMELINE */}
        {activeTab === 'flowchart' && (
          <div className="animate-fadeIn space-y-6">
            
            {/* Flow selection header */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Website Interaction Flowchart
                </h3>
                <p className="text-xs text-slate-400">Filter the chart by feature to review individual agent workflows and caches</p>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap bg-slate-900 border border-slate-750 p-1 rounded-xl gap-1">
                {[
                  { id: 'all', label: 'Complete System' },
                  { id: 'auth', label: '1. Onboarding & DB Fallback' },
                  { id: 'dashboard', label: '2. Dashboard Caching' },
                  { id: 'voice', label: '3. Voice Assistant Agent' },
                  { id: 'claim', label: '4. AI Claim & Vision' }
                ].map(flow => (
                  <button
                    key={flow.id}
                    onClick={() => setActiveFlow(flow.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeFlow === flow.id
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {flow.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Flow Diagram */}
            <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 md:p-8 relative">
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>
              
              <div className="max-w-2xl mx-auto space-y-8 relative z-10">
                
                {/* FLOW SEGMENT 1: LANDING & AUTH */}
                {(activeFlow === 'all' || activeFlow === 'auth') && (
                  <div className="space-y-8 animate-fadeIn">
                    
                    {/* Node 1: Entry */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          1
                        </div>
                        <div className="w-1 flex-grow border-r-2 border-dashed border-emerald-500/50"></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Landing.jsx</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Step 1: Entry & Lang</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">Farmer Landing & Language Choice</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Farmer enters the app. The landing screen prompts for English, Hindi, or Punjabi. Selecting a language triggers the LanguageContext to update global translations.
                        </p>
                        <div className="flex gap-1.5 mt-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-300">LanguageContext</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-300">Vite React Router</span>
                        </div>
                      </div>
                    </div>

                    {/* Node 2: Anonymous Auth Check */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          2
                        </div>
                        <div className="w-1 flex-grow border-r-2 border-dashed border-emerald-500/50"></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">firebase.js</span>
                          <span className="text-[10px] font-bold text-amber-400 uppercase">Dual Sync Handshake</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">Authentication & DB Fallback Determination</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          The system triggers `authenticateFarmer`. It verifies if Firebase Credentials exist in `.env`.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          <div className="p-3 bg-emerald-950/20 border border-emerald-500/25 rounded-xl">
                            <span className="text-[10px] text-emerald-400 font-extrabold block">CASE A: Firebase Active</span>
                            <span className="text-[10px] text-slate-300">Authenticates anonymously and fetches cloud user records from Firestore collections.</span>
                          </div>
                          <div className="p-3 bg-amber-950/20 border border-amber-500/25 rounded-xl">
                            <span className="text-[10px] text-amber-400 font-extrabold block">CASE B: Config Absent / Error</span>
                            <span className="text-[10px] text-slate-300">Generates unique mock UID, triggers fail-safe and executes dual-write queries inside LocalStorage instead.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Node 3: Onboarding Validation */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          3
                        </div>
                        <div className={`w-1 flex-grow border-r-2 border-dashed ${activeFlow === 'all' ? 'border-emerald-500/50' : 'border-transparent'}`}></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Onboarding.jsx</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Step 3: Setup</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">Onboarding & Profile Generation</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          If farmer has no active profile, prompts for name, mobile, Aadhaar, select district (e.g. Mansa, Bathinda) and primary crop (e.g. Cotton). Profiles are mirrored into the local cache for lightning-fast loads.
                        </p>
                        <div className="flex gap-1.5 mt-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-300">saveFarmerProfile</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-300">kisan_profile_uid cache</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* FLOW SEGMENT 2: DASHBOARD CACHING */}
                {(activeFlow === 'all' || activeFlow === 'dashboard') && (
                  <div className="space-y-8 animate-fadeIn">
                    
                    {/* Node 4: Dashboard Entry */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          4
                        </div>
                        <div className="w-1 flex-grow border-r-2 border-dashed border-emerald-500/50"></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Dashboard.jsx</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Step 4: Active Panel</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">Dynamic Dashboard & Parallel Fetches</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          On dashboard mount, loads farmer profile data and triggers two parallel pipelines to feed the user cards: weather details and crop risks.
                        </p>
                      </div>
                    </div>

                    {/* Node 5: Weather Caching Loop */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          5
                        </div>
                        <div className="w-1 flex-grow border-r-2 border-dashed border-emerald-500/50"></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">weather.js</span>
                          <span className="text-[10px] font-bold text-orange-400 uppercase">Cache Validator</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">Open-Meteo 6-Hour Weather Caching Flow</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Fetches a 14-day forecast for the district coordinates. Reads weather cache from LocalStorage:
                        </p>
                        
                        <div className="flex flex-col gap-2 mt-3 bg-slate-900/60 p-3 rounded-xl border border-slate-750 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>Cache Valid (&lt; 6 hrs): Serve dashboard immediately from offline cache (0ms latency).</span>
                          </div>
                          <div className="flex items-center gap-2 border-t border-slate-800 pt-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span>Cache Stale (&gt; 6 hrs): Fetch Open-Meteo REST API, rewrite cache and timestamp.</span>
                          </div>
                          <div className="flex items-center gap-2 border-t border-slate-800 pt-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            <span>Offline / Failure: Fallback to old expired cache or ultimate hardcoded mock weather metrics.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Node 6: Gemini Risk Agent */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          6
                        </div>
                        <div className={`w-1 flex-grow border-r-2 border-dashed ${activeFlow === 'all' ? 'border-emerald-500/50' : 'border-transparent'}`}></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">gemini.js</span>
                          <span className="text-[10px] font-bold text-blue-400 uppercase">Crop Risk Agent</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">AI Agricultural Risk Assessment</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Sends primary crop, district, and weather to Gemini requesting a JSON output with overall risk rating, score, threats (e.g. whitefly outbreak, rust warning) and weekly advice.
                        </p>
                        <div className="flex gap-1.5 mt-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-950/30 border border-blue-500/20 text-blue-300 rounded-md">gemini-3.5-flash</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-300">JSON extraction handler</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* FLOW SEGMENT 3: VOICE CHAT AGENT */}
                {(activeFlow === 'all' || activeFlow === 'voice') && (
                  <div className="space-y-8 animate-fadeIn">
                    
                    {/* Node 7: Voice Agent Init */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          7
                        </div>
                        <div className="w-1 flex-grow border-r-2 border-dashed border-emerald-500/50"></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Chat.jsx</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Step 5: Voice chat</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">Speech Interaction & STT Translation</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Farmer starts the voice agent. Tapping the mic activates SpeechRecognition (Web Speech API) mapped to `pa-IN`, `hi-IN` or `en-IN`. Converts spoken waves into text string.
                        </p>
                        <div className="flex gap-1.5 mt-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-300">Web Speech API</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-300">Speech-to-Text (STT)</span>
                        </div>
                      </div>
                    </div>

                    {/* Node 8: Semantic Intent Classifier Router */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          8
                        </div>
                        <div className="w-1 flex-grow border-r-2 border-dashed border-emerald-500/50"></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">gemini.js</span>
                          <span className="text-[10px] font-bold text-violet-400 uppercase">Intent Router</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">Semantic Intent Classifier Routing</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Sends transcript to Gemini to classify intention. Evaluates statement against dynamic categories:
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] font-bold">
                          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-300">"crop is damaged"</span>
                            <span className="text-emerald-400">CLAIM_START</span>
                          </div>
                          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-300">"want insurance"</span>
                            <span className="text-emerald-400">POLICY_QUESTION</span>
                          </div>
                          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-300">"pest risk forecast"</span>
                            <span className="text-emerald-400">RISK_QUESTION</span>
                          </div>
                          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-300">"sowing advice"</span>
                            <span className="text-emerald-400">FARMING_ADVICE</span>
                          </div>
                        </div>
                        <p className="text-xs text-amber-300 mt-3 leading-relaxed">
                          ⚡ Auto-navigation: If intent is `CLAIM_START` or `POLICY_QUESTION`, routes farmer automatically to the respective page without requiring manual click.
                        </p>
                      </div>
                    </div>

                    {/* Node 9: Conversational reply and TTS */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          9
                        </div>
                        <div className={`w-1 flex-grow border-r-2 border-dashed ${activeFlow === 'all' ? 'border-emerald-500/50' : 'border-transparent'}`}></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">voice.js</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Response TTS</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">Text-to-Speech Vocal Synthesis</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          For informational intents, Gemini generates a conversational response matching the farmer's dialect. The Web Speech TTS engine reads it aloud so the farmer can hear the solution instantly.
                        </p>
                      </div>
                    </div>

                  </div>
                )}

                {/* FLOW SEGMENT 4: CLAIM FILING & VISION */}
                {(activeFlow === 'all' || activeFlow === 'claim') && (
                  <div className="space-y-8 animate-fadeIn">
                    
                    {/* Node 10: Image Upload & Base64 */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          10
                        </div>
                        <div className="w-1 flex-grow border-r-2 border-dashed border-emerald-500/50"></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">ClaimFiling.jsx</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Step 6: AI claims</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">Crop Leaf Image Capture & Base64 Conversion</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Farmer uploads a photo of their affected crop. The client converts the image file on-the-fly into a Base64 encoded string to prepare it for Gemini Vision's REST endpoints.
                        </p>
                      </div>
                    </div>

                    {/* Node 11: Gemini Vision Analysis */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          11
                        </div>
                        <div className="w-1 flex-grow border-r-2 border-dashed border-emerald-500/50"></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">gemini.js</span>
                          <span className="text-[10px] font-bold text-blue-400 uppercase">Vision Agent</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">Gemini Vision Multimodal Crop Inspection</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Sends Base64 crop data to Gemini Vision. The model processes the pixels to identify crop types, disease factors (e.g. whiteflies, rust spots), damage severity, and confidence metrics, returning a clean JSON string.
                        </p>
                        <div className="flex gap-1.5 mt-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-950/30 border border-blue-500/20 text-blue-300 rounded-md">callGeminiVision</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md text-slate-300">Pest classification logic</span>
                        </div>
                      </div>
                    </div>

                    {/* Node 12: Sync Database Write */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          12
                        </div>
                        <div className="w-1 flex-grow border-r-2 border-dashed border-emerald-500/50"></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">firebase.js</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Filing Finish</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">Double-Cache Synchronization Claim Submission</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          On submitting, the database driver saves the claim record with a generated ID (e.g. `KS-738921`) and timestamps:
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-750">
                          <span className="font-extrabold text-emerald-400">Save Pipeline:</span>
                          <span className="text-slate-300">Writes to Cloud Firestore database if active ➡️ duplicates write to kisan_claims_uid in LocalStorage.</span>
                        </div>
                      </div>
                    </div>

                    {/* Node 13: 72h Countdown Tracking */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center border-4 border-slate-850 shadow-md">
                          13
                        </div>
                        <div className="w-1 h-8 border-r-2 border-dashed border-emerald-500/50"></div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">ClaimTracker.jsx</span>
                          <span className="text-[10px] font-bold text-rose-400 uppercase">Critical deadline</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white mt-2">72-Hour Claim Deadline Countdown</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          The filing success screen initiates a client-side ticking countdown for 72 hours. This represents the regulatory window within which farmers must file physical/digital evidence post damage event.
                        </p>
                      </div>
                    </div>

                  </div>
                )}

                {/* End Terminus */}
                <div className="flex justify-center pt-4">
                  <div className="bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2 rounded-full uppercase tracking-wider shadow-md">
                    End System pipeline
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        )}

        {/* TAB 3: MERMAID SPECIFICATIONS */}
        {activeTab === 'mermaid' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 md:p-8">
              <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
                <div>
                  <h3 className="font-extrabold text-base text-white">Mermaid.js Flowchart Source Code</h3>
                  <p className="text-xs text-slate-400">Copy this specification to render it in GitHub Markdown or external Mermaid visualization editors</p>
                </div>
                <button
                  onClick={copyMermaidToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Spec'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-[11px] text-slate-300 font-mono overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed select-all">
                <code>{`flowchart TD
    Start([Farmer Enters Website]) --> Landing[Landing Page: Landing.jsx]
    Landing --> LangChoose{Select Language}
    LangChoose -- Punjabi --> SetPa[Set Language 'pa']
    LangChoose -- Hindi --> SetHi[Set Language 'hi']
    LangChoose -- English --> SetEn[Set Language 'en']
    
    SetPa & SetHi & SetEn --> InitAuth[Authenticate Farmer: firebase.js]
    InitAuth --> CheckConfig{Is Firebase Configured?}
    CheckConfig -- Yes --> AuthFirebase[Firebase Anonymous Sign-In]
    CheckConfig -- No --> AuthLocal[Generate Local Mock UID & Cache]
    
    AuthFirebase & AuthLocal --> RegisterUID[Store UID in localStorage]
    RegisterUID --> CheckProfile{Does Profile Exist?}
    CheckProfile -- No --> Onboarding[Onboarding Page: Onboarding.jsx]
    CheckProfile -- Yes --> Dashboard[Dashboard Page: Dashboard.jsx]
    
    Onboarding --> InputProfile[Enter Name, Aadhaar, District, Crop]
    InputProfile --> SaveProfile[Save Profile]
    SaveProfile --> Dashboard
    
    Dashboard --> LoadProfile[Fetch Profile details]
    LoadProfile --> ParallelCalls[Trigger Parallel API Requests]
    
    ParallelCalls --> FetchWeather[Weather Request]
    FetchWeather --> CheckWeatherCache{Weather cached < 6h?}
    CheckWeatherCache -- Yes --> UseCachedWeather[Load cached weather]
    CheckWeatherCache -- No --> CallOpenMeteo[Fetch from Open-Meteo REST API]
    
    ParallelCalls --> FetchRisk[Call Risk Agent]
    
    Dashboard --> ClickVoice[Navigate to Voice Agent: Chat.jsx]
    ClickVoice --> SpeechInit{STT Supported?}
    SpeechInit -- Yes --> STTConvert[Web Speech STT]
    STTConvert --> IntentAgent[Intent Classification Agent]
    IntentAgent --> ClassifyIntent{Intent Router}
    
    ClassifyIntent -- CLAIM_START --> RedirectClaim[Redirect to Claim Page]
    ClassifyIntent -- POLICY_QUESTION --> RedirectPolicy[Redirect to Policy Advisor]
    ClassifyIntent -- OTHER --> GenerateAIAnswer[Generate Response]
    GenerateAIAnswer --> TTSConvert[Web Speech TTS]
    
    Dashboard --> ClickPolicy[Navigate to Policy Advisor]
    ClickPolicy --> LoadPolicyData[Query Advisor Agent]
    
    Dashboard & RedirectClaim --> ClickClaim[Navigate to Claim Filing]
    ClickClaim --> UploadPhoto[Capture Crop Leaf Image]
    UploadPhoto --> Base64Conv[Convert to Base64]
    Base64Conv --> VisionAnalysis[Vision Analysis: callGeminiVision]
    VisionAnalysis --> SubmitClaim[Save Claim]
    SubmitClaim --> SuccessScreen[Start 72-Hour Filing Countdown]`}</code>
              </pre>
            </div>

            {/* Folder Structure mapping */}
            <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 md:p-8">
              <h3 className="font-extrabold text-base text-white border-b border-slate-700 pb-4 mb-4">Architecture Directory Mapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-300">
                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-400">Pages (`src/pages/`)</h4>
                  <ul className="space-y-1.5 font-mono">
                    <li>📂 <span className="text-white">Landing.jsx</span>: Portal entry & language hooks</li>
                    <li>📂 <span className="text-white">Onboarding.jsx</span>: Anonymous database bootstrap</li>
                    <li>📂 <span className="text-white">Dashboard.jsx</span>: Caches weather & queries AI risks</li>
                    <li>📂 <span className="text-white">Chat.jsx</span>: Runs vocal agent conversational dialogs</li>
                    <li>📂 <span className="text-white">PolicyAdvisor.jsx</span>: Matches schemes to crop specifications</li>
                    <li>📂 <span className="text-white">ClaimFiling.jsx</span>: Converts leaf pixels to base64, runs Vision</li>
                    <li>📂 <span className="text-white">ClaimTracker.jsx</span>: Tracks deadlines & payout progress bars</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-400">Services & Context (`src/services/` & `src/context/`)</h4>
                  <ul className="space-y-1.5 font-mono">
                    <li>📂 <span className="text-white">firebase.js</span>: Database operations with localStorage dual-write sync</li>
                    <li>📂 <span className="text-white">gemini.js</span>: Multi-lingual LLM prompts & Vision API handler</li>
                    <li>📂 <span className="text-white">voice.js</span>: Audio capture & text-to-speech speaker synthesis</li>
                    <li>📂 <span className="text-white">weather.js</span>: Coordinates API calls & 6-hour caching timestamp</li>
                    <li>📂 <span className="text-white">LanguageContext.jsx</span>: Stores state dictionaries for pa/hi/en</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer bar */}
      <footer className="max-w-7xl mx-auto w-full px-6 mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>© 2026 KisanSaathi Inc. Made for Punjab Hackathon. All rights reserved.</span>
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-emerald-400 font-bold hover:underline"
        >
          Return to Dashboard →
        </button>
      </footer>

    </div>
  );
}
