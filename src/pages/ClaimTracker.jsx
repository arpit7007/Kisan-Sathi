import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { safeStr } from '../utils/safeStr';
import { getClaims, addClaimStatusHistory } from '../services/firebase';
import { generateCropLossIntimationPDF } from '../services/pdf';
import { 
  CLAIM_STATUS_ENUM, 
  STATUS_SOURCES, 
  getStatusGuidance 
} from '../services/claimTrackerEngine';
import { 
  Clock, CheckCircle2, AlertCircle, MessageSquare, ShieldCheck, Download, 
  PhoneCall, ExternalLink, ArrowLeft, ArrowRight, Filter, Plus, FileText, 
  Upload, Shield, AlertTriangle, Building2, Landmark, Globe, Check
} from 'lucide-react';

export default function ClaimTracker() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { claimId: urlClaimId } = useParams();

  const [claims, setClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Status Update Form State (Farmer-Reported Status Updates)
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateSource, setUpdateSource] = useState('FARMER_REPORTED');
  const [updateStatus, setUpdateStatus] = useState('ASSESSMENT_PENDING');
  const [updateDate, setOfficialDate] = useState(new Date().toISOString().split('T')[0]);
  const [updateOfficialRef, setUpdateOfficialRef] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [updateEvidenceFile, setUpdateEvidenceFile] = useState(null);

  // Additional Document Upload State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState('Jamabandi Land Fard Copy');

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

  const handleSaveStatusUpdate = async () => {
    if (!selectedClaim) return;
    const uid = localStorage.getItem('kisan_current_uid');
    const targetId = selectedClaim.claimId || selectedClaim.internalReportId;

    const historyEvent = {
      status: updateStatus,
      source: updateSource,
      message: updateNote || `Status updated to ${CLAIM_STATUS_ENUM[updateStatus]?.label || updateStatus}`,
      officialReference: updateOfficialRef || selectedClaim.officialClaimId || '',
      updatedBy: 'Farmer User',
      evidenceName: updateEvidenceFile ? updateEvidenceFile.name : null
    };

    await addClaimStatusHistory(uid, targetId, historyEvent);

    // Update local UI state
    const updatedClaims = claims.map(c => {
      if ((c.claimId || c.internalReportId) === targetId) {
        const history = c.statusHistory || [];
        return {
          ...c,
          status: updateStatus,
          statusSource: updateSource,
          officialClaimId: updateOfficialRef || c.officialClaimId,
          updatedAt: new Date().toISOString(),
          statusHistory: [...history, { ...historyEvent, timestamp: new Date().toISOString() }]
        };
      }
      return c;
    });

    setClaims(updatedClaims);
    const updatedSelected = updatedClaims.find(c => (c.claimId || c.internalReportId) === targetId);
    setSelectedClaim(updatedSelected);
    setShowUpdateModal(false);
    setUpdateNote('');
    alert("Claim status update recorded successfully!");
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
            <span>Crop Loss Claim Tracker & Status History</span>
          </h1>
          <p className="text-xs text-textSecondary mt-0.5">
            Transparent tracking for internal loss reports, official helpline intimation, and insurer survey status.
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
                const statusObj = CLAIM_STATUS_ENUM[c.status] || { label: c.status || 'Loss Report Created', color: 'blue' };
                const sourceObj = STATUS_SOURCES[c.statusSource] || STATUS_SOURCES.KISANSAATHI;

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
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        SOURCE: {sourceObj.badge}
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
          {/* RIGHT PANEL: CLAIM DETAILS & TIMELINE TRACKER (7 Cols) */}
          {/* ============================================================ */}
          {selectedClaim && (
            <div className="lg:col-span-7 space-y-6">
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

                {/* Dynamic Status Guidance Box */}
                {(() => {
                  const guidance = getStatusGuidance(selectedClaim.status, selectedClaim);
                  return (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>CURRENT STATUS: {CLAIM_STATUS_ENUM[selectedClaim.status]?.label || selectedClaim.status || 'Loss Report Created'}</span>
                        </h4>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                          SOURCE: {(STATUS_SOURCES[selectedClaim.statusSource] || STATUS_SOURCES.KISANSAATHI).badge}
                        </span>
                      </div>

                      <div className="space-y-1 text-amber-900">
                        <div><strong className="text-amber-950">What does this mean?</strong> {guidance.meaning}</div>
                        <div><strong className="text-amber-950">What do I need to do?</strong> {guidance.actionRequired}</div>
                      </div>

                      {guidance.actionType === 'CALL_14447' && (
                        <div className="pt-2 flex gap-2">
                          <a
                            href="tel:14447"
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                          >
                            <PhoneCall className="w-3.5 h-3.5" /> Call Helpline 14447 Now
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Status Update Trigger Bar */}
              <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-textPrimary block">Received an update from 14447, Bank or Insurer?</span>
                  <span className="text-[11px] text-textSecondary block">Record status updates with supporting SMS screenshots or document receipts.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Record Status Update
                </button>
              </div>

              {/* Modal / Form: Record Farmer Status Update */}
              {showUpdateModal && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 border-2 border-indigo-300 rounded-3xl p-5 space-y-4 animate-fadeIn text-xs">
                  <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                    <h4 className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-700" /> Record Official Status Update (Farmer-Reported)
                    </h4>
                    <button onClick={() => setShowUpdateModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-indigo-950 block mb-1">Where did you receive this update?</label>
                      <select
                        value={updateSource}
                        onChange={(e) => setUpdateSource(e.target.value)}
                        className="w-full p-2.5 border border-indigo-200 rounded-xl font-semibold bg-white"
                      >
                        <option value="FARMER_REPORTED">Farmer Reported Update</option>
                        <option value="OFFICIAL_PORTAL">NCIP Portal (pmfby.gov.in / 14447)</option>
                        <option value="INSURER">Implementing Insurer Desk</option>
                        <option value="BANK">Home Bank Branch Counter</option>
                        <option value="AGRICULTURE_DEPARTMENT">Block Agriculture Office</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-indigo-950 block mb-1">What status were you given?</label>
                      <select
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value)}
                        className="w-full p-2.5 border border-indigo-200 rounded-xl font-semibold bg-white"
                      >
                        {Object.values(CLAIM_STATUS_ENUM).map(st => (
                          <option key={st.id} value={st.id}>{st.label} ({st.badge})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-indigo-950 block mb-1">Official Reference Number (if issued)</label>
                      <input
                        type="text"
                        placeholder="e.g. NCIP-CLM-2026-90124"
                        value={updateOfficialRef}
                        onChange={(e) => setUpdateOfficialRef(e.target.value)}
                        className="w-full p-2.5 border border-indigo-200 rounded-xl font-semibold bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-indigo-950 block mb-1">Date of Update</label>
                      <input
                        type="date"
                        value={updateDate}
                        onChange={(e) => setOfficialDate(e.target.value)}
                        className="w-full p-2.5 border border-indigo-200 rounded-xl font-semibold bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-indigo-950 block mb-1">Additional Note / Explanation</label>
                    <input
                      type="text"
                      placeholder="e.g. Received SMS from PMFBY helpline confirming loss survey team assigned."
                      value={updateNote}
                      onChange={(e) => setUpdateNote(e.target.value)}
                      className="w-full p-2.5 border border-indigo-200 rounded-xl font-semibold bg-white"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUpdateModal(false)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveStatusUpdate}
                      className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow-xs"
                    >
                      Save Status Update & Audit Trail
                    </button>
                  </div>
                </div>
              )}

              {/* Vertical Visual Timeline Progress */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-textPrimary uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary-green" /> Claim Progress Timeline
                </h3>

                <div className="space-y-4 text-xs pl-2">
                  {[
                    { stepNum: 1, title: '1. Loss Report Created in KisanSaathi', desc: 'Loss dossier compiled with land & parcel details.', done: true },
                    { stepNum: 2, title: '2. Field Photo Evidence & GPS Captured', desc: 'Damage overview photos & lat/lng location metadata saved.', done: true },
                    { stepNum: 3, title: '3. Official Loss Intimation (14447 / Bank)', desc: selectedClaim.officialClaimId ? `Ref: ${selectedClaim.officialClaimId}` : 'Loss reported to official PMFBY channel.', done: !!selectedClaim.officialClaimId },
                    { stepNum: 4, title: '4. Assessment by Insurer / Authorized Agency', desc: 'Field survey loss assessment or CCE yield evaluation.', done: selectedClaim.status === 'ASSESSMENT_IN_PROGRESS' || selectedClaim.status === 'CLAIM_APPROVED' },
                    { stepNum: 5, title: '5. Official Claim Decision', desc: 'Admissibility & payable compensation calculated under scheme terms.', done: selectedClaim.status === 'CLAIM_APPROVED' || selectedClaim.status === 'CLAIM_REJECTED' },
                    { stepNum: 6, title: '6. Payment via Direct Benefit Transfer', desc: 'Compensation credited directly to farmer bank account.', done: selectedClaim.status === 'PAYMENT_COMPLETED' }
                  ].map((st) => (
                    <div key={st.stepNum} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        st.done ? 'border-primary-green bg-primary-green text-white' : 'border-gray-300 bg-white text-gray-400'
                      }`}>
                        {st.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : st.stepNum}
                      </div>
                      <div className="space-y-0.5">
                        <span className={`font-bold block text-xs ${st.done ? 'text-green-950' : 'text-gray-500'}`}>{st.title}</span>
                        <span className="text-[11px] text-textSecondary block">{st.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status History Audit Trail */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-textPrimary uppercase tracking-wider block">Status History Audit Log</h3>

                {!(selectedClaim.statusHistory && selectedClaim.statusHistory.length > 0) ? (
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500 italic">
                    No status updates recorded yet. Initial loss report created on {selectedClaim.eventDate || '24/08/2026'}.
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {selectedClaim.statusHistory.map((h, idx) => {
                      const sObj = CLAIM_STATUS_ENUM[h.status] || { label: h.status };
                      const srcObj = STATUS_SOURCES[h.source] || STATUS_SOURCES.FARMER_REPORTED;
                      const dateStr = h.timestamp ? new Date(h.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '24/08/2026';

                      return (
                        <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-textPrimary text-xs">{sObj.label}</span>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 uppercase">
                              {srcObj.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-textSecondary">{h.message}</p>
                          <div className="text-[10px] text-gray-400 pt-1 flex justify-between">
                            <span>Updated by: {h.updatedBy || 'System'}</span>
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
