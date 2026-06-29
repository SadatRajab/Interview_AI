// API Configuration
const API_BASE = "https://anwer-1-ineterviwe-ai.hf.space"; // Replace with your actual backend URL

/**
 * Extract CV text from uploaded file
 * @param {File} file - The CV file to extract text from
 * @returns {Promise<{success: boolean, text: string}>}
 */
export async function extractCV(file) {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE}/extract-cv`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Extract CV Error:", error);
        throw error;
    }
}

/**
 * Generate interview questions based on CV text
 * @param {string} cvText - The extracted CV text
 * @returns {Promise<{questions: string}>}
 */
export async function generateQuestions(cvText) {
    try {
        const formData = new FormData();
        formData.append("cv_text", cvText);

        const response = await fetch(`${API_BASE}/generate-questions`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Generate Questions Error:", error);
        throw error;
    }
}

/**
 * Evaluate user's answer to an interview question
 * @param {string} question - The interview question
 * @param {string} answer - The user's answer
 * @returns {Promise<{evaluation: string}>}
 */
export async function evaluateAnswer(question, answer) {
    try {
        const formData = new FormData();
        formData.append("question", question);
        formData.append("answer", answer);

        const response = await fetch(`${API_BASE}/evaluate`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Evaluate Answer Error:", error);
        throw error;
    }
}