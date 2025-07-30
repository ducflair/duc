import {
  BEZIER_MIRRORING as BezierMirroring, DucArrowElement as BinDucArrowElement,
  DucBlockInstanceElement as BinDucBlockInstanceElement,
  DucDimensionElement as BinDucDimensionElement,
  DucDocElement as BinDucDocElement,
  DucEllipseElement as BinDucEllipseElement,
  DucEmbeddableElement as BinDucEmbeddableElement,
  DucFeatureControlFrameElement as BinDucFeatureControlFrameElement,
  DucFrameElement as BinDucFrameElement,
  DucFreeDrawElement as BinDucFreeDrawElement,
  DucImageElement as BinDucImageElement,
  DucLeaderElement as BinDucLeaderElement, DucLine as BinDucLine, DucLinearElement as BinDucLinearElement, DucLineReference as BinDucLineReference, DucMermaidElement as BinDucMermaidElement,
  DucParametricElement as BinDucParametricElement, DucPath as BinDucPath, DucPdfElement as BinDucPdfElement,
  DucPlotElement as BinDucPlotElement,
  DucPolygonElement as BinDucPolygonElement,
  DucRectangleElement as BinDucRectangleElement, _DucStackBase as BinDucStackBase, DucTableCellStyle as BinDucTableCellStyle, DucTableElement as BinDucTableElement, DucTextElement as BinDucTextElement,
  DucViewportElement as BinDucViewportElement,
  DucXRayElement as BinDucXRayElement,
  _DucElementBase as BinElementBase, ElementContentBase as BinElementContentBase,
  _DucElementStylesBase as BinElementStylesBase,
  ElementStroke as BinElementStroke, ElementWrapper as BinElementWrapper, ImageCrop as BinImageCrop, DucPointBinding as BinPointBinding, PointBindingPoint as BinPointBindingPoint,
  StrokeSides as BinStrokeSides,
  TilingProperties as BinTilingProperties, BLENDING as Blending, LINE_SPACING_TYPE, LINE_HEAD as LineHead,
  STROKE_CAP as StrokeCap,
  STROKE_JOIN as StrokeJoin,
  STROKE_PLACEMENT as StrokePlacement,
  STROKE_PREFERENCE as StrokePreference,
  DucTextDynamicSource as BinDucTextDynamicSource,
  STROKE_SIDE_PREFERENCE as StrokeSidePreference, TABLE_CELL_ALIGNMENT,
  TABLE_FLOW_DIRECTION, TEXT_FIELD_SOURCE_TYPE, TEXT_ALIGN as TextAlign,
  VERTICAL_ALIGN as VerticalAlign,
  DucTextDynamicSourceData as BinDucTextDynamicSourceData,
  LeaderContent as BinLeaderContent,
  LeaderContentData,
  LeaderTextBlockContent,
  LeaderBlockContent,
  LEADER_CONTENT_TYPE,
  StringValueEntry,
  DucTextDynamicElementSource,
  DucTextDynamicDictionarySource
} from "ducjs/duc";
import { _DucElementStylesBase, _DucStackBase } from "ducjs/types/elements";

import { Element as BinElement, unionToElement as unionToBinElement } from 'ducjs/duc/element';
import { getPrecisionValueFromRaw, NEUTRAL_SCOPE, SupportedMeasures } from 'ducjs/technical/scopes';
import { NormalizedZoomValue, PrecisionValue, RawValue, Scope, Zoom } from 'ducjs/types';
import {
  _DucElementBase,
  BoundElement,
  DucArrowElement,
  DucBlockInstanceElement,
  DucDimensionElement,
  DucDocElement,
  DucEllipseElement,
  DucEmbeddableElement,
  DucFeatureControlFrameElement,
  DucFrameElement,
  DucFreeDrawElement,
  DucImageElement,
  DucLeaderElement,
  DucLine,
  DucLinearElement,
  DucLineReference,
  DucMermaidElement,
  DucParametricElement,
  DucPath,
  DucPdfElement,
  DucPlotElement,
  DucPoint,
  DucPointBinding,
  DucPolygonElement,
  DucRectangleElement,
  DucTableCell,
  DucTableCellStyle,
  DucTableColumn,
  DucTableElement,
  DucTextDynamicPart,
  DucTextDynamicSource,
  DucTextElement,
  DucViewportElement,
  DucXRayElement,
  ElementBackground,
  ElementContentBase,
  ElementStroke,
  FillStyle,
  FontFamilyValues,
  FractionalIndex,
  ImageCrop,
  StrokeSides,
  TextFieldSourceProperty,
  TilingProperties,
  ViewportScale
} from 'ducjs/types/elements';
import { parseElementBackgroundFromBinary, parseElementStrokeFromBinary, parseElementStyleFromBinary } from './parseElementStyleFromBinary';

import { StandardUnits } from 'ducjs/technical/standards';
import { Percentage, Radian, ScaleFactor } from 'ducjs/types/geometryTypes';
import { DEFAULT_ELEMENT_PROPS, FREEDRAW_EASINGS } from 'ducjs/utils/constants';

// Helper function to get the base element for different element types
function getElementBase(e: any) {
  if (e.base) return e.base();
  if (e.linearBase) return e.linearBase();
  return null;
}

// Helper function to get the scope from different element types
function getElementScope(e: any) {
  const base = getElementBase(e);
  return base?.scope?.();
}

// Helper function to get the element type as a string
const getElementTypeToString = (type: BinElement) => {
  switch (type) {
    case BinElement.DucRectangleElement: return "rectangle";
    case BinElement.DucPolygonElement: return "polygon";
    case BinElement.DucEllipseElement: return "ellipse";
    case BinElement.DucEmbeddableElement: return "embeddable";
    case BinElement.DucPdfElement: return "pdf";
    case BinElement.DucMermaidElement: return "mermaid";
    case BinElement.DucTableElement: return "table";
    case BinElement.DucImageElement: return "image";
    case BinElement.DucTextElement: return "text";
    case BinElement.DucLinearElement: return "line";
    case BinElement.DucArrowElement: return "arrow";
    case BinElement.DucFreeDrawElement: return "freedraw";
    case BinElement.DucBlockInstanceElement: return "blockinstance";
    case BinElement.DucFrameElement: return "frame";
    case BinElement.DucPlotElement: return "plot";
    case BinElement.DucViewportElement: return "viewport";
    case BinElement.DucXRayElement: return "xray";
    case BinElement.DucLeaderElement: return "leader";
    case BinElement.DucDimensionElement: return "dimension";
    case BinElement.DucFeatureControlFrameElement: return "featurecontrolframe";
    case BinElement.DucDocElement: return "doc";
    case BinElement.DucParametricElement: return "parametric";
    default: return "unknown";
  }
}


/**
 * Parses a binary DucTextDynamicSource into its application-level equivalent.
 * This function safely handles the 'source' union without using `eval`.
 *
 * @param source The binary FlatBuffers object, or null.
 * @returns The parsed application-level object, or undefined if parsing fails.
 */
function parseDynamicTextSource(source: BinDucTextDynamicSource | null): DucTextDynamicSource | undefined {
  if (!source) {
    return undefined;
  }
  
  const sourceType = source.textSourceType();
  
  switch (sourceType) {
    case TEXT_FIELD_SOURCE_TYPE.ELEMENT: {
      const elementSource = source.source(new DucTextDynamicElementSource());

      if (elementSource) {
        return {
          sourceType: TEXT_FIELD_SOURCE_TYPE.ELEMENT,
          elementId: elementSource.elementId()!,
          property: elementSource.property(),
        };
      }
      break;
    }
      
    case TEXT_FIELD_SOURCE_TYPE.DICTIONARY: {
      const dictionarySource = source.source(new DucTextDynamicDictionarySource());
      
      if (dictionarySource) {
        return {
          sourceType: TEXT_FIELD_SOURCE_TYPE.DICTIONARY,
          key: dictionarySource.key()!,
        };
      }
      break;
    }
  }

  return undefined;
}

// Helper function to parse unit systems
function parseUnitSystem(unitSystem: any): any {
  if (!unitSystem) return undefined;
  
  return {
    format: unitSystem.format() ?? 0,
    system: unitSystem.system() ?? 0,
    precision: unitSystem.precision() ?? 0,
    suppressLeadingZeros: unitSystem.suppressLeadingZeros() ?? false,
    suppressTrailingZeros: unitSystem.suppressTrailingZeros() ?? false
  };
}

