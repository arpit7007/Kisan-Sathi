import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getFarmerProfile, saveFarmerProfile } from '../services/firebase';
import { callGemini, extractJSON } from '../services/gemini';
import { Shield, Sparkles, AlertCircle, HelpCircle, Check, DollarSign, Clock, X } from 'lucide-react';

const POLICIES_DATA = {
  PMFBY: {
    name: "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
    type: "Yield-based",
    premiumRate: "1.5% - 2.0%",
    coverage: "Pre-sowing to post-harvest losses",
    covers: ["Drought", "Flood", "Pest outbreak", "Disease", "Hailstorm", "Landslide"],
    trigger: "Area-level yield shortfall",
    speed: "2 - 3 months",
    bestFor: "Wheat, Rice farmers",
    govSubsidized: true,
    portal: "pmfby.gov.in"
  },
  RWBCIS: {
    name: "RWBCIS (Restructured Weather Based Crop Insurance)",
    type: "Weather index-based",
    premiumRate: "2.0% (Subsidized)",
    coverage: "Weather parameter deviations (rain, temp, humidity)",
    covers: ["Deficit/excess rainfall", "Extreme temperature", "High wind speeds", "Severe humidity"],
    trigger: "Automatic when weather index crosses threshold",
    speed: "45 days",
    bestFor: "Cotton, Maize, horticulture",
    govSubsidized: true,
    portal: "pmfby.gov.in"
  },
  UPIS: {
    name: "UPIS (Unified Package Insurance Scheme - Pilot)",
    type: "Comprehensive package",
    premiumRate: "Subsidized package rate",
    coverage: "Crop + life + accident + household + implements",
    covers: ["Crop damage", "Personal accident", "Tractor/pump theft", "Household fire"],
    trigger: "Yield shortfall + direct asset loss verification",
    speed: "60 days",
    bestFor: "Farmers wanting all-in-one coverage",
    govSubsidized: true,
    portal: "pmfby.gov.in"
  },
  Kshema: {
    name: "Kshema Private Insurance",
    type: "Private comprehensive",
    premiumRate: "Market rate (varies by crop/district)",
    coverage: "100+ crops, up to 8 severe perils",
    covers: ["Drought", "Flood", "Localized pest", "Hailstorm", "Wild animal damage"],
    trigger: "Digital-first individual loss inspection",
    speed: "15 - 30 days",
    bestFor: "Farmers who want more coverage than government schemes",
    govSubsidized: false,
    portal: "kshema.co"
  }
};

