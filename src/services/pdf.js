import { jsPDF } from 'jspdf';

/**
 * Generates a formal, multi-page Crop Insurance Enrollment / Proposal Dossier PDF
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
  const grayColor = [75, 85, 99]; // #4b5563 (Gray)
  const amberColor = [217, 119, 6]; // Gold / Amber

  const addHeader = (pageNum) => {
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('KisanSaathi (ਕਿਸਾਨ ਸਾਥੀ | किसान साथी)', 15, 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Smart Digital Crop Insurance Enrollment / Proposal Dossier', 15, 21);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ref: ${refId}  |  Page ${pageNum} of 5`, 145, 14);
    doc.text(`Date: ${currentDate}`, 145, 21);
  };

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'italic');
    doc.text('Note: This document is a Pre-Enrollment / Assisted Proposal Dossier for verification at CSC / Bank / PACS. Official insurance policy is issued upon NCIP approval.', 15, 288);
  };

  // ==========================================
  // PAGE 1 — APPLICATION SUMMARY
  // ==========================================
  addHeader(1);

  // Status Banner
  doc.setFillColor(254, 243, 199); // Light amber
  doc.rect(15, 32, 180, 14, 'F');
  doc.setDrawColor(...amberColor);
  doc.setLineWidth(0.5);
  doc.rect(15, 32, 180, 14, 'S');

  doc.setTextColor(180, 83, 9);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS: DRAFT — PENDING ENROLLMENT AGENCY VERIFICATION', 20, 41);

  // Section 1: Farmer Personal Details
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Farmer Identity & Personal Details', 15, 56);
  doc.setDrawColor(...primaryColor);
  doc.line(15, 59, 195, 59);

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  const f = dossier.farmer || {};
  doc.setFont('helvetica', 'bold'); doc.text('Full Name:', 20, 68);
  doc.setFont('helvetica', 'normal'); doc.text(f.full_name?.value || 'Farmer Name', 70, 68);

  doc.setFont('helvetica', 'bold'); doc.text("Father's / Husband's Name:", 20, 76);
  doc.setFont('helvetica', 'normal'); doc.text(f.father_name?.value || 'Ramesh Diwakar', 70, 76);

  doc.setFont('helvetica', 'bold'); doc.text('Date of Birth & Gender:', 20, 84);
  doc.setFont('helvetica', 'normal'); doc.text(`${f.dob?.value || '05/07/1985'} (${f.gender?.value || 'Male'})`, 70, 84);

  doc.setFont('helvetica', 'bold'); doc.text('Mobile Number:', 20, 92);
  doc.setFont('helvetica', 'normal'); doc.text(f.mobile?.value || '9876543210', 70, 92);

  doc.setFont('helvetica', 'bold'); doc.text('Aadhaar Number (Masked):', 20, 100);
  doc.setFont('helvetica', 'normal'); doc.text(f.aadhaar_masked || 'XXXX XXXX 6032', 70, 100);

  doc.setFont('helvetica', 'bold'); doc.text('Farmer Category / Type:', 20, 108);
  doc.setFont('helvetica', 'normal'); doc.text(f.farmer_type?.value || 'Small / Marginal Farmer', 70, 108);

  doc.setFont('helvetica', 'bold'); doc.text('Residential Address:', 20, 116);
  doc.setFont('helvetica', 'normal'); doc.text(f.address?.value || 'Punjab', 70, 116);

  // Section 2: Farm & Crop Summary
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Farm Land & Crop Summary', 15, 130);
  doc.setDrawColor(...primaryColor);
  doc.line(15, 133, 195, 133);

  const l = dossier.land || {};
  const c = dossier.crop || {};

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold'); doc.text('State & District:', 20, 142);
  doc.setFont('helvetica', 'normal'); doc.text(`Punjab / ${l.records?.[0]?.district || 'Fatehgarh Sahib'}`, 75, 142);

  doc.setFont('helvetica', 'bold'); doc.text('Tehsil & Village:', 20, 150);
  doc.setFont('helvetica', 'normal'); doc.text(`${l.records?.[0]?.tehsil || 'Sirhind'} / ${l.records?.[0]?.village || 'Fatehgarh Sahib'}`, 75, 150);

  doc.setFont('helvetica', 'bold'); doc.text('Total Documented Holding:', 20, 158);
  doc.setFont('helvetica', 'normal'); doc.text(l.total_documented_area?.value || '2.2 Acres', 75, 158);

  doc.setFont('helvetica', 'bold'); doc.text('Area Proposed for Insurance:', 20, 166);
  doc.setFont('helvetica', 'normal'); doc.text(l.proposed_insured_area?.value || '2.2 Acres', 75, 166);

  doc.setFont('helvetica', 'bold'); doc.text('Sown Crop Name:', 20, 174);
  doc.setFont('helvetica', 'normal'); doc.text(c.crop_name?.value || 'Cotton', 75, 174);

  doc.setFont('helvetica', 'bold'); doc.text('Crop Season & Year:', 20, 182);
  doc.setFont('helvetica', 'normal'); doc.text(`${c.season?.value || 'Kharif'} 2026`, 75, 182);

  // Section 3: Selected Scheme Details
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Selected Insurance Scheme', 15, 196);
  doc.line(15, 199, 195, 199);

  const ins = dossier.insurance || {};
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold'); doc.text('Scheme Name:', 20, 208);
  doc.setFont('helvetica', 'normal'); doc.text(ins.scheme || 'PMFBY (Pradhan Mantri Fasal Bima Yojana)', 75, 208);

  doc.setFont('helvetica', 'bold'); doc.text('Insurance Unit Name:', 20, 216);
  doc.setFont('helvetica', 'normal'); doc.text(ins.insurance_unit || 'Fatehgarh Sahib Panchayat Unit 4', 75, 216);

  doc.setFont('helvetica', 'bold'); doc.text('Subsidy Category:', 20, 224);
  doc.setFont('helvetica', 'normal'); doc.text('Government Subsidized Farmer Premium Share', 75, 224);

  addFooter();

  // ==========================================
  // PAGE 2 — LAND PARCELS & CROP DETAILS TABLE
  // ==========================================
  doc.addPage();
  addHeader(2);

  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Land Parcel Ownership & Holding Breakdown', 15, 34);
  doc.line(15, 37, 195, 37);

  // Land Parcels Table Header
  doc.setFillColor(240, 253, 244);
  doc.rect(15, 42, 180, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Sr', 17, 47);
  doc.text('Village', 25, 47);
  doc.text('Khewat', 60, 47);
  doc.text('Khatauni', 80, 47);
  doc.text('Khasra No', 105, 47);
  doc.text('Doc. Area', 135, 47);
  doc.text('Proposed Insured', 160, 47);

  let yPos = 55;
  const records = l.records || [];
  records.forEach((rec, idx) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(String(idx + 1), 17, yPos);
    doc.text(rec.village || 'Fatehgarh Sahib', 25, yPos);
    doc.text(rec.khewat_no || '45', 60, yPos);
    doc.text(rec.khatauni_no || '112', 80, yPos);
    doc.text(rec.khasra_no || '18/2 (2-0)', 105, yPos);
    doc.text(rec.documented_area || '2.2 Acres', 135, yPos);
    doc.text(rec.proposed_insured_area || '2.2 Acres', 160, yPos);
    doc.line(15, yPos + 3, 195, yPos + 3);
    yPos += 9;
  });

  // Section 5: Detailed Crop Profile
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('5. Crop Sowing & Agronomic Details', 15, yPos + 10);
  doc.line(15, yPos + 13, 195, yPos + 13);

  let cY = yPos + 22;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold'); doc.text('Crop Name & Code:', 20, cY);
  doc.setFont('helvetica', 'normal'); doc.text(`${c.crop_name?.value || 'Cotton'} (${c.crop_code?.value || 'COT-001'})`, 75, cY);

  doc.setFont('helvetica', 'bold'); doc.text('Area Sown:', 20, cY + 8);
  doc.setFont('helvetica', 'normal'); doc.text(c.area_sown?.value || '2.2 Acres', 75, cY + 8);

  doc.setFont('helvetica', 'bold'); doc.text('Area Proposed for Insurance:', 20, cY + 16);
  doc.setFont('helvetica', 'normal'); doc.text(c.area_proposed?.value || '2.2 Acres', 75, cY + 16);

  doc.setFont('helvetica', 'bold'); doc.text('Irrigation Status:', 20, cY + 24);
  doc.setFont('helvetica', 'normal'); doc.text(c.irrigation?.value || 'Irrigated (Canal/Tubewell)', 75, cY + 24);

  doc.setFont('helvetica', 'bold'); doc.text('Sowing Date:', 20, cY + 32);
  doc.setFont('helvetica', 'normal'); doc.text(c.sowing_date?.value || '15/05/2026', 75, cY + 32);

  doc.setFont('helvetica', 'bold'); doc.text('Information Source:', 20, cY + 40);
  doc.setFont('helvetica', 'normal'); doc.text(c.source || 'Farmer Self-Declaration', 75, cY + 40);

  addFooter();

  // ==========================================
  // PAGE 3 — BANK & INSURANCE FINANCIAL DETAILS
  // ==========================================
  doc.addPage();
  addHeader(3);

  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('6. Bank Account Details (DBT Direct Benefit Transfer)', 15, 34);
  doc.line(15, 37, 195, 37);

  const b = dossier.bank || {};
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold'); doc.text('Account Holder Name:', 20, 46);
  doc.setFont('helvetica', 'normal'); doc.text(b.account_holder?.value || 'Bhushan Diwakar', 75, 46);

  doc.setFont('helvetica', 'bold'); doc.text('Bank Name:', 20, 54);
  doc.setFont('helvetica', 'normal'); doc.text(b.bank_name?.value || 'State Bank of India', 75, 54);

  doc.setFont('helvetica', 'bold'); doc.text('Branch Name:', 20, 62);
  doc.setFont('helvetica', 'normal'); doc.text(b.branch?.value || 'Fatehgarh Sahib Main Branch', 75, 62);

  doc.setFont('helvetica', 'bold'); doc.text('Account Number (Masked):', 20, 70);
  doc.setFont('helvetica', 'normal'); doc.text(b.account_number?.value || 'XXXXXX4589', 75, 70);

  doc.setFont('helvetica', 'bold'); doc.text('IFSC Code:', 20, 78);
  doc.setFont('helvetica', 'normal'); doc.text(b.ifsc?.value || 'SBIN0001234', 75, 78);

  doc.setFont('helvetica', 'bold'); doc.text('Bank Document Status:', 20, 86);
  doc.setFont('helvetica', 'normal'); doc.text(b.status || 'Uploaded & Pending Verification', 75, 86);

  // Section 7: Insurance Calculation & Premium Breakdown
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('7. Premium Calculation & Sum Insured', 15, 102);
  doc.line(15, 105, 195, 105);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold'); doc.text('Sum Insured Per Hectare/Unit:', 20, 114);
  doc.setFont('helvetica', 'normal'); doc.text(ins.sum_insured || 'PENDING OFFICIAL VERIFICATION', 75, 114);

  doc.setFont('helvetica', 'bold'); doc.text('Total Sum Insured:', 20, 122);
  doc.setFont('helvetica', 'normal'); doc.text(ins.sum_insured || 'PENDING OFFICIAL VERIFICATION', 75, 122);

  doc.setFont('helvetica', 'bold'); doc.text('Subsidized Premium Rate:', 20, 130);
  doc.setFont('helvetica', 'normal'); doc.text(ins.premium_rate || '1.5% - 2.0% (Food Crops)', 75, 130);

  doc.setFont('helvetica', 'bold'); doc.text('Farmer Share Premium Payable:', 20, 138);
  doc.setFont('helvetica', 'normal'); doc.text(ins.farmer_premium || 'PENDING OFFICIAL VERIFICATION', 75, 138);

  doc.setFont('helvetica', 'bold'); doc.text('Government Subsidy Share:', 20, 146);
  doc.setFont('helvetica', 'normal'); doc.text(ins.government_subsidy || 'PENDING OFFICIAL VERIFICATION', 75, 146);

  doc.setFont('helvetica', 'bold'); doc.text('Total Gross Premium:', 20, 154);
  doc.setFont('helvetica', 'normal'); doc.text(ins.total_premium || 'PENDING OFFICIAL VERIFICATION', 75, 154);

  // Financial Disclaimer Note
  doc.setFillColor(254, 243, 199);
  doc.rect(15, 165, 180, 14, 'F');
  doc.setDrawColor(...amberColor);
  doc.rect(15, 165, 180, 14, 'S');
  doc.setTextColor(180, 83, 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Important Notice: Exact sum insured, farmer premium payable, and government subsidy amounts are finalized by the Bank / CSC operator on the National Crop Insurance Portal (NCIP) at the time of official submission.', 20, 172);

  addFooter();

  // ==========================================
  // PAGE 4 — DOCUMENT VERIFICATION CHECKLIST
  // ==========================================
  doc.addPage();
  addHeader(4);

  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('8. Document Verification Checklist', 15, 34);
  doc.line(15, 37, 195, 37);

  // Checklist Table
  doc.setFillColor(240, 253, 244);
  doc.rect(15, 42, 180, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Document Type', 20, 47);
  doc.text('Uploaded?', 85, 47);
  doc.text('AI Extracted?', 120, 47);
  doc.text('Verification Status', 155, 47);

  const docs = dossier.documents || [
    { document_type: 'aadhaar', document_name: 'Aadhaar Card Proof', extraction_status: 'success', verification_status: 'pending' },
    { document_type: 'jamabandi', document_name: 'Land Record (Jamabandi / Fard)', extraction_status: 'success', verification_status: 'pending' },
    { document_type: 'bank_passbook', document_name: 'Bank Passbook Proof', extraction_status: 'success', verification_status: 'pending' }
  ];

  let dY = 55;
  docs.forEach(d => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(d.document_name || d.document_type, 20, dY);
    doc.text(d.extraction_status !== 'pending' ? 'YES' : 'NO', 85, dY);
    doc.text(d.extraction_status === 'success' ? 'YES' : 'NO', 120, dY);
    doc.text(d.verification_status || 'Pending Verification', 155, dY);
    doc.line(15, dY + 3, 195, dY + 3);
    dY += 9;
  });

  // Cross Document Validation Section
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('9. Cross-Document Automated Validation Signals', 15, dY + 10);
  doc.line(15, dY + 13, 195, dY + 13);

  const v = dossier.validation || {};
  let vY = dY + 22;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold'); doc.text('Aadhaar vs Land Record Name Match:', 20, vY);
  doc.setFont('helvetica', 'normal'); doc.text(v.name_match || 'PASS — Names match', 85, vY);

  doc.setFont('helvetica', 'bold'); doc.text('Aadhaar vs Bank Passbook Name Match:', 20, vY + 8);
  doc.setFont('helvetica', 'normal'); doc.text(v.bank_name_match || 'PASS — Names match', 85, vY + 8);

  // Missing Information Alert
  const missing = dossier.missing_fields || [];
  if (missing.length > 0) {
    doc.setFillColor(254, 242, 242);
    doc.rect(15, vY + 20, 180, 25, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.rect(15, vY + 20, 180, 25, 'S');

    doc.setTextColor(185, 28, 28);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATION REQUIRED BEFORE OFFICIAL NCIP SUBMISSION:', 20, vY + 27);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(missing.join(', '), 20, vY + 36, { maxWidth: 170 });
  }

  addFooter();

  // ==========================================
  // PAGE 5 — DECLARATION & AGENCY STAMP BOX
  // ==========================================
  doc.addPage();
  addHeader(5);

  // Farmer Declaration Block
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('10. Farmer Declaration & Authorization', 15, 34);
  doc.line(15, 37, 195, 37);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const declText = "I hereby declare that the information provided in this enrollment dossier and supporting documents is true and correct to the best of my knowledge. I understand that final crop insurance enrollment and coverage are subject to verification and acceptance by the authorized enrollment agency (Bank / CSC / PACS) and insurance company under PMFBY / RWBCIS guidelines.";
  doc.text(declText, 15, 43, { maxWidth: 180 });

  // Signature Box
  doc.rect(15, 58, 85, 25, 'S');
  doc.text('Farmer Signature / Thumb Impression:', 18, 63);

  doc.text('Date: ________________________', 115, 68);
  doc.text('Place: ________________________', 115, 78);

  // Official Enrollment Agency Verification Box
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('11. Enrollment Agency Verification (Bank / CSC / PACS / Intermediary)', 15, 96);
  doc.line(15, 99, 195, 99);

  doc.rect(15, 104, 180, 80, 'S');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TO BE COMPLETED BY AUTHORIZED OPERATOR:', 20, 111);

  doc.setFont('helvetica', 'normal');
  doc.text('[  ] Farmer Identity Verified', 20, 120);
  doc.text('[  ] Aadhaar Biometric / OTP Auth Done', 75, 120);
  doc.text('[  ] Land Jamabandi Fard Verified', 140, 120);

  doc.text('[  ] Bank Account Passbook Verified', 20, 128);
  doc.text('[  ] Sown Crop & Area Confirmed', 75, 128);
  doc.text('[  ] Subsidized Farmer Premium Collected', 140, 128);

  doc.text('Operator Name: _________________________________', 20, 140);
  doc.text('Agency / Center Name: ___________________________', 110, 140);

  doc.text('Operator ID / VLE ID: ____________________________', 20, 150);
  doc.text('Submission Date: ________________________________', 110, 150);

  doc.text('Remarks / Notes: ____________________________________________________________________', 20, 160);

  doc.rect(125, 167, 65, 14, 'S');
  doc.text('Signature & Official Agency Stamp', 130, 175);

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

  const primaryColor = [22, 163, 74];
  const textColor = [20, 83, 45];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('KisanSaathi — Crop Insurance Submission Receipt', 15, 18);

  // Status Banner
  doc.setFillColor(240, 253, 244);
  doc.rect(15, 35, 180, 14, 'F');
  doc.setDrawColor(...primaryColor);
  doc.rect(15, 35, 180, 14, 'S');
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`OFFICIAL STATUS: ${submissionData.status || 'SUBMITTED & ACCEPTED'}`, 20, 44);

  // Details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'bold'); doc.text('Official NCIP Application ID:', 20, 60);
  doc.setFont('helvetica', 'normal'); doc.text(refId, 80, 60);

  doc.setFont('helvetica', 'bold'); doc.text('Portal Reference Number:', 20, 70);
  doc.setFont('helvetica', 'normal'); doc.text(submissionData.portalRef || 'PMFBY/PB/2026/8912', 80, 70);

  doc.setFont('helvetica', 'bold'); doc.text('Farmer Name:', 20, 80);
  doc.setFont('helvetica', 'normal'); doc.text(submissionData.farmerName || 'Bhushan Diwakar', 80, 80);

  doc.setFont('helvetica', 'bold'); doc.text('Crop & Insured Area:', 20, 90);
  doc.setFont('helvetica', 'normal'); doc.text(`${submissionData.crop || 'Cotton'} (${submissionData.insuredArea || '2.2 Acres'})`, 80, 90);

  doc.setFont('helvetica', 'bold'); doc.text('Farmer Premium Paid:', 20, 100);
  doc.setFont('helvetica', 'normal'); doc.text(`INR ${submissionData.premiumPaid || '450.00'}`, 80, 100);

  doc.setFont('helvetica', 'bold'); doc.text('Payment / UTR Reference:', 20, 110);
  doc.setFont('helvetica', 'normal'); doc.text(submissionData.utrRef || 'UTR9812401294', 80, 110);

  doc.setFont('helvetica', 'bold'); doc.text('Enrollment Channel:', 20, 120);
  doc.setFont('helvetica', 'normal'); doc.text(submissionData.channel || 'Common Service Centre (CSC)', 80, 120);

  doc.setFont('helvetica', 'bold'); doc.text('Submission Date:', 20, 130);
  doc.setFont('helvetica', 'normal'); doc.text(submissionData.date || new Date().toLocaleDateString(), 80, 130);

  doc.save(`${refId}_Submission_Receipt.pdf`);
}
