// content.js for KisanSaathi Chrome Extension
console.log("KisanSaathi Extension Loaded on:", window.location.href);

// 1. Sync profile from KisanSaathi page
if (window.location.host.includes("localhost") || window.location.host.includes("vercel.app")) {
  window.addEventListener("message", (event) => {
    // Only accept messages from ourselves
    if (event.source !== window) return;
    
    if (event.data && event.data.type === "KISAN_SATHI_SYNC_PROFILE") {
      const { profile, policy } = event.data;
      console.log("Received profile from KisanSaathi:", profile, policy);
      
      chrome.storage.local.set({ farmerProfile: profile, selectedPolicy: policy }, () => {
        console.log("Profile saved to extension storage.");
        // Notify the web page that extension successfully saved it
        window.postMessage({ type: "KISAN_SATHI_SYNC_SUCCESS" }, "*");
      });
    }
  });
}

// 2. Interactive Guided Walkthrough on PMFBY site
if (window.location.host.includes("pmfby.gov.in")) {
  // Initialize the widget
  runWalkthrough();
  
  // Continuously monitor the DOM state for route changes or async elements loading
  setInterval(runWalkthrough, 2500);
}

function runWalkthrough() {
  chrome.storage.local.get(["farmerProfile", "selectedPolicy"], (data) => {
    if (!data.farmerProfile) {
      console.log("No farmer profile synced from KisanSaathi yet.");
      return;
    }
    createFloatingWidget(data.farmerProfile, data.selectedPolicy);
  });
}

function findFarmerCornerElement() {
  // Search all anchors
  const anchors = document.getElementsByTagName("a");
  for (let a of anchors) {
    const text = a.innerText.toLowerCase();
    if (text.includes("farmer corner") || text.includes("farmer") || text.includes("किसान") || text.includes("ਕਿਸਾਨ")) {
      return a;
    }
  }
  
  // Search all buttons
  const buttons = document.getElementsByTagName("button");
  for (let b of buttons) {
    const text = b.innerText.toLowerCase();
    if (text.includes("farmer corner") || text.includes("farmer") || text.includes("किसान") || text.includes("ਕਿਸਾਨ")) {
      return b;
    }
  }

  // Search divs containing text with role="button" or similar
  const divs = document.querySelectorAll("div, p, h3, h4, span");
  for (let d of divs) {
    if (d.children.length === 0) { // Leaf node
      const text = d.innerText.toLowerCase();
      if ((text.includes("farmer corner") || text.includes("farmer") || text.includes("किसान")) && d.closest("a, button, [role='button']")) {
        return d.closest("a, button, [role='button']");
      }
    }
  }
  
  return null;
}

function detectCurrentStep() {
  const url = window.location.href.toLowerCase();
  
  // Try to find the Farmer Corner link (usually on home page)
  const farmerCornerEl = findFarmerCornerElement();
  
  if (farmerCornerEl && (url.endsWith("pmfby.gov.in/") || url.includes("index.html") || url.includes("home") || url.includes("pmfby.gov.in/index") || url.endsWith("gov.in"))) {
    return { step: 1, element: farmerCornerEl };
  }
  
  // Check for login / registration
  const inputs = document.getElementsByTagName("input");
  let hasMobileInput = false;
  let hasAadhaarInput = false;
  let hasBankInput = false;
  let mobileInputEl = null;
  
  for (let input of inputs) {
    if (input.type === 'hidden') continue;
    
    const placeholder = (input.placeholder || "").toLowerCase();
    const name = (input.name || "").toLowerCase();
    const id = (input.id || "").toLowerCase();
    
    if (placeholder.includes("mobile") || name.includes("mobile") || id.includes("mobile") || placeholder.includes("phone") || name.includes("phone") || id.includes("phone")) {
      hasMobileInput = true;
      mobileInputEl = input;
    }
    if (name.includes("aadhaar") || id.includes("aadhaar") || name.includes("uid") || id.includes("uid")) {
      hasAadhaarInput = true;
    }
    if (name.includes("bank") || id.includes("bank") || name.includes("account") || id.includes("account")) {
      hasBankInput = true;
    }
  }
  
  if (hasMobileInput && !hasBankInput) {
    return { step: 2, element: mobileInputEl };
  }
  
  // Default step 3 (form filling)
  return { step: 3, element: null };
}

function highlightElementToClick(el) {
  // Prevent highlighting multiple times
  if (el.dataset.kisansaathiHighlighted) return;
  el.dataset.kisansaathiHighlighted = "true";

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.style.outline = "4px dashed #dc2626";
  el.style.outlineOffset = "4px";
  el.style.transition = "outline 0.3s ease";
  
  // Inject pulsing animation style
  if (!document.getElementById("kisansaathi-animation-style")) {
    const style = document.createElement('style');
    style.id = "kisansaathi-animation-style";
    style.innerHTML = `
      @keyframes pulse-highlight {
        0% { outline-color: #dc2626; box-shadow: 0 0 0 0px rgba(220, 38, 38, 0.4); }
        70% { outline-color: #ef4444; box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
        100% { outline-color: #dc2626; box-shadow: 0 0 0 0px rgba(220, 38, 38, 0); }
      }
    `;
    document.head.appendChild(style);
  }
  
  el.style.animation = "pulse-highlight 1.5s infinite";
}

