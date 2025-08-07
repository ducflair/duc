import {
  DucDocElement,
  DucElement,
  DucEllipseElement,
  DucExternalFiles,
  DucFrameLikeElement,
  DucFreeDrawElement,
  DucGlobalState,
  DucIframeLikeElement,
  DucImageElement,
  DucLinearElement,
  DucLocalState,
  DucPolygonElement,
  DucRectangleElement,
  DucTableElement,
  DucTextElement,
  DucTextElementWithContainer,
  ElementBackground,
  ElementStroke,
  NonDeletedDucElement,
  Percentage,
  Radian,
  RawValue,
  RestoredDataState,
  SVG_NS,
  Scope,
  arrayToMap,
  convertShapeToLinearElement,
  getBoundTextElement,
  getBoundTextElementPosition,
  getContainerElement,
  getContainingFrame,
  getDefaultLocalState,
  getElementAbsoluteCoords,
  getElementsSortedByZIndex,
  getFontFamilyString,
  getFrameLikeElements,
  getFreeDrawSvgPath,
  getLineHeightInPx,
  getPrecisionValueFromRaw,
  isArrowElement,
  isEllipseElement,
  isEmbeddableElement,
  isFrameLikeElement,
  isFreeDrawElement,
  isLinearElement,
  isRTL,
  isTableElement,
  isTextElement,
  uint8ArrayToBase64
} from "ducjs";
import { TEXT_ALIGN } from "ducjs/flatbuffers/duc";
import { renderLinearElementToSvg } from "ducsvg/utils/linearElementToSvg";


export type PartialDucState = Partial<DucLocalState & DucGlobalState>;

const DUC_STANDARD_PRIMARY_COLOR = "#7878dd";
const BACKGROUND_OPACITY: Percentage = 0.1 as Percentage;
const AUX_STROKE_WIDTH_FACTOR = 0.2;
const COTA_STROKE_WIDTH_FACTOR = 0.4;

export type FrameRendering = {
  enabled: boolean;
  outline: boolean;
  name: boolean;
  clip: boolean;
};

// const applyCadStandardStyling = (
//   element: DucElement,
//   appState: Partial<AppState>,
//   currentScope: Scope,
// ): DucElement => {
//   const standard = appState.standard;
//   const subset = element.subset;

//   if (!subset || !standard) {
//     return element;
//   }

//   const shouldApply = (standard: DesignStandard, subset?: ElementSubset): boolean => {
//     if (!subset) {
//       return false;
//     }
//     return standard === DESIGN_STANDARD.DUC;
//   };

//   if (!shouldApply(standard, subset)) {
//     return element;
//   }

//   const newElement = element;

//   if (standard === DESIGN_STANDARD.DUC) {
//     if (newElement.stroke) {
//       newElement.stroke.forEach((stroke) => {
//         if (subset === ELEMENT_SUBSET.AUX) {
//           stroke.content.src = DUC_STANDARD_PRIMARY_COLOR;
//           if (stroke.width) {
//             stroke.width = getPrecisionValueFromRaw((stroke.width.value * AUX_STROKE_WIDTH_FACTOR) as RawValue, element.scope, currentScope);
//           }
//           stroke.style.join = STROKE_JOIN.round;
//           stroke.style.cap = STROKE_CAP.round;
//         } else if (subset === ELEMENT_SUBSET.COTA) {
//           stroke.content.src = DUC_STANDARD_PRIMARY_COLOR;
//           if (stroke.width) {
//             stroke.width = getPrecisionValueFromRaw((stroke.width.value * COTA_STROKE_WIDTH_FACTOR) as RawValue, element.scope, currentScope);
//           }
//           stroke.style.join = STROKE_JOIN.round;
//           stroke.style.cap = STROKE_CAP.round;
//         }
//       });
//     }

//     if (newElement.background) {
//       newElement.background.forEach((background) => {
//         if (subset === ELEMENT_SUBSET.AUX || subset === ELEMENT_SUBSET.COTA) {
//           background.content.src = DUC_STANDARD_PRIMARY_COLOR;
//           background.content.opacity = BACKGROUND_OPACITY;
//         }
//       });
//     }
//   }

//   return newElement;
// };

// Helper function to get frame rendering configuration
// const getFrameRenderingConfig = (
//   exportingFrame: DucFrameLikeElement | null,
//   frameRendering: AppState["frameRendering"] | null,
// ): AppState["frameRendering"] => {
//   frameRendering = frameRendering || getDefaultAppState().frameRendering;
//   return {
//     enabled: exportingFrame ? true : frameRendering.enabled,
//     outline: exportingFrame ? false : frameRendering.outline,
//     name: exportingFrame ? false : frameRendering.name,
//     clip: exportingFrame ? true : frameRendering.clip,
//   };
// };

