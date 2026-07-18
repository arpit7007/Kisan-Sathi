import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getClaims, updateClaimStatus } from '../services/firebase';
import { Clock, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, MessageSquare, ShieldCheck, Tractor } from 'lucide-react';

export default function ClaimTracker() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClaim, setExpandedClaim] = useState(null); // stores claimId
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const uid = localStorage.getItem('kisan_current_uid');
    if (!uid) {
      navigate('/onboard');
      return;
    }

    getClaims(uid).then(data => {
      setClaims(data || []);
      setLoading(false);
    });
  }, [navigate]);

  // Live countdown clock ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleExpand = (claimId) => {
    if (expandedClaim === claimId) {
      setExpandedClaim(null);
    } else {
      setExpandedClaim(claimId);
    }
  };

  // Status index lookup
  const STATUSES = ['Filed', 'Verified', 'Under Review', 'Approved', 'Paid'];

  // Manual Trigger to fast-track claim status in demo mode!
  // This is a powerful hackathon demonstration trick to let judges proceed through steps.
  const handleFastTrack = async (claimId, currentStatus) => {
    const currentIdx = STATUSES.indexOf(currentStatus);
    if (currentIdx < STATUSES.length - 1) {
      const nextStatus = STATUSES[currentIdx + 1];
      const uid = localStorage.getItem('kisan_current_uid');
      
      // Update DB
      await updateClaimStatus(uid, claimId, nextStatus);
      
      // Update UI state
      setClaims(prevClaims => 
        prevClaims.map(c => c.claimId === claimId ? { ...c, status: nextStatus } : c)
      );
    }
  };

  const renderCountdown = (filingDateStr) => {
    const filingTime = new Date(filingDateStr).getTime();
    const deadline = filingTime + 72 * 60 * 60 * 1000;
    const diff = deadline - currentTime;

    if (diff <= 0) {
      return <span className="text-red-600 font-bold">Expired</span>;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    let textColor = 'text-green-600';
    if (hours < 24) textColor = 'text-amber-600';
    if (hours < 12) textColor = 'text-red-600 font-bold timer-critical-pulse';

    return (
      <span className={`${textColor} font-mono flex items-center gap-1.5`}>
        <Clock className="w-4 h-4" />
        {hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')} {t('remaining')}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-primary-green" />
            <span>{t('trackerTitle')}</span>
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            Monitor real-time progress on filed compensation claims, access AI-analyzed logs, or initiate a support chat.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-green-50 shadow-sm flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary-green border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-textSecondary">Loading claims history...</span>
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-dashed border-green-200 text-center space-y-4">
          <p className="text-sm text-textSecondary italic">You have no active claims registered.</p>
          <button
            onClick={() => navigate('/claim')}
            className="px-6 py-2.5 bg-primary-green text-white font-bold rounded-full text-xs shadow-md"
          >
            File a Claim Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const dateObj = new Date(claim.dateOfFiling);
            const formattedDate = dateObj.toLocaleDateString(language === 'pa' ? 'pa-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
            const isExpanded = expandedClaim === claim.claimId;
            
            return (
              <div key={claim.claimId} className="bg-white rounded-3xl border border-green-50 shadow-sm overflow-hidden transition-all">
                {/* Upper Summary Bar */}
                <div 
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-green-50/10"
                  onClick={() => toggleExpand(claim.claimId)}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                      Claim ID: <span className="font-mono">{claim.claimId}</span>
                    </span>
                    <h3 className="text-base font-extrabold text-textPrimary">
                      {claim.crop} ({claim.acresAffected} Acres) - {claim.damageType}
                    </h3>
                    <p className="text-xs text-textSecondary">{t('dateFiled')}: {formattedDate}</p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      {claim.status === 'Filed' && renderCountdown(claim.dateOfFiling)}
                      {claim.status === 'Approved' && (
                        <span className="text-green-600 text-xs font-bold block">Approved: ₹{(claim.acresAffected * 15000).toLocaleString('en-IN')}</span>
                      )}
                      {claim.status === 'Paid' && (
                        <span className="text-green-700 text-xs font-extrabold bg-green-50 px-2 py-0.5 rounded">Disbursed: ₹{(claim.acresAffected * 15000).toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>

                {/* Timeline Stepper */}
                <div className="px-5 pb-5 border-b border-gray-50">
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {[
                      { key: 'Filed', label: t('statusFiled') },
                      { key: 'Verified', label: t('statusVerified') },
                      { key: 'Under Review', label: t('statusUnderReview') },
                      { key: 'Approved', label: t('statusApproved') },
                      { key: 'Paid', label: t('statusPaid') }
                    ].map((step, idx) => {
                      const currentIdx = STATUSES.indexOf(claim.status);
                      let circleColor = 'border-gray-200 text-gray-400 bg-white';
                      let labelColor = 'text-gray-400';
                      
                      if (idx === currentIdx) {
                        circleColor = 'border-sky-500 bg-sky-50 text-sky-600 ring-2 ring-sky-100';
                        labelColor = 'text-sky-600 font-bold';
                      } else if (idx < currentIdx) {
                        circleColor = 'border-green-500 bg-green-500 text-white';
                        labelColor = 'text-green-700 font-medium';
                      }
                      
                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[9px] sm:text-[10px] font-bold transition-all ${circleColor}`}>
                            {idx < currentIdx ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[9px] sm:text-[10px] mt-1 truncate max-w-[64px] sm:max-w-none ${labelColor}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="p-5 bg-gray-50/50 border-t border-gray-50 space-y-4 text-xs text-textPrimary animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Farmer credentials summary */}
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
                        <h4 className="font-bold text-textPrimary flex items-center gap-1">
                          <Tractor className="w-4 h-4 text-primary-green" />
                          <span>Farmer Details</span>
                        </h4>
                        <div className="space-y-1">
                          <div className="flex justify-between"><span className="text-gray-400">Name:</span> <span className="font-semibold">{claim.farmerDetails?.name}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Aadhaar (Last 4):</span> <span className="font-semibold">{claim.farmerDetails?.aadhaar || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">District:</span> <span className="font-semibold">{claim.farmerDetails?.district}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Policy Scheme:</span> <span className="font-semibold text-primary">{claim.farmerDetails?.insurancePolicy || 'None'}</span></div>
                        </div>
                      </div>

                      {/* Bank account details */}
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
                        <h4 className="font-bold text-textPrimary flex items-center gap-1">
                          <Clock className="w-4 h-4 text-primary-green" />
                          <span>Disbursement Bank Account</span>
                        </h4>
                        <div className="space-y-1">
                          <div className="flex justify-between"><span className="text-gray-400">Bank Account:</span> <span className="font-mono font-semibold">{claim.farmerDetails?.bankAccount || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">IFSC Code:</span> <span className="font-mono font-semibold">{claim.farmerDetails?.ifsc || 'N/A'}</span></div>
                          {claim.status === 'Approved' || claim.status === 'Paid' ? (
                            <div className="flex justify-between text-green-700 font-bold pt-1 border-t border-dashed mt-1">
                              <span>Compensation Amount:</span>
                              <span>₹{(claim.acresAffected * 15000).toLocaleString('en-IN')}</span>
                            </div>
                          ) : (
                            <div className="flex justify-between text-gray-500 font-bold pt-1 border-t border-dashed mt-1">
                              <span>Est. Compensation:</span>
                              <span>₹{(claim.acresAffected * 15000).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Crop damage photo analysis details */}
                    {claim.photoAnalysis && (
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
                        <h4 className="font-bold text-textPrimary flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-primary-green" />
                          <span>Gemini AI Vision Crop Analysis Report</span>
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1 text-[11px]">
                          <div className="bg-green-50/50 p-2 rounded-xl">
                            <span className="text-gray-400 block">Crop Identified</span>
                            <span className="font-bold text-textPrimary">{claim.photoAnalysis.cropIdentified}</span>
                          </div>
                          <div className="bg-green-50/50 p-2 rounded-xl">
                            <span className="text-gray-400 block">Damage Source</span>
                            <span className="font-bold text-textPrimary">{claim.photoAnalysis.damageType}</span>
                          </div>
                          <div className="bg-green-50/50 p-2 rounded-xl">
                            <span className="text-gray-400 block">AI Severity</span>
                            <span className="font-bold text-orange-700 uppercase">{claim.photoAnalysis.severity}</span>
                          </div>
                          <div className="bg-green-50/50 p-2 rounded-xl">
                            <span className="text-gray-400 block">AI Confidence</span>
                            <span className="font-bold text-textPrimary">{claim.photoAnalysis.confidence}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed italic bg-gray-50 p-2.5 rounded-xl border mt-2">
                          " {claim.photoAnalysis.notes} "
                        </p>
                      </div>
                    )}

                    {/* Operational controls (Follow-up + fast track) */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        onClick={() => navigate('/chat', { state: { query: `I filed a claim on ${formattedDate} for ${claim.crop} damage. What is the status of my claim ${claim.claimId}?` } })}
                        className="w-full sm:w-auto px-5 py-2.5 bg-primary-green hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat Follow-up</span>
                      </button>

                      {claim.status !== 'Paid' && (
                        <button
                          onClick={() => handleFastTrack(claim.claimId, claim.status)}
                          className="w-full sm:w-auto px-5 py-2.5 border border-sky-200 hover:bg-sky-50 text-sky-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Demo Fast-Track Step ⏩</span>
                        </button>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
