"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";

const FEATURES = [
  {
    icon: "🔭",
    title: "AI Diagram Generation",
    desc: "Generate accurate SVG diagrams for any concept — from photosynthesis to Newton's laws — powered by Gemma 4.",
    color: "var(--color-accent)",
  },
  {
    icon: "📖",
    title: "Material Explanation",
    desc: "Upload study notes, textbook pages, or diagrams and get instant, structured AI explanations.",
    color: "var(--color-cyan)",
  },
  {
    icon: "🧠",
    title: "LensIQ Deep Dive",
    desc: "Go beyond surface-level understanding with comprehensive concept breakdowns, analogies, and memory aids.",
    color: "var(--color-emerald)",
  },
  {
    icon: "✅",
    title: "LensCheck Verification",
    desc: "Verify the accuracy and completeness of AI-generated content with scored academic validation.",
    color: "var(--color-amber)",
  },
  {
    icon: "🎓",
    title: "Adaptive Quiz",
    desc: "Reinforce learning with AI-generated multiple-choice quizzes tailored to your topic and difficulty.",
    color: "#a78bfa",
  },
  {
    icon: "💾",
    title: "Saved Sessions",
    desc: "All your learning sessions are saved locally — revisit diagrams, explanations, and quiz results anytime.",
    color: "var(--color-rose)",
  },
];

const EXAMPLE_QUESTIONS = [
  "Explain the process of photosynthesis",
  "Draw a diagram of the water cycle",
  "How does DNA replication work?",
  "Illustrate Newton's three laws of motion",
  "Show the structure of an atom",
  "Explain the carbon cycle with a diagram",
];

const DFA_CHIP = "Construct a DFA accepting strings with 001";

export default function HomePage() {
  return (
    <div className="page-wrapper">
      <Header />
      <main className="main-content">
        {/* Hero */}
        <section
          style={{
            padding: "clamp(5rem, 12vw, 9rem) 0 clamp(4rem, 8vw, 6rem)",
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Glow orb */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 600,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div className="container" style={{ position: "relative" }}>
            <div
              className="badge badge-accent animate-fade-in"
              style={{ marginBottom: "var(--space-5)", display: "inline-flex", fontSize: "0.8rem" }}
            >
              ✨ Powered by Gemma 4 — Google DeepMind
            </div>

            <h1
              className="animate-fade-in"
              style={{ marginBottom: "var(--space-5)", animationDelay: "0.1s" }}
            >
              From Any Question to a<br />
              <span className="text-gradient">Verified, Interactive</span>
              <br />
              Learning Experience
            </h1>

            <p
              style={{
                fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                color: "var(--color-text-secondary)",
                maxWidth: 640,
                margin: "0 auto var(--space-8)",
                lineHeight: 1.7,
                animationDelay: "0.2s",
              }}
              className="animate-fade-in"
            >
              LearnLens AI generates accurate educational diagrams, explains study material, verifies
              academic content, and tests your knowledge — all in one workspace.
            </p>

            <div
              style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", flexWrap: "wrap" }}
              className="animate-fade-in"
            >
              <Link href="/dfa" className="btn btn-primary btn-lg" id="hero-cta-dfa">
                🤖 DFA Workspace
              </Link>
              <Link href="/workspace" className="btn btn-secondary btn-lg" id="hero-cta-workspace">
                🚀 Open Workspace
              </Link>
              <Link href="/sessions" className="btn btn-secondary btn-lg" id="hero-cta-sessions">
                View Saved Sessions
              </Link>
            </div>

            {/* Example chips */}
            <div
              style={{
                marginTop: "var(--space-10)",
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-2)",
                justifyContent: "center",
                maxWidth: 720,
                marginInline: "auto",
              }}
              className="animate-fade-in"
            >
              {/* DFA chip links to /dfa */}
              <Link
                href={`/dfa?q=${encodeURIComponent(DFA_CHIP)}`}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.8125rem",
                  background: "rgba(34,211,238,0.12)",
                  border: "1px solid rgba(34,211,238,0.3)",
                  color: "#22d3ee",
                  transition: "all 0.2s ease",
                  textDecoration: "none",
                }}
                className="example-chip"
              >
                🤖 {DFA_CHIP}
              </Link>
              {EXAMPLE_QUESTIONS.map((q) => (
                <Link
                  key={q}
                  href={`/workspace?q=${encodeURIComponent(q)}`}
                  style={{
                    padding: "0.4rem 1rem",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.8125rem",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                    transition: "all 0.2s ease",
                    textDecoration: "none",
                  }}
                  className="example-chip"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: "clamp(3rem, 6vw, 5rem) 0" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
              <h2 style={{ marginBottom: "var(--space-3)" }}>Everything you need to learn smarter</h2>
              <p style={{ color: "var(--color-text-secondary)", maxWidth: 540, margin: "0 auto", fontSize: "1.05rem" }}>
                Six powerful tools, one seamless workspace.
              </p>
            </div>

            <div className="grid-3" style={{ gap: "var(--space-5)" }}>
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="card card-interactive animate-fade-in"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "var(--radius-lg)",
                      background: `${f.color}18`,
                      border: `1px solid ${f.color}33`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      marginBottom: "var(--space-4)",
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "var(--space-2)", color: f.color }}>
                    {f.title}
                  </h3>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.65 }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section style={{ padding: "clamp(3rem, 6vw, 5rem) 0" }}>
          <div className="container">
            <div
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(34,211,238,0.15) 100%)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "var(--radius-xl)",
                padding: "clamp(2rem, 5vw, 4rem)",
                textAlign: "center",
              }}
            >
              <h2 style={{ marginBottom: "var(--space-4)" }}>
                Ready to transform how you learn?
              </h2>
              <p style={{ color: "var(--color-text-secondary)", maxWidth: 480, margin: "0 auto var(--space-6)", fontSize: "1.05rem" }}>
                Open the workspace, ask any question, and experience AI-powered learning in seconds.
              </p>
              <Link href="/workspace" className="btn btn-primary btn-lg" id="bottom-cta-workspace">
                Start Learning Now →
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid var(--color-border)",
            padding: "var(--space-8) 0",
            textAlign: "center",
          }}
        >
          <div className="container">
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              LearnLens AI — Built with Gemma 4 (Google DeepMind) · For educational use
            </p>
          </div>
        </footer>
      </main>

      <style jsx>{`
        .example-chip:hover {
          background: var(--color-surface-3) !important;
          border-color: var(--color-border-hover) !important;
          color: var(--color-text-primary) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
