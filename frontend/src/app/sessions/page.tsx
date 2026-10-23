"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { loadSessions, deleteSession, type SavedSession } from "@/lib/storage";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function SessionCard({ session, onDelete }: { session: SavedSession; onDelete: () => void }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="card" style={{ padding: "var(--space-5)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: "var(--color-text-primary)",
              marginBottom: "0.25rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {session.question}
          </p>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-2)" }}>
            {session.diagramSvg && <span className="badge badge-accent">Diagram</span>}
            {session.explanation && <span className="badge badge-cyan">Explanation</span>}
            {session.lensIQ && <span className="badge badge-emerald">LensIQ</span>}
            {session.lensCheck && <span className="badge badge-amber">LensCheck</span>}
            {session.quiz && <span className="badge" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>Quiz</span>}
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "var(--space-2)" }}>
            Saved {formatDate(session.createdAt)}
          </p>
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn btn-ghost btn-sm"
            id={`session-expand-${session.id}`}
          >
            {expanded ? "▲ Less" : "▼ More"}
          </button>
          <button
            onClick={onDelete}
            className="btn btn-danger btn-sm"
            id={`session-delete-${session.id}`}
            aria-label="Delete session"
          >
            ×
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: "var(--space-4)",
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {/* Diagram Preview */}
          {session.diagramSvg && (
            <div style={{ marginBottom: "var(--space-4)" }}>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Diagram
              </h4>
              <div
                style={{
                  background: "#fff",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  overflow: "hidden",
                  maxHeight: 300,
                }}
                dangerouslySetInnerHTML={{ __html: session.diagramSvg }}
              />
            </div>
          )}

          {/* Explanation preview */}
          {session.explanation && (
            <div style={{ marginBottom: "var(--space-4)" }}>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Explanation (preview)
              </h4>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.65,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {session.explanation}
              </p>
            </div>
          )}

          <Link
            href={`/workspace?q=${encodeURIComponent(session.question)}`}
            className="btn btn-primary btn-sm"
            id={`session-reopen-${session.id}`}
          >
            Reopen in Workspace →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = React.useState<SavedSession[]>([]);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const handleDelete = (id: string) => {
    deleteSession(id);
    setSessions(loadSessions());
  };

  const filtered = sessions.filter((s) =>
    s.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <Header />
      <main className="main-content" style={{ padding: "var(--space-8) 0 var(--space-12)" }}>
        <div className="container" style={{ maxWidth: 860 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div>
              <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginBottom: "0.25rem" }}>
                Saved <span className="text-gradient">Sessions</span>
              </h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} saved locally
              </p>
            </div>
            <Link href="/workspace" className="btn btn-primary btn-sm" id="new-session-btn">
              + New Session
            </Link>
          </div>

          {/* Search */}
          {sessions.length > 0 && (
            <input
              type="search"
              placeholder="Search sessions…"
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: "var(--space-5)" }}
              id="sessions-search"
              aria-label="Search saved sessions"
            />
          )}

          {/* Empty state */}
          {sessions.length === 0 && (
            <div
              className="card animate-fade-in"
              style={{
                padding: "var(--space-12)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--space-4)",
              }}
            >
              <div style={{ fontSize: "3rem" }} className="animate-float">💾</div>
              <h3 style={{ fontWeight: 600 }}>No saved sessions yet</h3>
              <p style={{ color: "var(--color-text-muted)", maxWidth: 380 }}>
                Sessions are saved automatically when you click <strong>Save Session</strong> in the workspace.
              </p>
              <Link href="/workspace" className="btn btn-primary" id="start-first-session-btn">
                Start Your First Session
              </Link>
            </div>
          )}

          {/* No results */}
          {sessions.length > 0 && filtered.length === 0 && (
            <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "var(--space-8) 0" }}>
              No sessions match "{search}"
            </p>
          )}

          {/* Session list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {filtered.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={() => handleDelete(session.id)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
