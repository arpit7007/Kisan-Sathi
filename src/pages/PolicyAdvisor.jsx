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
  Shield, Sparkles, AlertCircle, HelpCircle, Check, Clock, X, 
  Building2, Landmark, ChevronDown, ChevronUp, FileText, ExternalLink, CheckCircle2, ArrowRight, FileCheck
} from 'lucide-react';

export default function PolicyAdvisor() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollingPolicy, setEnrollingPolicy] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(null); // stores policy object
  const [showEnrollModal, setShowEnrollModal] = useState(null); // stores policy object for assisted enrollment
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

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

  const handleEnrollDirect = async (policy) => {
    if (!profile) return;
    setEnrollingPolicy(policy.id);
    
    const updatedProfile = {
      ...profile,
      hasInsurance: 'Yes',
      enrolledPolicy: policy.id
    };

    const success = await saveFarmerProfile(profile.uid, updatedProfile);
    if (success) {
      setEnrollSuccess(true);
      setTimeout(() => {
        setEnrollSuccess(false);
        setEnrollingPolicy(null);
        navigate('/enroll');
      }, 800);
    }
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
                setShowEnrollModal(policy);
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

      {/* --- ASSISTED ENROLLMENT MODAL (REPLACES DIRECT PAYMENT MODAL) --- */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEnrollModal(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 relative animate-fadeIn" onClick={e => e.stopPropagation()}>
            <button className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full" onClick={() => setShowEnrollModal(null)}>
              <X className="w-5 h-5 text-gray-500" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 text-primary-green rounded-2xl">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-textPrimary text-base">Start Assisted Enrollment</h3>
                <span className="text-[10px] text-textSecondary font-bold block uppercase tracking-wider">{showEnrollModal.scheme_full_name}</span>
              </div>
            </div>

            {/* Official Compliance Notice Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Official Process & Premium Collection Notice
              </span>
              <p className="opacity-90 leading-relaxed text-[11px]">
                KisanSaathi provides <strong>assisted pre-enrollment & proposal dossier generation</strong>. 
                KisanSaathi does <em>not</em> collect premium payments directly. Final subsidized premium payments and official policy issuance take place at authorized Bank branches, CSC Centers, or official government portals (<code className="bg-amber-100 px-1 py-0.5 rounded">pmfby.gov.in</code>).
              </p>
            </div>

            {/* 2 Assisted Enrollment Pathways */}
            <div className="space-y-3 pt-1">
              {/* PATHWAY 1: DOSSIER WIZARD */}
              <div className="border border-green-200 rounded-2xl p-4 bg-green-50/40 hover:bg-green-50/80 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-green-900 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary-green" /> Pathway 1 (Recommended)
                  </span>
                  <span className="text-[9px] font-extrabold bg-green-200 text-green-900 px-2 py-0.5 rounded-full">
                    Dossier PDF
                  </span>
                </div>

                <h4 className="text-sm font-bold text-textPrimary">Generate Proposal Dossier PDF (Wizard)</h4>
                <p className="text-[11px] text-textSecondary leading-normal">
                  Scan Aadhaar & Land Jamabandi with AI OCR to build your official 5-Page Enrollment Dossier to hand over at any CSC Center, Bank Branch, or PACS.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    handleEnrollDirect(showEnrollModal);
                  }}
                  className="w-full py-2.5 bg-primary-green hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <span>Launch Dossier Generator Wizard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* PATHWAY 2: DIRECT ONLINE PORTAL */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 hover:bg-gray-100/50 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Pathway 2
                  </span>
                  <span className="text-[9px] font-extrabold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                    {showEnrollModal.portal}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-textPrimary">Direct Official Online Enrollment</h4>
                <p className="text-[11px] text-textSecondary leading-normal">
                  Open the official government / insurer portal directly with KisanSaathi Extension profile autofill support.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    handleAutofillPortal(showEnrollModal);
                    setShowEnrollModal(null);
                  }}
                  className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-textPrimary font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
                  <span>Open Official Portal ({showEnrollModal.portal})</span>
                </button>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowEnrollModal(null)}
                className="text-xs font-bold text-textSecondary hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
