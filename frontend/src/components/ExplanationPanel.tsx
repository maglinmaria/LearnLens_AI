"use client";

import React from "react";

interface ExplanationPanelProps {
  explanation: string | null;
  isLoading?: boolean;
  title?: string;
}

export default function ExplanationPanel({ explanation, isLoading, title = "Explanation" }: ExplanationPanelProps) {
  if (isLoading) {
    return (
      <div
        className="card animate-fade-in"
        style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
      >
        <div className="skeleton" style={{ width: "40%", height: 20 }} />
        <div className="skeleton" style={{ width: "100%", height: 14 }} />
        <div className="skeleton" style={{ width: "90%", height: 14 }} />
        <div className="skeleton" style={{ width: "95%", height: 14 }} />
        <div className="skeleton" style={{ width: "70%", height: 14 }} />
        <div style={{ height: "var(--space-2)" }} />
        <div className="skeleton" style={{ width: "80%", height: 14 }} />
        <div className="skeleton" style={{ width: "65%", height: 14 }} />
      </div>
    );
  }

  if (!explanation) {
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
        <div style={{ fontSize: "2rem" }}>📝</div>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Click <strong style={{ color: "var(--color-cyan)" }}>Explain Material</strong> to get an AI-powered explanation
        </p>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in" style={{ padding: "var(--space-6)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {title}
        </h3>
        <button
          onClick={() => navigator.clipboard.writeText(explanation)}
          className="btn btn-ghost btn-sm"
          id="copy-explanation-btn"
          title="Copy to clipboard"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
          </svg>
          Copy
        </button>
      </div>

      <MarkdownContent content={explanation} />
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown renderer without external deps dependency
  const rendered = content
    .replace(/^### (.*$)/gim, '<h4 style="font-size:1rem;font-weight:600;margin-top:1.25em;margin-bottom:0.4em;color:var(--color-text-primary)">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="font-size:1.15rem;font-weight:700;margin-top:1.5em;margin-bottom:0.5em;color:var(--color-text-primary)">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 style="font-size:1.35rem;font-weight:700;margin-top:1.5em;margin-bottom:0.5em;color:var(--color-text-primary)">$1</h2>')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--color-text-primary);font-weight:600">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:var(--color-text-secondary)">$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\- (.*$)/gim, '<li style="margin-bottom:0.25em">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li style="margin-bottom:0.25em">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul style="padding-left:1.5em;margin-bottom:0.875em">$&</ul>')
    .replace(/\n\n/g, '</p><p style="margin-bottom:0.875em;color:var(--color-text-secondary)">')
    .replace(/^(?!<[h|u|l])/gm, '');

  return (
    <div
      className="markdown-content"
      style={{ color: "var(--color-text-secondary)", lineHeight: 1.75, fontSize: "0.9375rem" }}
      dangerouslySetInnerHTML={{
        __html: `<p style="margin-bottom:0.875em;color:var(--color-text-secondary)">${rendered}</p>`,
      }}
    />
  );
}
