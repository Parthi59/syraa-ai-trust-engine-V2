"use client";

const steps = [
  {
    number: "01",
    title: "User / Frontend",
    subtitle: "User uploads a PDF and asks a question.",
    items: ["Upload PDF", "Ask Question", "View Dashboard"],
  },
  {
    number: "02",
    title: "FastAPI Backend",
    subtitle: "Receives frontend requests and controls the AI pipeline.",
    items: ["/documents/upload", "/rag/search", "/rag/answer", "/analytics"],
  },
  {
    number: "03",
    title: "Document Processing",
    subtitle: "Converts PDF into searchable chunks.",
    items: ["Text Extraction", "Chunking", "Embeddings"],
  },
  {
    number: "04",
    title: "RAG Retrieval",
    subtitle: "Finds the most relevant source chunks.",
    items: ["Question Embedding", "Top-k Chunks", "Semantic Search"],
  },
  {
    number: "05",
    title: "LLM Answer",
    subtitle: "Generates a grounded answer using retrieved context.",
    items: ["Groq LLM", "Context Answer", "Sources"],
  },
  {
    number: "06",
    title: "Trust Engine V2",
    subtitle: "Verifies the answer before showing it.",
    items: ["Trust Score", "Citation Quality", "Hallucination Risk", "Overlap Check"],
  },
  {
    number: "07",
    title: "Final Output",
    subtitle: "Shows answer, sources, and trust report.",
    items: ["Verified Answer", "Trust Report", "Source Chunks"],
  },
];

export default function AnimatedWorkflow() {
  return (
    <section className="mb-10 rounded-3xl border border-cyan-400/20 bg-white/5 p-6 shadow-2xl">
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-cyan-400">
          LIVE SYSTEM WORKFLOW
        </p>

        <h2 className="mt-2 text-3xl font-bold text-white">
          SYRAA Trust Engine V2 Pipeline
        </h2>

        <p className="mt-2 text-gray-400">
          Real-time Gen AI verification pipeline from PDF upload to trusted AI output.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-5 top-0 h-full w-px bg-cyan-400/20" />

        <div className="space-y-5">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex gap-5">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-xs font-bold text-black shadow-lg shadow-cyan-400/40">
                {step.number}
              </div>

              {index < steps.length - 1 && (
                <div className="absolute left-5 top-10 z-10 h-10 w-1 -translate-x-1/2 overflow-hidden rounded-full bg-cyan-400/10">
                  <div className="animated-flow-down h-10 w-full rounded-full bg-linear-to-b from-transparent via-cyan-300 to-transparent" />
                </div>
              )}

              <div className="w-full rounded-2xl border border-cyan-400/20 bg-[#07111f] p-5 shadow-lg transition hover:border-cyan-300/50 hover:bg-cyan-400/5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm text-gray-400">{step.subtitle}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:max-w-xl md:justify-end">
                    {step.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MiniStatus label="RAG Flow" value="Active" />
        <MiniStatus label="Trust Logic" value="V2 Enabled" />
        <MiniStatus label="Risk Detection" value="Live" />
      </div>

      <style jsx>{`
        .animated-flow-down {
          animation: flowDown 1.1s linear infinite;
        }

        @keyframes flowDown {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </section>
  );
}

function MiniStatus({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <h3 className="mt-1 text-xl font-bold text-cyan-300">{value}</h3>
    </div>
  );
}