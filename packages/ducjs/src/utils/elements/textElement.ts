import { TEXT_ALIGN, VERTICAL_ALIGN } from "../../flatbuffers/duc";
import { DucLocalState, RawValue, Scope, ScopedValue } from "../../types";
import { DucElement, DucElementType, DucPoint, DucTextContainer, DucTextElement, DucTextElementWithContainer, ElementsMap, FontFamilyValues, FontString, NonDeletedDucElement } from "../../types/elements";
import { isArrowElement, isBoundToContainer, isTextElement } from "../../types/elements/typeChecks";
import { GeometricPoint } from "../../types/geometryTypes";
import { ExtractSetType } from "../../types/utility-types";
import { getContainerElement, getElementAbsoluteCoords, getResizedElementAbsoluteCoords } from "../bounds";
import { ARROW_LABEL_FONT_SIZE_TO_MIN_WIDTH_RATIO, ARROW_LABEL_WIDTH_FRACTION, BOUND_TEXT_PADDING, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, FONT_FAMILY, WINDOWS_EMOJI_FALLBACK_FONT } from "../constants";
import { getBoundTextElementPosition, getPointGlobalCoordinates, getPointsGlobalCoordinates, getSegmentMidPoint } from "./linearElement";
import { adjustXYWithRotation } from "../math";
import { normalizeText } from "../normalize";
import { SupportedMeasures, getPrecisionValueFromRaw, getScopedBezierPointFromDucPoint } from "../../technical/scopes";

export const computeBoundTextPosition = (
  container: DucElement,
  boundTextElement: DucTextElementWithContainer,
  elementsMap: ElementsMap,
  currentScope: SupportedMeasures,
): { x: ScopedValue; y: ScopedValue } => {
  if (isArrowElement(container)) {
    const coords = getBoundTextElementPosition(
      container,
      boundTextElement,
      elementsMap,
      currentScope,
    );
    if (coords === null) {
      return {
        x: getPrecisionValueFromRaw(0 as RawValue, boundTextElement.scope, currentScope).scoped,
        y: getPrecisionValueFromRaw(0 as RawValue, boundTextElement.scope, currentScope).scoped,
      };
    }
    return { x: coords.x as ScopedValue, y: coords.y as ScopedValue };
  }
  const containerCoords = getContainerCoords(container);
  const maxContainerHeight = getBoundTextMaxHeight(container, boundTextElement);
  const maxContainerWidth = getBoundTextMaxWidth(container, boundTextElement);

  let x;
  let y;
  if (boundTextElement.verticalAlign === VERTICAL_ALIGN.TOP) {
    y = containerCoords.y;
  } else if (boundTextElement.verticalAlign === VERTICAL_ALIGN.BOTTOM) {
    y = containerCoords.y + (maxContainerHeight - boundTextElement.height.value);
  } else {
    y =
      containerCoords.y +
      (maxContainerHeight / 2 - boundTextElement.height.value / 2);
  }
  if (boundTextElement.textAlign === TEXT_ALIGN.LEFT) {
    x = containerCoords.x;
  } else if (boundTextElement.textAlign === TEXT_ALIGN.RIGHT) {
    x = containerCoords.x + (maxContainerWidth - boundTextElement.width.value);
  } else {
    x =
      containerCoords.x + (maxContainerWidth / 2 - boundTextElement.width.value / 2);
  }

  const xValue = getPrecisionValueFromRaw(x as RawValue, boundTextElement.scope, currentScope);
  const yValue = getPrecisionValueFromRaw(y as RawValue, boundTextElement.scope, currentScope);
  return { x: xValue.scoped, y: yValue.scoped };
};

export const measureText = (
  text: string,
  font: FontString,
  lineHeight: DucTextElement["lineHeight"],
  currentScope: Scope,
): { width: RawValue; height: RawValue } => {
  text = text
    .split("\n")
    // replace empty lines with single space because leading/trailing empty
    // lines would be stripped from computation
    .map((x) => x || " ")
    .join("\n");
  const fontSize = getPrecisionValueFromRaw(parseFloat(font) as RawValue, currentScope, currentScope);
  const height = getTextHeight(text, fontSize, lineHeight);
  const width = getTextWidth(text, font);
  return { width, height };
};

