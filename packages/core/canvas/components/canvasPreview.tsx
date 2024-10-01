import React, { useEffect, useRef, useState } from 'react'
import { ErrorCanvasPreview } from './ImageExportDialog';
import { exportToCanvas } from '..';
import { DEFAULT_EXPORT_PADDING, THEME } from '../constants';
import { canvasToBlob } from '../data/blob';
import { t } from '../i18n';
import { prepareElementsForExport } from '../data';
import { ActionManager } from '../actions/manager';
import { NonDeletedDucElement } from '../element/types';
import { isSomeElementSelected } from '../scene';
import { UIAppState, BinaryFiles, AppClassProperties, AppState } from '../types';
import "./ImageExportDialog.scss";

type CanvasPreviewProps = {
    appStateSnapshot: Readonly<AppState>;
    elementsSnapshot: readonly NonDeletedDucElement[];
    files: BinaryFiles;
    name: string;
    exportWithDarkMode: boolean;
    exportBackground: boolean;
    exportScale: number;
};
  
export const CanvasPreview = ({
    appStateSnapshot: appStateSnapshotInitial,
    elementsSnapshot,
    files,
    name,
    exportWithDarkMode,
    exportBackground,
    exportScale
}: CanvasPreviewProps) => {

    const appStateSnapshot:AppState = {...appStateSnapshotInitial, selectedElementIds: {}, exportScale};
    
    const hasSelection = isSomeElementSelected(
      elementsSnapshot,
      appStateSnapshot,
    );

    const [projectName, setProjectName] = useState(name);
    const [exportSelectionOnly, setExportSelectionOnly] = useState(hasSelection);
    // const [exportWithBackground, setExportWithBackground] = useState(
    //   appStateSnapshot.exportBackground,
    // );
    const [embedScene, setEmbedScene] = useState(false);
  
    const previewRef = useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState<Error | null>(null);
  
    const { exportedElements, exportingFrame } = prepareElementsForExport(
      elementsSnapshot,
      appStateSnapshot,
      false,
    );


    useEffect(() => {
        const previewNode = previewRef.current;
        if (!previewNode) {
            return;
        }

        const maxWidth = previewNode.offsetWidth;
        const maxHeight = previewNode.offsetHeight;
        if (!maxWidth) {
            return;
        }

        exportToCanvas({
            elements: exportedElements,
            appState: {
                ...appStateSnapshot,
                name: projectName,
                exportBackground,
                exportWithDarkMode,
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
            // if converting to blob fails, there's some problem that will
            // likely prevent preview and export (e.g. canvas too big)
            return canvasToBlob(canvas)
            .then(() => {
                previewNode.replaceChildren(canvas);
            })
            .catch((e) => {
                if (e.name === "CANVAS_POSSIBLY_TOO_BIG") {
                throw new Error(t("canvasError.canvasTooBig"));
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
        projectName,
        exportWithDarkMode,
        exportBackground,
        // exportScale,
        embedScene,
    ]);

    return (
        <div className="ImageExportModal__preview__canvas h-full w-full flex flex-col items-center" ref={previewRef}>
            {renderError && <ErrorCanvasPreview />}
        </div>
    )
}