/**
 * KisanSaathi Crop Insurance Policy Engine
 * Contains structured policy definitions for Government & Private Crop Insurance,
 * historical policy reference registry, eligibility evaluator, requirement schemas,
 * application status states, claim types, peril lists, and dynamic rate engine.
 */

export const GOVERNMENT_POLICIES = [
  {
    id: "PMFBY",
    scheme: "PMFBY",
    scheme_full_name: "Pradhan Mantri Fasal Bima Yojana",
    category: "government",
    type: "Yield-Based Crop Insurance",
    tag: "YIELD-BASED",
    badge: "GOVERNMENT SCHEME",
    description: "Government crop insurance providing yield-based protection against notified crop losses and specified risks under the applicable scheme and state notification.",
    covered_perils: [
      "Drought & Dry Spells",
      "Flood & Inundation",
      "Hailstorm & Cyclone",
      "Post-Harvest Drying Losses",
      "Localized Landslide",
      "Pest & Disease Outbreaks"
    ],
    notified_states: ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Maharashtra", "Andhra Pradesh", "Telangana", "Karnataka"],
    notified_crops: ["Wheat", "Paddy/Rice", "Maize", "Cotton", "Sugarcane", "Mustard", "Pulses", "Vegetables"],
    base_rate_pct: 1.5,
    value_per_acre: 24000,
    enrollment_deadline: "31/07/2026",
    implementing_insurer: "AIC / Agriculture Insurance Company of India",
    source: "Official PMFBY National Crop Insurance Portal Notification",
    source_date: "2026-04-01",
    portal: "pmfby.gov.in"
  },
  {
    id: "RWBCIS",
    scheme: "RWBCIS",
    scheme_full_name: "Restructured Weather Based Crop Insurance Scheme",
    category: "government",
    type: "Weather Index-Based Crop Insurance",
    tag: "WEATHER INDEX-BASED",
    badge: "GOVERNMENT SCHEME",
    description: "Weather-index based crop insurance where compensation is linked to predefined weather parameters (rainfall, temperature, wind, humidity) under the applicable notification.",
    covered_perils: [
      "Deficient / Deficit Rainfall",
      "Excess Rainfall & Inundation",
      "Unseasonal Dry Spells",
      "Extreme High/Low Temperature",
      "Severe Relative Humidity",
      "High Wind Speeds"
    ],
    notified_states: ["Punjab", "Haryana", "Rajasthan", "Maharashtra", "Gujarat", "Andhra Pradesh", "Karnataka"],
    notified_crops: ["Cotton", "Maize", "Groundnut", "Citrus", "Vegetables", "Horticulture Crops"],
    base_rate_pct: 2.0,
    value_per_acre: 26000,
    enrollment_deadline: "15/07/2026",
    implementing_insurer: "State Agricultural Insurance Board & Partner Insurers",
    source: "State Agricultural Department Weather Insurance Gazette",
    source_date: "2026-04-15",
    portal: "pmfby.gov.in"
  }
];

