# SYRAA Trust Engine V2

SYRAA Trust Engine V2 is a production-grade Generative AI verification platform that answers questions from uploaded documents using RAG and verifies every AI response with trust scoring, hallucination risk detection, answer-source overlap, source chunks, and claim-by-claim verification.

## Core Idea

Most RAG apps only give an AI answer.

SYRAA does more:

- Generates document-grounded answers
- Retrieves source chunks
- Calculates trust score
- Detects hallucination risk
- Measures answer-source overlap
- Shows citation quality
- Verifies every AI-generated claim
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

- Embedding model: `all-MiniLM-L6-v2`
- LLM model: `llama-3.3-70b-versatile`
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
- Download Trust Report
- Animated system workflow
- Analytics dashboard

## System Workflow

```text
User uploads PDF
↓
FastAPI backend extracts text
↓
Text is split into chunks
↓
Embeddings are generated
↓
User asks a question
↓
Semantic retrieval finds top-k chunks
↓
LLM generates answer from retrieved context
↓
Trust Engine V2 verifies the answer
↓
Frontend displays answer, sources, trust score, and claim heatmap

Trust Engine V2

SYRAA verifies the AI response using:

Trust Score
Citation Quality
Hallucination Risk
Answer-Source Overlap
Verification Status
Confidence Explanation
Claim-by-Claim Verification Heatmap

Claim-by-Claim Verification

SYRAA breaks the AI answer into individual claims and checks whether each claim is supported by retrieved source evidence.

Each claim is marked as:

Verified
Partial
Unsupported

This helps reduce hallucination risk and makes the AI output explainable.

API Endpoints
Health Check
GET /health
Analytics
GET /analytics
Upload Document
POST /documents/upload
RAG Search
POST /rag/search
RAG Answer
POST /rag/answer
Example Use Case

User uploads a resume PDF and asks:

What skills does this person have?

SYRAA returns:

AI-generated answer
Trust Score
Citation Quality
Hallucination Risk
Verification Status
Matched Keywords
Source Chunks
Claim-by-Claim Heatmap
Downloadable Trust Report
Project Structure
syraa-trust-engine/
│
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── venv/
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
└── README.md
Backend Setup

Go to backend folder:

cd backend

Create virtual environment:

python -m venv venv

Activate virtual environment:

.\venv\Scripts\activate

Install dependencies:

pip install fastapi uvicorn python-dotenv pydantic python-multipart pypdf sentence-transformers requests numpy

Create .env file:

GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

Run backend:

python -m uvicorn app.main:app --reload

Backend runs at:

http://127.0.0.1:8000

Swagger docs:

http://127.0.0.1:8000/docs
Frontend Setup

Go to frontend folder:

cd frontend

Install dependencies:

npm install

Run frontend:

npm run dev

Frontend runs at:

http://localhost:3000
 Demo Flow
1. Open SYRAA dashboard
2. View animated workflow
3. Upload a real PDF
4. Ask a question
5. View AI answer
6. Check Trust Score cards
7. View Claim-by-Claim Verification Heatmap
8. Review source chunks
9. Copy answer
10. Download trust report

What Makes This Project Unique

Most Gen AI projects stop at RAG answer generation.

SYRAA adds a trust verification layer:

RAG Answer
+
Trust Score
+
Hallucination Risk
+
Answer-Source Overlap
+
Claim-Level Verification
+
Exportable Trust Report

This makes it closer to a real enterprise AI reliability system.
