"use client";

import React from "react";

interface DiagramCanvasProps {
  svg: string | null;
  isLoading?: boolean;
  question?: string;
}

export default function DiagramCanvas({ svg, isLoading, question }: DiagramCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const downloadSVG = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learnlens-diagram-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = async () => {
    if (!svg || !containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = svgEl.viewBox.baseVal.width * scale || 800 * scale;
    canvas.height = svgEl.viewBox.baseVal.height * scale || 600 * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `learnlens-diagram-${Date.now()}.png`;
      a.click();
    };
    img.src = url;
  };

  if (isLoading) {
    return (
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          minHeight: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-4)",
          padding: "var(--space-8)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "3px solid var(--color-surface-3)",
            borderTopColor: "var(--color-accent)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Generating diagram with Gemma 4…
        </p>
        <div className="skeleton" style={{ width: "60%", height: 12, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: "40%", height: 12, borderRadius: 6 }} />
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        style={{
          background: "var(--color-surface)",
          border: "2px dashed var(--color-border)",
          borderRadius: "var(--radius-lg)",
          minHeight: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-4)",
          padding: "var(--space-8)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "var(--radius-xl)",
            background: "var(--color-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
          }}
          className="animate-float"
        >
          🔭
        </div>
        <div>
          <h3 style={{ color: "var(--color-text-secondary)", fontWeight: 600, marginBottom: "0.5rem" }}>
            Diagram Canvas
          </h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Enter a question and click <strong style={{ color: "var(--color-accent-light)" }}>Generate Diagram</strong> to visualise a concept
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", justifyContent: "center" }}>
          {["Photosynthesis", "Water Cycle", "Cell Division", "Newton's Laws"].map((ex) => (
            <span key={ex} className="badge badge-accent">
              {ex}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        background: "#fff",
        boxShadow: "var(--shadow-lg)",
      }}
      className="animate-scale-in"
    >
      {/* Toolbar */}
      <div
        style={{
          background: "var(--color-surface-2)",
          borderBottom: "1px solid var(--color-border)",
          padding: "var(--space-2) var(--space-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
        }}
      >
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem", fontWeight: 500 }}>
          {question ? `Diagram: ${question.slice(0, 50)}${question.length > 50 ? "…" : ""}` : "Diagram"}
        </span>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            onClick={downloadSVG}
            className="btn btn-ghost btn-sm"
            id="download-svg-btn"
            title="Download SVG"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            SVG
          </button>
          <button
            onClick={downloadPNG}
            className="btn btn-ghost btn-sm"
            id="download-png-btn"
            title="Download PNG"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PNG
          </button>
        </div>
      </div>

      {/* SVG Display */}
      <div
        ref={containerRef}
        className="diagram-canvas"
        style={{ borderRadius: 0 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
