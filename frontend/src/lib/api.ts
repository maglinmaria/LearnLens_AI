/**
 * API client for LearnLens AI backend.
 * Never sends sensitive credentials — all AI calls go through the backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DiagramResponse {
  svg: string;
  diagram_type: string;
  question: string;
  cached: boolean;
}

export interface ExplainResponse {
  explanation: string;
  question: string;
}

export interface LensIQResponse {
  deep_dive: string;
  question: string;
}

export interface VerificationScore {
  accuracy_score: number;
  completeness_score: number;
  clarity_score: number;
  overall_verdict: string;
  strengths: string[];
  issues: string[];
  suggestions: string[];
  verified_facts: string[];
  summary: string;
}

export interface LensCheckResponse {
  question: string;
  verification: VerificationScore;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
}

export interface QuizResponse {
  question: string;
  quiz: QuizQuestion[];
  num_questions: number;
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  model: string;
  gemini_configured: boolean;
}

export interface DiagramTypeInfo {
  [key: string]: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── API Functions ──────────────────────────────────────────────────────────────

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse<HealthResponse>(res);
}

export async function fetchDiagramTypes(): Promise<DiagramTypeInfo> {
  const res = await fetch(`${API_BASE}/diagram-types`);
  const data = await handleResponse<{ diagram_types: DiagramTypeInfo }>(res);
  return data.diagram_types;
}

export async function generateDiagram(
  question: string,
  diagramType: string = "auto",
  image?: File | null,
  useCache: boolean = true
): Promise<DiagramResponse> {
  const form = new FormData();
  form.append("question", question);
  form.append("diagram_type", diagramType);
  form.append("use_cache", String(useCache));
  if (image) form.append("image", image);

  const res = await fetch(`${API_BASE}/generate-diagram`, {
    method: "POST",
    body: form,
  });
  return handleResponse<DiagramResponse>(res);
}

export async function explainMaterial(
  question: string,
  image?: File | null
): Promise<ExplainResponse> {
  const form = new FormData();
  form.append("question", question);
  if (image) form.append("image", image);

  const res = await fetch(`${API_BASE}/explain`, {
    method: "POST",
    body: form,
  });
  return handleResponse<ExplainResponse>(res);
}

export async function lensIQ(
  question: string,
  svgContent?: string,
  explanation?: string
): Promise<LensIQResponse> {
  const res = await fetch(`${API_BASE}/lens-iq`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, svg_content: svgContent, explanation }),
  });
  return handleResponse<LensIQResponse>(res);
}

export async function lensCheck(
  question: string,
  svgContent?: string,
  explanation?: string
): Promise<LensCheckResponse> {
  const res = await fetch(`${API_BASE}/lens-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, svg_content: svgContent, explanation }),
  });
  return handleResponse<LensCheckResponse>(res);
}

export async function generateQuiz(
  question: string,
  explanation?: string,
  numQuestions: number = 5
): Promise<QuizResponse> {
  const res = await fetch(`${API_BASE}/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, explanation, num_questions: numQuestions }),
  });
  return handleResponse<QuizResponse>(res);
}

// ── DFA Types ──────────────────────────────────────────────────────────────────

export interface DFADefinition {
  states: string[];
  alphabet: string[];
  start_state: string;
  accepting_states: string[];
  transitions: Record<string, Record<string, string>>;
  explanation: string;
}

export interface DFAGenerateResponse {
  dfa: DFADefinition;
  question: string;
}

export interface DFAStructuralError {
  code: string;
  message: string;
}

export interface DFATestResult {
  input_string: string;
  expected: boolean;
  actual: boolean | null;
  passed: boolean;
  trace: string[];
  note: string;
}

export interface DFAValidateResponse {
  structural_errors: DFAStructuralError[];
  test_results: DFATestResult[];
  is_structurally_valid: boolean;
  caveat: string;
}

export interface DFASimulateResponse {
  current_state: string;
  step: number;
  trace: string[];
  input_string: string;
  finished: boolean;
  accepted: boolean | null;
  error: string | null;
}

// ── DFA API Functions ──────────────────────────────────────────────────────────

export async function generateDFA(
  question: string,
  image?: File | null
): Promise<DFAGenerateResponse> {
  const form = new FormData();
  form.append("question", question);
  if (image) form.append("image", image);
  const res = await fetch(`${API_BASE}/dfa/generate`, {
    method: "POST",
    body: form,
  });
  return handleResponse<DFAGenerateResponse>(res);
}

export async function validateDFA(
  question: string,
  dfa: DFADefinition,
  sampleTests?: Array<{ input: string; expected: boolean; note?: string }>
): Promise<DFAValidateResponse> {
  const body: Record<string, unknown> = { question, dfa };
  if (sampleTests) body.sample_tests = sampleTests;
  const res = await fetch(`${API_BASE}/dfa/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<DFAValidateResponse>(res);
}

export async function simulateDFA(
  dfa: DFADefinition,
  inputString: string,
  step: number
): Promise<DFASimulateResponse> {
  const res = await fetch(`${API_BASE}/dfa/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dfa, input_string: inputString, step }),
  });
  return handleResponse<DFASimulateResponse>(res);
}

export async function extractDFAQuestion(image: File): Promise<{ question: string }> {
  const form = new FormData();
  form.append("image", image);
  const res = await fetch(`${API_BASE}/dfa/extract-question`, {
    method: "POST",
    body: form,
  });
  return handleResponse<{ question: string }>(res);
}
