/**
 * Utility to safely convert any value (string, object, array, number) to a renderable string.
 * Prevents Minified React error #31 (Objects are not valid as a React child).
 */
export function safeStr(val, lang = 'en') {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  
  if (Array.isArray(val)) {
    return val.map(item => safeStr(item, lang)).filter(Boolean).join(', ');
  }

  if (typeof val === 'object') {
    // Try to extract matching language key
    if (val[lang]) return safeStr(val[lang], lang);
    if (val.en) return safeStr(val.en, lang);
    if (val.pa) return safeStr(val.pa, lang);
    if (val.hi) return safeStr(val.hi, lang);
    if (val.text) return safeStr(val.text, lang);
    if (val.value) return safeStr(val.value, lang);
    
    // Otherwise extract first available string property
    const keys = Object.keys(val);
    for (const k of keys) {
      const propValue = val[k];
      if (typeof propValue === 'string') return propValue;
    }
    // Fallback if nested
    if (keys.length > 0) return safeStr(val[keys[0]], lang);
  }

  return String(val);
}
