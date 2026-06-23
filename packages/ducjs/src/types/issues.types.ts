import { Actor, Scope, Viewer3DState } from ".";



// Carrot methodology: issue state is intentionally minimal.
export type DucIssueStatus =
  | "open"        // Needs attention, clarification, action, or a decision.
  | "closed"      // Resolved; no further action is expected.
  | "dismissed";  // Intentionally not acted on; requires dismissedReason.

/** A single message in an issue thread. */
export interface DucIssueMessage {
  id: string;
  author: Actor;
  content: string;
  /** Id of the message this message is responding to, if any. */
  replyToId?: string;
  /** Reactions keyed by emoji string. */
  reactions?: Record<string, Actor["identifier"][]>;
  createdAt: number; // timestamp in epoch milliseconds.
  editedAt?: number;
  deletedAt?: number;
}

export type DucIssueAnchor =
  | {
    type: "canvas";
    /** Canvas location in drawing units. */
    x: number;
    y: number;
    scope?: Scope;
  }
  | {
    type: "element";
    elementId: string;
    /** Anchor point on the attached element, in element-local units in case of referencing a specific region of the element. */
    anchorX?: number;
    anchorY?: number;
  }
  | {
    type: "model";
    /** Must reference a DucModelElement. */
    elementId: string;

    /**
     * Anchor point in model-local coordinates, in the model's native units.
     * This is the primary position used to keep the issue pinned to the model.
     */
    point: [number, number, number];

    /**
     * Surface normal in model-local coordinates.
     * Used to orient and offset the marker away from the surface.
     */
    normal?: [number, number, number];

    /**
     * Viewer state at the time this issue was created.
     * Stored separately from the element's viewerState so the inspection
     * angle is preserved even if the model's current viewer state changes.
     */
    viewerState?: Viewer3DState;

    /**
     * Stable CAD/BREP/IFC topology identifier, only when provided by the model pipeline.
     * Do not derive this from renderer face indices.
     */
    topologyId?: string;
  };

/**
 * An issue attached to a specific location, element, or area of the drawing.
 * Issues hold open questions, feedback, concerns, approvals, and the discussion that resolves them.
 */
export interface DucIssue {
  id: string;
  /**
   * Stable, human-readable identifier within the drawing.
   * Displayed to users as #1, #2, etc.
   */
  localId: number;
  title: string;

  status: DucIssueStatus;
  /** Required when the issue is dismissed. Records the reason for the dismissal. */
  dismissedReason?: string;


  /** Messages forming the issue discussion thread. */
  messages: DucIssueMessage[];

  /** Optional due date as epoch milliseconds. */
  dueDate?: number;
  anchor?: DucIssueAnchor;

  authorId: Actor["identifier"];
  assigneeIds?: Actor["identifier"][];
  followerIds?: Actor["identifier"][];

  createdAt: number; // timestamp in epoch milliseconds.
  updatedAt: number;
  deletedAt?: number;
}