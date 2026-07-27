import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Tractor, ArrowRight, ShieldCheck, HelpCircle, Users, Layers } from 'lucide-react';

export default function Landing() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleStart = (langCode) => {
    setLanguage(langCode);
    navigate('/onboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-farmBg via-white to-farmBg flex flex-col justify-between overflow-x-hidden relative">
      
      {/* Decorative SVG wheat field waves */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-20 z-0 select-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
          <path 
            fill="#d97706" 
            fillOpacity="1" 
            d="M0,192L48,202.7C96,213,192,235,288,224C384,213,480,171,576,170.7C672,171,768,213,864,224C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-pulse"
            style={{ animationDuration: '4s' }}
          />
          <path 
            fill="#16a34a" 
            fillOpacity="0.8" 
            d="M0,128L48,144C96,160,192,192,288,186.7C384,181,480,139,576,144C672,149,768,203,864,208C960,213,1056,171,1152,144C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Tractor className="w-8 h-8 text-primary-green" />
          <span className="text-2xl font-black text-textPrimary tracking-tight">
            KisanSaathi <span className="text-wheat-gold font-gurmukhi font-semibold">ਕਿਸਾਨ ਸਾਥੀ</span>
          </span>
        </div>
        
        {/* Simple Top Language Bar */}
        <div className="flex bg-green-50 border border-green-100 p-0.5 rounded-full shadow-xs">
          {[
            { code: 'pa', label: 'ਪੰਜਾਬੀ' },
            { code: 'hi', label: 'हिंदी' },
            { code: 'en', label: 'EN' }
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                language === lang.code
                  ? 'bg-primary-green text-white shadow-md'
                  : 'text-textPrimary hover:bg-green-100/50'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </header>

      {/* Hero Body */}
      <main className="max-w-4xl mx-auto w-full px-6 flex-1 flex flex-col justify-center items-center text-center space-y-8 z-10 pt-4 pb-12">
        
        {/* Animated Wheat SVG Illustration */}
        <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center border border-green-100 shadow-md">
          <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5">
            <path d="M12 22V10" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 10C10.5 8 9 8 8 9C7 10 7.5 12 9 13C10.5 14 12 13 12 10Z" fill="#f59e0b" fillOpacity="0.8" />
            <path d="M12 7C13.5 5 15 5 16 6C17 7 16.5 9 15 10C13.5 11 12 10 12 7Z" fill="#f59e0b" fillOpacity="0.8" />
            <path d="M12 13C13.5 11 15 11 16 12C17 13 16.5 15 15 16C13.5 17 12 16 12 13Z" fill="#f59e0b" fillOpacity="0.8" />
            <path d="M12 16C10.5 14 9 14 8 15C7 16 7.5 18 9 19C10.5 20 12 19 12 16Z" fill="#f59e0b" fillOpacity="0.8" />
          </svg>
        </div>

        {/* Titles */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black text-textPrimary leading-tight">
            KisanSaathi <br />
            <span className="text-wheat-gold font-gurmukhi font-semibold">ਕਿਸਾਨ ਸਾਥੀ</span> · 
            <span className="text-primary-green font-devanagari font-semibold"> किसान साथी</span>
          </h1>
          <div className="space-y-1">
            <p className="text-lg sm:text-xl font-bold text-textPrimary italic">
              "Ek kaam karo, baaki sab KisanSaathi karega"
            </p>
            <p className="text-base sm:text-lg font-semibold text-textSecondary font-gurmukhi">
              "ਇੱਕ ਕੰਮ ਕਰੋ, ਬਾਕੀ ਸਭ ਕਿਸਾਨ ਸਾਥੀ ਕਰੇਗਾ"
            </p>
          </div>
        </div>

        {/* CTA Launch Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-2xl">
          <button
            onClick={() => handleStart('pa')}
            className="w-full sm:flex-1 py-4 bg-primary-green hover:bg-green-700 active:scale-95 text-white font-extrabold rounded-full shadow-lg hover:shadow-green-200 transition-all text-sm sm:text-base flex items-center justify-center gap-2 group"
          >
            <span>ਪੰਜਾਬੀ ਵਿੱਚ ਸ਼ੁਰੂ ਕਰੋ</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => handleStart('hi')}
            className="w-full sm:flex-1 py-4 bg-white border-2 border-primary-green text-primary-green hover:bg-green-50 active:scale-95 font-extrabold rounded-full transition-all text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <span>हिंदी में शुरू करें</span>
          </button>

          <button
            onClick={() => handleStart('en')}
            className="w-full sm:flex-1 py-4 bg-white border-2 border-amber-600 text-amber-700 hover:bg-amber-50 active:scale-95 font-extrabold rounded-full transition-all text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <span>Start in English</span>
          </button>
        </div>

        {/* Core Stat Bar */}
        <div className="w-full max-w-2xl bg-white border border-green-50 shadow-sm rounded-3xl p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs divide-y sm:divide-y-0 sm:divide-x divide-green-50">
          <div className="py-2 sm:py-0 px-2">
            <span className="text-xl font-black text-wheat-gold block">10%</span>
            <span className="text-textSecondary font-semibold">Punjab farmers have insurance coverage</span>
          </div>
          <div className="py-2 sm:py-0 px-2">
            <span className="text-xl font-black text-alert-red block">₹1,500 Cr</span>
            <span className="text-textSecondary font-semibold">Lost annually to severe weather anomalies</span>
          </div>
          <div className="py-2 sm:py-0 px-2">
            <span className="text-xl font-black text-sky-600 block">72 Hours</span>
            <span className="text-textSecondary font-semibold">Critical window to file crop damage reports</span>
          </div>
        </div>

      </main>

      {/* Footer Info */}
      <footer className="w-full py-6 text-center text-[10px] text-gray-400 z-10 max-w-4xl mx-auto px-6 border-t border-green-50/50 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© 2026 KisanSaathi Inc. Made for Punjab Hackathon.</span>
        <div className="flex flex-wrap gap-4 justify-center">
          <button 
            onClick={() => navigate('/architecture')}
            className="flex items-center gap-1 text-primary-green hover:text-green-700 font-extrabold hover:underline transition-all"
          >
            <Layers className="w-3.5 h-3.5" /> Tech Stack & Flow
          </button>
          <span className="flex items-center gap-0.5"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Offline Capable</span>
          <span className="flex items-center gap-0.5"><HelpCircle className="w-3.5 h-3.5 text-green-500" /> Zero Paid APIs</span>
        </div>
      </footer>

    </div>
  );
}
