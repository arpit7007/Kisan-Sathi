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

  // Clean markdown syntax (*, #, `, links) for smooth audio playback
  const cleanText = text
    .replace(/[*#`_\-~]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Set language code
  let langCode = 'en-IN';
  if (language === 'pa') langCode = 'pa-IN';
  else if (language === 'hi') langCode = 'hi-IN';

  const selectVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    let matchedVoice = null;
    let selectedLang = langCode;

    if (language === 'pa') {
      // 1. Search for native Punjabi voice pack first
      matchedVoice = voices.find(v => 
        v.lang.toLowerCase().includes('pa') || 
        v.lang.toLowerCase().includes('pan') || 
        v.name.toLowerCase().includes('punjabi') ||
        v.name.toLowerCase().includes('pa-in')
      );

      // 2. Fallback to Indian/Hindi TTS voice if OS lacks a native Punjabi voice pack
      if (!matchedVoice) {
        matchedVoice = voices.find(v => 
          v.lang.toLowerCase().startsWith('hi') || 
          v.name.toLowerCase().includes('hindi') || 
          v.lang.toLowerCase() === 'hi-in' ||
          v.lang.toLowerCase().includes('en-in') ||
          v.name.toLowerCase().includes('india')
        );
        selectedLang = matchedVoice ? matchedVoice.lang : 'hi-IN';
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

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang || selectedLang;
    } else {
      utterance.lang = selectedLang;
    }

    utterance.rate = 0.95;
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
    // Fallback trigger in case onvoiceschanged event is not emitted by browser
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