// Main export function to convert DUC data to SVG string
export const ducToSvg = async (
  elements: RestoredDataState["elements"],
  localState: RestoredDataState["localState"],
  globalState: RestoredDataState["globalState"],
  files: RestoredDataState["files"],
  opts?: {
    // frameRendering?: AppState["frameRendering"];
    exportingFrame?: DucFrameLikeElement | null;
    exportWithDarkMode?: boolean;
    skipInliningFonts?: boolean;
  }
): Promise<string> => {
  const currentScope = localState.scope;
  
  // Get frame rendering configuration
  // const frameRendering = getFrameRenderingConfig(
  //   opts?.exportingFrame ?? null,
  //   opts?.frameRendering ?? appState?.frameRendering ?? null,
  // );
  const frameRendering = {
    enabled: true,
    outline: false,
    name: false,
    clip: true,
  };
  
  const ducState = { ...localState, ...globalState }
  // Filter out deleted elements
  const elementsForRender = elements.filter(el => !el.isDeleted) as readonly NonDeletedDucElement[];
  
  // Create SVG document
  const svgDocument = document.createElementNS(SVG_NS, "svg");
  
  // Get the bounds of all elements to set SVG dimensions
  const bounds = getElementsBounds(elementsForRender);
  
  // Set SVG properties
  svgDocument.setAttribute("xmlns", SVG_NS);
  svgDocument.setAttribute("width", `${bounds.width}`);
  svgDocument.setAttribute("height", `${bounds.height}`);
  svgDocument.setAttribute("viewBox", `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`);
  
  // Add metadata from appState
  addMetadata(svgDocument, ducState, elementsForRender.length);
  
  // Sort elements by z-index
  const sortedElements = getElementsSortedByZIndex(elementsForRender);
  
  // Create a map of elements for reference
  const elementsMap = arrayToMap(elementsForRender);

  // Create defs for clipping paths and markers
  const defs = document.createElementNS(SVG_NS, "defs");
  svgDocument.appendChild(defs);
  
  // Create frame clip paths
  const frameElements = getFrameLikeElements(elementsForRender);
  for (const frame of frameElements) {
    if (frameRendering.clip && frame.clip) {
      const [x1, y1, x2, y2] = getElementAbsoluteCoords(frame, elementsMap, currentScope);
      const cx = (x2 - x1) / 2 - (frame.x.scoped - x1);
      const cy = (y2 - y1) / 2 - (frame.y.scoped - y1);

      const clipPath = document.createElementNS(SVG_NS, "clipPath");
      clipPath.setAttribute("id", frame.id);
      clipPath.setAttribute("transform", 
        `translate(${frame.x.scoped} ${frame.y.scoped}) rotate(${(180 * frame.angle) / Math.PI} ${cx} ${cy})`
      );
      
      const clipRect = document.createElementNS(SVG_NS, "rect");
      clipRect.setAttribute("x", "0"); 
      clipRect.setAttribute("y", "0");
      clipRect.setAttribute("width", frame.width.scoped.toString());
      clipRect.setAttribute("height", frame.height.scoped.toString());
      
      if (frame.roundness && frame.roundness.scoped > 0) {
        clipRect.setAttribute("rx", frame.roundness.scoped.toString());
        clipRect.setAttribute("ry", frame.roundness.scoped.toString());
      }
      
      clipPath.appendChild(clipRect);
      defs.appendChild(clipPath);
    }
  }

  // TODO: in the future, we will need to inline the fonts with a proper Font manager system
  // const fontFamilies = elements.reduce((acc, element) => {
  //   if (isTextElement(element)) {
  //     acc.add(element.fontFamily);
  //   }
  //   return acc;
  // }, new Set<number>());

  // const fontFaces = opts?.skipInliningFonts
  //   ? []
  //   : await Promise.all(
  //       Array.from(fontFamilies).map(async (x) => {
  //         const fontData = Fonts.registered.get(x);
  //         if (!fontData || !Array.isArray(fontData.fonts)) {
  //           console.error(
  //             `Couldn't find registered fonts for font-family "${x}"`,
  //             Fonts.registered,
  //           );
  //           return;
  //         }

  //         if (fontData.metadata?.local) {
  //           // don't inline local fonts
  //           return;
  //         }

  //         return Promise.all(
  //           fontData.fonts.map(
  //             async (font) => `@font-face {
  //       font-family: "${font.fontFace.family}";
  //       src: url(${await font.getContent()});
  //       font-style: ${font.fontFace.style};
  //       font-weight: ${font.fontFace.weight};
  //       font-display: swap;
  //     }`,
  //           ),
  //         );
  //       }),
  //     );

  // if (fontFaces.length > 0) {
  //   const style = document.createElementNS(SVG_NS, "style");
  //   style.textContent = fontFaces.flat().filter(Boolean).join("\n");
  //   defs.appendChild(style);
  // }
  
  // Group elements by frame for proper clipping
  const elementsByFrame = new Map<string | null, NonDeletedDucElement[]>();
  
  // Group elements by their frameId
  sortedElements.forEach(element => {
    // Skip bound text elements - they'll be rendered with their containers
    if (isTextElement(element) && element.containerId && elementsMap.has(element.containerId)) {
      return;
    }
    
    const frameId = isFrameLikeElement(element) ? null : element.frameId;
    if (!elementsByFrame.has(frameId)) {
      elementsByFrame.set(frameId, []);
    }
    elementsByFrame.get(frameId)!.push(element);
  });
  
  // Render frame elements first (backgrounds)
  frameElements.forEach(frame => {
    if (frame.isDeleted || !frame.isVisible) return;
    
    const frameGroup = renderElementToSvg(
      frame, 
      elementsMap, 
      ducState, 
      files, 
      defs, 
      currentScope
    );
    
    if (frameGroup) {
      svgDocument.appendChild(frameGroup);
    }
  });
  
  // Render elements grouped by frame for proper clipping
  elementsByFrame.forEach((elements, frameId) => {
    if (frameId && frameRendering.enabled && frameRendering.clip) {
      // Create a group for the frame's children with clipping
      const frameChildrenGroup = document.createElementNS(SVG_NS, "g");
      frameChildrenGroup.setAttribute("clip-path", `url(#${frameId})`);
      
      // Render frame children
      elements
        .filter((el) => !isEmbeddableElement(el))
        .forEach(element => {
          if (element.isVisible) {
            const elementNode = renderElementToSvg(
              element, 
              elementsMap, 
              ducState, 
              files, 
              defs, 
              currentScope
            );
            
            if (elementNode) {
              frameChildrenGroup.appendChild(elementNode);
            }
            
            // Render bound text element if it exists
            const boundTextElement = getBoundTextElement(element, elementsMap);
            if (boundTextElement) {
              const boundTextGroup = renderElementToSvg(
                boundTextElement,
                elementsMap,
                ducState,
                files,
                defs,
                currentScope
              );
              if (boundTextGroup) {
                frameChildrenGroup.appendChild(boundTextGroup);
              }
            }
          }
        });
      
      svgDocument.appendChild(frameChildrenGroup);
      
      // Render iframe-like elements for this frame on top
      elements
        .filter((el) => isEmbeddableElement(el))
        .forEach(element => {
          if (element.isVisible) {
            const elementNode = renderElementToSvg(
              element, 
              elementsMap, 
              ducState, 
              files, 
              defs, 
              currentScope
            );
            
            if (elementNode) {
              frameChildrenGroup.appendChild(elementNode);
            }
          }
        });
    } else {
      // Render elements without frame clipping
      elements
        .filter((el) => !isEmbeddableElement(el))
        .forEach(element => {
          if (element.isVisible) {
            const elementNode = renderElementToSvg(
              element, 
              elementsMap, 
              ducState, 
              files, 
              defs, 
              currentScope
            );
            
            if (elementNode) {
              svgDocument.appendChild(elementNode);
            }
            
            // Render bound text element if it exists
            const boundTextElement = getBoundTextElement(element, elementsMap);
            if (boundTextElement) {
              const boundTextGroup = renderElementToSvg(
                boundTextElement,
                elementsMap,
                ducState,
                files,
                defs,
                currentScope
              );
              if (boundTextGroup) {
                svgDocument.appendChild(boundTextGroup);
              }
            }
          }
        });

      // Render iframe-like elements on top
      elements
        .filter((el) => isEmbeddableElement(el))
        .forEach(element => {
          if (element.isVisible) {
            const elementNode = renderElementToSvg(
              element, 
              elementsMap, 
              ducState, 
              files, 
              defs, 
              currentScope
            );
            
            if (elementNode) {
              svgDocument.appendChild(elementNode);
            }
          }
        });
    }
  });
  
  // Convert to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgDocument);
  
  return svgString;
};

