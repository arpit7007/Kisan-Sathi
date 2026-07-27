const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.1-flash-lite';

// Utility to reliably extract JSON from Gemini text responses
export function extractJSON(text) {
  if (!text) return null;
  // Try to find anything between ```json and ```
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonBlockRegex);
  let content = match ? match[1] : text;
  
  // If we still don't have a clean JSON structure, let's find the first '{' and last '}'
  const startIdx = content.indexOf('{');
  const endIdx = content.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    content = content.substring(startIdx, endIdx + 1);
  }
  return content.trim();
}


// Mock responses for smooth demonstration without API keys
const getMockResponse = (prompt, systemContext = '') => {
  const lowercasePrompt = prompt.toLowerCase();
  
  // Extract user text to avoid matching intent options or system rules
  let userTextOnly = prompt;
  const messageMarker = 'message: "';
  const markerIdx = lowercasePrompt.indexOf(messageMarker);
  if (markerIdx !== -1) {
    userTextOnly = prompt.substring(markerIdx + messageMarker.length);
    if (userTextOnly.endsWith('"')) {
      userTextOnly = userTextOnly.substring(0, userTextOnly.length - 1);
    }
  }
  const lowercaseUserText = userTextOnly.toLowerCase();

  // 1. Check for Intent Classification
  if (lowercasePrompt.includes("classify this message intent as one of")) {
    if (lowercaseUserText.includes("spots") || lowercaseUserText.includes("daag") || lowercaseUserText.includes("damage") || lowercaseUserText.includes("nuksan") || lowercaseUserText.includes("ਖਰਾਬ") || lowercaseUserText.includes("ਨੁਕਸਾਨ")) {
      return "CLAIM_START";
    }
    if (lowercaseUserText.includes("enroll") || lowercaseUserText.includes("apply") || lowercaseUserText.includes("register") || lowercaseUserText.includes("ਲਾਗੂ") || lowercaseUserText.includes("ਰਜਿਸਟਰ") || lowercaseUserText.includes("ਪੰਜੀਕਰਨ") || lowercaseUserText.includes("नामांकन") || lowercaseUserText.includes("पंजीकृत")) {
      return "ENROLL_REQUEST";
    }
    if (lowercaseUserText.includes("insurance") || lowercaseUserText.includes("policy") || lowercaseUserText.includes("bima") || lowercaseUserText.includes("ਬੀਮਾ")) {
      return "POLICY_QUESTION";
    }
    if (lowercaseUserText.includes("weather") || lowercaseUserText.includes("risk") || lowercaseUserText.includes("pest") || lowercaseUserText.includes("ਖਤਰਾ")) {
      return "RISK_QUESTION";
    }
    if (lowercaseUserText.includes("sow") || lowercaseUserText.includes("farming") || lowercaseUserText.includes("kheti") || lowercaseUserText.includes("ਖੇਤੀ")) {
      return "FARMING_ADVICE";
    }
    if (lowercaseUserText.includes("hello") || lowercaseUserText.includes("hi") || lowercaseUserText.includes("sat sri") || lowercaseUserText.includes("namaste")) {
      return "GREETING";
    }
    return "OTHER";
  }

  // 2. Check for Crop Risk JSON Generation
  if (lowercasePrompt.includes("agricultural risk analyst") && lowercasePrompt.includes("respond only in json format")) {
    const isMansa = lowercasePrompt.includes("mansa") || lowercasePrompt.includes("bathinda") || lowercasePrompt.includes("muktsar");
    const isCotton = lowercasePrompt.includes("cotton");
    
    return JSON.stringify({
      overallRisk: isCotton ? 'high' : 'medium',
      riskScore: isCotton ? 82 : 45,
      topThreats: isCotton ? [
        { threat: 'Whitefly Infestation (ਚਿੱਟੀ ਮੱਖੀ ਦਾ ਹਮਲਾ)', probability: '85%', description: 'Critical warning. Whitefly levels have crossed ET levels in Malwa cotton belt due to humidity.' },
        { threat: 'Groundwater Stress (ਪਾਣੀ ਦੀ ਕਮੀ)', probability: '70%', description: 'Mansa ground water levels are critical. Plan micro-irrigation immediately.' },
        { threat: 'Pink Bollworm (ਗੁਲਾਬੀ ਸੁੰਡੀ)', probability: '40%', description: 'Moderate risk. Inspect early buds.' }
      ] : [
        { threat: 'Yellow Rust Warning (ਪੀਲੀ ਕੁੰਗੀ)', probability: '35%', description: 'Normal risk. Inspect wheat leaves for yellow powder.' },
        { threat: 'Groundwater Scarcity', probability: '50%', description: 'Normal water planning advised.' }
      ],
      weeklyAlerts: [
        { week: 'Week 1', alert: isCotton ? 'Spray Neem Oil or recommended bio-pesticide if whitefly count > 6 per leaf.' : 'Keep fields well drained.' },
        { week: 'Week 2', alert: 'Irrigate only during early morning hours to prevent leaf curl.' }
      ],
      sowingAdvice: isCotton ? 'Do not delay weeding. Spraying triazophos 40EC is recommended if whitefly severity exceeds threshold.' : 'Sowing schedule is optimal. Soil moisture levels are favorable.',
      summary: (lowercasePrompt.includes("lang=pa") || lowercasePrompt.includes("code=pa") || lowercasePrompt.includes("language=pa")) 
        ? "ਮਾਨਸਾ ਵਿੱਚ ਕਪਾਹ ਦੀ ਫਸਲ ਲਈ ਚਿੱਟੀ ਮੱਖੀ ਦਾ ਖਤਰਾ ਬਹੁਤ ਜਿਆਦਾ (82/100) ਹੈ। ਤੁਰੰਤ ਦੇਖਭਾਲ ਦੀ ਲੋੜ ਹੈ।" 
        : ((lowercasePrompt.includes("lang=hi") || lowercasePrompt.includes("code=hi") || lowercasePrompt.includes("language=hi"))
          ? "मानसा में कपास की फसल के लिए सफेद मक्खी का खतरा बहुत अधिक (82/100) है। तत्काल देखभाल की आवश्यकता है।"
          : "High risk (82/100) detected for Cotton in Mansa due to whitefly infestation warnings. Urgent action is advised.")
    });
  }

  // 3. Check for Insurance recommendation JSON
  if (lowercasePrompt.includes("which of these 4 insurance options is best")) {
    const isCotton = lowercasePrompt.includes("cotton");
    const isPa = lowercasePrompt.includes("language=pa") || lowercasePrompt.includes("lang=pa") || lowercasePrompt.includes("code=pa");
    const isHi = lowercasePrompt.includes("language=hi") || lowercasePrompt.includes("lang=hi") || lowercasePrompt.includes("code=hi");

    return JSON.stringify({
      recommended: isCotton ? 'RWBCIS' : 'PMFBY',
      reason: isCotton
        ? (isPa ? "ਕਪਾਹ ਲਈ RWBCIS ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ ਕਿਉਂਕਿ ਇਹ ਮੌਸਮ ਅਤੇ ਕੀੜਿਆਂ ਦੇ ਨੁਕਸਾਨ ਦਾ ਤੇਜ਼ੀ ਨਾਲ ਭੁਗਤਾਨ ਕਰਦਾ ਹੈ।" : isHi ? "कपास के लिए RWBCIS सबसे अच्छा है क्योंकि यह मौसम और कीटों के नुकसान का तेजी से भुगतान करता है।" : "RWBCIS is best for Cotton in Mansa due to quick payouts on weather parameter deviations and insect threats.")
        : (isPa ? "ਕਣਕ/ਝੋਨੇ ਲਈ PMFBY ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ ਕਿਉਂਕਿ ਇਹ ਬਿਜਾਈ ਤੋਂ ਲੈ ਕੇ ਕਟਾਈ ਤੱਕ ਪੂਰੀ ਸੁਰੱਖਿਆ ਦਿੰਦਾ ਹੈ।" : isHi ? "गेहूं/धान के लिए PMFBY सबसे अच्छा है क्योंकि यह बुवाई से लेकर कटाई तक पूरी सुरक्षा देता है।" : "PMFBY is recommended as it provides comprehensive yield protection from sowing to post-harvest."),
      estimatedPremium: isCotton ? "₹960 (2% premium rate)" : "₹720 (1.5% premium rate)",
      estimatedCoverage: isCotton ? "₹48,000 (₹12,000 per acre)" : "₹48,000 (₹12,000 per acre)"
    });
  }

  // 4. Default Conversational Agent responses (Voice Assistant)
  const isPunjabi = lowercaseUserText.includes("punjabi") || lowercaseUserText.includes("ਗੁਰਮੁਖੀ") || /[\u0A00-\u0A7F]/.test(lowercaseUserText) || systemContext.includes("speak in Punjabi");
  const isHindi = lowercaseUserText.includes("hindi") || /[\u0900-\u097F]/.test(lowercaseUserText) || systemContext.includes("speak in Hindi");

  if (lowercaseUserText.includes("enroll") || lowercaseUserText.includes("apply") || lowercaseUserText.includes("register") || lowercaseUserText.includes("ਲਾਗੂ") || lowercaseUserText.includes("ਪੰਜੀਕਰਨ") || lowercaseUserText.includes("नामांकन") || lowercaseUserText.includes("पंजीकृत")) {
    if (isPunjabi) {
      return "ਬਹੁਤ ਵਧੀਆ! ਆਓ ਤੁਹਾਡੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਕਰੀਏ। ਤੁਰੰਤ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਹੇਠਾਂ ਦਿੱਤੇ ਬਟਨ 'ਤੇ ਟੈਪ ਕਰੋ।";
    }
    if (isHindi) {
      return "बहुत बढ़िया! आइए आपका नामांकन करें। त्वरित नामांकन शुरू करने के लिए नीचे दिए गए बटन पर टैप करें।";
    }
    return "Great! Let's get you enrolled. Tap the Start Enrollment button below and I will guide you through the quick enrollment wizard.";
  }

  if (lowercaseUserText.includes("cotton") || lowercaseUserText.includes("spots") || lowercaseUserText.includes("daag") || lowercaseUserText.includes("ਮੇਰੀ ਕਪਾਹ") || lowercaseUserText.includes("ਦਾਗ") || lowercaseUserText.includes("कपास") || lowercaseUserText.includes("धब्बे")) {
    if (isPunjabi) {
      return "ਮੈਂ ਸਮਝ ਸਕਦਾ ਹਾਂ, ਤੁਹਾਡੀ ਕਪਾਹ ਦੀ ਫਸਲ 'ਤੇ ਦਾਗ ਲੱਗ ਗਏ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਨੁਕਸਾਨ ਦੀ ਫੋਟੋ ਅੱਪਲੋਡ ਕਰੋ ਤਾਂ ਜੋ ਮੈਂ ਜਾਂਚ ਕਰ ਸਕਾਂ। ਕੀ ਇਹ ਚਿੱਟੀ ਮੱਖੀ ਦਾ ਹਮਲਾ ਹੈ? ਅਸੀਂ ਦਾਅਵਾ 72 ਘੰਟਿਆਂ ਦੇ ਅੰਦਰ ਦਰਜ ਕਰ ਸਕਦੇ ਹਾਂ।";
    }
    if (isHindi) {
      return "मैं समझ सकता हूँ, आपकी कपास की फसल पर धब्बे लग गए हैं। कृपया नुकसान की फोटो अपलोड करें ताकि मैं जांच कर सकूं। क्या यह सफेद मक्खी का हमला है? हम 72 घंटों के भीतर दावा दर्ज कर सकते हैं।";
    }
    return "I understand your cotton crop has spots. Please upload a photo of the damage so I can analyze it. If it is a whitefly infestation, we can file a claim within 72 hours.";
  }

  if (lowercaseUserText.includes("bima") || lowercaseUserText.includes("insurance") || lowercaseUserText.includes("ਬੀਮਾ") || lowercaseUserText.includes("बीमा")) {
    if (isPunjabi) {
      return "ਤੁਹਾਡੇ ਲਈ ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਫਸਲ ਬੀਮਾ ਯੋਜਨਾ (PMFBY) ਅਤੇ RWBCIS ਸਭ ਤੋਂ ਵਧੀਆ ਵਿਕਲਪ ਹਨ। ਕੀ ਤੁਸੀਂ ਚਾਹੁੰਦੇ ਹੋ ਕਿ ਮੈਂ ਤੁਹਾਡੀ ਯੋਗਤਾ ਦੀ ਜਾਂਚ ਕਰਾਂ?";
    }
    if (isHindi) {
      return "आपके लिए प्रधानमंत्री फसल बीमा योजना (PMFBY) और RWBCIS सबसे अच्छे विकल्प हैं। क्या आप चाहते हैं कि मैं आपकी पात्रता की जांच करूं?";
    }
    return "The best options for you are PMFBY and RWBCIS. Would you like me to check your eligibility?";
  }

  // Fallback Conversational Response
  if (isPunjabi) {
    return "ਮੈਂ ਕਿਸਾਨਸਾਥੀ ਹਾਂ, ਤੁਹਾਡਾ ਡਿਜੀਟਲ ਮਿੱਤਰ। ਮੈਂ ਫਸਲ ਦੇ ਜੋਖਮ, ਬੀਮਾ ਅਤੇ ਨੁਕਸਾਨ ਦੇ ਦਾਅਵੇ ਭਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਤੁਸੀਂ ਕੁਝ ਵੀ ਪੁੱਛ ਸਕਦੇ ਹੋ।";
  }
  if (isHindi) {
    return "मैं किसानसाथी हूँ, आपका डिजिटल मित्र। मैं फसल के जोखिम, बीमा और नुकसान के दावे भरने में आपकी मदद कर सकता हूँ। आप कुछ भी पूछ सकते हैं।";
  }
  return "I am KisanSaathi, your digital companion. I can help you with crop risks, insurance recommendation, and filing damage claims. Ask me anything.";
};