// Helper function to parse linear unit system
function parseLinearUnitSystem(linearUnitSystem: any): any {
  if (!linearUnitSystem) return undefined;
  
  return {
    ...parseUnitSystem(linearUnitSystem),
    decimalSeparator: linearUnitSystem.decimalSeparator() ?? 0,
    suppressZeroFeet: linearUnitSystem.suppressZeroFeet() ?? false,
    suppressZeroInches: linearUnitSystem.suppressZeroInches() ?? false
  };
}

// Helper function to parse dynamic text parts
function parseDynamicTextPart(dynamicPart: any): DucTextDynamicPart | undefined {
  if (!dynamicPart) {
    return undefined;
  }
  
  const source = parseDynamicTextSource(dynamicPart.source());
  
  let formatting: StandardUnits["primaryUnits"] | undefined;
  const formattingData = dynamicPart.formatting();
  
  if (formattingData) {
    const linearData = formattingData.linear();
    const angularData = formattingData.angular();
    
    formatting = {
      linear: linearData ? parseLinearUnitSystem(linearData) : undefined,
      angular: angularData ? parseUnitSystem(angularData) : undefined
    };
  }
  
  return {
    tag: dynamicPart.tag() || "",
    source: source!,
    formatting: formatting,
    cachedValue: dynamicPart.cachedValue() || ""
  };
}

// Helper function to get groupIds from different element types
function getElementGroupIds(e: any): string[] {
  const base = getElementBase(e);
  if (!base) return [];
  
  const groupIds: string[] = [];
  const groupIdsLength = base.groupIdsLength?.() || 0;
  for (let i = 0; i < groupIdsLength; i++) {
    groupIds.push(base.groupIds?.(i) || '');
  }
  return groupIds;
}

// Helper function to get boundElements from different element types
function getElementBoundElements(e: any): any[] {
  const base = getElementBase(e);
  if (!base) return [];
  
  const boundElements: any[] = [];
  const boundElementsLength = base.boundElementsLength?.() || 0;
  for (let i = 0; i < boundElementsLength; i++) {
    const boundElement = base.boundElements?.(i);
    if (boundElement) {
      boundElements.push({
        id: boundElement.id?.(),
        type: boundElement.type?.(),
      });
    }
  }
  return boundElements;
}

// Helper function to parse element styles from different element types
function parseElementStyles(styles: BinElementStylesBase | null, scope: Scope): _DucElementStylesBase | null {
  if (!styles) return null;
  return parseElementStyleFromBinary(styles, scope);
}


// Your main parsing function, now corrected.
function parseLeaderContent(binLeaderContent: BinLeaderContent, scope: Scope): any {
  if (!binLeaderContent) return undefined;
  
  const contentType = binLeaderContent.leaderContentType();

  if (contentType === LEADER_CONTENT_TYPE.TEXT) {
    const textContent = binLeaderContent.content(new LeaderTextBlockContent());
    if (!textContent) return undefined;

    return {
      type: "text",
      text: textContent.text(),
    };
  } else if (contentType === LEADER_CONTENT_TYPE.BLOCK) {
    const blockContent = binLeaderContent.content(new LeaderBlockContent());
    if (!blockContent) return undefined;
    return {
      type: "block",
      blockId: blockContent.blockId(),
      instanceData: {
        attributeValues: parseStringValueEntryVector(blockContent, 'attributeValues'),
        elementOverrides: parseStringValueEntryVector(blockContent, 'elementOverrides'),
      },
    };
  }
  
  return undefined;
}


/**
 * Parses a FlatBuffers vector of `StringValueEntry` tables into a standard
 * JavaScript key-value record. This is a generic helper that can be used for
 * both 'attributeValues' and 'elementOverrides'.
 *
 * @param blockContent The FlatBuffers LeaderBlockContent object containing the vector.
 * @param vectorName The name of the vector to parse: 'attributeValues' or 'elementOverrides'.
 * @returns A JavaScript object representing the key-value data.
 */
function parseStringValueEntryVector(
  blockContent: LeaderBlockContent,
  vectorName: 'attributeValues' | 'elementOverrides'
): Record<string, string> {
  const result: Record<string, string> = {};

  // 1. Get the method name to find the vector's length (e.g., 'attributeValuesLength').
  const lengthMethod = `${vectorName}Length` as const;
  
  // 2. Get the length of the vector.
  const length = blockContent[lengthMethod]();
  if (length === 0) {
    return result; // Return an empty object if there are no entries.
  }

  // 3. For performance, create a single StringValueEntry object to be reused in the loop.
  //    This prevents allocating a new object for every item in the vector.
  const entry = new StringValueEntry();

  // 4. Iterate from 0 to length-1.
  for (let i = 0; i < length; i++) {
    // 5. Access the item at the current index, populating our reusable 'entry' object.
    //    The accessor method is just the vectorName itself (e.g., blockContent.attributeValues(i, entry)).
    const valueEntry = blockContent[vectorName](i, entry);

    if (valueEntry) {
      // 6. Get the key and value from the populated 'valueEntry' object and add them to our result.
      //    We provide default empty strings for safety in case key/value are null.
      result[valueEntry.key() || ''] = valueEntry.value() || '';
    }
  }

  return result;
}

// Helper function to parse dimension definition points
function parseDimensionDefinitionPoints(definitionPoints: any, scope: Scope): any {
  if (!definitionPoints) return {};
  
  const result: any = {};
  
  // Parse origin point
  if (definitionPoints.origin?.()) {
    result.origin = parsePoint(definitionPoints.origin(), scope);
  }
  
  // Parse origin1 point
  if (definitionPoints.origin1?.()) {
    result.origin1 = parsePoint(definitionPoints.origin1(), scope);
  }
  
  // Parse origin2 point
  if (definitionPoints.origin2?.()) {
    result.origin2 = parsePoint(definitionPoints.origin2(), scope);
  }
  
  // Parse location point
  if (definitionPoints.location?.()) {
    result.location = parsePoint(definitionPoints.location(), scope);
  }
  
  // Parse center point
  if (definitionPoints.center?.()) {
    result.center = parsePoint(definitionPoints.center(), scope);
  }
  
  // Parse jog point
  if (definitionPoints.jog?.()) {
    result.jog = parsePoint(definitionPoints.jog(), scope);
  }
  
  return result;
}

// Helper function to parse associative references
function parseAssociativeReferences(associativeReferences: any, scope: Scope): any {
  if (!associativeReferences) return undefined;
  
  const result: Record<string, any> = {};
  const keysLength = associativeReferences.keysLength?.() || 0;
  
  for (let i = 0; i < keysLength; i++) {
    const key = associativeReferences.keys?.(i);
    const reference = associativeReferences.values?.(i);
    if (key && reference) {
      result[key] = {
        elementId: reference.elementId?.() || "",
        subIndex: reference.subIndex?.() ?? null,
      };
    }
  }
  
  return result;
}

// Helper function to parse feature control frame rows
function parseFeatureControlFrameRows(rows: any, scope: Scope): any {
  if (!rows) return [];
  
  const result: any[] = [];
  const rowsLength = rows.rowsLength?.() || 0;
  
  for (let i = 0; i < rowsLength; i++) {
    const row = rows.rows?.(i);
    if (row) {
      const segments: any[] = [];
      const segmentsLength = row.segmentsLength?.() || 0;
      
      for (let j = 0; j < segmentsLength; j++) {
        const segment = row.segments?.(j);
        if (segment) {
          segments.push({
            symbol: segment.symbol?.(),
            tolerance: segment.tolerance?.(),
            materialCondition: segment.materialCondition?.(),
            primaryDatum: segment.primaryDatum?.(),
            secondaryDatum: segment.secondaryDatum?.(),
            tertiaryDatum: segment.tertiaryDatum?.(),
            datumModifiers: segment.datumModifiers?.() ? parseDatumModifiers(segment.datumModifiers()) : undefined,
          });
        }
      }
      
      result.push(segments);
    }
  }
  
  return result;
}

// Helper function to parse datum modifiers
function parseDatumModifiers(datumModifiers: any): any {
  if (!datumModifiers) return undefined;
  
  return {
    maxMaterialCondition: datumModifiers.maxMaterialCondition?.() ?? false,
    leastMaterialCondition: datumModifiers.leastMaterialCondition?.() ?? false,
    regardlessOfFeatureSize: datumModifiers.regardlessOfFeatureSize?.() ?? false,
    projected: datumModifiers.projected?.() ?? false,
    tangentPlane: datumModifiers.tangentPlane?.() ?? false,
  };
}