// Helper function to get bounds of all elements
const getElementsBounds = (elements: readonly DucElement[]) => {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  const visibleElements = elements.filter(el => !el.isDeleted && el.isVisible);
  
  if (visibleElements.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  visibleElements.forEach(element => {
    // Calculate element bounds based on position, dimensions, and rotation
    const { x, y, width, height, angle } = element;
    
    // For elements with points (linear, arrow, freedraw), we need to check each point
    if (isLinearElement(element) || isArrowElement(element) || isFreeDrawElement(element)) {
      element.points.forEach(point => {
        const px = element.x.scoped + point.x.scoped;
        const py = element.y.scoped + point.y.scoped;
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      });
    } else {
      // For rectangle-based elements
      const corners = getRotatedElementCorners(
        x.scoped, 
        y.scoped, 
        width.scoped, 
        height.scoped, 
        angle
      );
      
      corners.forEach(corner => {
        minX = Math.min(minX, corner.x);
        minY = Math.min(minY, corner.y);
        maxX = Math.max(maxX, corner.x);
        maxY = Math.max(maxY, corner.y);
      });
    }
  });
  
  // Add padding
  const padding = 10;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
};

// Helper to get corners of a rotated rectangle
const getRotatedElementCorners = (
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number
) => {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  const corners = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height }
  ];
  
  if (angle === 0) {
    return corners;
  }
  
  return corners.map(corner => {
    const dx = corner.x - centerX;
    const dy = corner.y - centerY;
    
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos
    };
  });
};


