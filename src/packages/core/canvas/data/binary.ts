// import * as flatbuffers from 'flatbuffers';
// import { ExportedDataState, AppState, BinaryFiles, DucElement, BinaryFilesEntry } from './duc';
// import { DucElement as DucElementType, AppState as AppStateType, BinaryFiles as BinaryFilesType } from './duc'; // assuming your original types are here
// import { fileOpen, fileSave } from "./filesystem";
// import { DEFAULT_FILENAME, EXPORT_DATA_TYPES, EXPORT_SOURCE, VERSIONS } from '../constants';
// import { cleanAppStateForExport } from '../appState';

// // Example function to serialize ExportedDataState to FlatBuffers binary
// export const serializeAsFlatBuffers = (
//   elements: readonly DucElementType[],
//   appState: Partial<AppStateType>,
//   files: BinaryFilesType,
//   type: "local" | "database",
// ): Uint8Array => {
//   const builder = new flatbuffers.Builder(1024);

//   // Serialize elements
//   const elementOffsets = elements.map((element: any) => {
//     const idOffset = (builder as any).createString(element.id);
//     const labelOffset = (builder as any).createString(element.label);
//     const scopeOffset = (builder as any).createString(element.scope);
//     const writingLayerOffset = (builder as any).createString(element.writingLayer);
//     const backgroundColorOffset = (builder as any).createString(element.backgroundColor);
//     const strokeColorOffset = (builder as any).createString(element.strokeColor);
//     const frameIdOffset = (builder as any).createString(element.frameId);
//     const linkOffset = (builder as any).createString(element.link);
//     const customDataOffset = (builder as any).createString(JSON.stringify(element.customData));

//     DucElement.startDucElement(builder as any);
//     DucElement.addId(builder as any, idOffset);
//     DucElement.addX(builder as any, element.x);
//     DucElement.addY(builder as any, element.y);
//     DucElement.addScope(builder as any, scopeOffset);
//     DucElement.addWritingLayer(builder as any, writingLayerOffset);
//     DucElement.addLabel(builder as any, labelOffset);
//     DucElement.addRatioLocked(builder as any, element.ratioLocked);
//     DucElement.addIsVisible(builder as any, element.isVisible);
//     DucElement.addFillStyle(builder as any, (builder as any).createString(element.fillStyle));
//     DucElement.addRoughness(builder as any, element.roughness);
//     DucElement.addRoundnessType(builder as any, (builder as any).createString(element.roundness.type));
//     if (element.roundness.value !== undefined) {
//       DucElement.addRoundnessValue(builder as any, element.roundness.value);
//     }
//     DucElement.addBackgroundColor(builder as any, backgroundColorOffset);
//     DucElement.addStrokeColor(builder as any, strokeColorOffset);
//     DucElement.addStrokeWidth(builder as any, element.strokeWidth);
//     DucElement.addStrokeStyle(builder as any, (builder as any).createString(element.strokeStyle));
//     DucElement.addStrokePlacement(builder as any, (builder as any).createString(element.strokePlacement));
//     DucElement.addOpacity(builder as any, element.opacity);
//     DucElement.addWidth(builder as any, element.width);
//     DucElement.addHeight(builder as any, element.height);
//     DucElement.addAngle(builder as any, element.angle);
//     DucElement.addSeed(builder as any, element.seed);
//     DucElement.addVersion(builder as any, element.version);
//     DucElement.addVersionNonce(builder as any, element.versionNonce);
//     DucElement.addIsDeleted(builder as any, element.isDeleted);
//     DucElement.addFrameId(builder as any, frameIdOffset);
//     DucElement.addUpdated(builder as any, element.updated);
//     DucElement.addLink(builder as any, linkOffset);
//     DucElement.addLocked(builder as any, element.locked);
//     DucElement.addCustomData(builder as any, customDataOffset);

//     // Add groupIds and boundElements if needed
//     // ...

//     return DucElement.endDucElement(builder);
//   });

//   const elementsOffset = ExportedDataState.createElementsVector(builder, elementOffsets);

//   // Serialize appState
//   const appStateOffset = ExportedDataState.addAppState(
//     builder, appState as any
//     // ...appState as any
//     // cleanAppStateForExport(appState)
// );

//   // Serialize files
//   const fileEntries = Object.keys(files).map(key => {
//     const keyOffset = builder.createString(key);
//     const mimeTypeOffset = builder.createString(files[key].mimeType);
//     const idOffset = builder.createString(files[key].id);
//     const dataOffset = BinaryFiles.createDataVector(builder, files[key].data);
//     const binaryFileDataOffset = BinaryFiles.createBinaryFileData(
//       builder,
//       mimeTypeOffset,
//       idOffset,
//       dataOffset,
//       files[key].created,
//       files[key].lastRetrieved || 0
//     );

//     return BinaryFilesEntry.createBinaryFilesEntry(builder, keyOffset, binaryFileDataOffset);
//   });

//   const filesOffset = BinaryFiles.createEntriesVector(builder, fileEntries);
//   const binaryFilesOffset = BinaryFiles.createBinaryFiles(builder, filesOffset);

//   // Serialize ExportedDataState
//   const typeOffset = builder.createString(EXPORT_DATA_TYPES.duc);
//   const sourceOffset = builder.createString(EXPORT_SOURCE);

//   ExportedDataState.startExportedDataState(builder);
//   ExportedDataState.addType(builder, typeOffset);
//   ExportedDataState.addVersion(builder, VERSIONS.excalidraw);
//   ExportedDataState.addSource(builder, sourceOffset);
//   ExportedDataState.addElements(builder, elementsOffset);
//   ExportedDataState.addAppState(builder, appStateOffset);
//   ExportedDataState.addFiles(builder, binaryFilesOffset);
//   const exportedDataStateOffset = ExportedDataState.endExportedDataState(builder);

//   builder.finish(exportedDataStateOffset);

//   return builder.asUint8Array();
// };

// export const saveAsFlatBuffers = async (
//   elements: readonly DucElementType[],
//   appState: AppStateType,
//   files: BinaryFilesType,
//   name: string = DEFAULT_FILENAME,
// ) => {
//   const serialized = serializeAsFlatBuffers(elements, appState, files, "local");
//   const blob = new Blob([serialized], {
//     type: "application/octet-stream",
//   });

//   const fileHandle = await fileSave(blob, {
//     name,
//     extension: "duc",
//     description: "Duc file",
//   });
//   return { fileHandle };
// };
