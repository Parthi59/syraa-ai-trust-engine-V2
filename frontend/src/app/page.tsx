"use client";
import { useEffect, useState } from "react";
import AnimatedWorkflow from "@/components/AnimatedWorkflow";
type AnalyticsData = {
  project: string;
  status: string;
  document_uploaded: boolean;
  uploaded_document: string | null;
  total_chunks: number;
  embedding_model: string;
  llm_model: string;
  rag_pipeline: Record<string, string>;
  trust_engine: Record<string, string>;
};
type ClaimResult = {
  claim: string;
  status: string;
  reason: string;
  cited_chunk_ids: number[];
  evidence: { chunk_id: number; quote: string }[];
};

type RagAnswer = {
  claim_verification_heatmap?: ClaimResult[];
  question: string;
  source_document: string;
  retrieval_status: string;
  answer_generation_status: string;
  trust_engine_status: string;
  model_used: string;
  answer: string;
  trust_report: {
    trust_score: number | null;
    max_similarity: number;
    average_similarity: number;
    answer_source_overlap: {
      overlap_score: number;
      matched_keywords: string[];
      unsupported_keywords: string[];
    };
    citation_quality: string;
    hallucination_risk: string;
    risk_level: string;
    verification_status: string;
    confidence_explanation: string;
    score_breakdown: Record<string, number>;
  };
  sources: {
    chunk_id: number;
    similarity_score: number;
    preview: string;
    text?: string;
    start_char: number;
    end_char: number;
  }[];
};
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
export default function Home() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [ragAnswer, setRagAnswer] = useState<RagAnswer | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function fetchAnalytics() {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const data = await response.json();
      setAnalytics(data);
      setError("");
    } catch {
      setError("Backend not connected. Make sure FastAPI is running on port 8000.");
    }
  }
  useEffect(() => {
    fetchAnalytics();
  }, []);
  async function handleUpload() {
    if (!selectedFile) {
      setMessage("");
      setError("Please select a PDF file first.");
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setMessage("");
      setError("Only PDF files are supported right now.");
      return;
    }
    try {
      setUploading(true);
      setError("");
      setMessage("");
      setRagAnswer(null);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Upload failed");
      }
      const data = await response.json();
      setMessage(
        `Uploaded ${data.filename}. Extracted ${data.total_chunks} chunks successfully.`
      );
      await fetchAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }
  async function handleAskAI() {
    if (!question.trim()) {
      setError("Please enter a question first.");
      return;
    }
    if (!analytics?.document_uploaded) {
      setError("Upload a PDF before asking questions.");
      return;
    }
    try {
      setAnswerLoading(true);
      setRagAnswer(null);
      setError("");
      setMessage("");
      const response = await fetch(`${API_BASE_URL}/rag/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          top_k: 3,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Answer generation failed");
      }
      const data = await response.json();
      setRagAnswer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Answer generation failed");
    } finally {
      setAnswerLoading(false);
    }
  }
  function handleDownloadReport() {
  if (!ragAnswer) return;
  const claimHeatmap = getClaims(ragAnswer);

const report = {
  project: "SYRAA Trust Engine V2",
  report_type: "AI Trust Verification Report",
  generated_at: new Date().toISOString(),
  question: ragAnswer.question,
  source_document: ragAnswer.source_document,
  model_used: ragAnswer.model_used,
  answer: ragAnswer.answer,
  trust_summary: {
    trust_score: ragAnswer.trust_report.trust_score,
    citation_quality: ragAnswer.trust_report.citation_quality,
    hallucination_risk: ragAnswer.trust_report.hallucination_risk,
    verification_status: ragAnswer.trust_report.verification_status,
    risk_level: ragAnswer.trust_report.risk_level,
  },
  claim_verification_heatmap: claimHeatmap,
  trust_report: ragAnswer.trust_report,
  sources: ragAnswer.sources,
};
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `syraa-trust-report-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
async function handleCopyAnswer() {
  if (!ragAnswer) return;
  const textToCopy = `
SYRAA Trust Engine V2 Report
Question:
${ragAnswer.question}
Answer:
${ragAnswer.answer}
Statement Support:
${formatScore(ragAnswer.trust_report.trust_score)}
Citation Quality:
${ragAnswer.trust_report.citation_quality}
Hallucination Risk:
${ragAnswer.trust_report.hallucination_risk}
Verification Status:
${ragAnswer.trust_report.verification_status}
`;
  await navigator.clipboard.writeText(textToCopy);
  setMessage("Answer and trust summary copied to clipboard.");
}
  return (
    <main className="min-h-screen bg-[#050816] text-white px-8 py-10">
      <section className="max-w-6xl mx-auto">
        <div className="mb-10">
          <p className="text-sm text-cyan-400 font-semibold tracking-wide">
            SYRAA TRUST ENGINE
          </p>
          <h1 className="text-5xl font-bold mt-3">
            AI Answers With Evidence You Can Inspect.
          </h1>
          <p className="text-gray-400 mt-4 max-w-2xl">
            A RAG system with document upload,
            semantic retrieval, LLM answers, model-assisted evidence checks,
            and source transparency.
          </p>
        </div>
        <AnimatedWorkflow />
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-500/10 border border-green-500 text-green-300 p-4 rounded-xl mb-6">
            {message}
          </div>
        )}
        {!analytics ? (
          <div className="text-gray-400">Loading backend analytics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
              <Card title="Backend Status" value={analytics.status} />
              <Card
                title="Document Uploaded"
                value={analytics.document_uploaded ? "Yes" : "No"}
              />
              <Card title="Total Chunks" value={String(analytics.total_chunks)} />
              <Card title="Trust Engine" value={analytics.trust_engine.version} />
            </div>
            <div className="bg-white/10 border border-white/10 rounded-2xl p-6 shadow-lg mb-8">
              <h3 className="text-xl font-semibold mb-4">Upload Document</h3>
              <p className="text-gray-400 mb-5">
                Upload a real PDF. Backend will extract text, create chunks,
                generate embeddings, and store it in memory for RAG.
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-3 file:font-semibold file:text-black hover:file:bg-cyan-300"
                />
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-black hover:bg-cyan-300 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload PDF"}
                </button>
              </div>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-2xl p-6 shadow-lg mb-8">
              <h3 className="text-xl font-semibold mb-4">Ask AI</h3>
              <p className="text-gray-400 mb-5">
                Ask a question about the uploaded document. SYRAA will answer
                using RAG and verify the response with Trust Engine V2.
              </p>
              <div className="flex flex-col gap-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Example: What skills does this person have?"
                  className="min-h-28 w-full rounded-xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-gray-500 focus:border-cyan-400"
                />
                <button
                  onClick={handleAskAI}
                  disabled={answerLoading}
                  className="w-full md:w-fit rounded-xl bg-cyan-400 px-6 py-3 font-bold text-black hover:bg-cyan-300 disabled:opacity-50"
                >
                  {answerLoading ? "Generating and checking..." : "Ask AI"}
                </button>
              </div>
            </div>
            {ragAnswer && (
              <div className="grid grid-cols-1 gap-6 mb-8">
                <Panel title="AI Answer">
                  <p className="text-gray-200 leading-7 whitespace-pre-wrap">
                    {ragAnswer.answer}
                  </p>
                </Panel>
               <ClaimVerificationHeatmap ragAnswer={ragAnswer} />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
  <TrustCard
    title="Statement Support"
    value={`${formatScore(ragAnswer.trust_report.trust_score)}`}
    status={ragAnswer.trust_report.verification_status}
  />
  <TrustCard
    title="Citation Quality"
    value={ragAnswer.trust_report.citation_quality}
    status={ragAnswer.trust_report.citation_quality}
  />
  <TrustCard
    title="Hallucination Risk"
    value={ragAnswer.trust_report.hallucination_risk}
    status={ragAnswer.trust_report.hallucination_risk}
  />
  <TrustCard
    title="Verification"
    value={ragAnswer.trust_report.verification_status}
    status={ragAnswer.trust_report.verification_status}
  />
</div>
<div className="flex flex-col gap-3 md:flex-row md:justify-end">
  <button
    onClick={handleCopyAnswer}
    className="rounded-xl border border-green-400/30 bg-green-400/10 px-6 py-3 font-bold text-green-300 hover:bg-green-400/20"
  >
    Copy Answer
  </button>
  <button
    onClick={handleDownloadReport}
    className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 font-bold text-cyan-300 hover:bg-cyan-400/20"
  >
    Download Trust Report
  </button>
</div>
                <Panel title="Trust Engine V2 Report">
                  <Info
                    label="Answer-Source Overlap"
                    value={`${Math.round(
                      ragAnswer.trust_report.answer_source_overlap.overlap_score * 100
                    )}%`}
                  />
                  <Info
                    label="Max Similarity"
                    value={String(ragAnswer.trust_report.max_similarity)}
                  />
                  <Info
                    label="Average Similarity"
                    value={String(ragAnswer.trust_report.average_similarity)}
                  />
                  <Info
                    label="Risk Level"
                    value={ragAnswer.trust_report.risk_level}
                  />
                  <div className="pt-3">
                    <p className="text-gray-400 mb-2">Confidence Explanation</p>
                    <p className="text-gray-200">
                      {ragAnswer.trust_report.confidence_explanation}
                    </p>
                  </div>
                </Panel>
                <Panel title="Matched Keywords">
                  <div className="flex flex-wrap gap-2">
                    {ragAnswer.trust_report.answer_source_overlap.matched_keywords.map(
                      (word) => (
                        <span
                          key={word}
                          className="rounded-full bg-green-500/10 border border-green-500/30 px-3 py-1 text-sm text-green-300"
                        >
                          {word}
                        </span>
                      )
                    )}
                  </div>
                </Panel>
                <Panel title="Source Chunks">
                  <div className="space-y-4">
                    {ragAnswer.sources.map((source) => (
                      <div
                        key={source.chunk_id}
                        className="rounded-xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="mb-2 flex justify-between gap-4">
                          <span className="font-semibold text-cyan-300">
                            Chunk {source.chunk_id}
                          </span>
                          <span className="text-sm text-gray-400">
                            Similarity: {source.similarity_score}
                          </span>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">{source.text ?? source.preview}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Panel title="Document Status">
                <Info
                  label="Uploaded Document"
                  value={analytics.uploaded_document || "None"}
                />
                <Info label="Embedding Model" value={analytics.embedding_model} />
                <Info label="LLM Model" value={analytics.llm_model} />
              </Panel>
              <Panel title="RAG Pipeline">
                {Object.entries(analytics.rag_pipeline).map(([key, value]) => (
                  <Info key={key} label={formatLabel(key)} value={value} />
                ))}
              </Panel>
              <Panel title="Trust Engine V2">
                {Object.entries(analytics.trust_engine).map(([key, value]) => (
                  <Info key={key} label={formatLabel(key)} value={value} />
                ))}
              </Panel>
              <Panel title="SYRAA Trust Core">
                <ul className="space-y-3 text-gray-300">
                  <li>✅ Evidence Grounding</li>
                  <li>Experimental statement checks</li>
                  <li>Statement support coverage</li>
                  <li>Model-assisted evidence review</li>
                  <li>✅ Source Transparency</li>
                  <li>✅ Explainable AI Output</li>
                </ul>
              </Panel>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-5 shadow-lg">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className="text-2xl font-bold mt-2 text-cyan-300">{value}</h2>
    </div>
  );
}
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold mb-5">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium text-right">{value}</span>
    </div>
  );
}
function TrustCard({
  title,
  value,
  status,
}: {
  title: string;
  value: string;
  status: string;
}) {
  const color = getStatusColor(status);
  return (
    <div className={`rounded-2xl border p-5 shadow-lg ${color.box}`}>
      <p className="text-sm text-gray-300">{title}</p>
      <h2 className={`mt-2 text-2xl font-bold ${color.text}`}>{value}</h2>
      <p className={`mt-3 text-sm font-semibold ${color.badge}`}>
        {getStatusLabel(status)}
      </p>
    </div>
  );
}
function formatScore(score: number | null) {
  return score == null ? "N/A" : `${score}/100`;
}

function getStatusColor(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "supported (model check)") {
    return { box: "bg-green-500/10 border-green-500/30", text: "text-green-300", badge: "text-green-400" };
  }
  if (["contradicted (model check)", "not verified", "unsupported", "high", "high risk", "weak"].includes(value)) {
    return { box: "bg-red-500/10 border-red-500/30", text: "text-red-300", badge: "text-red-400" };
  }
  return { box: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-300", badge: "text-yellow-400" };
}

function getStatusLabel(status: string) {
  if (status.trim().toLowerCase() === "supported (model check)") return "Review evidence below";
  if (status.trim().toLowerCase() === "contradicted (model check)") return "Conflicting evidence found";
  return "Needs Review";
}

function getClaims(answer: RagAnswer): ClaimResult[] {
  if (answer.claim_verification_heatmap?.length) return answer.claim_verification_heatmap;
  return [{ claim: answer.answer, status: "Needs Review",
    reason: "Backend claim evidence is missing. Update the backend and generate a new answer.",
    cited_chunk_ids: [], evidence: [] }];
}

function ClaimVerificationHeatmap({ ragAnswer }: { ragAnswer: RagAnswer }) {
  return (
    <Panel title="Claim / Statement Evidence Checks">
      <p className="text-gray-400 mb-4">Model-assisted checks against cited passages. Compound statements are checked together; these checks can be wrong.</p>
      <div className="space-y-3">
        {getClaims(ragAnswer).map((claim, index) => {
          const color = getStatusColor(claim.status);
          return (
            <div key={index} className={`rounded-xl border p-4 ${color.box}`}>
              <p className="text-gray-100 leading-7">{claim.claim}</p>
              <p className={`mt-2 font-bold ${color.text}`}>{claim.status}</p>
              <p className="mt-2 text-sm text-gray-300">{claim.reason}</p>
              {claim.evidence.map((evidence, i) => (
                <blockquote key={i} className="mt-3 border-l-2 border-cyan-400 pl-3 text-gray-300 whitespace-pre-wrap">
                  <span className="text-cyan-300">Chunk {evidence.chunk_id}: </span>{evidence.quote}
                </blockquote>
              ))}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function formatLabel(text: string) {
  return text
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