// FIXME: This does not seem complete
const addMetadata = (
  svgRoot: SVGElement, 
  ducState: PartialDucState,
  elementCount: number
) => {
  const defaultState = getDefaultLocalState();
  const state = { ...defaultState, ...ducState };
  
  // Add metadata
  svgRoot.setAttribute("data-duc-elements", `${elementCount}`);
  
  if (state.viewBackgroundColor) {
    svgRoot.setAttribute("data-duc-background", state.viewBackgroundColor);
  }
  
  if (state.scope) {
    svgRoot.setAttribute("data-duc-scope", state.scope);
  }
  
  if (state.name) {
    svgRoot.setAttribute("data-duc-name", state.name);
  }
  
  // Add custom namespace for duc metadata
  svgRoot.setAttribute("xmlns:duc", "https://duc.ducflair.com/xmlns");
  
  // Create metadata section
  const metadataElement = document.createElementNS(SVG_NS, "metadata");
  metadataElement.setAttribute("id", "duc-metadata");
  
  // Add relevant app state properties as metadata
  const relevantStateProps: (keyof typeof state)[] = [
    "gridSize",
    "gridStep",
    // "gridModeEnabled",
    "viewBackgroundColor",
    "scope",
    "mainScope",
  ] as const;
  
  // Type-safe implementation for adding metadata
  relevantStateProps.forEach(prop => {
    const value = state[prop];
    if (value !== undefined) {
      const valueStr = typeof value === "object" 
        ? JSON.stringify(value) 
        : String(value);
      metadataElement.setAttribute(`duc:${prop}`, valueStr);
    }
  });
  
  svgRoot.appendChild(metadataElement);
};

const renderCrosshair = (
  element: DucEllipseElement,
  renderedElement: DucElement,
  angle: Radian, // radians
  rotCx: number,
  rotCy: number,
): SVGElement => {
  const group = document.createElementNS(SVG_NS, "g");

  const base = element;

  // Center of original ellipse in absolute coords
  const originalCenterX = base.x.scoped + base.width.scoped / 2;
  const originalCenterY = base.y.scoped + base.height.scoped / 2;

  // Top-left of the rendered element's group in absolute coords
  const renderedX = renderedElement.x.scoped;
  const renderedY = renderedElement.y.scoped;

  // The position of the original center in the un-rotated group's coordinate system
  // this would be the target position IF there were no rotation.
  const targetX = originalCenterX - renderedX;
  const targetY = originalCenterY - renderedY;

  // Since the group is rotated, we must apply the inverse rotation to our
  // target coordinates to find where to place the crosshair before rotation.
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);

  const dx = targetX - rotCx;
  const dy = targetY - rotCy;

  const cx = rotCx + (dx * cos - dy * sin);
  const cy = rotCy + (dx * sin + dy * cos);

  const crossWidth = base.width.scoped * 1.2;
  const crossHeight = base.height.scoped * 1.2;

  const x1 = cx - crossWidth / 2;
  const y1 = cy - crossHeight / 2;
  const x2 = cx + crossWidth / 2;
  const y2 = cy + crossHeight / 2;

  const main_dash_len = 26.0;
  const pattern = [main_dash_len, 6.0, 0.6, 6.0];
  const pattern_len = pattern.reduce((a, b) => a + b, 0);

  const hLine = document.createElementNS(SVG_NS, "line");
  hLine.setAttribute("x1", `${x1}`);
  hLine.setAttribute("y1", `${cy}`);
  hLine.setAttribute("x2", `${x2}`);
  hLine.setAttribute("y2", `${cy}`);
  hLine.setAttribute("stroke", DUC_STANDARD_PRIMARY_COLOR);
  hLine.setAttribute("stroke-width", "1");
  hLine.setAttribute("stroke-dasharray", pattern.join(" "));
  let offset = (main_dash_len / 2.0 - crossWidth / 2.0) % pattern_len;
  if (offset < 0) {
    offset += pattern_len;
  }
  hLine.setAttribute("stroke-dashoffset", `${offset}`);
  group.appendChild(hLine);

  const vLine = document.createElementNS(SVG_NS, "line");
  vLine.setAttribute("x1", `${cx}`);
  vLine.setAttribute("y1", `${y1}`);
  vLine.setAttribute("x2", `${cx}`);
  vLine.setAttribute("y2", `${y2}`);
  vLine.setAttribute("stroke", DUC_STANDARD_PRIMARY_COLOR);
  vLine.setAttribute("stroke-width", "1");
  vLine.setAttribute("stroke-dasharray", pattern.join(" "));
  offset = (main_dash_len / 2.0 - crossHeight / 2.0) % pattern_len;
  if (offset < 0) {
    offset += pattern_len;
  }
  vLine.setAttribute("stroke-dashoffset", `${offset}`);
  group.appendChild(vLine);

  return group;
};

