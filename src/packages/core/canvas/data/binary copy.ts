// import flatbuffers from 'flatbuffers';
// import { DucElement, ExportedDataState, BinaryFiles, BinaryFilesEntry, AppState, DucElementUnion } from './duc';
// import { fileSave } from './filesystem';
// import { DEFAULT_FILENAME, EXPORT_DATA_TYPES, EXPORT_SOURCE, VERSIONS } from '../constants';
// import { cleanAppStateForExport } from '../appState';
// import { DucElement as DucElementType, AppState as AppStateType, BinaryFiles as BinaryFilesType } from './duc'; // Assuming your original types are here


// export const serializeAsFlatBuffers = (
//   elements: readonly DucElementType[],
//   appState: Partial<AppStateType>,
//   files: BinaryFilesType,
//   type: "local" | "database",
// ): Uint8Array => {
//   const builder = new flatbuffers.Builder(1024);

//   // Serialize elements
//   const elementOffsets = elements.map((element: any) => {
//     const idOffset = builder.createString(element.id);
//     const labelOffset = builder.createString(element.label);
//     const scopeOffset = builder.createString(element.scope);
//     const writingLayerOffset = builder.createString(element.writingLayer);
//     const backgroundColorOffset = builder.createString(element.backgroundColor);
//     const strokeColorOffset = builder.createString(element.strokeColor);
//     const frameIdOffset = builder.createString(element.frameId);
//     const linkOffset = builder.createString(element.link);
//     const customDataOffset = builder.createString(JSON.stringify(element.customData));

//     DucElement.startDucElement(builder);
//     DucElement.addId(builder, idOffset);
//     DucElement.addX(builder, element.x);
//     DucElement.addY(builder, element.y);
//     DucElement.addScope(builder, scopeOffset);
//     DucElement.addWritingLayer(builder, writingLayerOffset);
//     DucElement.addLabel(builder, labelOffset);
//     DucElement.addRatioLocked(builder, element.ratioLocked);
//     DucElement.addIsVisible(builder, element.isVisible);
//     DucElement.addFillStyle(builder, builder.createString(element.fillStyle));
//     DucElement.addRoughness(builder, element.roughness);
//     DucElement.addRoundnessType(builder, builder.createString(element.roundness.type));
//     if (element.roundness.value !== undefined) {
//       DucElement.addRoundnessValue(builder, element.roundness.value);
//     }
//     DucElement.addBackgroundColor(builder, backgroundColorOffset);
//     DucElement.addStrokeColor(builder, strokeColorOffset);
//     DucElement.addStrokeWidth(builder, element.strokeWidth);
//     DucElement.addStrokeStyle(builder, builder.createString(element.strokeStyle));
//     DucElement.addStrokePlacement(builder, builder.createString(element.strokePlacement));
//     DucElement.addOpacity(builder, element.opacity);
//     DucElement.addWidth(builder, element.width);
//     DucElement.addHeight(builder, element.height);
//     DucElement.addAngle(builder, element.angle);
//     DucElement.addSeed(builder, element.seed);
//     DucElement.addVersion(builder, element.version);
//     DucElement.addVersionNonce(builder, element.versionNonce);
//     DucElement.addIsDeleted(builder, element.isDeleted);
//     DucElement.addFrameId(builder, frameIdOffset);
//     DucElement.addUpdated(builder, element.updated);
//     DucElement.addLink(builder, linkOffset);
//     DucElement.addLocked(builder, element.locked);
//     DucElement.addCustomData(builder, customDataOffset);

//     // Add groupIds and boundElements if needed
//     // ...

//     return DucElement.endDucElement(builder);
//   });

//   const elementsOffset = ExportedDataState.createElementsVector(builder, elementOffsets);

//   // Serialize appState
//   const appStateOffset = AppState.createAppState(builder);
//   // Add fields to appState as necessary

//   // Serialize files
//   const fileEntries = Object.keys(files).map(key => {
//     const keyOffset = builder.createString(key);
//     const mimeTypeOffset = builder.createString(files[key].mimeType);
//     const idOffset = builder.createString(files[key].id);
//     const dataOffset = BinaryFilesEntry.createDataVector(builder, files[key].data);
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