/**
 * We calculate the line height from the font size and the unitless line height,
 * aligning with the W3C spec.
 */
export const getLineHeightInPx = (
  fontSize: DucTextElement["fontSize"],
  lineHeight: DucTextElement["lineHeight"],
): RawValue => {
  return fontSize.value * lineHeight as RawValue;
};

// FIXME rename to getApproxMinContainerHeight
export const getApproxMinLineHeight = (
  fontSize: DucTextElement["fontSize"],
  lineHeight: DucTextElement["lineHeight"],
): RawValue => {
  return getLineHeightInPx(fontSize, lineHeight) + (BOUND_TEXT_PADDING * 2) as RawValue;
};

let canvas: HTMLCanvasElement | undefined;

/**
 * @param forceAdvanceWidth use to force retrieve the "advance width" ~ `metrics.width`, instead of the actual boundind box width.
 *
 * > The advance width is the distance between the glyph's initial pen position and the next glyph's initial pen position.
 *
 * We need to use the advance width as that's the closest thing to the browser wrapping algo, hence using it for:
 * - text wrapping
 * - wysiwyg editor (+padding)
 *
 * Everything else should be based on the actual bounding box width.
 *
 * `Math.ceil` of the final width adds additional buffer which stabilizes slight wrapping incosistencies.
 */
const getLineWidth = (
  text: string,
  font: FontString,
  forceAdvanceWidth?: true,
  isTestEnv?: boolean,
): RawValue => {
  if (!canvas) {
    canvas = document.createElement("canvas");
  }
  const canvas2dContext = canvas.getContext("2d")!;
  canvas2dContext.font = font;
  const metrics = canvas2dContext.measureText(text);

  const advanceWidth = metrics.width;

  // retrieve the actual bounding box width if these metrics are available (as of now > 95% coverage)
  if (
    !forceAdvanceWidth &&
    typeof window !== "undefined" &&
    window.TextMetrics &&
    "actualBoundingBoxLeft" in window.TextMetrics.prototype &&
    "actualBoundingBoxRight" in window.TextMetrics.prototype
  ) {
    // could be negative, therefore getting the absolute value
    const actualWidth =
      Math.abs(metrics.actualBoundingBoxLeft) +
      Math.abs(metrics.actualBoundingBoxRight);

    // fallback to advance width if the actual width is zero, i.e. on text editing start
    // or when actual width does not respect whitespace chars, i.e. spaces
    // otherwise actual width should always be bigger
    return Math.max(actualWidth, advanceWidth) as RawValue;
  }

  // since in test env the canvas measureText algo
  // doesn't measure text and instead just returns number of
  // characters hence we assume that each letteris 10px
  if (isTestEnv) {
    return advanceWidth * 10 as RawValue;
  }

  return advanceWidth as RawValue;
};

export const getTextWidth = (
  text: string,
  font: FontString,
  forceAdvanceWidth?: true,
): RawValue => {
  const lines = splitIntoLines(text);
  let width = 0;
  lines.forEach((line) => {
    width = Math.max(width, getLineWidth(line, font, forceAdvanceWidth));
  });

  return width as RawValue;
};

export const getTextHeight = (
  text: DucTextElement["text"],
  fontSize: DucTextElement["fontSize"],
  lineHeight: DucTextElement["lineHeight"],
): RawValue => {
  const lineCount = splitIntoLines(text).length;
  return getLineHeightInPx(fontSize, lineHeight) * lineCount as RawValue;
};