// Main function to render an element to SVG (adapted from staticSvgScene.ts)
export const renderElementToSvg = (
  _element: DucElement,
  elementsMap: Map<string, DucElement>,
  ducState: PartialDucState,
  files: RestoredDataState["files"],
  defs: SVGDefsElement,
  currentScope: Scope,
): SVGElement | null => {
  let element = _element;

  if (isEllipseElement(element)) {
    const converted = convertShapeToLinearElement(currentScope, element);
    if (converted) {
      element = converted;
    }
  }

  // element = applyCadStandardStyling(element, appState, currentScope);


  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap, currentScope);
  let cx = (x2 - x1) / 2 - (element.x.scoped - x1);
  let cy = (y2 - y1) / 2 - (element.y.scoped - y1);
  
  // Handle text element positioning for bound text
  let offsetX = 0;
  let offsetY = 0;
  if (isTextElement(element)) {
    const container = getContainerElement(element, elementsMap);
    if (isArrowElement(container)) {
      const [x1, y1, x2, y2] = getElementAbsoluteCoords(container, elementsMap, currentScope);

      const boundTextCoords = getBoundTextElementPosition(
        container,
        element as DucTextElementWithContainer,
        elementsMap,
        currentScope,
      );
      if (!boundTextCoords) {
        return null;
      }
      cx = (x2 - x1) / 2 - (boundTextCoords.x - x1);
      cy = (y2 - y1) / 2 - (boundTextCoords.y - y1);
      offsetX = offsetX + boundTextCoords.x - element.x.scoped;
      offsetY = offsetY + boundTextCoords.y - element.y.scoped;
    }
  }
  const degree = (180 * element.angle) / Math.PI;

  // element to append node to, most of the time will be the main group
  let root: SVGElement;
  
  // Group to hold the element and any transformations
  const group = document.createElementNS(SVG_NS, "g");
  root = group;

  // if the element has a link, create an anchor tag and make that the new root
  if (element.link) {
    const anchorTag = document.createElementNS(SVG_NS, "a");
    anchorTag.setAttribute("href", element.link);
    group.appendChild(anchorTag);
    root = anchorTag;
  }

  const addToRoot = (node: SVGElement, element: DucElement, originalElement: DucElement) => {
    // if (isTestEnv()) {
    //   node.setAttribute("data-id", element.id);
    // }
    root.appendChild(node);
    if (isEllipseElement(originalElement) && originalElement.showAuxCrosshair) {
      const crosshair = renderCrosshair(
        originalElement,
        element,
        element.angle,
        cx,
        cy,
      );
      root.appendChild(crosshair);
    }
  };

  // Calculate opacity including frame opacity
  const opacity =
    (getContainingFrame(element, elementsMap)?.opacity ?? 1) * element.opacity;

  // Apply transformations and opacity to the group
  group.setAttribute(
    "transform",
    `translate(${element.x.scoped + offsetX} ${element.y.scoped + offsetY}) rotate(${degree} ${cx} ${cy})`
  );
  
  if (opacity !== 1) {
    group.setAttribute("opacity", opacity.toString());
  }

  // Handle element type-specific rendering with improved logic from staticSvgScene.ts
  switch (element.type) {
    case "rectangle": {
      const rect = renderRectangle(element as DucRectangleElement);
      addToRoot(rect, element, _element);
      break;
    }
    case "polygon": {
      const polygon = renderPolygon(element as DucPolygonElement);
      addToRoot(polygon, element, _element);
      break;
    }
    case "line":
    case "arrow": {
      const result = renderLinearElementToSvg(
        element as DucLinearElement,
        elementsMap,
        ducState,
        files,
        defs,
        currentScope,
        offsetX,
        offsetY,
      );
      if (result.mask) {
        defs.appendChild(result.mask);
      }
      addToRoot(result.element, element, _element);
      break;
    }
    case "freedraw": {
      const path = renderFreeDraw(element as DucFreeDrawElement);
      addToRoot(path, element, _element);
      break;
    }
    case "image": {
      const imageEl = renderImage(element as DucImageElement, files, defs);
      if (imageEl) {
        addToRoot(imageEl, element, _element);
      }
      break;
    }
    case "text": {
      const textEl = renderText(element as DucTextElement, currentScope);
      addToRoot(textEl, element, _element);
      break;
    }
    case "frame":
    case "embeddable": {
      const iframeEl = renderIframe(element);
      addToRoot(iframeEl, element, _element);
      break;
    }
    default: {
      // Handle other element types
      if (isTableElement(element)) {
        const tableEl = renderTable(element as DucTableElement);
        addToRoot(tableEl, element, _element);
      } else if (element.type === "doc") {
        const docEl = renderDoc(element as DucDocElement);
        addToRoot(docEl, element, _element);
      }
      break;
    }
  }
  
  return group;
};

