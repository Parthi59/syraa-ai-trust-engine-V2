# SYRAA Trust Engine V2

SYRAA Trust Engine V2 is a Generative AI verification platform that answers questions from uploaded documents using RAG and verifies AI responses through trust scoring, hallucination risk detection, answer-source overlap, source evidence, and claim-by-claim verification.

## Core Idea

Most RAG applications stop after generating an AI answer.

SYRAA adds a verification layer that:

- Generates document-grounded answers
- Retrieves relevant source chunks
- Calculates a Trust Score
- Detects hallucination risk
- Measures answer-source overlap
- Evaluates citation quality
- Verifies individual AI-generated claims
- Exports downloadable trust reports

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Backend

- FastAPI
- Python
- pypdf
- sentence-transformers
- Groq LLM API

### AI / RAG

- Embedding Model: `all-MiniLM-L6-v2`
- LLM Model: `openai/gpt-oss-120b`
- Semantic retrieval
- Top-k source chunk retrieval
- Trust Engine V2 scoring logic

## Features

- Real PDF upload
- PDF text extraction
- Text chunking
- Embedding generation
- Semantic search
- RAG answer generation
- Trust Score
- Citation Quality
- Hallucination Risk
- Answer-Source Overlap
- Claim-by-Claim Verification Heatmap
- Matched Keywords
- Source Chunks
- Copy Answer
- Downloadable Trust Report
- Animated system workflow
- Analytics dashboard

## System Workflow

```text
User uploads PDF
        ↓
FastAPI extracts document text
        ↓
Text is split into chunks
        ↓
Embeddings are generated
        ↓
User asks a question
        ↓
Semantic retrieval finds relevant chunks
        ↓
LLM generates an answer from retrieved context
        ↓
Trust Engine V2 verifies the answer
        ↓
Frontend displays the answer, sources,
trust metrics and claim verification heatmap
```

## Trust Engine V2

SYRAA verifies AI-generated responses using:

- Trust Score
- Citation Quality
- Hallucination Risk
- Answer-Source Overlap
- Verification Status
- Confidence Explanation
- Claim-by-Claim Verification Heatmap

## Claim-by-Claim Verification

SYRAA breaks an AI-generated answer into individual claims and checks whether each claim is supported by retrieved source evidence.

Each claim is classified as:

- 🟢 Verified
- 🟡 Partial
- 🔴 Unsupported

This adds an explainability layer to the RAG pipeline and helps surface potentially unsupported AI-generated statements.

## API Endpoints

| Purpose | Method | Endpoint |
|---|---|---|
| Health Check | GET | `/health` |
| Analytics | GET | `/analytics` |
| Upload Document | POST | `/documents/upload` |
| RAG Search | POST | `/rag/search` |
| RAG Answer | POST | `/rag/answer` |

## Example Use Case

A user uploads a resume PDF and asks:

> What skills does this person have?

SYRAA returns:

- AI-generated answer
- Trust Score
- Citation Quality
- Hallucination Risk
- Verification Status
- Matched Keywords
- Relevant Source Chunks
- Claim-by-Claim Verification Heatmap
- Downloadable Trust Report

## Project Structure

```text
syraa-trust-engine/
│
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx
│   │   └── components/
│   │       └── AnimatedWorkflow.tsx
│   └── package.json
│
├── syraa-backend/
│   └── main.py
│
├── .gitignore
└── README.md
```

## Backend Setup

### 1. Open the backend directory

```bash
cd backend
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate the virtual environment

Windows:

```powershell
.\venv\Scripts\activate
```

### 4. Install dependencies

```bash
pip install fastapi uvicorn python-dotenv pydantic python-multipart pypdf sentence-transformers requests numpy
```

### 5. Create the backend environment file

Create:

```text
backend/.env
```

Add:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

> Never commit your real API key to GitHub.

### 6. Start the backend

```bash
python -m uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

### 1. Open the frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the backend URL

Create:

```text
frontend/.env.local
```

For the deployed backend:

```env
NEXT_PUBLIC_API_BASE_URL=https://parthishyogi14kr-syraa-backend.hf.space
```

For local backend development:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

### 4. Start the frontend

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

## Demo Flow

1. Open the SYRAA dashboard
2. View the system workflow
3. Upload a PDF document
4. Ask a document-related question
5. View the generated RAG answer
6. Review Trust Score metrics
7. Inspect Claim-by-Claim Verification
8. Review retrieved source chunks
9. Copy the generated answer
10. Download the Trust Report

## What Makes SYRAA Different

A standard RAG pipeline typically ends after answer generation.

SYRAA adds an additional verification layer:

```text
RAG Answer
    +
Trust Score
    +
Citation Quality
    +
Hallucination Risk
    +
Answer-Source Overlap
    +
Claim-Level Verification
    +
Source Evidence
    +
Exportable Trust Report
```

The goal is to make document-based Generative AI outputs more transparent, inspectable, and evidence-aware.