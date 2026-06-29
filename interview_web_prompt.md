# AI Interview System — Web Frontend Prompt

## Project Overview
Build a web frontend for an AI-powered interview system.
The backend is already deployed as a REST API on Hugging Face Spaces.

---

## Base URL
```
https://anwer-1-ineterviwe-ai.hf.space
```

---

## API Endpoints

### 1. Extract CV Text
```
POST /ocr
Content-Type: multipart/form-data
Body: { file: <PDF or image file> }
Response: { text: "extracted text...", pages: 2 }
```

### 2. Generate Interview Questions
```
POST /generate-questions
Content-Type: application/json
Body: { cv_text: "extracted CV text..." }
Response: { questions: ["Q1", "Q2", ..., "Q8"] }
```

### 3. Score an Answer
```
POST /score-answer
Content-Type: application/json
Body: { question: "...", answer: "..." }
Response: { score: 8, comment: "...", strengths: "...", improve: "..." }
```

### 4. Detect AI-Generated Answer
```
POST /detect-ai
Content-Type: application/json
Body: { question: "...", answer: "..." }
Response: { prob: 30, verdict: "Likely Human", deduct: 0 }
```

---

## User Flow
1. User uploads CV (PDF or image)
2. Frontend calls POST /ocr → gets extracted text
3. User clicks "Start Interview"
4. Frontend calls POST /generate-questions → gets 8 questions
5. Show questions one by one — user types answer and submits
6. After each answer, call POST /score-answer AND POST /detect-ai in parallel (Promise.all)
7. After all 8 questions → show final results page with all scores and final average

---

## UI Pages / Screens

### Screen 1: Upload CV
- File upload input (accepts .pdf, .png, .jpg)
- "Extract CV" button
- Text area showing extracted text (editable)
- "Start Interview" button (disabled until CV extracted)

### Screen 2: Interview
- Progress bar: "Question X of 8"
- Question displayed clearly
- Textarea for answer
- "Submit Answer" button
- Loading state while scoring

### Screen 3: Results
- Final average score (e.g. 7.5 / 10)
- Grade label (Excellent / Very Good / Good / Needs Improvement)
- Per-question breakdown:
  - Question text
  - User's answer
  - Original score / AI deduction / Final score
  - Comment, Strengths, To Improve
  - AI Detection verdict + probability
- "Restart" button

---

## Tech Stack
Use: HTML + CSS + Vanilla JavaScript (no frameworks needed)
OR: React if preferred

---

## Important Notes
- Call /score-answer and /detect-ai in parallel using Promise.all to save time
- Show a loading spinner while waiting for API responses
- Store all questions and answers in a JS array during the session
- The API has CORS enabled — calls work directly from the browser
- No authentication needed — just call the endpoints directly

---

## Example Fetch Code

### Upload CV
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const res = await fetch('https://anwer-1-ineterviwe-ai.hf.space/ocr', {
  method: 'POST',
  body: formData
});
const data = await res.json();
const cvText = data.text;
```

### Generate Questions
```javascript
const res = await fetch('https://anwer-1-ineterviwe-ai.hf.space/generate-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cv_text: cvText })
});
const data = await res.json();
const questions = data.questions; // array of 8 strings
```

### Score + Detect in Parallel
```javascript
const [scoreData, aiData] = await Promise.all([
  fetch('https://anwer-1-ineterviwe-ai.hf.space/score-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer })
  }).then(r => r.json()),

  fetch('https://anwer-1-ineterviwe-ai.hf.space/detect-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer })
  }).then(r => r.json())
]);

const finalScore = Math.max(0, scoreData.score - aiData.deduct);
```
