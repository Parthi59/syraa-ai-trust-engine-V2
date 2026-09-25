from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from io import BytesIO
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
from dotenv import load_dotenv
import numpy as np
import requests
import os
import re

load_dotenv()

app = FastAPI(
    title="SYRAA Trust Engine API",
    description="Production-grade Gen AI verification platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

DOCUMENT_STORE = {
    "filename": None,
    "chunks": []
}

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


class SearchRequest(BaseModel):
    question: str
    top_k: int = 3


class AnswerRequest(BaseModel):
    question: str
    top_k: int = 3


@app.get("/")
def home():
    return {
        "message": "Welcome to SYRAA Trust Engine API",
        "routes": {
            "health": "/health",
            "upload_document": "/documents/upload",
            "rag_search": "/rag/search",
            "rag_answer": "/rag/answer",
            "docs": "/docs"
        }
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": "SYRAA Trust Engine",
        "message": "Backend is running"
    }


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150):
    chunks = []
    start = 0
    chunk_id = 1

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()

        if chunk:
            chunks.append({
                "chunk_id": chunk_id,
                "start_char": start,
                "end_char": min(end, len(text)),
                "character_count": len(chunk),
                "text": chunk,
                "preview": chunk[:250]
            })
            chunk_id += 1

        start += chunk_size - overlap

    return chunks


def create_embeddings_for_chunks(chunks):
    chunk_texts = [chunk["text"] for chunk in chunks]

    embeddings = embedding_model.encode(
        chunk_texts,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    embedded_chunks = []

    for chunk, embedding in zip(chunks, embeddings):
        embedded_chunks.append({
            **chunk,
            "embedding": embedding.tolist(),
            "embedding_dimension": len(embedding),
            "embedding_preview": embedding[:10].tolist()
        })

    return embedded_chunks


def cosine_similarity(query_embedding, chunk_embedding):
    query_vector = np.array(query_embedding)
    chunk_vector = np.array(chunk_embedding)

    score = np.dot(query_vector, chunk_vector) / (
        np.linalg.norm(query_vector) * np.linalg.norm(chunk_vector)
    )

    return float(score)


def retrieve_chunks(question: str, top_k: int = 3):
    if not DOCUMENT_STORE["chunks"]:
        raise HTTPException(
            status_code=400,
            detail="No document uploaded yet. Upload a PDF first."
        )

    question_embedding = embedding_model.encode(
        question,
        convert_to_numpy=True,
        normalize_embeddings=True
    ).tolist()

    scored_chunks = []

    for chunk in DOCUMENT_STORE["chunks"]:
        similarity_score = cosine_similarity(
            question_embedding,
            chunk["embedding"]
        )

        scored_chunks.append({
            "chunk_id": chunk["chunk_id"],
            "similarity_score": round(similarity_score, 4),
            "text": chunk["text"],
            "preview": chunk["preview"],
            "start_char": chunk["start_char"],
            "end_char": chunk["end_char"]
        })

    scored_chunks = sorted(
        scored_chunks,
        key=lambda x: x["similarity_score"],
        reverse=True
    )

    return scored_chunks[:top_k]


def generate_llm_answer(question: str, retrieved_chunks):
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is missing. Add it inside backend/.env file."
        )

    context = "\n\n".join(
        [
            f"[Source Chunk {chunk['chunk_id']} | Score: {chunk['similarity_score']}]\n{chunk['text']}"
            for chunk in retrieved_chunks
        ]
    )

    system_prompt = """
You are SYRAA Trust Engine, a strict enterprise RAG assistant.

Rules:
1. Answer only using the provided context.
2. Do not invent facts.
3. If the context does not contain the answer, say: "I could not verify this from the uploaded document."
4. Mention source chunk IDs used.
5. Keep the answer clear, professional, and concise.
"""

    user_prompt = f"""
Question:
{question}

Retrieved Context:
{context}

Generate the final answer using only the retrieved context.
"""

    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 700
    }

    response = requests.post(url, headers=headers, json=payload, timeout=60)

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Groq API error: {response.text}"
        )

    data = response.json()
    return data["choices"][0]["message"]["content"]