// Helper function to parse frame modifiers
function parseFrameModifiers(frameModifiers: any): any {
  if (!frameModifiers) return undefined;
  
  return {
    allAround: frameModifiers.allAround?.() ?? false,
    allOver: frameModifiers.allOver?.() ?? false,
    continuousFeature: frameModifiers.continuousFeature?.() ?? false,
    between: frameModifiers.between?.() ?? false,
  };
}

// Helper function to parse parametric parameters
function parseParametricParameters(parameters: any, scope: Scope): any {
  if (!parameters) return undefined;
  
  const result: Record<string, any> = {};
  const keysLength = parameters.keysLength?.() || 0;
  
  for (let i = 0; i < keysLength; i++) {
    const key = parameters.keys?.(i);
    const parameter = parameters.values?.(i);
    if (key && parameter) {
      result[key] = {
        name: parameter.name?.() || "",
        value: parameter.value?.() ?? 0,
        unit: parameter.unit?.() ?? "",
        description: parameter.description?.() ?? "",
        isLocked: parameter.isLocked?.() ?? false,
      };
    }
  }
  
  return result;
}

// Helper function to parse parametric dependencies
function parseParametricDependencies(dependencies: any): any {
  if (!dependencies) return undefined;
  
  const result: string[] = [];
  const length = dependencies.dependenciesLength?.() || 0;
  
  for (let i = 0; i < length; i++) {
    const dependency = dependencies.dependencies?.(i);
    if (dependency) {
      result.push(dependency);
    }
  }
  
  return result;
}

// Helper function to parse datum definition
function parseDatumDefinition(datumDefinition: any): any {
  if (!datumDefinition) return undefined;
  
  return {
    letter: datumDefinition.letter?.() || "",
    associatedFeatureId: datumDefinition.associatedFeatureId?.() || "",
    isTheoretical: datumDefinition.isTheoretical?.() ?? false,
  };
}