// Main API call function
export async function callGemini(prompt, systemContext = '') {
  if (!API_KEY || API_KEY === 'your_free_key_from_aistudio.google.com') {
    // Return mock data after simulated delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return getMockResponse(prompt, systemContext);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: systemContext 
            ? { parts: [{ text: systemContext }] } 
            : undefined,
          generationConfig: { 
            temperature: 0.4,
            maxOutputTokens: 1024 
          }
        })
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.warn("Gemini API returned empty text or error data, running mock response:", data);
      return getMockResponse(prompt, systemContext);
    }
    return text;
  } catch (error) {
    console.error("Gemini API Error, using mock fallback:", error);
    return getMockResponse(prompt, systemContext);
  }
}

// Vision (Image analysis) API call function
export async function callGeminiVision(prompt, base64Image, mimeType = 'image/jpeg') {
  if (!API_KEY || API_KEY === 'your_free_key_from_aistudio.google.com') {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return JSON.stringify({
      cropIdentified: "Cotton (ਕਪਾਹ)",
      damageType: "Pest attack: Whitefly (ਚਿੱਟੀ ਮੱਖੀ ਦਾ ਹਮਲਾ)",
      severity: "Severe",
      confidence: "95%",
      notes: "The uploaded image shows clear whitefly spots on cotton leaves. Recommend filing under RWBCIS weather/pest guidelines immediately."
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Image } }
            ]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
        })
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error("Gemini Vision API Error, using mock fallback:", error);
    return JSON.stringify({
      cropIdentified: "Cotton (ਕਪਾਹ)",
      damageType: "Pest attack: Whitefly (ਚਿੱਟੀ ਮੱਖੀ)",
      severity: "Severe",
      confidence: "90%",
      notes: "Simulated crop analysis: Cotton with Whitefly infestation detected. Please review."
    });
  }
}
