"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import DiagramCanvas from "@/components/DiagramCanvas";
import ExplanationPanel from "@/components/ExplanationPanel";
import LensCheckPanel from "@/components/LensCheckPanel";
import QuizPanel from "@/components/QuizPanel";
import ImageUpload from "@/components/ImageUpload";
import {
  generateDiagram,
  explainMaterial,
  lensIQ,
  lensCheck,
  generateQuiz,
  fetchDiagramTypes,
  type DiagramResponse,
  type LensCheckResponse,
  type QuizQuestion,
} from "@/lib/api";
import { saveSession } from "@/lib/storage";

const EXAMPLE_QUESTIONS = [
  "Explain the process of photosynthesis",
  "Draw the water cycle",
  "How does DNA replication work?",
  "Newton's three laws of motion",
  "Structure of an atom",
  "The carbon cycle",
];

type ActivePanel = "explanation" | "lensiq" | "lenscheck" | "quiz";

export default function WorkspacePage() {
  const searchParams = useSearchParams();

  // ── State ──────────────────────────────────────────────────────────────────
  const [question, setQuestion] = React.useState(searchParams.get("q") || "");
  const [diagramType, setDiagramType] = React.useState("auto");
  const [uploadedImage, setUploadedImage] = React.useState<File | null>(null);
  const [diagramTypes, setDiagramTypes] = React.useState<Record<string, string>>({});

  // Results
  const [diagramResult, setDiagramResult] = React.useState<DiagramResponse | null>(null);
  const [explanation, setExplanation] = React.useState<string | null>(null);
  const [lensIQResult, setLensIQResult] = React.useState<string | null>(null);
  const [lensCheckResult, setLensCheckResult] = React.useState<LensCheckResponse | null>(null);
  const [quizResult, setQuizResult] = React.useState<QuizQuestion[] | null>(null);

  // Loading states
  const [loadingDiagram, setLoadingDiagram] = React.useState(false);
  const [loadingExplain, setLoadingExplain] = React.useState(false);
  const [loadingLensIQ, setLoadingLensIQ] = React.useState(false);
  const [loadingLensCheck, setLoadingLensCheck] = React.useState(false);
  const [loadingQuiz, setLoadingQuiz] = React.useState(false);

  // Error
  const [error, setError] = React.useState<string | null>(null);

  // UI
  const [activePanel, setActivePanel] = React.useState<ActivePanel>("explanation");
  const [saved, setSaved] = React.useState(false);

  // ── Load diagram types on mount ────────────────────────────────────────────
  React.useEffect(() => {
    fetchDiagramTypes()
      .then(setDiagramTypes)
      .catch(() => {}); // non-critical
  }, []);

  // ── Auto-trigger from URL param ───────────────────────────────────────────
  React.useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuestion(q);
    }
  }, [searchParams]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const clearError = () => setError(null);

  const handleError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    setError(msg);
  };

  const validateQuestion = (): boolean => {
    if (question.trim().length < 3) {
      setError("Please enter a question with at least 3 characters.");
      return false;
    }
    return true;
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleGenerateDiagram = async () => {
    if (!validateQuestion()) return;
    clearError();
    setLoadingDiagram(true);
    setSaved(false);
    try {
      const result = await generateDiagram(question, diagramType, uploadedImage);
      setDiagramResult(result);
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingDiagram(false);
    }
  };

  const handleExplain = async () => {
    if (!validateQuestion()) return;
    clearError();
    setLoadingExplain(true);
    setActivePanel("explanation");
    try {
      const result = await explainMaterial(question, uploadedImage);
      setExplanation(result.explanation);
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingExplain(false);
    }
  };

  const handleLensIQ = async () => {
    if (!validateQuestion()) return;
    clearError();
    setLoadingLensIQ(true);
    setActivePanel("lensiq");
    try {
      const result = await lensIQ(question, diagramResult?.svg, explanation || undefined);
      setLensIQResult(result.deep_dive);
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingLensIQ(false);
    }
  };

  const handleLensCheck = async () => {
    if (!validateQuestion()) return;
    clearError();
    setLoadingLensCheck(true);
    setActivePanel("lenscheck");
    try {
      const result = await lensCheck(question, diagramResult?.svg, explanation || undefined);
      setLensCheckResult(result);
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingLensCheck(false);
    }
  };

  const handleQuiz = async () => {
    if (!validateQuestion()) return;
    clearError();
    setLoadingQuiz(true);
    setActivePanel("quiz");
    try {
      const result = await generateQuiz(question, explanation || undefined);
      setQuizResult(result.quiz);
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSaveSession = () => {
    saveSession({
      question,
      diagramSvg: diagramResult?.svg,
      diagramType: diagramResult?.diagram_type,
      explanation: explanation || undefined,
      lensIQ: lensIQResult || undefined,
      lensCheck: lensCheckResult || undefined,
      quiz: quizResult || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const panelLoading = {
    explanation: loadingExplain,
    lensiq: loadingLensIQ,
    lenscheck: loadingLensCheck,
    quiz: loadingQuiz,
  };

  return (
    <div className="page-wrapper">
      <Header />
      <main className="main-content" style={{ padding: "var(--space-6) 0 var(--space-12)" }}>
        <div className="container">
          {/* Page title */}
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginBottom: "var(--space-1)" }}>
              Learning <span className="text-gradient">Workspace</span>
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Ask a question, generate a diagram, and explore your topic in depth.
            </p>
          </div>

          {/* Error Banner */}
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
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-3)",
              }}
            >
              <span style={{ color: "var(--color-rose)", fontSize: "0.875rem" }}>⚠ {error}</span>
              <button onClick={clearError} className="btn btn-ghost btn-sm" style={{ color: "var(--color-rose)" }}>
                ×
              </button>
            </div>
          )}

          {/* Main layout: 2-col */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "var(--space-6)", alignItems: "start" }}>
            {/* ── Left Column: Controls ───────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", position: "sticky", top: "calc(var(--header-height) + 1.5rem)" }}>
              {/* Question Input */}
              <div className="card" style={{ padding: "var(--space-5)" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "var(--space-3)", color: "var(--color-text-secondary)" }}>
                  Question or Topic
                </h3>
                <textarea
                  id="question-input"
                  className="input textarea"
                  placeholder="e.g. Explain the process of photosynthesis…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  style={{ minHeight: 100, marginBottom: "var(--space-3)" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) handleGenerateDiagram();
                  }}
                  aria-label="Learning question or topic"
                />

                {/* Diagram type selector */}
                <div style={{ marginBottom: "var(--space-3)" }}>
                  <label style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>
                    Diagram type
                  </label>
                  <select
                    id="diagram-type-select"
                    className="input select"
                    value={diagramType}
                    onChange={(e) => setDiagramType(e.target.value)}
                    style={{ padding: "0.5rem 2.5rem 0.5rem 0.75rem" }}
                  >
                    <option value="auto">Auto-detect</option>
                    {Object.entries(diagramTypes).map(([k, v]) => (
                      k !== "auto" && <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)} – {v}</option>
                    ))}
                  </select>
                </div>

                {/* Primary actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <button
                    id="generate-diagram-btn"
                    className="btn btn-primary"
                    onClick={handleGenerateDiagram}
                    disabled={loadingDiagram}
                    style={{ width: "100%" }}
                  >
                    {loadingDiagram ? <><span className="spinner" style={{ borderTopColor: "#fff" }} /> Generating…</> : "🔭 Generate Diagram"}
                  </button>
                  <button
                    id="explain-material-btn"
                    className="btn btn-secondary"
                    onClick={handleExplain}
                    disabled={loadingExplain}
                    style={{ width: "100%" }}
                  >
                    {loadingExplain ? <><span className="spinner" /> Explaining…</> : "📖 Explain Material"}
                  </button>
                </div>
              </div>

              {/* Image Upload */}
              <div className="card" style={{ padding: "var(--space-5)" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "var(--space-3)", color: "var(--color-text-secondary)" }}>
                  Study Material Image (optional)
                </h3>
                <ImageUpload onFileSelect={setUploadedImage} selectedFile={uploadedImage} />
              </div>

              {/* Secondary actions */}
              <div className="card" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "var(--space-1)", color: "var(--color-text-secondary)" }}>
                  Analysis Tools
                </h3>
                <button
                  id="lens-iq-btn"
                  className="btn btn-secondary"
                  onClick={handleLensIQ}
                  disabled={loadingLensIQ}
                  style={{ width: "100%", justifyContent: "flex-start" }}
                >
                  {loadingLensIQ ? <><span className="spinner" /> Analysing…</> : (
                    <><span style={{ color: "var(--color-cyan)" }}>🧠</span> LensIQ – Deep Dive</>
                  )}
                </button>
                <button
                  id="lens-check-btn"
                  className="btn btn-secondary"
                  onClick={handleLensCheck}
                  disabled={loadingLensCheck}
                  style={{ width: "100%", justifyContent: "flex-start" }}
                >
                  {loadingLensCheck ? <><span className="spinner" /> Verifying…</> : (
                    <><span style={{ color: "var(--color-emerald)" }}>✅</span> LensCheck – Verify</>
                  )}
                </button>
                <button
                  id="quiz-btn"
                  className="btn btn-secondary"
                  onClick={handleQuiz}
                  disabled={loadingQuiz}
                  style={{ width: "100%", justifyContent: "flex-start" }}
                >
                  {loadingQuiz ? <><span className="spinner" /> Generating quiz…</> : (
                    <><span style={{ color: "var(--color-amber)" }}>🎓</span> Quiz – Test Knowledge</>
                  )}
                </button>

                {/* Save session */}
                {(diagramResult || explanation) && (
                  <button
                    id="save-session-btn"
                    className={`btn ${saved ? "btn-secondary" : "btn-ghost"}`}
                    onClick={handleSaveSession}
                    style={{ width: "100%", justifyContent: "flex-start", marginTop: "var(--space-1)" }}
                  >
                    {saved ? "✓ Session Saved!" : "💾 Save Session"}
                  </button>
                )}
              </div>

              {/* Example questions */}
              <div className="card" style={{ padding: "var(--space-5)" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "var(--space-3)", color: "var(--color-text-secondary)" }}>
                  Try an example
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuestion(q)}
                      className="btn btn-ghost btn-sm"
                      style={{ justifyContent: "flex-start", textAlign: "left", fontSize: "0.8125rem", padding: "0.375rem 0.5rem" }}
                    >
                      → {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Column: Diagram + Panels ─────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {/* Diagram Canvas */}
              <DiagramCanvas
                svg={diagramResult?.svg || null}
                isLoading={loadingDiagram}
                question={diagramResult?.question}
              />

              {/* Panel Tabs */}
              <div>
                <div className="tab-list" style={{ marginBottom: "var(--space-4)" }}>
                  {([
                    { id: "explanation", label: "📖 Explanation" },
                    { id: "lensiq", label: "🧠 LensIQ" },
                    { id: "lenscheck", label: "✅ LensCheck" },
                    { id: "quiz", label: "🎓 Quiz" },
                  ] as { id: ActivePanel; label: string }[]).map((tab) => (
                    <button
                      key={tab.id}
                      className={`tab-btn${activePanel === tab.id ? " active" : ""}`}
                      onClick={() => setActivePanel(tab.id)}
                      id={`tab-${tab.id}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Panel content */}
                {activePanel === "explanation" && (
                  <ExplanationPanel
                    explanation={explanation}
                    isLoading={panelLoading.explanation}
                    title="Explanation"
                  />
                )}
                {activePanel === "lensiq" && (
                  <ExplanationPanel
                    explanation={lensIQResult}
                    isLoading={panelLoading.lensiq}
                    title="LensIQ — Deep Dive"
                  />
                )}
                {activePanel === "lenscheck" && (
                  <LensCheckPanel
                    result={lensCheckResult}
                    isLoading={panelLoading.lenscheck}
                  />
                )}
                {activePanel === "quiz" && (
                  <QuizPanel
                    quiz={quizResult}
                    isLoading={panelLoading.quiz}
                    question={question}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 900px) {
          main > div > div:last-child {
            grid-template-columns: 1fr !important;
          }
          main > div > div:last-child > div:first-child {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