export const parseTokens = (text: string) => {
  // Splitting words containing "-" as those are treated as separate words
  // by css wrapping algorithm eg non-profit => non-, profit
  const words = text.split("-");
  if (words.length > 1) {
    // non-proft org => ['non-', 'profit org']
    words.forEach((word, index) => {
      if (index !== words.length - 1) {
        words[index] = word += "-";
      }
    });
  }
  // Joining the words with space and splitting them again with space to get the
  // final list of tokens
  // ['non-', 'profit org'] =>,'non- proft org' => ['non-','profit','org']
  return words.join(" ").split(" ");
};

export const wrapText = (
  text: string,
  font: FontString,
  maxWidth: number,
): string => {
  // if maxWidth is not finite or NaN which can happen in case of bugs in
  // computation, we need to make sure we don't continue as we'll end up
  // in an infinite loop
  if (!Number.isFinite(maxWidth) || maxWidth < 0) {
    return text;
  }

  const lines: Array<string> = [];
  const originalLines = text.split("\n");
  const spaceAdvanceWidth = getLineWidth(" ", font, true);

  let currentLine = "";
  let currentLineWidthTillNow = 0;

  const push = (str: string) => {
    if (str.trim()) {
      lines.push(str);
    }
  };

  const resetParams = () => {
    currentLine = "";
    currentLineWidthTillNow = 0;
  };

  for (const originalLine of originalLines) {
    const currentLineWidth = getLineWidth(originalLine, font, true);

    // Push the line if its <= maxWidth
    if (currentLineWidth <= maxWidth) {
      lines.push(originalLine);
      continue;
    }

    const words = parseTokens(originalLine);
    resetParams();

    let index = 0;

    while (index < words.length) {
      const currentWordWidth = getLineWidth(words[index], font, true);

      // This will only happen when single word takes entire width
      if (currentWordWidth === maxWidth) {
        push(words[index]);
        index++;
      }

      // Start breaking longer words exceeding max width
      else if (currentWordWidth > maxWidth) {
        // push current line since the current word exceeds the max width
        // so will be appended in next line
        push(currentLine);

        resetParams();

        while (words[index].length > 0) {
          const currentChar = String.fromCodePoint(
            words[index].codePointAt(0)!,
          );

          const line = currentLine + currentChar;
          // use advance width instead of the actual width as it's closest to the browser wapping algo
          // use width of the whole line instead of calculating individual chars to accomodate for kerning
          const lineAdvanceWidth = getLineWidth(line, font, true);
          const charAdvanceWidth = charWidth.calculate(currentChar, font);

          currentLineWidthTillNow = lineAdvanceWidth;
          words[index] = words[index].slice(currentChar.length);

          if (currentLineWidthTillNow >= maxWidth) {
            push(currentLine);
            currentLine = currentChar;
            currentLineWidthTillNow = charAdvanceWidth;
          } else {
            currentLine = line;
          }
        }
        // push current line if appending space exceeds max width
        if (currentLineWidthTillNow + spaceAdvanceWidth >= maxWidth) {
          push(currentLine);
          resetParams();
          // space needs to be appended before next word
          // as currentLine contains chars which couldn't be appended
          // to previous line unless the line ends with hyphen to sync
          // with css word-wrap
        } else if (!currentLine.endsWith("-")) {
          currentLine += " ";
          currentLineWidthTillNow += spaceAdvanceWidth;
        }
        index++;
      } else {
        // Start appending words in a line till max width reached
        while (currentLineWidthTillNow < maxWidth && index < words.length) {
          const word = words[index];
          currentLineWidthTillNow = getLineWidth(
            currentLine + word,
            font,
            true,
          );

          if (currentLineWidthTillNow > maxWidth) {
            push(currentLine);
            resetParams();

            break;
          }
          index++;

          // if word ends with "-" then we don't need to add space
          // to sync with css word-wrap
          const shouldAppendSpace = !word.endsWith("-");
          currentLine += word;

          if (shouldAppendSpace) {
            currentLine += " ";
          }

          // Push the word if appending space exceeds max width
          if (currentLineWidthTillNow + spaceAdvanceWidth >= maxWidth) {
            if (shouldAppendSpace) {
              lines.push(currentLine.slice(0, -1));
            } else {
              lines.push(currentLine);
            }
            resetParams();
            break;
          }
        }
      }
    }

    if (currentLine.slice(-1) === " ") {
      // only remove last trailing space which we have added when joining words
      currentLine = currentLine.slice(0, -1);
      push(currentLine);
    }
  }

  return lines.join("\n");
};

