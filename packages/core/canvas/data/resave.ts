import { DucElement } from "../element/types";
import { AppState, BinaryFiles } from "../types";
import { exportCanvas, prepareElementsForExport } from ".";
import { getFileHandleType, isImageFileHandleType } from "./blob";

export const resaveAsImageWithScene = async (
  elements: readonly DucElement[],
  appState: AppState,
  files: BinaryFiles,
  name: string,
) => {
  const { exportBackground, viewBackgroundColor, fileHandle } = appState;

  const fileHandleType = getFileHandleType(fileHandle);

  if (!fileHandle || !isImageFileHandleType(fileHandleType)) {
    throw new Error(
      "fileHandle should exist and should be of type svg or png when resaving",
    );
  }
  appState = {
    ...appState,
    exportEmbedScene: true,
  };

  const { exportedElements, exportingFrame } = prepareElementsForExport(
    elements,
    appState,
    false,
  );

  await exportCanvas(fileHandleType, exportedElements, appState, files, {
    exportBackground,
    viewBackgroundColor,
    name,
    fileHandle,
    exportingFrame,
  });

  return { fileHandle };
};