export function parseElementFromBinary(
  elementWrapper: BinElementWrapper,
  v: string,
  forceNeutralScope = false
) {
  const elementType = elementWrapper.elementType();
  const e = unionToBinElement(elementType, elementWrapper.element.bind(elementWrapper));

  const elType = getElementTypeToString(elementType);
  

  const readScope = getElementScope(e) as Scope | null;
  const elementScope = forceNeutralScope ? NEUTRAL_SCOPE : (readScope || NEUTRAL_SCOPE);

  const groupIds: string[] = getElementGroupIds(e);

  const boundElements: BoundElement[] = getElementBoundElements(e);

  // Type guard functions to narrow down the element type
  const isLinearElement = (element: typeof e): element is BinDucLinearElement => {
    return element instanceof BinDucLinearElement;
  };

  const isArrowElement = (element: typeof e): element is BinDucArrowElement => {
    return element != null && element instanceof BinDucArrowElement;
  };

  const isFreeDrawElement = (element: typeof e): element is BinDucFreeDrawElement => {
    return element != null && element instanceof BinDucFreeDrawElement;
  };

  const isImageElement = (element: typeof e): element is BinDucImageElement => {
    return element instanceof BinDucImageElement;
  };

  const isPdfElement = (element: typeof e): element is BinDucPdfElement => {
    return element instanceof BinDucPdfElement;
  };

  const isMermaidElement = (element: typeof e): element is BinDucMermaidElement => {
    return element instanceof BinDucMermaidElement;
  };

  const isTableElement = (element: typeof e): element is BinDucTableElement => {
    return element instanceof BinDucTableElement;
  };

  const isXRayElement = (element: typeof e): element is BinDucXRayElement => {
    return element instanceof BinDucXRayElement;
  };

  const isDimensionElement = (element: typeof e): element is BinDucDimensionElement => {
    return element != null && element instanceof BinDucDimensionElement;
  };

  const isFrameElement = (element: typeof e): element is BinDucFrameElement => {
    return element != null && element instanceof BinDucFrameElement;
  };

  const isPolygonElement = (element: typeof e): element is BinDucPolygonElement => {
    return element != null && element instanceof BinDucPolygonElement;
  };

  const isEllipseElement = (element: typeof e): element is BinDucEllipseElement => {
    return element != null && element instanceof BinDucEllipseElement;
  };

  const isDocElement = (element: typeof e): element is BinDucDocElement => {
    return element != null && element instanceof BinDucDocElement;
  };

  const isLeaderElement = (element: typeof e): element is BinDucLeaderElement => {
    return element != null && element instanceof BinDucLeaderElement;
  };

  const isBlockInstanceElement = (element: typeof e): element is BinDucBlockInstanceElement => {
    return element != null && element instanceof BinDucBlockInstanceElement;
  };

  const isEmbeddableElement = (element: typeof e): element is BinDucEmbeddableElement => {
    return element != null && element instanceof BinDucEmbeddableElement;
  };

  const isPlotElement = (element: typeof e): element is BinDucPlotElement => {
    return element != null && element instanceof BinDucPlotElement;
  };

  const isViewportElement = (element: typeof e): element is BinDucViewportElement => {
    return element != null && element instanceof BinDucViewportElement;
  };

  const isFeatureControlFrameElement = (element: typeof e): element is BinDucFeatureControlFrameElement => {
    return element != null && element instanceof BinDucFeatureControlFrameElement;
  };

  const isParametricElement = (element: typeof e): element is BinDucParametricElement => {
    return element != null && element instanceof BinDucParametricElement;
  };

  const isTextElement = (element: typeof e): element is BinDucTextElement => {
    return element != null && element instanceof BinDucTextElement;
  };

  const isRectangleElement = (element: typeof e): element is BinDucRectangleElement => {
    return element != null && element instanceof BinDucRectangleElement;
  }

  // Parse points for linear elements
  const points: DucPoint[] | undefined = ['line', 'arrow', 'freedraw'].includes(elType)
    ? isLinearElement(e) && e instanceof BinDucLinearElement && e.linearBase() && e.linearBase()!.pointsLength() > 0
      ? Array.from({ length: e.linearBase()!.pointsLength() })
          .map((_, j) => e.linearBase()!.points(j))
          .filter((point): point is NonNullable<typeof point> => point !== null)
          .map(point => parsePoint(point, elementScope))
          .filter((point): point is DucPoint => point !== null)
      : isFreeDrawElement(e) && e instanceof BinDucFreeDrawElement && e.pointsLength() > 0
      ? Array.from({ length: e.pointsLength() })
          .map((_, j) => e.points(j))
          .filter((point): point is NonNullable<typeof point> => point !== null)
          .map(point => parsePoint(point, elementScope))
          .filter((point): point is DucPoint => point !== null)
      : undefined
    : undefined;

  // Parse lines for linear elements
  const lines: DucLine[] | undefined = ['line', 'arrow'].includes(elType)
    ? isLinearElement(e) && e instanceof BinDucLinearElement && e.linearBase() && e.linearBase()!.linesLength() > 0
      ? Array.from({ length: e.linearBase()!.linesLength() })
          .map((_, j) => e.linearBase()!.lines(j))
          .filter((line): line is NonNullable<typeof line> => line !== null)
          .map(line => parseLine(line, elementScope))
          .filter((line): line is DucLine => line !== null)
      : undefined
    : undefined;

  // Parse path overrides for linear elements
  const pathOverrides = ['line', 'arrow'].includes(elType)
    ? isLinearElement(e) && e instanceof BinDucLinearElement && e.linearBase() && e.linearBase()!.pathOverridesLength() > 0
      ? Array.from({ length: e.linearBase()!.pathOverridesLength() })
          .map((_, j) => e.linearBase()!.pathOverrides(j))
          .filter((path): path is NonNullable<typeof path> => path !== null)
          .map((path) => {
            if (path instanceof BinDucPath) {
              return parseDucPath(path, elementScope);
            } else {
              return null;
            }
          })
          .filter((path): path is DucPath => path !== null)
      : undefined
    : undefined;

  // Parse pressures for freedraw elements
  const pressures = elType === 'freedraw'
    ? isFreeDrawElement(e) && e instanceof BinDucFreeDrawElement && e.pressuresLength() > 0
      ? Array.from({ length: e.pressuresLength() })
        .map((_, j) => e.pressures(j))
        .filter((pressure): pressure is number => pressure !== null && pressure !== undefined)
      : []
    : undefined;

  // For elements that have a base() method, we can use it to access base properties
  // For linear elements, we need to call linearBase().base()
  // For text elements, we need to call base()
  // For other elements, we'll need to check what method they have
  
  // Get the base element properties based on the element type
  let baseProps: BinElementBase | null = null;

  if (isLinearElement(e) && e) {
    const linearElement = e as BinDucLinearElement;
    const linearBase = linearElement.linearBase();
    baseProps = linearBase ? linearBase.base() : null;
  } else if (isTextElement(e) && e) {
    const textElement = e as BinDucTextElement;
    baseProps = textElement.base();
  } else if (isFreeDrawElement(e) && e) {
    const freeDrawElement = e as BinDucFreeDrawElement;
    baseProps = freeDrawElement.base();
  } else if (isImageElement(e) && e) {
    const imageElement = e as BinDucImageElement;
    baseProps = imageElement.base();
  } else if (isFrameElement(e) && e) {
    const frameElement = e as BinDucFrameElement;
    baseProps = frameElement.stackElementBase()?.base() || null;
  } else if (isPolygonElement(e) && e) {
    const polygonElement = e as BinDucPolygonElement;
    baseProps = polygonElement.base();
  } else if (isEllipseElement(e) && e) {
    const ellipseElement = e as BinDucEllipseElement;
    baseProps = ellipseElement.base();
  } else if (isDocElement(e) && e) {
    const docElement = e as BinDucDocElement;
    baseProps = docElement.base();
  } else if (e instanceof BinDucBlockInstanceElement && e) {
    baseProps = e.base();
  } else if (isMermaidElement(e) && e) {
    const mermaidElement = e as BinDucMermaidElement;
    baseProps = mermaidElement.base();
  } else if (isPdfElement(e) && e) {
    const pdfElement = e as BinDucPdfElement;
    baseProps = pdfElement.base();
  } else if (isTableElement(e) && e) {
    const tableElement = e as BinDucTableElement;
    baseProps = tableElement.base();
  } else if (isXRayElement(e) && e) {
    const xrayElement = e as BinDucXRayElement;
    baseProps = xrayElement.base();
  } else if (isLeaderElement(e) && e) {
    const leaderElement = e as BinDucLeaderElement;
    const linearBase = leaderElement.linearBase();
    baseProps = linearBase ? linearBase.base() : null;
  } else if (isDimensionElement(e) && e) {
    const dimensionElement = e as BinDucDimensionElement;
    baseProps = dimensionElement.base();
  } else if (isArrowElement(e) && e) {
    const arrowElement = e as BinDucArrowElement;
    const linearBase = arrowElement.linearBase();
    baseProps = linearBase ? linearBase.base() : null;
  } else if (isEmbeddableElement(e) && e) {
    const embeddableElement = e as BinDucEmbeddableElement;
    baseProps = embeddableElement.base();
  } else if (isRectangleElement(e) && e) {
    const rectangleElement = e as BinDucRectangleElement;
    baseProps = rectangleElement.base();
  } else if (isPlotElement(e) && e) {
    const plotElement = e as BinDucPlotElement;
    baseProps = plotElement.stackElementBase()?.base() || null;
  } else if (isParametricElement(e) && e) {
    const parametricElement = e as BinDucParametricElement;
    baseProps = parametricElement.base();
  } else if (isFeatureControlFrameElement(e) && e) {
    const featureControlFrameElement = e as BinDucFeatureControlFrameElement;
    baseProps = featureControlFrameElement.base();
  } else if (isViewportElement(e) && e) {
    const viewportElement = e as BinDucViewportElement;
    // Viewport elements have both linearBase and stackBase, we'll use linearBase
    const linearBase = viewportElement.linearBase();
    baseProps = linearBase ? linearBase.base() : null;
  } else if (e) {
    // For other elements, try to access base properties directly
    // This is a fallback for elements that don't have specific base accessors
    baseProps = e;
  }
  
  // Parse element styles using the dedicated parsing function
  const elementStyles = parseElementStyles(baseProps?.styles() ?? null, elementScope);

  const baseElement: _DucElementBase = {
    ...elementStyles!,
    id: baseProps?.id()!,
    x: getPrecisionValueFromRaw(baseProps?.x() as RawValue, elementScope, elementScope),
    y: getPrecisionValueFromRaw(baseProps?.y() as RawValue, elementScope, elementScope),
    isVisible: baseProps?.isVisible()!,
    width: getPrecisionValueFromRaw(baseProps?.width() as RawValue, elementScope, elementScope),
    height: getPrecisionValueFromRaw(baseProps?.height() as RawValue, elementScope, elementScope),
    angle: baseProps?.angle() as Radian,
    seed: baseProps?.seed()!,
    version: baseProps?.version()!,
    versionNonce: baseProps?.versionNonce()!,
    isPlot: baseProps?.isPlot()!,
    isAnnotative: baseProps?.isAnnotative()!,
    isDeleted: baseProps?.isDeleted()!,
    groupIds: groupIds,
    regionIds: (() => {
    const regionIds: string[] = [];
    const regionIdsLength = baseProps?.regionIdsLength?.() || 0;
    for (let i = 0; i < regionIdsLength; i++) {
      const regionId = baseProps?.regionIds?.(i);
      if (regionId) regionIds.push(regionId);
    }
    return regionIds;
  })(),
    layerId: baseProps?.layerId()!,
    frameId: baseProps?.frameId()!,
    link: baseProps?.link()!,
    locked: baseProps?.locked()!,
    boundElements: boundElements,
    zIndex: baseProps?.zIndex()!,
    updated: Number(baseProps?.updated()),
    index: baseProps?.index() as FractionalIndex,
    description: baseProps?.description() ?? null,
    scope: elementScope,
    label: baseProps?.label()!,
  };

  switch (elType) {
    case "text":
      if (!isTextElement(e) || !e) return null;
      const textElement = e as BinDucTextElement;
      const style = textElement.style();
      const fontSizeValue = style?.fontSize();
      return {
        ...baseElement,
        type: elType,
        fontSize: fontSizeValue ? getPrecisionValueFromRaw(fontSizeValue as RawValue, elementScope, elementScope) : undefined,
        fontFamily: style?.fontFamily() ? Number(style.fontFamily()) as FontFamilyValues : undefined,
        text: textElement.text() ?? undefined,
        textAlign: style?.textAlign() as TextAlign ?? undefined,
        verticalAlign: style?.verticalAlign() as VerticalAlign ?? undefined,
        containerId: textElement.containerId() ?? undefined,
        originalText: textElement.originalText() ?? undefined,
        lineHeight: style?.lineHeight() ?? undefined,
        autoResize: textElement.autoResize() ?? undefined,
      } as DucTextElement;
    case "arrow":
      if (!isArrowElement(e) || !e) return null;
      const arrowElement = e as BinDucArrowElement;
      return {
        ...baseElement,
        type: elType,
        points,
        lines,
        pathOverrides,
        lastCommittedPoint: arrowElement.linearBase() && arrowElement.linearBase()!.lastCommittedPoint() ? parsePoint(arrowElement.linearBase()!.lastCommittedPoint(), elementScope) : null,
        startBinding: arrowElement.linearBase() ? parsePointBinding(arrowElement.linearBase()!.startBinding(), elementScope) : null,
        endBinding: arrowElement.linearBase() ? parsePointBinding(arrowElement.linearBase()!.endBinding(), elementScope) : null,
        elbowed: arrowElement.elbowed()
      } as DucArrowElement;
    case "line":
      if (!isLinearElement(e) || !e) return null;
      const lineElement = e as BinDucLinearElement;
      return {
        ...baseElement,
        type: elType,
        points: points,
        lines,
        pathOverrides,
        lastCommittedPoint: lineElement.linearBase() ? (lineElement.linearBase()!.lastCommittedPoint() ? parsePoint(lineElement.linearBase()!.lastCommittedPoint(), elementScope) : null) : null,
        startBinding: lineElement.linearBase() ? parsePointBinding(lineElement.linearBase()!.startBinding(), elementScope) : null,
        endBinding: lineElement.linearBase() ? parsePointBinding(lineElement.linearBase()!.endBinding(), elementScope) : null,
        wipeoutBelow: lineElement.wipeoutBelow() ?? undefined,
      } as DucLinearElement;
    case "freedraw":
      if (!isFreeDrawElement(e) || !e) return null;
      const freeDrawElement = e as BinDucFreeDrawElement;
      return {
        ...baseElement,
        type: elType,
        size: freeDrawElement.size() ? getPrecisionValueFromRaw(freeDrawElement.size() as RawValue, elementScope, elementScope) : undefined,
        points: points,
        pressures: pressures,
        simulatePressure: freeDrawElement.simulatePressure() ?? undefined,
        lastCommittedPoint: freeDrawElement.lastCommittedPoint() ? parsePoint(freeDrawElement.lastCommittedPoint(), elementScope) : null,
        thinning: (freeDrawElement.thinning() ?? undefined) as Percentage,
        smoothing: (freeDrawElement.smoothing() ?? undefined) as Percentage,
        streamline: (freeDrawElement.streamline() ?? undefined) as Percentage,
        easing: freeDrawElement.easing() ? FREEDRAW_EASINGS[freeDrawElement.easing() as keyof typeof FREEDRAW_EASINGS] : undefined,
        start: freeDrawElement.start() !== null || freeDrawElement.start() !== null || freeDrawElement.start() !== null ? {
          cap: freeDrawElement.start()?.cap() ?? undefined,
          taper: (freeDrawElement.start()?.taper() ?? undefined) as Percentage,
          easing: freeDrawElement.start()?.easing() ? FREEDRAW_EASINGS[freeDrawElement.start()?.easing() as keyof typeof FREEDRAW_EASINGS] : undefined,
        } : undefined,
        end: freeDrawElement.end() !== null || freeDrawElement.end() !== null || freeDrawElement.end() !== null ? {
          cap: freeDrawElement.end()?.cap() ?? undefined,
          taper: (freeDrawElement.end()?.taper() ?? undefined) as Percentage,
          easing: freeDrawElement.end()?.easing() ? FREEDRAW_EASINGS[freeDrawElement.end()?.easing() as keyof typeof FREEDRAW_EASINGS] : undefined,
        } : undefined,
        svgPath: freeDrawElement.svgPath() ?? undefined,
      } as DucFreeDrawElement;
    case "image":
      if (!isImageElement(e) || !e) return null;
      const imageElement = e as BinDucImageElement;
      return {
        ...baseElement,
        type: elType,
        fileId: imageElement.fileId() ?? (undefined as any),
        status: imageElement.status() ?? (undefined as any),
        scale: (() => { const scaleLength = imageElement.scaleLength(); return scaleLength >= 2 ? [imageElement.scale(0)!, imageElement.scale(1)!] : (undefined as any); })(),
        crop: parseImageCrop(imageElement.crop()),
        filter: imageElement.filter() ?? (undefined as any)
      } as DucImageElement;
    case "frame":
      if (!isFrameElement(e) || !e) return null;
      const frameElement = e as BinDucFrameElement;
      return {
        ...baseElement,
        type: elType,
        isCollapsed: frameElement.stackElementBase()?.stackBase()?.isCollapsed() ?? false,
        clip: frameElement.stackElementBase()?.clip() ?? undefined,
        labelingColor: frameElement.stackElementBase()?.stackBase()?.styles()?.labelingColor() ?? undefined,
      } as DucFrameElement;
    case "rectangle":
      return {
        ...baseElement,
        type: elType,
      } as DucRectangleElement;
    case "polygon":
      if (!isPolygonElement(e) || !e) return null;
      const polygonElement = e as BinDucPolygonElement;
      return {
        ...baseElement,
        type: elType,
        sides: polygonElement.sides() ?? undefined
      } as DucPolygonElement;
    case "ellipse":
      if (!isEllipseElement(e) || !e) return null;
      const ellipseElement = e as BinDucEllipseElement;
      return {
        ...baseElement,
        type: elType,
        ratio: ellipseElement.ratio() ?? undefined,
        startAngle: ellipseElement.startAngle() ?? undefined,
        endAngle: ellipseElement.endAngle() ?? undefined,
        showAuxCrosshair: ellipseElement.showAuxCrosshair() ?? undefined,
      } as DucEllipseElement;
    case "doc":
      if (!isDocElement(e) || !e) return null;
      const docElement = e as BinDucDocElement;
      // For required properties in DucDocStyle and DucTextStyle, we need to provide values
      // but we'll use type assertions to satisfy TypeScript without adding fallback values
      // that aren't present in the binary data
      
      // Parse text style properties - these are required in DucTextStyle
      const textStyle = docElement.style()?.textStyle();
      const parsedTextStyle = {
        isLtr: textStyle?.isLtr() ?? (undefined as any),
        fontFamily: textStyle?.fontFamily() ?? (undefined as any),
        bigFontFamily: textStyle?.bigFontFamily() ?? (undefined as any),
        textAlign: textStyle?.textAlign() ?? (undefined as any),
        verticalAlign: textStyle?.verticalAlign() ?? (undefined as any),
        lineHeight: textStyle?.lineHeight() ?? (undefined as any),
        lineSpacing: (() => {
          const lineSpacing = textStyle?.lineSpacing();
          if (lineSpacing) {
            const value = lineSpacing.value();
            return value !== undefined ? {
              value: getPrecisionValueFromRaw(value as RawValue, elementScope, elementScope),
              type: lineSpacing.type() ?? (undefined as any),
            } : (undefined as any);
          }
          return (undefined as any);
        })(),
        obliqueAngle: textStyle?.obliqueAngle() ?? (undefined as any),
        fontSize: (() => {
          const fontSize = textStyle?.fontSize();
          return fontSize !== undefined ? getPrecisionValueFromRaw(fontSize as RawValue, elementScope, elementScope) : (undefined as any);
        })(),
        widthFactor: textStyle?.widthFactor() ?? (undefined as any),
        isUpsideDown: textStyle?.isUpsideDown() ?? (undefined as any),
        isBackwards: textStyle?.isBackwards() ?? (undefined as any),
      };
      
      // Parse paragraph formatting properties - these are required in DucDocStyle
      const paragraph = docElement.style()?.paragraph();
      const parsedParagraph = paragraph ? {
        firstLineIndent: (() => {
          const value = paragraph.firstLineIndent();
          return value !== undefined ? getPrecisionValueFromRaw(value as RawValue, elementScope, elementScope) : (undefined as any);
        })(),
        hangingIndent: (() => {
          const value = paragraph.hangingIndent();
          return value !== undefined ? getPrecisionValueFromRaw(value as RawValue, elementScope, elementScope) : (undefined as any);
        })(),
        leftIndent: (() => {
          const value = paragraph.leftIndent();
          return value !== undefined ? getPrecisionValueFromRaw(value as RawValue, elementScope, elementScope) : (undefined as any);
        })(),
        rightIndent: (() => {
          const value = paragraph.rightIndent();
          return value !== undefined ? getPrecisionValueFromRaw(value as RawValue, elementScope, elementScope) : (undefined as any);
        })(),
        spaceBefore: (() => {
          const value = paragraph.spaceBefore();
          return value !== undefined ? getPrecisionValueFromRaw(value as RawValue, elementScope, elementScope) : (undefined as any);
        })(),
        spaceAfter: (() => {
          const value = paragraph.spaceAfter();
          return value !== undefined ? getPrecisionValueFromRaw(value as RawValue, elementScope, elementScope) : (undefined as any);
        })(),
        tabStops: (() => {
          const length = paragraph.tabStopsLength();
          const result: (PrecisionValue | undefined)[] = [];
          for (let i = 0; i < length; i++) {
            const value = paragraph.tabStops(i);
            result.push(value !== undefined ? getPrecisionValueFromRaw(value as RawValue, elementScope, elementScope) : (undefined as any));
          }
          return result as any;
        })(),
      } : (undefined as any);
      
      // Parse stack format properties - these are required in DucDocStyle
      const stackFormat = docElement.style()?.stackFormat();
      const parsedStackFormat = stackFormat ? {
        autoStack: stackFormat.autoStack() ?? (undefined as any),
        stackChars: (() => {
          const length = stackFormat.stackCharsLength();
          const result: (string | undefined)[] = [];
          for (let i = 0; i < length; i++) {
            const char = stackFormat.stackChars(i);
            result.push(char ?? (undefined as any));
          }
          return result as any;
        })(),
        properties: {
          upperScale: stackFormat.properties()?.upperScale() as ScaleFactor,
          lowerScale: stackFormat.properties()?.lowerScale() as ScaleFactor,
          alignment: stackFormat.properties()?.alignment() ?? (undefined as any),
        },
      } : (undefined as any);
      
      return {
        ...baseElement,
        type: elType,
        text: docElement.text() ?? (undefined as any),
        dynamic: Array.from({ length: docElement.dynamicLength() }).map((_, i) => {
          const dynamicPart = docElement.dynamic(i);
          return parseDynamicTextPart(dynamicPart);
        }).filter((part): part is DucTextDynamicPart => part !== undefined),
        flowDirection: docElement.flowDirection() ?? (undefined as any),
        columns: docElement.columns() ? {
          type: docElement.columns()!.type() ?? (undefined as any),
          definitions: Array.from({ length: docElement.columns()!.definitionsLength() })
            .map((_, i) => {
              const col = docElement.columns()!.definitions(i);
              if (col) {
                const widthValue = col.width();
                const gutterValue = col.gutter();
                return {
                  width: widthValue !== undefined ? getPrecisionValueFromRaw(widthValue as RawValue, elementScope, elementScope) : (undefined as any),
                  gutter: gutterValue !== undefined ? getPrecisionValueFromRaw(gutterValue as RawValue, elementScope, elementScope) : (undefined as any)
                };
              }
              return undefined;
            }).filter((def): def is { width: PrecisionValue | undefined; gutter: PrecisionValue | undefined } => def !== undefined),
          autoHeight: docElement.columns()!.autoHeight() ?? undefined
        } : undefined,
        // Text style properties
        ...parsedTextStyle,
        // Paragraph formatting properties
        paragraph: parsedParagraph,
        // Stack format properties
        stackFormat: parsedStackFormat,
        autoResize: docElement.autoResize() ?? undefined,
      } as DucDocElement;
    case "blockinstance":
      if (!isBlockInstanceElement(e) || !e) return null;
      const blockInstanceElement = e as BinDucBlockInstanceElement;
      
      // Parse element overrides
      const blockElementOverrides: Record<string, string> = {};
      const elementOverridesLength = blockInstanceElement.elementOverridesLength();
      for (let j = 0; j < elementOverridesLength; j++) {
        const override = blockInstanceElement.elementOverrides(j);
        const key = override?.key();
        const value = override?.value();
        if (override && key !== null && key !== undefined && value !== null && value !== undefined) {
          blockElementOverrides[key] = value;
        }
      }
      
      // Parse attribute values
      const attributeValues: Record<string, string> = {};
      const attributeValuesLength = blockInstanceElement.attributeValuesLength();
      for (let j = 0; j < attributeValuesLength; j++) {
        const attr = blockInstanceElement.attributeValues(j);
        const key = attr?.key();
        const value = attr?.value();
        if (attr && key !== null && key !== undefined && value !== null && value !== undefined) {
          attributeValues[key] = value;
        }
      }
      
      // Parse duplication array
      const duplicationArrayData = blockInstanceElement.duplicationArray();
      const duplicationArray = duplicationArrayData ? {
        rows: duplicationArrayData.rows() || 0,
        cols: duplicationArrayData.cols() || 0,
        rowSpacing: duplicationArrayData.rowSpacing() !== undefined ? 
          getPrecisionValueFromRaw(duplicationArrayData.rowSpacing() as RawValue, elementScope, elementScope) : 
          getPrecisionValueFromRaw(0 as RawValue, elementScope, elementScope),
        colSpacing: duplicationArrayData.colSpacing() !== undefined ? 
          getPrecisionValueFromRaw(duplicationArrayData.colSpacing() as RawValue, elementScope, elementScope) : 
          getPrecisionValueFromRaw(0 as RawValue, elementScope, elementScope),
      } : null;
      
      return {
        ...baseElement,
        type: elType,
        blockId: blockInstanceElement.blockId() ?? (undefined as any),
        elementOverrides: Object.keys(blockElementOverrides).length > 0 ? blockElementOverrides : undefined,
        attributeValues: Object.keys(attributeValues).length > 0 ? attributeValues : undefined,
        duplicationArray,
      } as DucBlockInstanceElement;
    case "embeddable":
      return {
        ...baseElement,
        type: elType,
      } as DucEmbeddableElement;
    case "mermaid":
      if (!isMermaidElement(e) || !e) return null;
      const mermaidElement = e as BinDucMermaidElement;
      return {
        ...baseElement,
        type: elType,
        source: mermaidElement.source() ?? (undefined as any),
        theme: mermaidElement.theme() ?? undefined,
        svgPath: mermaidElement.svgPath() ?? (undefined as any),
      } as DucMermaidElement;
    case "pdf":
      if (!isPdfElement(e) || !e) return null;
      const pdfElement = e as BinDucPdfElement;
      return {
        ...baseElement,
        type: elType,
        fileId: pdfElement.fileId() ?? (undefined as any),
      } as DucPdfElement;
    case "table":
      if (!isTableElement(e) || !e) return null;
      const tableElement = e as BinDucTableElement;
      // Parse column order
      const columnOrder: string[] = [];
      for (let j = 0; j < tableElement.columnOrderLength(); j++) {
        const colId = tableElement.columnOrder(j);
        if (colId) columnOrder.push(colId);
      }
      // Parse row order
      const rowOrder: string[] = [];
      for (let j = 0; j < tableElement.rowOrderLength(); j++) {
        const rowId = tableElement.rowOrder(j);
        if (rowId) rowOrder.push(rowId);
      }
      // Parse table style
      const tableStyle = tableElement.style();
      
      // Parse columns
      const columns: Record<string, DucTableColumn> = {};
      for (let i = 0; i < tableElement.columnsLength(); i++) {
        const columnEntry = tableElement.columns(i);
        if (columnEntry) {
          const columnId = columnEntry.key();
          const column = columnEntry.value();
          if (columnId && column) {
            columns[columnId] = {
              id: columnId,
              width: getPrecisionValueFromRaw(column.width() as RawValue, elementScope, elementScope),
              styleOverrides: column.styleOverrides() ? parseTableCellStyle(column.styleOverrides(), elementScope) || undefined : undefined,
            };
          }
        }
      }
      
      // Parse rows
      const tableRows: DucTableElement["rows"] = {};
      for (let i = 0; i < tableElement.rowsLength(); i++) {
        const rowEntry = tableElement.rows(i);
        if (rowEntry) {
          const rowId = rowEntry.key();
          const row = rowEntry.value();
          if (rowId && row) {
            tableRows[rowId] = {
              id: rowId,
              height: getPrecisionValueFromRaw(row.height() as RawValue, elementScope, elementScope),
              styleOverrides: row.styleOverrides() ? parseTableCellStyle(row.styleOverrides(), elementScope) || undefined : undefined,
            };
          }
        }
      }
      
      // Parse cells
      const cells: Record<string, DucTableCell> = {};
      for (let i = 0; i < tableElement.cellsLength(); i++) {
        const cellEntry = tableElement.cells(i);
        if (cellEntry) {
          const cellKey = cellEntry.key(); // This is the composite "rowId:columnId" key
          const cell = cellEntry.value();
          if (cellKey && cell) {
            const rowId = cell.rowId();
            const columnId = cell.columnId();
            if (rowId && columnId) {
              cells[cellKey] = {
                rowId: rowId,
                columnId: columnId,
                data: cell.data() || '',
                span: cell.span() ? {
                  columns: cell.span()!.columns() || 1,
                  rows: cell.span()!.rows() || 1,
                } : undefined,
                locked: cell.locked() || false,
                styleOverrides: cell.styleOverrides() ? (parseTableCellStyle(cell.styleOverrides(), elementScope) || undefined) : undefined,
              };
            }
          }
        }
      }
      
      // Parse auto size
      const autoSize = tableElement.autoSize();
      const parsedAutoSize = autoSize ? {
        columns: autoSize.columns(),
        rows: autoSize.rows(),
      } : { columns: false, rows: false };
      
      return {
        ...baseElement,
        type: elType,
        columnOrder,
        rowOrder,
        columns,
        rows: tableRows,
        cells,
        headerRowCount: tableElement.headerRowCount(),
        autoSize: parsedAutoSize,
        ...(tableStyle ? {
          flowDirection: tableStyle.flowDirection() as TABLE_FLOW_DIRECTION,
          headerRowStyle: tableStyle.headerRowStyle() ? parseTableCellStyle(tableStyle.headerRowStyle(), elementScope) : null,
          dataRowStyle: tableStyle.dataRowStyle() ? parseTableCellStyle(tableStyle.dataRowStyle(), elementScope) : null,
          dataColumnStyle: tableStyle.dataColumnStyle() ? parseTableCellStyle(tableStyle.dataColumnStyle(), elementScope) : null,
        } : {}),
      } as DucTableElement;
    case "plot":
      if (!isPlotElement(e) || !e) return null;
      const plotElement = e as BinDucPlotElement;
      
      // Parse layout margins
      const layoutData = plotElement.layout?.();
      const layout = layoutData ? {
        margins: {
          top: layoutData.margins() && layoutData.margins()!.top() !== undefined ? 
            getPrecisionValueFromRaw(layoutData.margins()!.top() as RawValue, elementScope, elementScope) : 
            (undefined as any),
          right: layoutData.margins() && layoutData.margins()!.right() !== undefined ? 
            getPrecisionValueFromRaw(layoutData.margins()!.right() as RawValue, elementScope, elementScope) : 
            (undefined as any),
          bottom: layoutData.margins() && layoutData.margins()!.bottom() !== undefined ? 
            getPrecisionValueFromRaw(layoutData.margins()!.bottom() as RawValue, elementScope, elementScope) : 
            (undefined as any),
          left: layoutData.margins() && layoutData.margins()!.left() !== undefined ? 
            getPrecisionValueFromRaw(layoutData.margins()!.left() as RawValue, elementScope, elementScope) : 
            (undefined as any),
        }
      } : (undefined as any);
      
      return {
        ...baseElement,
        type: elType,
        layout,
      } as DucPlotElement;
    case "viewport":
      if (!isViewportElement(e) || !e) return null;
      const viewportElement = e as BinDucViewportElement;
      
      // Parse view configuration
      const viewData = viewportElement.view?.();
      const view = viewData ? {
        scrollX: viewData.scrollX() !== undefined ? 
          getPrecisionValueFromRaw(viewData.scrollX() as RawValue, elementScope, elementScope) : 
          (undefined as any),
        scrollY: viewData.scrollY() !== undefined ? 
          getPrecisionValueFromRaw(viewData.scrollY() as RawValue, elementScope, elementScope) : 
          (undefined as any),
        zoom: viewData.zoom() !== undefined && { value: viewData.zoom() as NormalizedZoomValue, } as Zoom,
        twistAngle: viewData.twistAngle() !== undefined && viewData.twistAngle() as Radian,
        centerPoint: viewData.centerPoint() ? parsePoint(viewData.centerPoint(), elementScope) : (undefined as any),
        scope: elementScope,
      } : (undefined as any);
      
      // Parse scale settings (ViewportScale is a branded number)
      const scale = viewportElement.scale() !== undefined && viewportElement.scale() as ViewportScale;
      
      // Parse shade plot setting
      const shadePlot = viewportElement.shadePlot?.();
      
      // Parse frozen group IDs
      const frozenGroupIds: string[] = [];
      const frozenGroupIdsLength = viewportElement.frozenGroupIdsLength?.() || 0;
      for (let j = 0; j < frozenGroupIdsLength; j++) {
        const groupId = viewportElement.frozenGroupIds?.(j);
        if (groupId) frozenGroupIds.push(groupId);
      }
      
      // Parse standard override
      const standardOverride = viewportElement.standardOverride?.() || null;
      
      // Parse linear base properties for viewport element
      const linearBase = viewportElement.linearBase();
      
      // Parse points for viewport element
      const viewportPoints: DucPoint[] = linearBase && linearBase.pointsLength() > 0
        ? Array.from({ length: linearBase.pointsLength() })
            .map((_, j) => linearBase.points(j))
            .filter((point): point is NonNullable<typeof point> => !!point)
            .map(point => parsePoint(point, elementScope))
            .filter((point): point is DucPoint => point !== null)
        : [];
      
      // Parse lines for viewport element
      const viewportLines: DucLine[] = linearBase && linearBase.linesLength() > 0
        ? Array.from({ length: linearBase.linesLength() })
            .map((_, j) => {
              const line = linearBase.lines(j);
              if (line) {
                return parseLine(line, elementScope);
              } else {
                return null;
              }
            })
            .filter((line): line is DucLine => line !== null)
        : [];
      
      // Parse path overrides for viewport element
      const viewportPathOverrides: DucPath[] = linearBase && linearBase.pathOverridesLength() > 0
        ? Array.from({ length: linearBase.pathOverridesLength() })
            .map((_, j) => linearBase.pathOverrides(j))
            .filter((path): path is NonNullable<typeof path> => !!path)
            .map((path) => {
              if (path instanceof BinDucPath) {
                return parseDucPath(path, elementScope);
              } else {
                return null;
              }
            })
            .filter((path): path is DucPath => path !== null)
        : [];
      
      // Parse last committed point
      const lastCommittedPoint = linearBase && linearBase.lastCommittedPoint() 
        ? parsePoint(linearBase.lastCommittedPoint(), elementScope) 
        : null;
      
      // Parse bindings
      const startBinding = linearBase 
        ? parsePointBinding(linearBase.startBinding(), elementScope) 
        : null;
      const endBinding = linearBase 
        ? parsePointBinding(linearBase.endBinding(), elementScope) 
        : null;
      
      // Parse viewport style properties
      const styleData = viewportElement.style?.();
      const scaleIndicatorVisible = styleData?.scaleIndicatorVisible() ?? true;
      
      return {
        ...baseElement,
        type: elType,
        points: viewportPoints,
        lines: viewportLines,
        pathOverrides: viewportPathOverrides,
        lastCommittedPoint,
        startBinding,
        endBinding,
        view,
        scale,
        shadePlot,
        frozenGroupIds,
        standardOverride,
        // Stack base properties (from _DucStackBase)
        isCollapsed: viewportElement.stackBase()?.isCollapsed() ?? false,
        labelingColor: viewportElement.stackBase()?.styles()?.labelingColor() ?? "#000000",
        // Viewport style properties
        scaleIndicatorVisible,
      } as DucViewportElement;
    case "xray":
      if (!isXRayElement(e) || !e) return null;
      const xrayElement = e as BinDucXRayElement;
      return {
        ...baseElement,
        type: elType,
        origin: xrayElement.origin() ? parsePoint(xrayElement.origin(), elementScope) : (undefined as any),
        direction: xrayElement.direction() ? parsePoint(xrayElement.direction(), elementScope) : (undefined as any),
        startFromOrigin: xrayElement.startFromOrigin() ?? (undefined as any),
      } as DucXRayElement;
    case "leader":
      if (!isLeaderElement(e) || !e) return null;
      const leaderElement = e as BinDucLeaderElement;
      
      // Parse leader style properties
      const leaderStyles = parseElementStyles(leaderElement.style()?.baseStyle() ?? null, elementScope);
      return {
        ...baseElement,
        ...leaderStyles!,
        type: elType,
        points,
        lines,
        pathOverrides,
        lastCommittedPoint: leaderElement.linearBase() && leaderElement.linearBase()!.lastCommittedPoint() ? parsePoint(leaderElement.linearBase()!.lastCommittedPoint(), elementScope) : null,
        startBinding: leaderElement.linearBase() && leaderElement.linearBase()!.startBinding() ? parsePointBinding(leaderElement.linearBase()!.startBinding(), elementScope) : null,
        endBinding: leaderElement.linearBase() && leaderElement.linearBase()!.endBinding() ? parsePointBinding(leaderElement.linearBase()!.endBinding(), elementScope) : null,
        leaderContent: leaderElement.content() ? parseLeaderContent(leaderElement.content(), elementScope) : undefined,
        contentAnchor: leaderElement.contentAnchor() ? parsePoint(leaderElement.contentAnchor(), elementScope) : undefined,
      } as DucLeaderElement;
    case "dimension":
      if (!isDimensionElement(e) || !e) return null;
      const dimensionElement = e as BinDucDimensionElement;
      
      // Parse dimension definition points
      const definitionPoints = parseDimensionDefinitionPoints(dimensionElement.definitionPoints?.(), elementScope);
      
      return {
        ...baseElement,
        type: elType,
        dimensionType: dimensionElement.dimensionType() ?? (undefined as any),
        definitionPoints,
        obliqueAngle: dimensionElement.obliqueAngle?.() ?? (0 as Radian),
        ordinateAxis: dimensionElement.ordinateAxis?.() ?? null,
      } as DucDimensionElement;
    case "featurecontrolframe":
      if (!isFeatureControlFrameElement(e) || !e) return null;
      const fcfElement = e as BinDucFeatureControlFrameElement;
      
      // Parse rows
      const fcfRows = parseFeatureControlFrameRows(fcfElement, elementScope);
      
      return {
        ...baseElement,
        type: elType,
        rows: fcfRows,
        leaderElementId: fcfElement.leaderElementId?.() ?? null,
        frameModifiers: fcfElement.frameModifiers?.() ? parseFrameModifiers(fcfElement.frameModifiers()) : undefined,
        datumDefinition: fcfElement.datumDefinition?.() ? parseDatumDefinition(fcfElement.datumDefinition()) : undefined,
      } as DucFeatureControlFrameElement;
    case "parametric":
      if (!isParametricElement(e) || !e) return null;
      const parametricElement = e as BinDucParametricElement;
      
      // TODO: Implement proper parametric element parsing
      return {
        ...baseElement,
        type: elType,
        source: parametricElement.source?.() as any,
      } as DucParametricElement;
    default:
      return null;
  }
};



