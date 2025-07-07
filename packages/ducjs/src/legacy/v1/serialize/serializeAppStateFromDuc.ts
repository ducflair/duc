import * as flatbuffers from 'flatbuffers';
import { DucBindableElement, NonDeleted } from 'ducjs/legacy/v1/types/elements';
import { HANDLE_TYPE } from 'ducjs/legacy/v1/utils/constants';
import { AppState as BinAppState, LinearElementEditor, PointerDownState, SegmentMidpointState, SimplePoint } from 'ducjs/legacy/v1/duc';
import { ensureFiniteNumber, getPrecisionValueField } from 'ducjs/legacy/v1/serialize/serializationUtils';
import { serializeDucPoint, serializeElementBackground, serializeElementStroke } from 'ducjs/legacy/v1/serialize/serializeElementFromDuc';
import { DucState, PrecisionValue, SuggestedPointBinding } from 'ducjs/legacy/v1/types';

const serializeAppState = (builder: flatbuffers.Builder, appState: Partial<DucState>, forRenderer: boolean): flatbuffers.Offset => {
  const nameOffset = appState.name ? builder.createString(appState.name) : undefined;

  const selectedElementIdsOffsets = appState.selectedElementIds ? Object.keys(appState.selectedElementIds).map(id => builder.createString(id)) : [];
  const selectedElementIdsVector = selectedElementIdsOffsets.length > 0 ? BinAppState.createSelectedElementIdsVector(builder, selectedElementIdsOffsets) : undefined;

  const scopeOffset = appState.scope ? builder.createString(appState.scope) : undefined;
  const mainScopeOffset = appState.mainScope ? builder.createString(appState.mainScope) : undefined;

  const currentItemStrokeOffset = appState.currentItemStroke ? serializeElementStroke(builder, appState.currentItemStroke, forRenderer) : undefined;
  const currentItemBackgroundOffset = appState.currentItemBackground ? serializeElementBackground(builder, appState.currentItemBackground) : undefined;
  const currentItemFontFamilyOffset = appState.currentItemFontFamily ? builder.createString(String(appState.currentItemFontFamily)) : undefined;
  const viewBackgroundColorOffset = appState.viewBackgroundColor ? builder.createString(appState.viewBackgroundColor) : undefined;
  const hoveredElementIdOffset = appState.elementHovered ? builder.createString(appState.elementHovered.id) : undefined;
  const suggestedBindingElementIdOffset = appState.suggestedBindings?.length ? 
    builder.createString(
      Array.isArray(appState.suggestedBindings[0]) 
        ? (appState.suggestedBindings[0] as SuggestedPointBinding)[0].id 
        : (appState.suggestedBindings[0] as NonDeleted<DucBindableElement>).id
    ) : undefined;

  const elementsPendingErasureVector = appState.elementsPendingErasure?.size ? 
    BinAppState.createElementsPendingErasureVector(
        builder, 
        Array.from(appState.elementsPendingErasure).map(id => builder.createString(id))
    ) : 
    undefined;

  let editingLinearElementOffset: flatbuffers.Offset | undefined;
  if (appState.editingLinearElement) {
    const el = appState.editingLinearElement;
    const elementIdOffset = builder.createString(el.elementId || '');
    
    const getBindingElementIdOffset = (bindingElem: string | { id?: string } | null | undefined) => {
      if (!bindingElem) return undefined;
      if (typeof bindingElem === 'string') return builder.createString(bindingElem);
      return builder.createString(bindingElem.id || '');
    };

    const startBindingElementOffset = getBindingElementIdOffset(el.startBindingElement);
    const endBindingElementOffset = getBindingElementIdOffset(el.endBindingElement);

    const selectedPointsIndices = el.selectedPointsIndices ? Array.from(el.selectedPointsIndices).map(idx => ensureFiniteNumber(idx)) : [];
    const selectedPointsIndicesVector = selectedPointsIndices.length > 0 ? 
      LinearElementEditor.createSelectedPointsIndicesVector(builder, selectedPointsIndices) : undefined;

    const pointerOffsetOffset = el.pointerOffset ? 
      SimplePoint.createSimplePoint(builder, ensureFiniteNumber(el.pointerOffset.x), ensureFiniteNumber(el.pointerOffset.y)) : undefined;

    const lastUncommittedPointOffset = el.lastUncommittedPoint ? serializeDucPoint(builder, el.lastUncommittedPoint, forRenderer) : undefined;
    const segmentMidPointHoveredCoordsOffset = el.segmentMidPointHoveredCoords ? serializeDucPoint(builder, el.segmentMidPointHoveredCoords, forRenderer) : undefined;

    let pointerDownStateOffset: flatbuffers.Offset | undefined;
    if (el.pointerDownState) {
      const pds = el.pointerDownState;
      const prevSelectedPointsIndices = pds.prevSelectedPointsIndices ? Array.from(pds.prevSelectedPointsIndices).map(idx => ensureFiniteNumber(idx)) : [];
      const prevSelectedPointsIndicesVector = prevSelectedPointsIndices.length > 0 ? 
        PointerDownState.createPrevSelectedPointsIndicesVector(builder, prevSelectedPointsIndices) : undefined;

      const originOffset = pds.origin ? 
        SimplePoint.createSimplePoint(builder, ensureFiniteNumber(pds.origin.x), ensureFiniteNumber(pds.origin.y)) : undefined;

      let segmentMidpointOffset: flatbuffers.Offset | undefined;
      if (pds.segmentMidpoint) {
        const sm = pds.segmentMidpoint;
        const valueOffset = sm.value ? serializeDucPoint(builder, sm.value, forRenderer) : undefined;
        SegmentMidpointState.startSegmentMidpointState(builder);
        if (valueOffset) SegmentMidpointState.addValue(builder, valueOffset);
        SegmentMidpointState.addIndex(builder, sm.index || 0);
        SegmentMidpointState.addAdded(builder, sm.added || false);
        segmentMidpointOffset = SegmentMidpointState.endSegmentMidpointState(builder);
      }
      

      PointerDownState.startPointerDownState(builder);
      prevSelectedPointsIndicesVector && PointerDownState.addPrevSelectedPointsIndices(builder, prevSelectedPointsIndicesVector);
      PointerDownState.addLastClickedPoint(builder, ensureFiniteNumber(pds.lastClickedPoint));
      PointerDownState.addLastClickedIsEndPoint(builder, pds.lastClickedIsEndPoint || false);
      originOffset && PointerDownState.addOrigin(builder, originOffset);
      segmentMidpointOffset && PointerDownState.addSegmentMidpoint(builder, segmentMidpointOffset);
      
      const handleType = pds.handleType;
      if (handleType !== undefined && handleType !== null) {
        let handleTypeValue: number | undefined = undefined;
        if (handleType === 'handleIn') handleTypeValue = HANDLE_TYPE.HANDLE_IN;
        else if (handleType === 'handleOut') handleTypeValue = HANDLE_TYPE.HANDLE_OUT;
        
        if (handleTypeValue !== undefined) {
          PointerDownState.addHandleType(builder, handleTypeValue);
        }
      }
      pointerDownStateOffset = PointerDownState.endPointerDownState(builder);
    }

    LinearElementEditor.startLinearElementEditor(builder);
    LinearElementEditor.addElementId(builder, elementIdOffset);
    selectedPointsIndicesVector && LinearElementEditor.addSelectedPointsIndices(builder, selectedPointsIndicesVector);
    pointerDownStateOffset && LinearElementEditor.addPointerDownState(builder, pointerDownStateOffset);
    LinearElementEditor.addIsDragging(builder, el.isDragging || false);
    lastUncommittedPointOffset && LinearElementEditor.addLastUncommittedPoint(builder, lastUncommittedPointOffset);
    pointerOffsetOffset && LinearElementEditor.addPointerOffset(builder, pointerOffsetOffset);
    startBindingElementOffset && LinearElementEditor.addStartBindingElement(builder, startBindingElementOffset);
    endBindingElementOffset && LinearElementEditor.addEndBindingElement(builder, endBindingElementOffset);
    LinearElementEditor.addHoverPointIndex(builder, ensureFiniteNumber(el.hoverPointIndex));
    segmentMidPointHoveredCoordsOffset && LinearElementEditor.addSegmentMidPointHoveredCoords(builder, segmentMidPointHoveredCoordsOffset);
    editingLinearElementOffset = LinearElementEditor.endLinearElementEditor(builder);
  }

  BinAppState.startAppState(builder);

  nameOffset && BinAppState.addName(builder, nameOffset);
  selectedElementIdsVector && BinAppState.addSelectedElementIds(builder, selectedElementIdsVector);
  elementsPendingErasureVector && BinAppState.addElementsPendingErasure(builder, elementsPendingErasureVector);
  scopeOffset && BinAppState.addScope(builder, scopeOffset);
  mainScopeOffset && BinAppState.addMainScope(builder, mainScopeOffset);
  currentItemStrokeOffset && BinAppState.addCurrentItemStroke(builder, currentItemStrokeOffset);
  currentItemBackgroundOffset && BinAppState.addCurrentItemBackground(builder, currentItemBackgroundOffset);
  currentItemFontFamilyOffset && BinAppState.addCurrentItemFontFamilyV2(builder, currentItemFontFamilyOffset);
  viewBackgroundColorOffset && BinAppState.addViewBackgroundColor(builder, viewBackgroundColorOffset);
  editingLinearElementOffset && BinAppState.addEditingLinearElement(builder, editingLinearElementOffset);
  hoveredElementIdOffset && BinAppState.addHoveredElementId(builder, hoveredElementIdOffset);
  elementsPendingErasureVector && BinAppState.addElementsPendingErasure(builder, elementsPendingErasureVector);
  suggestedBindingElementIdOffset && BinAppState.addSuggestedBindingElementId(builder, suggestedBindingElementIdOffset);
  
  if (appState.zoom) {
    const zoomValueToSerialize = forRenderer ? appState.zoom.scoped : appState.zoom.value;
    BinAppState.addZoom(builder, ensureFiniteNumber(zoomValueToSerialize as unknown as number));
  }
  
  appState.zoomStep !== undefined && BinAppState.addZoomStep(builder, appState.zoomStep);
  appState.gridSize !== undefined && BinAppState.addGridSize(builder, appState.gridSize);
  appState.gridStep !== undefined && BinAppState.addGridStep(builder, appState.gridStep);
  appState.isBindingEnabled !== undefined && BinAppState.addIsBindingEnabled(builder, appState.isBindingEnabled);
  
  if (appState.scrollX) {
    BinAppState.addScrollX(builder, getPrecisionValueField(appState.scrollX as PrecisionValue, forRenderer));
  }
  if (appState.scrollY) {
    BinAppState.addScrollY(builder, getPrecisionValueField(appState.scrollY as PrecisionValue, forRenderer));
  }
  
  appState.scrolledOutside !== undefined && BinAppState.addScrolledOutside(builder, appState.scrolledOutside);
  appState.currentItemOpacity !== undefined && BinAppState.addCurrentItemOpacity(builder, appState.currentItemOpacity);
  appState.currentItemFontSize !== undefined && BinAppState.addCurrentItemFontSizeV3(builder, getPrecisionValueField(appState.currentItemFontSize, forRenderer));
  appState.currentItemRoundness && BinAppState.addCurrentItemRoundnessV3(builder, getPrecisionValueField(appState.currentItemRoundness, forRenderer));
  appState.currentItemTextAlign && BinAppState.addCurrentItemTextAlignV3(builder, appState.currentItemTextAlign);
  appState.scaleRatioLocked !== undefined && BinAppState.addScaleRatioLocked(builder, appState.scaleRatioLocked);
  appState.displayAllPointDistances !== undefined && BinAppState.addDisplayAllPointDistances(builder, appState.displayAllPointDistances);
  appState.displayDistanceOnDrawing !== undefined && BinAppState.addDisplayDistanceOnDrawing(builder, appState.displayDistanceOnDrawing);
  appState.displayAllPointCoordinates !== undefined && BinAppState.addDisplayAllPointCoordinates(builder, appState.displayAllPointCoordinates);
  appState.coordDecimalPlaces !== undefined && BinAppState.addCoordDecimalPlacesV3(builder, appState.coordDecimalPlaces);
  appState.scopeExponentThreshold !== undefined && BinAppState.addScopeExponentThreshold(builder, appState.scopeExponentThreshold);
  appState.displayAllPointInfoSelected !== undefined && BinAppState.addDisplayAllPointInfoSelected(builder, appState.displayAllPointInfoSelected);
  appState.displayRootAxis !== undefined && BinAppState.addDisplayRootAxis(builder, appState.displayRootAxis);
  appState.lineBendingMode && BinAppState.addLineBendingMode(builder, appState.lineBendingMode);
  appState.standard && BinAppState.addStandard(builder, appState.standard);
  appState.currentItemStartLineHead && BinAppState.addCurrentItemStartLineHead(builder, appState.currentItemStartLineHead);
  appState.currentItemEndLineHead && BinAppState.addCurrentItemEndLineHead(builder, appState.currentItemEndLineHead);
  
  appState.antiAliasing !== undefined && BinAppState.addAntiAliasing(builder, appState.antiAliasing);
  appState.vSync !== undefined && BinAppState.addVSync(builder, appState.vSync);
  appState.debugRendering !== undefined && BinAppState.addDebugRendering(builder, appState.debugRendering);

  return BinAppState.endAppState(builder);
};

export { serializeAppState };