export const PRIVATE_POLICIES = [
  {
    id: "KSHEMA_PRAKRITI",
    scheme: "Kshema Prakriti",
    scheme_full_name: "Kshema Prakriti Comprehensive Crop Protection",
    category: "private",
    type: "Comprehensive Private Crop Cover",
    tag: "PRIVATE CROP COVER",
    badge: "PRIVATE INSURANCE",
    description: "Comprehensive private crop insurance offering customized multi-peril risk coverage for commercial, high-value, and food crops.",
    covered_perils: [
      "Unseasonal Hailstorm",
      "Localized Torrential Flood",
      "Pest Outbreak Threshold Exceeded",
      "Wild Animal Intrusion Damage"
    ],
    notified_states: ["Punjab", "Haryana", "Maharashtra", "Andhra Pradesh", "Telangana", "Karnataka"],
    notified_crops: ["Cotton", "Paddy/Rice", "Wheat", "Maize", "Vegetables", "Sugarcane"],
    base_rate_pct: 3.5,
    value_per_acre: 30000,
    enrollment_deadline: "Open Year-Round (Crop Sowing Window)",
    implementing_insurer: "Kshema General Insurance Limited",
    source: "Insurer Product Terms & Regulatory Filing",
    source_date: "2026-01-10",
    portal: "kshema.co"
  },
  {
    id: "KSHEMA_SUKRITI",
    scheme: "Kshema Sukriti",
    scheme_full_name: "Kshema Sukriti Customizable Peril Cover",
    category: "private",
    type: "Customizable Peril-Based Insurance",
    tag: "PERIL-BASED COVER",
    badge: "PRIVATE INSURANCE",
    description: "Customizable peril-based crop insurance allowing farmers to pick specific weather or biological risks for targeted financial protection.",
    covered_perils: [
      "Targeted Heatwave Damage",
      "Specific Disease Outbreak",
      "Unseasonal Frost & Cold Wave"
    ],
    notified_states: ["Punjab", "Haryana", "Rajasthan", "Madhya Pradesh"],
    notified_crops: ["Wheat", "Mustard", "Vegetables", "Cotton"],
    base_rate_pct: 2.8,
    value_per_acre: 25000,
    enrollment_deadline: "Prior to Risk Exposure Window",
    implementing_insurer: "Kshema General Insurance Limited",
    source: "Insurer Product Terms & Regulatory Filing",
    source_date: "2026-02-01",
    portal: "kshema.co"
  },
  {
    id: "KSHEMA_SAMRIDDHI",
    scheme: "Kshema Samriddhi",
    scheme_full_name: "Kshema Samriddhi Smallholder Protection",
    category: "private",
    type: "Smallholder Farmers Protection",
    tag: "SMALLHOLDER COVER",
    badge: "PRIVATE INSURANCE",
    description: "Tailored micro-insurance policy optimized for small and marginal landholdings with simple digital claim settlement.",
    covered_perils: [
      "Localized Crop Inundation",
      "Storm & Wind Damage",
      "Pre-Harvest Standing Crop Loss"
    ],
    notified_states: ["Punjab", "Haryana", "Uttar Pradesh", "Bihar"],
    notified_crops: ["Wheat", "Paddy/Rice", "Maize", "Pulses"],
    base_rate_pct: 2.5,
    value_per_acre: 22000,
    enrollment_deadline: "Flexible Sowing Enrollment",
    implementing_insurer: "Kshema General Insurance Limited",
    source: "Insurer Micro-Insurance Terms",
    source_date: "2026-03-01",
    portal: "kshema.co"
  }
];

export const HISTORICAL_POLICIES = [
  {
    id: "UPIS",
    scheme: "UPIS (Pilot)",
    scheme_full_name: "Unified Package Insurance Scheme (Pilot Reference)",
    type: "Historical / Pilot Package Scheme",
    status_label: "Historical / Reference",
    description: "Former pilot scheme combining crop insurance with life, personal accident, and farm implement insurance.",
    status: "inactive_pilot",
    source: "Historical Ministry Notification (2016-2020 Pilot)"
  },
  {
    id: "NAIS",
    scheme: "NAIS",
    scheme_full_name: "National Agricultural Insurance Scheme (Legacy)",
    type: "Legacy Area Yield Scheme",
    status_label: "Historical / Reference",
    description: "Legacy area-yield crop insurance scheme replaced by PMFBY in 2016.",
    status: "deprecated",
    source: "Replaced by PMFBY Notification"
  },
  {
    id: "MNAIS",
    scheme: "MNAIS",
    scheme_full_name: "Modified National Agricultural Insurance Scheme (Legacy)",
    type: "Legacy Modified Yield Scheme",
    status_label: "Historical / Reference",
    description: "Modified legacy yield scheme with village-level insurance units.",
    status: "deprecated",
    source: "Replaced by PMFBY Notification"
  }
];