export const parsePoint = (point: any | null, elementScope: SupportedMeasures): DucPoint | null => {
  if (!point) return null;

  // Handle different point types
  const x = typeof point.x === 'function' ? point.x() : point.x;
  const y = typeof point.y === 'function' ? point.y() : point.y;
  
  const result: DucPoint = {
    x: getPrecisionValueFromRaw(x as RawValue, elementScope, elementScope),
    y: getPrecisionValueFromRaw(y as RawValue, elementScope, elementScope),
  };
  
  // Add mirroring if available
  if (typeof point.mirroring === 'function' && point.mirroring()) {
    result.mirroring = point.mirroring() as BezierMirroring;
  }
  
  return result;
};

const parseLineReference = (lineRef: BinDucLineReference | null, elementScope: SupportedMeasures): DucLineReference | null => {
  if (!lineRef) return null;

  const handle = lineRef.handle();
  return {
    index: lineRef.index(),
    handle: handle ? {
      x: getPrecisionValueFromRaw(handle.x() as RawValue, elementScope, elementScope),
      y: getPrecisionValueFromRaw(handle.y() as RawValue, elementScope, elementScope)
    } : null
  };
};

const parseLine = (line: BinDucLine | null, elementScope: SupportedMeasures): DucLine | null => {
  if (!line) return null;

  const start = parseLineReference(line.start(), elementScope);
  const end = parseLineReference(line.end(), elementScope);

  if (!start || !end) return null;

  return [start, end];
};

