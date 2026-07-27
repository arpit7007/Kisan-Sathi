import { jsPDF } from 'jspdf';

/**
 * Generates a complete crop insurance application PDF
 * @param {Object} farmerData 
 * @param {string} aadhaarImage Base64 image string (Aadhaar Card)
 * @param {string} landRecordImage Base64 image string (Land Record)
 * @param {string} selectedPolicy PMFBY | RWBCIS | UPIS | Kshema
 * @returns {string} Unique reference ID
 */
export function generatePolicyApplicationPDF(farmerData, aadhaarImage, landRecordImage, selectedPolicy) {
  const doc = new jsPDF();
  const refId = 'KISAN-' + Date.now();
  
  // Theme colors
  const primaryColor = [22, 163, 74]; // #16a34a (Green)
  const secondaryColor = [217, 119, 6]; // #d97706 (Gold)
  const textColor = [20, 83, 45]; // #14532d (Dark green)
  const grayColor = [75, 85, 99]; // #4b5563 (Gray)
  
  // 1. Header with styling
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('KisanSaathi (ਕਿਸਾਨ ਸਾਥੀ | किसान साथी)', 20, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Digital Crop Insurance Application', 20, 25);
  
  // Reference Banner
  doc.setFillColor(240, 253, 244); // #f0fdf4
  doc.rect(15, 35, 180, 12, 'F');
  doc.setDrawColor(...primaryColor);
  doc.rect(15, 35, 180, 12, 'S');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Application Reference ID: ${refId}`, 20, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date Created: ${new Date().toLocaleDateString()}`, 140, 42);
  
  // 2. Section 1: Farmer Details (Aadhaar Extracted)
  doc.setFontSize(14);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Farmer Personal Details (extracted via AI)', 15, 60);
  
  // Draw line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(15, 63, 195, 63);
  
  // Details grid
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Full Name:', 20, 72);
  doc.text('Aadhaar Number:', 20, 80);
  doc.text('Date of Birth:', 20, 88);
  
  doc.setFont('helvetica', 'normal');
  doc.text(farmerData.name || 'N/A', 60, 72);
  doc.text(farmerData.aadhaarNumber ? String(farmerData.aadhaarNumber).replace(/.(?=.{4})/g, 'x') : 'N/A', 60, 80);
  doc.text(farmerData.dob || 'N/A', 60, 88);
  
  // 3. Section 2: Land & Crop Details (Land Record Extracted)
  doc.setFontSize(14);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Farm Land & Crop Profile', 15, 102);
  
  // Draw line
  doc.line(15, 105, 195, 105);
  
  // Details grid
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('District / Tehsil:', 20, 114);
  doc.text('Total Farm Size:', 20, 122);
  doc.text('Irrigation Status:', 20, 130);
  doc.text('Primary Crop:', 20, 138);
  
  doc.setFont('helvetica', 'normal');
  doc.text(farmerData.district || 'N/A', 60, 114);
  doc.text(`${farmerData.acres || 'N/A'} Acres`, 60, 122);
  doc.text(farmerData.landType || 'Mixed', 60, 130);
  doc.text(farmerData.crop || 'Cotton', 60, 138);
  
  // 4. Section 3: Selected Policy Details
  doc.setFontSize(14);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Selected Crop Insurance Policy', 15, 152);
  
  // Draw line
  doc.line(15, 155, 195, 155);
  
  // Info
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Insurance Program:', 20, 164);
  doc.text('Bank Account:', 20, 172);
  doc.text('IFSC Code:', 20, 180);
  
  doc.setFont('helvetica', 'normal');
  doc.text(selectedPolicy || 'PMFBY (Pradhan Mantri Fasal Bima Yojana)', 60, 164);
  doc.text('____________________________________ (To fill at bank)', 60, 172);
  doc.text('___________ (To fill at bank)', 60, 180);
  
  // 5. Section 4: Signature & Signoff
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('I hereby declare that the details provided above are true to the best of my knowledge.', 15, 198);
  
  doc.setTextColor(0, 0, 0);
  doc.text('Farmer Signature: _______________________', 15, 212);
  doc.text('Date: _________________', 140, 212);
  
  // Add a page break for attaching document scans!
  doc.addPage();
  
  // Header on Page 2
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Attachments (Ref: ${refId})`, 20, 10);
  
  // 6. Section 5: Embedded Document Scans (Aadhaar and Land Record)
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.text('4. Scanned Documents Verification', 15, 30);
  doc.line(15, 33, 195, 33);
  
  // Aadhaar Image
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('A. Scanned Aadhaar Identity Proof', 15, 43);
  
  if (aadhaarImage) {
    try {
      doc.addImage(aadhaarImage, 'JPEG', 15, 48, 85, 55);
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text('Aadhaar image embedded successfully.', 15, 107);
    } catch (e) {
      console.error("Error adding Aadhaar image to PDF:", e);
      doc.setFontSize(9);
      doc.setTextColor(220, 38, 38);
      doc.text('[Aadhaar Image Attachment Placeholder - Failed to render image buffer]', 15, 55);
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.text('[Aadhaar Card Scan Not Uploaded]', 15, 55);
  }
  
  // Land Record Image
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('B. Scanned Land Record / Jamabandi Document', 15, 120);
  
  if (landRecordImage) {
    try {
      doc.addImage(landRecordImage, 'JPEG', 15, 125, 85, 55);
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text('Land record image embedded successfully.', 15, 184);
    } catch (e) {
      console.error("Error adding Land record image to PDF:", e);
      doc.setFontSize(9);
      doc.setTextColor(220, 38, 38);
      doc.text('[Land Record Image Attachment Placeholder - Failed to render image buffer]', 15, 132);
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.text('[Land Record Scan Not Uploaded]', 15, 132);
  }
  
  // 7. Footer Instructions
  doc.setFillColor(243, 244, 246); // Light gray #f3f4f6
  doc.rect(15, 245, 180, 25, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SUBMISSION INSTRUCTIONS:', 20, 251);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('1. Print this downloaded PDF document in color or black & white.', 20, 256);
  doc.text('2. Verify the auto-filled details, sign the document in the Signature block above.', 20, 261);
  doc.text('3. Submit the signed application to your nearest Common Service Centre (CSC) or bank agent.', 20, 266);
  
  // Save PDF
  const filename = `KisanSaathi_${(farmerData.name || 'Farmer').replace(/\s+/g, '_')}_Application.pdf`;
  doc.save(filename);
  
  return refId;
}
