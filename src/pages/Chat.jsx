import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getFarmerProfile, saveFarmerProfile } from '../services/firebase';
import { callGemini } from '../services/gemini';
import { startListening, stopListening, speak, stopSpeaking, isVoiceSupported } from '../services/voice';
import { Mic, MicOff, Send, HelpCircle, AlertCircle, Tractor, ArrowLeft } from 'lucide-react';

export default function Chat() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      text: language === 'pa' 
        ? "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਕਿਸਾਨਸਾਥੀ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਫਸਲ ਦੇ ਜੋਖਮ, ਬੀਮਾ ਅਤੇ ਨੁਕਸਾਨ ਦੇ ਦਾਅਵੇ ਭਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਤੁਸੀਂ ਕੁਝ ਵੀ ਪੁੱਛ ਸਕਦੇ ਹੋ।"
        : (language === 'hi'
          ? "नमस्ते! मैं किसानसाथी हूँ। मैं आपकी फसल के जोखिम, बीमा और दावे फाइल करने में सहायता कर सकता हूँ। आप कुछ भी पूछ सकते हैं।"
          : "Hello! I am KisanSaathi. I can help you with crop risk, insurance policies, and filing damage claims. Ask me anything!"),
      intent: 'GREETING',
      timestamp: Date.now()
    }
  ]);

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(true);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat feed
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, liveTranscript]);

  useEffect(() => {
    setVoiceAvailable(isVoiceSupported());

    // Load profile
    const uid = localStorage.getItem('kisan_current_uid');
    if (uid) {
      getFarmerProfile(uid).then(prof => {
        if (prof) setProfile(prof);
      });
    }

    // Process initial follow-up query if routed from Dashboard/Claims
    if (location.state?.query) {
      handleSendText(location.state.query);
      // Clear state so it doesn't trigger again on reload
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Clean up synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, []);

  const handleSendText = async (textToSend) => {
    if (!textToSend.trim()) return;
    
    // Add user message
    const userMsg = {
      sender: 'user',
      text: textToSend,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLiveTranscript('');
    
    await getAgentResponse(textToSend);
  };

  const getAgentResponse = async (userText) => {
    setIsProcessing(true);
    stopSpeaking();

    // Check for static policy apply request
    const lowercaseText = userText.toLowerCase();
    const isApplyPolicyRequest = lowercaseText.includes("apply") || 
                                 lowercaseText.includes("enroll") || 
                                 lowercaseText.includes("register") || 
                                 lowercaseText.includes("bima") ||
                                 lowercaseText.includes("ਲਾਗੂ") || 
                                 lowercaseText.includes("ਬੀਮਾ");

    if (isApplyPolicyRequest) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const primaryCrop = profile?.primaryCrop || 'Cotton';
      const policyToEnroll = primaryCrop === 'Cotton' ? 'RWBCIS' : 'PMFBY';
      
      const uid = localStorage.getItem('kisan_current_uid');
      if (uid && profile) {
        const updatedProfile = { 
          ...profile, 
          hasInsurance: 'Yes', 
          enrolledPolicy: policyToEnroll 
        };
        await saveFarmerProfile(uid, updatedProfile);
        setProfile(updatedProfile);
      }
      
      let responseText = `Done! I have successfully enrolled you in the recommended ${policyToEnroll} policy for your ${primaryCrop} crop. Your profile has been updated!`;
      if (language === 'pa') {
        responseText = `ਜੀ ਬਿਲਕੁਲ! ਮੈਂ ਤੁਹਾਡੀ ${primaryCrop === 'Cotton' ? 'ਕਪਾਹ' : 'ਕਣਕ'} ਦੀ ਫਸਲ ਲਈ ${policyToEnroll} ਬੀਮਾ ਯੋਜਨਾ ਵਿੱਚ ਤੁਹਾਨੂੰ ਸਫਲਤਾਪੂਰਵਕ ਦਰਜ ਕਰ ਦਿੱਤਾ ਹੈ। ਹੁਣ ਤੁਹਾਡਾ ਪ੍ਰੋਫਾਈਲ ਅੱਪਡੇਟ ਹੋ ਗਿਆ ਹੈ!`;
      } else if (language === 'hi') {
        responseText = `जी बिल्कुल! मैंने आपकी ${primaryCrop === 'Cotton' ? 'कपास' : 'गेहूं'} की फसल के लिए आपको ${policyToEnroll} बीमा योजना में पंजीकृत कर दिया है। आपका प्रोफ़ाइल अपडेट हो गया है!`;
      }
      
      const agentMsg = {
        sender: 'agent',
        text: responseText,
        intent: 'POLICY_ENROLLED',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, agentMsg]);
      setIsProcessing(false);
      speak(responseText, language);
      return;
    }

    // Prepare farmer context for Gemini
    const farmerName = profile?.name || 'Farmer';
    const district = profile?.district || 'Punjab';
    const primaryCrop = profile?.primaryCrop || 'Cotton';
    const secondaryCrop = profile?.secondaryCrop || 'None';
    const acres = profile?.landSize || '0';
    const insuranceStatus = profile?.hasInsurance || 'Not Sure';
    const riskScore = '82'; // Mock or fetched from localStorage
    const topThreats = 'Whitefly Pest Outbreak';

    const systemPrompt = `You are KisanSaathi, a helpful farming assistant for Punjab farmers. 
You speak in ${language === 'pa' ? 'Punjabi (Gurmukhi script)' : language === 'hi' ? 'Hindi' : 'English'} based on user preference.

Farmer profile:
- Name: ${farmerName}
- District: ${district}  
- Crop: ${primaryCrop}, ${secondaryCrop}
- Land: ${acres} acres
- Insurance status: ${insuranceStatus}
- Current risk score: ${riskScore}/100
- Top threats: ${topThreats}

You can help with:
1. Explaining crop risks and what to watch for
2. Recommending insurance policies (explain PMFBY, RWBCIS, WBCIS simply)
3. Guiding through claim filing step by step
4. Answering questions about government schemes
5. Giving farming advice for their specific crop and district

Rules:
- Always respond in the farmer's language (Punjabi, Hindi, or English)
- Use simple words, no jargon
- Be warm, like a helpful neighbor
- When farmer describes crop damage, ask: What crop? What damage? How many acres affected? When did it happen?
- After collecting damage info, say you will file the claim and summarize what you collected
- Always remind about the 72-hour window for claims
- Keep responses under 3 sentences for voice
- If farmer says 'enroll' or 'insurance', respond: 'Great! Let's get you enrolled. Tap the button below to start the quick 60-second enrollment wizard!'`;

    // Intent classifier call
    const intentPrompt = `Classify this message intent as one of: 
RISK_QUESTION | POLICY_QUESTION | CLAIM_START | ENROLL_REQUEST | FARMING_ADVICE | GREETING | OTHER
Respond with just the intent string.

Message: "${userText}"`;

    try {
      // Execute text generation and intent classification in parallel
      const [agentReply, intentReply] = await Promise.all([
        callGemini(userText, systemPrompt),
        callGemini(intentPrompt, "Respond only with the classification string.")
      ]);

      const rawIntent = intentReply.toUpperCase();
      const validIntents = [
        'RISK_QUESTION',
        'POLICY_QUESTION',
        'CLAIM_START',
        'ENROLL_REQUEST',
        'FARMING_ADVICE',
        'GREETING',
        'OTHER'
      ];
      const cleanedIntent = validIntents.find(intent => rawIntent.includes(intent)) || 'OTHER';

      // Add agent reply
      const agentMsg = {
        sender: 'agent',
        text: agentReply,
        intent: cleanedIntent,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, agentMsg]);
      setIsProcessing(false);

      // Speak response
      speak(agentReply, language);

      // Auto-routing if intent is CLAIM_START or ENROLL_REQUEST!
      if (cleanedIntent === 'CLAIM_START') {
        setTimeout(() => {
          navigate('/claim');
        }, 2200);
      } else if (cleanedIntent === 'ENROLL_REQUEST') {
        setTimeout(() => {
          navigate('/enroll');
        }, 2200);
      }
    } catch (e) {
      console.error("Gemini call error in chat, using offline conversational agent simulator:", e);
      setIsProcessing(false);
      
      const lowercaseText = userText.toLowerCase();
      let responseText = "ਮੈਂ ਕਿਸਾਨਸਾਥੀ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਫਸਲ ਦੇ ਜੋਖਮ, ਬੀਮਾ ਅਤੇ ਨੁਕਸਾਨ ਦੇ ਦਾਅਵੇ ਭਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਤੁਸੀਂ ਕੁਝ ਵੀ ਪੁੱਛ ਸਕਦੇ ਹੋ।";
      let matchedIntent = 'OTHER';
      
      if (language === 'en') {
        responseText = "I am KisanSaathi. I can assist you with your crop risk, policy comparisons, and damage claims. Ask me anything!";
        if (lowercaseText.includes("damage") || lowercaseText.includes("claim") || lowercaseText.includes("spots") || lowercaseText === "yes" || lowercaseText.includes("file") || lowercaseText === "ok" || lowercaseText === "okay") {
          responseText = "I detected crop damage details. Let's start filing a claim. Redirecting you to the claim filing page now...";
          matchedIntent = 'CLAIM_START';
        } else if (lowercaseText.includes("enroll") || lowercaseText.includes("apply") || lowercaseText.includes("register")) {
          responseText = "Great! Tap the Start Enrollment button below and I will guide you through the quick enrollment wizard.";
          matchedIntent = 'ENROLL_REQUEST';
        } else if (lowercaseText.includes("insurance") || lowercaseText.includes("policy")) {
          responseText = "For Cotton in Mansa, I recommend the RWBCIS weather policy due to its fast 45-day payouts for temperature/pest hazards.";
          matchedIntent = 'POLICY_QUESTION';
        } else if (lowercaseText.includes("weather") || lowercaseText.includes("risk")) {
          responseText = "High risk detected for Cotton in Mansa due to whitefly infestation. Sowing is otherwise optimal.";
          matchedIntent = 'RISK_QUESTION';
        }
      } else if (language === 'hi') {
        responseText = "मैं किसानसाथी हूँ। मैं आपकी फसल के जोखिम, बीमा और दावे फाइल करने में सहायता कर सकता हूँ।";
        if (lowercaseText.includes("nuksan") || lowercaseText.includes("claim") || lowercaseText.includes("daag") || lowercaseText === "yes" || lowercaseText === "हां" || lowercaseText === "जी" || lowercaseText.includes("फाइल")) {
          responseText = "मैंने फसल के नुकसान की पहचान की है। आइए आपका बीमा दावा दर्ज करें। आपको दावा फाइलिंग पृष्ठ पर स्थानांतरित किया जा रहा है...";
          matchedIntent = 'CLAIM_START';
        } else if (lowercaseText.includes("enroll") || lowercaseText.includes("apply") || lowercaseText.includes("bima") || lowercaseText.includes("insurance") || lowercaseText.includes("पंजीकृत")) {
          responseText = "बहुत बढ़िया! त्वरित नामांकन शुरू करने के लिए नीचे दिए गए बटन पर टैप करें।";
          matchedIntent = 'ENROLL_REQUEST';
        } else if (lowercaseText.includes("policy")) {
          responseText = "आपके लिए पीएमएफबीवाई (PMFBY) या आरडब्ल्यूबीसीआईएस सबसे अच्छा विकल्प है। क्या मैं योग्यता की जांच करूं?";
          matchedIntent = 'POLICY_QUESTION';
        }
      } else { // pa
        if (lowercaseText.includes("ਨੁਕਸਾਨ") || lowercaseText.includes("ਦਾਅਵਾ") || lowercaseText.includes("ਦਾਗ") || lowercaseText.includes("nuksan") || lowercaseText === "yes" || lowercaseText === "ਹਾਂ" || lowercaseText === "ਜੀ" || lowercaseText.includes("ਫਾਈਲ")) {
          responseText = "ਮੈਂ ਸਮਝ ਸਕਦਾ ਹਾਂ, ਤੁਹਾਡੀ ਫਸਲ ਦਾ ਨੁਕਸਾਨ ਹੋਇਆ ਹੈ। ਆਓ ਦਾਅਵਾ ਦਰਜ ਕਰੀਏ। ਤੁਹਾਨੂੰ ਦਾਅਵਾ ਦਾਇਰ ਕਰਨ ਵਾਲੇ ਪੰਨੇ 'ਤੇ ਭੇਜਿਆ ਜਾ ਰਿਹਾ ਹੈ...";
          matchedIntent = 'CLAIM_START';
        } else if (lowercaseText.includes("ਰਜਿਸਟ੍ਰੇਸ਼ਨ") || lowercaseText.includes("ਲਾਗੂ") || lowercaseText.includes("ਬੀਮਾ") || lowercaseText.includes("enroll") || lowercaseText.includes("insurance")) {
          responseText = "ਬਹੁਤ ਵਧੀਆ! ਤੁਰੰਤ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਹੇਠਾਂ ਦਿੱਤੇ ਬਟਨ 'ਤੇ ਟੈਪ ਕਰੋ।";
          matchedIntent = 'ENROLL_REQUEST';
        } else if (lowercaseText.includes("policy")) {
          responseText = "ਤੁਹਾਡੇ ਲਈ ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਫਸਲ ਬੀਮਾ ਯੋਜਨਾ (PMFBY) ਅਤੇ RWBCIS ਸਭ ਤੋਂ ਵਧੀਆ ਵਿਕਲਪ ਹਨ। ਕੀ ਤੁਸੀਂ ਚਾਹੁੰਦੇ ਹੋ ਕਿ ਮੈਂ ਤੁਹਾਡੀ ਯੋਗਤਾ ਦੀ ਜਾਂਚ ਕਰਾਂ?";
          matchedIntent = 'POLICY_QUESTION';
        }
      }
      
      const staticMsg = {
        sender: 'agent',
        text: responseText,
        intent: matchedIntent,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, staticMsg]);
      speak(responseText, language);

      // Auto-navigate to appropriate page (offline mode)
      if (matchedIntent === 'CLAIM_START') {
        setTimeout(() => {
          navigate('/claim');
        }, 2200);
      } else if (matchedIntent === 'ENROLL_REQUEST') {
        setTimeout(() => {
          navigate('/enroll');
        }, 2200);
      }
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      setLiveTranscript('');
      const success = startListening(
        language,
        (transcript, isFinal) => {
          setLiveTranscript(transcript);
          if (isFinal) {
            setIsListening(false);
            handleSendText(transcript);
          }
        },
        (error) => {
          console.error("Mic error:", error);
          setIsListening(false);
        }
      );
      if (!success) {
        setIsListening(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] md:h-[calc(100vh-64px)] bg-farmBg">
      {/* Top Banner Bar */}
      <div className="bg-white border-b border-green-100 py-2.5 px-4 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')} className="p-1 rounded-lg hover:bg-gray-100 md:hidden">
            <ArrowLeft className="w-5 h-5 text-textPrimary" />
          </button>
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Tractor className="w-4 h-4 text-primary-green" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-textPrimary">{t('voiceAgent')}</h2>
            <span className="text-[10px] text-green-600 font-bold block leading-none">Powered by Gemini 3.5</span>
          </div>
        </div>
        
        {profile && (
          <span className="text-xs font-bold text-textPrimary bg-wheat/10 border border-wheat-gold/20 px-2.5 py-1 rounded-full">
            👤 {profile.name}
          </span>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[85%] sm:max-w-md rounded-3xl p-4 shadow-xs text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-br from-green-600 to-green-700 text-white rounded-br-none'
                  : 'bg-white text-textPrimary border border-green-50 rounded-bl-none'
              }`}
            >
              {msg.text}
              
              {/* Intent-based Contextual Actions */}
              {msg.sender === 'agent' && msg.intent === 'CLAIM_START' && (
                <div className="mt-3 pt-3 border-t border-green-100 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Suggested Action</span>
                  <button
                    onClick={() => navigate('/claim')}
                    className="w-full py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 text-center"
                  >
                    {t('startClaimButton')}
                  </button>
                </div>
              )}
              {msg.sender === 'agent' && msg.intent === 'POLICY_QUESTION' && (
                <div className="mt-3 pt-3 border-t border-green-100 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Suggested Action</span>
                  <button
                    onClick={() => navigate('/policy')}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 text-center"
                  >
                    {t('seePoliciesButton')}
                  </button>
                </div>
              )}
              {msg.sender === 'agent' && msg.intent === 'ENROLL_REQUEST' && (
                <div className="mt-3 pt-3 border-t border-green-100 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Suggested Action</span>
                  <button
                    onClick={() => navigate('/enroll')}
                    className="w-full py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 text-center"
                  >
                    Start Enrollment 📋
                  </button>
                </div>
              )}
              {msg.sender === 'agent' && msg.intent === 'POLICY_ENROLLED' && (
                <div className="mt-3 pt-3 border-t border-green-100/50 flex items-center gap-2 text-green-700">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <span className="text-[11px] font-extrabold tracking-wide">
                    Policy Enrolled Successfully in Profile!
                  </span>
                </div>
              )}
            </div>
            <span className="text-[9px] text-gray-400 mt-1 px-2">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {/* Live Speaking Transcript */}
        {isListening && liveTranscript && (
          <div className="flex flex-col items-end">
            <div className="max-w-[85%] rounded-3xl p-4 bg-green-50 text-textPrimary rounded-br-none italic border border-green-200">
              {liveTranscript}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span> Live Speech Input
            </span>
          </div>
        )}
        {/* Processing Spinner */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-textSecondary text-xs font-semibold pl-2">
            <div className="w-4 h-4 border-2 border-primary-green border-t-transparent rounded-full animate-spin"></div>
            <span>{t('processing')}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Controls Bar */}
      <div className="bg-white border-t border-green-50 p-4 shrink-0 pb-20 md:pb-4 flex flex-col items-center gap-3">
        {/* Voice Warning if not supported */}
        {!voiceAvailable && (
          <div className="text-[11px] text-red-600 bg-red-50 px-3 py-1 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{t('voiceSupportError')}</span>
          </div>
        )}

        <div className="w-full max-w-md flex items-center gap-3">
          {/* Big Mic Button */}
          {voiceAvailable && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={handleMicToggle}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                  isListening 
                    ? 'bg-red-600 text-white mic-active-pulse' 
                    : 'bg-primary-green text-white hover:bg-green-700'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            </div>
          )}

          {/* Typing Input Fallback */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendText(inputValue);
            }} 
            className="flex-1 flex bg-gray-50 border border-green-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-primary-green focus-within:bg-white transition-all items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('typePlaceholder')}
              className="flex-1 bg-transparent focus:outline-none text-sm text-textPrimary py-1"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim()}
              className={`p-1.5 rounded-full ${
                inputValue.trim() 
                  ? 'bg-primary-green text-white hover:bg-green-700' 
                  : 'text-gray-300'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
        
        {voiceAvailable && (
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
            {isListening ? t('listening') : t('tapMic')}
          </span>
        )}
      </div>
    </div>
  );
}
