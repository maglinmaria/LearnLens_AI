"use client";

import React from "react";
import type { DFAValidateResponse, DFADefinition } from "@/lib/api";
import { validateDFA } from "@/lib/api";

interface DFALensCheckProps {
  question: string;
  dfa: DFADefinition | null;
}

export default function DFALensCheck({ question, dfa }: DFALensCheckProps) {
  const [result, setResult] = React.useState<DFAValidateResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});

  const runValidation = async () => {
    if (!dfa) {
      setError("Generate a DFA first before running LensCheck.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await validateDFA(question, dfa);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const toggleTrace = (i: number) =>
    setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-4)",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-emerald)",
              marginBottom: "0.2rem",
            }}
          >
            ✅ LensCheck — DFA Validator
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Deterministic structural check + sample string tests. No AI involved.
          </p>
        </div>
        <button
          id="dfa-lenscheck-run-btn"
          className="btn btn-secondary"
          onClick={runValidation}
          disabled={loading || !dfa}
          style={{ flexShrink: 0 }}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Checking…
            </>
          ) : (
            "Run LensCheck"
          )}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "var(--space-3)",
            background: "rgba(244,63,94,0.1)",
            border: "1px solid rgba(244,63,94,0.3)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-rose)",
            fontSize: "0.875rem",
            marginBottom: "var(--space-4)",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {!result && !loading && !error && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Generate a DFA above, then click <strong>Run LensCheck</strong> to
          verify its structure and run sample tests.
        </p>
      )}

      {result && (
        <div className="animate-fade-in">
          {/* Structural status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              marginBottom: "var(--space-5)",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-md)",
              background: result.is_structurally_valid
                ? "rgba(74,222,128,0.08)"
                : "rgba(244,63,94,0.08)",
              border: `1px solid ${
                result.is_structurally_valid
                  ? "rgba(74,222,128,0.3)"
                  : "rgba(244,63,94,0.3)"
              }`,
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>
              {result.is_structurally_valid ? "✅" : "❌"}
            </span>
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: result.is_structurally_valid
                    ? "var(--color-emerald)"
                    : "var(--color-rose)",
                }}
              >
                {result.is_structurally_valid
                  ? "Structure Valid"
                  : `${result.structural_errors.length} Structural Error${
                      result.structural_errors.length !== 1 ? "s" : ""
                    } Found`}
              </p>
              {result.is_structurally_valid && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  All states, transitions, and alphabet symbols are consistent.
                </p>
              )}
            </div>
          </div>

          {/* Structural errors */}
          {result.structural_errors.length > 0 && (
            <div style={{ marginBottom: "var(--space-5)" }}>
              <h4
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-rose)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "var(--space-2)",
                }}
              >
                Structural Errors
              </h4>
              <ul
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                  listStyle: "none",
                  padding: 0,
                }}
              >
                {result.structural_errors.map((e, i) => (
                  <li
                    key={i}
                    style={{
                      background: "rgba(244,63,94,0.08)",
                      border: "1px solid rgba(244,63,94,0.2)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "0.875rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        color: "var(--color-rose)",
                        marginRight: "0.5rem",
                      }}
                    >
                      [{e.code}]
                    </span>
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {e.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sample test results */}
          <div style={{ marginBottom: "var(--space-4)" }}>
            <h4
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "var(--space-3)",
              }}
            >
              Sample Test Results
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              {result.test_results.map((t, i) => {
                const notExecuted = t.actual === null && !t.passed;
                const pass = t.passed && t.actual !== null;
                const fail = !t.passed;

                return (
                  <div
                    key={i}
                    style={{
                      border: `1px solid ${
                        notExecuted
                          ? "var(--color-border)"
                          : pass
                          ? "rgba(74,222,128,0.3)"
                          : "rgba(244,63,94,0.3)"
                      }`,
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        padding: "var(--space-2) var(--space-3)",
                        background: notExecuted
                          ? "var(--color-surface-2)"
                          : pass
                          ? "rgba(74,222,128,0.06)"
                          : "rgba(244,63,94,0.06)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          color: "var(--color-text-primary)",
                          minWidth: 60,
                        }}
                      >
                        "{t.input_string}"
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        expected:{" "}
                        <strong>{t.expected ? "ACCEPT" : "REJECT"}</strong>
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        actual:{" "}
                        <strong>
                          {t.actual === null
                            ? "NOT RUN"
                            : t.actual
                            ? "ACCEPT"
                            : "REJECT"}
                        </strong>
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "var(--radius-full)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: notExecuted
                            ? "var(--color-surface-3)"
                            : pass
                            ? "rgba(74,222,128,0.15)"
                            : "rgba(244,63,94,0.15)",
                          color: notExecuted
                            ? "var(--color-text-muted)"
                            : pass
                            ? "var(--color-emerald)"
                            : "var(--color-rose)",
                        }}
                      >
                        {notExecuted ? "NOT RUN" : pass ? "PASS" : "FAIL"}
                      </span>
                      {t.trace.length > 0 && (
                        <button
                          onClick={() => toggleTrace(i)}
                          className="btn btn-ghost btn-sm"
                          style={{ marginLeft: "var(--space-1)" }}
                        >
                          {expanded[i] ? "▲" : "▼"}
                        </button>
                      )}
                    </div>
                    {t.note && (
                      <div
                        style={{
                          padding: "0.2rem var(--space-3)",
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          borderTop: "1px solid var(--color-border)",
                          background: "var(--color-surface-2)",
                        }}
                      >
                        {t.note}
                      </div>
                    )}
                    {expanded[i] && t.trace.length > 0 && (
                      <div
                        style={{
                          padding: "var(--space-2) var(--space-3)",
                          background: "var(--color-surface)",
                          borderTop: "1px solid var(--color-border)",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          color: "var(--color-text-secondary)",
                          lineHeight: 1.8,
                        }}
                      >
                        {t.trace.map((line, j) => (
                          <div key={j}>{line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Caveat */}
          <div
            style={{
              padding: "var(--space-3)",
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
            }}
          >
            ⚠ <em>{result.caveat}</em>
          </div>
        </div>
      )}
    </div>
  );
}
