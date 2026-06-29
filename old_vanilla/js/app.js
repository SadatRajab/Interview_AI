import { extractCV, generateQuestions, evaluateAnswer } from './api.js';

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    // Spinner
    loadingSpinner: document.getElementById('loadingSpinner'),
    spinnerText: document.getElementById('spinnerText'),

    // Sections
    cvUploadSection: document.getElementById('cvUploadSection'),
    questionsSection: document.getElementById('questionsSection'),
    answerSection: document.getElementById('answerSection'),
    completionSection: document.getElementById('completionSection'),

    // CV Upload
    uploadArea: document.getElementById('uploadArea'),
    cvFileInput: document.getElementById('cvFileInput'),
    fileName: document.getElementById('fileName'),
    extractBtn: document.getElementById('extractBtn'),
    extractBtnLoader: document.getElementById('extractBtnLoader'),
    extractedCvDisplay: document.getElementById('extractedCvDisplay'),
    extractedCvText: document.getElementById('extractedCvText'),

    // Questions Display
    questionsContainer: document.getElementById('questionsContainer'),

    // Answer Section
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    currentQuestion: document.getElementById('currentQuestion'),
    answerInput: document.getElementById('answerInput'),
    charCount: document.getElementById('charCount'),
    charLimit: document.getElementById('charLimit'),
    evaluateBtn: document.getElementById('evaluateBtn'),
    evaluateBtnLoader: document.getElementById('evaluateBtnLoader'),
    evaluationResult: document.getElementById('evaluationResult'),
    evaluationContent: document.getElementById('evaluationContent'),
    nextQuestionBtn: document.getElementById('nextQuestionBtn'),
    finishBtn: document.getElementById('finishBtn'),
    prevBtn: document.getElementById('prevBtn'),
    skipBtn: document.getElementById('skipBtn'),

    // Alerts
    errorAlert: document.getElementById('errorAlert'),
    errorMessage: document.getElementById('errorMessage'),
    successAlert: document.getElementById('successAlert'),
    successMessage: document.getElementById('successMessage'),

    // Restart
    restartBtn: document.getElementById('restartBtn')
};

// ============================================
// STATE MANAGEMENT
// ============================================
let state = {
    cvText: '',
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    isLoading: false
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Show loading spinner
 * @param {string} message - Loading message
 */
function showSpinner(message = 'Loading...') {
    elements.spinnerText.textContent = message;
    elements.loadingSpinner.classList.remove('hidden');
}

/**
 * Hide loading spinner
 */
function hideSpinner() {
    elements.loadingSpinner.classList.add('hidden');
}

/**
 * Show error alert
 * @param {string} message - Error message
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorAlert.classList.remove('hidden');
    setTimeout(() => {
        elements.errorAlert.classList.add('hidden');
    }, 5000);
}

/**
 * Show success alert
 * @param {string} message - Success message
 */
function showSuccess(message) {
    elements.successMessage.textContent = message;
    elements.successAlert.classList.remove('hidden');
    setTimeout(() => {
        elements.successAlert.classList.add('hidden');
    }, 5000);
}

/**
 * Hide all sections
 */
function hideAllSections() {
    elements.cvUploadSection.classList.add('hidden');
    elements.questionsSection.classList.add('hidden');
    elements.answerSection.classList.add('hidden');
    elements.completionSection.classList.add('hidden');
}

/**
 * Show specific section
 * @param {HTMLElement} section - Section to show
 */
function showSection(section) {
    hideAllSections();
    section.classList.remove('hidden');
}

/**
 * Format questions string to array
 * @param {string} questionsText - Questions in string format
 * @returns {Array<string>}
 */
function parseQuestions(questionsText) {
    if (Array.isArray(questionsText)) {
        return questionsText
            .map(question => (typeof question === 'string' ? question.trim() : ''))
            .filter(Boolean);
    }

    if (questionsText && typeof questionsText === 'object') {
        const nestedQuestions = questionsText.questions || questionsText.items || questionsText.data;
        if (nestedQuestions) {
            return parseQuestions(nestedQuestions);
        }
    }

    if (typeof questionsText !== 'string') {
        return [];
    }

    // Try to parse as JSON array first
    try {
        const parsed = JSON.parse(questionsText);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) { }

    // Try to split by numbered format (1., 2., etc.)
    const numbered = questionsText.match(/\d+\.\s+[^\n]+/g);
    if (numbered) {
        return numbered.map(q => q.replace(/^\d+\.\s+/, '').trim());
    }

    // Try to split by double newlines or separate questions
    const lines = questionsText.split(/\n\n+|\n(?=\d+\.)/).filter(q => q.trim());
    if (lines.length > 1) return lines.map(q => q.trim());

    // Fallback: return as single question
    return [questionsText.trim()];
}

// ============================================
// FILE UPLOAD HANDLERS
// ============================================

/**
 * Handle file input change
 */
elements.cvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        elements.fileName.textContent = `✓ ${file.name}`;
        elements.fileName.classList.remove('hidden');
        elements.extractBtn.disabled = false;
    }
});

