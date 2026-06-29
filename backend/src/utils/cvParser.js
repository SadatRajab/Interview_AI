/**
 * ============================================
 * CV Parser Helper
 * ============================================
 * Extracts basic applicant details (name, email, phone)
 * from CV text content and the uploaded filename.
 */

/**
 * Parses CV text and original filename to extract candidate information
 * @param {string} cvText - Extracted text content of the CV
 * @param {string} filename - Original name of the uploaded file
 * @returns {Object} Extracted details { applicantName, email, phone }
 */
function extractApplicantInfo(cvText, filename) {
  let email = '';
  let phone = '';
  let applicantName = '';

  const cleanText = cvText || '';

  // 1. Extract email using regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = cleanText.match(emailRegex);
  if (emailMatch) {
    email = emailMatch[0].trim().toLowerCase();
  }

  // 2. Extract Egyptian or generic phone numbers
  // Matches typical formats: Egyptian (01xxxxxxxxx, +201xxxxxxxxx, etc.) or generic international digits
  const phoneRegex = /(?:\+?20|0)?1[0125]\d{8}\b|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  const phoneMatch = cleanText.match(phoneRegex);
  if (phoneMatch) {
    phone = phoneMatch[0].trim();
  }

  // 3. Extract name from filename
  if (filename) {
    // Remove file extension
    const withoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    
    // Clean name: replace hyphens, underscores, dots, numbers with spaces
    let cleanName = withoutExt
      .replace(/[-_.]/g, ' ')
      .replace(/\d+/g, ' ')
      // Remove common words like "CV", "Resume", etc.
      .replace(/\b(cv|resume|pdf|doc|docx|cover|letter|updated|latest|job|application|new|final|english|arabic)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize each word
    if (cleanName) {
      applicantName = cleanName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();
    }
  }

  // Fallback name if none found
  if (!applicantName) {
    applicantName = 'Applicant ' + Math.floor(1000 + Math.random() * 9000);
  }

  return { applicantName, email, phone };
}

module.exports = {
  extractApplicantInfo
};
