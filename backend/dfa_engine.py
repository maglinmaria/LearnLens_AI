"""
LearnLens AI – DFA Engine
Deterministic validator and string simulator for DFAs.
No AI dependency – all checks are algorithmically exact.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


# ── Data structures ────────────────────────────────────────────────────────────

@dataclass
class DFAData:
    """Structured DFA definition returned by the AI and used by the engine."""
    states: list[str]
    alphabet: list[str]
    start_state: str
    accepting_states: list[str]
    # transitions: { state: { symbol: next_state } }
    transitions: dict[str, dict[str, str]]
    explanation: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> "DFAData":
        return cls(
            states=d["states"],
            alphabet=d["alphabet"],
            start_state=d["start_state"],
            accepting_states=d["accepting_states"],
            transitions=d["transitions"],
            explanation=d.get("explanation", ""),
        )


@dataclass
class StructuralError:
    code: str
    message: str


@dataclass
class TestResult:
    input_string: str
    expected: bool
    actual: Optional[bool]
    passed: bool
    trace: list[str]
    note: str = ""


@dataclass
class ValidationReport:
    structural_errors: list[StructuralError]
    test_results: list[TestResult]
    is_structurally_valid: bool
    caveat: str = (
        "Sample tests do not prove formal language equivalence. "
        "They only check the DFA's behaviour on specific strings."
    )


# ── Validator ──────────────────────────────────────────────────────────────────

def validate_dfa(dfa: DFAData) -> list[StructuralError]:
    """
    Deterministically check the DFA structure.
    Returns a list of structural errors (empty = valid).
    """
    errors: list[StructuralError] = []
    state_set = set(dfa.states)
    alphabet_set = set(dfa.alphabet)

    # 1. States must be non-empty
    if not dfa.states:
        errors.append(StructuralError("EMPTY_STATES", "DFA has no states."))
        return errors  # No point continuing

    # 2. Alphabet must be non-empty
    if not dfa.alphabet:
        errors.append(StructuralError("EMPTY_ALPHABET", "DFA has no alphabet symbols."))

    # 3. Start state must be in states
    if dfa.start_state not in state_set:
        errors.append(StructuralError(
            "INVALID_START",
            f"Start state '{dfa.start_state}' is not in the state set {dfa.states}.",
        ))

    # 4. All accepting states must be in states
    for s in dfa.accepting_states:
        if s not in state_set:
            errors.append(StructuralError(
                "INVALID_ACCEPT",
                f"Accepting state '{s}' is not in the state set {dfa.states}.",
            ))

    # 5. Transition table completeness and destination validity
    for state in dfa.states:
        if state not in dfa.transitions:
            errors.append(StructuralError(
                "MISSING_TRANSITIONS",
                f"State '{state}' has no transition entries.",
            ))
            continue
        for sym in dfa.alphabet:
            dest = dfa.transitions[state].get(sym)
            if dest is None:
                errors.append(StructuralError(
                    "MISSING_TRANSITION",
                    f"No transition defined for state '{state}' on symbol '{sym}'.",
                ))
            elif dest not in state_set:
                errors.append(StructuralError(
                    "INVALID_DEST",
                    f"Transition from '{state}' on '{sym}' leads to unknown state '{dest}'.",
                ))

    # 6. Check for extra symbols in transition table
    for state, sym_map in dfa.transitions.items():
        if state not in state_set:
            errors.append(StructuralError(
                "EXTRA_STATE",
                f"Transition entry for unknown state '{state}'.",
            ))
        for sym in sym_map:
            if sym not in alphabet_set:
                errors.append(StructuralError(
                    "EXTRA_SYMBOL",
                    f"Transition for state '{state}' uses symbol '{sym}' not in alphabet.",
                ))

    return errors


# ── Simulator ─────────────────────────────────────────────────────────────────

def simulate(dfa: DFAData, input_string: str) -> tuple[bool, list[str]]:
    """
    Run the DFA on input_string.
    Returns (accepted: bool, trace: list[str]).
    Raises ValueError if the DFA is not structurally sound enough to run.
    """
    if dfa.start_state not in dfa.states:
        raise ValueError(f"Start state '{dfa.start_state}' is not in states.")

    current = dfa.start_state
    trace: list[str] = [f"Start: {current}"]

    for sym in input_string:
        if sym not in dfa.alphabet:
            raise ValueError(
                f"Symbol '{sym}' is not in the DFA alphabet {dfa.alphabet}."
            )
        trans = dfa.transitions.get(current, {})
        next_state = trans.get(sym)
        if next_state is None:
            raise ValueError(
                f"No transition from state '{current}' on symbol '{sym}'."
            )
        trace.append(f"  {current} --{sym}--> {next_state}")
        current = next_state

    accepted = current in dfa.accepting_states
    trace.append(f"Final state: {current} → {'ACCEPTED' if accepted else 'REJECTED'}")
    return accepted, trace


# ── Step-by-step simulator ─────────────────────────────────────────────────────

@dataclass
class SimulatorState:
    current_state: str
    step: int
    trace: list[str]
    input_string: str
    finished: bool
    accepted: Optional[bool]
    error: Optional[str]


def simulator_step(dfa: DFAData, input_string: str, step: int) -> SimulatorState:
    """
    Return the DFA state after processing `step` symbols from input_string.
    step=0 means start state (nothing consumed).
    """
    current = dfa.start_state
    trace: list[str] = [f"Start: {current}"]
    error: Optional[str] = None

    for i in range(step):
        if i >= len(input_string):
            break
        sym = input_string[i]
        if sym not in dfa.alphabet:
            error = f"Symbol '{sym}' not in DFA alphabet {dfa.alphabet}."
            return SimulatorState(
                current_state=current,
                step=i,
                trace=trace,
                input_string=input_string,
                finished=True,
                accepted=None,
                error=error,
            )
        trans = dfa.transitions.get(current, {})
        next_state = trans.get(sym)
        if next_state is None:
            error = f"No transition from '{current}' on '{sym}'."
            return SimulatorState(
                current_state=current,
                step=i,
                trace=trace,
                input_string=input_string,
                finished=True,
                accepted=None,
                error=error,
            )
        trace.append(f"  {current} --{sym}--> {next_state}")
        current = next_state

    finished = step >= len(input_string)
    accepted: Optional[bool] = None
    if finished:
        accepted = current in dfa.accepting_states
        trace.append(
            f"Final state: {current} → {'ACCEPTED' if accepted else 'REJECTED'}"
        )

    return SimulatorState(
        current_state=current,
        step=step,
        trace=trace,
        input_string=input_string,
        finished=finished,
        accepted=accepted,
        error=None,
    )


# ── Sample test suite for "binary strings containing 001" ─────────────────────

DFA_001_SAMPLE_TESTS = [
    {"input": "001",  "expected": True,  "note": "Minimal accepted string"},
    {"input": "1001", "expected": True,  "note": "Contains 001 substring"},
    {"input": "010",  "expected": False, "note": "Does not contain 001"},
    {"input": "111",  "expected": False, "note": "All ones, no 001"},
]


def run_sample_tests(dfa: DFAData, tests: list[dict]) -> list[TestResult]:
    """
    Run a fixed set of sample tests against the DFA.
    Never marks PASS unless actually executed successfully.
    """
    results: list[TestResult] = []
    for t in tests:
        inp: str = t["input"]
        expected: bool = t["expected"]
        note: str = t.get("note", "")
        try:
            actual, trace = simulate(dfa, inp)
            passed = actual == expected
            results.append(TestResult(
                input_string=inp,
                expected=expected,
                actual=actual,
                passed=passed,
                trace=trace,
                note=note,
            ))
        except ValueError as exc:
            results.append(TestResult(
                input_string=inp,
                expected=expected,
                actual=None,
                passed=False,
                trace=[],
                note=f"Simulation error: {exc}",
            ))
    return results