export const charWidth = (() => {
  const cachedCharWidth: { [key: FontString]: Array<number> } = {};

  const calculate = (char: string, font: FontString) => {
    const ascii = char.charCodeAt(0);
    if (!cachedCharWidth[font]) {
      cachedCharWidth[font] = [];
    }
    if (!cachedCharWidth[font][ascii]) {
      const width = getLineWidth(char, font, true);
      cachedCharWidth[font][ascii] = width;
    }

    return cachedCharWidth[font][ascii];
  };

  const getCache = (font: FontString) => {
    return cachedCharWidth[font];
  };
  return {
    calculate,
    getCache,
  };
})();

const DUMMY_TEXT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".toLocaleUpperCase();

// FIXME rename to getApproxMinContainerWidth
export const getApproxMinLineWidth = (
  font: FontString,
  lineHeight: DucTextElement["lineHeight"],
  currentScope: SupportedMeasures,
): RawValue => {
  const maxCharWidth = getMaxCharWidth(font);
  if (maxCharWidth === 0) {
    return (
      measureText(DUMMY_TEXT.split("").join("\n"), font, lineHeight, currentScope).width +
      BOUND_TEXT_PADDING * 2
    ) as RawValue;
  }
  return (maxCharWidth + BOUND_TEXT_PADDING * 2) as RawValue;
};

export const getMinCharWidth = (font: FontString): RawValue => {
  const cache = charWidth.getCache(font);
  if (!cache) {
    return 0 as RawValue;
  }
  const cacheWithOutEmpty = cache.filter((val) => val !== undefined);

  return Math.min(...cacheWithOutEmpty) as RawValue;
};

export const getMaxCharWidth = (font: FontString): RawValue => {
  const cache = charWidth.getCache(font);
  if (!cache) {
    return 0 as RawValue;
  }
  const cacheWithOutEmpty = cache.filter((val) => val !== undefined);
  return Math.max(...cacheWithOutEmpty) as RawValue;
};


export const getContainerCenter = (
  container: DucElement,
  DucState: DucLocalState,
  elementsMap: ElementsMap,
): GeometricPoint => {
  if (!isArrowElement(container)) {
    return {
      x: container.x.scoped + container.width.scoped / 2,
      y: container.y.scoped + container.height.scoped / 2,
    };
  }
  const points = getPointsGlobalCoordinates(
    container,
    elementsMap,
    DucState.scope,
  );
  if (points.length % 2 === 1) {
    const index = Math.floor(container.points.length / 2);
    const midPoint = getPointGlobalCoordinates(
      container,
      getScopedBezierPointFromDucPoint(container.points[index]),
      elementsMap,
      DucState.scope,
    );
    return { x: midPoint.x, y: midPoint.y };
  }
  const index = container.points.length / 2 - 1;
  // const initialMidSegmentMidpoint = getEditorMidPoints(
  //   container,
  //   elementsMap,
  //   DucState,
  // )[index];
  let initialMidSegmentMidpoint: DucPoint | undefined; // FIXME: provide a better implementation for mid points handling
  const initMidPoints = initialMidSegmentMidpoint && getScopedBezierPointFromDucPoint(initialMidSegmentMidpoint);
  // Remove casting in the future
  let midSegmentMidpoint = initMidPoints && { x: initMidPoints.x, y: initMidPoints.y };
  if (!midSegmentMidpoint) {
    midSegmentMidpoint = getSegmentMidPoint(
      container,
      getScopedBezierPointFromDucPoint(points[index]),
      getScopedBezierPointFromDucPoint(points[index + 1]),
      index + 1,
      elementsMap,
      DucState.scope,
    );
  }
  return { x: midSegmentMidpoint.x, y: midSegmentMidpoint.y };
};

