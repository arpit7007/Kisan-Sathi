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

/**
 * Convert Gurmukhi Unicode script to Devanagari script for seamless audio pronunciation
 * using Indian TTS engines (hi-IN) when native Punjabi OS voice packs are absent.
 */
export const gurmukhiToDevanagari = (str) => {
  if (!str) return '';
  return str.split('').map(c => {
    const code = c.charCodeAt(0);
    // Gurmukhi Unicode block [0x0A01 - 0x0A75] maps structurally to Devanagari [0x0901 - 0x0975]
    if (code >= 0x0A01 && code <= 0x0A75) {
      return String.fromCharCode(code - 0x0100);
    }
    return c;
  }).join('');
};

export const speak = (text, language) => {
  if (!window.speechSynthesis) {
    console.warn("Speech synthesis is not supported in this browser.");
    return;
  }

  // Stop any ongoing speech
  window.speechSynthesis.cancel();

  // Clean markdown syntax (*, #, `, links) for smooth audio playback
  const cleanText = text
    .replace(/[*#`_\-~]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .trim();

  if (!cleanText) return;

  // Set default language code
  let langCode = 'en-IN';
  if (language === 'pa') langCode = 'pa-IN';
  else if (language === 'hi') langCode = 'hi-IN';

  const selectVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    let matchedVoice = null;
    let selectedLang = langCode;
    let textToSpeak = cleanText;

    if (language === 'pa') {
      // 1. Search for native Punjabi voice pack first
      matchedVoice = voices.find(v => 
        v.lang.toLowerCase().includes('pa') || 
        v.lang.toLowerCase().includes('pan') || 
        v.name.toLowerCase().includes('punjabi') ||
        v.name.toLowerCase().includes('pa-in')
      );

      // 2. If OS lacks a native Punjabi voice pack (Windows/Android default),
      // transliterate Gurmukhi to Devanagari script and use Indian (hi-IN) TTS voice!
      if (!matchedVoice) {
        matchedVoice = voices.find(v => 
          v.lang.toLowerCase().startsWith('hi') || 
          v.name.toLowerCase().includes('hindi') || 
          v.lang.toLowerCase() === 'hi-in' ||
          v.lang.toLowerCase().includes('en-in') ||
          v.name.toLowerCase().includes('india')
        );
        selectedLang = matchedVoice ? (matchedVoice.lang || 'hi-IN') : 'hi-IN';
        textToSpeak = gurmukhiToDevanagari(cleanText);
      }
    } else if (language === 'hi') {
      matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (!matchedVoice) {
        matchedVoice = voices.find(v => v.lang.toLowerCase().includes('in'));
      }
    } else {
      matchedVoice = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india'));
      if (!matchedVoice) {
        matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang || selectedLang;
    } else {
      utterance.lang = selectedLang;
    }

    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  };

  // If voices are loaded, speak immediately. Otherwise wait for onvoiceschanged event.
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    selectVoiceAndSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      selectVoiceAndSpeak();
      window.speechSynthesis.onvoiceschanged = null;
    };
    setTimeout(() => {
      selectVoiceAndSpeak();
    }, 150);
  }
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
