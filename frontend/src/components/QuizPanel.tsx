"use client";

import React from "react";
import type { QuizQuestion } from "@/lib/api";

interface QuizPanelProps {
  quiz: QuizQuestion[] | null;
  isLoading?: boolean;
  question?: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "var(--color-emerald)",
  medium: "var(--color-amber)",
  hard: "var(--color-rose)",
};

export default function QuizPanel({ quiz, isLoading, question }: QuizPanelProps) {
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [currentQ, setCurrentQ] = React.useState(0);

  const handleAnswer = (qId: number, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: option[0] })); // extract A/B/C/D
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length === 0) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setCurrentQ(0);
  };

  const score = React.useMemo(() => {
    if (!quiz || !submitted) return 0;
    return quiz.filter((q) => answers[q.id] === q.correct_answer).length;
  }, [quiz, answers, submitted]);

  if (isLoading) {
    return (
      <div className="card animate-fade-in" style={{ padding: "var(--space-6)" }}>
        <div className="skeleton" style={{ width: "40%", height: 22, marginBottom: "var(--space-4)" }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ marginBottom: "var(--space-4)" }}>
            <div className="skeleton" style={{ width: "100%", height: 16, marginBottom: "var(--space-2)" }} />
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="skeleton" style={{ width: "80%", height: 14, marginBottom: "var(--space-1)" }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!quiz) {
    return (
      <div
        className="card"
        style={{
          padding: "var(--space-6)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-3)",
          minHeight: 200,
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: "2rem" }}>🎓</div>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Click <strong style={{ color: "var(--color-amber)" }}>Quiz</strong> to test your understanding with AI-generated questions
        </p>
      </div>
    );
  }

  if (submitted) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <div className="card animate-scale-in" style={{ padding: "var(--space-6)" }}>
        {/* Score summary */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: pct >= 70 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
              border: `3px solid ${pct >= 70 ? "var(--color-emerald)" : "var(--color-amber)"}`,
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "var(--space-3)",
            }}
          >
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: pct >= 70 ? "var(--color-emerald)" : "var(--color-amber)" }}>{pct}%</span>
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            {score}/{quiz.length} Correct
          </h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {pct >= 80 ? "Excellent work! 🎉" : pct >= 60 ? "Good effort! Keep revising." : "Keep studying – you'll get there! 💪"}
          </p>
        </div>

        {/* Review answers */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {quiz.map((q) => {
            const userAns = answers[q.id];
            const correct = userAns === q.correct_answer;
            return (
              <div
                key={q.id}
                style={{
                  padding: "var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  background: correct ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)",
                  border: `1px solid ${correct ? "rgba(16, 185, 129, 0.25)" : "rgba(244, 63, 94, 0.25)"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Q{q.id}</span>
                  <span style={{ fontSize: "0.75rem", color: correct ? "var(--color-emerald)" : "var(--color-rose)", fontWeight: 600 }}>
                    {correct ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "var(--space-2)" }}>{q.question}</p>
                {!correct && (
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-emerald)" }}>
                    Correct answer: <strong>{q.correct_answer}</strong>
                  </p>
                )}
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                  {q.explanation}
                </p>
              </div>
            );
          })}
        </div>

        <button onClick={handleReset} className="btn btn-secondary" style={{ marginTop: "var(--space-5)", width: "100%" }} id="retry-quiz-btn">
          Retry Quiz
        </button>
      </div>
    );
  }

  const q = quiz[currentQ];

  return (
    <div className="card animate-fade-in" style={{ padding: "var(--space-6)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Quiz</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span className="badge badge-amber">
            {currentQ + 1} / {quiz.length}
          </span>
          <span
            className="badge"
            style={{
              color: DIFFICULTY_COLORS[q.difficulty] || "var(--color-text-secondary)",
              background: `${DIFFICULTY_COLORS[q.difficulty] || "#888"}22`,
              border: `1px solid ${DIFFICULTY_COLORS[q.difficulty] || "#888"}44`,
            }}
          >
            {q.difficulty}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar" style={{ marginBottom: "var(--space-5)" }}>
        <div className="progress-fill" style={{ width: `${((currentQ + 1) / quiz.length) * 100}%` }} />
      </div>

      {/* Question */}
      <p style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "var(--space-4)", lineHeight: 1.5 }}>
        {q.question}
      </p>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-5)" }}>
        {q.options.map((opt) => {
          const letter = opt[0]; // "A", "B", etc.
          const selected = answers[q.id] === letter;
          return (
            <button
              key={opt}
              onClick={() => handleAnswer(q.id, opt)}
              id={`quiz-option-${q.id}-${letter}`}
              style={{
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                border: selected
                  ? "1px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
                background: selected
                  ? "rgba(99, 102, 241, 0.15)"
                  : "var(--color-surface)",
                color: selected ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "0.875rem",
                fontWeight: selected ? 600 : 400,
                transition: "all 0.15s ease",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <button
          onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
          disabled={currentQ === 0}
          className="btn btn-secondary"
          style={{ flex: 1 }}
          id="quiz-prev-btn"
        >
          ← Previous
        </button>
        {currentQ < quiz.length - 1 ? (
          <button
            onClick={() => setCurrentQ((c) => c + 1)}
            className="btn btn-primary"
            style={{ flex: 1 }}
            id="quiz-next-btn"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length === 0}
            className="btn btn-primary"
            style={{ flex: 1 }}
            id="quiz-submit-btn"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
