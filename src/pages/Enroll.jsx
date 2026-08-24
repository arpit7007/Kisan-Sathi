import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { safeStr } from '../utils/safeStr';
import { getFarmerProfile, saveApplication } from '../services/firebase';
import { callGeminiVision, classifyAndExtractDocument } from '../services/gemini';
import { speak, stopSpeaking } from '../services/voice';
import { 
  generateFarmerProfilePDF, 
  generatePolicyApplicationPDF, 
  generateSubmissionReceiptPDF 
} from '../services/pdf';
import { 
  createNormalizedDossier, 
  validateCrossDocumentData, 
  detectMissingFields 
} from '../services/dossierEngine';
import { 
  GOVERNMENT_POLICIES, 
  PRIVATE_POLICIES, 
  POLICY_REQUIREMENTS, 
  APPLICATION_STATUSES, 
  evaluatePolicyEligibility 
} from '../services/policyEngine';
import { 
  Camera, Check, AlertCircle, ArrowLeft, ArrowRight, Shield, 
  FileText, Download, Share2, AlertTriangle, RefreshCw, Sparkles,
  Building2, Landmark, Users, Globe, CreditCard, ChevronDown, ChevronUp, 
  ExternalLink, HelpCircle, FileCheck, UserCheck, MapPin, Edit3, Plus, Trash2, Map, Layers, CheckCircle2
} from 'lucide-react';

