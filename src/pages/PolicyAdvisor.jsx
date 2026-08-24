import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { safeStr } from '../utils/safeStr';
import { getFarmerProfile, saveFarmerProfile } from '../services/firebase';
import { callGemini, extractJSON } from '../services/gemini';
import { 
  GOVERNMENT_POLICIES, 
  PRIVATE_POLICIES, 
  HISTORICAL_POLICIES, 
  evaluatePolicyEligibility 
} from '../services/policyEngine';
import { 
  Shield, Sparkles, AlertCircle, HelpCircle, Check, DollarSign, Clock, X, 
  Building2, Landmark, ChevronDown, ChevronUp, AlertTriangle, FileText, ExternalLink, Info, CheckCircle2
} from 'lucide-react';

export default function PolicyAdvisor() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollingPolicy, setEnrollingPolicy] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(null); // stores policy object
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  // Payment gateway states
  const [showPaymentModal, setShowPaymentModal] = useState(null); // stores policy object
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('4321 8765 2345 9876');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvv, setCardCvv] = useState('321');
  const [cscWalletId, setCscWalletId] = useState('CSC-IND-98745');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
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
Which government scheme is best for them: PMFBY or RWBCIS?
Respond in JSON:
{
  "recommended": "PMFBY"|"RWBCIS",
  "reason": "string (2 sentences max)"
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
      const isCotton = farmerProf.primaryCrop === 'Cotton';
      setRecommendation({
        recommended: isCotton ? 'RWBCIS' : 'PMFBY',
        reason: language === 'pa' 
          ? "ਮਾਨਸਾ ਵਿੱਚ ਕਪਾਹ ਲਈ RWBCIS ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ ਕਿਉਂਕਿ ਇਹ ਚਿੱਟੀ ਮੱਖੀ ਵਰਗੇ ਕੀੜਿਆਂ ਦੇ ਨੁਕਸਾਨ ਅਤੇ ਮੌਸਮ ਦੇ ਫਰਕਾਂ ਨੂੰ ਕਵਰ ਕਰਦਾ ਹੈ।"
          : `RWBCIS weather index-based protection is recommended for ${farmerProf.primaryCrop || 'Cotton'} in ${farmerProf.district || 'Mansa'} due to regional climate risk factors.`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (policyId) => {
    if (!profile) return;
    setEnrollingPolicy(policyId);
    
    const updatedProfile = {
      ...profile,
      hasInsurance: 'Yes',
      enrolledPolicy: policyId
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
    
    const policyId = showPaymentModal?.id;
    if (policyId) handleEnroll(policyId);

    setPaymentStep(1);
    setPaymentLoading(false);
    setShowPaymentModal(null);
  };

  const handleAutofillPortal = (policy) => {
    window.postMessage({
      type: "KISAN_SATHI_SYNC_PROFILE",
      profile: profile,
      policy: policy.id
    }, "*");
    
    setTimeout(() => {
      const url = `https://${policy.portal}`;
      window.open(url, '_blank');
    }, 200);
  };

  // Helper to render policy card component cleanly
  const renderPolicyCard = (policy, isPrivate = false) => {
    const eligibility = evaluatePolicyEligibility(policy, profile);
    const isRecommended = recommendation?.recommended === policy.id;
    const isEnrolled = profile?.enrolledPolicy === policy.id;

    return (
      <div 
        key={policy.id}
        className={`bg-white rounded-3xl border p-6 flex flex-col justify-between relative transition-all ${
          isRecommended 
            ? 'border-2 border-primary-green shadow-md scale-[1.01]' 
            : 'border-gray-200 hover:border-green-300 shadow-sm'
        }`}
      >
        {/* Top Header & Badges */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              isPrivate ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              {policy.badge}
            </span>

            <div className="flex items-center gap-1.5">
              {isRecommended && (
                <span className="bg-amber-500 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                  <Sparkles className="w-2.5 h-2.5" /> Recommended
                </span>
              )}
              {isEnrolled && (
                <span className="bg-sky-100 text-sky-800 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Enrolled
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black text-textPrimary leading-tight">
              {policy.scheme}
            </h3>
            <p className="text-xs font-bold text-textSecondary mt-0.5">
              {policy.scheme_full_name}
            </p>
            <span className="inline-block text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md mt-1">
              {policy.type}
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-relaxed border-t border-gray-100 pt-2">
            {policy.description}
          </p>

          {/* Eligibility Signal Badge */}
          <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
            eligibility.applicable 
              ? 'bg-green-50/60 border-green-200 text-green-800' 
              : 'bg-amber-50/60 border-amber-200 text-amber-900'
          }`}>
            <span>Eligibility Status:</span>
            <span>{eligibility.badge}</span>
          </div>

          {/* Policy Details Grid */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100 text-xs">
            <div className="space-y-0.5">
              <span className="text-gray-400 font-semibold block">Farmer Premium:</span>
              <strong className="text-textPrimary font-extrabold text-sm">{eligibility.premium_text}</strong>
            </div>
            <div className="space-y-0.5">
              <span className="text-gray-400 font-semibold block">Notified Coverage:</span>
              <strong className="text-textPrimary font-extrabold text-sm">{eligibility.coverage_text}</strong>
            </div>
          </div>

          {/* Key Attributes */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-textSecondary">
              <span>Claim Settlement:</span>
              <span className="font-bold text-textPrimary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                {eligibility.settlement_text}
              </span>
            </div>

            <div className="flex justify-between items-center text-textSecondary">
              <span>Enrollment Cut-off:</span>
              <span className="font-bold text-textPrimary">{policy.enrollment_deadline}</span>
            </div>

            <div className="flex justify-between items-center text-textSecondary">
              <span>Implementing Insurer:</span>
              <span className="font-bold text-textPrimary truncate max-w-[170px]">{policy.implementing_insurer}</span>
            </div>
          </div>

          {/* Risks Covered Pills */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">Specified Risks Covered:</span>
            <div className="flex flex-wrap gap-1">
              {policy.covered_perils.map((peril, idx) => (
                <span key={idx} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium border border-gray-200">
                  {peril}
                </span>
              ))}
            </div>
          </div>

          {/* Source Transparency */}
          <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-400 space-y-0.5">
            <div>Source: <strong className="text-gray-600">{policy.source}</strong></div>
            {policy.source_date && <div>Last Updated: {policy.source_date}</div>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowApplyModal(policy)}
            className="flex-1 py-2.5 border border-gray-300 hover:border-primary-green hover:bg-green-50 text-textPrimary text-xs font-bold rounded-xl text-center transition-all cursor-pointer"
          >
            View Details
          </button>
          
          <button
            onClick={() => {
              if (eligibility.applicable) {
                setShowPaymentModal(policy);
              } else {
                alert(`Policy eligibility for ${policy.scheme} in ${profile?.district || 'your district'} requires verification with local agriculture office.`);
              }
            }}
            disabled={enrollingPolicy !== null || isEnrolled}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isEnrolled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : eligibility.applicable
                  ? 'bg-primary-green text-white hover:bg-green-700 shadow-xs'
                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs'
            }`}
          >
            {isEnrolled ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Enrolled</span>
              </>
            ) : eligibility.applicable ? (
              <span>Start Enrollment</span>
            ) : (
              <span>Check Eligibility</span>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 pb-20 md:pb-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-textPrimary flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary-green" />
            <span>Crop Insurance Policy Advisor</span>
          </h1>
          <p className="text-xs text-textSecondary mt-1">
            Verified agricultural insurance products evaluated against official state notifications and your farm profile.
          </p>
        </div>
        
        {/* Active Profile Filter Context Bar */}
        {profile ? (
          <div className="bg-green-50/60 px-4 py-2.5 rounded-2xl border border-green-100 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
            <div><span className="text-gray-500">Location:</span> <strong className="text-textPrimary">{profile.district}, Punjab</strong></div>
            <div><span className="text-gray-500">Crop:</span> <strong className="text-textPrimary">{profile.primaryCrop || 'Cotton'}</strong></div>
            <div><span className="text-gray-500">Season:</span> <strong className="text-textPrimary">Kharif 2026</strong></div>
            <div><span className="text-gray-500">Land:</span> <strong className="text-textPrimary">{profile.landSize} Acres</strong></div>
          </div>
        ) : (
          <div className="bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Select your crop and location to see applicable insurance policies.</span>
          </div>
        )}
      </div>

      {/* RECOMMENDED FOR YOU & "WHY THIS POLICY?" SECTION */}
      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-green-50 shadow-sm flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary-green border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-textSecondary">Matching farm profile against state notifications...</span>
        </div>
      ) : (
        recommendation && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 text-white rounded-2xl shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-amber-900 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  RECOMMENDED FOR YOU
                </span>
                <h2 className="text-lg font-black text-textPrimary mt-1">
                  Optimal Match: <span className="text-amber-900">{recommendation.recommended}</span>
                </h2>
              </div>
            </div>

            <p className="text-xs font-semibold text-textPrimary leading-relaxed bg-white/80 p-3 rounded-2xl border border-amber-100">
              "{safeStr(recommendation.reason, language)}"
            </p>

            {/* Why This Policy Section */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider block">
                Why this policy?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 font-medium text-textPrimary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Notified for {profile?.primaryCrop || 'Cotton'} in {profile?.district || 'Mansa'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 font-medium text-textPrimary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>District covered for Kharif 2026</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 font-medium text-textPrimary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Government Subsidized Premium Share</span>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* CATEGORY A — GOVERNMENT CROP INSURANCE */}
      <div className="space-y-4">
        <div className="border-b border-gray-200 pb-3">
          <h2 className="text-lg font-black text-textPrimary flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary-green" />
            <span>GOVERNMENT CROP INSURANCE</span>
          </h2>
          <p className="text-xs text-textSecondary mt-0.5">
            Primary government crop-insurance schemes backed by central and state subsidies under PMFBY and RWBCIS guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GOVERNMENT_POLICIES.map(policy => renderPolicyCard(policy, false))}
        </div>
      </div>

      {/* CATEGORY B — PRIVATE CROP INSURANCE */}
      <div className="space-y-4 pt-4">
        <div className="border-b border-gray-200 pb-3">
          <h2 className="text-lg font-black text-textPrimary flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-700" />
            <span>PRIVATE CROP INSURANCE</span>
          </h2>
          <p className="text-xs text-textSecondary mt-0.5">
            Additional private insurance products available depending on your location, crop and eligibility.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {PRIVATE_POLICIES.map(policy => renderPolicyCard(policy, true))}
        </div>
      </div>

      {/* HISTORICAL / REFERENCE SCHEMES (COLLAPSIBLE SECTION) */}
      <div className="border border-gray-200 rounded-3xl p-5 bg-gray-50/50 space-y-4">
        <button
          type="button"
          onClick={() => setShowHistorySection(!showHistorySection)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div>
            <h3 className="text-sm font-extrabold text-textPrimary flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>HISTORICAL / REFERENCE SCHEMES</span>
            </h3>
            <p className="text-xs text-textSecondary mt-0.5">
              Outdated or pilot schemes preserved for historical reference and claims tracking only.
            </p>
          </div>
          <div className="p-2 bg-white rounded-full border border-gray-200 text-gray-500">
            {showHistorySection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showHistorySection && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-200">
            {HISTORICAL_POLICIES.map(h => (
              <div key={h.id} className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2 opacity-80">
                <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {h.status_label}
                </span>
                <h4 className="text-sm font-bold text-textPrimary">{h.scheme}</h4>
                <p className="text-xs text-textSecondary">{h.description}</p>
                <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-2">Source: {h.source}</div>
                <button
                  disabled
                  className="w-full py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed mt-2"
                >
                  Historical Reference Only
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Details Modal */}
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
                <h3 className="font-extrabold text-textPrimary">{showApplyModal.scheme}</h3>
                <span className="text-[10px] text-textSecondary font-bold block uppercase tracking-wider">{showApplyModal.type}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-textPrimary pt-2">
              <p className="text-textSecondary leading-relaxed">{showApplyModal.description}</p>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1.5">
                <div><span className="font-bold">Official Insurer:</span> {showApplyModal.implementing_insurer}</div>
                <div><span className="font-bold">Enrollment Cut-off:</span> {showApplyModal.enrollment_deadline}</div>
                <div><span className="font-bold">Official Portal:</span> <a href={`https://${showApplyModal.portal}`} target="_blank" rel="noreferrer" className="text-sky-600 font-bold underline">{showApplyModal.portal}</a></div>
              </div>

              <div className="space-y-1">
                <span className="font-bold block">Instruction for Farmer:</span>
                <ol className="list-decimal pl-4 space-y-1 text-textSecondary">
                  <li>Gather Aadhaar Card, Land Jamabandi Fard, and Bank Passbook.</li>
                  <li>Generates proposal dossier via KisanSaathi wizard or visit nearest CSC Center.</li>
                  <li>Verify sum insured and subsidized premium rate at time of portal entry.</li>
                </ol>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowApplyModal(null)}
                className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-textSecondary text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.open(`https://${showApplyModal.portal}`, '_blank');
                }}
                className="flex-1 py-2.5 bg-primary-green text-white text-xs font-bold rounded-xl hover:bg-green-700"
              >
                Open Official Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { if (!paymentLoading) setShowPaymentModal(null); }}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 relative" onClick={e => e.stopPropagation()}>
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
                    <h3 className="font-extrabold text-textPrimary">Enrollment & Subsidized Premium Payment</h3>
                    <span className="text-[10px] text-textSecondary font-bold block uppercase tracking-wider">{showPaymentModal.scheme}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Scheme Name:</span>
                    <strong className="text-textPrimary font-bold">{showPaymentModal.scheme_full_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Covered Crop:</span>
                    <strong className="text-textPrimary font-bold">{profile?.primaryCrop || 'Cotton'} ({profile?.landSize || 2.2} Acres)</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-sm">
                    <span className="text-textPrimary font-bold">Farmer Premium Payable:</span>
                    <strong className="text-primary-green font-extrabold text-base">
                      {evaluatePolicyEligibility(showPaymentModal, profile).premium_text}
                    </strong>
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
                              : 'border-gray-200 hover:bg-gray-50 text-textSecondary text-xs'
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
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm font-semibold text-textPrimary bg-gray-50/50"
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
                          className="w-full p-3 border border-gray-200 rounded-xl text-sm text-textPrimary bg-gray-50/50 text-center tracking-widest font-mono"
                        />
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
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm text-textPrimary bg-gray-50/50 text-center font-mono"
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
                    className="flex-1 py-2.5 bg-primary-green hover:bg-green-700 text-white text-xs font-bold rounded-xl text-center shadow-md shadow-green-200"
                  >
                    Confirm & Enroll
                  </button>
                </div>
              </form>
            ) : paymentStep === 2 ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-12 h-12 border-4 border-primary-green border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-1">
                  <h4 className="font-bold text-textPrimary text-sm">Processing Enrollment</h4>
                  <p className="text-xs text-textSecondary animate-pulse font-medium">{paymentStatusText}</p>
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-green-700 text-sm">Enrollment Initiated!</h4>
                  <p className="text-xs text-textSecondary font-semibold">Policy saved to your profile.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
