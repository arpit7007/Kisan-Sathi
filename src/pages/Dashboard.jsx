import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getFarmerProfile, getClaims } from '../services/firebase';
import { getWeatherForecast } from '../services/weather';
import { callGemini, extractJSON } from '../services/gemini';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CloudSun, Shield, Calendar, AlertCircle, ArrowRight, Clock, MessageSquare, FileText } from 'lucide-react';

const DISTRICT_COORDS = {
  "Amritsar": { lat: 31.634, lon: 74.872 },
  "Bathinda": { lat: 30.206, lon: 74.945 },
  "Faridkot": { lat: 30.674, lon: 74.757 },
  "Fatehgarh Sahib": { lat: 30.640, lon: 76.398 },
  "Fazilka": { lat: 30.403, lon: 74.022 },
  "Ferozepur": { lat: 30.933, lon: 74.611 },
  "Gurdaspur": { lat: 32.039, lon: 75.404 },
  "Hoshiarpur": { lat: 31.532, lon: 75.911 },
  "Jalandhar": { lat: 31.326, lon: 75.576 },
  "Kapurthala": { lat: 31.381, lon: 75.380 },
  "Ludhiana": { lat: 30.900, lon: 75.857 },
  "Mansa": { lat: 29.987, lon: 75.398 },
  "Moga": { lat: 30.817, lon: 75.170 },
  "Mohali": { lat: 30.697, lon: 76.696 },
  "Muktsar": { lat: 30.471, lon: 74.511 },
  "Nawanshahr": { lat: 31.125, lon: 76.126 },
  "Pathankot": { lat: 32.269, lon: 75.649 },
  "Patiala": { lat: 30.339, lon: 76.386 },
  "Ropar": { lat: 30.966, lon: 76.533 },
  "Rupnagar": { lat: 30.966, lon: 76.533 },
  "Sangrur": { lat: 30.237, lon: 75.844 },
  "Shahid Bhagat Singh Nagar": { lat: 31.125, lon: 76.126 },
  "Tarn Taran": { lat: 31.452, lon: 74.928 }
};