export const getContainerCoords = (container: NonDeletedDucElement): { x: RawValue; y: RawValue } => {
  let offsetX = BOUND_TEXT_PADDING;
  let offsetY = BOUND_TEXT_PADDING;

  if (container.type === "ellipse") {
    // The derivation of coordinates is explained in https://github.com/excalidraw/excalidraw/pull/6172
    offsetX += (container.width.value / 2) * (1 - Math.sqrt(2) / 2);
    offsetY += (container.height.value / 2) * (1 - Math.sqrt(2) / 2);
  }
  // The derivation of coordinates is explained in https://github.com/excalidraw/excalidraw/pull/6265
  if (container.type === "polygon") {
    offsetX += container.width.value / 4;
    offsetY += container.height.value / 4;
  }
  return {
    x: container.x.value + offsetX as RawValue,
    y: container.y.value + offsetY as RawValue,
  };
};

export const getTextElementAngle = (
  textElement: DucTextElement,
  container: DucTextContainer | null,
) => {
  if (!container || isArrowElement(container)) {
    return textElement.angle;
  }
  return container.angle;
};

export const shouldAllowVerticalAlign = (
  selectedElements: NonDeletedDucElement[],
  elementsMap: ElementsMap,
) => {
  return selectedElements.some((element) => {
    if (isBoundToContainer(element)) {
      const container = getContainerElement(element, elementsMap);
      if (isArrowElement(container)) {
        return false;
      }
      return true;
    }
    return false;
  });
};

export const suppportsHorizontalAlign = (
  selectedElements: NonDeletedDucElement[],
  elementsMap: ElementsMap,
) => {
  return selectedElements.some((element) => {
    if (isBoundToContainer(element)) {
      const container = getContainerElement(element, elementsMap);
      if (isArrowElement(container)) {
        return false;
      }
      return true;
    }

    return isTextElement(element);
  });
};

const VALID_CONTAINER_TYPES = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "arrow",
]);

export const isValidTextContainer = (element: {
  type: DucElementType;
}) => VALID_CONTAINER_TYPES.has(element.type);

export const computeContainerDimensionForBoundText = (
  dimension: RawValue,
  containerType: ExtractSetType<typeof VALID_CONTAINER_TYPES>,
): RawValue => {
  dimension = Math.ceil(dimension) as RawValue;
  const padding = (BOUND_TEXT_PADDING * 2) as RawValue;

  if (containerType === "ellipse") {
    return Math.round(((dimension + padding) / Math.sqrt(2)) * 2) as RawValue;
  }
  if (containerType === "arrow") {
    return (dimension + padding * 8) as RawValue;
  }
  if (containerType === "diamond") {
    return (2 * (dimension + padding)) as RawValue;
  }
  return (dimension + padding) as RawValue;
};

export const getBoundTextMaxWidth = (
  container: DucElement,
  boundTextElement: DucTextElement | null,
): RawValue => {
  const { width } = container;
  if (isArrowElement(container)) {
    const minWidth =
      (boundTextElement?.fontSize.value ?? DEFAULT_FONT_SIZE) *
      ARROW_LABEL_FONT_SIZE_TO_MIN_WIDTH_RATIO;
    return Math.max(ARROW_LABEL_WIDTH_FRACTION * width.value, minWidth) as RawValue;
  }
  if (container.type === "ellipse") {
    // The width of the largest rectangle inscribed inside an ellipse is
    // Math.round((ellipse.width / 2) * Math.sqrt(2)) which is derived from
    // equation of an ellipse -https://github.com/excalidraw/excalidraw/pull/6172
    return (Math.round((width.value / 2) * Math.sqrt(2)) - BOUND_TEXT_PADDING * 2) as RawValue;
  }
  if (container.type === "polygon") {
    // The width of the largest rectangle inscribed inside a rhombus is
    // Math.round(width / 2) - https://github.com/excalidraw/excalidraw/pull/6265
    return (Math.round(width.value / 2) - BOUND_TEXT_PADDING * 2) as RawValue;
  }
  return (width.value - BOUND_TEXT_PADDING * 2) as RawValue;
};

