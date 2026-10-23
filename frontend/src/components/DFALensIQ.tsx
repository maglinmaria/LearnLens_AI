"use client";

import React from "react";
import type { DFADefinition, DFASimulateResponse } from "@/lib/api";
import { simulateDFA } from "@/lib/api";

interface DFALensIQProps {
  dfa: DFADefinition | null;
}

export default function DFALensIQ({ dfa }: DFALensIQProps) {
  const [inputString, setInputString] = React.useState("");
  const [step, setStep] = React.useState(0);
  const [simResult, setSimResult] = React.useState<DFASimulateResponse | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [started, setStarted] = React.useState(false);

  const fetchStep = async (newStep: number) => {
    if (!dfa) return;
    setLoading(true);
    setError(null);
    try {
      const res = await simulateDFA(dfa, inputString, newStep);
      setSimResult(res);
      if (res.error) {
        setError(res.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!dfa) {
      setError("Generate a DFA first before simulating.");
      return;
    }
    if (!inputString && inputString !== "") {
      setError("Enter a binary string to simulate.");
      return;
    }
    setStep(0);
    setStarted(true);
    setSimResult(null);
    await fetchStep(0);
  };

  const handleNext = async () => {
    const next = step + 1;
    setStep(next);
    await fetchStep(next);
  };

  const handleReset = () => {
    setStep(0);
    setSimResult(null);
    setStarted(false);
    setError(null);
  };

  // Highlight current symbol
  const renderInput = () => {
    if (!inputString) return <em style={{ color: "var(--color-text-muted)" }}>ε (empty string)</em>;
    return (
      <span style={{ fontFamily: "monospace", fontSize: "1.1rem", letterSpacing: "0.1em" }}>
        {inputString.split("").map((ch, i) => {
          const isConsumed = simResult ? i < simResult.step : false;
          const isCurrent = simResult ? i === simResult.step - 1 : false;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                width: "1.6rem",
                textAlign: "center",
                borderRadius: "0.25rem",
                padding: "0.1rem 0",
                margin: "0 1px",
                background: isCurrent
                  ? "rgba(34,211,238,0.25)"
                  : isConsumed
                  ? "rgba(99,102,241,0.15)"
                  : "transparent",
                color: isCurrent
                  ? "#22d3ee"
                  : isConsumed
                  ? "#a5b4fc"
                  : "var(--color-text-secondary)",
                fontWeight: isCurrent ? 700 : 400,
                border: isCurrent ? "1px solid rgba(34,211,238,0.5)" : "1px solid transparent",
              }}
            >
              {ch}
            </span>
          );
        })}
      </span>
    );
  };

  const isFinished = simResult?.finished ?? false;
  const accepted = simResult?.accepted;

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
      <div style={{ marginBottom: "var(--space-4)" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--color-cyan)",
            marginBottom: "0.2rem",
          }}
        >
          🧠 LensIQ — Interactive DFA Simulator
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
          Step through the DFA one symbol at a time using the actual generated
          DFA data.
        </p>
      </div>

      {/* Input */}
      <div style={{ marginBottom: "var(--space-4)" }}>
        <label
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
            display: "block",
            marginBottom: "0.375rem",
          }}
          htmlFor="dfa-sim-input"
        >
          Binary string to simulate
        </label>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <input
            id="dfa-sim-input"
            type="text"
            className="input"
            placeholder="e.g. 001, 1001, 010, 111"
            value={inputString}
            onChange={(e) => {
              setInputString(e.target.value);
              handleReset();
            }}
            disabled={started && !isFinished}
            style={{ fontFamily: "monospace", flex: 1 }}
          />
          {!started ? (
            <button
              id="dfa-sim-start-btn"
              className="btn btn-primary"
              onClick={handleStart}
              disabled={loading || !dfa}
            >
              {loading ? <span className="spinner" style={{ borderTopColor: "#fff" }} /> : "▶ Start"}
            </button>
          ) : (
            <button
              id="dfa-sim-reset-btn"
              className="btn btn-ghost"
              onClick={handleReset}
            >
              ↺ Reset
            </button>
          )}
        </div>

        {/* Quick example buttons */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-1)",
            flexWrap: "wrap",
            marginTop: "var(--space-2)",
          }}
        >
          {["001", "1001", "010", "111", "0010"].map((s) => (
            <button
              key={s}
              className="btn btn-ghost btn-sm"
              style={{ fontFamily: "monospace", fontSize: "0.8rem" }}
              onClick={() => {
                setInputString(s);
                handleReset();
              }}
              disabled={started && !isFinished}
            >
              {s}
            </button>
          ))}
        </div>
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

      {started && simResult && (
        <div className="animate-fade-in">
          {/* Progress bar */}
          <div style={{ marginBottom: "var(--space-4)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                marginBottom: "0.375rem",
              }}
            >
              <span>
                Step {simResult.step} / {inputString.length}
              </span>
              <span>
                Current state:{" "}
                <strong
                  style={{
                    color: isFinished
                      ? accepted
                        ? "var(--color-emerald)"
                        : "var(--color-rose)"
                      : "var(--color-cyan)",
                  }}
                >
                  {simResult.current_state}
                </strong>
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: "var(--color-surface-3)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${
                    inputString.length
                      ? (simResult.step / inputString.length) * 100
                      : 100
                  }%`,
                  background: isFinished
                    ? accepted
                      ? "var(--color-emerald)"
                      : "var(--color-rose)"
                    : "var(--color-cyan)",
                  transition: "width 0.3s ease, background 0.3s ease",
                  borderRadius: 3,
                }}
              />
            </div>
          </div>

          {/* Tape view */}
          <div
            style={{
              marginBottom: "var(--space-4)",
              padding: "var(--space-3)",
              background: "var(--color-surface-2)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                marginBottom: "0.5rem",
              }}
            >
              Input tape:
            </div>
            {renderInput()}
          </div>

          {/* Last transition */}
          {simResult.trace.length > 1 && !isFinished && (
            <div
              style={{
                marginBottom: "var(--space-4)",
                padding: "var(--space-2) var(--space-3)",
                background: "rgba(34,211,238,0.06)",
                border: "1px solid rgba(34,211,238,0.2)",
                borderRadius: "var(--radius-md)",
                fontFamily: "monospace",
                fontSize: "0.875rem",
                color: "#a5f3fc",
              }}
            >
              {simResult.trace[simResult.trace.length - 1]}
            </div>
          )}

          {/* Final result */}
          {isFinished && (
            <div
              style={{
                padding: "var(--space-4)",
                borderRadius: "var(--radius-md)",
                background:
                  accepted === null
                    ? "var(--color-surface-2)"
                    : accepted
                    ? "rgba(74,222,128,0.1)"
                    : "rgba(244,63,94,0.1)",
                border: `1px solid ${
                  accepted === null
                    ? "var(--color-border)"
                    : accepted
                    ? "rgba(74,222,128,0.4)"
                    : "rgba(244,63,94,0.4)"
                }`,
                textAlign: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                {accepted === null ? "⚠" : accepted ? "✅" : "❌"}
              </div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color:
                    accepted === null
                      ? "var(--color-amber)"
                      : accepted
                      ? "var(--color-emerald)"
                      : "var(--color-rose)",
                }}
              >
                {accepted === null
                  ? "Simulation error"
                  : accepted
                  ? "String ACCEPTED"
                  : "String REJECTED"}
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                  marginTop: "0.25rem",
                }}
              >
                Final state: <strong>{simResult.current_state}</strong>
                {accepted !== null &&
                  (accepted
                    ? " (accepting state)"
                    : " (non-accepting state)")}
              </p>
            </div>
          )}

          {/* Full trace */}
          <details style={{ marginBottom: "var(--space-3)" }}>
            <summary
              style={{
                cursor: "pointer",
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                marginBottom: "var(--space-2)",
                userSelect: "none",
              }}
            >
              Full trace ({simResult.trace.length} steps)
            </summary>
            <div
              style={{
                padding: "var(--space-3)",
                background: "var(--color-surface-2)",
                borderRadius: "var(--radius-md)",
                fontFamily: "monospace",
                fontSize: "0.8rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.8,
                border: "1px solid var(--color-border)",
              }}
            >
              {simResult.trace.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </details>

          {/* Controls */}
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {!isFinished && (
              <button
                id="dfa-sim-next-btn"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner" style={{ borderTopColor: "#fff" }} />
                ) : (
                  "→ Next Step"
                )}
              </button>
            )}
            <button
              id="dfa-sim-reset-bottom-btn"
              className="btn btn-ghost"
              onClick={handleReset}
            >
              ↺ Reset
            </button>
            {!isFinished && (
              <button
                id="dfa-sim-run-all-btn"
                className="btn btn-secondary"
                onClick={async () => {
                  const finalStep = inputString.length;
                  setStep(finalStep);
                  await fetchStep(finalStep);
                }}
                disabled={loading}
              >
                ⏭ Run to End
              </button>
            )}
          </div>
        </div>
      )}

      {!started && !error && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          {dfa
            ? "Enter a binary string above and click Start to simulate."
            : "Generate a DFA first using the input above."}
        </p>
      )}
    </div>
  );
}