/**
 * Handle upload area click
 */
elements.uploadArea.addEventListener('click', () => {
    elements.cvFileInput.click();
});

/**
 * Handle drag and drop
 */
elements.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadArea.style.opacity = '0.8';
});

elements.uploadArea.addEventListener('dragleave', () => {
    elements.uploadArea.style.opacity = '1';
});

elements.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.uploadArea.style.opacity = '1';
    const file = e.dataTransfer.files[0];
    if (file) {
        elements.cvFileInput.files = e.dataTransfer.files;
        elements.fileName.textContent = `✓ ${file.name}`;
        elements.fileName.classList.remove('hidden');
        elements.extractBtn.disabled = false;
    }
});

// ============================================
// CV EXTRACTION
// ============================================

/**
 * Handle CV extraction
 */
elements.extractBtn.addEventListener('click', async () => {
    const file = elements.cvFileInput.files[0];
    if (!file) {
        showError('Please select a file');
        return;
    }

    showSpinner('Extracting CV text...');
    elements.extractBtn.disabled = true;
    elements.extractBtnLoader.classList.remove('hidden');

    try {
        const result = await extractCV(file);
        state.cvText = result.text;

        // Display extracted CV
        elements.extractedCvText.textContent = state.cvText;
        elements.extractedCvDisplay.classList.remove('hidden');

        showSuccess('CV extracted successfully!');

        // Show proceed button
        setTimeout(() => {
            proceedToQuestions();
        }, 1000);
    } catch (error) {
        console.error('Error:', error);
        showError(`Failed to extract CV: ${error.message}`);
    } finally {
        hideSpinner();
        elements.extractBtn.disabled = false;
        elements.extractBtnLoader.classList.add('hidden');
    }
});

// ============================================
// QUESTIONS GENERATION
// ============================================

/**
 * Proceed to questions generation
 */
async function proceedToQuestions() {
    showSpinner('Generating interview questions...');
    elements.extractBtn.disabled = true;

    try {
        const result = await generateQuestions(state.cvText);
        const questionsText = result.questions || result.data?.questions || result.data || result.items;

        // Parse questions into array
        state.questions = parseQuestions(questionsText);
        if (state.questions.length === 0) {
            throw new Error('Backend did not return any questions');
        }
        state.currentQuestionIndex = 0;
        state.answers = new Array(state.questions.length).fill('');

        // Display questions
        displayQuestions();

        // Move to next step
        hideSpinner();
        showSection(elements.questionsSection);
        showSuccess(`Generated ${state.questions.length} interview questions!`);
    } catch (error) {
        console.error('Error:', error);
        hideSpinner();
        showError(`Failed to generate questions: ${error.message}`);
        elements.extractBtn.disabled = false;
    }
}

/**
 * Display generated questions
 */
function displayQuestions() {
    elements.questionsContainer.innerHTML = '';
    state.questions.forEach((question, index) => {
        const div = document.createElement('div');
        div.className = 'question-item';
        div.innerHTML = `<strong>Q${index + 1}:</strong> ${question}`;
        elements.questionsContainer.appendChild(div);
    });
}

// ============================================
// ANSWER SECTION
// ============================================

