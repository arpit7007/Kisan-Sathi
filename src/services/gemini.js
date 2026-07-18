// Gemini Service with Fallback for Demo
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Mock responses for smooth demonstration without API keys
const getMockResponse = (prompt) => {
  const lowercasePrompt = prompt.toLowerCase();
  
  // 1. Check for Intent Classification
  if (lowercasePrompt.includes("classify this message intent as one of")) {
    if (lowercasePrompt.includes("spots") || lowercasePrompt.includes("daag") || lowercasePrompt.includes("damage") || lowercasePrompt.includes("nuksan") || lowercasePrompt.includes("ਖਰਾਬ") || lowercasePrompt.includes("ਨੁਕਸਾਨ")) {
      return "CLAIM_START";
    }
    if (lowercasePrompt.includes("insurance") || lowercasePrompt.includes("policy") || lowercasePrompt.includes("bima") || lowercasePrompt.includes("ਬੀਮਾ")) {
      return "POLICY_QUESTION";
    }
    if (lowercasePrompt.includes("weather") || lowercasePrompt.includes("risk") || lowercasePrompt.includes("pest") || lowercasePrompt.includes("ਖਤਰਾ")) {
      return "RISK_QUESTION";
    }
    if (lowercasePrompt.includes("sow") || lowercasePrompt.includes("farming") || lowercasePrompt.includes("kheti") || lowercasePrompt.includes("ਖੇਤੀ")) {
      return "FARMING_ADVICE";
    }
    if (lowercasePrompt.includes("hello") || lowercasePrompt.includes("hi") || lowercasePrompt.includes("sat sri") || lowercasePrompt.includes("namaste")) {
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
      summary: lowercasePrompt.includes("lang=pa") 
        ? "ਮਾਨਸਾ ਵਿੱਚ ਕਪਾਹ ਦੀ ਫਸਲ ਲਈ ਚਿੱਟੀ ਮੱਖੀ ਦਾ ਖਤਰਾ ਬਹੁਤ ਜਿਆਦਾ (82/100) ਹੈ। ਤੁਰੰਤ ਦੇਖਭਾਲ ਦੀ ਲੋੜ ਹੈ।" 
        : (lowercasePrompt.includes("lang=hi")
          ? "मानसा में कपास की फसल के लिए सफेद मक्खी का खतरा बहुत अधिक (82/100) है। तत्काल देखभाल की आवश्यकता है।"
          : "High risk (82/100) detected for Cotton in Mansa due to whitefly infestation warnings. Urgent action is advised.")
    });
  }

  // 3. Check for Insurance recommendation JSON
  if (lowercasePrompt.includes("which of these 4 insurance options is best")) {
    const isCotton = lowercasePrompt.includes("cotton");
    const isPa = lowercasePrompt.includes("language=pa") || lowercasePrompt.includes("lang=pa");
    const isHi = lowercasePrompt.includes("language=hi") || lowercasePrompt.includes("lang=hi");

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
  // Punjabi Responses
  if (lowercasePrompt.includes("cotton") || lowercasePrompt.includes("spots") || lowercasePrompt.includes("daag") || lowercasePrompt.includes("ਮੇਰੀ ਕਪਾਹ") || lowercasePrompt.includes("ਦਾਗ")) {
    return "ਮੈਂ ਸਮਝ ਸਕਦਾ ਹਾਂ, ਤੁਹਾਡੀ ਕਪਾਹ ਦੀ ਫਸਲ 'ਤੇ ਦਾਗ ਲੱਗ ਗਏ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਨੁਕਸਾਨ ਦੀ ਫੋਟੋ ਅੱਪਲੋਡ ਕਰੋ ਤਾਂ ਜੋ ਮੈਂ ਜਾਂਚ ਕਰ ਸਕਾਂ। ਕੀ ਇਹ ਚਿੱਟੀ ਮੱਖੀ ਦਾ ਹਮਲਾ ਹੈ? ਅਸੀਂ ਦਾਅਵਾ 72 ਘੰਟਿਆਂ ਦੇ ਅੰਦਰ ਦਰਜ ਕਰ ਸਕਦੇ ਹਾਂ।";
  }
  if (lowercasePrompt.includes("bima") || lowercasePrompt.includes("insurance") || lowercasePrompt.includes("ਬੀਮਾ")) {
    return "ਤੁਹਾਡੇ ਲਈ ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਫਸਲ ਬੀਮਾ ਯੋਜਨਾ (PMFBY) ਅਤੇ RWBCIS ਸਭ ਤੋਂ ਵਧੀਆ ਵਿਕਲਪ ਹਨ। ਕੀ ਤੁਸੀਂ ਚਾਹੁੰਦੇ ਹੋ ਕਿ ਮੈਂ ਤੁਹਾਡੀ ਯੋਗਤਾ ਦੀ ਜਾਂਚ ਕਰਾਂ?";
  }
  
  // Fallback Conversational Response
  return "ਮੈਂ ਕਿਸਾਨਸਾਥੀ ਹਾਂ, ਤੁਹਾਡਾ ਡਿਜੀਟਲ ਮਿੱਤਰ। ਮੈਂ ਫਸਲ ਦੇ ਜੋਖਮ, ਬੀਮਾ ਅਤੇ ਨੁਕਸਾਨ ਦੇ ਦਾਅਵੇ ਭਰਨ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਤੁਸੀਂ ਕੁਝ ਵੀ ਪੁੱਛ ਸਕਦੇ ਹੋ।";
};

// Main API call function
export async function callGemini(prompt, systemContext = '') {
  if (!API_KEY || API_KEY === 'your_free_key_from_aistudio.google.com') {
    // Return mock data after simulated delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return getMockResponse(prompt + "\n" + systemContext);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`,
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
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error("Gemini API Error, using mock fallback:", error);
    return getMockResponse(prompt + "\n" + systemContext);
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`,
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
