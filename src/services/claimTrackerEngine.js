/**
 * KisanSaathi Claim Tracker Engine
 * Provides controlled status definitions, status source registries,
 * dynamic status guidance, status history model, and validation rules.
 */

export const CLAIM_TYPE_CONFIG = {
  localized_calamity: {
    reportingWindowHours: 72,
    showTimer: true,
    title: 'Localized Calamity / Individual Farm Loss',
    warningText: 'PMFBY Operational Guidelines mandate that localized losses (inundation, hailstorm, landslide) must be reported within 72 hours of occurrence.'
  },
  post_harvest: {
    reportingWindowHours: 72,
    showTimer: true,
    title: 'Post-Harvest Loss (Drying Window)',
    warningText: 'Post-harvest crop damage must be intimated within 72 hours of damage event.'
  },
  widespread_yield: {
    reportingWindowHours: null,
    showTimer: false,
    title: 'Widespread Yield Loss (CCE Based)',
    warningText: 'Widespread yield loss is assessed via end-of-season Crop Cutting Experiments (CCE).'
  }
};

export const CLAIM_STATUS_ENUM = {
  LOSS_REPORT_CREATED: {
    id: 'LOSS_REPORT_CREATED',
    label: 'Loss Report Created',
    badge: 'KisanSaathi',
    color: 'blue',
    category: 'internal',
    description: 'Loss report and evidence dossier compiled in KisanSaathi.'
  },
  EVIDENCE_COLLECTED: {
    id: 'EVIDENCE_COLLECTED',
    label: 'Evidence Collected & GPS Captured',
    badge: 'KisanSaathi',
    color: 'blue',
    category: 'internal',
    description: 'Field overview photos and GPS location metadata captured.'
  },
  READINESS_CHECK_PASSED: {
    id: 'READINESS_CHECK_PASSED',
    label: 'Readiness Check Passed',
    badge: 'KisanSaathi Audit',
    color: 'emerald',
    category: 'internal',
    description: 'Pre-submission document & data readiness audit completed successfully.'
  },
  OFFICIAL_INTIMATION_PENDING: {
    id: 'OFFICIAL_INTIMATION_PENDING',
    label: 'Official Intimation Pending',
    badge: 'Action Required',
    color: 'amber',
    category: 'internal',
    description: 'Loss report created. Official intimation to Helpline 14447 or Bank is required.'
  },
  OFFICIAL_INTIMATION_RECORDED: {
    id: 'OFFICIAL_INTIMATION_RECORDED',
    label: 'Official Reference Recorded',
    badge: 'Farmer Reported',
    color: 'sky',
    category: 'farmer',
    description: 'Official loss intimation reference recorded from farmer-provided confirmation.'
  },
  ASSESSMENT_PENDING: {
    id: 'ASSESSMENT_PENDING',
    label: 'Assessment Pending',
    badge: 'Insurer Process',
    color: 'purple',
    category: 'official',
    description: 'Loss report received. Awaiting assessment by insurer or authorized agency.'
  },
  ASSESSMENT_IN_PROGRESS: {
    id: 'ASSESSMENT_IN_PROGRESS',
    label: 'Assessment In Progress',
    badge: 'Insurer Survey',
    color: 'indigo',
    category: 'official',
    description: 'Field survey loss assessment or yield CCE evaluation is underway.'
  },
  ADDITIONAL_INFORMATION_REQUIRED: {
    id: 'ADDITIONAL_INFORMATION_REQUIRED',
    label: 'Additional Documents Required',
    badge: 'Action Required',
    color: 'rose',
    category: 'official',
    description: 'The implementing insurer has requested additional supporting land or crop proof.'
  },
  CLAIM_DECISION_PENDING: {
    id: 'CLAIM_DECISION_PENDING',
    label: 'Claim Decision Pending',
    badge: 'Insurer Process',
    color: 'amber',
    category: 'official',
    description: 'Assessment completed. Insurer is calculating admissibility and payable amount.'
  },
  CLAIM_APPROVED: {
    id: 'CLAIM_APPROVED',
    label: 'Claim Officially Approved',
    badge: 'Insurer Official',
    color: 'green',
    category: 'official',
    description: 'Claim approved by insurer under scheme terms.'
  },
  CLAIM_REJECTED: {
    id: 'CLAIM_REJECTED',
    label: 'Claim Rejected',
    badge: 'Insurer Official',
    color: 'red',
    category: 'official',
    description: 'Claim closed/rejected by insurer according to scheme rules.'
  },
  PAYMENT_PENDING: {
    id: 'PAYMENT_PENDING',
    label: 'Payment Processing (DBT)',
    badge: 'Bank Transfer',
    color: 'teal',
    category: 'official',
    description: 'Approved claim amount transmitted to bank for Direct Benefit Transfer.'
  },
  PAYMENT_COMPLETED: {
    id: 'PAYMENT_COMPLETED',
    label: 'Payment Disbursed to Bank',
    badge: 'Bank DBT Complete',
    color: 'emerald',
    category: 'official',
    description: 'Claim compensation credited directly to farmer bank account.'
  },
  CLOSED: {
    id: 'CLOSED',
    label: 'Claim File Closed',
    badge: 'Final',
    color: 'gray',
    category: 'official',
    description: 'Claim processing cycle completed.'
  }
};

