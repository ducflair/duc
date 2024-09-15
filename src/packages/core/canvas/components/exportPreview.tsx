// src/components/ExportCanvasPreview.tsx

import React, { useEffect, useRef, useState } from 'react';
import { ErrorCanvasPreview } from './ImageExportDialog';
import { DEFAULT_EXPORT_PADDING } from '../constants';
import { canvasToBlob } from '../data/blob';
import { t } from '../i18n';
import { prepareElementsForExport } from '../data';
import type { UIAppState, BinaryFiles } from '../types';
import { isSomeElementSelected } from '../scene';
import { NonDeletedDucElement } from '../element/types';
import { exportToCanvas } from '..';

type ExportCanvasPreviewProps = {
  appStateSnapshot: Readonly<UIAppState>;
  elementsSnapshot: readonly NonDeletedDucElement[];
  files: BinaryFiles;
  name: string;
  exportWithDarkMode: boolean;
  exportBackground: boolean;
  exportScale: number;
  embedScene: boolean;
};

export const ExportCanvasPreview: React.FC<ExportCanvasPreviewProps> = ({
  appStateSnapshot: initialAppStateSnapshot,
  elementsSnapshot,
  files,
  name,
  exportWithDarkMode,
  exportBackground,
  exportScale,
  embedScene,
}) => {
  // Merge additional properties into appStateSnapshot if necessary
  const appStateSnapshot = {
    ...initialAppStateSnapshot,
    name,
    exportBackground,
    exportWithDarkMode,
    exportScale,
    exportEmbedScene: embedScene,
    selectedElementIds: {}, // Adjust as needed
  };

  const hasSelection = isSomeElementSelected(elementsSnapshot, appStateSnapshot);

  // States managed internally by ExportCanvasPreview
  const [renderError, setRenderError] = useState<Error | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  const { exportedElements, exportingFrame } = prepareElementsForExport(
    elementsSnapshot,
    appStateSnapshot,
    false, // exportSelectionOnly is managed externally if needed
  );

  useEffect(() => {
    const previewNode = previewRef.current;
    if (!previewNode) {
      return;
    }

    const maxWidth = previewNode.offsetWidth;
    const maxHeight = previewNode.offsetHeight;
    if (!maxWidth || !maxHeight) {
      return;
    }

    exportToCanvas({
      elements: exportedElements,
      appState: {
        ...appStateSnapshot,
        name,
        exportWithDarkMode,
        exportBackground,
        exportScale,
        exportEmbedScene: embedScene,
        contextMenu: null,
      },
      files,
      exportPadding: DEFAULT_EXPORT_PADDING,
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      exportingFrame,
    })
      .then((canvas) => {
        setRenderError(null);
        return canvasToBlob(canvas)
          .then(() => {
            previewNode.replaceChildren(canvas);
          })
          .catch((e) => {
            if (e.name === 'CANVAS_POSSIBLY_TOO_BIG') {
              throw new Error(t('canvasError.canvasTooBig'));
            }
            throw e;
          });
      })
      .catch((error) => {
        console.error(error);
        setRenderError(error);
      });
  }, [
    appStateSnapshot,
    files,
    exportedElements,
    exportingFrame,
    name,
    exportWithDarkMode,
    exportBackground,
    exportScale,
    embedScene,
  ]);

  return (
    <div
      className="ExportCanvasPreview"
      ref={previewRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {renderError && <ErrorCanvasPreview />}
    </div>
  );
};