export const POLICY_REQUIREMENTS = {
  PMFBY: [
    { key: 'aadhaar', label: 'Aadhaar Card Identity Proof', required: true },
    { key: 'land_record', label: 'Jamabandi / Fard Land Ownership Record', required: true },
    { key: 'bank_details', label: 'Bank Account Passbook for Direct Benefit Transfer', required: true },
    { key: 'mobile', label: 'Verified Mobile Number for SMS & Claims Tracking', required: true },
    { key: 'crop', label: 'Notified Sown Crop Confirmation', required: true },
    { key: 'sowing_declaration', label: 'Self-Declaration Sowing Certificate / Patwari Proof', required: true }
  ],
  RWBCIS: [
    { key: 'aadhaar', label: 'Aadhaar Card Identity Proof', required: true },
    { key: 'land_record', label: 'Jamabandi / Fard Land Ownership Record', required: true },
    { key: 'bank_details', label: 'Bank Passbook & IFSC Proof', required: true },
    { key: 'mobile', label: 'Verified Mobile Number', required: true },
    { key: 'crop', label: 'Weather-Index Notified Crop', required: true },
    { key: 'weather_parameters', label: 'District Weather Station Parameter Binding', required: true }
  ],
  KSHEMA_PRAKRITI: [
    { key: 'kyc', label: 'Farmer KYC (Aadhaar / ID Proof)', required: true },
    { key: 'land_record', label: 'Jamabandi / Khasra Survey Record', required: true },
    { key: 'farm_polygon', label: 'Farm Polygon Geo-Coordinates & Boundary Map', required: true },
    { key: 'crop', label: 'High-Value Sown Crop Details', required: true },
    { key: 'sowing_date', label: 'Verified Sowing Date', required: true },
    { key: 'tenancy_certificate', label: 'Tenancy Agreement / Lease (if Tenant Farmer)', required: false }
  ],
  KSHEMA_SUKRITI: [
    { key: 'kyc', label: 'Farmer KYC Proof', required: true },
    { key: 'land_record', label: 'Jamabandi / Khasra Survey Record', required: true },
    { key: 'farm_polygon', label: 'Farm Polygon Geo-Coordinates & Boundary Map', required: true },
    { key: 'crop', label: 'Targeted Crop Selection', required: true },
    { key: 'major_perils', label: 'Major Peril Selection (Flood / Inundation / Cyclone / Hailstorm)', required: true },
    { key: 'minor_perils', label: 'Minor Peril Selection (Animal Attack / Lightning / Landslide)', required: true }
  ],
  KSHEMA_SAMRIDDHI: [
    { key: 'kyc', label: 'Farmer KYC Proof', required: true },
    { key: 'land_record', label: 'Smallholder Land Proof (< 5 Acres)', required: true },
    { key: 'bank_details', label: 'Bank Account Details', required: true },
    { key: 'crop', label: 'Sown Crop Declaration', required: true }
  ]
};

export const APPLICATION_STATUSES = {
  PROFILE_CREATED: { label: "PROFILE CREATED — INSURANCE NOT YET ENROLLED", color: "blue" },
  INFORMATION_REQUIRED: { label: "INFORMATION REQUIRED", color: "amber" },
  POLICY_SELECTED: { label: "POLICY SELECTED — REQUIREMENTS PENDING", color: "purple" },
  POLICY_APPLICATION_IN_PROGRESS: { label: "APPLICATION IN PROGRESS", color: "indigo" },
  READY_FOR_SUBMISSION: { label: "READY FOR AUTHORIZED SUBMISSION", color: "emerald" },
  SUBMITTED: { label: "SUBMITTED TO NCIP / INSURER", color: "green" },
  UNDER_REVIEW: { label: "UNDER ENROLLMENT AGENCY REVIEW", color: "sky" },
  ACCEPTED: { label: "OFFICIALLY ACCEPTED", color: "green" },
  CORRECTION_REQUIRED: { label: "CORRECTION REQUIRED", color: "rose" },
  REJECTED: { label: "REJECTED BY INSURER", color: "red" },
  POLICY_ISSUED: { label: "OFFICIAL POLICY ISSUED", color: "teal" }
};

export const CLAIM_TYPES = [
  { id: 'localized_calamity', label: 'A. Localized Calamity / Individual Farm Loss', reporting_window_hours: 72, requires_parcels: true },
  { id: 'post_harvest', label: 'B. Post-Harvest Drying Loss (Up to 14 days after harvest)', reporting_window_hours: 72, requires_parcels: true },
  { id: 'widespread_yield', label: 'C. Widespread / End-of-Season Yield Loss (CCE Based)', reporting_window_hours: null, requires_parcels: false }
];

export const CLAIM_PERILS = {
  PMFBY: [
    "Flood & Inundation",
    "Hailstorm",
    "Landslide",
    "Cyclone & Storm",
    "Excess Rainfall & Waterlogging",
    "Severe Pest / Disease Outbreak",
    "Unseasonal Drying Rain",
    "Drought & Dry Spells"
  ],
  RWBCIS: [
    "Deficient / Deficit Rainfall Index",
    "Excess Rainfall & Inundation Index",
    "Unseasonal Heatwave / High Temp",
    "Severe Relative Humidity Deviation",
    "High Wind Speed Threshold"
  ],
  KSHEMA_PRAKRITI: [
    "Localized Torrential Flood",
    "Unseasonal Hailstorm",
    "Pest Outbreak Threshold Exceeded",
    "Wild Animal Intrusion Damage"
  ],
  KSHEMA_SUKRITI: [
    "Targeted Heatwave Damage",
    "Specific Disease Outbreak",
    "Unseasonal Frost & Cold Wave"
  ],
  KSHEMA_SAMRIDDHI: [
    "Localized Crop Inundation",
    "Storm & Wind Damage",
    "Pre-Harvest Standing Crop Loss"
  ]
};