export const STATUS_SOURCES = {
  KISANSAATHI: { label: 'KisanSaathi System', badge: 'INTERNAL', iconColor: 'text-blue-600' },
  OFFICIAL_API: { label: 'Official Insurer API', badge: 'OFFICIAL API', iconColor: 'text-green-600' },
  OFFICIAL_PORTAL: { label: 'NCIP Portal (pmfby.gov.in)', badge: 'OFFICIAL PORTAL', iconColor: 'text-teal-600' },
  INSURER: { label: 'Implementing Insurer Desk', badge: 'INSURER OFFICIAL', iconColor: 'text-emerald-600' },
  BANK: { label: 'Home Bank Branch', badge: 'BANK CHANNEL', iconColor: 'text-indigo-600' },
  FARMER_REPORTED: { label: 'Farmer Reported Update', badge: 'FARMER REPORTED', iconColor: 'text-amber-600' },
  AGRICULTURE_DEPARTMENT: { label: 'Block Agri Department', badge: 'GOVT OFFICE', iconColor: 'text-purple-600' }
};

/**
 * Generates dynamic status guidance: meaning & actionable next step
 */
export function getStatusGuidance(statusKey, claim = {}) {
  switch (statusKey) {
    case 'OFFICIAL_INTIMATION_PENDING':
    case 'LOSS_REPORT_CREATED':
      return {
        title: 'Action Required: Report Loss to 14447 / Bank',
        meaning: 'Your loss report has been prepared in KisanSaathi, but official intimation to PMFBY 14447 or your Bank is not yet confirmed.',
        actionRequired: 'Call Krishi Rakshak Helpline 14447 or submit your packet to your bank branch to obtain your official reference ID.',
        actionType: 'CALL_14447',
        badgeColor: 'amber'
      };

    case 'OFFICIAL_INTIMATION_RECORDED':
      return {
        title: 'Official Reference Recorded — Awaiting Assessment',
        meaning: 'Your official loss intimation reference number is recorded. The insurer or authorized assessment agency will now review your loss.',
        actionRequired: 'No immediate action required. Keep your phone available in case the insurer requests additional information.',
        actionType: 'WAIT',
        badgeColor: 'sky'
      };

    case 'ASSESSMENT_PENDING':
    case 'ASSESSMENT_IN_PROGRESS':
      return {
        title: 'Assessment In Progress',
        meaning: 'The implementing insurer is conducting loss assessment via field survey or yield evaluation.',
        actionRequired: 'No action required at this time. Maintain your original land and bank documents for verification.',
        actionType: 'WAIT',
        badgeColor: 'purple'
      };

    case 'ADDITIONAL_INFORMATION_REQUIRED':
      return {
        title: 'Action Required: Upload Missing Document',
        meaning: 'The implementing insurer has requested additional supporting evidence (e.g. updated Jamabandi copy or sowing proof).',
        actionRequired: 'Upload the requested document using the Document Panel below to prevent claim processing delays.',
        actionType: 'UPLOAD_DOC',
        badgeColor: 'rose'
      };

    case 'CLAIM_DECISION_PENDING':
      return {
        title: 'Claim Decision In Progress',
        meaning: 'Field assessment is complete. The insurer is finalizing claim admissibility and payable compensation.',
        actionRequired: 'No action required. Decision will be updated once communicated by the insurer.',
        actionType: 'WAIT',
        badgeColor: 'amber'
      };

    case 'CLAIM_APPROVED':
      return {
        title: 'Claim Officially Approved',
        meaning: 'Your crop loss claim has been officially approved by the implementing insurer.',
        actionRequired: 'Check your linked bank account for Direct Benefit Transfer (DBT) credit.',
        actionType: 'CHECK_BANK',
        badgeColor: 'green'
      };

    case 'CLAIM_REJECTED':
      return {
        title: 'Claim File Closed / Rejected',
        meaning: 'The insurer has determined the claim is ineligible under scheme rules or notification thresholds.',
        actionRequired: 'Review rejection reason or contact District Agriculture Officer / 14447 for appeal procedures.',
        actionType: 'CONTACT_INSURER',
        badgeColor: 'red'
      };

    case 'PAYMENT_PENDING':
    case 'PAYMENT_COMPLETED':
      return {
        title: 'Payment Disbursed to Bank',
        meaning: 'Claim compensation has been credited directly to your bank account via Direct Benefit Transfer.',
        actionRequired: 'Verify transaction entry in your bank passbook.',
        actionType: 'CHECK_BANK',
        badgeColor: 'emerald'
      };

    default:
      return {
        title: 'Claim Record Updated',
        meaning: 'Your crop loss intimation dossier is registered in KisanSaathi.',
        actionRequired: 'Check status timeline for updates.',
        actionType: 'WAIT',
        badgeColor: 'blue'
      };
  }
}
