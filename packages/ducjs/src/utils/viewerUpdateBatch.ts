type ViewerUpdate = (updateMarker?: boolean, notify?: boolean) => void;
type BatchableViewer = {
  _suppressUpdate?: boolean;
  update?: ViewerUpdate;
};

/**
 * Runs a sequence of three-cad-viewer mutations with at most one repaint.
 *
 * Every viewer setter repaints the whole scene. Restoring a saved view or
 * syncing size after a render runs many of them in one task, and on dense
 * clipped models each repaint redraws every solid plus its stencil caps.
 * The viewer's own `_suppressUpdate` guard skips the intermediate paints;
 * the final paint only happens if something inside the batch requested one.
 * Nested batches defer to the outermost one.
 */
export const withBatchedViewerUpdates = <T>(viewer: unknown, apply: () => T): T => {
  const target = viewer as BatchableViewer | null;
  const update = target?.update;
  if (!target || !update || target._suppressUpdate) {
    return apply();
  }

  let requested = false;
  let notify = false;
  target._suppressUpdate = true;
  target.update = (_updateMarker, shouldNotify = true) => {
    requested = true;
    notify ||= shouldNotify;
  };
  try {
    return apply();
  } finally {
    target.update = update;
    target._suppressUpdate = false;
    if (requested) {
      update.call(target, true, notify);
    }
  }
};