/**
 * Proceed to answer section
 */
function proceedToAnswers() {
    showSection(elements.answerSection);
    displayCurrentQuestion();
    updateProgress();
}

/**
 * Display current question
 */
function displayCurrentQuestion() {
    const question = state.questions[state.currentQuestionIndex];
    elements.currentQuestion.textContent = question;
    elements.answerInput.value = state.answers[state.currentQuestionIndex] || '';
    elements.charCount.textContent = elements.answerInput.value.length;
    elements.evaluationResult.classList.add('hidden');

    // Update button states
    elements.prevBtn.disabled = state.currentQuestionIndex === 0;
    elements.finishBtn.classList.add('hidden');
    elements.nextQuestionBtn.classList.remove('hidden');

    if (state.currentQuestionIndex === state.questions.length - 1) {
        elements.finishBtn.classList.remove('hidden');
        elements.nextQuestionBtn.classList.add('hidden');
    }
}

/**
 * Update progress bar
 */
function updateProgress() {
    const progress = ((state.currentQuestionIndex + 1) / state.questions.length) * 100;
    elements.progressFill.style.width = `${progress}%`;
    elements.progressText.textContent = `Question ${state.currentQuestionIndex + 1} of ${state.questions.length}`;
}

/**
 * Handle answer input
 */
elements.answerInput.addEventListener('input', (e) => {
    const length = e.target.value.length;
    elements.charCount.textContent = length;
    state.answers[state.currentQuestionIndex] = e.target.value;
});

// ============================================
// ANSWER EVALUATION
// ============================================

/**
 * Handle answer evaluation
 */
elements.evaluateBtn.addEventListener('click', async () => {
    const answer = elements.answerInput.value.trim();
    if (!answer) {
        showError('Please provide an answer before evaluating');
        return;
    }

    const question = state.questions[state.currentQuestionIndex];

    showSpinner('Evaluating your answer...');
    elements.evaluateBtn.disabled = true;
    elements.evaluateBtnLoader.classList.remove('hidden');

    try {
        const result = await evaluateAnswer(question, answer);
        const evaluation = result.evaluation;

        // Display evaluation
        elements.evaluationContent.innerHTML = `<p>${evaluation}</p>`;
        elements.evaluationResult.classList.remove('hidden');

        showSuccess('Answer evaluated!');
    } catch (error) {
        console.error('Error:', error);
        showError(`Failed to evaluate answer: ${error.message}`);
    } finally {
        hideSpinner();
        elements.evaluateBtn.disabled = false;
        elements.evaluateBtnLoader.classList.add('hidden');
    }
});

// ============================================
// NAVIGATION
// ============================================

/**
 * Handle next question
 */
elements.nextQuestionBtn.addEventListener('click', () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++;
        displayCurrentQuestion();
        updateProgress();
    }
});

/**
 * Handle previous question
 */
elements.prevBtn.addEventListener('click', () => {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        displayCurrentQuestion();
        updateProgress();
    }
});

/**
 * Handle skip question
 */
elements.skipBtn.addEventListener('click', () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++;
        displayCurrentQuestion();
        updateProgress();
    }
});

/**
 * Handle finish interview
 */
elements.finishBtn.addEventListener('click', () => {
    showSection(elements.completionSection);
    showSuccess('Interview completed! Thank you for your responses.');
});

// ============================================
// RESTART
// ============================================

/**
 * Handle restart interview
 */
elements.restartBtn.addEventListener('click', () => {
    // Reset state
    state = {
        cvText: '',
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        isLoading: false
    };

    // Reset UI
    elements.cvFileInput.value = '';
    elements.fileName.classList.add('hidden');
    elements.extractBtn.disabled = true;
    elements.extractedCvDisplay.classList.add('hidden');
    elements.extractedCvText.textContent = '';
    elements.answerInput.value = '';
    elements.charCount.textContent = '0';

    // Show CV upload section
    showSection(elements.cvUploadSection);
    showSuccess('Ready for a new interview!');
});

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Application loaded');
    showSection(elements.cvUploadSection);
});

function persistAnswers() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers));
}
