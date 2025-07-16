import { AppState as BinAppState, HANDLE_TYPE } from 'ducjs/duc';
import { parseElementBinBackground, parseElementBinStroke, parsePoint } from 'ducjs/parse/parseElementFromBinary';
import { SupportedMeasures } from 'ducjs/technical/measurements';
import { getPrecisionValueFromRaw, NEUTRAL_SCOPE } from 'ducjs/technical/scopes';
import { DesignStandard } from 'ducjs/technical/standards';
import {
  LineHead,
  PointerType,
  TextAlign
} from 'ducjs/types/elements';
import { LinearElementEditor } from 'ducjs/utils/elements/linearElement';
import { AntiAliasing, DucLocalState, NormalizedZoomValue, PrecisionValue, RawValue, Zoom } from 'ducjs/types';

export const parseAppStateFromBinary = (appStateBin: BinAppState | null, v: string): Partial<DucLocalState> => {
  if (!appStateBin) return {};

  const forceNeutralScope = v <= '5';

  let readScope = appStateBin.scope() as SupportedMeasures | null;
  const scope = forceNeutralScope ? NEUTRAL_SCOPE : (readScope || NEUTRAL_SCOPE);

  let readMainScope = appStateBin.mainScope() as SupportedMeasures | null;
  const mainScope = forceNeutralScope ? NEUTRAL_SCOPE : (readMainScope || NEUTRAL_SCOPE);

  
  // Parse LinearElementEditor 
  let editingLinearElement = null;
  if (appStateBin.editingLinearElement()) {
    const editor = appStateBin.editingLinearElement()!;
    
    // Parse selected points indices
    const selectedPointsIndices = Array.from({ length: editor.selectedPointsIndicesLength() })
      .map((_, i) => editor.selectedPointsIndices(i))
      
    // Parse pointer down state
    let pointerDownState = undefined;
    if (editor.pointerDownState()) {
      const pds = editor.pointerDownState()!;
      const handleType = pds.handleType();
      pointerDownState = {
        prevSelectedPointsIndices: Array.from({ length: pds.prevSelectedPointsIndicesLength() })
          .map((_, i) => pds.prevSelectedPointsIndices(i)),
        // prevSelectedHandles: Array.from({ length: pds.prevSelectedHandlesLength() })
        //   .map((_, i) => pds.prevSelectedHandles(i)),
        prevSelectedHandles: null,
        lastClickedPoint: pds.lastClickedPoint(),
        lastClickedIsEndPoint: pds.lastClickedIsEndPoint(),
        origin: pds.origin() ? {
          x: pds.origin()!.x(),
          y: pds.origin()!.y(),
        } : undefined,
        segmentMidpoint: pds.segmentMidpoint() ? {
          value: pds.segmentMidpoint()!.value() ? 
            parsePoint(pds.segmentMidpoint()!.value()!, scope) : 
            undefined,
          index: pds.segmentMidpoint()!.index(),
          added: pds.segmentMidpoint()!.added(),
        } : undefined,
        handleType: HANDLE_TYPE.HANDLE_IN === handleType ? "handleIn" : "handleOut" as LinearElementEditor["pointerDownState"]["handleType"],
        handleInfo: null,
      };
    }
    
    // Create LinearElementEditor with all required properties
    editingLinearElement = {
      elementId: editor.elementId()! as LinearElementEditor["elementId"],
      selectedPointsIndices,
      pointerDownState,
      isDragging: editor.isDragging(),
      wasDragging: false,
      lastUncommittedPoint: editor.lastUncommittedPoint() ? 
        parsePoint(editor.lastUncommittedPoint()!, scope) : 
        undefined,
      pointerOffset: editor.pointerOffset() ? {
        x: editor.pointerOffset()!.x(),
        y: editor.pointerOffset()!.y(),
      } : { x: 0, y: 0 },
      startBindingElement: editor.startBindingElement() || undefined,
      endBindingElement: editor.endBindingElement() || undefined,
      hoverPointIndex: editor.hoverPointIndex(),
      // selectedHandles: editor.selectedHandles() ? 
      //   editor.selectedHandles()!.map(handle => ({
      //     pointIndex: handle.pointIndex(),
      //     handleType: handle.handleType() as LinearElementEditor["pointerDownState"]["handleType"],
      //   })) : 
      //   null,
      // hoveredHandle: editor.hoveredHandle() ? 
      //   {
      //     pointIndex: editor.hoveredHandle()!.pointIndex(),
      //     handleType: editor.hoveredHandle()!.handleType() as LinearElementEditor["pointerDownState"]["handleType"],
      //   } : 
      //   null,
      selectedHandles: null,
      hoveredHandle: null,
      segmentMidPointHoveredCoords: editor.segmentMidPointHoveredCoords() ? 
        parsePoint(editor.segmentMidPointHoveredCoords()!, scope) : 
        undefined,
      _dragCache: null,
      shouldStartNewChain: false,
      addingPointToExistingElement: false,
      lastClosedPathPointIndex: null,
      elementScope: scope,
      pointsCoincidentWithExisting: new Map(), // Initialize coincidence tracking
    } as LinearElementEditor;
  }
  
  return {
    name: appStateBin.name(),
    zoom: {
      value: appStateBin.zoom() as NormalizedZoomValue,
    } as unknown as Zoom, // So that we don't have to parse the stateless values, this is handled on restore.ts
    selectedElementIds: Object.fromEntries(
      Array.from({ length: appStateBin.selectedElementIdsLength() }, (_, i) => [
        appStateBin.selectedElementIds(i),
        true,
      ])
    ),
    elementsPendingErasure: new Set(
      Array.from({ length: appStateBin.elementsPendingErasureLength() }, (_, i) =>
        appStateBin.elementsPendingErasure(i)
      )
    ),
    gridSize: appStateBin.gridSize(),
    gridStep: appStateBin.gridStep(),
    scrollX: {
      value: appStateBin.scrollX(),
    } as unknown as PrecisionValue, // So that we don't have to parse the stateless values, this is handled on restore.ts
    scrollY: {
      value: appStateBin.scrollY(),
    } as unknown as PrecisionValue, // So that we don't have to parse the stateless values, this is handled on restore.ts
    scrolledOutside: appStateBin.scrolledOutside(),
    scope,
    mainScope,
    standard: (appStateBin.standard() as DesignStandard | null) ?? undefined,
    currentItemStroke: parseElementBinStroke(appStateBin.currentItemStroke(), scope),
    currentItemBackground: parseElementBinBackground(appStateBin.currentItemBackground()),
    currentItemFontFamily: Number(appStateBin.currentItemFontFamilyV2()),
    currentItemRoundness: getPrecisionValueFromRaw(appStateBin.currentItemRoundnessV3() as RawValue, scope, scope),
    currentItemFontSize: getPrecisionValueFromRaw(appStateBin.currentItemFontSizeV3() as RawValue, scope, scope),
    currentItemTextAlign: appStateBin.currentItemTextAlignV3() as TextAlign,
    currentItemStartLineHead: appStateBin.currentItemStartLineHead() as LineHead | null,
    currentItemEndLineHead: appStateBin.currentItemEndLineHead() as LineHead | null,
    viewBackgroundColor: appStateBin.viewBackgroundColor() || undefined,
    scaleRatioLocked: appStateBin.scaleRatioLocked(),
    displayAllPointDistances: appStateBin.displayAllPointDistances(),
    displayDistanceOnDrawing: appStateBin.displayDistanceOnDrawing(),
    displayAllPointCoordinates: appStateBin.displayAllPointCoordinates(),
    displayAllPointInfoSelected: appStateBin.displayAllPointInfoSelected(),
    displayRootAxis: appStateBin.displayRootAxis(),
    coordDecimalPlaces: appStateBin.coordDecimalPlacesV3(),
    scopeExponentThreshold: appStateBin.scopeExponentThreshold(),
    lineBendingMode: appStateBin.lineBendingMode(),
    antiAliasing: appStateBin.antiAliasing() as AntiAliasing,
    vSync: appStateBin.vSync(),
    debugRendering: appStateBin.debugRendering(),
    zoomStep: appStateBin.zoomStep(),
    // hoveredElementId: appStateBin.hoveredElementId() || undefined,
    // suggestedBindingElementId: appStateBin.suggestedBindingElementId() || undefined,
    isBindingEnabled: appStateBin.isBindingEnabled(),
    editingLinearElement: v <= '5' ? undefined : editingLinearElement,
  };
};
