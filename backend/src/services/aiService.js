/**
 * ============================================
 * AI Service — HuggingFace API Proxy
 * ============================================
 * Proxies all AI-related API calls to the
 * HuggingFace backend. The frontend NEVER
 * communicates with the AI API directly.
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config/config');
const logger = require('../utils/logger');

const AI_BASE = config.aiApiBase;

/**
 * Extract text from a CV file by sending it to the AI API
 * @param {string} filePath - Path to the uploaded CV file
 * @param {string} originalName - Original filename
 * @returns {Promise<string>} Extracted text
 */
async function extractCV(filePath, originalName) {
  logger.info(`Sending CV file to AI API for extraction: ${originalName}`);
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath), {
    filename: originalName,
    contentType: getContentType(originalName)
  });

  const response = await fetch(`${AI_BASE}/extract-cv`, {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('CV extraction failed at AI API', { status: response.status, error: errorText });
    throw new Error(`AI API error (extract-cv): ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  
  if (!data || !data.text) {
    logger.error('CV extraction returned no text', { data });
    throw new Error('AI API returned empty text for CV extraction');
  }

  logger.info(`Successfully extracted CV text length: ${data.text.length}`);
  return data.text;
}

/**
 * Generate interview questions based on CV text
 * @param {string} cvText - Extracted CV text
 * @returns {Promise<string[]>} Array of question strings
 */
async function generateQuestions(cvText, lang) {
  logger.info(`Generating interview questions via AI API...`);
  
  const formData = new FormData();
  formData.append('cv_text', cvText);
  if (lang) {
    formData.append('lang', lang);
  }

  const response = await fetch(`${AI_BASE}/generate-questions`, {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Question generation failed at AI API', { status: response.status, error: errorText });
    throw new Error(`AI API error (generate-questions): ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  const parsed = parseQuestions(data);
  
  logger.info(`Generated questions count: ${parsed.length}`);
  return parsed;
}

/**
 * Evaluate an answer to a question using the AI API
 * @param {string} question - The interview question
 * @param {string} answer - The applicant's answer
 * @returns {Promise<string>} Evaluation text
 */
async function evaluateAnswer(question, answer, lang) {
  logger.info(`Evaluating answer via AI API...`);
  
  const formData = new FormData();
  formData.append('question', question);
  formData.append('answer', answer);
  if (lang) {
    formData.append('lang', lang);
  }

  const response = await fetch(`${AI_BASE}/evaluate`, {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Answer evaluation failed at AI API', { status: response.status, error: errorText });
    throw new Error(`AI API error (evaluate): ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  const evaluation = data?.evaluation || 'No feedback provided.';
  
  logger.info(`Evaluation successfully fetched.`);
  return evaluation;
}

// ------------------------------------------
// Helper: Parse questions from various formats
// ------------------------------------------
function parseQuestions(questionsData) {
  const questionsText = questionsData?.questions 
    || questionsData?.data?.questions 
    || questionsData?.data 
    || questionsData?.items 
    || questionsData;

  if (Array.isArray(questionsText)) {
    return questionsText
      .map(q => (typeof q === 'string' ? q.trim() : ''))
      .filter(Boolean);
  }

  if (questionsText && typeof questionsText === 'object') {
    const nested = questionsText.questions || questionsText.items || questionsText.data;
    if (nested) {
      return parseQuestions({ questions: nested });
    }
  }

  if (typeof questionsText !== 'string') {
    return [];
  }

  // Try JSON array parsing
  try {
    const parsed = JSON.parse(questionsText);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) { /* not JSON */ }

  // Numbered lists parsing e.g. "1. Question... 2. Question..."
  const numbered = questionsText.match(/\d+\.\s+[^\n]+/g);
  if (numbered) {
    return numbered.map(q => q.replace(/^\d+\.\s+/, '').trim());
  }

  // Split by newlines
  const lines = questionsText.split(/\n\n+|\n(?=\d+\.)/).filter(q => q.trim());
  if (lines.length > 1) {
    return lines.map(q => q.trim());
  }

  return [questionsText.trim()];
}

// ------------------------------------------
// Helper: Get MIME type from filename
// ------------------------------------------
function getContentType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = {
  extractCV,
  generateQuestions,
  evaluateAnswer
};
