"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import DFADiagram from "@/components/DFADiagram";
import DFALensCheck from "@/components/DFALensCheck";
import DFALensIQ from "@/components/DFALensIQ";
import {
  generateDFA,
  extractDFAQuestion,
  type DFADefinition,
} from "@/lib/api";

const EXAMPLE_QUESTION =
  "Construct a DFA that accepts binary strings containing 001.";

const DFA_EXAMPLES = [
  "Construct a DFA that accepts binary strings containing 001.",
  "Design a DFA that accepts binary strings ending in 1.",
  "Build a DFA over {0,1} that accepts strings with an even number of 0s.",
  "Construct a DFA that rejects strings with three consecutive 1s.",
  "Design a DFA accepting binary strings divisible by 3.",
];

type ActiveTab = "lenscheck" | "lensiq";

// Inner component that uses useSearchParams — must be inside Suspense
function DFAWorkspaceInner() {
  const searchParams = useSearchParams();

  // ── State ──────────────────────────────────────────────────────────────────
  const [question, setQuestion] = React.useState(
    searchParams.get("q") || EXAMPLE_QUESTION
  );
  const [dfa, setDfa] = React.useState<DFADefinition | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("lenscheck");
  const [currentGeneratedQuestion, setCurrentGeneratedQuestion] =
    React.useState<string | null>(null);

  // Image upload
  const [uploadedImage, setUploadedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [extractingQuestion, setExtractingQuestion] = React.useState(false);
  const [extractedQuestion, setExtractedQuestion] = React.useState<
    string | null
  >(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    const q = question.trim();
    if (q.length < 3) {
      setError("Please enter a question with at least 3 characters.");
      return;
    }
    setError(null);
    setDfa(null);
    setLoading(true);
    setCurrentGeneratedQuestion(null);

    try {
      const res = await generateDFA(q, uploadedImage);
      setDfa(res.dfa);
      setCurrentGeneratedQuestion(res.question);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (file: File) => {
    setUploadedImage(file);
    setExtractedQuestion(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Extract question
    setExtractingQuestion(true);
    try {
      const res = await extractDFAQuestion(file);
      const q = res.question.trim();
      setExtractedQuestion(q);
      if (q && !q.startsWith("Could not")) {
        setQuestion(q);
      }
    } catch (e) {
      setExtractedQuestion(
        "Could not extract question from image. Please type it manually."
      );
    } finally {
      setExtractingQuestion(false);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setExtractedQuestion(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) handleGenerate();
  };

  // ── Transition table ────────────────────────────────────────────────────────
  const renderTransitionTable = (d: DFADefinition) => (
    <div
      style={{
        overflowX: "auto",
        marginBottom: "var(--space-4)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.875rem",
          fontFamily: "monospace",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                padding: "0.5rem 0.75rem",
                textAlign: "left",
                borderBottom: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
                fontWeight: 600,
                background: "var(--color-surface-2)",
              }}
            >
              State
            </th>
            {d.alphabet.map((sym) => (
              <th
                key={sym}
                style={{
                  padding: "0.5rem 0.75rem",
                  textAlign: "center",
                  borderBottom: "1px solid var(--color-border)",
                  color: "var(--color-accent-light)",
                  fontWeight: 600,
                  background: "var(--color-surface-2)",
                }}
              >
                {sym}
              </th>
            ))}
            <th
              style={{
                padding: "0.5rem 0.75rem",
                textAlign: "center",
                borderBottom: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
                fontWeight: 600,
                background: "var(--color-surface-2)",
              }}
            >
              Type
            </th>
          </tr>
        </thead>
        <tbody>
          {d.states.map((state) => {
            const isStart = state === d.start_state;
            const isAccept = d.accepting_states.includes(state);
            return (
              <tr
                key={state}
                style={{
                  background:
                    isAccept
                      ? "rgba(74,222,128,0.04)"
                      : isStart
                      ? "rgba(99,102,241,0.04)"
                      : "transparent",
                }}
              >
                <td
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderBottom: "1px solid var(--color-border)",
                    color: isAccept
                      ? "var(--color-emerald)"
                      : isStart
                      ? "var(--color-accent-light)"
                      : "var(--color-text-primary)",
                    fontWeight: 600,
                  }}
                >
                  {isStart ? "→ " : "   "}
                  {isAccept ? `(${state})` : state}
                </td>
                {d.alphabet.map((sym) => (
                  <td
                    key={sym}
                    style={{
                      padding: "0.5rem 0.75rem",
                      textAlign: "center",
                      borderBottom: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {d.transitions[state]?.[sym] ?? "—"}
                  </td>
                ))}
                <td
                  style={{
                    padding: "0.5rem 0.75rem",
                    textAlign: "center",
                    borderBottom: "1px solid var(--color-border)",
                    fontSize: "0.75rem",
                  }}
                >
                  {isStart && (
                    <span
                      className="badge badge-accent"
                      style={{ marginRight: "0.25rem" }}
                    >
                      start
                    </span>
                  )}
                  {isAccept && (
                    <span className="badge badge-emerald">accept</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Header />
      <main
        className="main-content"
        style={{ padding: "var(--space-6) 0 var(--space-12)" }}
      >
        <div className="container">
          {/* Page title */}
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h1
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                marginBottom: "var(--space-1)",
              }}
            >
              DFA{" "}
              <span className="text-gradient">Learning Workspace</span>
            </h1>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.9rem",
              }}
            >
              Generate, visualise, validate, and simulate Deterministic Finite
              Automata — powered by AI + deterministic verification.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="animate-fade-in"
              style={{
                marginBottom: "var(--space-4)",
                padding: "var(--space-3) var(--space-4)",
                background: "rgba(244,63,94,0.1)",
                border: "1px solid rgba(244,63,94,0.3)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "var(--space-3)",
              }}
            >
              <span style={{ color: "var(--color-rose)", fontSize: "0.875rem" }}>
                ⚠ {error}
              </span>
              <button
                onClick={() => setError(null)}
                className="btn btn-ghost btn-sm"
                style={{ color: "var(--color-rose)", flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          )}

          {/* ── Main 2-col layout ─────────────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.8fr",
              gap: "var(--space-6)",
              alignItems: "start",
            }}
            className="dfa-grid"
          >
            {/* ── Left: Controls ──────────────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-5)",
                position: "sticky",
                top: "calc(var(--header-height) + 1.5rem)",
              }}
            >
              {/* Question Input Card */}
              <div className="card" style={{ padding: "var(--space-5)" }}>
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    marginBottom: "var(--space-3)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  DFA Question
                </h3>

                <textarea
                  id="dfa-question-input"
                  className="input textarea"
                  placeholder={EXAMPLE_QUESTION}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ minHeight: 100, marginBottom: "var(--space-3)" }}
                  aria-label="DFA question or description"
                />

                <button
                  id="dfa-generate-btn"
                  className="btn btn-primary"
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{ width: "100%" }}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner"
                        style={{ borderTopColor: "#fff" }}
                      />
                      Generating DFA…
                    </>
                  ) : (
                    "🔭 Generate Diagram"
                  )}
                </button>
              </div>

              {/* Image Upload Card */}
              <div className="card" style={{ padding: "var(--space-5)" }}>
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Upload Question Image{" "}
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 400,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    (optional)
                  </span>
                </h3>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  Upload a PNG/JPEG image containing a DFA question. The AI will
                  extract the text for your confirmation.
                </p>

                {!imagePreview ? (
                  <label
                    htmlFor="dfa-image-input"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      padding: "var(--space-4)",
                      border: "2px dashed var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                    }}
                    className="image-drop-zone"
                  >
                    <span style={{ fontSize: "1.5rem" }}>📷</span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-text-muted)",
                        textAlign: "center",
                      }}
                    >
                      Click to upload PNG or JPEG
                    </span>
                    <input
                      id="dfa-image-input"
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageSelect(f);
                      }}
                    />
                  </label>
                ) : (
                  <div>
                    <div style={{ position: "relative", marginBottom: "var(--space-2)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Uploaded question"
                        style={{
                          width: "100%",
                          maxHeight: 160,
                          objectFit: "contain",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--color-border)",
                          background: "#fff",
                        }}
                      />
                      <button
                        onClick={clearImage}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: 24,
                          height: 24,
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>

                    {extractingQuestion && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-cyan)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                        Extracting question…
                      </p>
                    )}

                    {extractedQuestion && (
                      <div
                        style={{
                          marginTop: "var(--space-2)",
                          padding: "var(--space-2) var(--space-3)",
                          background: extractedQuestion.startsWith("Could not")
                            ? "rgba(244,63,94,0.08)"
                            : "rgba(99,102,241,0.08)",
                          border: `1px solid ${
                            extractedQuestion.startsWith("Could not")
                              ? "rgba(244,63,94,0.3)"
                              : "rgba(99,102,241,0.3)"
                          }`,
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.8rem",
                          color: extractedQuestion.startsWith("Could not")
                            ? "var(--color-rose)"
                            : "var(--color-text-secondary)",
                        }}
                      >
                        {extractedQuestion.startsWith("Could not") ? (
                          <>⚠ {extractedQuestion}</>
                        ) : (
                          <>
                            ✓ Extracted:{" "}
                            <em>
                              "
                              {extractedQuestion.length > 80
                                ? extractedQuestion.slice(0, 80) + "…"
                                : extractedQuestion}
                              "
                            </em>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Example Questions */}
              <div className="card" style={{ padding: "var(--space-5)" }}>
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    marginBottom: "var(--space-3)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Try an Example
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-1)",
                  }}
                >
                  {DFA_EXAMPLES.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuestion(q)}
                      className="btn btn-ghost btn-sm"
                      style={{
                        justifyContent: "flex-start",
                        textAlign: "left",
                        fontSize: "0.8rem",
                        padding: "0.375rem 0.5rem",
                        whiteSpace: "normal",
                        height: "auto",
                        lineHeight: 1.4,
                      }}
                    >
                      → {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Diagram + panels ─────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-5)",
              }}
            >
              {/* DFA Diagram & info */}
              <div
                className="card animate-fade-in"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  border: "1px solid var(--color-border)",
                }}
              >
                {/* Toolbar */}
                <div
                  style={{
                    padding: "var(--space-3) var(--space-4)",
                    background: "var(--color-surface-2)",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    🔭 DFA Diagram
                  </span>
                  {dfa && (
                    <span className="badge badge-accent">
                      {dfa.states.length} states
                    </span>
                  )}
                  {dfa && (
                    <span
                      className="badge"
                      style={{
                        background: "rgba(34,211,238,0.1)",
                        color: "var(--color-cyan)",
                        border: "1px solid rgba(34,211,238,0.3)",
                      }}
                    >
                      Σ = {"{"}
                      {dfa.alphabet.join(", ")}
                      {"}"}
                    </span>
                  )}
                </div>

                {/* Diagram area */}
                <div
                  style={{
                    padding: "var(--space-4)",
                    minHeight: 280,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: loading ? "var(--color-surface)" : undefined,
                  }}
                >
                  {loading ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "var(--space-3)",
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          border: "3px solid var(--color-surface-3)",
                          borderTopColor: "var(--color-accent)",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      <p
                        style={{
                          color: "var(--color-text-secondary)",
                          fontSize: "0.9rem",
                        }}
                      >
                        Generating DFA…
                      </p>
                    </div>
                  ) : dfa ? (
                    <div style={{ width: "100%" }}>
                      <DFADiagram dfa={dfa} />
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        padding: "var(--space-6)",
                      }}
                    >
                      <div
                        className="animate-float"
                        style={{ fontSize: "3rem" }}
                      >
                        🤖
                      </div>
                      <div>
                        <h3
                          style={{
                            color: "var(--color-text-secondary)",
                            fontWeight: 600,
                            marginBottom: "0.5rem",
                          }}
                        >
                          DFA Diagram Canvas
                        </h3>
                        <p
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: "0.875rem",
                            maxWidth: 400,
                          }}
                        >
                          Enter a DFA question and click{" "}
                          <strong style={{ color: "var(--color-accent-light)" }}>
                            Generate Diagram
                          </strong>{" "}
                          to build your DFA.
                        </p>
                        <p
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: "0.8rem",
                            marginTop: "0.5rem",
                          }}
                        >
                          Example:{" "}
                          <em>
                            &quot;Construct a DFA that accepts binary strings
                            containing 001.&quot;
                          </em>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* DFA Details */}
              {dfa && (
                <div
                  className="card animate-fade-in"
                  style={{ padding: "var(--space-5)" }}
                >
                  <h3
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      marginBottom: "var(--space-4)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    DFA Definition
                  </h3>

                  {/* Quick summary */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "var(--space-2)",
                      marginBottom: "var(--space-4)",
                    }}
                  >
                    <span
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "var(--radius-full)",
                        background: "rgba(99,102,241,0.1)",
                        border: "1px solid rgba(99,102,241,0.3)",
                        fontSize: "0.8rem",
                        color: "#a5b4fc",
                      }}
                    >
                      Start: {dfa.start_state}
                    </span>
                    <span
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "var(--radius-full)",
                        background: "rgba(74,222,128,0.1)",
                        border: "1px solid rgba(74,222,128,0.3)",
                        fontSize: "0.8rem",
                        color: "#4ade80",
                      }}
                    >
                      Accept: {"{"}
                      {dfa.accepting_states.join(", ")}
                      {"}"}
                    </span>
                    <span
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "var(--radius-full)",
                        background: "rgba(34,211,238,0.1)",
                        border: "1px solid rgba(34,211,238,0.3)",
                        fontSize: "0.8rem",
                        color: "#22d3ee",
                      }}
                    >
                      Σ = {"{"}
                      {dfa.alphabet.join(", ")}
                      {"}"}
                    </span>
                    <span
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "var(--radius-full)",
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        fontSize: "0.8rem",
                        color: "#fbbf24",
                      }}
                    >
                      {dfa.states.length} states
                    </span>
                  </div>

                  {/* Transition table */}
                  <h4
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    Transition Table
                  </h4>
                  {renderTransitionTable(dfa)}

                  {/* Explanation */}
                  {dfa.explanation && (
                    <>
                      <h4
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "var(--space-2)",
                        }}
                      >
                        Explanation
                      </h4>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-text-secondary)",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {dfa.explanation}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* ── Tabs: LensCheck / LensIQ ─────────────────────────────── */}
              {dfa && (
                <div>
                  <div
                    className="tab-list"
                    style={{ marginBottom: "var(--space-4)" }}
                  >
                    <button
                      id="tab-lenscheck"
                      className={`tab-btn${activeTab === "lenscheck" ? " active" : ""}`}
                      onClick={() => setActiveTab("lenscheck")}
                    >
                      ✅ LensCheck
                    </button>
                    <button
                      id="tab-lensiq"
                      className={`tab-btn${activeTab === "lensiq" ? " active" : ""}`}
                      onClick={() => setActiveTab("lensiq")}
                    >
                      🧠 LensIQ Simulator
                    </button>
                  </div>

                  {activeTab === "lenscheck" && (
                    <DFALensCheck
                      question={currentGeneratedQuestion || question}
                      dfa={dfa}
                    />
                  )}
                  {activeTab === "lensiq" && <DFALensIQ dfa={dfa} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 860px) {
          .dfa-grid {
            grid-template-columns: 1fr !important;
          }
          .dfa-grid > div:first-child {
            position: static !important;
          }
        }
        .image-drop-zone:hover {
          border-color: var(--color-accent) !important;
        }
      `}</style>
    </div>
  );
}

// Default export wraps in Suspense for useSearchParams() (Next.js 14 requirement)
export default function DFAWorkspacePage() {
  return (
    <React.Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
          }}
        >
          Loading…
        </div>
      }
    >
      <DFAWorkspaceInner />
    </React.Suspense>
  );
}