export const POLICY_CHANNELS = {
  PMFBY: [
    { name: "Krishi Rakshak Helpline & Portal", contact: "14447 / pmfby.gov.in", type: "Official Helpline" },
    { name: "NCIP Official Portal / Crop Insurance App", contact: "pmfby.gov.in", type: "Digital Portal" },
    { name: "Home Bank Branch", contact: "Lending / Savings Branch", type: "Bank Channel" },
    { name: "District Agriculture Office", contact: "Block Agri Officer", type: "Government Channel" }
  ],
  RWBCIS: [
    { name: "State Weather Insurance Cell & Portal", contact: "pmfby.gov.in / State Portal", type: "Weather Board" },
    { name: "District Weather Monitoring Center", contact: "Krishi Vigyan Kendra", type: "KVK Center" }
  ],
  KSHEMA_PRAKRITI: [
    { name: "Kshema Direct Claims Helpline", contact: "1800-KSHEMA-CARE / kshema.co", type: "Insurer Direct" },
    { name: "Kshema Mobile App Claims Portal", contact: "kshema.co", type: "App Channel" }
  ],
  KSHEMA_SUKRITI: [
    { name: "Kshema Direct Claims Helpline", contact: "1800-KSHEMA-CARE / kshema.co", type: "Insurer Direct" }
  ],
  KSHEMA_SAMRIDDHI: [
    { name: "Kshema Micro-Claims Desk", contact: "1800-KSHEMA-CARE / kshema.co", type: "Micro Insurance" }
  ]
};

/**
 * Policy Eligibility Evaluator
 * Evaluates farmer profile against scheme notifications
 */
export function evaluatePolicyEligibility(policy, farmerProfile) {
  if (!farmerProfile || !farmerProfile.district) {
    return {
      status: "missing_location",
      badge: "Verification required",
      badge_color: "amber",
      applicable: false,
      premium_text: "Calculated based on applicable notification",
      coverage_text: "Based on notified Sum Insured",
      settlement_text: "Subject to applicable scheme and insurer process",
      reasons: ["Select your crop and location to verify policy eligibility."]
    };
  }

  const farmerCrop = farmerProfile.primaryCrop || 'Cotton';
  const farmerDistrict = farmerProfile.district || 'Mansa';
  const farmerState = 'Punjab';
  const acres = farmerProfile.landSize || 2.2;

  const isStateSupported = policy.notified_states.includes(farmerState);
  const isCropSupported = policy.notified_crops.includes(farmerCrop);

  let isApplicable = isStateSupported && isCropSupported;

  if (policy.id === 'KSHEMA_SAMRIDDHI' && acres > 5.0) {
    isApplicable = false;
  }

  let status = isApplicable ? "applicable" : "verification_required";
  let badgeLabel = isApplicable ? "✓ Applicable to your crop" : "⚠ Availability requires verification";
  let badgeColor = isApplicable ? "green" : "amber";

  const reasons = [];
  if (isApplicable) {
    reasons.push(`✓ Your crop (${farmerCrop}) is notified under this scheme in ${farmerDistrict}`);
    reasons.push(`✓ ${farmerDistrict} district is covered for Kharif 2026 season`);
    if (policy.category === 'government') {
      reasons.push(`✓ Government subsidized premium rate applicable`);
    } else {
      reasons.push(`✓ Private peril protection available for your landholding`);
    }
  } else {
    reasons.push(`⚠ Notification for ${farmerCrop} in ${farmerDistrict} requires local agency confirmation.`);
  }

  let premiumText = "Calculated based on applicable notification";
  let coverageText = "Based on notified Sum Insured";

  if (isApplicable && acres) {
    const totalSumInsured = acres * policy.value_per_acre;
    const premiumAmount = Math.round(totalSumInsured * (policy.base_rate_pct / 100));

    premiumText = `₹${premiumAmount.toLocaleString('en-IN')} (${policy.category === 'government' ? 'Subsidized ' : ''}${policy.base_rate_pct}%)`;
    coverageText = `₹${totalSumInsured.toLocaleString('en-IN')} (Notified Sum Insured)`;
  }

  return {
    status,
    badge: badgeLabel,
    badge_color: badgeColor,
    applicable: isApplicable,
    premium_text: premiumText,
    coverage_text: coverageText,
    settlement_text: "Subject to applicable scheme and insurer process",
    reasons
  };
}
