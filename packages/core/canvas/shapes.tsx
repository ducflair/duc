import {
  getClosedCurveShape,
  getCurveShape,
  getEllipseShape,
  getFreedrawShape,
  getPolygonShape,
  type GeometricShape,
} from "../utils/geometry/shape";
import {
  ArrowIcon,
  DiamondIcon,
  EllipseIcon,
  EraserIcon,
  FreedrawIcon,
  ImageIcon,
  LineIcon,
  RectangleIcon,
  SelectionIcon,
  TextIcon,
} from "./components/excalicons";
import { getElementAbsoluteCoords } from "./element";
import { shouldTestInside } from "./element/collision";
import { LinearElementEditor } from "./element/linearElementEditor";
import { getBoundTextElement } from "./element/textElement";
import type { ElementsMap, DucElement, DucRectangleElement } from "./element/types";
import { KEYS } from "./keys";
import { ShapeCache } from "./scene/ShapeCache";

export const SHAPES = [
  {
    icon: SelectionIcon,
    value: "selection",
    key: KEYS.V,
    numericKey: KEYS["1"],
    fillable: true,
  },
  {
    icon: RectangleIcon,
    value: "rectangle",
    key: KEYS.R,
    numericKey: KEYS["2"],
    fillable: true,
  },
  {
    icon: DiamondIcon,
    value: "diamond",
    key: KEYS.D,
    numericKey: KEYS["3"],
    fillable: true,
  },
  {
    icon: EllipseIcon,
    value: "ellipse",
    key: KEYS.O,
    numericKey: KEYS["4"],
    fillable: true,
  },
  {
    icon: ArrowIcon,
    value: "arrow",
    key: KEYS.A,
    numericKey: KEYS["5"],
    fillable: true,
  },
  {
    icon: LineIcon,
    value: "line",
    key: KEYS.L,
    numericKey: KEYS["6"],
    fillable: true,
  },
  {
    icon: FreedrawIcon,
    value: "freedraw",
    key: [KEYS.P, KEYS.X],
    numericKey: KEYS["7"],
    fillable: false,
  },
  {
    icon: TextIcon,
    value: "text",
    key: KEYS.T,
    numericKey: KEYS["8"],
    fillable: false,
  },
  {
    icon: ImageIcon,
    value: "image",
    key: null,
    numericKey: KEYS["9"],
    fillable: false,
  },
  {
    icon: EraserIcon,
    value: "eraser",
    key: KEYS.E,
    numericKey: KEYS["0"],
    fillable: false,
  },
] as const;

export const findShapeByKey = (key: string) => {
  const shape = SHAPES.find((shape, index) => {
    return (
      (shape.numericKey != null && key === shape.numericKey.toString()) ||
      (shape.key &&
        (typeof shape.key === "string"
          ? shape.key === key
          : (shape.key as readonly string[]).includes(key)))
    );
  });
  return shape?.value || null;
};

/**
 * get the pure geometric shape of an excalidraw element
 * which is then used for hit detection
 */
export const getElementShape = (
  element: DucElement,
  elementsMap: ElementsMap,
): GeometricShape => {

  switch (element.type) {
    case "rectangle":
    case "diamond":
    case "frame":
    case "magicframe":
    case "embeddable":
    case "image":
    case "iframe":
    case "group":
    case "text":
    case "selection":
      return getPolygonShape(element);
    case "arrow":
    case "line": {
      const roughShape =
        ShapeCache.get(element)?.[0] ??
        ShapeCache.generateElementShape(element, null)[0];
      const [, , , , cx, cy] = getElementAbsoluteCoords(element, elementsMap);

      return shouldTestInside(element)
        ? getClosedCurveShape(
            element,
            roughShape,
            {x: element.x, y: element.y},
            element.angle,
            {x: cx, y: cy},
          )
        : getCurveShape(roughShape, {x: element.x, y: element.y}, element.angle, {
            x: cx,
            y: cy,
          });
    }
    case "ellipse":
      return getEllipseShape(element);

    case "freedraw": {
      const [, , , , cx, cy] = getElementAbsoluteCoords(element, elementsMap);
      return getFreedrawShape(element, {x: cx, y: cy}, shouldTestInside(element));
    }
    // default:
      // return getPolygonShape(element); // or some other default shape
  }
};

export const getBoundTextShape = (
  element: DucElement,
  elementsMap: ElementsMap,
): GeometricShape | null => {
  const boundTextElement = getBoundTextElement(element, elementsMap);

  if (boundTextElement) {
    if (element.type === "arrow") {
      return getElementShape(
        {
          ...boundTextElement,
          // arrow's bound text accurate position is not stored in the element's property
          // but rather calculated and returned from the following static method
          ...LinearElementEditor.getBoundTextElementPosition(
            element,
            boundTextElement,
            elementsMap,
          ),
        },
        elementsMap,
      );
    }
    return getElementShape(boundTextElement, elementsMap);
  }

  return null;
};
