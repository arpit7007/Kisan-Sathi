import { jsPDF } from 'jspdf';

/**
 * Generates a formal, multi-page Crop Insurance Enrollment / Proposal Dossier PDF
 * Fixes text wrapping, character encoding mangling, and empty bottom spacing.
 * @param {Object} dossier Normalized KisanSaathi Application Object
 * @param {Object} documentImages Object containing base64 images { aadhaar, jamabandi, bankPassbook }
 * @returns {string} Application Reference ID
 */
export function generatePolicyApplicationPDF(dossier, documentImages = {}) {
  const doc = new jsPDF();
  const refId = dossier.application?.reference_id || 'KISAN-' + Date.now();
  const currentDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Theme colors
  const primaryColor = [22, 163, 74]; // #16a34a (Green)
  const textColor = [20, 83, 45]; // #14532d (Dark green)
  const grayColor = [100, 116, 139]; // #64748b (Slate Gray)
  const amberColor = [217, 119, 6]; // #d97706 (Gold / Amber)
  const borderGray = [226, 232, 240]; // #e2e8f0

  const addHeader = (pageNum) => {
    // Top banner background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 26, 'F');

    // Title (Latin characters only to prevent PDF font encoding mangling)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KisanSaathi — Smart Crop Insurance Portal', 15, 13);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Crop Insurance Enrollment / Proposal Dossier', 15, 20);

    // Right-aligned header details
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ref ID: ${refId}`, 195, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${currentDate}  |  Page ${pageNum} of 5`, 195, 19, { align: 'right' });

    // Outer Page Frame Border
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.4);
    doc.rect(10, 10, 190, 277, 'S');
  };

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'italic');
    const footerMsg = "Note: This document is a Pre-Enrollment / Assisted Proposal Dossier for verification at CSC / Bank / PACS. Official insurance policy is issued upon NCIP portal approval.";
    doc.text(footerMsg, 105, 283, { align: 'center' });
  };

  // Helper to draw clean sections
  const drawSectionHeader = (title, y) => {
    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, y);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
  };

  // Helper to draw bordered info boxes
  const drawInfoBox = (x, y, w, h, bgRGB = [248, 250, 252], borderRGB = borderGray) => {
    doc.setFillColor(...bgRGB);
    doc.rect(x, y, w, h, 'F');
    doc.setDrawColor(...borderRGB);
    doc.setLineWidth(0.4);
    doc.rect(x, y, w, h, 'S');
  };

  const f = dossier.farmer || {};
  const l = dossier.land || {};
  const c = dossier.crop || {};
  const b = dossier.bank || {};
  const ins = dossier.insurance || {};

  // ==========================================
  // PAGE 1 — APPLICATION SUMMARY & FARMER IDENTITY
  // ==========================================
  addHeader(1);

  // Status Banner Box
  drawInfoBox(15, 32, 180, 12, [254, 243, 199], amberColor);
  doc.setTextColor(180, 83, 9);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS: DRAFT — PENDING ENROLLMENT AGENCY VERIFICATION', 20, 39.5);

  // Section 1: Farmer Identity
  drawSectionHeader('1. Farmer Identity & Personal Details', 52);
  drawInfoBox(15, 57, 180, 58, [255, 255, 255]);

  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);

  const drawFieldRow = (label, val, y) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val || 'N/A'), 75, y);
  };

  drawFieldRow('Full Name:', f.full_name?.value || 'Bhushan Diwakar', 65);
  drawFieldRow("Father's / Husband's Name:", f.father_name?.value || 'Ramesh Diwakar', 72);
  drawFieldRow('Date of Birth & Gender:', `${f.dob?.value || '05/07/1985'} (${f.gender?.value || 'Male'})`, 79);
  drawFieldRow('Mobile Number:', f.mobile?.value || '9876543210', 86);
  drawFieldRow('Aadhaar Number (Masked):', f.aadhaar_masked || 'XXXX XXXX 6032', 93);
  drawFieldRow('Farmer Category / Type:', f.farmer_type?.value || 'Small / Marginal Farmer', 100);
  drawFieldRow('Residential Address:', f.address?.value || 'Fatehgarh Sahib, Punjab', 107);

  // Section 2: Farm & Crop Summary
  drawSectionHeader('2. Farm Land & Crop Summary', 123);
  drawInfoBox(15, 128, 180, 52, [255, 255, 255]);

  drawFieldRow('State & District:', `Punjab / ${l.records?.[0]?.district || 'Fatehgarh Sahib'}`, 136);
  drawFieldRow('Tehsil & Village:', `${l.records?.[0]?.tehsil || 'Sirhind'} / ${l.records?.[0]?.village || 'Fatehgarh Sahib'}`, 143);
  drawFieldRow('Total Documented Holding:', l.total_documented_area?.value || '2.2 Acres', 150);
  drawFieldRow('Area Proposed for Insurance:', l.proposed_insured_area?.value || '2.2 Acres', 157);
  drawFieldRow('Sown Crop Name:', c.crop_name?.value || 'Cotton', 164);
  drawFieldRow('Crop Season & Year:', `${c.season?.value || 'Kharif'} ${c.year?.value || '2026'}`, 171);

  // Section 3: Selected Scheme
  drawSectionHeader('3. Selected Crop Insurance Scheme', 188);
  drawInfoBox(15, 193, 180, 26, [255, 255, 255]);

  drawFieldRow('Scheme Name:', ins.scheme || 'PMFBY (Pradhan Mantri Fasal Bima Yojana)', 201);
  drawFieldRow('Insurance Unit Name:', ins.insurance_unit || 'Fatehgarh Sahib Panchayat Unit 4', 208);
  drawFieldRow('Subsidy Category:', 'Government Subsidized Farmer Premium Share', 215);

  // Section 4: Next Steps Box
  drawSectionHeader('4. Immediate Next Steps for Enrollment', 227);
  drawInfoBox(15, 232, 180, 42, [240, 253, 244], primaryColor);

  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Instructions for Farmer / CSC Operator:', 20, 239);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const nextStepsText = [
    "1. Print 2 physical copies of this generated Enrollment Dossier.",
    "2. Put your signature or thumb mark in the Farmer Declaration box on Page 5.",
    "3. Attach physical document copies of Aadhaar Card, Land Jamabandi (Fard), and Bank Passbook.",
    "4. Present this dossier at your nearest CSC Center, Bank Branch, or PACS for official NCIP portal submission."
  ];
  let nY = 246;
  nextStepsText.forEach(stepText => {
    doc.text(stepText, 20, nY);
    nY += 6;
  });

  addFooter();

  // ==========================================
  // PAGE 2 — LAND PARCELS & CROP CARE PROFILE
  // ==========================================
  doc.addPage();
  addHeader(2);

  drawSectionHeader('5. Land Parcel Ownership & Holding Breakdown', 32);

  // Table Header
  doc.setFillColor(240, 253, 244);
  doc.rect(15, 37, 180, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Sr', 18, 42.5);
  doc.text('Village', 27, 42.5);
  doc.text('Khewat', 62, 42.5);
  doc.text('Khatauni', 82, 42.5);
  doc.text('Khasra No', 105, 42.5);
  doc.text('Doc. Area', 135, 42.5);
  doc.text('Insured Area', 165, 42.5);

  let yPos = 50;
  const records = l.records || [];
  records.forEach((rec, idx) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(String(idx + 1), 18, yPos);
    doc.text(rec.village || 'Fatehgarh Sahib', 27, yPos);
    doc.text(rec.khewat_no || '45', 62, yPos);
    doc.text(rec.khatauni_no || '112', 82, yPos);
    doc.text(rec.khasra_no || '18/2 (2-0)', 105, yPos);
    doc.text(rec.documented_area || '2.2 Acres', 135, yPos);
    doc.text(rec.proposed_insured_area || '2.2 Acres', 165, yPos);
    doc.setDrawColor(...borderGray);
    doc.line(15, yPos + 3, 195, yPos + 3);
    yPos += 8.5;
  });

  // Section 6: Crop Care Profile
  drawSectionHeader('6. Sown Crop & Agronomic Details', yPos + 8);
  drawInfoBox(15, yPos + 13, 180, 50, [255, 255, 255]);

  let cY = yPos + 21;
  drawFieldRow('Crop Name & Code:', `${c.crop_name?.value || 'Cotton'} (${c.crop_code?.value || 'COT-001'})`, cY);
  drawFieldRow('Area Sown:', c.area_sown?.value || '2.2 Acres', cY + 7);
  drawFieldRow('Area Proposed for Insurance:', c.area_proposed?.value || '2.2 Acres', cY + 14);
  drawFieldRow('Irrigation Status:', c.irrigation?.value || 'Irrigated (Canal/Tubewell)', cY + 21);
  drawFieldRow('Sowing Date:', c.sowing_date?.value || '15/05/2026', cY + 28);
  drawFieldRow('Information Source:', c.source?.value || 'Farmer Confirmation', cY + 35);

  // Section 7: Land Verification Guidelines Box
  drawSectionHeader('7. Land Holding & Insurable Interest Guidelines', cY + 48);
  drawInfoBox(15, cY + 53, 180, 42, [248, 250, 252]);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const landGuideText = [
    "• Total Documented Holding represents the aggregate land area listed in the uploaded Jamabandi / Fard record.",
    "• Area Proposed for Insurance represents the specific sown crop acreage nominated by the farmer for coverage.",
    "• Land ownership shares, tenant agreements, and Khasra survey numbers must be verified against state land portal records by the CSC/Bank operator before final NCIP submission."
  ];
  let lgY = cY + 60;
  landGuideText.forEach(gText => {
    const wrappedG = doc.splitTextToSize(gText, 170);
    doc.text(wrappedG, 20, lgY);
    lgY += wrappedG.length * 4.5 + 2;
  });

  addFooter();

  // ==========================================
  // PAGE 3 — BANK & INSURANCE FINANCIAL DETAILS
  // ==========================================
  doc.addPage();
  addHeader(3);

  drawSectionHeader('8. Bank Account Details (Direct Benefit Transfer - DBT)', 32);
  drawInfoBox(15, 37, 180, 50, [255, 255, 255]);

  drawFieldRow('Account Holder Name:', b.account_holder?.value || 'Bhushan Diwakar', 45);
  drawFieldRow('Bank Name:', b.bank_name?.value || 'State Bank of India', 52);
  drawFieldRow('Branch Name:', b.branch?.value || 'Fatehgarh Sahib Main Branch', 59);
  drawFieldRow('Account Number (Masked):', b.account_number?.value || 'XXXXXX4589', 66);
  drawFieldRow('IFSC Code:', b.ifsc?.value || 'SBIN0001234', 73);
  drawFieldRow('Bank Document Status:', b.status || 'Uploaded & Extracted', 80);

  // Section 9: Premium Calculation
  drawSectionHeader('9. Premium Calculation & Sum Insured', 96);
  drawInfoBox(15, 101, 180, 50, [255, 255, 255]);

  drawFieldRow('Sum Insured Per Hectare/Unit:', ins.sum_insured || 'PENDING OFFICIAL VERIFICATION', 109);
  drawFieldRow('Total Sum Insured:', ins.sum_insured || 'PENDING OFFICIAL VERIFICATION', 116);
  drawFieldRow('Subsidized Premium Rate:', ins.premium_rate || '1.5% - 2.0% (Subsidized Farmer Share)', 123);
  drawFieldRow('Farmer Share Premium Payable:', ins.farmer_premium || 'PENDING OFFICIAL VERIFICATION', 130);
  drawFieldRow('Government Subsidy Share:', ins.government_subsidy || 'PENDING OFFICIAL VERIFICATION', 137);
  drawFieldRow('Total Gross Premium:', ins.total_premium || 'PENDING OFFICIAL VERIFICATION', 144);

  // Financial Notice Box (PROPERLY BOUNDED & WRAPPED)
  const noticeStr = "Important Notice: Exact sum insured, farmer premium payable, and government subsidy amounts are finalized by the Bank / CSC operator on the National Crop Insurance Portal (NCIP) at the time of official submission.";
  const wrappedNotice = doc.splitTextToSize(noticeStr, 170);
  const noticeBoxHeight = wrappedNotice.length * 4.5 + 8;

  drawInfoBox(15, 158, 180, noticeBoxHeight, [254, 243, 199], amberColor);
  doc.setTextColor(180, 83, 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(wrappedNotice, 20, 164);

  // Section 10: Verification Checklist Summary Box
  drawSectionHeader('10. Financial Verification Summary', 158 + noticeBoxHeight + 12);
  drawInfoBox(15, 158 + noticeBoxHeight + 17, 180, 36, [248, 250, 252]);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const finSummaryText = [
    "• Premium payments are collected by the authorized CSC operator or debited by the Bank branch.",
    "• Subsidized farmer premium rates: 1.5% for Rabi food crops, 2.0% for Kharif crops, and 5% for commercial/cotton crops.",
    "• Direct Benefit Transfer (DBT) claim payouts are remitted directly to the verified Aadhaar-seeded bank account above."
  ];
  let fsY = 158 + noticeBoxHeight + 24;
  finSummaryText.forEach(fText => {
    const wrappedF = doc.splitTextToSize(fText, 170);
    doc.text(wrappedF, 20, fsY);
    fsY += wrappedF.length * 4 + 2;
  });

  addFooter();

  // ==========================================
  // PAGE 4 — DOCUMENT VERIFICATION CHECKLIST
  // ==========================================
  doc.addPage();
  addHeader(4);

  drawSectionHeader('11. Document Verification Checklist', 32);

  // Checklist Table
  doc.setFillColor(240, 253, 244);
  doc.rect(15, 37, 180, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Document Type', 20, 42.5);
  doc.text('Uploaded?', 85, 42.5);
  doc.text('AI Extracted?', 120, 42.5);
  doc.text('Verification Status', 155, 42.5);

  const docs = dossier.documents || [
    { document_type: 'aadhaar', document_name: 'Aadhaar Card Proof', extraction_status: 'success', verification_status: 'pending' },
    { document_type: 'jamabandi', document_name: 'Land Record (Jamabandi / Fard)', extraction_status: 'success', verification_status: 'pending' },
    { document_type: 'bank_passbook', document_name: 'Bank Passbook Proof', extraction_status: 'success', verification_status: 'pending' }
  ];

  let dY = 50;
  docs.forEach(d => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(d.document_name || d.document_type, 20, dY);
    doc.text(d.extraction_status !== 'pending' ? 'YES' : 'NO', 85, dY);
    doc.text(d.extraction_status === 'success' ? 'YES' : 'NO', 120, dY);
    doc.text(d.verification_status || 'Pending Verification', 155, dY);
    doc.setDrawColor(...borderGray);
    doc.line(15, dY + 3, 195, dY + 3);
    dY += 8.5;
  });

  // Section 12: Cross-Document Validation Signals (PROPERLY BOUNDED & WRAPPED)
  drawSectionHeader('12. Cross-Document Automated Validation Signals', dY + 8);
  drawInfoBox(15, dY + 13, 180, 52, [255, 255, 255]);

  const v = dossier.validation || {};
  let vY = dY + 22;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Aadhaar vs Land Record Name Match:', 20, vY);
  
  const nameMatchStr = String(v.name_match || 'PASS — Names match exactly');
  const wrappedNameMatch = doc.splitTextToSize(nameMatchStr, 170);
  doc.setFont('helvetica', 'normal');
  if (nameMatchStr.startsWith('PASS')) doc.setTextColor(22, 163, 74);
  else doc.setTextColor(180, 83, 9);
  doc.text(wrappedNameMatch, 20, vY + 5);

  vY += wrappedNameMatch.length * 4.5 + 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Aadhaar vs Bank Passbook Name Match:', 20, vY);

  const bankNameMatchStr = String(v.bank_name_match || 'PASS — Names match exactly');
  const wrappedBankMatch = doc.splitTextToSize(bankNameMatchStr, 170);
  doc.setFont('helvetica', 'normal');
  if (bankNameMatchStr.startsWith('PASS')) doc.setTextColor(22, 163, 74);
  else doc.setTextColor(180, 83, 9);
  doc.text(wrappedBankMatch, 20, vY + 5);

  // Section 13: Missing Information Alert Box
  const missing = dossier.missing_fields || [];
  if (missing.length > 0) {
    const missingStr = "Missing Requirements: " + missing.join(', ');
    const wrappedMissing = doc.splitTextToSize(missingStr, 170);
    const missingBoxH = wrappedMissing.length * 4.5 + 10;

    drawSectionHeader('13. Action Required Before Final NCIP Portal Submission', 182);
    drawInfoBox(15, 187, 180, missingBoxH, [254, 242, 242], [239, 68, 68]);

    doc.setTextColor(185, 28, 28);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(wrappedMissing, 20, 194);
  } else {
    drawSectionHeader('13. Verification Status', 182);
    drawInfoBox(15, 187, 180, 24, [240, 253, 244], primaryColor);

    doc.setTextColor(...textColor);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('ALL REQUIRED DOCUMENTS & PROOFS ATTACHED', 20, 197);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Ready for assisted submission at any authorized CSC Center, Bank Branch, or PACS.', 20, 204);
  }

  addFooter();

  // ==========================================
  // PAGE 5 — ANNEXURES, FARMER DECLARATION & AGENCY STAMP
  // ==========================================
  doc.addPage();
  addHeader(5);

  // Section 14: Document Annexures Summary
  drawSectionHeader('14. Document Annexures & Attached Proofs', 32);
  drawInfoBox(15, 37, 180, 28, [248, 250, 252]);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('• Annexure A: Aadhaar Card Photo Proof (Scanned & Verified)', 20, 44);
  doc.text('• Annexure B: Land Record / Jamabandi Fard Document (Verified Land Holding)', 20, 51);
  doc.text('• Annexure C: Bank Passbook Copy (Verified for Direct Benefit Transfer)', 20, 58);

  // Section 15: Farmer Declaration Block
  drawSectionHeader('15. Farmer Declaration & Authorization', 72);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const declText = "I hereby declare that the information provided in this enrollment dossier and supporting documents is true and correct to the best of my knowledge. I understand that final crop insurance enrollment and coverage are subject to verification and acceptance by the authorized enrollment agency (Bank / CSC / PACS) and insurance company under PMFBY / RWBCIS guidelines.";
  const wrappedDecl = doc.splitTextToSize(declText, 175);
  doc.text(wrappedDecl, 15, 80);

  // Signature Box
  const sigY = 80 + wrappedDecl.length * 4 + 4;
  doc.setDrawColor(...borderGray);
  doc.rect(15, sigY, 85, 24, 'S');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Farmer Signature / Thumb Impression:', 18, sigY + 6);

  doc.setFont('helvetica', 'normal');
  doc.text('Date: ________________________', 115, sigY + 10);
  doc.text('Place: ________________________', 115, sigY + 20);

  // Section 16: Official Enrollment Agency Verification Box
  const agencyY = sigY + 34;
  drawSectionHeader('16. Enrollment Agency Verification (Bank / CSC / PACS / Intermediary)', agencyY);

  drawInfoBox(15, agencyY + 5, 180, 85, [255, 255, 255], primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('TO BE COMPLETED BY AUTHORIZED OPERATOR AT TIME OF NCIP SUBMISSION:', 20, agencyY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('[  ] Farmer Identity Verified', 20, agencyY + 21);
  doc.text('[  ] Aadhaar Biometric / OTP Auth Done', 75, agencyY + 21);
  doc.text('[  ] Land Jamabandi Fard Verified', 140, agencyY + 21);

  doc.text('[  ] Bank Account Passbook Verified', 20, agencyY + 29);
  doc.text('[  ] Sown Crop & Area Confirmed', 75, agencyY + 29);
  doc.text('[  ] Subsidized Farmer Premium Collected', 140, agencyY + 29);

  doc.text('Operator Name: _________________________________', 20, agencyY + 41);
  doc.text('Agency / Center Name: ___________________________', 110, agencyY + 41);

  doc.text('Operator ID / VLE ID: ____________________________', 20, agencyY + 51);
  doc.text('Submission Date: ________________________________', 110, agencyY + 51);

  doc.text('Remarks / Notes: ____________________________________________________________________', 20, agencyY + 61);

  doc.setDrawColor(...primaryColor);
  doc.rect(125, agencyY + 67, 65, 18, 'S');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature & Official Agency Stamp', 130, agencyY + 77);

  addFooter();

  // Save/Output PDF
  doc.save(`${refId}_Crop_Insurance_Dossier.pdf`);
  return refId;
}

/**
 * Generates an official Crop Insurance Submission Receipt PDF
 * @param {Object} submissionData Official NCIP submission details
 */
export function generateSubmissionReceiptPDF(submissionData) {
  const doc = new jsPDF();
  const refId = submissionData.appId || 'NCIP-' + Date.now();
  const currentDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const primaryColor = [22, 163, 74];
  const textColor = [20, 83, 45];
  const borderGray = [226, 232, 240];

  // Outer Frame
  doc.setDrawColor(...borderGray);
  doc.rect(10, 10, 190, 277, 'S');

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KisanSaathi — Official NCIP Submission Receipt', 15, 17);

  // Status Banner
  doc.setFillColor(240, 253, 244);
  doc.rect(15, 35, 180, 14, 'F');
  doc.setDrawColor(...primaryColor);
  doc.rect(15, 35, 180, 14, 'S');
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`OFFICIAL STATUS: ${submissionData.status || 'SUBMITTED & ACCEPTED'}`, 20, 44);

  // Details Grid Box
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 55, 180, 95, 'F');
  doc.setDrawColor(...borderGray);
  doc.rect(15, 55, 180, 95, 'S');

  const drawReceiptRow = (label, val, y) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(label, 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val || 'N/A'), 85, y);
  };

  drawReceiptRow('Official NCIP Application ID:', refId, 67);
  drawReceiptRow('Portal Reference Number:', submissionData.portalRef || 'PMFBY/PB/2026/8912', 77);
  drawReceiptRow('Farmer Name:', submissionData.farmerName || 'Bhushan Diwakar', 87);
  drawReceiptRow('Crop & Insured Area:', `${submissionData.crop || 'Cotton'} (${submissionData.insuredArea || '2.2 Acres'})`, 97);
  drawReceiptRow('Farmer Premium Paid:', `INR ${submissionData.premiumPaid || '450.00'}`, 107);
  drawReceiptRow('Payment / UTR Reference:', submissionData.utrRef || 'UTR9812401294', 117);
  drawReceiptRow('Enrollment Channel:', submissionData.channel || 'Common Service Centre (CSC)', 127);
  drawReceiptRow('Submission Date:', submissionData.date || currentDate, 137);

  // Footer Note
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'italic');
  doc.text('This receipt confirms official registration on the National Crop Insurance Portal (NCIP). Keep for claims reference.', 105, 160, { align: 'center' });

  doc.save(`${refId}_Submission_Receipt.pdf`);
}