def clean_words(text: str):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s+#.]", " ", text)
    words = text.split()

    stopwords = {
        "the", "is", "a", "an", "and", "or", "to", "of", "in", "on", "for",
        "with", "this", "that", "from", "has", "have", "as", "are", "be",
        "by", "it", "using", "based", "provided", "context", "source", "chunk",
        "following", "person", "skills", "mentioned"
    }

    return [word for word in words if word not in stopwords and len(word) > 2]


def calculate_answer_source_overlap(answer: str, retrieved_chunks):
    source_text = " ".join([chunk["text"] for chunk in retrieved_chunks])

    answer_words = set(clean_words(answer))
    source_words = set(clean_words(source_text))

    if not answer_words:
        return {
            "overlap_score": 0,
            "matched_keywords": [],
            "unsupported_keywords": []
        }

    matched_keywords = sorted(list(answer_words.intersection(source_words)))
    unsupported_keywords = sorted(list(answer_words.difference(source_words)))

    overlap_score = len(matched_keywords) / len(answer_words)

    return {
        "overlap_score": round(overlap_score, 4),
        "matched_keywords": matched_keywords[:25],
        "unsupported_keywords": unsupported_keywords[:25]
    }


def calculate_trust_report(answer: str, retrieved_chunks):
    if not retrieved_chunks:
        return {
            "trust_score": 0,
            "citation_quality": "None",
            "hallucination_risk": "High",
            "risk_level": "High",
            "verification_status": "Not verified",
            "reason": "No source chunks were retrieved."
        }

    similarity_scores = [chunk["similarity_score"] for chunk in retrieved_chunks]
    average_similarity = sum(similarity_scores) / len(similarity_scores)
    max_similarity = max(similarity_scores)

    overlap_report = calculate_answer_source_overlap(answer, retrieved_chunks)
    overlap_score = overlap_report["overlap_score"]

    source_support_score = min(max_similarity * 100, 30)
    citation_relevance_score = min(average_similarity * 100, 20)
    answer_source_overlap_score = overlap_score * 30

    if "I could not verify this from the uploaded document" in answer:
        grounding_score = 5
        hallucination_risk = "High"
    else:
        if overlap_score >= 0.70 and max_similarity >= 0.30:
            grounding_score = 15
            hallucination_risk = "Low"
        elif overlap_score >= 0.45:
            grounding_score = 10
            hallucination_risk = "Medium"
        else:
            grounding_score = 4
            hallucination_risk = "High"

    risk_safety_score = 5

    trust_score = int(
        source_support_score
        + citation_relevance_score
        + answer_source_overlap_score
        + grounding_score
        + risk_safety_score
    )

    trust_score = max(0, min(trust_score, 100))

    if trust_score >= 80:
        citation_quality = "Strong"
        verification_status = "Verified"
        risk_level = "Low"
    elif trust_score >= 60:
        citation_quality = "Medium"
        verification_status = "Verified with caution"
        risk_level = "Medium"
    else:
        citation_quality = "Weak"
        verification_status = "Not fully verified"
        risk_level = "High"

    confidence_explanation = (
        f"Trust score is calculated using retrieval similarity, citation relevance, "
        f"answer-source overlap, grounding score, and risk safety. "
        f"Answer-source overlap is {round(overlap_score * 100, 2)}%."
    )

    return {
        "trust_score": trust_score,
        "max_similarity": round(max_similarity, 4),
        "average_similarity": round(average_similarity, 4),
        "answer_source_overlap": overlap_report,
        "citation_quality": citation_quality,
        "hallucination_risk": hallucination_risk,
        "risk_level": risk_level,
        "verification_status": verification_status,
        "confidence_explanation": confidence_explanation,
        "score_breakdown": {
            "source_support_score": round(source_support_score, 2),
            "citation_relevance_score": round(citation_relevance_score, 2),
            "answer_source_overlap_score": round(answer_source_overlap_score, 2),
            "grounding_score": grounding_score,
            "risk_safety_score": risk_safety_score
        }
    }


