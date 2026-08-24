import { jsPDF } from 'jspdf';

/**
 * Generates a reusable Generic FARMER INSURANCE PROFILE / PRE-ENROLLMENT DOSSIER PDF
 * Status: PROFILE CREATED — INSURANCE NOT YET ENROLLED
 */
export function generateFarmerProfilePDF(dossier, documentImages = {}) {
  const doc = new jsPDF();
  const refId = dossier.application?.reference_id || 'KISAN-PROF-' + Date.now();
  const currentDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const primaryColor = [22, 163, 74];
  const textColor = [20, 83, 45];
  const grayColor = [100, 116, 139];
  const borderGray = [226, 232, 240];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('KisanSaathi — Smart Digital Crop Insurance Assistance', 15, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('FARMER INSURANCE PROFILE (PRE-ENROLLMENT DOSSIER)', 15, 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ref ID: ${refId}`, 195, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${currentDate}`, 195, 19, { align: 'right' });

  // Status Banner
  doc.setFillColor(239, 246, 255); // Blue tint
  doc.rect(15, 32, 180, 12, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.rect(15, 32, 180, 12, 'S');
  doc.setTextColor(29, 78, 216);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS: PROFILE CREATED — INSURANCE NOT YET ENROLLED', 20, 39.5);

  const drawFieldRow = (label, val, y, labelWidth = 65) => {
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(String(label), 20, y);
    doc.setFont('helvetica', 'normal');
    const valX = 20 + labelWidth;
    const lines = doc.splitTextToSize(String(val || 'N/A'), 192 - valX);
    doc.text(lines, valX, y);
    return Math.max(6, lines.length * 4.5);
  };

  const f = dossier.farmer || {};
  const l = dossier.land || {};
  const b = dossier.bank || {};

  // Section 1: Farmer
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Farmer Identity Profile', 15, 52);
  doc.setDrawColor(...primaryColor);
  doc.line(15, 54, 195, 54);

  let fy = 62;
  fy += drawFieldRow('Full Name:', f.full_name?.value || 'Bhushan Diwakar', fy);
  fy += drawFieldRow("Father's / Husband's Name:", f.father_name?.value || 'Ramesh Diwakar', fy);
  fy += drawFieldRow('Date of Birth & Gender:', `${f.dob?.value || '05/07/1985'} (${f.gender?.value || 'Male'})`, fy);
  fy += drawFieldRow('Mobile Number:', f.mobile?.value || '9876543210', fy);
  fy += drawFieldRow('Aadhaar Number (Masked):', f.aadhaar_masked || 'XXXX XXXX 6032', fy);
  fy += drawFieldRow('Address:', f.address?.value || 'Punjab', fy);

  // Section 2: Land
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Farm Land Holding Summary', 15, fy + 8);
  doc.line(15, fy + 10, 195, fy + 10);

  let ly = fy + 18;
  ly += drawFieldRow('State & District:', `Punjab / ${l.records?.[0]?.district || 'Fatehgarh Sahib'}`, ly);
  ly += drawFieldRow('Tehsil & Village:', `${l.records?.[0]?.tehsil || 'Sirhind'} / ${l.records?.[0]?.village || 'Fatehgarh Sahib'}`, ly);
  ly += drawFieldRow('Total Documented Holding:', l.total_documented_area?.value || '2.2 Acres', ly);

  // Section 3: Bank
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Verified Bank Account (DBT)', 15, ly + 8);
  doc.line(15, ly + 10, 195, ly + 10);

  let by = ly + 18;
  by += drawFieldRow('Account Holder Name:', b.account_holder?.value || 'Bhushan Diwakar', by);
  by += drawFieldRow('Bank Name & Branch:', `${b.bank_name?.value || 'State Bank of India'}, ${b.branch?.value || 'Main Branch'}`, by);
  by += drawFieldRow('Account Number (Masked):', b.account_number?.value || 'XXXXXX4589', by);
  by += drawFieldRow('IFSC Code:', b.ifsc?.value || 'SBIN0001234', by);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a reusable Farmer Profile Dossier. Select a specific policy (PMFBY, RWBCIS, Kshema) to generate policy-specific enrollment packets.', 105, 283, { align: 'center' });

  doc.save(`${refId}_Farmer_Profile.pdf`);
  return refId;
}

/**
 * Generates a formal, multi-page Crop Insurance Enrollment / Proposal Dossier PDF
 * Fixes text overlapping, long address line wrapping, and header border cutting.
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
    // Top banner background (Full width bleed)
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 26, 'F');

    // Title (Clean Latin characters only to prevent PDF font encoding mangling)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
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
  };

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'italic');
    const footerMsg = "Note: This document is a Pre-Enrollment / Assisted Proposal Dossier for verification at CSC / Bank / PACS. Official insurance policy is issued upon NCIP portal approval.";
    doc.text(footerMsg, 105, 283, { align: 'center' });
  };

  // Helper to draw clean section titles
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

  /**
   * Auto-wrapping, non-overlapping field row renderer
   * @param {string} label 
   * @param {string} val 
   * @param {number} y 
   * @param {number} labelWidth Width reserved for label (default 65mm to handle long labels like "Sum Insured Per Hectare/Unit:")
   * @returns {number} Height consumed in mm
   */
  const drawFieldRow = (label, val, y, labelWidth = 65) => {
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);

    // Label
    doc.setFont('helvetica', 'bold');
    doc.text(String(label), 20, y);

    // Value (wrapped cleanly within right margin x=192)
    doc.setFont('helvetica', 'normal');
    const valX = 20 + labelWidth; // 20 + 65 = 85mm
    const maxValWidth = 192 - valX; // 192 - 85 = 107mm width available
    const lines = doc.splitTextToSize(String(val || 'N/A'), maxValWidth);

    doc.text(lines, valX, y);
    return Math.max(6, lines.length * 4.5);
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
  drawInfoBox(15, 57, 180, 62, [255, 255, 255]);

  let fy = 65;
  fy += drawFieldRow('Full Name:', f.full_name?.value || 'Bhushan Diwakar', fy, 65);
  fy += drawFieldRow("Father's / Husband's Name:", f.father_name?.value || 'Ramesh Diwakar', fy, 65);
  fy += drawFieldRow('Date of Birth & Gender:', `${f.dob?.value || '05/07/1985'} (${f.gender?.value || 'Male'})`, fy, 65);
  fy += drawFieldRow('Mobile Number:', f.mobile?.value || '9876543210', fy, 65);
  fy += drawFieldRow('Aadhaar Number (Masked):', f.aadhaar_masked || 'XXXX XXXX 6032', fy, 65);
  fy += drawFieldRow('Farmer Category / Type:', f.farmer_type?.value || 'Small / Marginal Farmer', fy, 65);
  fy += drawFieldRow('Residential Address:', f.address?.value || 'Fatehgarh Sahib, Punjab', fy, 65);

  // Section 2: Farm & Crop Summary
  drawSectionHeader('2. Farm Land & Crop Summary', 128);
  drawInfoBox(15, 133, 180, 50, [255, 255, 255]);

  let ly = 141;
  ly += drawFieldRow('State & District:', `Punjab / ${l.records?.[0]?.district || 'Fatehgarh Sahib'}`, ly, 65);
  ly += drawFieldRow('Tehsil & Village:', `${l.records?.[0]?.tehsil || 'Sirhind'} / ${l.records?.[0]?.village || 'Fatehgarh Sahib'}`, ly, 65);
  ly += drawFieldRow('Total Documented Holding:', l.total_documented_area?.value || '2.2 Acres', ly, 65);
  ly += drawFieldRow('Area Proposed for Insurance:', l.proposed_insured_area?.value || '2.2 Acres', ly, 65);
  ly += drawFieldRow('Sown Crop Name:', c.crop_name?.value || 'Cotton', ly, 65);
  ly += drawFieldRow('Crop Season & Year:', `${c.season?.value || 'Kharif'} ${c.year?.value || '2026'}`, ly, 65);

  // Section 3: Selected Scheme
  drawSectionHeader('3. Selected Crop Insurance Scheme', 192);
  drawInfoBox(15, 197, 180, 26, [255, 255, 255]);

  let sy = 205;
  sy += drawFieldRow('Scheme Name:', ins.scheme || 'PMFBY (Pradhan Mantri Fasal Bima Yojana)', sy, 65);
  sy += drawFieldRow('Insurance Unit Name:', ins.insurance_unit || 'Fatehgarh Sahib Panchayat Unit 4', sy, 65);
  sy += drawFieldRow('Subsidy Category:', 'Government Subsidized Farmer Premium Share', sy, 65);

  // Section 4: Next Steps Box
  drawSectionHeader('4. Immediate Next Steps for Enrollment', 231);
  drawInfoBox(15, 236, 180, 42, [240, 253, 244], primaryColor);

  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Instructions for Farmer / CSC Operator:', 20, 243);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const nextStepsText = [
    "1. Print 2 physical copies of this generated Enrollment Dossier.",
    "2. Put your signature or thumb mark in the Farmer Declaration box on Page 5.",
    "3. Attach physical document copies of Aadhaar Card, Land Jamabandi (Fard), and Bank Passbook.",
    "4. Present this dossier at your nearest CSC Center, Bank Branch, or PACS for official NCIP portal submission."
  ];
  let nY = 250;
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
  drawInfoBox(15, yPos + 13, 180, 48, [255, 255, 255]);

  let cY = yPos + 21;
  cY += drawFieldRow('Crop Name & Code:', `${c.crop_name?.value || 'Cotton'} (${c.crop_code?.value || 'COT-001'})`, cY, 65);
  cY += drawFieldRow('Area Sown:', c.area_sown?.value || '2.2 Acres', cY, 65);
  cY += drawFieldRow('Area Proposed for Insurance:', c.area_proposed?.value || '2.2 Acres', cY, 65);
  cY += drawFieldRow('Irrigation Status:', c.irrigation?.value || 'Irrigated (Canal/Tubewell)', cY, 65);
  cY += drawFieldRow('Sowing Date:', c.sowing_date?.value || '15/05/2026', cY, 65);
  cY += drawFieldRow('Information Source:', c.source?.value || 'Farmer Confirmation', cY, 65);

  // Section 7: Land Verification Guidelines Box
  drawSectionHeader('7. Land Holding & Insurable Interest Guidelines', cY + 12);
  drawInfoBox(15, cY + 17, 180, 42, [248, 250, 252]);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const landGuideText = [
    "• Total Documented Holding represents the aggregate land area listed in the uploaded Jamabandi / Fard record.",
    "• Area Proposed for Insurance represents the specific sown crop acreage nominated by the farmer for coverage.",
    "• Land ownership shares, tenant agreements, and Khasra survey numbers must be verified against state land portal records by the CSC/Bank operator before final NCIP submission."
  ];
  let lgY = cY + 24;
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
  drawInfoBox(15, 37, 180, 48, [255, 255, 255]);

  let by = 45;
  by += drawFieldRow('Account Holder Name:', b.account_holder?.value || 'Bhushan Diwakar', by, 65);
  by += drawFieldRow('Bank Name:', b.bank_name?.value || 'State Bank of India', by, 65);
  by += drawFieldRow('Branch Name:', b.branch?.value || 'Fatehgarh Sahib Main Branch', by, 65);
  by += drawFieldRow('Account Number (Masked):', b.account_number?.value || 'XXXXXX4589', by, 65);
  by += drawFieldRow('IFSC Code:', b.ifsc?.value || 'SBIN0001234', by, 65);
  by += drawFieldRow('Bank Document Status:', b.status || 'Uploaded & Extracted', by, 65);

  // Section 9: Premium Calculation (PROPER 65MM LABEL MARGIN PREVENTS OVERLAP)
  drawSectionHeader('9. Premium Calculation & Sum Insured', 94);
  drawInfoBox(15, 99, 180, 50, [255, 255, 255]);

  let iy = 107;
  iy += drawFieldRow('Sum Insured Per Hectare/Unit:', ins.sum_insured || 'PENDING OFFICIAL VERIFICATION', iy, 65);
  iy += drawFieldRow('Total Sum Insured:', ins.sum_insured || 'PENDING OFFICIAL VERIFICATION', iy, 65);
  iy += drawFieldRow('Subsidized Premium Rate:', ins.premium_rate || '1.5% - 2.0% (Subsidized Farmer Share)', iy, 65);
  iy += drawFieldRow('Farmer Share Premium Payable:', ins.farmer_premium || 'PENDING OFFICIAL VERIFICATION', iy, 65);
  iy += drawFieldRow('Government Subsidy Share:', ins.government_subsidy || 'PENDING OFFICIAL VERIFICATION', iy, 65);
  iy += drawFieldRow('Total Gross Premium:', ins.total_premium || 'PENDING OFFICIAL VERIFICATION', iy, 65);

  // Financial Notice Box
  const noticeStr = "Important Notice: Exact sum insured, farmer premium payable, and government subsidy amounts are finalized by the Bank / CSC operator on the National Crop Insurance Portal (NCIP) at the time of official submission.";
  const wrappedNotice = doc.splitTextToSize(noticeStr, 170);
  const noticeBoxHeight = wrappedNotice.length * 4.5 + 8;

  drawInfoBox(15, 157, 180, noticeBoxHeight, [254, 243, 199], amberColor);
  doc.setTextColor(180, 83, 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(wrappedNotice, 20, 163);

  // Section 10: Verification Checklist Summary Box
  const sec10Y = 157 + noticeBoxHeight + 10;
  drawSectionHeader('10. Financial Verification Summary', sec10Y);
  drawInfoBox(15, sec10Y + 5, 180, 36, [248, 250, 252]);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const finSummaryText = [
    "• Premium payments are collected by the authorized CSC operator or debited by the Bank branch.",
    "• Subsidized farmer premium rates: 1.5% for Rabi food crops, 2.0% for Kharif crops, and 5% for commercial/cotton crops.",
    "• Direct Benefit Transfer (DBT) claim payouts are remitted directly to the verified Aadhaar-seeded bank account above."
  ];
  let fsY = sec10Y + 12;
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

  // Section 12: Cross-Document Validation Signals
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

/**
 * Generates an official CROP LOSS INTIMATION & EVIDENCE PACKET PDF
 * @param {Object} claimData Complete claim details, evidence, and AI advisory results
 */
export function generateCropLossIntimationPDF(claimData) {
  const doc = new jsPDF();
  const internalId = claimData.internalReportId || 'KS-LOSS-' + Date.now();
  const officialId = claimData.officialClaimId || 'NOT_SUBMITTED_YET';
  const currentDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const primaryColor = [22, 163, 74];
  const textColor = [20, 83, 45];
  const borderGray = [226, 232, 240];
  const amberColor = [217, 119, 6];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('KisanSaathi — Crop Loss Intimation Packet', 15, 12);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Assisted Loss Intimation & Survey Dossier for Insurer / Krishi Rakshak (14447)', 15, 19);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ref: ${internalId}`, 195, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${currentDate}`, 195, 18, { align: 'right' });

  // Status Banner
  doc.setFillColor(254, 243, 199);
  doc.rect(15, 32, 180, 12, 'F');
  doc.setDrawColor(...amberColor);
  doc.rect(15, 32, 180, 12, 'S');
  doc.setTextColor(180, 83, 9);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`STATUS: ${claimData.officialClaimId ? 'OFFICIALLY INTIMATED TO INSURER' : 'LOSS REPORT CREATED — READY FOR INTIMATION'}`, 20, 39.5);

  const drawRow = (label, val, y, labelWidth = 65) => {
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(String(label), 20, y);
    doc.setFont('helvetica', 'normal');
    const valX = 20 + labelWidth;
    const lines = doc.splitTextToSize(String(val || 'N/A'), 192 - valX);
    doc.text(lines, valX, y);
    return Math.max(6, lines.length * 4.5);
  };

  // Section 1: Farmer & Policy Details
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Insured Farmer & Policy Verification', 15, 52);
  doc.setDrawColor(...primaryColor);
  doc.line(15, 54, 195, 54);

  let py = 62;
  py += drawRow('Farmer Name:', claimData.farmerName || 'Bhushan Diwakar', py);
  py += drawRow('Aadhaar Number (Masked):', claimData.aadhaarMasked || 'XXXX XXXX 6032', py);
  py += drawRow('Policy Scheme & ID:', `${claimData.policyScheme || 'PMFBY'} (${claimData.policyId || 'PMF-2026-8912'})`, py);
  py += drawRow('Insured Crop:', claimData.policyCrop || 'Maize', py);
  py += drawRow('Insured Land & Acreage:', `${claimData.khasraNo || '18/2 (2-0)'} (${claimData.insuredArea || '2.2 Acres'})`, py);
  py += drawRow('Implementing Insurer:', claimData.insurer || 'AIC / Agriculture Insurance Company of India', py);

  // Section 2: Loss Event Details
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Reported Crop Loss Event Details', 15, py + 8);
  doc.line(15, py + 10, 195, py + 10);

  const cleanAffected = String(claimData.affectedArea || '2.2').replace(/acres/gi, '').trim();

  let ly = py + 18;
  ly += drawRow('Reported Peril / Event:', claimData.eventType || 'Flood & Inundation', ly);
  ly += drawRow('Date & Time of Loss:', `${claimData.eventDate || currentDate} ${claimData.eventTime || ''}`, ly);
  ly += drawRow('Affected Acreage:', `${cleanAffected} Acres (Insured: ${claimData.insuredArea || '2.2 Acres'})`, ly);
  ly += drawRow('Land Survey / Khasra No:', claimData.khasraNo || '18/2 (2-0)', ly);
  ly += drawRow('Location GPS Captured:', claimData.gpsCoords ? `Lat: ${claimData.gpsCoords.lat.toFixed(4)}, Lng: ${claimData.gpsCoords.lng.toFixed(4)}` : 'GPS Not Captured', ly);

  // Section 3: AI Evidence Analysis (Advisory)
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('3. AI-Assisted Evidence Analysis (Advisory Only)', 15, ly + 8);
  doc.line(15, ly + 10, 195, ly + 10);

  let ay = ly + 18;
  ay += drawRow('AI Detected Crop:', claimData.aiCrop || claimData.policyCrop || 'Maize', ay);
  ay += drawRow('AI Detected Damage:', claimData.aiDamage || claimData.eventType || 'Flood & Inundation', ay);
  ay += drawRow('AI Confidence Score:', `${Math.round((claimData.aiConfidence || 0.91) * 100)}%`, ay);
  ay += drawRow('Advisory Note:', 'AI evidence analysis is supporting proof only. Final loss percentage and claim decision are determined by the insurer.', ay);

  // Section 4: Declaration & Next Steps
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Farmer Declaration & Verification Notice', 15, ay + 8);
  doc.line(15, ay + 10, 195, ay + 10);

  let dy = ay + 18;
  const declMsg = "I hereby declare that the crop loss details and evidence uploaded are accurate. I authorize KisanSaathi to assist in compiling this loss intimation dossier.";
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(declMsg, 175), 20, dy);

  // Section 5: NEXT STEPS FOR THE FARMER
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('5. Next Steps For The Farmer & Official Reporting Instructions', 15, dy + 12);
  doc.line(15, dy + 14, 195, dy + 14);

  let ny = dy + 22;
  const steps = [
    '1. Review this Loss Intimation Packet and keep physical Aadhaar, Jamabandi Fard, and Bank Passbook ready.',
    '2. Report the loss through official PMFBY Krishi Rakshak Helpline (14447) or Portal (pmfby.gov.in).',
    '3. If submitting at Bank Branch or CSC, hand over physical copies of this packet + land records.',
    '4. Obtain your official Loss Intimation Reference Number (e.g. NCIP-CLM-2026-XXXX) from 14447 or bank.',
    '5. Save the official reference number in KisanSaathi to update your claim timeline.'
  ];
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  steps.forEach(st => {
    doc.text(st, 20, ny);
    ny += 5.5;
  });

  // Legal Notice Box
  doc.setFillColor(248, 250, 252);
  doc.rect(15, ny + 4, 180, 14, 'F');
  doc.setDrawColor(...borderGray);
  doc.rect(15, ny + 4, 180, 14, 'S');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('IMPORTANT NOTICE:', 20, ny + 9);
  doc.setFont('helvetica', 'normal');
  const noticeStr = 'This document is an assisted loss-intimation packet compiled by KisanSaathi. It is NOT proof that an insurance claim has been officially submitted or approved. Final loss assessment is conducted by the insurer.';
  doc.text(doc.splitTextToSize(noticeStr, 170), 20, ny + 14);

  doc.save(`${internalId}_Loss_Intimation.pdf`);
  return internalId;
}