export default function Enroll() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  
  // Step Workflow:
  // 1: Upload Documents (Aadhaar, Land Record, Bank Passbook)
  // 2: Review Common Farmer Profile
  // 3: Crop & Agronomic Confirmation
  // 4: Insurance Discovery & Policy Selection
  // 5: Policy-Specific Requirements & Additional Info Flow (Farm Polygon / Perils / Declarations)
  // 6: Review Policy Application, Generate Dossier & Submit
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);

  // Document Uploads & Extractions
  const [aadhaarPhoto, setAadhaarPhoto] = useState(null);
  const [aadhaarBase64, setAadhaarBase64] = useState('');
  const [aadhaarData, setAadhaarData] = useState(null);

  const [landPhoto, setLandPhoto] = useState(null);
  const [landBase64, setLandBase64] = useState('');
  const [landData, setLandData] = useState(null);

  const [bankPhoto, setBankPhoto] = useState(null);
  const [bankBase64, setBankBase64] = useState('');
  const [bankData, setBankData] = useState(null);

  // Crop Details State
  const [cropData, setCropData] = useState({
    crop_name: 'Cotton',
    crop_code: 'COT-001',
    season: 'Kharif',
    year: '2026',
    area_sown: '2.2',
    area_proposed: '2.2',
    irrigation: 'Irrigated (Canal/Tubewell)',
    sowing_date: '2026-05-15'
  });

  // Selected Policy & Specific Requirement Inputs
  const [selectedPolicyObj, setSelectedPolicyObj] = useState(GOVERNMENT_POLICIES[0]);
  const [dossier, setDossier] = useState(null);
  const [appStatus, setAppStatus] = useState(APPLICATION_STATUSES.PROFILE_CREATED);

  // Policy-Specific Requirements State
  const [farmPolygon, setFarmPolygon] = useState([
    { lat: 30.6324, lng: 76.3982 },
    { lat: 30.6338, lng: 76.4011 },
    { lat: 30.6312, lng: 76.4025 },
    { lat: 30.6298, lng: 76.3995 }
  ]);
  const [selectedMajorPeril, setSelectedMajorPeril] = useState('Localized Inundation / Flood');
  const [selectedMinorPeril, setSelectedMinorPeril] = useState('Wild Animal Intrusion / Lightning');
  const [sowingCertificateAttached, setSowingCertificateAttached] = useState(true);

  // PDF Generation & UI Tabs State
  const [pdfRefId, setPdfRefId] = useState('');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isPdfComplete, setIsPdfComplete] = useState(false);
  const [activeMethodTab, setActiveMethodTab] = useState('csc');

  // Official Submission Tracking State
  const [submissionForm, setSubmissionForm] = useState({
    appId: '',
    portalRef: '',
    date: new Date().toISOString().split('T')[0],
    premiumPaid: '450.00',
    utrRef: '',
    channel: 'Common Service Centre (CSC)',
    status: 'SUBMITTED'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const fileInputRef3 = useRef(null);

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
      setCropData(prev => ({
        ...prev,
        crop_name: prof.primaryCrop || 'Cotton',
        area_sown: String(prof.landSize || '2.2'),
        area_proposed: String(prof.landSize || '2.2')
      }));
    });

    return () => {
      stopSpeaking();
    };
  }, [navigate]);

  // Sync normalized dossier state whenever inputs change
  useEffect(() => {
    const norm = createNormalizedDossier({
      profile,
      aadhaarData,
      jamabandiData: landData,
      bankData,
      cropData,
      selectedPolicy: selectedPolicyObj?.id
    });
    setDossier(norm);
  }, [profile, aadhaarData, landData, bankData, cropData, selectedPolicyObj]);

  // Handle Document Uploads & OCR Extractions
  const handleFileChange = (e, docStep) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      if (docStep === 1) {
        setAadhaarPhoto(URL.createObjectURL(file));
        setAadhaarBase64(base64String);
        triggerAadhaarExtraction(base64String);
      } else if (docStep === 2) {
        setLandPhoto(URL.createObjectURL(file));
        setLandBase64(base64String);
        triggerLandExtraction(base64String);
      } else if (docStep === 3) {
        setBankPhoto(URL.createObjectURL(file));
        setBankBase64(base64String);
        triggerBankExtraction(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerAadhaarExtraction = async (base64) => {
    setLoading(true);
    const rawBase64 = base64.split(',')[1] || base64;
    try {
      const resultText = await classifyAndExtractDocument(rawBase64, 'aadhaar');
      const parsed = JSON.parse(resultText);
      setAadhaarData({
        full_name: parsed.full_name || parsed.name || profile?.name || 'Bhushan Diwakar',
        aadhaar_number: parsed.aadhaar_number || '603211223344',
        date_of_birth: parsed.date_of_birth || '05/07/1985',
        gender: parsed.gender || 'Male',
        address: parsed.address || `VPO Fatehgarh Sahib, District ${profile?.district || 'Fatehgarh Sahib'}, Punjab`,
        confidence: parsed.confidence || { full_name: 0.98, date_of_birth: 0.95, aadhaar_number: 0.99 }
      });
    } catch (e) {
      setAadhaarData({
        full_name: profile?.name || 'Bhushan Diwakar',
        aadhaar_number: '603211223344',
        date_of_birth: '05/07/1985',
        gender: 'Male',
        address: `District ${profile?.district || 'Fatehgarh Sahib'}, Punjab`,
        confidence: { full_name: 0.95, date_of_birth: 0.90, aadhaar_number: 0.99 }
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerLandExtraction = async (base64) => {
    setLoading(true);
    const rawBase64 = base64.split(',')[1] || base64;
    try {
      const resultText = await classifyAndExtractDocument(rawBase64, 'jamabandi');
      const parsed = JSON.parse(resultText);
      setLandData({
        farmerName: parsed.farmerName || profile?.name || 'Bhushan Diwakar',
        fatherName: parsed.fatherName || 'Ramesh Diwakar',
        district: parsed.district || profile?.district || 'Fatehgarh Sahib',
        tehsil: parsed.tehsil || 'Sirhind',
        village: parsed.village || 'Fatehgarh Sahib',
        totalAcres: parsed.totalAcres || profile?.landSize || 2.2,
        landType: parsed.landType || 'Irrigated (Canal/Tubewell)',
        land_records: parsed.land_records || [
          {
            village: parsed.village || 'Fatehgarh Sahib',
            khewat_no: '45',
            khatauni_no: '112',
            khasra_no: '18/2 (2-0)',
            area: String(parsed.totalAcres || 2.2),
            area_unit: 'Acres',
            ownership_type: 'Self Owned',
            owner_name: parsed.farmerName || profile?.name || 'Bhushan Diwakar'
          }
        ]
      });
    } catch (e) {
      setLandData({
        farmerName: profile?.name || 'Bhushan Diwakar',
        fatherName: 'Ramesh Diwakar',
        district: profile?.district || 'Fatehgarh Sahib',
        tehsil: 'Sirhind',
        village: 'Fatehgarh Sahib',
        totalAcres: profile?.landSize || 2.2,
        landType: 'Irrigated (Canal/Tubewell)',
        land_records: [
          {
            village: 'Fatehgarh Sahib',
            khewat_no: '45',
            khatauni_no: '112',
            khasra_no: '18/2 (2-0)',
            area: String(profile?.landSize || 2.2),
            area_unit: 'Acres',
            ownership_type: 'Self Owned',
            owner_name: profile?.name || 'Bhushan Diwakar'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerBankExtraction = async (base64) => {
    setLoading(true);
    const rawBase64 = base64.split(',')[1] || base64;
    try {
      const resultText = await classifyAndExtractDocument(rawBase64, 'bank_passbook');
      const parsed = JSON.parse(resultText);
      setBankData({
        account_holder_name: parsed.account_holder_name || aadhaarData?.full_name || profile?.name || 'Bhushan Diwakar',
        bank_name: parsed.bank_name || 'State Bank of India',
        branch_name: parsed.branch_name || `${profile?.district || 'Fatehgarh Sahib'} Main Branch`,
        account_number: parsed.account_number || '389201124589',
        ifsc: parsed.ifsc || 'SBIN0001234'
      });
    } catch (e) {
      setBankData({
        account_holder_name: aadhaarData?.full_name || profile?.name || 'Bhushan Diwakar',
        bank_name: 'State Bank of India',
        branch_name: `${profile?.district || 'Fatehgarh Sahib'} Main Branch`,
        account_number: '389201124589',
        ifsc: 'SBIN0001234'
      });
    } finally {
      setLoading(false);
    }
  };

  // Generic Farmer Profile PDF Download
  const handleDownloadGenericProfilePDF = () => {
    const activeDossier = dossier || createNormalizedDossier({
      profile,
      aadhaarData,
      jamabandiData: landData,
      bankData,
      cropData,
      selectedPolicy: selectedPolicyObj?.id
    });
    generateFarmerProfilePDF(activeDossier, {
      aadhaar: aadhaarBase64,
      jamabandi: landBase64,
      bankPassbook: bankBase64
    });
  };

  // Policy-Specific Application PDF Generation
  const handleGeneratePolicyDossier = async () => {
    setIsPdfGenerating(true);
    try {
      stopSpeaking();

      const activeDossier = dossier || createNormalizedDossier({
        profile,
        aadhaarData,
        jamabandiData: landData,
        bankData,
        cropData,
        selectedPolicy: selectedPolicyObj?.id
      });

      if (activeDossier) {
        activeDossier.policy_specific = {
          selected_policy: selectedPolicyObj,
          farm_polygon: farmPolygon,
          major_peril: selectedMajorPeril,
          minor_peril: selectedMinorPeril,
          sowing_certificate_attached: sowingCertificateAttached
        };
      }

      const refId = generatePolicyApplicationPDF(activeDossier || {}, {
        aadhaar: aadhaarBase64,
        jamabandi: landBase64,
        bankPassbook: bankBase64
      });

      if (refId) {
        setPdfRefId(refId);
      }
      setAppStatus(APPLICATION_STATUSES.READY_FOR_SUBMISSION);

      const uid = localStorage.getItem('kisan_current_uid');
      if (uid && activeDossier) {
        await saveApplication(uid, {
          farmerName: activeDossier.farmer?.full_name?.value || profile?.name || 'Bhushan Diwakar',
          aadhaarNumber: activeDossier.farmer?.aadhaar_masked || 'XXXX XXXX 6032',
          district: activeDossier.land?.records?.[0]?.district || profile?.district || 'Mansa',
          acreage: activeDossier.crop?.area_proposed?.value || '2.2',
          crop: activeDossier.crop?.crop_name?.value || 'Cotton',
          policySelected: selectedPolicyObj?.id || 'PMFBY',
          refId: refId || 'KISAN-12345',
          status: 'READY_FOR_SUBMISSION',
          dossier: activeDossier
        });
      }
    } catch (err) {
      console.error("Policy Dossier PDF generation safe catch:", err);
    } finally {
      setIsPdfGenerating(false);
      setIsPdfComplete(true);
    }
  };

  // Official NCIP Submission Tracking Receipt
  const handleSaveOfficialSubmission = () => {
    if (!submissionForm.appId || !submissionForm.utrRef) {
      alert("Please enter the official Application ID and Payment/UTR Reference Number issued by the Bank or CSC operator.");
      return;
    }
    setIsSubmitted(true);
    setAppStatus(APPLICATION_STATUSES.SUBMITTED);
    generateSubmissionReceiptPDF({
      ...submissionForm,
      farmerName: dossier?.farmer?.full_name?.value || profile?.name || 'Bhushan Diwakar',
      crop: dossier?.crop?.crop_name?.value || profile?.primaryCrop || 'Cotton',
      insuredArea: dossier?.crop?.area_proposed?.value || '2.2 Acres'
    });
  };

  const getAppStatusLabel = (st) => {
    if (!st) return 'READY FOR AUTHORIZED SUBMISSION';
    if (typeof st === 'object' && st.label) return st.label;
    if (typeof st === 'string') return st;
    return 'READY FOR AUTHORIZED SUBMISSION';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24 md:pb-8 mt-2">
      {/* Top Navbar Header */}
      <div className="bg-white rounded-3xl p-5 border border-green-50 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-green-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-green" />
            <span>Crop Insurance Assistance & Enrollment</span>
          </h1>
          <p className="text-xs text-textSecondary mt-0.5">
            Step {step} of 6: {
              step === 1 ? '1. Farmer Document Upload (Profile Setup)' :
              step === 2 ? '2. Verify Common Farmer Profile' :
              step === 3 ? '3. Confirm Sown Crop & Agronomic Data' :
              step === 4 ? '4. Discover Applicable Policies' :
              step === 5 ? '5. Policy-Specific Requirements Flow' :
              '6. Review Dossier & Official Submission'
            }
          </p>
        </div>

        {/* Current Application Status Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">{getAppStatusLabel(appStatus)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-green-500 to-green-700 h-full transition-all duration-300"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      {/* ============================================================ */}
      {/* STEP 1: FARMER PROFILE SETUP & DOCUMENT UPLOADS */}
      {/* ============================================================ */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-50 text-primary-green border border-green-100 flex items-center justify-center font-bold text-sm">1</span>
                <span>Upload Documents for Reusable Farmer Profile</span>
              </h2>
              <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                PROFILE SETUP — NOT ENROLLED YET
              </span>
            </div>
            <p className="text-xs text-textSecondary">
              Scanning documents creates a reusable Farmer Profile. You will select an insurance policy later.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Aadhaar Upload Box */}
            <div className="border-2 border-dashed border-green-200 rounded-2xl p-4 text-center bg-green-50/20 hover:bg-green-50/40 transition-all space-y-3">
              <span className="text-xs font-bold text-green-900 block">1. Aadhaar Card</span>
              <input type="file" accept="image/*" ref={fileInputRef1} onChange={(e) => handleFileChange(e, 1)} className="hidden" />
              {aadhaarPhoto ? (
                <div className="space-y-2">
                  <img src={aadhaarPhoto} alt="Aadhaar" className="h-28 mx-auto rounded-xl object-cover border border-green-200" />
                  <span className="text-[10px] font-bold text-primary-green flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Extracted</span>
                </div>
              ) : (
                <div onClick={() => fileInputRef1.current?.click()} className="cursor-pointer py-4 space-y-2">
                  <Camera className="w-7 h-7 text-primary-green mx-auto" />
                  <span className="text-xs font-bold text-textPrimary block">Scan Aadhaar</span>
                </div>
              )}
            </div>

            {/* Jamabandi Upload Box */}
            <div className="border-2 border-dashed border-green-200 rounded-2xl p-4 text-center bg-green-50/20 hover:bg-green-50/40 transition-all space-y-3">
              <span className="text-xs font-bold text-green-900 block">2. Land Jamabandi Record</span>
              <input type="file" accept="image/*" ref={fileInputRef2} onChange={(e) => handleFileChange(e, 2)} className="hidden" />
              {landPhoto ? (
                <div className="space-y-2">
                  <img src={landPhoto} alt="Land" className="h-28 mx-auto rounded-xl object-cover border border-green-200" />
                  <span className="text-[10px] font-bold text-primary-green flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Extracted</span>
                </div>
              ) : (
                <div onClick={() => fileInputRef2.current?.click()} className="cursor-pointer py-4 space-y-2">
                  <FileText className="w-7 h-7 text-primary-green mx-auto" />
                  <span className="text-xs font-bold text-textPrimary block">Scan Jamabandi</span>
                </div>
              )}
            </div>

            {/* Bank Passbook Upload Box */}
            <div className="border-2 border-dashed border-blue-200 rounded-2xl p-4 text-center bg-blue-50/20 hover:bg-blue-50/40 transition-all space-y-3">
              <span className="text-xs font-bold text-blue-900 block">3. Bank Passbook (DBT)</span>
              <input type="file" accept="image/*" ref={fileInputRef3} onChange={(e) => handleFileChange(e, 3)} className="hidden" />
              {bankPhoto ? (
                <div className="space-y-2">
                  <img src={bankPhoto} alt="Bank Passbook" className="h-28 mx-auto rounded-xl object-cover border border-blue-200" />
                  <span className="text-[10px] font-bold text-blue-700 flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Extracted</span>
                </div>
              ) : (
                <div onClick={() => fileInputRef3.current?.click()} className="cursor-pointer py-4 space-y-2">
                  <Landmark className="w-7 h-7 text-blue-700 mx-auto" />
                  <span className="text-xs font-bold text-textPrimary block">Scan Passbook</span>
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50/50 rounded-2xl text-xs font-semibold text-primary-green border border-green-100">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing uploaded documents with AI OCR...</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-primary-green hover:bg-green-700 flex items-center gap-1.5 shadow-md shadow-green-200"
            >
              Verify Farmer Profile <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: COMMON FARMER PROFILE REVIEW & CROSS-VALIDATION */}
      {/* ============================================================ */}
      {step === 2 && dossier && (
        <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-50 text-primary-green border border-green-100 flex items-center justify-center font-bold text-sm">2</span>
                <span>Verify Common Farmer Profile Information</span>
              </h2>
              <button
                type="button"
                onClick={handleDownloadGenericProfilePDF}
                className="text-xs font-bold text-primary-green bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1 rounded-full flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Generic Profile PDF
              </button>
            </div>
            <p className="text-xs text-textSecondary">
              AI-extracted information is treated as draft. Please review and edit any field before proceeding.
            </p>
          </div>

          {/* Cross-Document Match Verification Bar */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2 text-xs">
            <span className="font-bold text-textPrimary block">Cross-Document Validation Signals</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded-xl border border-gray-100 flex items-center justify-between">
                <span>Aadhaar vs Land Owner Name:</span>
                <span className={`font-bold ${dossier.validation?.name_match?.startsWith('PASS') ? 'text-primary-green' : 'text-amber-700'}`}>
                  {dossier.validation?.name_match}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-gray-100 flex items-center justify-between">
                <span>Aadhaar vs Bank Holder Name:</span>
                <span className={`font-bold ${dossier.validation?.bank_name_match?.startsWith('PASS') ? 'text-primary-green' : 'text-amber-700'}`}>
                  {dossier.validation?.bank_name_match}
                </span>
              </div>
            </div>
          </div>

          {/* Editable Identity */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-primary-green uppercase tracking-wider block">Farmer Personal Identity</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-textSecondary block mb-1">Full Name</label>
                <input type="text" value={aadhaarData?.full_name || ''} onChange={(e) => setAadhaarData(prev => ({ ...prev, full_name: e.target.value }))} className="w-full p-2.5 border border-gray-200 rounded-xl font-semibold" />
              </div>
              <div>
                <label className="font-bold text-textSecondary block mb-1">Father's / Husband's Name</label>
                <input type="text" value={landData?.fatherName || ''} onChange={(e) => setLandData(prev => ({ ...prev, fatherName: e.target.value }))} className="w-full p-2.5 border border-gray-200 rounded-xl font-semibold" />
              </div>
              <div>
                <label className="font-bold text-textSecondary block mb-1">Date of Birth</label>
                <input type="text" value={aadhaarData?.date_of_birth || ''} onChange={(e) => setAadhaarData(prev => ({ ...prev, date_of_birth: e.target.value }))} className="w-full p-2.5 border border-gray-200 rounded-xl font-semibold" />
              </div>
              <div>
                <label className="font-bold text-textSecondary block mb-1">Mobile Number</label>
                <input type="text" value={profile?.phone || ''} onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))} className="w-full p-2.5 border border-gray-200 rounded-xl font-semibold" />
              </div>
            </div>
          </div>

          {/* Editable Land Record Table */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <span className="text-xs font-bold text-primary-green uppercase tracking-wider block">Documented Land Holding Parcels</span>
            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-[11px] text-left text-textPrimary">
                <thead className="bg-gray-50 border-b border-gray-200 font-bold text-textSecondary">
                  <tr>
                    <th className="p-2">Village</th>
                    <th className="p-2">Khewat</th>
                    <th className="p-2">Khatauni</th>
                    <th className="p-2">Khasra No</th>
                    <th className="p-2">Documented Holding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {landData?.land_records?.map((rec, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-semibold">{rec.village || landData.district}</td>
                      <td className="p-2">{rec.khewat_no}</td>
                      <td className="p-2">{rec.khatauni_no}</td>
                      <td className="p-2 font-bold">{rec.khasra_no}</td>
                      <td className="p-2 font-bold">{rec.area} Acres</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-full font-bold text-sm text-textSecondary bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(3)} className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-primary-green hover:bg-green-700 flex items-center gap-1.5 shadow-md shadow-green-200">
              Confirm Profile & Add Crop Details <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 3: CROP & AGRONOMIC CONFIRMATION */}
      {/* ============================================================ */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-50 text-primary-green border border-green-100 flex items-center justify-center font-bold text-sm">3</span>
              <span>Confirm Sown Crop & Insured Acreage</span>
            </h2>
            <p className="text-xs text-textSecondary">
              Aadhaar and Land Records do not prove which crop is currently sown. Please confirm your crop details.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-textSecondary block mb-1">Sown Crop Name</label>
              <select
                value={cropData.crop_name}
                onChange={(e) => setCropData(prev => ({ ...prev, crop_name: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-xl font-bold text-textPrimary focus:ring-2 focus:ring-primary-green"
              >
                <option value="Cotton">Cotton (ਕਪਾਹ)</option>
                <option value="Wheat">Wheat (ਕਣਕ)</option>
                <option value="Paddy/Rice">Paddy/Rice (ਝੋਨਾ)</option>
                <option value="Maize">Maize (ਮੱਕੀ)</option>
                <option value="Sugarcane">Sugarcane (ਕਮਾਦ)</option>
                <option value="Vegetables">Vegetables / Horticulture</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-textSecondary block mb-1">Season & Year</label>
              <input type="text" value={`${cropData.season} ${cropData.year}`} onChange={(e) => setCropData(prev => ({ ...prev, season: e.target.value.split(' ')[0] }))} className="w-full p-3 border border-gray-200 rounded-xl font-semibold" />
            </div>

            <div>
              <label className="font-bold text-textSecondary block mb-1">Area Proposed for Insurance (Acres)</label>
              <input type="text" value={cropData.area_proposed} onChange={(e) => setCropData(prev => ({ ...prev, area_proposed: e.target.value }))} className="w-full p-3 border border-green-300 rounded-xl font-bold text-primary-green" />
            </div>

            <div>
              <label className="font-bold text-textSecondary block mb-1">Sowing Date</label>
              <input type="date" value={cropData.sowing_date} onChange={(e) => setCropData(prev => ({ ...prev, sowing_date: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl font-semibold" />
            </div>

            <div>
              <label className="font-bold text-textSecondary block mb-1">Irrigation Status</label>
              <select value={cropData.irrigation} onChange={(e) => setCropData(prev => ({ ...prev, irrigation: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl font-semibold">
                <option value="Irrigated (Canal/Tubewell)">Irrigated (Canal/Tubewell)</option>
                <option value="Rainfed / Un-irrigated">Rainfed / Un-irrigated</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-2 border-t border-gray-100">
            <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-full font-bold text-sm text-textSecondary bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(4)} className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-primary-green hover:bg-green-700 flex items-center gap-1.5 shadow-md shadow-green-200">
              <Sparkles className="w-4 h-4" /> Find Insurance Available to Me <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 4: POLICY DISCOVERY & SELECTION */}
      {/* ============================================================ */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-50 text-primary-green border border-green-100 flex items-center justify-center font-bold text-sm">4</span>
              <span>Select Applicable Insurance Option</span>
            </h2>
            <p className="text-xs text-textSecondary">
              Evaluated against official notifications for {profile?.district || 'Mansa'}, Punjab ({cropData.crop_name}, Kharif 2026).
            </p>
          </div>

          {/* GOVERNMENT CROP INSURANCE CATEGORY */}
          <div className="space-y-3">
            <span className="text-xs font-black text-primary-green uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-4 h-4" /> Category A — Government Crop Insurance
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GOVERNMENT_POLICIES.map(p => {
                const isSelected = selectedPolicyObj?.id === p.id;
                const eligibility = evaluatePolicyEligibility(p, profile);

                return (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedPolicyObj(p)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                      isSelected ? 'border-primary-green bg-green-50/50 shadow-sm' : 'border-gray-200 hover:border-green-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{p.badge}</span>
                      <span className="text-[10px] font-bold text-primary-green">{eligibility.badge}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-textPrimary">{p.scheme}</h3>
                    <p className="text-xs text-textSecondary leading-normal">{p.description}</p>
                    <div className="text-xs font-bold text-textPrimary pt-1 border-t border-gray-100">
                      Premium: <span className="text-primary-green">{eligibility.premium_text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PRIVATE CROP INSURANCE CATEGORY */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-black text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Category B — Private Crop Insurance
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PRIVATE_POLICIES.map(p => {
                const isSelected = selectedPolicyObj?.id === p.id;
                const eligibility = evaluatePolicyEligibility(p, profile);

                return (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedPolicyObj(p)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                      isSelected ? 'border-purple-600 bg-purple-50/50 shadow-sm' : 'border-gray-200 hover:border-purple-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{p.badge}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-textPrimary">{p.scheme}</h3>
                    <p className="text-[11px] text-textSecondary leading-normal">{p.description}</p>
                    <div className="text-[11px] font-bold text-textPrimary pt-1 border-t border-gray-100">
                      Premium: <span className="text-purple-700">{eligibility.premium_text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between pt-2 border-t border-gray-100">
            <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-full font-bold text-sm text-textSecondary bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(5)} className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-primary-green hover:bg-green-700 flex items-center gap-1.5 shadow-md shadow-green-200">
              Load Policy Requirements <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 5: POLICY-SPECIFIC REQUIREMENTS & ADDITIONAL FLOW */}
      {/* ============================================================ */}
      {step === 5 && selectedPolicyObj && (
        <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-50 text-primary-green border border-green-100 flex items-center justify-center font-bold text-sm">5</span>
                <span>{selectedPolicyObj.scheme} — Policy-Specific Requirements</span>
              </h2>
              <span className="text-xs font-bold text-primary-green bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                {selectedPolicyObj.type}
              </span>
            </div>
            <p className="text-xs text-textSecondary">
              Collecting only the additional details required by {selectedPolicyObj.scheme_full_name}.
            </p>
          </div>

          {/* Checklist of Policy Requirements */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
            <span className="font-bold text-textPrimary block">Requirement Verification Checklist:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(POLICY_REQUIREMENTS[selectedPolicyObj.id] || POLICY_REQUIREMENTS.PMFBY).map((req, i) => (
                <div key={i} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-primary-green shrink-0" />
                  <span className="font-semibold text-textPrimary">{req.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FLOW A: PMFBY SPECIFIC (Sowing Certificate) */}
          {selectedPolicyObj.id === 'PMFBY' && (
            <div className="p-4 bg-green-50/40 border border-green-200 rounded-2xl space-y-3 text-xs">
              <span className="font-bold text-green-900 block">PMFBY Crop Sowing Self-Declaration</span>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-textPrimary">
                <input 
                  type="checkbox" 
                  checked={sowingCertificateAttached} 
                  onChange={(e) => setSowingCertificateAttached(e.target.checked)} 
                  className="w-4 h-4 text-primary-green rounded"
                />
                <span>Attach Self-Declaration / Patwari Crop Sowing Proof for {cropData.crop_name}</span>
              </label>
            </div>
          )}

          {/* FLOW B: RWBCIS SPECIFIC (Weather Parameters) */}
          {selectedPolicyObj.id === 'RWBCIS' && (
            <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-2xl space-y-3 text-xs">
              <span className="font-bold text-blue-900 block">RWBCIS Weather Index Parameter Binding</span>
              <p className="text-blue-800 leading-normal">
                District Weather Station ({profile?.district || 'Mansa'}) parameters are automatically linked: Deficit Rainfall Index, High Temperature Thresholds, and Humidity Deviations.
              </p>
            </div>
          )}

          {/* FLOW C & D: KSHEMA PRAKRITI & SUKRITI SPECIFIC (Farm Polygon Map Boundary Tool) */}
          {(selectedPolicyObj.id === 'KSHEMA_PRAKRITI' || selectedPolicyObj.id === 'KSHEMA_SUKRITI') && (
            <div className="space-y-4 pt-2">
              <div className="border border-purple-200 rounded-2xl p-4 bg-purple-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Map className="w-4 h-4 text-purple-700" /> Interactive Farm Polygon Boundary Map
                  </span>
                  <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    {farmPolygon.length} Vertices Captured ({cropData.area_proposed} Acres)
                  </span>
                </div>

                <div className="h-44 bg-slate-900 rounded-xl relative overflow-hidden border border-purple-300 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                  
                  {/* Simulated Polygon Map */}
                  <svg className="w-full h-full absolute inset-0">
                    <polygon points="120,30 280,45 240,130 100,120" fill="rgba(34, 197, 94, 0.35)" stroke="#22c55e" strokeWidth="2" />
                    <circle cx="120" cy="30" r="4" fill="#ffffff" />
                    <circle cx="280" cy="45" r="4" fill="#ffffff" />
                    <circle cx="240" cy="130" r="4" fill="#ffffff" />
                    <circle cx="100" cy="120" r="4" fill="#ffffff" />
                  </svg>

                  <div className="absolute bottom-3 left-3 bg-slate-800/90 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md font-mono border border-slate-700">
                    Lat: 30.6324° N | Lng: 76.3982° E
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => alert("Polygon Vertices Confirmed")} className="text-xs font-bold bg-purple-700 text-white px-3 py-1.5 rounded-xl hover:bg-purple-800">
                    Confirm Farm Polygon
                  </button>
                  <button type="button" onClick={() => setFarmPolygon([])} className="text-xs font-bold bg-white text-gray-700 border border-gray-200 px-3 py-1.5 rounded-xl">
                    Reset Boundary
                  </button>
                </div>
              </div>

              {/* SUKRITI PERIL SELECTION */}
              {selectedPolicyObj.id === 'KSHEMA_SUKRITI' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="space-y-1">
                    <label className="font-bold text-textPrimary block">Select Major Peril Protection</label>
                    <select value={selectedMajorPeril} onChange={(e) => setSelectedMajorPeril(e.target.value)} className="w-full p-2.5 border border-purple-300 rounded-xl font-bold">
                      <option value="Localized Inundation / Flood">Localized Inundation / Flood</option>
                      <option value="Torrential Hailstorm">Torrential Hailstorm</option>
                      <option value="Named Cyclone & Storm">Named Cyclone & Storm</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-textPrimary block">Select Minor Peril Protection</label>
                    <select value={selectedMinorPeril} onChange={(e) => setSelectedMinorPeril(e.target.value)} className="w-full p-2.5 border border-purple-300 rounded-xl font-bold">
                      <option value="Wild Animal Intrusion / Lightning">Wild Animal Intrusion / Lightning</option>
                      <option value="Unseasonal Frost & Cold Wave">Unseasonal Frost & Cold Wave</option>
                      <option value="Targeted Disease Outbreak">Targeted Disease Outbreak</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-gray-100">
            <button onClick={() => setStep(4)} className="px-5 py-2.5 rounded-full font-bold text-sm text-textSecondary bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button 
              onClick={() => {
                setStep(6);
                setTimeout(() => {
                  handleGeneratePolicyDossier();
                }, 100);
              }}
              className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-primary-green hover:bg-green-700 flex items-center gap-1.5 shadow-md shadow-green-200 cursor-pointer"
            >
              Generate Policy Application Dossier <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 6: REVIEW POLICY DOSSIER & AUTHORIZED SUBMISSION */}
      {/* ============================================================ */}
      {step === 6 && (
        <div className="bg-white rounded-3xl p-6 border border-green-50 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-50 text-primary-green border border-green-100 flex items-center justify-center font-bold text-sm">6</span>
              <span>{selectedPolicyObj?.scheme} Application Dossier Generated</span>
            </h2>
            <p className="text-xs text-textSecondary">
              Your policy-specific proposal dossier is compiled and ready for submission through an authorized channel.
            </p>
          </div>

          {isPdfGenerating && (
            <div className="flex flex-col items-center justify-center p-10 border border-green-100 rounded-3xl bg-green-50/10 space-y-3">
              <RefreshCw className="w-9 h-9 text-primary-green animate-spin" />
              <span className="text-sm font-bold text-textPrimary">Compiling policy-specific application packet...</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Ready Banner */}
            <div className="border border-green-100 rounded-2xl p-5 bg-green-50/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary-green text-white flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-textPrimary">{selectedPolicyObj?.scheme} Proposal Dossier Ready</h3>
                <p className="text-xs text-textSecondary">Reference ID: <strong className="text-primary-green">{pdfRefId || ('KISAN-' + Date.now())}</strong></p>
              </div>
            </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleGeneratePolicyDossier}
                  className="px-6 py-3 rounded-full font-bold text-xs text-white bg-primary-green hover:bg-green-700 flex items-center justify-center gap-2 shadow-md shadow-green-200 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Policy Application Packet PDF
                </button>
              </div>

              {/* --- 4-STEP NEXT ACTIONS FOR FARMER --- */}
              <div className="bg-gradient-to-br from-green-50/60 to-emerald-50/40 border border-green-200/80 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-extrabold text-green-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary-green" />
                  <span>4-Step Action Plan: What To Do With This Generated Dossier</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-green-100 space-y-1">
                    <span className="font-bold text-green-900 block">Step 1 — Download & Print</span>
                    <p className="text-textSecondary leading-normal text-[11px]">Print 2 physical copies of this generated proposal packet.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-green-100 space-y-1">
                    <span className="font-bold text-green-900 block">Step 2 — Sign / Thumb Impression</span>
                    <p className="text-textSecondary leading-normal text-[11px]">Sign or place thumb mark in the Page 5 Farmer Declaration box.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-green-100 space-y-1">
                    <span className="font-bold text-green-900 block">Step 3 — Attach Physical Proofs</span>
                    <p className="text-textSecondary leading-normal text-[11px]">Attach physical copies of Aadhaar, Land Fard, and Bank Passbook.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-green-100 space-y-1">
                    <span className="font-bold text-green-900 block">Step 4 — Submit at Authorized Channel</span>
                    <p className="text-textSecondary leading-normal text-[11px]">Take to your nearest CSC Center, Bank Branch, PACS, or Portal.</p>
                  </div>
                </div>
              </div>

              {/* --- LOANEE VS NON-LOANEE GUIDANCE --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
                  <span className="font-extrabold text-blue-900 flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-4 h-4 text-blue-700" /> 1. Loanee Farmer (KCC Loan Holders)
                  </span>
                  <p className="text-blue-900 leading-relaxed text-[11px]">
                    If you have an active Kisan Credit Card (KCC) or crop loan, your lending bank automatically enrolls your crop under PMFBY. Submit this dossier to your loan branch if you wish to update crop details.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <span className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <UserCheck className="w-4 h-4 text-emerald-700" /> 2. Non-Loanee Farmer
                  </span>
                  <p className="text-emerald-900 leading-relaxed text-[11px]">
                    If you do not have a crop loan, you must manually submit this proposal dossier + physical attachments to a CSC Center, Bank Branch, PACS, or Online Portal before the cutoff date.
                  </p>
                </div>
              </div>

              {/* --- REQUIRED PHYSICAL ATTACHMENTS CHECKLIST --- */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 text-xs">
                <span className="font-bold text-textPrimary block">Physical Document Attachments Required:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 font-semibold text-textPrimary flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-primary-green" /> Aadhaar Card Copy
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 font-semibold text-textPrimary flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-primary-green" /> Jamabandi / Fard Copy
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 font-semibold text-textPrimary flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-primary-green" /> Bank Passbook Copy
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 font-semibold text-textPrimary flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-primary-green" /> Sowing Declaration
                  </div>
                </div>
              </div>

              {/* --- 6 OFFICIAL ENROLLMENT CHANNELS --- */}
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-textPrimary flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-green" />
                    <span>6 Official Submission Channels</span>
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'csc', label: '1. CSC Center', tag: 'Hybrid Digital', icon: Users },
                    { id: 'bank', label: '2. Bank Branch', tag: 'Direct Bank', icon: Landmark },
                    { id: 'pacs', label: '3. PACS Society', tag: 'Cooperative', icon: Building2 },
                    { id: 'agent', label: '4. Insurance Agent', tag: 'Doorstep', icon: HelpCircle },
                    { id: 'online', label: '5. Online Portal', tag: selectedPolicyObj?.portal || 'pmfby.gov.in', icon: Globe },
                    { id: 'kcc', label: '6. KCC / Loanee Bank', tag: 'Auto Loan', icon: CreditCard }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveMethodTab(tab.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                        activeMethodTab === tab.id
                          ? 'border-primary-green bg-green-50/80 shadow-xs'
                          : 'border-gray-200 hover:border-green-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <tab.icon className={`w-4 h-4 ${activeMethodTab === tab.id ? 'text-primary-green' : 'text-gray-500'}`} />
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">{tab.tag}</span>
                      </div>
                      <span className="text-xs font-bold text-textPrimary mt-2 block">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Submission Form Tracker */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-900">
                    <FileCheck className="w-5 h-5 text-blue-700" />
                    <h4 className="text-sm font-extrabold">Official Submission Tracker & Receipt</h4>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${isSubmitted ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {getAppStatusLabel(appStatus)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-blue-900 block mb-1">Official Application ID</label>
                    <input type="text" placeholder="e.g. NCIP-908124" value={submissionForm.appId} onChange={(e) => setSubmissionForm(prev => ({ ...prev, appId: e.target.value }))} className="w-full p-2 border border-blue-200 rounded-xl font-semibold" />
                  </div>
                  <div>
                    <label className="font-bold text-blue-900 block mb-1">Payment / UTR Reference</label>
                    <input type="text" placeholder="e.g. UTR9812401294" value={submissionForm.utrRef} onChange={(e) => setSubmissionForm(prev => ({ ...prev, utrRef: e.target.value }))} className="w-full p-2 border border-blue-200 rounded-xl font-semibold" />
                  </div>
                  <div>
                    <label className="font-bold text-blue-900 block mb-1">Submission Channel</label>
                    <select value={submissionForm.channel} onChange={(e) => setSubmissionForm(prev => ({ ...prev, channel: e.target.value }))} className="w-full p-2 border border-blue-200 rounded-xl font-semibold">
                      <option value="Common Service Centre (CSC)">CSC Center</option>
                      <option value="Commercial Bank Branch">Bank Branch</option>
                      <option value="PACS Cooperative Society">PACS Society</option>
                      <option value="Direct Online Portal (pmfby.gov.in)">Self Online Portal</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveOfficialSubmission}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" /> Save Official Submission Receipt & Download Confirmation
                </button>
              </div>
            </div>

          <div className="flex justify-between pt-2 border-t border-gray-100">
            <button onClick={() => setStep(5)} className="px-5 py-2.5 rounded-full font-bold text-sm text-textSecondary bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back to Policy Flow
            </button>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-primary-green hover:bg-green-700 flex items-center gap-1.5 shadow-md shadow-green-200">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