export default function Dashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [claims, setClaims] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [riskData, setRiskData] = useState(null);
  const [riskLoading, setRiskLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Countdown timer clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('kisan_current_uid');
    if (!uid) {
      navigate('/onboard');
      return;
    }

    getFarmerProfile(uid).then(prof => {
      if (!prof || !prof.onboarded) {
        navigate('/onboard');
        return;
      }
      setProfile(prof);

      // Load Claims
      getClaims(uid).then(data => {
        setClaims(data || []);
      });

      // Load Weather Data
      const coords = DISTRICT_COORDS[prof.district] || DISTRICT_COORDS["Ludhiana"];
      setWeatherLoading(true);
      getWeatherForecast(coords.lat, coords.lon, prof.district)
        .then(wData => {
          setWeather(wData);
          setWeatherLoading(false);
          // Trigger risk analysis
          analyzeRisk(prof, wData);
        })
        .catch(err => {
          console.error("Weather load failed:", err);
          setWeatherLoading(false);
        });
    });
  }, [navigate]);

  const analyzeRisk = async (farmerProf, weatherData) => {
    setRiskLoading(true);
    const coords = DISTRICT_COORDS[farmerProf.district] || DISTRICT_COORDS["Ludhiana"];
    
    // Determine season based on current month
    const month = new Date().getMonth();
    let season = "Kharif"; // Default Kharif (June-October)
    if (month >= 10 || month <= 2) season = "Rabi"; // November-March
    else if (month >= 3 && month <= 5) season = "Zaid"; // April-June

    const prompt = `You are an agricultural risk analyst for Punjab, India.
Farmer profile: District=${farmerProf.district}, Crop=${farmerProf.primaryCrop}, Land=${farmerProf.landSize} acres, Season=${season}.
Weather forecast next 14 days: ${JSON.stringify(weatherData?.daily || {})}
Historical pest outbreaks in Punjab Malwa belt:
- Cotton: Whitefly (July-Sept), Pink bollworm (Aug-Oct)
- Wheat: Yellow rust (Feb-March), Powdery mildew (Dec-Feb)  
- Rice: Brown planthopper (Aug-Sept), Blast disease (July-Aug)
- Groundwater stress: critical in Mansa, Bathinda, Muktsar districts

Respond ONLY in JSON format:
{
  "overallRisk": "low"|"medium"|"high"|"critical",
  "riskScore": number,
  "topThreats": [
    { "threat": "string", "probability": "string", "description": "string" }
  ],
  "weeklyAlerts": [
    { "week": "string", "alert": "string" }  
  ],
  "sowingAdvice": "string",
  "summary": "string"
}`;

    const systemContext = `Return ONLY a valid JSON block matching the specified format. Use language code=${language} for the summary description text.`;

    try {
      const responseText = await callGemini(prompt, systemContext);
      const cleaned = extractJSON(responseText);
      if (!cleaned) throw new Error("JSON extraction returned empty/null");
      const parsed = JSON.parse(cleaned);
      if (!parsed || typeof parsed !== 'object') throw new Error("Parsed JSON is not an object");
      setRiskData(parsed);
    } catch (e) {
      console.error("Failed to parse Gemini risk assessment, loading fallback.", e);
      // Hardcoded fallback
      setRiskData(getFallbackRisk(farmerProf.primaryCrop, farmerProf.district));
    } finally {
      setRiskLoading(false);
    }
  };

  const getFallbackRisk = (crop, district) => {
    const isCotton = crop === 'Cotton';
    return {
      overallRisk: isCotton ? 'high' : 'medium',
      riskScore: isCotton ? 82 : 45,
      topThreats: [
        { threat: 'Pest Outbreak (Whitefly)', probability: '80%', description: 'Increased threat of whitefly due to elevated relative humidity levels.' },
        { threat: 'Groundwater Stress', probability: '65%', description: 'Critical water depletion warnings recorded in the district.' }
      ],
      weeklyAlerts: [
        { week: 'Week 1', alert: 'Apply bio-pesticide spray if pest counts exceed 6 per leaf.' }
      ],
      sowingAdvice: 'Check soil moisture before secondary watering. Use micro-sprinklers if possible.',
      summary: language === 'pa' 
        ? "ਇਸ ਸਮੇਂ ਚਿੱਟੀ ਮੱਖੀ ਦੇ ਕੀੜਿਆਂ ਦੇ ਵਧਣ ਦਾ ਜੋਖਮ ਉੱਚਾ ਹੈ।" 
        : "Moderate to high risks detected. Weekly inspection of crops is highly recommended."
    };
  };

  // Recharts Chart Formatter
  const getChartData = () => {
    if (!weather?.daily) return [];
    return weather.daily.time.map((t, idx) => ({
      date: new Date(t).toLocaleDateString(language === 'pa' ? 'pa-IN' : 'en-IN', { day: 'numeric', month: 'short' }),
      maxTemp: weather.daily.temperature_2m_max[idx],
      minTemp: weather.daily.temperature_2m_min[idx],
      rain: weather.daily.precipitation_sum[idx]
    }));
  };

  // SVG Risk Score Color Selector
  const getRiskColor = (score) => {
    if (score < 40) return { stroke: '#16a34a', bg: 'bg-green-50', text: 'text-green-700', label: 'Low' };
    if (score < 70) return { stroke: '#d97706', bg: 'bg-yellow-50', text: 'text-amber-700', label: 'Medium' };
    if (score < 90) return { stroke: '#ea580c', bg: 'bg-orange-50', text: 'text-orange-700', label: 'High' };
    return { stroke: '#dc2626', bg: 'bg-red-50', text: 'text-red-700', label: 'Critical' };
  };

  const currentRisk = riskData ? getRiskColor(riskData.riskScore) : { stroke: '#e5e7eb', bg: 'bg-gray-50', text: 'text-gray-500', label: 'N/A' };

  // Countdown Helper
  const renderCountdown = (filingDateStr) => {
    const filingTime = new Date(filingDateStr).getTime();
    const deadline = filingTime + 72 * 60 * 60 * 1000;
    const diff = deadline - currentTime;

    if (diff <= 0) {
      return <span className="text-red-600 font-bold">Time Expired</span>;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    let textColor = 'text-green-600';
    if (hours < 24) textColor = 'text-amber-600';
    if (hours < 12) textColor = 'text-red-600 font-bold timer-critical-pulse';

    return (
      <span className={`${textColor} font-mono flex items-center gap-1`}>
        <Clock className="w-3.5 h-3.5" />
        {hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')} {t('remaining')}
      </span>
    );
  };

  const getPolicyDetails = (policyKey) => {
    const policyNames = {
      PMFBY: "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
      RWBCIS: "RWBCIS (Restructured Weather Based Crop Insurance)",
      UPIS: "UPIS (Unified Package Insurance Scheme - Pilot)",
      Kshema: "Kshema Private Insurance"
    };
    
    const policyCovers = {
      PMFBY: "Pre-sowing to post-harvest yield shortfall protection.",
      RWBCIS: "Index-based weather deviations (rainfall, temp, winds) protection.",
      UPIS: "Unified crop, implements, life, and household package protection.",
      Kshema: "Comprehensive individual damage inspection and fast payout."
    };

    const acres = profile?.landSize || 1;
    const valuePerAcre = 24000;
    const totalSumInsured = acres * valuePerAcre;
    
    let rate = 0.02;
    if (policyKey === 'PMFBY') rate = 0.015;
    if (policyKey === 'Kshema') rate = 0.045;
    
    const premium = totalSumInsured * rate;
    
    return {
      name: policyNames[policyKey] || policyKey,
      coverageText: policyCovers[policyKey] || "Crop safety protection coverage.",
      premium: `₹${premium.toLocaleString('en-IN')}`,
      coverage: `₹${totalSumInsured.toLocaleString('en-IN')}`
    };
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20 md:pb-6">
      {/* Welcome Banner */}
      {profile && (
        <div className="bg-gradient-to-r from-green-700 to-green-800 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-15 translate-y-6 translate-x-4">
            <CloudSun className="w-48 h-48" />
          </div>
          <div className="relative z-10 space-y-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>🌾 Sat Sri Akal, {profile.name}!</span>
            </h1>
            <p className="text-green-50 text-sm max-w-lg">
              {t('dashboardTitle')} for your farm in <span className="underline decoration-wheat-gold decoration-2 font-bold">{profile.district}</span>. Primary Crop: <span className="font-semibold">{profile.primaryCrop}</span> ({profile.landSize} Acres).
            </p>
          </div>
        </div>
      )}

      {/* --- QUICK ACTIONS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link 
          to="/enroll" 
          className="bg-white rounded-3xl p-5 border border-green-50 shadow-sm hover:shadow-md hover:border-green-200 transition-all text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-green-50 text-primary-green flex items-center justify-center group-hover:scale-105 transition-all">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-textPrimary block">Get Insurance</span>
            <span className="text-[10px] text-textSecondary block">Enrollment Wizard (60s)</span>
          </div>
        </Link>

        <Link 
          to="/claim" 
          className="bg-white rounded-3xl p-5 border border-green-50 shadow-sm hover:shadow-md hover:border-green-200 transition-all text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-all">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-textPrimary block">File a Claim</span>
            <span className="text-[10px] text-textSecondary block">Register crop damage</span>
          </div>
        </Link>

        <Link 
          to="/chat" 
          className="bg-white rounded-3xl p-5 border border-green-50 shadow-sm hover:shadow-md hover:border-green-200 transition-all text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-all">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-textPrimary block">Talk to Agent</span>
            <span className="text-[10px] text-textSecondary block">Voice help in Punjabi/Hindi</span>
          </div>
        </Link>
      </div>

      {/* --- SECTION A: RISK FORECAST CARD --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-green-50 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-wheat-gold" />
            <span>{t('riskForecast')}</span>
          </h2>
          <span className="text-xs text-textSecondary font-medium flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-full text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span> Live Weather Sync
          </span>
        </div>

        {riskLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-textSecondary">{t('loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Risk Score Ring Gauge (md: 4 cols) */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50/50">
              <span className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">{t('riskScore')}</span>
              
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Gauge Fill */}
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke={currentRisk.stroke}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - riskData.riskScore / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center Content */}
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold text-textPrimary">{riskData.riskScore}</span>
                  <span className="text-textSecondary text-xs block">/100</span>
                </div>
              </div>
              
              <span className={`mt-3 px-4 py-1 rounded-full text-xs font-bold ${currentRisk.bg} ${currentRisk.text} uppercase tracking-wider`}>
                {currentRisk.label} Risk
              </span>
            </div>

            {/* Threat Description & Summary (md: 8 cols) */}
            <div className="md:col-span-8 space-y-4">
              <div className="p-4 bg-green-50/40 rounded-2xl border border-green-50">
                <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider mb-1">AI Crop Summary</h3>
                <p className="text-sm font-medium text-textPrimary italic">"{riskData.summary}"</p>
              </div>

              {/* Threat Pills */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider">{t('topThreats')}</h3>
                <div className="flex flex-col gap-2">
                  {riskData.topThreats?.map((threatItem, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs bg-white border border-gray-100 p-2.5 rounded-xl shadow-xs">
                      <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex justify-between font-bold text-textPrimary">
                          <span>{threatItem.threat}</span>
                          <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[10px]">{threatItem.probability} Prob</span>
                        </div>
                        <p className="text-gray-500 mt-0.5">{threatItem.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weather Chart & Sowing Advice Box */}
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              {/* Chart */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider">{t('weatherForecastTitle')}</h3>
                <div className="h-[160px] bg-gray-50/40 rounded-2xl border border-gray-100 p-2 flex items-center justify-center">
                  {weatherLoading ? (
                    <span className="text-xs text-textSecondary">{t('loading')}</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="maxTemp" stroke="#d97706" fill="#fef3c7" fillOpacity={0.4} name="Max Temp" />
                        <Area type="monotone" dataKey="rain" stroke="#0284c7" fill="#e0f2fe" fillOpacity={0.4} name="Rain (mm)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Advice */}
              <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>{t('sowingAdvice')}</span>
                  </h3>
                  <p className="text-xs font-semibold text-textPrimary leading-relaxed">
                    {riskData.sowingAdvice}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-100/50 flex justify-between items-center text-xs">
                  <span className="text-amber-800 font-bold">Week 1 Alert:</span>
                  <span className="text-gray-500 font-medium">{riskData.weeklyAlerts?.[0]?.alert || 'No warning.'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- SECTION B: INSURANCE RECOMMENDATION/ACTIVE CARD --- */}
      {profile?.enrolledPolicy && profile.enrolledPolicy !== 'None' ? (
        (() => {
          const details = getPolicyDetails(profile.enrolledPolicy);
          return (
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/30 rounded-3xl shadow-sm border border-emerald-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shrink-0">
                  <Shield className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-emerald-950">{t('activePolicy')}</h2>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {t('enrolledStatus')}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-emerald-900">
                    {details.name}
                  </p>
                  <p className="text-xs text-textSecondary max-w-xl">
                    {details.coverageText}
                  </p>
                  <div className="flex gap-6 pt-2 text-xs">
                    <div>
                      <span className="text-gray-400 block font-semibold">{t('premiumPaid')}</span>
                      <strong className="text-emerald-900 text-sm font-extrabold">{details.premium}</strong>
                    </div>
                    <div className="border-l border-emerald-200 pl-6">
                      <span className="text-gray-400 block font-semibold">{t('sumInsured')}</span>
                      <strong className="text-emerald-950 text-sm font-extrabold">{details.coverage}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <Link 
                to="/policy" 
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-2xl transition-all text-sm group shrink-0"
              >
                <span>{t('changePolicy')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          );
        })()
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-green-50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-50 rounded-2xl shrink-0">
              <Shield className="w-7 h-7 text-primary-green" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-textPrimary">{t('recommendedInsurance')}</h2>
                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Active Match
                </span>
              </div>
              <p className="text-sm font-semibold text-textPrimary">
                {profile?.primaryCrop === 'Cotton' 
                  ? 'RWBCIS (Restructured Weather Based Crop Insurance Scheme)' 
                  : 'PMFBY (Pradhan Mantri Fasal Bima Yojana)'}
              </p>
              <p className="text-xs text-textSecondary max-w-xl">
                {profile?.primaryCrop === 'Cotton'
                  ? 'Recommended for Mansa cotton belt. Rapid 45-day claim settlement trigger is indexed on high temperature and deficit rain deviations.'
                  : 'Highly recommended yield protection. Fully subsidized by the government, protecting you from sowing to post-harvest losses.'}
              </p>
            </div>
          </div>
          <Link 
            to="/enroll" 
            className="flex items-center justify-center gap-2 px-5 py-3 bg-green-50 hover:bg-green-100 text-primary-green font-bold rounded-2xl transition-all text-sm group shrink-0"
          >
            <span>{t('applyNow')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {/* --- SECTION C: ACTIVE CLAIMS STATUS --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-green-50 p-6 space-y-4">
        <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2 border-b border-gray-100 pb-3">
          <Shield className="w-5 h-5 text-primary-green" />
          <span>{t('activeClaims')}</span>
        </h2>

        {claims.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-textSecondary italic">{t('noClaims')}</p>
            <Link 
              to="/claim" 
              className="mt-3 inline-block px-6 py-2.5 bg-primary-green text-white font-semibold rounded-full text-xs shadow-md hover:bg-green-700 transition-all"
            >
              File Your First Claim Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => {
              const dateObj = new Date(claim.dateOfFiling);
              const formattedDate = dateObj.toLocaleDateString(language === 'pa' ? 'pa-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
              
              return (
                <div key={claim.claimId} className="border border-green-100 rounded-2xl p-4 space-y-4 shadow-xs bg-green-50/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-green-50 pb-2">
                    <div>
                      <span className="text-xs font-semibold text-textSecondary">{t('claimIdText')}: <strong className="text-textPrimary font-mono">{claim.claimId}</strong></span>
                      <h3 className="text-sm font-extrabold text-textPrimary mt-0.5">{claim.crop} ({claim.acresAffected} Acres) - {claim.damageType}</h3>
                    </div>
                    <div className="text-xs text-textSecondary">
                      {t('dateFiled')}: {formattedDate}
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="grid grid-cols-5 gap-1 text-center py-1">
                    {[
                      { key: 'Filed', label: t('statusFiled') },
                      { key: 'Verified', label: t('statusVerified') },
                      { key: 'Under Review', label: t('statusUnderReview') },
                      { key: 'Approved', label: t('statusApproved') },
                      { key: 'Paid', label: t('statusPaid') }
                    ].map((step, idx, arr) => {
                      const statuses = arr.map(s => s.key);
                      const currentIdx = statuses.indexOf(claim.status);
                      const stepIdx = idx;
                      
                      let circleColor = 'border-gray-200 text-gray-400 bg-white';
                      let labelColor = 'text-gray-400';
                      
                      if (stepIdx === currentIdx) {
                        circleColor = 'border-sky-500 bg-sky-50 text-sky-600 ring-2 ring-sky-100';
                        labelColor = 'text-sky-600 font-bold';
                      } else if (stepIdx < currentIdx) {
                        circleColor = 'border-green-500 bg-green-500 text-white';
                        labelColor = 'text-green-700 font-medium';
                      }
                      
                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${circleColor}`}>
                            {stepIdx < currentIdx ? '✓' : stepIdx + 1}
                          </div>
                          <span className={`text-[9px] mt-1 truncate max-w-[64px] sm:max-w-none ${labelColor}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Timer and Action panel */}
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-green-50 gap-3 text-xs">
                    <div>
                      {claim.status === 'Filed' && (
                        <div className="flex flex-col items-start">
                          <span className="text-sky-600 font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span>
                            Application in progress by AI Agent
                          </span>
                          <span className="text-[10px] text-textSecondary mt-0.5 block">{renderCountdown(claim.dateOfFiling)}</span>
                        </div>
                      )}
                      {claim.status === 'Verified' && (
                        <span className="text-sky-600 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span>
                          Verification in progress by AI Agent
                        </span>
                      )}
                      {claim.status === 'Under Review' && (
                        <span className="text-sky-600 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span>
                          Review in progress by AI Agent
                        </span>
                      )}
                      {claim.status === 'Approved' && (
                        <span className="text-green-600 font-bold">Compensation Approved: ₹{claim.acresAffected * 15000}</span>
                      )}
                      {claim.status === 'Paid' && (
                        <span className="text-green-700 font-extrabold bg-green-100 px-2 py-0.5 rounded">Disbursed to Bank: ₹{claim.acresAffected * 15000}</span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => navigate('/chat', { state: { query: `I filed a claim on ${formattedDate} for ${claim.crop} damage. What is the status of my claim ${claim.claimId}?` } })}
                      className="w-full sm:w-auto px-4 py-2 border border-green-200 hover:border-primary-green hover:bg-green-50 text-primary-green font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t('followUp')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