export const getBoundTextMaxHeight = (
  container: DucElement,
  boundTextElement: DucTextElementWithContainer,
): RawValue => {
  const { height } = container;

  if (isArrowElement(container)) {
    const containerHeight = height.value - BOUND_TEXT_PADDING * 8 * 2;
    if (containerHeight <= 0) {
      return boundTextElement.height.value;
    }
    return height.value;
  }
  if (container.type === "ellipse") {
    // The height of the largest rectangle inscribed inside an ellipse is
    // Math.round((ellipse.height / 2) * Math.sqrt(2)) which is derived from
    // equation of an ellipse - https://github.com/excalidraw/excalidraw/pull/6172
    return (Math.round((height.value / 2) * Math.sqrt(2)) - BOUND_TEXT_PADDING * 2) as RawValue;
  }
  if (container.type === "polygon") {
    // The height of the largest rectangle inscribed inside a rhombus is
    // Math.round(height / 2) - https://github.com/excalidraw/excalidraw/pull/6265
    return (Math.round(height.value / 2) - BOUND_TEXT_PADDING * 2) as RawValue;
  }
  return (height.value - BOUND_TEXT_PADDING * 2) as RawValue;
};

export const isMeasureTextSupported = (currentScope: SupportedMeasures) => {
  const width = getTextWidth(
    DUMMY_TEXT,
    getFontString({
      fontSize: getPrecisionValueFromRaw(DEFAULT_FONT_SIZE as RawValue, currentScope, currentScope),
      fontFamily: DEFAULT_FONT_FAMILY,
    }),
  );
  return width > 0;
};

export const getMinTextElementWidth = (
  font: FontString,
  lineHeight: DucTextElement["lineHeight"],
  currentScope: SupportedMeasures,
): RawValue => {
  return measureText("", font, lineHeight, currentScope).width + BOUND_TEXT_PADDING * 2 as RawValue;
};

/** retrieves text from text elements and concatenates to a single string */
export const getTextFromElements = (
  elements: readonly DucElement[],
  separator = "\n\n",
) => {
  const text = elements
    .reduce((acc: string[], element) => {
      if (isTextElement(element)) {
        acc.push(element.text);
      }
      return acc;
    }, [])
    .join(separator);
  return text;
};


export const getFontFamilyString = ({
  fontFamily,
}: {
  fontFamily: FontFamilyValues;
}) => {
  for (const [fontFamilyString, id] of Object.entries(FONT_FAMILY)) {
    if (id === fontFamily) {
      return `${fontFamilyString}, ${WINDOWS_EMOJI_FALLBACK_FONT}`;
    }
  }
  return WINDOWS_EMOJI_FALLBACK_FONT;
};

/** returns fontSize+fontFamily string for assignment to DOM elements */
export const getFontString = ({
  fontSize,
  fontFamily,
}: {
  fontSize: DucTextElement["fontSize"];
  fontFamily: FontFamilyValues;
}) => {
  return `${fontSize.scoped}px ${getFontFamilyString({ fontFamily })}` as FontString;
};

/** computes element x/y offset based on textAlign/verticalAlign */
export const getTextElementPositionOffsets = (
  opts: {
    textAlign: DucTextElement["textAlign"];
    verticalAlign: DucTextElement["verticalAlign"];
  },
  metrics: {
    width: RawValue;
    height: RawValue;
  },
) => {
  return {
    x:
      opts.textAlign === TEXT_ALIGN.CENTER
        ? metrics.width / 2
        : opts.textAlign === TEXT_ALIGN.RIGHT
          ? metrics.width
          : 0,
    y: opts.verticalAlign === VERTICAL_ALIGN.MIDDLE ? metrics.height / 2 : 0,
  };
};