// Helper to apply styles (stroke and fill)
export const applyStyles = (
  element: SVGElement, 
  strokes: readonly ElementStroke[], 
  backgrounds: readonly ElementBackground[]
) => {
  // Apply backgrounds (fills)
  if (backgrounds.length > 0) {
    const background = backgrounds[0]; // Use the first background for now
    if (background.content.visible) {
      element.setAttribute("fill", background.content.src);
      
      if (background.content.opacity < 1) {
        element.setAttribute("fill-opacity", background.content.opacity.toString());
      }
    } else {
      element.setAttribute("fill", "none");
    }
  } else {
    element.setAttribute("fill", "none");
  }
  
  // Apply strokes
  if (strokes.length > 0) {
    const stroke = strokes[0]; // Use the first stroke for now
    if (stroke.content.visible) {
      element.setAttribute("stroke", stroke.content.src);
      element.setAttribute("stroke-width", stroke.width.scoped.toString());
      
      // Apply stroke opacity
      if (stroke.content.opacity < 1) {
        element.setAttribute("stroke-opacity", stroke.content.opacity.toString());
      }
      
      // Apply stroke style (dash, cap, join)
      if (stroke.style.dash && stroke.style.dash.length > 0) {
        element.setAttribute("stroke-dasharray", stroke.style.dash.join(" "));
      }
      
      if (stroke.style.cap) {
        let capStyle = "butt";
        const capType = String(stroke.style.cap);
        if (capType === "round") {
          capStyle = "round";
        } else if (capType === "square") {
          capStyle = "square";
        }
        element.setAttribute("stroke-linecap", capStyle);
      }
      
      if (stroke.style.join) {
        let joinStyle = "miter";
        const joinType = String(stroke.style.join);
        if (joinType === "round") {
          joinStyle = "round";
        } else if (joinType === "bevel") {
          joinStyle = "bevel";
        }
        element.setAttribute("stroke-linejoin", joinStyle);
      }
      
      if (stroke.style.miterLimit) {
        element.setAttribute("stroke-miterlimit", stroke.style.miterLimit.toString());
      }
    } else {
      element.setAttribute("stroke", "none");
    }
  } else {
    element.setAttribute("stroke", "none");
  }
};

// Render rectangle
const renderRectangle = (element: DucRectangleElement): SVGElement => {
  const rect = document.createElementNS(SVG_NS, "rect");
  
  rect.setAttribute("width", element.width.scoped.toString());
  rect.setAttribute("height", element.height.scoped.toString());
  
  // Apply rounded corners if needed
  if (element.roundness && element.roundness.scoped > 0) {
    rect.setAttribute("rx", element.roundness.scoped.toString());
    rect.setAttribute("ry", element.roundness.scoped.toString());
  }
  
  // Apply styles
  applyStyles(rect, element.stroke, element.background);
  
  return rect;
};

// Render polygon
const renderPolygon = (element: DucPolygonElement): SVGElement => {
  // Create polygon element
  const polygon = document.createElementNS(SVG_NS, "polygon");
  
  // Calculate polygon points
  const sides = element.sides;
  const width = element.width.scoped;
  const height = element.height.scoped;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const points: { x: number, y: number }[] = [];
  
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = centerX + (width / 2) * Math.cos(angle);
    const y = centerY + (height / 2) * Math.sin(angle);
    points.push({ x, y });
  }
  
  // Set points attribute
  polygon.setAttribute(
    "points",
    points.map(p => `${p.x},${p.y}`).join(" ")
  );
  
  // Apply styles
  applyStyles(polygon, element.stroke, element.background);
  
  return polygon;
};

