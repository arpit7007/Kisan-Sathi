// Voice Service: Speech-to-Text (STT) & Text-to-Speech (TTS) using Web Speech API

let recognition = null;

// Initialize SpeechRecognition if supported
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
}

export const isVoiceSupported = () => {
  return recognition !== null;
};

export const startListening = (language, onResult, onEnd) => {
  if (!recognition) {
    console.warn("Speech recognition is not supported in this browser.");
    return false;
  }

  // Set language code based on user preference
  let langCode = 'en-IN';
  if (language === 'pa') langCode = 'pa-IN';
  else if (language === 'hi') langCode = 'hi-IN';

  recognition.lang = langCode;
  
  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    onResult(transcript, event.results[event.resultIndex].isFinal);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (onEnd) onEnd(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
    return true;
  } catch (error) {
    console.error("Failed to start SpeechRecognition:", error);
    return false;
  }
};

export const stopListening = () => {
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      console.warn("SpeechRecognition already stopped:", e);
    }
  }
};

export const speak = (text, language) => {
  if (!window.speechSynthesis) {
    console.warn("Speech synthesis is not supported in this browser.");
    return;
  }

  // Stop any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language code
  let langCode = 'en-IN';
  if (language === 'pa') langCode = 'pa-IN';
  else if (language === 'hi') langCode = 'hi-IN';
  
  utterance.lang = langCode;
  
  // Find a voice matching the language
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(langCode));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }
  
  // Adjust rate and pitch for natural flow
  utterance.rate = 0.95; 
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