function createFloatingWidget(profile, policy) {
  // Check if already exists
  let div = document.getElementById("kisansaathi-extension-widget");
  if (!div) {
    div = document.createElement("div");
    div.id = "kisansaathi-extension-widget";
    div.style.position = "fixed";
    div.style.top = "80px";
    div.style.right = "20px";
    div.style.zIndex = "2147483647"; // Float above everything
    div.style.width = "340px";
    div.style.backgroundColor = "#ffffff";
    div.style.border = "3px solid #16a34a";
    div.style.borderRadius = "20px";
    div.style.boxShadow = "0 15px 35px rgba(0,0,0,0.2)";
    div.style.fontFamily = "system-ui, -apple-system, sans-serif";
    div.style.padding = "18px";
    div.style.color = "#1e293b";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.gap = "12px";
    document.body.appendChild(div);
  }
  
  const stepInfo = detectCurrentStep();
  const currentStep = stepInfo.step;
  const targetElement = stepInfo.element;
  
  if (targetElement) {
    highlightElementToClick(targetElement);
  }
  
  let stepHtml = "";
  if (currentStep === 1) {
    stepHtml = `
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 12px; text-align: left;">
        <span style="font-size: 11px; font-weight: bold; color: #1d4ed8; text-transform: uppercase; display: block;">Step 1: Locate Farmer Corner</span>
        <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 600; color: #1e3a8a; line-height: 1.4;">
          Please click on the highlighted red pulsing <strong style="color: #dc2626;">"Farmer Corner"</strong> card on the screen to open the farmer access portal.
        </p>
      </div>
    `;
  } else if (currentStep === 2) {
    stepHtml = `
      <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 12px; text-align: left;">
        <span style="font-size: 11px; font-weight: bold; color: #b45309; text-transform: uppercase; display: block;">Step 2: Authenticate Mobile</span>
        <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 600; color: #78350f; line-height: 1.4;">
          Type your registered mobile number in the highlighted field, input the Captcha code shown, and click <strong>"Request OTP"</strong>.
        </p>
      </div>
    `;
  } else {
    stepHtml = `
      <div style="background-color: #dcfce7; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px; text-align: left; display: flex; flex-direction: column; gap: 8px;">
        <div>
          <span style="font-size: 11px; font-weight: bold; color: #15803d; text-transform: uppercase; display: block;">Step 3: Autofill Registration</span>
          <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 600; color: #14532d; line-height: 1.4;">
            The AI Agent will now automatically sync your profile details and populate all matching inputs.
          </p>
        </div>
        <button id="kisansaathi-autofill-btn" style="width: 100%; background-color: #16a34a; color: white; border: none; padding: 10px; border-radius: 10px; font-weight: bold; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background-color 0.2s;">
          ⚡ AI Autofill Form
        </button>
      </div>
    `;
  }
  
  div.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="background-color: #dcfce7; padding: 6px; border-radius: 8px; font-size: 18px;">🌾</div>
        <div style="text-align: left;">
          <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #14532d;">KisanSaathi Assistant</h4>
          <span style="font-size: 9px; font-weight: 700; color: #16a34a; text-transform: uppercase;">Interactive Walkthrough</span>
        </div>
      </div>
      <button id="kisansaathi-close-widget" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #64748b; font-weight: bold;">✕</button>
    </div>
    
    <div style="font-size: 11px; line-height: 1.4; color: #334155; text-align: left;">
      <p style="margin: 0 0 4px 0;"><strong>Farmer Profile:</strong> ${profile.name}</p>
      <p style="margin: 0 0 4px 0;"><strong>Enrolling In:</strong> ${policy} (${profile.primaryCrop})</p>
    </div>
    
    ${stepHtml}
    
    <div id="kisansaathi-status" style="font-size: 10px; text-align: center; color: #64748b; font-style: italic;">
      ${currentStep < 3 ? 'Follow the highlighted steps on the screen.' : 'Click Autofill to populate form fields.'}
    </div>
    
    <div style="border-top: 1px solid #f1f5f9; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase;">
      <span>District: ${profile.district}</span>
      <span>Land: ${profile.landSize} Acres</span>
    </div>
  `;
  
  // Hook events
  const closeBtn = document.getElementById("kisansaathi-close-widget");
  if (closeBtn) closeBtn.onclick = () => div.remove();
  
  const autofillBtn = document.getElementById("kisansaathi-autofill-btn");
  if (autofillBtn) {
    autofillBtn.onmouseover = () => autofillBtn.style.backgroundColor = "#15803d";
    autofillBtn.onmouseout = () => autofillBtn.style.backgroundColor = "#16a34a";
    autofillBtn.onclick = () => triggerAutofill(profile, policy);
  }
}

function triggerAutofill(profile, policy) {
  const statusDiv = document.getElementById("kisansaathi-status");
  statusDiv.innerText = "Scanning page inputs...";
  statusDiv.style.color = "#16a34a";
  
  setTimeout(() => {
    statusDiv.innerText = "Autofilling farmer details...";
    
    const inputs = document.getElementsByTagName("input");
    const selects = document.getElementsByTagName("select");
    let filledCount = 0;
    
    // Fill text inputs
    for (let input of inputs) {
      if (input.type === 'hidden') continue;
      
      const placeholder = (input.placeholder || "").toLowerCase();
      const name = (input.name || "").toLowerCase();
      const id = (input.id || "").toLowerCase();
      const label = getLabelText(input).toLowerCase();
      
      // Name
      if (name.includes("name") || id.includes("name") || label.includes("name") || placeholder.includes("name") || label.includes("ਕਿਸਾਨ") || label.includes("नाम")) {
        input.value = profile.name;
        highlightField(input);
        filledCount++;
      }
      
      // Aadhaar
      else if (name.includes("aadhaar") || id.includes("aadhaar") || label.includes("aadhaar") || placeholder.includes("aadhaar") || name.includes("uid") || id.includes("uid")) {
        input.value = profile.aadhaar ? "12345678" + profile.aadhaar : "123456789012";
        highlightField(input);
        filledCount++;
      }
      
      // Mobile / Phone
      else if (name.includes("mobile") || id.includes("mobile") || label.includes("mobile") || placeholder.includes("mobile") || name.includes("phone") || id.includes("phone") || placeholder.includes("phone")) {
        input.value = profile.phone || "9876543210";
        highlightField(input);
        filledCount++;
      }
      
      // Land Size
      else if (name.includes("area") || id.includes("area") || label.includes("area") || name.includes("land") || id.includes("land") || label.includes("acres") || placeholder.includes("acres") || label.includes("रकबा") || label.includes("ਜ਼ਮੀਨ")) {
        input.value = profile.landSize;
        highlightField(input);
        filledCount++;
      }
    }
    
    // Select inputs (State, District, Crop, Scheme)
    for (let select of selects) {
      const name = (select.name || "").toLowerCase();
      const id = (select.id || "").toLowerCase();
      const label = getLabelText(select).toLowerCase();
      
      // State -> Punjab
      if (name.includes("state") || id.includes("state") || label.includes("state") || label.includes("ਸੂਬਾ") || label.includes("राज्य")) {
        selectValueByText(select, "Punjab");
        highlightField(select);
        filledCount++;
      }
      
      // District
      else if (name.includes("district") || id.includes("district") || label.includes("district") || label.includes("ਜ਼ਿਲ੍ਹਾ") || label.includes("जिला")) {
        selectValueByText(select, profile.district);
        highlightField(select);
        filledCount++;
      }
      
      // Crop
      else if (name.includes("crop") || id.includes("crop") || label.includes("crop") || label.includes("ਫਸਲ") || label.includes("फसल")) {
        selectValueByText(select, profile.primaryCrop);
        highlightField(select);
        filledCount++;
      }
      
      // Scheme
      else if (name.includes("scheme") || id.includes("scheme") || label.includes("scheme") || name.includes("policy") || id.includes("policy")) {
        selectValueByText(select, policy);
        highlightField(select);
        filledCount++;
      }
    }
    
    statusDiv.innerHTML = `<span style="color: #16a34a; font-weight: bold;">⚡ AI Autofill Completed! (${filledCount} fields filled)</span>`;
  }, 1000);
}

// Helper to get label text associated with input
function getLabelText(element) {
  if (element.labels && element.labels.length > 0) {
    return element.labels[0].innerText;
  }
  let parent = element.parentElement;
  while (parent) {
    if (parent.tagName === "LABEL") return parent.innerText;
    parent = parent.parentElement;
  }
  return element.getAttribute("aria-label") || "";
}

// Helper to select option in select list by text
function selectValueByText(select, textVal) {
  if (!textVal) return;
  const searchVal = textVal.toLowerCase();
  
  for (let option of select.options) {
    const optText = option.text.toLowerCase();
    const optVal = option.value.toLowerCase();
    if (optText.includes(searchVal) || optVal.includes(searchVal)) {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      break;
    }
  }
}

// Helper to flash input field in light green to highlight it was filled
function highlightField(element) {
  element.style.backgroundColor = "#dcfce7";
  element.style.border = "2px solid #16a34a";
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}