const parseDucPath = (path: BinDucPath | null, elementScope: SupportedMeasures): DucPath | null => {
  if (!path) return null;

  const lineIndices = Array.from({ length: path.lineIndicesLength() })
    .map((_, i) => path.lineIndices(i))
    .filter((index): index is number => index !== null && index !== undefined);

  const background = path.background() ? parseElementBackgroundFromBinary(path.background()) : null;
  const stroke = path.stroke() ? parseElementStrokeFromBinary(path.stroke(), elementScope) : null;

  return {
    lineIndices,
    background,
    stroke
  };
};

const parseBindingPoint = (bindingPoint: BinPointBindingPoint | null): { index: number; offset: number } | null => {
  if (!bindingPoint) return null;

  return {
    index: bindingPoint.index(),
    offset: bindingPoint.offset()
  };
};

const parsePointBinding = (binding: BinPointBinding | null, elementScope: SupportedMeasures): DucPointBinding | null => {
  if (!binding) return null;

  const fixedPoint = binding.fixedPoint();
  const head = binding.head();
  return {
    elementId: binding.elementId() || '',
    focus: binding.focus(),
    gap: getPrecisionValueFromRaw(binding.gap() as RawValue, elementScope, elementScope),
    fixedPoint: fixedPoint ? {
      x: fixedPoint.x(),
      y: fixedPoint.y(),
    } : null,
    point: binding.point() ? parseBindingPoint(binding.point()) : null,
    head: head ? {
      type: head.type() as LineHead,
      blockId: head.blockId() || null,
      size: getPrecisionValueFromRaw(head.size() as RawValue, elementScope, elementScope)
    } : null
  };
};


