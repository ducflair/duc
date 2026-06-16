/**
 * Project Charter — grounded on ISO 21500/21502
 * 
 */

import { Actor } from ".";



/**
 * The current phase of the pre-execution cycle.
 *
 * Phases are not strictly linear, they are cycles — a review that raises concerns
 * returns the Charter to intent. Closed is terminal: use closedReason to record why.
 */
export type DucCharterPhase =
  | "intent"    // Direction is being formed, explored, or revised.
  | "review"    // Work is being checked, challenged, or formally approved.
  | "delivery"  // Project is being prepared for handoff, submission, or execution.
  | "closed";   // Charter is no longer active. See closedReason.


/**
 * A condition the project outcome must or should satisfy.
 *
 * Requirements define what the delivered artifact must do or be — not how to build it
 * (that's constraints) and not what work is in scope (that's the objective).
 *
 * Verification evidence lives in issues, tables, plots, or linked files — not here.
 */
export interface DucCharterRequirement {
  id: string;
  statement: string;
  /**
   * true  — must be met. Failure to satisfy this requirement fails the project.
   * false — should be met, but the project can proceed if it isn't.
   */
  must: boolean;
  /**
   * Conditions that make this requirement verifiably satisfied.
   * Each entry should be a concrete, testable statement
   */
  acceptanceCriteria?: string[];
}


/**
 * A limiting condition that bounds the solution space.
 *
 * Constraints define how the project can be executed or what solutions are permissible —
 * not what the outcome must achieve (that's requirements).
 * Explicit scope exclusions also belong here as hard constraints.
 */
export interface DucCharterConstraint {
  id: string;
  statement: string;
  /**
   * true  — cannot be violated under any circumstance.
   * false — strong preference; can be revisited with documented justification.
   */
  hard: boolean;
}


/**
 * A resolved choice significant enough to explain the current design direction.
 *
 * Proposals, open questions, and unresolved debate belong in issues — not here.
 * A decision earns its place in the Charter when understanding the current artifact
 * state requires knowing that this choice was made and why.
 */
export interface DucCharterDecision {
  id: string;
  /**
   * true  — decision is in effect.
   * false — decision was considered and rejected. Kept for traceability.
   */
  accepted: boolean;
  /** The decision itself, stated as a clear and compact conclusion. */
  decision: string;
  /**
   * Why this choice was made: the reasoning, the alternatives considered,
   * and what was accepted as a consequence.
   */
  rationale: string;
  /** Issues that informed or are traceable to this decision. */
  issueIds?: string[];
  decidedAt: number; // timestamp in epoch milliseconds.
}


/**
 * The project-level identity and reasoning anchor.
 *
 * A Charter holds what an engineer or agent needs to understand what the project
 * is trying to achieve and why the current artifact state exists.
 */
export interface DucCharter {
  title: string;
  /** Orientation: what kind of project this is and the context needed to read the charter */
  description?: string;
  /**
   * Why this project exists and what concrete outcome it must reach.
   * This is the single most important field in the Charter — every requirement,
   * constraint, and decision should be traceable back to it.
   */
  objective: string;

  phase: DucCharterPhase;
  /** Required when phase is "closed". Records the reason for the Charter to be closed. */
  closedReason?: string;

  /**
   * What the project outcome must do or be.
   * Scope exclusions and solution-space limits belong in constraints, not here.
   */
  requirements: DucCharterRequirement[];
  /**
   * Conditions that bound the solution space, including explicit scope exclusions.
   * Hard constraints are non-negotiable; soft constraints are strong preferences.
   */
  constraints: DucCharterConstraint[];
  /**
   * The resolved choices that define the current project direction.
   * Only decisions significant enough to explain why the artifact is in its
   * current state belong here. Everything else lives in issues.
   */
  decisions: DucCharterDecision[];
  /** Everyone with a stake in the project outcome — active contributors or not. */
  stakeholders?: Array<{
    actor: Actor;
    role: string; // Formal or informal role of the stakeholder.
  }>;

  /** Unix epoch milliseconds of the last Charter update. */
  updatedAt: number;
}
