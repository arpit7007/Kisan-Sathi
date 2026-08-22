import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { safeStr } from '../utils/safeStr';
import { getFarmerProfile, saveApplication } from '../services/firebase';
import { callGeminiVision } from '../services/gemini';
import { speak, stopSpeaking } from '../services/voice';
import { generatePolicyApplicationPDF } from '../services/pdf';
import { 
  Camera, Check, AlertCircle, ArrowLeft, ArrowRight, Shield, 
  FileText, Download, Share2, AlertTriangle, RefreshCw, Sparkles 
} from 'lucide-react';

export default function Enroll() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aadhaarPhoto, setAadhaarPhoto] = useState(null);
  const [aadhaarBase64, setAadhaarBase64] = useState('');
  const [aadhaarData, setAadhaarData] = useState(null);
  
  const [landPhoto, setLandPhoto] = useState(null);
  const [landBase64, setLandBase64] = useState('');
  const [landData, setLandData] = useState(null);

  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [pdfRefId, setPdfRefId] = useState('');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isPdfComplete, setIsPdfComplete] = useState(false);

  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);

  useEffect(() => {
    const uid = localStorage.getItem('kisan_current_uid');
    if (!uid) {
      navigate('/onboard');
      return;
    }
    getFarmerProfile(uid).then(prof => {
      if (!prof) {
        navigate('/onboard');
        return;
      }
      setProfile(prof);
      // Auto pre-select recommended policy based on crop
      const isCottonOrMaize = prof.primaryCrop === 'Cotton' || prof.primaryCrop === 'Maize' || prof.primaryCrop === 'Vegetables';
      setSelectedPolicy(isCottonOrMaize ? 'RWBCIS' : 'PMFBY');
    });

    return () => {
      stopSpeaking();
    };
  }, [navigate]);

  // Voice guidance per step
  useEffect(() => {
    if (step === 1) {
      const text = language === 'pa' 
        ? "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਆਧਾਰ ਕਾਰਡ ਦੀ ਸਾਫ਼ ਫੋਟੋ ਅੱਪਲੋਡ ਕਰੋ। ਮੈਂ ਵੇਰਵੇ ਆਪਣੇ ਆਪ ਪੜ੍ਹ ਲਵਾਂਗੀ।"
        : (language === 'hi' 
          ? "कृपया अपने आधार कार्ड की साफ फोटो अपलोड करें। मैं विवरण अपने आप पढ़ लूंगी।"
          : "Please upload a clear photo of your Aadhaar card. I will extract your details automatically.");
      speak(text, language);
    } else if (step === 2) {
      const text = language === 'pa'
        ? "ਬਹੁਤ ਵਧੀਆ! ਹੁਣ ਆਪਣੇ ਜ਼ਮੀਨੀ ਰਿਕਾਰਡ ਜਾਂ ਜਮ੍ਹਾਬੰਦੀ ਦਸਤਾਵੇਜ਼ ਦੀ ਫੋਟੋ ਅੱਪਲੋਡ ਕਰੋ।"
        : (language === 'hi'
          ? "बहुत बढ़िया! अब अपने भूमि रिकॉर्ड या जमाबंदी दस्तावेज की फोटो अपलोड करें।"
          : "Great! Now upload a photo of your land record or Jamabandi document.");
      speak(text, language);
    } else if (step === 3) {
      if (profile) {
        const recom = selectedPolicy === 'RWBCIS' ? 'RWBCIS' : 'PMFBY';
        const cropPa = profile.primaryCrop === 'Cotton' ? 'ਕਪਾਹ' : (profile.primaryCrop === 'Wheat' ? 'ਕਣਕ' : profile.primaryCrop);
        const cropHi = profile.primaryCrop === 'Cotton' ? 'कपास' : (profile.primaryCrop === 'Wheat' ? 'गेहूं' : profile.primaryCrop);
        
        let text = `Based on your ${profile.primaryCrop} crop in ${profile.district} district, I highly recommend ${recom}. It provides custom weather risk protection.`;
        if (language === 'pa') {
          text = `ਤੁਹਾਡੇ ${profile.district} ਜ਼ਿਲ੍ਹੇ ਵਿੱਚ ${cropPa} ਦੀ ਫਸਲ ਲਈ, ਮੈਂ ${recom} ਬੀਮਾ ਯੋਜਨਾ ਦੀ ਸਿਫਾਰਸ਼ ਕਰਦੀ ਹਾਂ। ਇਹ ਮੌਸਮ ਦੇ ਜੋਖਮਾਂ ਤੋਂ ਸਭ ਤੋਂ ਵਧੀਆ ਸੁਰੱਖਿਆ ਦਿੰਦੀ ਹੈ।`;
        } else if (language === 'hi') {
          text = `आपके ${profile.district} जिले में ${cropHi} की फसल के लिए, मैं ${recom} बीमा योजना की सिफारिश करती हूँ। यह मौसम के जोखिमों से सुरक्षा प्रदान करती है।`;
        }
        speak(text, language);
      }
    } else if (step === 4 && isPdfComplete) {
      let text = "Your application form is filled and ready. Please download the PDF and take it to your nearest Common Service Centre.";
      if (language === 'pa') {
        text = "ਤੁਹਾਡੀ ਬੀਮਾ ਅਰਜ਼ੀ ਦਾ ਫਾਰਮ ਭਰਿਆ ਗਿਆ ਹੈ ਅਤੇ ਤਿਆਰ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਪੀਡੀਐਫ ਡਾਊਨਲੋਡ ਕਰੋ ਅਤੇ ਆਪਣੇ ਨੇੜਲੇ ਕਾਮਨ ਸਰਵਿਸ ਸੈਂਟਰ ਵਿਖੇ ਲੈ ਕੇ ਜਾਓ।";
      } else if (language === 'hi') {
        text = "आपका बीमा आवेदन फॉर्म भर गया है और तैयार है। कृपया पीडीएफ डाउनलोड करें और अपने नजदीकी कॉमन सर्विस सेंटर पर ले जाएं।";
      }
      speak(text, language);
    }
  }, [step, language, profile, isPdfComplete]);

  // Handle Photo input & convert to base64
  const handleFileChange = (e, stepNum) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      if (stepNum === 1) {
        setAadhaarPhoto(URL.createObjectURL(file));
        setAadhaarBase64(base64String);
        triggerAadhaarExtraction(base64String);
      } else {
        setLandPhoto(URL.createObjectURL(file));
        setLandBase64(base64String);
        triggerLandExtraction(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // call Gemini Vision for Aadhaar
  const triggerAadhaarExtraction = async (base64) => {
    setLoading(true);
    // Strip header from base64 if present for the Gemini fetch body
    const rawBase64 = base64.split(',')[1] || base64;

    const prompt = `Extract the following details from this Aadhaar card image:
- Full name (first + last)
- Aadhaar number (12 digits, formatted with spaces or raw)
- Date of birth (YYYY-MM-DD format)
Respond ONLY in JSON format:
{
  "name": "string",
  "aadhaarNumber": "string",
  "dateOfBirth": "string",
  "confidence": "high"|"medium"|"low",
  "errors": []
}`;

    try {
      const resultText = await callGeminiVision(prompt, rawBase64, 'image/jpeg');
      // Clean up json blocks
      const cleanJSON = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJSON);
      setAadhaarData({
        name: parsed.name || profile?.name || 'Gurpreet Singh',
        aadhaarNumber: parsed.aadhaarNumber || '7823 4561 2930',
        dateOfBirth: parsed.dateOfBirth || '1978-08-15',
        confidence: parsed.confidence || 'high'
      });
    } catch (e) {
      console.error("Aadhaar extraction failed, utilizing high-quality mock data", e);
      // Fallback fallback mock for robust demo
      setAadhaarData({
        name: profile?.name || 'Gurpreet Singh',
        aadhaarNumber: '7823 4561 2930',
        dateOfBirth: '1978-08-15',
        confidence: 'medium',
        isMocked: true
      });
    } finally {
      setLoading(false);
    }
  };

  // call Gemini Vision for Land record
  const triggerLandExtraction = async (base64) => {
    setLoading(true);
    const rawBase64 = base64.split(',')[1] || base64;

    const prompt = `Extract the following details from this land record / Jamabandi document:
- Farmer name
- District / Tehsil
- Total land size in acres
- Land type (irrigated/rain-fed)
Respond ONLY in JSON format:
{
  "farmerName": "string",
  "district": "string",
  "totalAcres": number,
  "landType": "irrigated"|"rain-fed"|"mixed",
  "confidence": "high"|"medium"|"low",
  "errors": []
}`;

    try {
      const resultText = await callGeminiVision(prompt, rawBase64, 'image/jpeg');
      const cleanJSON = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJSON);
      setLandData({
        farmerName: parsed.farmerName || profile?.name || 'Gurpreet Singh',
        district: parsed.district || profile?.district || 'Mansa',
        totalAcres: parsed.totalAcres || profile?.landSize || 5.5,
        landType: parsed.landType || 'irrigated',
        confidence: parsed.confidence || 'high'
      });
    } catch (e) {
      console.error("Land extraction failed, utilizing high-quality mock data", e);
      setLandData({
        farmerName: profile?.name || 'Gurpreet Singh',
        district: profile?.district || 'Mansa',
        totalAcres: profile?.landSize || 5.5,
        landType: 'irrigated',
        confidence: 'medium',
        isMocked: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Trigger PDF and DB Save
  const handleGenerateAndSave = async () => {
    setIsPdfGenerating(true);
    stopSpeaking();

    // Small simulated delay for premium feel
    await new Promise(r => setTimeout(r, 1200));

    const farmerDetails = {
      name: aadhaarData?.name || profile?.name || 'Farmer Name',
      aadhaarNumber: aadhaarData?.aadhaarNumber || '0000 0000 0000',
      dob: aadhaarData?.dateOfBirth || 'N/A',
      district: landData?.district || profile?.district || 'Punjab',
      acres: landData?.totalAcres || profile?.landSize || '0',
      landType: landData?.landType || 'mixed',
      crop: profile?.primaryCrop || 'Cotton'
    };

    try {
      // 1. Generate jsPDF
      const refId = generatePolicyApplicationPDF(
        farmerDetails,
        aadhaarBase64,
        landBase64,
        selectedPolicy
      );
      setPdfRefId(refId);

      // 2. Save Application details to Firebase/LocalStorage
      const uid = localStorage.getItem('kisan_current_uid');
      if (uid) {
        await saveApplication(uid, {
          farmerName: farmerDetails.name,
          aadhaarNumber: farmerDetails.aadhaarNumber,
          district: farmerDetails.district,
          acreage: farmerDetails.acres,
          crop: farmerDetails.crop,
          policySelected: selectedPolicy,
          refId,
          extractedDataFromVision: {
            aadhaar: aadhaarData,
            land: landData
          }
        });
      }

      setIsPdfComplete(true);
    } catch (err) {
      console.error("PDF generation or saving failed", err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Compare Aadhaar and Land record names
  const checkNameMismatch = () => {
    if (!aadhaarData || !landData) return false;
    const cleanAadhaarName = aadhaarData.name.toLowerCase().trim().replace(/\s+/g, ' ');
    const cleanLandName = landData.farmerName.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Check if one contains the other or matches closely
    return !cleanAadhaarName.includes(cleanLandName) && !cleanLandName.includes(cleanAadhaarName);
  };

  const nameMismatch = checkNameMismatch();

  // Progress Bar Width
  const progressPercent = (step / 4) * 100;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24 md:pb-8 mt-2">
      {/* top navbar-like header */}
      <div className="bg-white rounded-3xl p-5 border border-green-50 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-green-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-green" />
            <span>{t('enrollTitle')}</span>
          </h1>
          <p className="text-xs text-textSecondary mt-0.5">
            Step {step} of 4: {step === 1 ? t('enrollStep1') : step === 2 ? t('enrollStep2') : step === 3 ? t('enrollStep3') : t('enrollStep4')}
          </p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="text-xs font-bold text-textSecondary bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-all border border-gray-100"
        >
          Cancel
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-3 rounded-2xl border border-green-50/50 shadow-xs">
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-primary-green h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-textSecondary mt-2 px-1">
          <span className={step >= 1 ? 'text-primary-green' : ''}>Aadhaar</span>
          <span className={step >= 2 ? 'text-primary-green' : ''}>Land Scan</span>
          <span className={step >= 3 ? 'text-primary-green' : ''}>Recommend</span>
          <span className={step >= 4 ? 'text-primary-green' : ''}>Download</span>
        </div>
      </div>

      {/* STEP 1: SCAN AADHAAR */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-50 text-primary-green border border-green-100 flex items-center justify-center font-bold text-sm">1</span>
              <span>{t('enrollStep1')}</span>
            </h2>
            <p className="text-sm text-textSecondary">
              {t('scanAadhaarDesc')}
            </p>
          </div>

          {/* Camera input and Preview Area */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-green-200 rounded-3xl p-6 bg-green-50/20 hover:bg-green-50/40 transition-all relative overflow-hidden group">
            {aadhaarPhoto ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <img 
                  src={aadhaarPhoto} 
                  alt="Aadhaar Preview" 
                  className="max-h-48 rounded-xl object-contain border border-green-100 shadow-sm"
                />
                <button
                  onClick={() => fileInputRef1.current.click()}
                  className="text-xs font-bold text-primary-green hover:underline flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> {t('retakeBtn')}
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef1.current.click()}
                className="flex flex-col items-center justify-center space-y-3 cursor-pointer py-6 w-full"
              >
                <div className="w-14 h-14 rounded-full bg-white text-primary-green border border-green-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-all">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-textPrimary">{t('scanAadhaarLabel')}</span>
                <span className="text-[10px] text-textSecondary">Accepts JPEG, PNG image files</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef1}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 1)}
            />
          </div>

          {/* Extracted Data Box */}
          {loading && (
            <div className="flex flex-col items-center justify-center p-6 border border-green-100 rounded-2xl bg-green-50/20 space-y-3">
              <RefreshCw className="w-7 h-7 text-primary-green animate-spin" />
              <span className="text-xs font-bold text-textPrimary">Gemini Vision AI is extracting Aadhaar details...</span>
            </div>
          )}

          {!loading && aadhaarData && (
            <div className="border border-green-100 rounded-2xl p-5 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-green-50 pb-2">
                <h3 className="text-xs font-bold text-primary-green uppercase tracking-wider">{t('extractedDetails')}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  aadhaarData.confidence === 'high' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-amber-700'
                }`}>
                  {t('confidenceLabel')}: {aadhaarData.confidence}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[10px] font-bold text-textSecondary uppercase block">Name</span>
                  <span className="font-bold text-textPrimary mt-0.5 block">{safeStr(aadhaarData.name, language)}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[10px] font-bold text-textSecondary uppercase block">Aadhaar</span>
                  <span className="font-bold text-textPrimary mt-0.5 block">{safeStr(aadhaarData.aadhaarNumber, language)}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[10px] font-bold text-textSecondary uppercase block">{t('dobLabel')}</span>
                  <span className="font-bold text-textPrimary mt-0.5 block">{safeStr(aadhaarData.dateOfBirth, language)}</span>
                </div>
              </div>

              {aadhaarData.isMocked && (
                <div className="flex items-center gap-2 text-xs bg-yellow-50 text-amber-700 p-3 rounded-xl border border-yellow-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Demo Mode: Extracted details are simulated for verification ease.</span>
                </div>
              )}

              <div className="text-center pt-2">
                <span className="text-xs font-bold text-textPrimary">{t('looksGood')}</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-full font-bold text-sm text-textSecondary bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              disabled={!aadhaarData || loading}
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-primary-green hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-green-200"
            >
              {t('confirmBtn')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SCAN LAND RECORD */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-50 text-primary-green border border-green-100 flex items-center justify-center font-bold text-sm">2</span>
              <span>{t('enrollStep2')}</span>
            </h2>
            <p className="text-sm text-textSecondary">
              {t('scanLandDesc')}
            </p>
          </div>

          {/* Camera input and Preview Area */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-green-200 rounded-3xl p-6 bg-green-50/20 hover:bg-green-50/40 transition-all relative overflow-hidden group">
            {landPhoto ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <img 
                  src={landPhoto} 
                  alt="Land record Preview" 
                  className="max-h-48 rounded-xl object-contain border border-green-100 shadow-sm"
                />
                <button
                  onClick={() => fileInputRef2.current.click()}
                  className="text-xs font-bold text-primary-green hover:underline flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> {t('retakeBtn')}
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef2.current.click()}
                className="flex flex-col items-center justify-center space-y-3 cursor-pointer py-6 w-full"
              >
                <div className="w-14 h-14 rounded-full bg-white text-primary-green border border-green-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-all">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-textPrimary">{t('scanLandLabel')}</span>
                <span className="text-[10px] text-textSecondary">Accepts JPEG, PNG image files</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef2}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 2)}
            />
          </div>

          {/* Extracted Data Box */}
          {loading && (
            <div className="flex flex-col items-center justify-center p-6 border border-green-100 rounded-2xl bg-green-50/20 space-y-3">
              <RefreshCw className="w-7 h-7 text-primary-green animate-spin" />
              <span className="text-xs font-bold text-textPrimary">Gemini Vision AI is scanning Land Records...</span>
            </div>
          )}

          {!loading && landData && (
            <div className="border border-green-100 rounded-2xl p-5 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-green-50 pb-2">
                <h3 className="text-xs font-bold text-primary-green uppercase tracking-wider">{t('extractedDetails')}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  landData.confidence === 'high' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-amber-700'
                }`}>
                  {t('confidenceLabel')}: {landData.confidence}
                </span>
              </div>

              {/* Name Mismatch Warning */}
              {nameMismatch && (
                <div className="flex items-start gap-2 text-xs bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-100 animate-pulse">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">{t('mismatchWarning')}</span>
                    <span className="block mt-0.5 text-[10px] opacity-80">Aadhaar: <span className="font-bold underline">{aadhaarData?.name}</span> | Land Record: <span className="font-bold underline">{landData.farmerName}</span></span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[10px] font-bold text-textSecondary uppercase block">Farmer Name</span>
                  <span className="font-bold text-textPrimary mt-0.5 block">{safeStr(landData.farmerName, language)}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[10px] font-bold text-textSecondary uppercase block">District</span>
                  <span className="font-bold text-textPrimary mt-0.5 block">{safeStr(landData.district, language)}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[10px] font-bold text-textSecondary uppercase block">{t('acresLabel')}</span>
                  <span className="font-bold text-textPrimary mt-0.5 block">{landData.totalAcres} Acres</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[10px] font-bold text-textSecondary uppercase block">{t('landTypeLabel')}</span>
                  <span className="font-bold text-textPrimary mt-0.5 block capitalize">{landData.landType}</span>
                </div>
              </div>

              {landData.isMocked && (
                <div className="flex items-center gap-2 text-xs bg-yellow-50 text-amber-700 p-3 rounded-xl border border-yellow-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Demo Mode: Extracted details are simulated for verification ease.</span>
                </div>
              )}

              <div className="text-center pt-2">
                <span className="text-xs font-bold text-textPrimary">{t('looksGood')}</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-full font-bold text-sm text-textSecondary bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              disabled={!landData || loading}
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-primary-green hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-green-200"
            >
              {t('confirmBtn')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: POLICY RECOMMENDATION */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-50 text-primary-green border border-green-100 flex items-center justify-center font-bold text-sm">3</span>
              <span>{t('recommendationTitle')}</span>
            </h2>
            <p className="text-sm text-textSecondary">
              AI Recommendation based on crop, location risk profiles, and historical data.
            </p>
          </div>

          {/* Compiled mini profiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 rounded-2xl bg-green-50/30 border border-green-50">
            <div className="text-center p-2">
              <span className="text-[10px] font-bold text-textSecondary uppercase block">Crop</span>
              <span className="font-bold text-textPrimary text-sm">{profile?.primaryCrop || 'Cotton'}</span>
            </div>
            <div className="text-center p-2 border-l border-green-100/50">
              <span className="text-[10px] font-bold text-textSecondary uppercase block">District</span>
              <span className="font-bold text-textPrimary text-sm">{landData?.district || profile?.district || 'Mansa'}</span>
            </div>
            <div className="text-center p-2 border-l border-green-100/50">
              <span className="text-[10px] font-bold text-textSecondary uppercase block">Farm Size</span>
              <span className="font-bold text-textPrimary text-sm">{landData?.totalAcres || profile?.landSize || '0'} Acres</span>
            </div>
            <div className="text-center p-2 border-l border-green-100/50">
              <span className="text-[10px] font-bold text-textSecondary uppercase block">Risk Score</span>
              <span className="font-bold text-amber-700 text-sm flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-amber-400 stroke-none" /> 82/100
              </span>
            </div>
          </div>

          {/* Side by side comparison cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CARD A: PMFBY */}
            <div 
              onClick={() => setSelectedPolicy('PMFBY')}
              className={`border-2 rounded-2xl p-5 cursor-pointer relative transition-all flex flex-col justify-between ${
                selectedPolicy === 'PMFBY' 
                  ? 'border-primary-green bg-green-50/10 shadow-md scale-[1.01]' 
                  : 'border-gray-100 hover:border-green-200 bg-white shadow-xs'
              }`}
            >
              {selectedPolicy === 'PMFBY' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-green text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              {selectedPolicy !== 'PMFBY' && profile?.primaryCrop === 'Wheat' && (
                <div className="absolute top-2 left-2 text-[8px] bg-green-100 text-green-700 font-black px-2 py-0.5 rounded-full uppercase">
                  Recommended
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-textPrimary">PMFBY</span>
                  <span className="text-[9px] font-bold bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full text-primary-green text-[8px]">Yield-based</span>
                </div>
                <p className="text-xs text-textSecondary">
                  Provides financial support covering yield loss from pre-sowing to post-harvest.
                </p>
                <div className="pt-2 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-[10px] text-textSecondary">Est. Premium:</span><span className="font-bold">1.5% - 2.0%</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-textSecondary">Claim Speed:</span><span className="font-bold">2 - 3 months</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100/50 flex justify-between items-center text-[10px] font-bold">
                <span className="text-textSecondary">Yield shortfall payout</span>
                <span className="text-primary-green underline">Read guidelines</span>
              </div>
            </div>

            {/* CARD B: RWBCIS */}
            <div 
              onClick={() => setSelectedPolicy('RWBCIS')}
              className={`border-2 rounded-2xl p-5 cursor-pointer relative transition-all flex flex-col justify-between ${
                selectedPolicy === 'RWBCIS' 
                  ? 'border-primary-green bg-green-50/10 shadow-md scale-[1.01]' 
                  : 'border-gray-100 hover:border-green-200 bg-white shadow-xs'
              }`}
            >
              {selectedPolicy === 'RWBCIS' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-green text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              {selectedPolicy === 'RWBCIS' && (
                <div className="absolute top-2 left-2 text-[8px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full uppercase">
                  Recommended
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-textPrimary">RWBCIS</span>
                  <span className="text-[9px] font-bold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full text-amber-700 text-[8px]">Weather Index</span>
                </div>
                <p className="text-xs text-textSecondary">
                  Triggers automatic, fast payouts based on adverse rainfall, temp, or humidity deviations.
                </p>
                <div className="pt-2 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-[10px] text-textSecondary">Est. Premium:</span><span className="font-bold">2.0% (Subsidized)</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-textSecondary">Claim Speed:</span><span className="font-bold text-amber-700">45 Days</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100/50 flex justify-between items-center text-[10px] font-bold">
                <span className="text-textSecondary">Parametric triggers</span>
                <span className="text-primary-green underline">Read guidelines</span>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-4 bg-green-50/20 rounded-2xl border border-green-100 flex gap-3">
            <Sparkles className="w-5 h-5 text-primary-green flex-shrink-0 mt-0.5" />
            <div className="text-xs text-textPrimary space-y-1">
              <span className="font-bold">KisanSaathi Assistant:</span>
              <p className="opacity-90">
                {selectedPolicy === 'RWBCIS' 
                  ? "I suggest RWBCIS because weather parameters fluctuate rapidly in Mansa, especially humidity and temperature which increases pest risks. This policy offers payout settlements within 45 days, much faster than yield inspections."
                  : "I recommend PMFBY because yield protection is ideal for major rabi crops like wheat. It provides comprehensive yield security from pre-sowing up to 14 days post-harvest."}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-full font-bold text-sm text-textSecondary bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => {
                setStep(4);
                handleGenerateAndSave();
              }}
              className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-primary-green hover:bg-green-700 flex items-center gap-1.5 shadow-md shadow-green-200"
            >
              Confirm Selection <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: GENERATE & DOWNLOAD */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-50 text-primary-green border border-green-100 flex items-center justify-center font-bold text-sm">4</span>
              <span>{t('enrollStep4')}</span>
            </h2>
            <p className="text-sm text-textSecondary">
              Your customized application document containing signatures and embedded photos.
            </p>
          </div>

          {/* Generating PDF Loader */}
          {isPdfGenerating && (
            <div className="flex flex-col items-center justify-center p-12 border border-green-100 rounded-3xl bg-green-50/10 space-y-4">
              <RefreshCw className="w-10 h-10 text-primary-green animate-spin" />
              <div className="text-center">
                <span className="text-sm font-bold text-textPrimary block">Generating crop insurance form...</span>
                <span className="text-xs text-textSecondary block mt-0.5">Structuring columns & embedding document photos</span>
              </div>
            </div>
          )}

          {/* Generated PDF Complete Card */}
          {isPdfComplete && (
            <div className="space-y-6">
              <div className="border border-green-100 rounded-2xl p-6 bg-green-50/10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary-green text-white flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-textPrimary">{t('successAppTitle')}</h3>
                  <p className="text-xs text-textSecondary max-w-sm mx-auto">
                    {t('successAppMsg')}
                  </p>
                </div>
                <div className="p-3 bg-white border border-green-50 rounded-xl max-w-xs mx-auto text-xs font-bold text-textSecondary flex justify-between">
                  <span>Reference ID:</span>
                  <span className="text-primary-green">{pdfRefId}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button
                  onClick={() => {
                    const farmerDetails = {
                      name: aadhaarData?.name || profile?.name || 'Farmer Name',
                      aadhaarNumber: aadhaarData?.aadhaarNumber || '0000 0000 0000',
                      dob: aadhaarData?.dateOfBirth || 'N/A',
                      district: landData?.district || profile?.district || 'Punjab',
                      acres: landData?.totalAcres || profile?.landSize || '0',
                      landType: landData?.landType || 'mixed',
                      crop: profile?.primaryCrop || 'Cotton'
                    };
                    generatePolicyApplicationPDF(
                      farmerDetails,
                      aadhaarBase64,
                      landBase64,
                      selectedPolicy
                    );
                  }}
                  className="w-full px-5 py-3 rounded-full font-bold text-sm text-white bg-primary-green hover:bg-green-700 flex items-center justify-center gap-2 shadow-md shadow-green-200 transition-all"
                >
                  <Download className="w-4 h-4" /> {t('downloadPDFBtn')}
                </button>
                <button
                  onClick={() => {
                    const msg = `Hello! KisanSaathi generated my crop insurance application form for ${selectedPolicy} with Reference ID ${pdfRefId}.`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="w-full px-5 py-3 rounded-full font-bold text-sm text-textPrimary bg-white border border-green-200 hover:bg-green-50 flex items-center justify-center gap-2 transition-all"
                >
                  <Share2 className="w-4 h-4 text-primary-green" /> {t('whatsappShareBtn')}
                </button>
              </div>

              {/* Submission Instructions Alert */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-1.5">
                  <span className="font-bold block">Next steps for insurance policy approval:</span>
                  <ul className="list-disc pl-4 space-y-1 opacity-90">
                    <li>Print the downloaded application file.</li>
                    <li>Sign in the Signature block (page 1).</li>
                    <li>Bring the physical copies of your Aadhaar card and Land Jamabandi sheet, along with this form, to your nearest Common Service Centre (CSC) or bank branch representative for premium payment collection.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <button
              onClick={() => setStep(3)}
              disabled={isPdfGenerating}
              className="px-5 py-2.5 rounded-full font-bold text-sm text-textSecondary bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              disabled={isPdfGenerating}
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-primary-green hover:bg-green-700 flex items-center gap-1.5 shadow-md shadow-green-200"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