export function parseTableCellStyle(
  cellStyle: BinDucTableCellStyle | null,
  scope: any
): DucTableCellStyle | null {
  if (!cellStyle) return null;

  const baseStyle = cellStyle.baseStyle();
  const textStyle = cellStyle.textStyle();
  const margins = cellStyle.margins();
  const alignment = cellStyle.alignment();

  const styleBase = parseElementStyleFromBinary(baseStyle, scope);

  let textStyleObj: any = undefined;
  if (textStyle) {
    textStyleObj = {
      ...styleBase,
      isLtr: textStyle.isLtr(),
      fontFamily: textStyle.fontFamily() ? Number(textStyle.fontFamily()) as FontFamilyValues : (undefined as any),
      bigFontFamily: textStyle.bigFontFamily() || '',
      lineHeight: getPrecisionValueFromRaw(textStyle.lineHeight() as RawValue, scope, scope),
      lineSpacing: {
        value: getPrecisionValueFromRaw(textStyle.lineSpacing()!.value() as RawValue, scope, scope),
        type: textStyle.lineSpacing()!.type(),
      },
      obliqueAngle: getPrecisionValueFromRaw(textStyle.obliqueAngle() as RawValue, scope, scope),
      fontSize: getPrecisionValueFromRaw(textStyle.fontSize() as RawValue, scope, scope),
      paperTextHeight: textStyle.paperTextHeight() ? getPrecisionValueFromRaw(textStyle.paperTextHeight() as RawValue, scope, scope) : undefined,
      widthFactor: getPrecisionValueFromRaw(textStyle.widthFactor() as RawValue, scope, scope),
      isUpsideDown: textStyle.isUpsideDown(),
      isBackwards: textStyle.isBackwards(),
      textAlign: textStyle.textAlign() as TextAlign,
      verticalAlign: textStyle.verticalAlign() as VerticalAlign,
    };
  }

  // Always return a valid textStyle object if textStyle is present, or if margins/alignment are present.
  return {
    ...styleBase!,
    textStyle: textStyleObj!,
    ...(margins ? {
      margins: {
        top: getPrecisionValueFromRaw(margins.top() as RawValue, scope, scope),
        right: getPrecisionValueFromRaw(margins.right() as RawValue, scope, scope),
        bottom: getPrecisionValueFromRaw(margins.bottom() as RawValue, scope, scope),
        left: getPrecisionValueFromRaw(margins.left() as RawValue, scope, scope),
      }
    } : undefined),
    ...(alignment !== null && { alignment: alignment as TABLE_CELL_ALIGNMENT }),
  } as DucTableCellStyle;
}

