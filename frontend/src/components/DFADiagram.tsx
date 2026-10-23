"use client";

import React from "react";
import type { DFADefinition } from "@/lib/api";

interface DFADiagramProps {
  dfa: DFADefinition;
  currentState?: string | null; // highlighted state (for simulator)
  highlightTransition?: { from: string; symbol: string; to: string } | null;
}

// Layout: arrange states in a circle or row
function computeLayout(
  states: string[],
  startState: string,
  acceptingStates: string[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const n = states.length;

  if (n === 0) return positions;

  // Width/height of the SVG canvas
  const W = 760;
  const H = 420;
  const cx = W / 2;
  const cy = H / 2;

  // Put start state first
  const ordered = [
    startState,
    ...states.filter((s) => s !== startState && !acceptingStates.includes(s)),
    ...states.filter((s) => s !== startState && acceptingStates.includes(s)),
  ];

  const unique = Array.from(new Set(ordered));

  if (unique.length === 1) {
    positions[unique[0]] = { x: cx, y: cy };
  } else if (unique.length <= 6) {
    // Arrange in a horizontal line
    const spacing = Math.min(140, (W - 100) / (unique.length - 1));
    const totalWidth = spacing * (unique.length - 1);
    const startX = cx - totalWidth / 2;
    unique.forEach((s, i) => {
      positions[s] = { x: startX + i * spacing, y: cy };
    });
  } else {
    // Arrange in a circle
    const radius = Math.min(cx, cy) - 60;
    unique.forEach((s, i) => {
      const angle = (2 * Math.PI * i) / unique.length - Math.PI / 2;
      positions[s] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }

  return positions;
}

const STATE_R = 28;
const ARROW_HEAD = 8;

function arrowHead(x: number, y: number, angle: number, color: string) {
  const ax = x - ARROW_HEAD * Math.cos(angle - 0.4);
  const ay = y - ARROW_HEAD * Math.sin(angle - 0.4);
  const bx = x - ARROW_HEAD * Math.cos(angle + 0.4);
  const by = y - ARROW_HEAD * Math.sin(angle + 0.4);
  return `M ${x} ${y} L ${ax} ${ay} L ${bx} ${by} Z`;
}

export default function DFADiagram({
  dfa,
  currentState,
  highlightTransition,
}: DFADiagramProps) {
  const positions = computeLayout(dfa.states, dfa.start_state, dfa.accepting_states);

  // Group transitions by (from, to) to stack labels
  const edgeMap: Record<string, string[]> = {};
  for (const [from, symMap] of Object.entries(dfa.transitions)) {
    for (const [sym, to] of Object.entries(symMap)) {
      const key = `${from}→${to}`;
      if (!edgeMap[key]) edgeMap[key] = [];
      edgeMap[key].push(sym);
    }
  }

  // Check if a pair is bidirectional (both A→B and B→A exist)
  const bidir = new Set<string>();
  for (const key of Object.keys(edgeMap)) {
    const [f, t] = key.split("→");
    if (edgeMap[`${t}→${f}`]) {
      bidir.add(key);
    }
  }

  const edges: JSX.Element[] = [];
  const labels: JSX.Element[] = [];
  let edgeIdx = 0;

  for (const [key, syms] of Object.entries(edgeMap)) {
    const [from, to] = key.split("→");
    const pf = positions[from];
    const pt = positions[to];
    if (!pf || !pt) continue;

    const label = syms.join(", ");
    const isHighlight =
      highlightTransition?.from === from &&
      syms.includes(highlightTransition.symbol) &&
      highlightTransition.to === to;

    const color = isHighlight ? "#22d3ee" : "#6366f1";
    const strokeWidth = isHighlight ? 2.5 : 1.5;

    if (from === to) {
      // Self-loop
      const lx = pf.x;
      const ly = pf.y - STATE_R;
      const loopR = 22;
      edges.push(
        <path
          key={`edge-${edgeIdx}`}
          d={`M ${lx - 10} ${ly} A ${loopR} ${loopR} 0 1 1 ${lx + 10} ${ly}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          markerEnd={`url(#arrow-${isHighlight ? "hi" : "normal"})`}
        />
      );
      labels.push(
        <text
          key={`lbl-${edgeIdx}`}
          x={lx}
          y={ly - loopR - 4}
          textAnchor="middle"
          fontSize="12"
          fill={color}
          fontWeight={isHighlight ? "700" : "500"}
        >
          {label}
        </text>
      );
    } else {
      // Regular edge — curve if bidirectional
      const dx = pt.x - pf.x;
      const dy = pt.y - pf.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / dist;
      const uy = dy / dist;

      const sx = pf.x + ux * STATE_R;
      const sy = pf.y + uy * STATE_R;
      const ex = pt.x - ux * STATE_R;
      const ey = pt.y - uy * STATE_R;

      const angle = Math.atan2(ey - sy, ex - sx);

      let d: string;
      let mx: number, my: number;

      if (bidir.has(key)) {
        // Offset curve
        const perp = 30;
        const cpx = (sx + ex) / 2 - uy * perp;
        const cpy = (sy + ey) / 2 + ux * perp;
        d = `M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`;
        mx = 0.25 * sx + 0.5 * cpx + 0.25 * ex;
        my = 0.25 * sy + 0.5 * cpy + 0.25 * ey;
      } else {
        d = `M ${sx} ${sy} L ${ex} ${ey}`;
        mx = (sx + ex) / 2;
        my = (sy + ey) / 2;
      }

      edges.push(
        <path
          key={`edge-${edgeIdx}`}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      );
      // Arrow head at end
      edges.push(
        <path
          key={`arr-${edgeIdx}`}
          d={arrowHead(ex, ey, angle, color)}
          fill={color}
        />
      );
      labels.push(
        <text
          key={`lbl-${edgeIdx}`}
          x={mx}
          y={my - 6}
          textAnchor="middle"
          fontSize="12"
          fill={color}
          fontWeight={isHighlight ? "700" : "500"}
        >
          {label}
        </text>
      );
    }
    edgeIdx++;
  }

  const stateNodes: JSX.Element[] = dfa.states.map((s) => {
    const p = positions[s];
    if (!p) return <g key={s} />;

    const isStart = s === dfa.start_state;
    const isAccept = dfa.accepting_states.includes(s);
    const isCurrent = s === currentState;

    let fill = "#1e1b4b";
    let stroke = "#6366f1";
    let textColor = "#e0e7ff";

    if (isCurrent) {
      fill = "#164e63";
      stroke = "#22d3ee";
      textColor = "#a5f3fc";
    } else if (isAccept) {
      fill = "#14532d";
      stroke = "#4ade80";
      textColor = "#bbf7d0";
    }

    return (
      <g key={s}>
        {/* Start arrow */}
        {isStart && (
          <>
            <line
              x1={p.x - STATE_R - 30}
              y1={p.y}
              x2={p.x - STATE_R - 4}
              y2={p.y}
              stroke="#a5b4fc"
              strokeWidth="1.5"
            />
            <path
              d={arrowHead(p.x - STATE_R - 4, p.y, 0, "#a5b4fc")}
              fill="#a5b4fc"
            />
            <text
              x={p.x - STATE_R - 35}
              y={p.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#a5b4fc"
            >
              start
            </text>
          </>
        )}
        {/* Double ring for accepting */}
        {isAccept && (
          <circle
            cx={p.x}
            cy={p.y}
            r={STATE_R + 6}
            fill="none"
            stroke={stroke}
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
        )}
        <circle
          cx={p.x}
          cy={p.y}
          r={STATE_R}
          fill={fill}
          stroke={stroke}
          strokeWidth={isCurrent ? 2.5 : 2}
        />
        <text
          x={p.x}
          y={p.y + 5}
          textAnchor="middle"
          fontSize="13"
          fontWeight="600"
          fill={textColor}
        >
          {s}
        </text>
      </g>
    );
  });

  return (
    <svg
      viewBox="0 0 760 420"
      style={{
        width: "100%",
        height: "auto",
        background: "#0f0f1a",
        borderRadius: "0.5rem",
        display: "block",
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="arrow-normal"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#6366f1" />
        </marker>
        <marker
          id="arrow-hi"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#22d3ee" />
        </marker>
      </defs>

      {edges}
      {labels}
      {stateNodes}
    </svg>
  );
}