// Render text element (copied and adapted from staticSvgScene.ts)
const renderText = (element: DucTextElement, currentScope: Scope): SVGElement => {
  const node = document.createElementNS(SVG_NS, "g");
  
  const lines = element.text.replace(/\r\n?/g, "\n").split("\n");
  const lineHeightPx = getLineHeightInPx(
    element.fontSize,
    element.lineHeight,
  );
  const horizontalOffset: RawValue =
    element.textAlign === TEXT_ALIGN.CENTER
      ? (element.width.value / 2) as RawValue
      : element.textAlign === TEXT_ALIGN.RIGHT
      ? (element.width.value) as RawValue
      : 0 as RawValue;

  // const verticalOffset = getVerticalOffset(
  //   element.fontFamily,
  //   element.fontSize,
  //   lineHeightPx,
  // );
  // TODO: in the future, we will need to calculate the vertical offset for text elements with the right font metrics
  const verticalOffset = 0 as RawValue;

  const verticalOffsetScoped = getPrecisionValueFromRaw(verticalOffset, element.scope, currentScope).scoped;
  const horizontalOffsetScoped = getPrecisionValueFromRaw(horizontalOffset, element.scope, currentScope).scoped;
  const lineHeightPxScoped = getPrecisionValueFromRaw(lineHeightPx, element.scope, currentScope).scoped;

  const direction = isRTL(element.text) ? "rtl" : "ltr";
  const textAnchor =
    element.textAlign === TEXT_ALIGN.CENTER
      ? "middle"
      : element.textAlign === TEXT_ALIGN.RIGHT || direction === "rtl"
      ? "end"
      : "start";
  for (let i = 0; i < lines.length; i++) {
    const text = document.createElementNS(SVG_NS, "text");
    text.textContent = lines[i];
    text.setAttribute("x", `${horizontalOffsetScoped}`);
    text.setAttribute("y", `${i * lineHeightPxScoped + verticalOffsetScoped}`);
    text.setAttribute("font-family", getFontFamilyString(element));
    text.setAttribute("font-size", `${element.fontSize.scoped}px`);
    text.setAttribute("fill", element.stroke[0].content.src);
    text.setAttribute("text-anchor", textAnchor);
    text.setAttribute("style", "white-space: pre;");
    text.setAttribute("direction", direction);
    text.setAttribute("dominant-baseline", "alphabetic");
    node.appendChild(text);
  }
  
  return node;
};

// Render image element
const renderImage = (element: DucImageElement, files: DucExternalFiles, defs: SVGDefsElement): SVGElement => {
  const width = Math.round(element.width.scoped);
  const height = Math.round(element.height.scoped);
  const fileData = element.fileId && files[element.fileId];
  
  if (!fileData) {
    // Return a placeholder rectangle if no file data
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", width.toString());
    rect.setAttribute("height", height.toString());
    rect.setAttribute("fill", "#f0f0f0");
    rect.setAttribute("stroke", "#ccc");
    return rect;
  }

  // Create symbol for reuse (copied approach from staticSvgScene.ts)
  const symbolId = `image-${fileData.id}`;
  let symbol = defs.querySelector(`#${symbolId}`);
  if (!symbol) {
    symbol = document.createElementNS(SVG_NS, "symbol");
    symbol.id = symbolId;

    const image = document.createElementNS(SVG_NS, "image");
    image.setAttribute("width", "100%");
    image.setAttribute("height", "100%");
    image.setAttribute("href", uint8ArrayToBase64(fileData.data));

    symbol.appendChild(image);
    defs.appendChild(symbol);
  }

  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `#${symbolId}`);
  use.setAttribute("width", `${width}`);
  use.setAttribute("height", `${height}`);

  // Handle scaling/flipping (copied approach from staticSvgScene.ts)
  if (element.scaleFlip && (element.scaleFlip[0] !== 1 || element.scaleFlip[1] !== 1)) {
    const translateX = element.scaleFlip[0] !== 1 ? -width : 0;
    const translateY = element.scaleFlip[1] !== 1 ? -height : 0;
    use.setAttribute(
      "transform",
      `scale(${element.scaleFlip[0]}, ${element.scaleFlip[1]}) translate(${translateX} ${translateY})`,
    );
  }

  const g = document.createElementNS(SVG_NS, "g");
  g.appendChild(use);

  // Handle roundness with clipping (copied approach from staticSvgScene.ts)
  if (element.roundness) {
    const clipPath = document.createElementNS(SVG_NS, "clipPath");
    clipPath.id = `image-clipPath-${element.id}`;

    const clipRect = document.createElementNS(SVG_NS, "rect");
    const radius = element.roundness.scoped;
    clipRect.setAttribute("width", `${element.width.scoped}`);
    clipRect.setAttribute("height", `${element.height.scoped}`);
    clipRect.setAttribute("rx", `${radius}`);
    clipRect.setAttribute("ry", `${radius}`);
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);

    g.setAttributeNS(SVG_NS, "clip-path", `url(#${clipPath.id})`);
  }
  
  return g;
};