@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported in this first version"
        )

    file_bytes = await file.read()

    try:
        pdf_reader = PdfReader(BytesIO(file_bytes))

        extracted_pages = []
        full_text = ""

        for page_number, page in enumerate(pdf_reader.pages, start=1):
            page_text = page.extract_text() or ""

            extracted_pages.append({
                "page_number": page_number,
                "text_length": len(page_text),
                "text_preview": page_text[:500]
            })

            full_text += f"\n\n--- Page {page_number} ---\n{page_text}"

        if len(full_text.strip()) == 0:
            raise HTTPException(
                status_code=422,
                detail="No text could be extracted. This PDF may be scanned/image-based."
            )

        chunks = chunk_text(full_text)
        embedded_chunks = create_embeddings_for_chunks(chunks)

        DOCUMENT_STORE["filename"] = file.filename
        DOCUMENT_STORE["chunks"] = embedded_chunks

        return {
            "filename": file.filename,
            "file_type": "pdf",
            "total_pages": len(pdf_reader.pages),
            "total_characters": len(full_text),
            "total_chunks": len(chunks),
            "embedding_model": "all-MiniLM-L6-v2",
            "embedding_status": "completed",
            "storage_status": "stored_in_memory",
            "pages": extracted_pages,
            "chunks": [
                {
                    "chunk_id": chunk["chunk_id"],
                    "start_char": chunk["start_char"],
                    "end_char": chunk["end_char"],
                    "character_count": chunk["character_count"],
                    "preview": chunk["preview"],
                    "embedding_dimension": chunk["embedding_dimension"],
                    "embedding_preview": chunk["embedding_preview"]
                }
                for chunk in embedded_chunks
            ],
            "extracted_text_preview": full_text[:2000]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF processing failed: {str(e)}"
        )


@app.post("/rag/search")
def rag_search(request: SearchRequest):
    top_results = retrieve_chunks(request.question, request.top_k)

    return {
        "question": request.question,
        "source_document": DOCUMENT_STORE["filename"],
        "top_k": request.top_k,
        "retrieval_status": "completed",
        "results": top_results
    }


@app.post("/rag/answer")
def rag_answer(request: AnswerRequest):
    retrieved_chunks = retrieve_chunks(request.question, request.top_k)
    answer = generate_llm_answer(request.question, retrieved_chunks)
    trust_report = calculate_trust_report(answer, retrieved_chunks)

    return {
        "question": request.question,
        "source_document": DOCUMENT_STORE["filename"],
        "retrieval_status": "completed",
        "answer_generation_status": "completed",
        "trust_engine_status": "completed",
        "model_used": GROQ_MODEL,
        "answer": answer,
        "trust_report": trust_report,
        "sources": [
            {
                "chunk_id": chunk["chunk_id"],
                "similarity_score": chunk["similarity_score"],
                "preview": chunk["preview"],
                "start_char": chunk["start_char"],
                "end_char": chunk["end_char"]
            }
            for chunk in retrieved_chunks
        ]
    }

@app.get("/analytics")
def analytics():
    document_uploaded = DOCUMENT_STORE["filename"] is not None
    total_chunks = len(DOCUMENT_STORE["chunks"])

    return {
        "project": "SYRAA Trust Engine",
        "status": "running",
        "document_uploaded": document_uploaded,
        "uploaded_document": DOCUMENT_STORE["filename"],
        "total_chunks": total_chunks,
        "embedding_model": "all-MiniLM-L6-v2",
        "llm_model": GROQ_MODEL,
        "rag_pipeline": {
            "text_extraction": "enabled",
            "chunking": "enabled",
            "embeddings": "enabled",
            "semantic_retrieval": "enabled",
            "llm_answer_generation": "enabled"
        },
        "trust_engine": {
            "version": "v2",
            "trust_score": "enabled",
            "citation_quality": "enabled",
            "hallucination_risk": "enabled",
            "answer_source_overlap": "enabled",
            "confidence_explanation": "enabled"
        },
        "available_routes": {
            "home": "/",
            "health": "/health",
            "upload_document": "/documents/upload",
            "rag_search": "/rag/search",
            "rag_answer": "/rag/answer",
            "analytics": "/analytics"
        }
    }