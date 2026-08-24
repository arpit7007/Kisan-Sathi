import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { safeStr } from '../utils/safeStr';
import { getClaims, addClaimStatusHistory } from '../services/firebase';
import { generateCropLossIntimationPDF } from '../services/pdf';
import { 
  CLAIM_STATUS_ENUM, 
  STATUS_SOURCES, 
  CLAIM_TYPE_CONFIG,
  getStatusGuidance 
} from '../services/claimTrackerEngine';
import { 
  Clock, CheckCircle2, AlertCircle, MessageSquare, ShieldCheck, Download, 
  PhoneCall, ExternalLink, ArrowLeft, ArrowRight, Filter, Plus, FileText, 
  Upload, Shield, AlertTriangle, Building2, Landmark, Globe, Check, Edit3, X, CreditCard, Lock
} from 'lucide-react';

export default function ClaimTracker() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { claimId: urlClaimId } = useParams();

  const [claims, setClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Active Interactive Modal Step: null | 3 | 4 | 5 | 6 | 'CORRECTION'
  const [activeModalStep, setActiveModalStep] = useState(null);

  // Step 3 Inputs (Official Intimation)
  const [intimationRef, setIntimationRef] = useState('');
  const [intimationChannel, setIntimationChannel] = useState('Krishi Rakshak Helpline 14447');
  const [intimationDate, setIntimationDate] = useState(new Date().toISOString().split('T')[0]);
  const [intimationNote, setIntimationNote] = useState('');
  const [intimationFile, setIntimationFile] = useState(null);

  // Step 4 Inputs (Assessment Update)
  const [assessmentSource, setAssessmentSource] = useState('FARMER_REPORTED');
  const [assessmentStatus, setAssessmentStatus] = useState('ASSESSMENT_IN_PROGRESS');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [assessmentRef, setAssessmentRef] = useState('');
  const [assessmentOfficer, setAssessmentOfficer] = useState('');
  const [assessmentNote, setAssessmentNote] = useState('');
  const [assessmentFile, setAssessmentFile] = useState(null);

  // Step 5 Inputs (Claim Decision Update)
  const [decisionSource, setDecisionSource] = useState('FARMER_REPORTED');
  const [decisionStatus, setDecisionStatus] = useState('CLAIM_APPROVED');
  const [decisionDate, setDecisionDate] = useState(new Date().toISOString().split('T')[0]);
  const [decisionRef, setDecisionRef] = useState('');
  const [farmerReportedAmount, setFarmerReportedAmount] = useState('40000');
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionFile, setDecisionFile] = useState(null);

  // Step 6 Inputs (Payment Update)
  const [paymentSource, setPaymentSource] = useState('FARMER_REPORTED');
  const [paymentStatus, setPaymentStatus] = useState('PAYMENT_COMPLETED');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [farmerReportedPaymentAmount, setFarmerReportedPaymentAmount] = useState('40000');
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentBank, setPaymentBank] = useState('State Bank of India');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentFile, setPaymentFile] = useState(null);

  // Correction Form Inputs
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('kisan_current_uid');
    if (!uid) {
      navigate('/onboard');
      return;
    }

    getClaims(uid).then(data => {
      let loaded = data || [];
      const savedReportStr = localStorage.getItem('kisan_active_loss_report');
      if (savedReportStr) {
        try {
          const saved = JSON.parse(savedReportStr);
          if (saved && saved.internalReportId) {
            const exists = loaded.some(c => (c.claimId || c.internalReportId) === saved.internalReportId);
            if (!exists) {
              loaded = [saved, ...loaded];
            }
          }
        } catch (e) {}
      }

      setClaims(loaded);
      setLoading(false);

      if (urlClaimId) {
        const found = loaded.find(c => (c.claimId || c.internalReportId) === urlClaimId);
        if (found) setSelectedClaim(found);
      } else if (loaded.length > 0) {
        setSelectedClaim(loaded[0]);
      }
    });
  }, [navigate, urlClaimId]);

  const handleSelectClaim = (c) => {
    setSelectedClaim(c);
  };

  // Helper to calculate 72h window countdown
  const renderReportingTimer = (claim) => {
    if (claim.officialClaimId || claim.status === 'OFFICIAL_INTIMATION_RECORDED') {
      return null;
    }

    const lossTime = new Date(`${claim.eventDate || new Date().toISOString().split('T')[0]}T${claim.eventTime || '12:00'}`).getTime();
    const deadline = lossTime + 72 * 60 * 60 * 1000;
    const diff = deadline - currentTime;

    if (diff <= 0) {
      return (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            ⚠ STANDARD 72-HOUR REPORTING WINDOW MAY HAVE EXPIRED
          </div>
          <p className="text-[11px] leading-normal">
            You can still report this loss directly to Krishi Rakshak Helpline 14447 or your bank branch for official guidance.
          </p>
        </div>
      );
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    let badgeStyle = 'bg-green-50 border-green-300 text-green-900';
    if (hours < 24) badgeStyle = 'bg-amber-50 border-amber-300 text-amber-900';
    if (hours < 6) badgeStyle = 'bg-red-50 border-red-300 text-red-950 font-bold';

    return (
      <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${badgeStyle}`}>
        <div className="flex items-center justify-between font-extrabold">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            ⚠ URGENT LOSS REPORTING DEADLINE (PMFBY 72H WINDOW)
          </span>
          <span className="font-mono text-sm">
            {hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')} remaining
          </span>
        </div>
        <p className="text-[11px] leading-normal">
          PMFBY guidelines require localized/post-harvest crop losses to be intimated within 72 hours of damage occurrence.
        </p>
        <div className="pt-1 flex gap-2">
          <a
            href="tel:14447"
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-2xs"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call Helpline 14447
          </a>
          <button
            onClick={() => setActiveModalStep(3)}
            className="px-3 py-1.5 bg-white border border-red-300 text-red-800 font-bold text-xs rounded-xl"
          >
            Record Reference
          </button>
        </div>
      </div>
    );
  };

  // SAVE STEP 3: OFFICIAL INTIMATION UPDATE
  const handleSaveStep3 = async () => {
    if (!intimationRef || intimationRef.trim().length < 4) {
      alert("Please enter a valid Official Intimation Reference ID issued by 14447 or Bank.");
      return;
    }
    const targetId = selectedClaim.claimId || selectedClaim.internalReportId;
    const uid = localStorage.getItem('kisan_current_uid');

    const historyEvent = {
      step: 3,
      status: 'OFFICIAL_INTIMATION_RECORDED',
      source: 'FARMER_REPORTED',
      message: `Official loss intimation reference recorded via ${intimationChannel}. Notes: ${intimationNote || 'None'}`,
      officialReference: intimationRef,
      updatedBy: 'Farmer User',
      evidenceName: intimationFile ? intimationFile.name : null
    };

    await addClaimStatusHistory(uid, targetId, historyEvent);
    updateLocalClaimState(targetId, historyEvent, {
      officialClaimId: intimationRef,
      officialChannel: intimationChannel,
      step3Completed: true
    });
    setActiveModalStep(null);
    alert("Step 3 Official Intimation Reference saved successfully!");
  };

  // SAVE STEP 4: ASSESSMENT UPDATE
  const handleSaveStep4 = async () => {
    if (!isStep3Completed) {
      alert("Prerequisite Required: Step 3 (Official Loss Intimation Reference) must be recorded before saving an assessment update.");
      return;
    }
    const targetId = selectedClaim.claimId || selectedClaim.internalReportId;
    const uid = localStorage.getItem('kisan_current_uid');
    const sObj = CLAIM_STATUS_ENUM[assessmentStatus] || { label: assessmentStatus };

    const historyEvent = {
      step: 4,
      status: assessmentStatus,
      source: assessmentSource,
      message: `Assessment update recorded: ${sObj.label}. Officer/Agency: ${assessmentOfficer || 'N/A'}. Ref: ${assessmentRef || 'N/A'}. ${assessmentNote}`,
      updatedBy: 'Farmer User',
      evidenceName: assessmentFile ? assessmentFile.name : null
    };

    await addClaimStatusHistory(uid, targetId, historyEvent);
    updateLocalClaimState(targetId, historyEvent, { step4Completed: true, assessmentStatus });
    setActiveModalStep(null);
    alert("Step 4 Assessment update recorded successfully!");
  };

  // SAVE STEP 5: CLAIM DECISION UPDATE
  const handleSaveStep5 = async () => {
    if (!isStep4Completed) {
      alert("Prerequisite Required: Step 4 (Assessment Update) must be recorded before saving a claim decision.");
      return;
    }
    const targetId = selectedClaim.claimId || selectedClaim.internalReportId;
    const uid = localStorage.getItem('kisan_current_uid');
    const sObj = CLAIM_STATUS_ENUM[decisionStatus] || { label: decisionStatus };

    const historyEvent = {
      step: 5,
      status: decisionStatus,
      source: decisionSource,
      message: `Claim decision update: ${sObj.label}. Farmer Reported Approved Amount: ₹${farmerReportedAmount || '0'}. Reason: ${decisionReason || 'N/A'}`,
      farmerReportedAmount: farmerReportedAmount || null,
      updatedBy: 'Farmer User',
      evidenceName: decisionFile ? decisionFile.name : null
    };

    await addClaimStatusHistory(uid, targetId, historyEvent);
    updateLocalClaimState(targetId, historyEvent, { step5Completed: true, decisionStatus, farmerReportedAmount });
    setActiveModalStep(null);
    alert("Step 5 Claim decision update recorded successfully!");
  };

  // SAVE STEP 6: PAYMENT UPDATE
  const handleSaveStep6 = async () => {
    if (!isStep5Completed) {
      alert("Prerequisite Required: Step 5 (Official Claim Decision) must be recorded before saving payment details.");
      return;
    }
    const targetId = selectedClaim.claimId || selectedClaim.internalReportId;
    const uid = localStorage.getItem('kisan_current_uid');
    const sObj = CLAIM_STATUS_ENUM[paymentStatus] || { label: paymentStatus };

    const historyEvent = {
      step: 6,
      status: paymentStatus,
      source: paymentSource,
      message: `Payment update: ${sObj.label}. Farmer Reported Payment: ₹${farmerReportedPaymentAmount || '0'}. UTR: ${paymentUtr || 'N/A'}. Bank: ${paymentBank}`,
      farmerReportedPaymentAmount: farmerReportedPaymentAmount || null,
      utrRef: paymentUtr || null,
      updatedBy: 'Farmer User',
      evidenceName: paymentFile ? paymentFile.name : null
    };

    await addClaimStatusHistory(uid, targetId, historyEvent);
    updateLocalClaimState(targetId, historyEvent, { step6Completed: true, paymentStatus, farmerReportedPaymentAmount });
    setActiveModalStep(null);
    alert("Step 6 Payment update recorded successfully!");
  };

  // SAVE CORRECTION EVENT
  const handleSaveCorrection = async () => {
    if (!correctionReason) {
      alert("Please provide a reason for this status correction.");
      return;
    }
    const targetId = selectedClaim.claimId || selectedClaim.internalReportId;
    const uid = localStorage.getItem('kisan_current_uid');

    const historyEvent = {
      status: selectedClaim.status || 'CORRECTION_LOGGED',
      source: 'FARMER_REPORTED',
      message: `CORRECTION LOGGED: Previous entry corrected by farmer. Reason: ${correctionReason}. ${correctionNote}`,
      isCorrection: true,
      updatedBy: 'Farmer User'
    };

    await addClaimStatusHistory(uid, targetId, historyEvent);
    updateLocalClaimState(targetId, historyEvent, {});
    setActiveModalStep(null);
    setCorrectionReason('');
    setCorrectionNote('');
    alert("Correction event added to audit history log!");
  };

  // Helper to update state and local storage
  const updateLocalClaimState = (targetId, historyEvent, extraFields = {}) => {
    const updatedClaims = claims.map(c => {
      if ((c.claimId || c.internalReportId) === targetId) {
        const history = c.statusHistory || [];
        return {
          ...c,
          ...extraFields,
          status: historyEvent.status || c.status,
          statusSource: historyEvent.source || c.statusSource || 'FARMER_REPORTED',
          updatedAt: new Date().toISOString(),
          statusHistory: [...history, { ...historyEvent, timestamp: new Date().toISOString() }]
        };
      }
      return c;
    });

    setClaims(updatedClaims);
    const updatedSelected = updatedClaims.find(c => (c.claimId || c.internalReportId) === targetId);
    setSelectedClaim(updatedSelected);
  };

  const handleDownloadPDF = (c) => {
    generateCropLossIntimationPDF({
      internalReportId: c.internalReportId || c.claimId,
      officialClaimId: c.officialClaimId,
      farmerName: c.farmerName || 'Bhushan Diwakar',
      aadhaarMasked: c.aadhaarMasked || 'XXXX XXXX 6032',
      policyScheme: c.policyScheme || 'PMFBY',
      policyId: c.policyId || 'PMF-2026-8912',
      policyCrop: c.policyCrop || c.crop || 'Cotton',
      insurer: c.insurer || 'AIC / Agriculture Insurance Company of India',
      khasraNo: c.khasraNo || '18/2 (2-0)',
      insuredArea: c.insuredArea || `${c.acresAffected || 2.2} Acres`,
      affectedArea: c.affectedArea || `${c.acresAffected || 2.2} Acres`,
      eventType: c.eventType || c.damageType || 'Flood & Inundation',
      eventDate: c.eventDate || new Date().toISOString().split('T')[0],
      eventTime: c.eventTime || '14:00',
      gpsCoords: c.gpsCoords,
      aiCrop: c.aiCrop,
      aiDamage: c.aiDamage,
      aiConfidence: c.aiConfidence
    });
  };

  // Sequential Prerequisite Calculations for Selected Claim
  const isStep3Completed = !!selectedClaim?.officialClaimId || !!selectedClaim?.step3Completed || selectedClaim?.statusHistory?.some(h => h.step === 3 || h.status === 'OFFICIAL_INTIMATION_RECORDED');
  const isStep4Completed = !!selectedClaim?.step4Completed || selectedClaim?.statusHistory?.some(h => h.step === 4 || h.status === 'ASSESSMENT_COMPLETED' || h.status === 'ASSESSMENT_IN_PROGRESS');
  const isStep5Completed = !!selectedClaim?.step5Completed || selectedClaim?.statusHistory?.some(h => h.step === 5 || h.status === 'CLAIM_APPROVED' || h.status === 'CLAIM_REJECTED' || h.status === 'CLAIM_PARTIALLY_APPROVED');
  const isStep6Completed = !!selectedClaim?.step6Completed || selectedClaim?.statusHistory?.some(h => h.step === 6 || h.status === 'PAYMENT_COMPLETED');

  const handleOpenModal = (stepNum) => {
    if (!selectedClaim) return;

    if (stepNum === 4 && !isStep3Completed) {
      alert("Prerequisite Required: You must record Step 3 (Official Loss Intimation Reference ID) before recording an assessment update.");
      return;
    }

    if (stepNum === 5 && !isStep4Completed) {
      alert("Prerequisite Required: You must record Step 4 (Assessment Update) before recording an official claim decision.");
      return;
    }

    if (stepNum === 6 && !isStep5Completed) {
      alert("Prerequisite Required: You must record Step 5 (Official Claim Decision) before recording payment information.");
      return;
    }

    setActiveModalStep(stepNum);
  };

  // Filter Claims
  const filteredClaims = claims.filter(c => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PENDING_INTIMATION') return c.status === 'OFFICIAL_INTIMATION_PENDING' || !c.officialClaimId;
    if (activeFilter === 'ASSESSMENT') return c.status === 'ASSESSMENT_PENDING' || c.status === 'ASSESSMENT_IN_PROGRESS' || c.status === 'OFFICIAL_INTIMATION_RECORDED';
    if (activeFilter === 'APPROVED_PAID') return c.status === 'CLAIM_APPROVED' || c.status === 'PAYMENT_COMPLETED' || c.status === 'PAYMENT_PENDING';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-24 md:pb-8 mt-2">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-5 border border-green-50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-green-950 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary-green" />
            <span>Crop Loss Claim Progress Tracker</span>
          </h1>
          <p className="text-xs text-textSecondary mt-0.5">
            Interactive, farmer-updatable lifecycle tracker for loss intimations, field assessment, claim decisions & payment.
          </p>
        </div>

        <button
          onClick={() => navigate('/claim')}
          className="px-5 py-2.5 bg-primary-green hover:bg-green-700 text-white font-bold text-xs rounded-full flex items-center justify-center gap-1.5 shadow-md shadow-green-200 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Report New Crop Loss
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold">Loading claim records...</div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border text-center space-y-4 shadow-sm">
          <Shield className="w-12 h-12 text-gray-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-textPrimary">No Crop Loss Reports Found</h3>
            <p className="text-xs text-textSecondary">You have not created any crop loss intimation reports yet.</p>
          </div>
          <button
            onClick={() => navigate('/claim')}
            className="px-6 py-2.5 bg-primary-green text-white font-bold rounded-full text-xs shadow-md"
          >
            Create Your First Loss Intimation Report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ============================================================ */}
          {/* LEFT SIDEBAR: CLAIMS LIST & FILTER TABS (5 Cols) */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'PENDING_INTIMATION', label: 'Intimation Pending' },
                { id: 'ASSESSMENT', label: 'Assessment' },
                { id: 'APPROVED_PAID', label: 'Approved / Paid' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap border transition-all cursor-pointer ${
                    activeFilter === f.id ? 'bg-primary-green text-white border-primary-green shadow-2xs' : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Claim Cards List */}
            <div className="space-y-3">
              {filteredClaims.map((c) => {
                const cId = c.claimId || c.internalReportId;
                const isSelected = (selectedClaim?.claimId || selectedClaim?.internalReportId) === cId;
                const statusObj = CLAIM_STATUS_ENUM[c.status] || { label: c.status || 'Loss Report Created' };
                const isFarmerReported = (c.statusSource || 'FARMER_REPORTED') === 'FARMER_REPORTED';

                return (
                  <div
                    key={cId}
                    onClick={() => handleSelectClaim(c)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                      isSelected ? 'border-primary-green bg-green-50/40 shadow-sm' : 'border-gray-200 hover:border-green-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold bg-green-100 text-green-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {c.policyScheme || 'PMFBY'}
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        isFarmerReported ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {isFarmerReported ? '🔵 FARMER REPORTED' : '🟣 OFFICIALLY VERIFIED'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-textPrimary">
                        {c.policyCrop || c.crop || 'Cotton'} — {c.eventType || c.damageType || 'Crop Loss'}
                      </h4>
                      <p className="text-[11px] text-textSecondary">
                        Report ID: <strong className="font-mono text-textPrimary">{cId}</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-gray-100">
                      <div>
                        <span className="text-gray-400 block font-semibold">Loss Date:</span>
                        <strong className="text-textPrimary font-bold">{c.eventDate || '24/08/2026'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">Official Ref:</span>
                        <strong className="text-textPrimary font-mono">{c.officialClaimId || 'Not recorded'}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        {statusObj.label}
                      </span>
                      <span className="text-[11px] font-bold text-primary-green flex items-center gap-1">
                        Track Details <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT PANEL: DYNAMIC INTERACTIVE LIFE CYCLE TRACKER (7 Cols) */}
          {/* ============================================================ */}
          {selectedClaim && (
            <div className="lg:col-span-7 space-y-6">
              {/* Live 72-Hour Timer Warning */}
              {renderReportingTimer(selectedClaim)}

              {/* Claim Overview Header Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold bg-green-100 text-green-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedClaim.policyScheme || 'PMFBY'} — {selectedClaim.policyCrop || selectedClaim.crop || 'Cotton'}
                    </span>
                    <h2 className="text-lg font-black text-textPrimary mt-1">
                      {selectedClaim.eventType || selectedClaim.damageType || 'Crop Loss Event'}
                    </h2>
                  </div>

                  <button
                    onClick={() => handleDownloadPDF(selectedClaim)}
                    className="p-2.5 bg-green-50 hover:bg-green-100 text-primary-green font-bold rounded-2xl border border-green-200 flex items-center gap-1.5 text-xs transition-all cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" /> Download Loss Packet PDF
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block font-semibold">Policy ID:</span>
                    <strong className="text-textPrimary font-bold">{selectedClaim.policyId || 'PMF-2026-8912'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Loss Date:</span>
                    <strong className="text-textPrimary font-bold">{selectedClaim.eventDate || '24/08/2026'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">KisanSaathi Ref:</span>
                    <strong className="text-textPrimary font-mono text-[11px]">{selectedClaim.internalReportId || selectedClaim.claimId}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Official Ref:</span>
                    <strong className="text-textPrimary font-mono text-[11px]">{selectedClaim.officialClaimId || 'Not recorded'}</strong>
                  </div>
                </div>

                {/* Status Guidance Banner */}
                {(() => {
                  const guidance = getStatusGuidance(selectedClaim.status, selectedClaim);
                  return (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>STATUS: {CLAIM_STATUS_ENUM[selectedClaim.status]?.label || selectedClaim.status || 'Loss Report Created'}</span>
                        </h4>
                        <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          (selectedClaim.statusSource || 'FARMER_REPORTED') === 'FARMER_REPORTED' ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {(selectedClaim.statusSource || 'FARMER_REPORTED') === 'FARMER_REPORTED' ? '🔵 FARMER REPORTED' : '🟣 OFFICIALLY VERIFIED'}
                        </span>
                      </div>

                      <div className="space-y-1 text-amber-900">
                        <div><strong className="text-amber-950">What does this mean?</strong> {guidance.meaning}</div>
                        <div><strong className="text-amber-950">What do I need to do?</strong> {guidance.actionRequired}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ============================================================ */}
              {/* DYNAMIC INTERACTIVE STAGE LIFECYCLE (STEPS 1 TO 6) */}
              {/* ============================================================ */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-5">
                <h3 className="text-sm font-extrabold text-textPrimary uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary-green" /> Interactive 6-Stage Claim Lifecycle Tracker
                </h3>

                <div className="space-y-4 text-xs">
                  {/* STEP 1: Loss Report Created */}
                  <div className="p-4 rounded-2xl border border-green-200 bg-green-50/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green-950 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> 1. Loss Report Created in KisanSaathi
                      </span>
                      <span className="text-[9px] font-extrabold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">🟢 KISANSAATHI</span>
                    </div>
                    <p className="text-[11px] text-textSecondary">Internal Report ID: <strong className="font-mono text-textPrimary">{selectedClaim.internalReportId || selectedClaim.claimId}</strong></p>
                  </div>

                  {/* STEP 2: Evidence & GPS Captured */}
                  <div className="p-4 rounded-2xl border border-green-200 bg-green-50/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green-950 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> 2. Damage Photo Evidence & GPS Captured
                      </span>
                      <span className="text-[9px] font-extrabold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">🟢 KISANSAATHI</span>
                    </div>
                    <p className="text-[11px] text-textSecondary">Photos uploaded & GPS location metadata linked to parcel.</p>
                  </div>

                  {/* STEP 3: Official Loss Intimation */}
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    selectedClaim.officialClaimId ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-textPrimary text-xs flex items-center gap-1.5">
                        {selectedClaim.officialClaimId ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                        3. Official Loss Intimation (Helpline 14447 / Bank / Portal)
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        selectedClaim.officialClaimId ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedClaim.officialClaimId ? '🔵 FARMER REPORTED' : '🟡 ACTION REQUIRED'}
                      </span>
                    </div>
                    {selectedClaim.officialClaimId ? (
                      <p className="text-[11px] text-textSecondary">
                        Official Intimation Reference: <strong className="font-mono text-textPrimary">{selectedClaim.officialClaimId}</strong> ({selectedClaim.officialChannel || '14447'})
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-900">
                        Report loss to Helpline 14447 or Bank Branch, then click below to record reference.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveModalStep(3)}
                      className="px-3.5 py-1.5 bg-white border border-gray-300 hover:border-primary-green text-textPrimary font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-primary-green" />
                      <span>{selectedClaim.officialClaimId ? 'Update Official Reference' : '+ Record Official Intimation Reference'}</span>
                    </button>
                  </div>

                  {/* STEP 4: Assessment Update */}
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    isStep4Completed ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-textPrimary text-xs flex items-center gap-1.5">
                        {isStep4Completed ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-gray-400" />}
                        4. Assessment by Insurer / Authorized Agency
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        isStep4Completed ? 'bg-sky-100 text-sky-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {isStep4Completed ? '🔵 FARMER REPORTED' : '○ PENDING'}
                      </span>
                    </div>
                    <p className="text-[11px] text-textSecondary">
                      Field survey loss assessment or CCE yield evaluation procedure by insurer.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenModal(4)}
                      className={`px-3.5 py-1.5 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer transition-all ${
                        !isStep3Completed 
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                          : 'bg-white border border-gray-300 hover:border-indigo-500 text-textPrimary'
                      }`}
                    >
                      {!isStep3Completed ? <Lock className="w-3.5 h-3.5 text-gray-400" /> : <Plus className="w-3.5 h-3.5 text-indigo-600" />}
                      <span>{isStep4Completed ? 'Update Assessment Record' : '+ Record Assessment Update'}</span>
                    </button>
                    {!isStep3Completed && (
                      <span className="text-[10px] text-amber-800 block font-semibold mt-1">
                        🔒 Complete Step 3 (Official Loss Intimation Reference) first.
                      </span>
                    )}
                  </div>

                  {/* STEP 5: Claim Decision */}
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    isStep5Completed ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-textPrimary text-xs flex items-center gap-1.5">
                        {isStep5Completed ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-gray-400" />}
                        5. Official Claim Decision
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        isStep5Completed ? 'bg-sky-100 text-sky-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {isStep5Completed ? '🔵 FARMER REPORTED' : '○ PENDING'}
                      </span>
                    </div>
                    {selectedClaim.farmerReportedAmount && (
                      <p className="text-[11px] font-bold text-green-900">
                        Farmer Reported Approved Amount: ₹{selectedClaim.farmerReportedAmount}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenModal(5)}
                      className={`px-3.5 py-1.5 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer transition-all ${
                        !isStep4Completed 
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                          : 'bg-white border border-gray-300 hover:border-indigo-500 text-textPrimary'
                      }`}
                    >
                      {!isStep4Completed ? <Lock className="w-3.5 h-3.5 text-gray-400" /> : <Plus className="w-3.5 h-3.5 text-indigo-600" />}
                      <span>{isStep5Completed ? 'Update Decision Record' : '+ Record Claim Decision'}</span>
                    </button>
                    {!isStep4Completed && (
                      <span className="text-[10px] text-amber-800 block font-semibold mt-1">
                        🔒 Complete Step 4 (Assessment Update) first before recording a decision.
                      </span>
                    )}
                  </div>

                  {/* STEP 6: Payment via Direct Benefit Transfer */}
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    isStep6Completed ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-textPrimary text-xs flex items-center gap-1.5">
                        {isStep6Completed ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-gray-400" />}
                        6. Payment via Direct Benefit Transfer (DBT)
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        isStep6Completed ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {isStep6Completed ? '🔵 FARMER REPORTED PAYMENT' : '○ PENDING'}
                      </span>
                    </div>
                    {selectedClaim.farmerReportedPaymentAmount && (
                      <p className="text-[11px] font-bold text-emerald-900">
                        Farmer Reported Payment Disbursed: ₹{selectedClaim.farmerReportedPaymentAmount}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenModal(6)}
                      className={`px-3.5 py-1.5 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer transition-all ${
                        !isStep5Completed 
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                          : 'bg-white border border-gray-300 hover:border-emerald-500 text-textPrimary'
                      }`}
                    >
                      {!isStep5Completed ? <Lock className="w-3.5 h-3.5 text-gray-400" /> : <CreditCard className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>{isStep6Completed ? 'Update Payment Record' : '+ Record Payment Update'}</span>
                    </button>
                    {!isStep5Completed && (
                      <span className="text-[10px] text-amber-800 block font-semibold mt-1">
                        🔒 Complete Step 5 (Official Claim Decision) first before recording payment.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* MODALS FOR RECORDING STAGE UPDATES (STEPS 3, 4, 5, 6 & CORRECTION) */}
              {/* ============================================================ */}

              {/* STEP 3 MODAL: Official Intimation Reference */}
              {activeModalStep === 3 && (
                <div className="bg-gradient-to-br from-sky-50 to-blue-50/50 border-2 border-sky-300 rounded-3xl p-5 space-y-4 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-sky-200 pb-2">
                    <h4 className="font-extrabold text-sky-950 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-700" /> Step 3 — Record Official Loss Intimation Reference
                    </h4>
                    <button onClick={() => setActiveModalStep(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-sky-950 block mb-1">Official Reference Number (from 14447 / Bank)</label>
                      <input type="text" placeholder="e.g. NCIP-CLM-2026-90124" value={intimationRef} onChange={(e) => setIntimationRef(e.target.value)} className="w-full p-2.5 border border-sky-200 rounded-xl font-semibold bg-white" />
                    </div>

                    <div>
                      <label className="font-bold text-sky-950 block mb-1">Reporting Channel Used</label>
                      <select value={intimationChannel} onChange={(e) => setIntimationChannel(e.target.value)} className="w-full p-2.5 border border-sky-200 rounded-xl font-semibold bg-white">
                        <option value="Krishi Rakshak Helpline 14447">Krishi Rakshak Helpline 14447</option>
                        <option value="Home Bank Branch Counter">Home Bank Branch Counter</option>
                        <option value="Insurer District Office">Insurer District Office</option>
                        <option value="Official Online Portal (pmfby.gov.in)">Official Online Portal (pmfby.gov.in)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-sky-950 block mb-1">Upload Receipt / SMS Evidence Screenshot (Optional)</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setIntimationFile(e.target.files[0])} className="w-full p-2 bg-white border border-sky-200 rounded-xl" />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setActiveModalStep(null)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl">Cancel</button>
                    <button onClick={handleSaveStep3} className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl shadow-xs">Save Intimation Reference</button>
                  </div>
                </div>
              )}

              {/* STEP 4 MODAL: Assessment Update */}
              {activeModalStep === 4 && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 border-2 border-indigo-300 rounded-3xl p-5 space-y-4 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                    <h4 className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-700" /> Step 4 — Record Assessment Update (Farmer Reported)
                    </h4>
                    <button onClick={() => setActiveModalStep(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-indigo-950 block mb-1">Where did you receive this update?</label>
                      <select value={assessmentSource} onChange={(e) => setAssessmentSource(e.target.value)} className="w-full p-2.5 border border-indigo-200 rounded-xl font-semibold bg-white">
                        <option value="FARMER_REPORTED">Farmer Reported Update</option>
                        <option value="INSURER">Insurance Company</option>
                        <option value="OFFICIAL_PORTAL">PMFBY / Official Portal</option>
                        <option value="BANK">Bank Branch</option>
                        <option value="AGRICULTURE_DEPARTMENT">Agriculture Department</option>
                        <option value="ASSESSMENT_OFFICER">Assessment Officer / Surveyor</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-indigo-950 block mb-1">What happened?</label>
                      <select value={assessmentStatus} onChange={(e) => setAssessmentStatus(e.target.value)} className="w-full p-2.5 border border-indigo-200 rounded-xl font-semibold bg-white">
                        <option value="ASSESSMENT_PENDING">Assessment Not Started / Pending</option>
                        <option value="ASSESSMENT_IN_PROGRESS">Assessment Scheduled / In Progress</option>
                        <option value="ASSESSMENT_COMPLETED">Field Visit / Assessment Completed</option>
                        <option value="ADDITIONAL_INFORMATION_REQUIRED">Additional Information Requested</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-indigo-950 block mb-1">Assessment/Survey Ref (Optional)</label>
                      <input type="text" placeholder="e.g. SURV-9012" value={assessmentRef} onChange={(e) => setAssessmentRef(e.target.value)} className="w-full p-2.5 border border-indigo-200 rounded-xl font-semibold bg-white" />
                    </div>

                    <div>
                      <label className="font-bold text-indigo-950 block mb-1">Surveyor / Agency Name (Optional)</label>
                      <input type="text" placeholder="e.g. AIC Agri Survey Team" value={assessmentOfficer} onChange={(e) => setAssessmentOfficer(e.target.value)} className="w-full p-2.5 border border-indigo-200 rounded-xl font-semibold bg-white" />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-indigo-950 block mb-1">Upload Survey Paper / SMS Screenshot Evidence (Optional)</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setAssessmentFile(e.target.files[0])} className="w-full p-2 bg-white border border-indigo-200 rounded-xl" />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setActiveModalStep(null)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl">Cancel</button>
                    <button onClick={handleSaveStep4} className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs">Save Assessment Update</button>
                  </div>
                </div>
              )}

              {/* STEP 5 MODAL: Claim Decision Update */}
              {activeModalStep === 5 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border-2 border-amber-300 rounded-3xl p-5 space-y-4 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                    <h4 className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-700" /> Step 5 — Record Claim Decision (Farmer Reported)
                    </h4>
                    <button onClick={() => setActiveModalStep(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-amber-950 block mb-1">Source of Decision</label>
                      <select value={decisionSource} onChange={(e) => setDecisionSource(e.target.value)} className="w-full p-2.5 border border-amber-200 rounded-xl font-semibold bg-white">
                        <option value="FARMER_REPORTED">Farmer Reported Update</option>
                        <option value="INSURER">Insurance Company Letter</option>
                        <option value="OFFICIAL_PORTAL">PMFBY Portal SMS / Portal</option>
                        <option value="BANK">Bank Branch Notification</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-amber-950 block mb-1">Claim Decision Status</label>
                      <select value={decisionStatus} onChange={(e) => setDecisionStatus(e.target.value)} className="w-full p-2.5 border border-amber-200 rounded-xl font-semibold bg-white">
                        <option value="CLAIM_APPROVED">Claim Officially Approved</option>
                        <option value="CLAIM_REJECTED">Claim Rejected</option>
                        <option value="CLAIM_DECISION_PENDING">Under Review / Decision Pending</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-amber-950 block mb-1">Farmer Reported Approved Amount (₹)</label>
                      <input type="number" placeholder="e.g. 40000" value={farmerReportedAmount} onChange={(e) => setFarmerReportedAmount(e.target.value)} className="w-full p-2.5 border border-amber-200 rounded-xl font-semibold bg-white" />
                      <span className="text-[9px] text-amber-800 mt-0.5 block font-semibold">Note: Saved as 'Farmer Reported Amount'</span>
                    </div>

                    <div>
                      <label className="font-bold text-amber-950 block mb-1">Decision Reference / Letter No (Optional)</label>
                      <input type="text" placeholder="e.g. APP-90124" value={decisionRef} onChange={(e) => setDecisionRef(e.target.value)} className="w-full p-2.5 border border-amber-200 rounded-xl font-semibold bg-white" />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-amber-950 block mb-1">Upload Decision Letter / SMS Screenshot (Optional)</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setDecisionFile(e.target.files[0])} className="w-full p-2 bg-white border border-amber-200 rounded-xl" />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setActiveModalStep(null)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl">Cancel</button>
                    <button onClick={handleSaveStep5} className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-xs">Save Claim Decision</button>
                  </div>
                </div>
              )}

              {/* STEP 6 MODAL: Payment Update */}
              {activeModalStep === 6 && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border-2 border-emerald-300 rounded-3xl p-5 space-y-4 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-700" /> Step 6 — Record Payment Update (Farmer Reported)
                    </h4>
                    <button onClick={() => setActiveModalStep(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-emerald-950 block mb-1">Source of Payment Info</label>
                      <select value={paymentSource} onChange={(e) => setPaymentSource(e.target.value)} className="w-full p-2.5 border border-emerald-200 rounded-xl font-semibold bg-white">
                        <option value="FARMER_REPORTED">Farmer Reported Update</option>
                        <option value="BANK">Bank Passbook / SMS</option>
                        <option value="OFFICIAL_PORTAL">PMFBY Portal (pmfby.gov.in)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-emerald-950 block mb-1">Payment Status</label>
                      <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full p-2.5 border border-emerald-200 rounded-xl font-semibold bg-white">
                        <option value="PAYMENT_COMPLETED">Payment Completed / Disbursed</option>
                        <option value="PAYMENT_PENDING">Payment Pending / Processing</option>
                        <option value="PAYMENT_FAILED">Payment Failed</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-emerald-950 block mb-1">Farmer Reported Payment Amount (₹)</label>
                      <input type="number" placeholder="e.g. 40000" value={farmerReportedPaymentAmount} onChange={(e) => setFarmerReportedPaymentAmount(e.target.value)} className="w-full p-2.5 border border-emerald-200 rounded-xl font-semibold bg-white" />
                    </div>

                    <div>
                      <label className="font-bold text-emerald-950 block mb-1">Payment UTR / Transaction Ref (Optional)</label>
                      <input type="text" placeholder="e.g. UTR9812401294" value={paymentUtr} onChange={(e) => setPaymentUtr(e.target.value)} className="w-full p-2.5 border border-emerald-200 rounded-xl font-semibold bg-white" />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-emerald-950 block mb-1">Upload Passbook / Bank SMS Evidence (Optional)</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setPaymentFile(e.target.files[0])} className="w-full p-2 bg-white border border-emerald-200 rounded-xl" />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setActiveModalStep(null)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl">Cancel</button>
                    <button onClick={handleSaveStep6} className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs">Save Payment Update</button>
                  </div>
                </div>
              )}

              {/* CORRECTION MODAL */}
              {activeModalStep === 'CORRECTION' && (
                <div className="bg-gradient-to-br from-rose-50 to-red-50/50 border-2 border-rose-300 rounded-3xl p-5 space-y-4 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                    <h4 className="font-extrabold text-rose-950 text-sm flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-rose-700" /> Log Status Correction Event
                    </h4>
                    <button onClick={() => setActiveModalStep(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                  </div>

                  <div>
                    <label className="font-bold text-rose-950 block mb-1">Reason for Correction</label>
                    <input type="text" placeholder="e.g. Previous payment amount was entered incorrectly by mistake." value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} className="w-full p-2.5 border border-rose-200 rounded-xl font-semibold bg-white" />
                  </div>

                  <div>
                    <label className="font-bold text-rose-950 block mb-1">Correction Notes</label>
                    <input type="text" placeholder="e.g. Correct amount is ₹40,000 as per bank statement." value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)} className="w-full p-2.5 border border-rose-200 rounded-xl font-semibold bg-white" />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setActiveModalStep(null)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl">Cancel</button>
                    <button onClick={handleSaveCorrection} className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl shadow-xs">Save Correction Event</button>
                  </div>
                </div>
              )}

              {/* Status History Audit Trail */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-textPrimary uppercase tracking-wider">Status History Audit Log</h3>
                  <button
                    onClick={() => setActiveModalStep('CORRECTION')}
                    className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Log Correction Event
                  </button>
                </div>

                {!(selectedClaim.statusHistory && selectedClaim.statusHistory.length > 0) ? (
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500 italic">
                    No status updates recorded yet. Initial loss report created on {selectedClaim.eventDate || '24/08/2026'}.
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {selectedClaim.statusHistory.map((h, idx) => {
                      const sObj = CLAIM_STATUS_ENUM[h.status] || { label: h.status };
                      const isFarmer = (h.source || 'FARMER_REPORTED') === 'FARMER_REPORTED';
                      const dateStr = h.timestamp ? new Date(h.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '24/08/2026';

                      return (
                        <div key={idx} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-textPrimary text-xs">{sObj.label}</span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              isFarmer ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {isFarmer ? '🔵 FARMER REPORTED' : '🟣 OFFICIALLY VERIFIED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-textSecondary">{h.message}</p>
                          {h.evidenceName && (
                            <div className="text-[10px] text-green-700 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3 text-green-600" /> Evidence attached: {h.evidenceName}
                            </div>
                          )}
                          <div className="text-[10px] text-gray-400 pt-1 flex justify-between">
                            <span>Logged by: {h.updatedBy || 'Farmer User'}</span>
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