export default function PolicyAdvisor() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollingPolicy, setEnrollingPolicy] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(null); // stores policy key for instructions
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  // Payment gateway states
  const [showPaymentModal, setShowPaymentModal] = useState(null); // stores policy key for payment
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'csc'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('4321 8765 2345 9876');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvv, setCardCvv] = useState('321');
  const [cscWalletId, setCscWalletId] = useState('CSC-IND-98745');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1); // 1: Form, 2: Loading, 3: Success
  const [paymentStatusText, setPaymentStatusText] = useState('');

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
      setUpiId(`${prof.name?.toLowerCase().replace(/\s+/g, '') || 'farmer'}@okaxis`);
      fetchRecommendation(prof);
    });
  }, [navigate]);

  const fetchRecommendation = async (farmerProf) => {
    setLoading(true);
    const threats = farmerProf.primaryCrop === 'Cotton' 
      ? 'Whitefly outbreak, groundwater scarcity in Malwa' 
      : 'Yellow rust in winter, groundwater depletion';

    const prompt = `Given this farmer profile: Crop=${farmerProf.primaryCrop}, District=${farmerProf.district}, Land=${farmerProf.landSize} acres, Current threats=${threats}
Which of these 4 insurance options is best for them and why?
Options: PMFBY, RWBCIS, UPIS, Kshema
Respond in JSON:
{
  "recommended": "PMFBY"|"RWBCIS"|"UPIS"|"Kshema",
  "reason": "string (2 sentences max)",
  "estimatedPremium": "string",
  "estimatedCoverage": "string"
}`;

    const systemContext = `Return ONLY a valid JSON object matching the format. The "reason" field must be translated in language code=${language} (Punjabi if pa, Hindi if hi, English if en).`;

    try {
      const resp = await callGemini(prompt, systemContext);
      const cleaned = extractJSON(resp);
      if (!cleaned) throw new Error("JSON extraction returned empty/null");
      const parsed = JSON.parse(cleaned);
      if (!parsed || typeof parsed !== 'object') throw new Error("Parsed JSON is not an object");
      setRecommendation(parsed);
    } catch (e) {
      console.error("Failed to parse Gemini insurance recommendation, using rule-based recommendation:", e);
      // Rule-based fallback
      const isCotton = farmerProf.primaryCrop === 'Cotton';
      setRecommendation({
        recommended: isCotton ? 'RWBCIS' : 'PMFBY',
        reason: language === 'pa' 
          ? "ਮਾਨਸਾ ਵਿੱਚ ਕਪਾਹ ਲਈ RWBCIS ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ ਕਿਉਂਕਿ ਇਹ ਚਿੱਟੀ ਮੱਖੀ ਵਰਗੇ ਕੀੜਿਆਂ ਦੇ ਨੁਕਸਾਨ ਅਤੇ ਤੇਜ਼ 45-ਦਿਨਾਂ ਦੇ ਨਿਪਟਾਰੇ ਨੂੰ ਕਵਰ ਕਰਦਾ ਹੈ।"
          : "Based on crop crop type, the recommended insurance protects you from weather parameter deviations.",
        estimatedPremium: isCotton ? `₹${farmerProf.landSize * 250} (2% rate)` : `₹${farmerProf.landSize * 180} (1.5% rate)`,
        estimatedCoverage: `₹${farmerProf.landSize * 12000}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (policyKey) => {
    if (!profile) return;
    setEnrollingPolicy(policyKey);
    
    // Save enrolled policy to farmer profile
    const updatedProfile = {
      ...profile,
      hasInsurance: 'Yes',
      enrolledPolicy: policyKey
    };

    const success = await saveFarmerProfile(profile.uid, updatedProfile);
    if (success) {
      setEnrollSuccess(true);
      setTimeout(() => {
        setEnrollSuccess(false);
        setEnrollingPolicy(null);
        navigate('/dashboard');
      }, 2000);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setPaymentStep(2);
    
    const steps = [
      "Initiating secure transaction...",
      "Connecting to payment gateway...",
      "Verifying credentials and available funds...",
      "Authorizing with bank partner...",
      "Payment Confirmed! Activating policy..."
    ];
    
    for (let i = 0; i < steps.length; i++) {
      setPaymentStatusText(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    setPaymentStep(3);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const policyKey = showPaymentModal;
    setPaymentStep(1);
    setPaymentLoading(false);
    setShowPaymentModal(null);
    
  };

  const handleAutofillPortal = (policyKey) => {
    // 1. Post message to sync profile with Chrome Extension content script
    window.postMessage({
      type: "KISAN_SATHI_SYNC_PROFILE",
      profile: profile,
      policy: policyKey
    }, "*");
    
    // 2. Open the official portal
    setTimeout(() => {
      const url = `https://${POLICIES_DATA[policyKey]?.portal}`;
      window.open(url, '_blank');
    }, 200);
  };

  // Dynamic values helper based on farmer land size
  const calculatePolicyDetails = (policyKey) => {
    const acres = profile?.landSize || 1;
    const valuePerAcre = 24000; // Average sum insured per acre
    const totalSumInsured = acres * valuePerAcre;
    
    let rate = 0.02; // 2%
    if (policyKey === 'PMFBY') rate = 0.015; // 1.5% for Rabi, let's say average is 1.5%
    if (policyKey === 'Kshema') rate = 0.045; // 4.5% market rate
    
    const premium = totalSumInsured * rate;
    
    return {
      premium: `₹${premium.toLocaleString('en-IN')}`,
      coverage: `₹${totalSumInsured.toLocaleString('en-IN')}`
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 pb-20 md:pb-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary-green" />
            <span>{t('policyAdvisorTitle')}</span>
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            Compare schemes and discover the optimal crop insurance policy customized for your farming variables.
          </p>
        </div>
        {profile && (
          <div className="bg-green-50/50 px-4 py-2 rounded-2xl border border-green-100 flex items-center gap-2">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Your Land:</span>
            <span className="text-sm font-bold text-textPrimary">{profile.landSize} Acres ({profile.primaryCrop})</span>
          </div>
        )}
      </div>

      {/* AI Recommendation Banner */}
      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-green-50 shadow-sm flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary-green border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-textSecondary">Analyzing profiles and matching policies...</span>
        </div>
      ) : (
        recommendation && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/50 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shrink-0 mt-0.5">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2 py-0.5 rounded">AI Recommendation</span>
                <span className="text-xs font-bold text-textPrimary">Best Match: <strong className="text-amber-800">{POLICIES_DATA[recommendation.recommended]?.name.split(' ')[0]}</strong></span>
              </div>
              <p className="text-sm font-semibold text-textPrimary leading-relaxed">
                "{recommendation.reason}"
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-sm pt-2 text-xs">
                <div className="bg-white p-2 rounded-xl border border-amber-100">
                  <span className="text-gray-400 block">{t('estPremium')}</span>
                  <strong className="text-textPrimary text-sm font-bold">{calculatePolicyDetails(recommendation.recommended).premium}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-amber-100">
                  <span className="text-gray-400 block">{t('estCoverage')}</span>
                  <strong className="text-textPrimary text-sm font-bold">{calculatePolicyDetails(recommendation.recommended).coverage}</strong>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Grid of Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(POLICIES_DATA).map(([key, policy]) => {
          const isRecommended = recommendation?.recommended === key;
          const details = calculatePolicyDetails(key);
          const isEnrolled = profile?.enrolledPolicy === key;
          
          return (
            <div 
              key={key}
              className={`bg-white rounded-3xl border p-6 flex flex-col justify-between relative transition-all ${
                isRecommended 
                  ? 'border-2 border-primary-green shadow-md scale-[1.01]' 
                  : 'border-green-50 shadow-sm'
              }`}
            >
              {/* Badges */}
              <div className="absolute right-6 top-6 flex gap-1.5">
                {isRecommended && (
                  <span className="bg-primary-green text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                    <Sparkles className="w-2.5 h-2.5" />
                    {t('recommendedBadge')}
                  </span>
                )}
                {isEnrolled && (
                  <span className="bg-sky-100 text-sky-800 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                    Enrolled
                  </span>
                )}
              </div>

              {/* Title & Info */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                    {policy.type}
                  </span>
                  <h3 className="text-lg font-bold text-textPrimary mt-1.5 leading-tight pr-20">
                    {policy.name}
                  </h3>
                </div>

                {/* Cover Details */}
                <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-50 text-xs">
                  <div>
                    <span className="text-gray-400 block">{t('premium')}</span>
                    <strong className="text-textPrimary font-bold text-sm">{details.premium}</strong>
                    <span className="text-[10px] text-textSecondary block">({policy.premiumRate})</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">{t('coverage')}</span>
                    <strong className="text-textPrimary font-bold text-sm">{details.coverage}</strong>
                    <span className="text-[10px] text-textSecondary block">({t('acreVal')})</span>
                  </div>
                </div>

                {/* Additional Info Table */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Claim Settlement:</span>
                    <span className="font-bold text-textPrimary flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      {policy.speed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Government Subsidized:</span>
                    <span className="font-bold text-textPrimary">
                      {policy.govSubsidized ? 'Yes (Fully Subsidized)' : 'No (Market Rate)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Best For:</span>
                    <span className="font-bold text-textPrimary truncate max-w-[200px]">
                      {policy.bestFor}
                    </span>
                  </div>
                </div>

                {/* Scope Coverage Pills */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">Risks Covered:</span>
                  <div className="flex flex-wrap gap-1">
                    {policy.covers.map((c, i) => (
                      <span key={i} className="text-[10px] bg-green-50/50 text-green-700 px-2 py-0.5 rounded-md font-medium border border-green-100/40">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-50">
                <button
                  onClick={() => setShowApplyModal(key)}
                  className="flex-1 py-2.5 border border-green-200 hover:border-primary-green hover:bg-green-50 text-primary-green text-xs font-bold rounded-xl text-center transition-all"
                >
                  {t('howToApply')}
                </button>
                <button
                  onClick={() => setShowPaymentModal(key)}
                  disabled={enrollingPolicy !== null || isEnrolled}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                    isEnrolled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : enrollingPolicy === key
                        ? 'bg-green-700 text-white'
                        : 'bg-primary-green text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-100 active:scale-95'
                  }`}
                >
                  {enrollingPolicy === key ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isEnrolled ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Enrolled</span>
                    </>
                  ) : (
                    <span>{t('applyNow')}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enroll Success toast message */}
      {enrollSuccess && (
        <div className="fixed bottom-24 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 z-50 animate-bounce">
          <Check className="w-5 h-5 bg-white text-green-600 rounded-full p-0.5" />
          <div>
            <h4 className="font-extrabold text-sm">Enrollment Successful!</h4>
            <p className="text-xs text-green-50 mt-0.5">Policy saved to your farmer profile. Redirecting...</p>
          </div>
        </div>
      )}

      {/* How to Apply Step-by-Step Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowApplyModal(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 relative" onClick={e => e.stopPropagation()}>
            <button className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full" onClick={() => setShowApplyModal(null)}>
              <X className="w-5 h-5 text-gray-500" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-50 rounded-2xl">
                <Shield className="w-6 h-6 text-primary-green" />
              </div>
              <div>
                <h3 className="font-bold text-textPrimary">{POLICIES_DATA[showApplyModal]?.name.split(' ')[0]}</h3>
                <span className="text-[10px] text-textSecondary font-bold block uppercase tracking-wider">How to enroll</span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-sm text-textPrimary">
              <p className="text-xs font-semibold text-textSecondary">
                Follow these steps to submit your crop coverage application:
              </p>
              
              <ol className="list-decimal pl-4 space-y-2 text-xs">
                <li>Visit the official portal at: <a href={`https://${POLICIES_DATA[showApplyModal]?.portal}`} target="_blank" rel="noreferrer" className="text-sky-600 font-bold underline">{POLICIES_DATA[showApplyModal]?.portal}</a></li>
                <li>Register using your Aadhaar number and Mobile number.</li>
                <li>Enter your Land record details (Khasra/Khatauni numbers) and upload your farm land ownership certificate or tenancy lease.</li>
                <li>Pay the subsidized premium of <strong className="text-primary-green">{calculatePolicyDetails(showApplyModal).premium}</strong> securely on the portal.</li>
                <li>Receive your crop insurance Policy Number (keep this ready for claim filings in case of damage).</li>
              </ol>
            </div>

            <div className="bg-green-50/50 p-3 rounded-2xl border border-green-100/60 text-[11px] text-green-800 space-y-1">
              <span className="font-extrabold uppercase block tracking-wider text-[9px]">💡 KisanSaathi Extension Tip</span>
              <p className="margin-0 leading-relaxed font-medium">
                Install our Chrome Extension to auto-sync and autofill your profile details (Aadhaar, name, land size, crop, district) instantly on the government site!
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  handleAutofillPortal(showApplyModal);
                  setShowApplyModal(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-extrabold rounded-xl text-center shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Autofill Portal via Extension</span>
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApplyModal(null)}
                  className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-textSecondary text-xs font-bold rounded-xl text-center"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const url = `https://${POLICIES_DATA[showApplyModal]?.portal}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 py-2.5 border border-green-200 hover:bg-green-50 text-primary-green text-xs font-bold rounded-xl text-center"
                >
                  Open Manually
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { if (!paymentLoading) setShowPaymentModal(null); }}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 relative animate-fadeIn" onClick={e => e.stopPropagation()}>
            {!paymentLoading && (
              <button className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full" onClick={() => setShowPaymentModal(null)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
            
            {paymentStep === 1 ? (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-textPrimary">Secure Premium Payment</h3>
                    <span className="text-[10px] text-textSecondary font-bold block uppercase tracking-wider">Activate Insurance Coverage</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Scheme Name:</span>
                    <strong className="text-textPrimary font-bold">{POLICIES_DATA[showPaymentModal]?.name.split(' ')[0]}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Sum Insured:</span>
                    <strong className="text-textPrimary font-bold">{calculatePolicyDetails(showPaymentModal).coverage}</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-sm">
                    <span className="text-textPrimary font-bold">Premium Amount to Pay:</span>
                    <strong className="text-primary-green font-extrabold text-base">{calculatePolicyDetails(showPaymentModal).premium}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase tracking-wider block">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'upi', label: 'UPI / GPay', icon: Sparkles },
                      { id: 'card', label: 'Debit/Card', icon: Check },
                      { id: 'csc', label: 'CSC Wallet', icon: Shield }
                    ].map(method => {
                      const Icon = method.icon;
                      const active = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                            active 
                              ? 'border-2 border-primary-green bg-green-50/45 text-primary-green font-bold' 
                              : 'border-gray-150 hover:bg-gray-50 text-textSecondary text-xs'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px]">{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {paymentMethod === 'upi' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-textSecondary block">Enter UPI ID</label>
                      <input
                        type="text"
                        required
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="e.g. farmer@okhdfcbank"
                        className="w-full p-3 border border-green-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green text-sm text-textPrimary bg-gray-50/50"
                      />
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-textSecondary block">Card Number</label>
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={e => setCardNumber(e.target.value)}
                          className="w-full p-3 border border-green-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green text-sm text-textPrimary bg-gray-50/50 text-center tracking-widest font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-textSecondary block">Expiry</label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={e => setCardExpiry(e.target.value)}
                            className="w-full p-3 border border-green-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green text-sm text-textPrimary bg-gray-50/50 text-center font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-textSecondary block">CVV</label>
                          <input
                            type="password"
                            required
                            maxLength="3"
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value)}
                            className="w-full p-3 border border-green-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green text-sm text-textPrimary bg-gray-50/50 text-center font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'csc' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-textSecondary block">CSC Operator Wallet ID</label>
                      <input
                        type="text"
                        required
                        value={cscWalletId}
                        onChange={e => setCscWalletId(e.target.value)}
                        className="w-full p-3 border border-green-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green text-sm text-textPrimary bg-gray-50/50 text-center font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-150 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(null)}
                    className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-textSecondary text-xs font-bold rounded-xl text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary-green hover:bg-green-700 text-white text-xs font-bold rounded-xl text-center active:scale-95 transition-all font-bold"
                  >
                    Pay & Enroll
                  </button>
                </div>
              </form>
            ) : paymentStep === 2 ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-12 h-12 border-4 border-primary-green border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-1">
                  <h4 className="font-bold text-textPrimary text-sm">Processing Payment</h4>
                  <p className="text-xs text-textSecondary animate-pulse font-medium">{paymentStatusText}</p>
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center animate-fadeIn">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-green-700 text-sm">Payment Successful!</h4>
                  <p className="text-xs text-textSecondary font-semibold">Premium paid. Your policy is now active.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