// Render freedraw element
const renderFreeDraw = (element: DucFreeDrawElement): SVGElement => {
  const path = document.createElementNS(SVG_NS, "path");
  
  // Get SVG path data for freedraw using the provided utility
  const pathData = getFreeDrawSvgPath(element);
  path.setAttribute("d", pathData);
  
  // Apply styles
  // applyStyles(path, element.stroke, element.background);
  applyStyles(path, [], element.stroke);
  
  return path;
};

// Render iframe element
const renderIframe = (element: DucIframeLikeElement | DucFrameLikeElement): SVGElement => {
  // For SVG export, we represent iframes as rectangles with a label
  const rect = document.createElementNS(SVG_NS, "rect");
  
  rect.setAttribute("width", element.width.scoped.toString());
  rect.setAttribute("height", element.height.scoped.toString());
  
  // Apply styles
  applyStyles(rect, element.stroke, element.background);
  
  // Add a title to indicate it's an iframe
  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = "Iframe: " + (element.link || "embedded content");
  rect.appendChild(title);
  
  return rect;
};

// Render table element
const renderTable = (element: DucTableElement): SVGElement => {
  // For SVG export, we'll create a group with rectangles for cells
  const tableGroup = document.createElementNS(SVG_NS, "g");
  // TODO: We need to implement table rendering for SVG export
  const { columnOrder, rowOrder, columns, rows, cells } = element;
  
  // Create outer rectangle for table
  const tableRect = document.createElementNS(SVG_NS, "rect");
  tableRect.setAttribute("width", element.width.scoped.toString());
  tableRect.setAttribute("height", element.height.scoped.toString());
  applyStyles(tableRect, element.stroke, element.background);
  tableGroup.appendChild(tableRect);
  
  // Calculate cell dimensions
  let currentY = 0;
  // for (const rowId of rowOrder) {
  //   const row = rows[rowId];
  //   const rowHeight = row?.height?.scoped || (element.height.scoped / rowOrder.length);
    
  //   let currentX = 0;
  //   for (const colId of columnOrder) {
  //     const col = columns[colId];
  //     const colWidth = col?.width?.scoped || (element.width.scoped / columnOrder.length);
      
  //     // Create cell
  //     const cellKey = `${rowId}:${colId}`;
  //     const cell = cells[cellKey];
      
  //     if (cell) {
  //       // Create cell rectangle
  //       const cellRect = document.createElementNS(SVG_NS, "rect");
  //       cellRect.setAttribute("x", currentX.toString());
  //       cellRect.setAttribute("y", currentY.toString());
  //       cellRect.setAttribute("width", colWidth.toString());
  //       cellRect.setAttribute("height", rowHeight.toString());
        
  //       // Apply cell styles if available
  //       if (cell.style) {
  //         if (cell.style.background) {
  //           cellRect.setAttribute("fill", cell.style.background);
  //         }
          
  //         if (cell.style.border) {
  //           cellRect.setAttribute("stroke", cell.style.border.color || "#000");
  //           if (cell.style.border.width) {
  //             cellRect.setAttribute("stroke-width", cell.style.border.width.scoped.toString());
  //           }
  //         }
  //       }
        
  //       tableGroup.appendChild(cellRect);
        
  //       // Add cell text
  //       if (cell.data) {
  //         const cellText = document.createElementNS(SVG_NS, "text");
  //         cellText.setAttribute("x", (currentX + colWidth / 2).toString());
  //         cellText.setAttribute("y", (currentY + rowHeight / 2).toString());
  //         cellText.setAttribute("text-anchor", "middle");
  //         cellText.setAttribute("dominant-baseline", "central");
          
  //         if (cell.style?.text) {
  //           if (cell.style.text.color) {
  //             cellText.setAttribute("fill", cell.style.text.color);
  //           }
  //           if (cell.style.text.size) {
  //             cellText.setAttribute("font-size", cell.style.text.size.scoped.toString());
  //           }
  //           if (cell.style.text.font) {
  //             cellText.setAttribute("font-family", cell.style.text.font);
  //           }
  //         }
          
  //         cellText.textContent = cell.data;
  //         tableGroup.appendChild(cellText);
  //       }
  //     }
      
  //     currentX += colWidth;
  //   }
    
  //   currentY += rowHeight;
  // }
  
  return tableGroup;
};

// Render doc element
const renderDoc = (element: DucDocElement): SVGElement => {
  // For SVG export, we'll create a foreign object with HTML content
  const rect = document.createElementNS(SVG_NS, "rect");
  // TODO: We need to implement doc rendering for SVG export
  
  rect.setAttribute("width", element.width.scoped.toString());
  rect.setAttribute("height", element.height.scoped.toString());
  
  // Apply styles
  applyStyles(rect, element.stroke, element.background);
  
  
  return rect;
};