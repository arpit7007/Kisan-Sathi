import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { authenticateFarmer, saveFarmerProfile } from '../services/firebase';
import { ArrowLeft, ArrowRight, Check, Tractor, User, MapPin, Layers, Sprout, Shield, CreditCard, Phone } from 'lucide-react';

const PUNJAB_DISTRICTS = [
  "Amritsar", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", 
  "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", 
  "Moga", "Mohali", "Muktsar", "Nawanshahr", "Pathankot", "Patiala", "Ropar", 
  "Rupnagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Tarn Taran"
];

const CROPS = [
  "Wheat", "Rice/Paddy", "Cotton", "Maize", "Sugarcane", "Mustard", "Sunflower", 
  "Potato", "Vegetables", "Other"
];

export default function Onboarding() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [uid, setUid] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [landSize, setLandSize] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('');
  const [secondaryCrop, setSecondaryCrop] = useState('');
  const [hasInsurance, setHasInsurance] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    // Authenticate user anonymously on mount
    authenticateFarmer((user) => {
      if (user) {
        setUid(user.uid);
      }
    });
  }, []);

  const totalSteps = 8;
  const hectares = landSize ? (parseFloat(landSize) * 0.404686).toFixed(2) : '0.00';

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    if (step === 2 && !district) return;
    if (step === 3 && !landSize) return;
    if (step === 4 && !primaryCrop) return;
    if (step === 6 && !hasInsurance) return;
    
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!uid) return;
    setLoading(true);
    const profile = {
      name,
      district,
      landSize: parseFloat(landSize),
      primaryCrop,
      secondaryCrop: secondaryCrop || 'None',
      hasInsurance,
      aadhaar: aadhaar || '',
      phone: phone || '',
      uid,
      onboarded: true
    };

    const success = await saveFarmerProfile(uid, profile);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  // Step renderer helpers
  const renderStepIcon = () => {
    switch (step) {
      case 1: return <User className="w-8 h-8 text-primary" />;
      case 2: return <MapPin className="w-8 h-8 text-primary" />;
      case 3: return <Layers className="w-8 h-8 text-primary" />;
      case 4: return <Sprout className="w-8 h-8 text-primary" />;
      case 5: return <Sprout className="w-8 h-8 text-wheat" />;
      case 6: return <Shield className="w-8 h-8 text-primary" />;
      case 7: return <CreditCard className="w-8 h-8 text-primary" />;
      case 8: return <Phone className="w-8 h-8 text-primary" />;
      default: return <Tractor className="w-8 h-8 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-farmBg flex flex-col items-center justify-center p-4">
      {/* Top logo */}
      <div className="mb-6 flex items-center gap-2">
        <Tractor className="w-8 h-8 text-primary-green" />
        <span className="text-2xl font-bold text-textPrimary tracking-wide">
          KisanSaathi <span className="text-wheat-gold font-semibold font-gurmukhi">ਕਿਸਾਨ ਸਾਥੀ</span>
        </span>
      </div>

      {/* Main wizard card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden flex flex-col justify-between min-h-[460px] p-6 sm:p-8 relative">
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-2 rounded-full mb-6">
          <div 
            className="bg-primary-green h-2 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider">
            {t('step')} {step} / {totalSteps}
          </span>
          <div className="p-2 bg-green-50 rounded-xl">
            {renderStepIcon()}
          </div>
        </div>

        {/* Step Content Area */}
        <div className="flex-1 flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <label className="text-xl font-bold text-textPrimary block">
                {t('nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="w-full p-4 border border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green text-lg text-textPrimary bg-green-50/30"
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <label className="text-xl font-bold text-textPrimary block">
                {t('districtLabel')}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-4 border border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green text-lg text-textPrimary bg-green-50/30 appearance-none cursor-pointer"
              >
                <option value="">{t('districtSelect')}</option>
                {PUNJAB_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <label className="text-xl font-bold text-textPrimary block">
                {t('landLabel')}
              </label>
              <input
                type="number"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
                placeholder={t('landPlaceholder')}
                min="0.1"
                step="0.1"
                className="w-full p-4 border border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green text-lg text-textPrimary bg-green-50/30"
                autoFocus
              />
              {landSize && (
                <p className="text-sm text-textSecondary italic">
                  {t('landHectares')}: <span className="font-semibold text-primary">{hectares} ha</span>
                </p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <label className="text-xl font-bold text-textPrimary block">
                {t('primaryCropLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {CROPS.map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => setPrimaryCrop(crop)}
                    className={`p-3 text-sm font-medium rounded-xl border text-center transition-all ${
                      primaryCrop === crop 
                        ? 'border-primary-green bg-green-50 text-primary-green font-bold' 
                        : 'border-gray-200 hover:border-green-300 text-textSecondary'
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <label className="text-xl font-bold text-textPrimary block">
                {t('secondaryCropLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSecondaryCrop('None')}
                  className={`p-3 text-sm font-medium rounded-xl border text-center transition-all ${
                    secondaryCrop === 'None' || !secondaryCrop
                      ? 'border-primary-green bg-green-50 text-primary-green font-bold' 
                      : 'border-gray-200 text-textSecondary'
                  }`}
                >
                  {t('secondaryCropNone')}
                </button>
                {CROPS.filter(c => c !== primaryCrop).map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => setSecondaryCrop(crop)}
                    className={`p-3 text-sm font-medium rounded-xl border text-center transition-all ${
                      secondaryCrop === crop 
                        ? 'border-primary-green bg-green-50 text-primary-green font-bold' 
                        : 'border-gray-200 hover:border-green-300 text-textSecondary'
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 animate-fadeIn">
              <label className="text-xl font-bold text-textPrimary block">
                {t('insuranceLabel')}
              </label>
              <div className="flex flex-col gap-3">
                {[
                  { value: 'Yes', label: t('insuranceYes') },
                  { value: 'No', label: t('insuranceNo') },
                  { value: 'Unsure', label: t('insuranceUnsure') }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setHasInsurance(opt.value)}
                    className={`w-full p-4 text-left rounded-2xl border transition-all flex items-center justify-between ${
                      hasInsurance === opt.value
                        ? 'border-primary-green bg-green-50 text-primary-green font-bold'
                        : 'border-gray-200 hover:border-green-300 text-textSecondary'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {hasInsurance === opt.value && <Check className="w-5 h-5 text-primary-green" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4 animate-fadeIn">
              <label className="text-xl font-bold text-textPrimary block">
                {t('aadhaarLabel')}
              </label>
              <input
                type="text"
                maxLength="4"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                placeholder={t('aadhaarPlaceholder')}
                className="w-full p-4 border border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green text-lg text-textPrimary bg-green-50/30 text-center tracking-widest font-mono"
                autoFocus
              />
              <p className="text-xs text-textSecondary text-center">
                This is kept secure and used to pre-fill claims applications only.
              </p>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4 animate-fadeIn">
              <label className="text-xl font-bold text-textPrimary block">
                {t('phoneLabel')}
              </label>
              <input
                type="tel"
                maxLength="10"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder={t('phonePlaceholder')}
                className="w-full p-4 border border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green text-lg text-textPrimary bg-green-50/30"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className={`flex items-center gap-2 p-3 text-sm font-semibold rounded-xl transition-all ${
              step === 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-textSecondary hover:bg-gray-50'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('back')}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary-green hover:bg-green-700 active:scale-95 text-white font-semibold rounded-full shadow-lg hover:shadow-green-200 transition-all text-sm"
          >
            {loading ? (
              <span>{t('loading')}</span>
            ) : step === totalSteps ? (
              <>
                <span>{t('complete')}</span>
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>{t('next')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