const parseImageCrop = (crop: BinImageCrop | null): ImageCrop | null => {
  if (!crop) return null;
  return {
    x: crop.x(),
    y: crop.y(),
    width: crop.width(),
    height: crop.height(),
    naturalWidth: crop.naturalWidth(),
    naturalHeight: crop.naturalHeight()
  };
};


/**
 * Parses a _DucStackBase from FlatBuffers binary data.
 * 
 * @param stackBase - The FlatBuffers _DucStackBase object to parse
 * @returns A partial _DucStackBase object with the parsed data
 */
export function parseDucStackBaseFromBinary(stackBase: BinDucStackBase | null): _DucStackBase | null {
  if (!stackBase) {
    return null;
  }
  
  const label = stackBase.label();
  const description = stackBase.description();
  const isCollapsed = stackBase.isCollapsed();
  const isPlot = stackBase.isPlot();
  const isVisible = stackBase.isVisible();
  const locked = stackBase.locked();
  
  // Get opacity from styles
  const styles = stackBase.styles();
  const opacity = styles ? styles.opacity() : 0.0;
  
  // Convert opacity to Percentage type (a branded number between 0 and 1)
  // If the value is between 1 and 100, assume it's a percentage that needs to be divided by 100
  const opacityValue: Percentage = 
    Math.max(0, Math.min(1, opacity > 1 && opacity <= 100 ? opacity / 100 : opacity)) as Percentage;
  
  return {
    label: label as string,
    description: description || null,
    isCollapsed,
    isPlot,
    isVisible,
    locked,
    opacity: opacityValue,
    labelingColor: styles?.labelingColor?.() as string,
  };
}