export const refreshTextDimensions = (
  textElement: DucTextElement,
  container: DucTextContainer | null,
  elementsMap: ElementsMap,
  currentScope: Scope,
  text = textElement.text,
) => {
  if (textElement.isDeleted) {
    return;
  }
  if (container || !textElement.autoResize) {
    text = wrapText(
      text,
      getFontString({ fontFamily: textElement.fontFamily, fontSize: textElement.fontSize }),
      container
        ? getBoundTextMaxWidth(container, textElement)
        : textElement.width.scoped,
    );
  }
  const dimensions = getAdjustedDimensions(textElement, elementsMap, text, currentScope);
  return { text, ...dimensions };
};


export const splitIntoLines = (text: string) => {
  return normalizeText(text).split("\n");
};

/**
 * To get unitless line-height (if unknown) we can calculate it by dividing
 * height-per-line by fontSize.
 */
export const detectLineHeight = (textElement: DucTextElement) => {
  const lineCount = splitIntoLines(textElement.text).length;
  return (textElement.height.scoped /
    lineCount /
    textElement.fontSize.scoped) as DucTextElement["lineHeight"];
};

export const getAdjustedDimensions = (
  element: DucTextElement,
  elementsMap: ElementsMap,
  nextText: string,
  currentScope: Scope,
): {
  x: RawValue;
  y: RawValue;
  width: RawValue;
  height: RawValue;
} => {
  let { width: nextWidth, height: nextHeight } = measureText(
    nextText,
    getFontString({ fontFamily: element.fontFamily, fontSize: element.fontSize }),
    element.lineHeight,
    currentScope,
  );

  // wrapped text
  if (!element.autoResize) {
    nextWidth = element.width.value;
  }

  const { textAlign, verticalAlign } = element;
  let x: RawValue;
  let y: RawValue;
  if (
    textAlign === TEXT_ALIGN.CENTER &&
    verticalAlign === VERTICAL_ALIGN.MIDDLE &&
    !element.containerId &&
    element.autoResize
  ) {
    const prevMetrics = measureText(
      element.text,
      getFontString({ fontFamily: element.fontFamily, fontSize: element.fontSize }),
      element.lineHeight,
      currentScope,
    );
    const offsets = getTextElementPositionOffsets(element, {
      width: nextWidth - prevMetrics.width as RawValue,
      height: nextHeight - prevMetrics.height as RawValue,
    });

    x = element.x.value - offsets.x as RawValue;
    y = element.y.value - offsets.y as RawValue;
  } else {
    const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap, currentScope);
    const nextWidthValue = getPrecisionValueFromRaw(nextWidth, element.scope, currentScope);
    const nextHeightValue = getPrecisionValueFromRaw(nextHeight, element.scope, currentScope);

    const [nextX1, nextY1, nextX2, nextY2] = getResizedElementAbsoluteCoords(
      element,
      nextWidthValue.scoped,
      nextHeightValue.scoped,
      false,
      currentScope,
    );
    const deltaX1 = (x1 - nextX1) / 2;
    const deltaY1 = (y1 - nextY1) / 2;
    const deltaX2 = (x2 - nextX2) / 2;
    const deltaY2 = (y2 - nextY2) / 2;

    const rotationPoint = adjustXYWithRotation(
      {
        s: true,
        e: textAlign === TEXT_ALIGN.CENTER || textAlign === TEXT_ALIGN.LEFT,
        w: textAlign === TEXT_ALIGN.CENTER || textAlign === TEXT_ALIGN.RIGHT,
      },
      element.x.value,
      element.y.value,
      element.angle,
      deltaX1,
      deltaY1,
      deltaX2,
      deltaY2,
    );
    x = rotationPoint.x as RawValue;
    y = rotationPoint.y as RawValue;
  }

  return {
    width: nextWidth,
    height: nextHeight,
    x: Number.isFinite(x) ? x : element.x.value,
    y: Number.isFinite(y) ? y : element.y.value,
  };
};









export {
  getBoundTextElementPosition
};

