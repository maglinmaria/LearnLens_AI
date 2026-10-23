"use client";

import React from "react";
import type { VerificationScore } from "@/lib/api";

interface LensCheckPanelProps {
  result: { question: string; verification: VerificationScore } | null;
  isLoading?: boolean;
}

const VERDICT_COLORS: Record<string, string> = {
  Excellent: "var(--color-emerald)",
  Good: "var(--color-cyan)",
  "Needs Improvement": "var(--color-amber)",
  Poor: "var(--color-rose)",
};

function ScoreArc({ score, color, label }: { score: number; color: string; label: string }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--color-surface-3)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="40" y="44" textAnchor="middle" fontSize="16" fontWeight="700" fill={color}>
          {score}
        </text>
      </svg>
      <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export default function LensCheckPanel({ result, isLoading }: LensCheckPanelProps) {
  if (isLoading) {
    return (
      <div className="card animate-fade-in" style={{ padding: "var(--space-6)" }}>
        <div className="skeleton" style={{ width: "50%", height: 22, marginBottom: "var(--space-4)" }} />
        <div style={{ display: "flex", gap: "var(--space-6)", justifyContent: "center", marginBottom: "var(--space-6)" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ width: 80, height: 80, borderRadius: "50%" }} />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ width: "100%", height: 14, marginBottom: "var(--space-2)" }} />
        ))}
      </div>
    );
  }

  if (!result) {
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
        <div style={{ fontSize: "2rem" }}>✅</div>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Click <strong style={{ color: "var(--color-emerald)" }}>LensCheck</strong> to verify the accuracy of the diagram and explanation
        </p>
      </div>
    );
  }

  const { verification: v } = result;
  const verdictColor = VERDICT_COLORS[v.overall_verdict] || "var(--color-text-secondary)";

  return (
    <div className="card animate-scale-in" style={{ padding: "var(--space-6)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>LensCheck Verification</h3>
        <span
          style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: verdictColor,
            background: `${verdictColor}22`,
            border: `1px solid ${verdictColor}44`,
          }}
        >
          {v.overall_verdict}
        </span>
      </div>

      {/* Score Arcs */}
      <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", marginBottom: "var(--space-6)" }}>
        <ScoreArc score={v.accuracy_score} color="var(--color-accent-light)" label="Accuracy" />
        <ScoreArc score={v.completeness_score} color="var(--color-cyan)" label="Completeness" />
        <ScoreArc score={v.clarity_score} color="var(--color-emerald)" label="Clarity" />
      </div>

      {/* Summary */}
      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.65, marginBottom: "var(--space-5)" }}>
        {v.summary}
      </p>

      {/* Strengths */}
      {v.strengths.length > 0 && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-emerald)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ✓ Strengths
          </h4>
          <ul style={{ paddingLeft: "1.25em", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {v.strengths.map((s, i) => (
              <li key={i} style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Issues */}
      {v.issues.length > 0 && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-rose)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ⚠ Issues
          </h4>
          <ul style={{ paddingLeft: "1.25em", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {v.issues.map((s, i) => (
              <li key={i} style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {v.suggestions.length > 0 && (
        <div>
          <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-amber)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            💡 Suggestions
          </h4>
          <ul style={{ paddingLeft: "1.25em", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {v.suggestions.map((s, i) => (
              <li key={i} style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
