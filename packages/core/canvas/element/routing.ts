import { cross } from "../../utils/geometry/geometry";
import BinaryHeap from "../binaryheap";
import {
  aabbForElement,
  arePointsEqual,
  headingToPoint,
  pointInsideBounds,
  pointToVector,
  scalePointFromOrigin,
  scaleVector,
  translatePoint,
  vectorToPoint,
} from "../math";
import { getSizeFromPoints } from "../points";
import type { Point } from "../types";
import { convertPointToTuple, isAnyTrue, toBrandedType, tupleToCoors } from "../utils";
import {
  bindPointToSnapToElementOutline,
  distanceToBindableElement,
  avoidRectangularCorner,
  getHoveredElementForBinding,
  FIXED_BINDING_DISTANCE,
  getHeadingForElbowArrowSnap,
  getGlobalFixedPointForBindableElement,
  snapToMid,
} from "./binding";
import type { Bounds } from "./bounds";
import type { Heading } from "./heading";
import {
  HEADING_DOWN,
  HEADING_LEFT,
  HEADING_RIGHT,
  HEADING_UP,
  vectorToHeading,
} from "./heading";
import { mutateElement } from "./mutateElement";
import { isBindableElement, isRectanguloidElement } from "./typeChecks";
import type {
  DucElbowArrowElement,
  FixedPointBinding,
  NonDeletedDucElement,
  NonDeletedSceneElementsMap,
  SceneElementsMap,
} from "./types";
import type { ElementsMap, DucBindableElement } from "./types";

type Node = {
  f: number;
  g: number;
  h: number;
  closed: boolean;
  visited: boolean;
  parent: Node | null;
  pos: Point;
  addr: [number, number];
};

type Grid = {
  row: number;
  col: number;
  data: (Node | null)[];
};

const BASE_PADDING = 40;

export const mutateElbowArrow = (
  arrow: DucElbowArrowElement,
  elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
  nextPoints: readonly Point[],
  offset?: Point,
  otherUpdates?: {
    startBinding?: FixedPointBinding | null;
    endBinding?: FixedPointBinding | null;
  },
  options?: {
    isDragging?: boolean;
    disableBinding?: boolean;
    informMutation?: boolean;
  },
) => {
  const origStartGlobalPoint = translatePoint(nextPoints[0], {
    x: arrow.x + (offset ? offset.x : 0),
    y: arrow.y + (offset ? offset.y : 0),
  });
  const origEndGlobalPoint = translatePoint(nextPoints[nextPoints.length - 1], {
    x: arrow.x + (offset ? offset.x : 0),
    y: arrow.y + (offset ? offset.y : 0),
  });

  const startElement =
    arrow.startBinding &&
    getBindableElementForId(arrow.startBinding.elementId, elementsMap);
  const endElement =
    arrow.endBinding &&
    getBindableElementForId(arrow.endBinding.elementId, elementsMap);
  const [hoveredStartElement, hoveredEndElement] = options?.isDragging
    ? getHoveredElements(origStartGlobalPoint, origEndGlobalPoint, elementsMap)
    : [startElement, endElement];
  const startGlobalPoint = getGlobalPoint(
    arrow.startBinding?.fixedPoint,
    origStartGlobalPoint,
    origEndGlobalPoint,
    elementsMap,
    startElement,
    hoveredStartElement,
    options?.isDragging,
  );
  const endGlobalPoint = getGlobalPoint(
    arrow.endBinding?.fixedPoint,
    origEndGlobalPoint,
    origStartGlobalPoint,
    elementsMap,
    endElement,
    hoveredEndElement,
    options?.isDragging,
  );
  const startHeading = getBindPointHeading(
    startGlobalPoint,
    endGlobalPoint,
    elementsMap,
    hoveredStartElement,
    origStartGlobalPoint,
  );
  const endHeading = getBindPointHeading(
    endGlobalPoint,
    startGlobalPoint,
    elementsMap,
    hoveredEndElement,
    origEndGlobalPoint,
  );
  const startPointBounds = [
    startGlobalPoint.x - 2,
    startGlobalPoint.y - 2,
    startGlobalPoint.x + 2,
    startGlobalPoint.y + 2,
  ] as Bounds;
  const endPointBounds = [
    endGlobalPoint.x - 2,
    endGlobalPoint.y - 2,
    endGlobalPoint.x + 2,
    endGlobalPoint.y + 2,
  ] as Bounds;
  const startElementBounds = hoveredStartElement
    ? aabbForElement(
        hoveredStartElement,
        offsetFromHeading(
          startHeading,
          arrow.startArrowhead
            ? FIXED_BINDING_DISTANCE * 6
            : FIXED_BINDING_DISTANCE * 2,
          1,
        ),
      )
    : startPointBounds;
  const endElementBounds = hoveredEndElement
    ? aabbForElement(
        hoveredEndElement,
        offsetFromHeading(
          endHeading,
          arrow.endArrowhead
            ? FIXED_BINDING_DISTANCE * 6
            : FIXED_BINDING_DISTANCE * 2,
          1,
        ),
      )
    : endPointBounds;
  const boundsOverlap =
    pointInsideBounds(
      startGlobalPoint,
      hoveredEndElement
        ? aabbForElement(
            hoveredEndElement,
            offsetFromHeading(endHeading, BASE_PADDING, BASE_PADDING),
          )
        : endPointBounds,
    ) ||
    pointInsideBounds(
      endGlobalPoint,
      hoveredStartElement
        ? aabbForElement(
            hoveredStartElement,
            offsetFromHeading(startHeading, BASE_PADDING, BASE_PADDING),
          )
        : startPointBounds,
    );
  const commonBounds = commonAABB(
    boundsOverlap
      ? [startPointBounds, endPointBounds]
      : [startElementBounds, endElementBounds],
  );
  const dynamicAABBs = generateDynamicAABBs(
    boundsOverlap ? startPointBounds : startElementBounds,
    boundsOverlap ? endPointBounds : endElementBounds,
    commonBounds,
    boundsOverlap
      ? offsetFromHeading(
          startHeading,
          !hoveredStartElement && !hoveredEndElement ? 0 : BASE_PADDING,
          0,
        )
      : offsetFromHeading(
          startHeading,
          !hoveredStartElement && !hoveredEndElement
            ? 0
            : BASE_PADDING -
                (arrow.startArrowhead
                  ? FIXED_BINDING_DISTANCE * 6
                  : FIXED_BINDING_DISTANCE * 2),
          BASE_PADDING,
        ),
    boundsOverlap
      ? offsetFromHeading(
          endHeading,
          !hoveredStartElement && !hoveredEndElement ? 0 : BASE_PADDING,
          0,
        )
      : offsetFromHeading(
          endHeading,
          !hoveredStartElement && !hoveredEndElement
            ? 0
            : BASE_PADDING -
                (arrow.endArrowhead
                  ? FIXED_BINDING_DISTANCE * 6
                  : FIXED_BINDING_DISTANCE * 2),
          BASE_PADDING,
        ),
    boundsOverlap,
  );
  const startDonglePosition = getDonglePosition(
    dynamicAABBs[0],
    startHeading,
    startGlobalPoint,
  );
  const endDonglePosition = getDonglePosition(
    dynamicAABBs[1],
    endHeading,
    endGlobalPoint,
  );

  // Canculate Grid positions
  const grid = calculateGrid(
    dynamicAABBs,
    startDonglePosition ? startDonglePosition : startGlobalPoint,
    startHeading,
    endDonglePosition ? endDonglePosition : endGlobalPoint,
    endHeading,
    commonBounds,
  );

  const startDongle =
    startDonglePosition && pointToGridNode(startDonglePosition, grid);
  const endDongle =
    endDonglePosition && pointToGridNode(endDonglePosition, grid);

  // Do not allow stepping on the true end or true start points
  const endNode = pointToGridNode(endGlobalPoint, grid);
  if (endNode && hoveredEndElement) {
    endNode.closed = true;
  }
  const startNode = pointToGridNode(startGlobalPoint, grid);
  if (startNode && arrow.startBinding) {
    startNode.closed = true;
  }
  const dongleOverlap =
    startDongle &&
    endDongle &&
    (pointInsideBounds(startDongle.pos, dynamicAABBs[1]) ||
      pointInsideBounds(endDongle.pos, dynamicAABBs[0]));

  // Create path to end dongle from start dongle
  const path = astar(
    startDongle ? startDongle : startNode!,
    endDongle ? endDongle : endNode!,
    grid,
    startHeading ? startHeading : HEADING_RIGHT,
    endHeading ? endHeading : HEADING_RIGHT,
    dongleOverlap ? [] : dynamicAABBs,
  );
  if (path) {
    const points = path.map((node) => node.pos) as Point[];
    startDongle && points.unshift(startGlobalPoint);
    endDongle && points.push(endGlobalPoint);

    mutateElement(
      arrow,
      {
        ...otherUpdates,
        ...normalizedArrowElementUpdate(simplifyElbowArrowPoints(points), 0, 0),
        angle: 0,
      },
      options?.informMutation,
    );
  } else {
    console.error("Elbow arrow cannot find a route");
  }
};

const offsetFromHeading = (
  heading: Heading,
  head: number,
  side: number,
): [number, number, number, number] => {
  switch (heading) {
    case HEADING_UP:
      return [head, side, side, side];
    case HEADING_RIGHT:
      return [side, head, side, side];
    case HEADING_DOWN:
      return [side, side, head, side];
  }

  return [side, side, side, head];
};

/**
 * Routing algorithm based on the A* path search algorithm.
 * @see https://www.geeksforgeeks.org/a-search-algorithm/
 *
 * Binary heap is used to optimize node lookup.
 * See {@link calculateGrid} for the grid calculation details.
 *
 * Additional modifications added due to aesthetic route reasons:
 * 1) Arrow segment direction change is penalized by specific linear constant (bendMultiplier)
 * 2) Arrow segments are not allowed to go "backwards", overlapping with the previous segment
 */
const astar = (
  start: Node,
  end: Node,
  grid: Grid,
  startHeading: Heading,
  endHeading: Heading,
  aabbs: Bounds[],
) => {
  const bendMultiplier = m_dist(start.pos, end.pos);
  const open = new BinaryHeap<Node>((node) => node.f);

  open.push(start);

  while (open.size() > 0) {
    // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
    const current = open.pop();

    if (!current || current.closed) {
      // Current is not passable, continue with next element
      continue;
    }

    // End case -- result has been found, return the traced path.
    if (current === end) {
      return pathTo(start, current);
    }

    // Normal case -- move current from open to closed, process each of its neighbors.
    current.closed = true;

    // Find all neighbors for the current node.
    const neighbors = getNeighbors(current.addr, grid);

    for (let i = 0; i < 4; i++) {
      const neighbor = neighbors[i];

      if (!neighbor || neighbor.closed) {
        // Not a valid node to process, skip to next neighbor.
        continue;
      }

      // Intersect
      const neighborHalfPoint = scalePointFromOrigin(
        neighbor.pos,
        current.pos,
        0.5,
      );
      if (
        isAnyTrue(
          ...aabbs.map((aabb) => pointInsideBounds(neighborHalfPoint, aabb)),
        )
      ) {
        continue;
      }

      // The g score is the shortest distance from start to current node.
      // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
      const neighborHeading = neighborIndexToHeading(i as 0 | 1 | 2 | 3);
      const previousDirection = current.parent
        ? vectorToHeading(pointToVector(current.pos, current.parent.pos))
        : startHeading;

      // Do not allow going in reverse
      const reverseHeading:Point = vectorToPoint(scaleVector(previousDirection, -1));
      const neighborIsReverseRoute =
        arePointsEqual(reverseHeading, headingToPoint(neighborHeading)) ||
        (arePointsEqual({x: start.addr[0], y: start.addr[1]}, {x: neighbor.addr[0], y: neighbor.addr[1]}) &&
          arePointsEqual(headingToPoint(neighborHeading), headingToPoint(startHeading))) ||
        (arePointsEqual({x: end.addr[0], y: end.addr[1]}, {x: neighbor.addr[0], y: neighbor.addr[1]}) &&
          arePointsEqual(headingToPoint(neighborHeading), headingToPoint(endHeading)));
      if (neighborIsReverseRoute) {
        continue;
      }

      const directionChange = previousDirection !== neighborHeading;
      const gScore =
        current.g +
        m_dist(neighbor.pos, current.pos) +
        (directionChange ? Math.pow(bendMultiplier, 3) : 0);

      const beenVisited = neighbor.visited;

      if (!beenVisited || gScore < neighbor.g) {
        const estBendCount = estimateSegmentCount(
          neighbor,
          end,
          neighborHeading,
          endHeading,
        );
        // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
        neighbor.visited = true;
        neighbor.parent = current;
        neighbor.h =
          m_dist(end.pos, neighbor.pos) +
          estBendCount * Math.pow(bendMultiplier, 2);
        neighbor.g = gScore;
        neighbor.f = neighbor.g + neighbor.h;
        if (!beenVisited) {
          // Pushing to heap will put it in proper place based on the 'f' value.
          open.push(neighbor);
        } else {
          // Already seen the node, but since it has been rescored we need to reorder it in the heap
          open.rescoreElement(neighbor);
        }
      }
    }
  }

  return null;
};

const pathTo = (start: Node, node: Node) => {
  let curr = node;
  const path = [];
  while (curr.parent) {
    path.unshift(curr);
    curr = curr.parent;
  }
  path.unshift(start);

  return path;
};

const m_dist = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/**
 * Create dynamically resizing, always touching
 * bounding boxes having a minimum extent represented
 * by the given static bounds.
 */
const generateDynamicAABBs = (
  a: Bounds,
  b: Bounds,
  common: Bounds,
  startDifference?: [number, number, number, number],
  endDifference?: [number, number, number, number],
  disableSideHack?: boolean,
): Bounds[] => {
  const [startUp, startRight, startDown, startLeft] = startDifference ?? [
    0, 0, 0, 0,
  ];
  const [endUp, endRight, endDown, endLeft] = endDifference ?? [0, 0, 0, 0];

  const first = [
    a[0] > b[2]
      ? a[1] > b[3] || a[3] < b[1]
        ? Math.min((a[0] + b[2]) / 2, a[0] - startLeft)
        : (a[0] + b[2]) / 2
      : a[0] > b[0]
      ? a[0] - startLeft
      : common[0] - startLeft,
    a[1] > b[3]
      ? a[0] > b[2] || a[2] < b[0]
        ? Math.min((a[1] + b[3]) / 2, a[1] - startUp)
        : (a[1] + b[3]) / 2
      : a[1] > b[1]
      ? a[1] - startUp
      : common[1] - startUp,
    a[2] < b[0]
      ? a[1] > b[3] || a[3] < b[1]
        ? Math.max((a[2] + b[0]) / 2, a[2] + startRight)
        : (a[2] + b[0]) / 2
      : a[2] < b[2]
      ? a[2] + startRight
      : common[2] + startRight,
    a[3] < b[1]
      ? a[0] > b[2] || a[2] < b[0]
        ? Math.max((a[3] + b[1]) / 2, a[3] + startDown)
        : (a[3] + b[1]) / 2
      : a[3] < b[3]
      ? a[3] + startDown
      : common[3] + startDown,
  ] as Bounds;
  const second = [
    b[0] > a[2]
      ? b[1] > a[3] || b[3] < a[1]
        ? Math.min((b[0] + a[2]) / 2, b[0] - endLeft)
        : (b[0] + a[2]) / 2
      : b[0] > a[0]
      ? b[0] - endLeft
      : common[0] - endLeft,
    b[1] > a[3]
      ? b[0] > a[2] || b[2] < a[0]
        ? Math.min((b[1] + a[3]) / 2, b[1] - endUp)
        : (b[1] + a[3]) / 2
      : b[1] > a[1]
      ? b[1] - endUp
      : common[1] - endUp,
    b[2] < a[0]
      ? b[1] > a[3] || b[3] < a[1]
        ? Math.max((b[2] + a[0]) / 2, b[2] + endRight)
        : (b[2] + a[0]) / 2
      : b[2] < a[2]
      ? b[2] + endRight
      : common[2] + endRight,
    b[3] < a[1]
      ? b[0] > a[2] || b[2] < a[0]
        ? Math.max((b[3] + a[1]) / 2, b[3] + endDown)
        : (b[3] + a[1]) / 2
      : b[3] < a[3]
      ? b[3] + endDown
      : common[3] + endDown,
  ] as Bounds;

  const c = commonAABB([first, second]);
  if (
    !disableSideHack &&
    first[2] - first[0] + second[2] - second[0] > c[2] - c[0] + 0.00000000001 &&
    first[3] - first[1] + second[3] - second[1] > c[3] - c[1] + 0.00000000001
  ) {
    const [endCenterX, endCenterY] = [
      (second[0] + second[2]) / 2,
      (second[1] + second[3]) / 2,
    ];
    if (b[0] > a[2] && a[1] > b[3]) {
      // BOTTOM LEFT
      const cX = first[2] + (second[0] - first[2]) / 2;
      const cY = second[3] + (first[1] - second[3]) / 2;

      if (cross({x: a[2], y: a[1]}, { x: a[0], y: a[3] }, { x: endCenterX, y: endCenterY }) > 0) {
        return [
          [first[0], first[1], cX, first[3]],
          [cX, second[1], second[2], second[3]],
        ];
      }

      return [
        [first[0], cY, first[2], first[3]],
        [second[0], second[1], second[2], cY],
      ];
    } else if (a[2] < b[0] && a[3] < b[1]) {
      // TOP LEFT
      const cX = first[2] + (second[0] - first[2]) / 2;
      const cY = first[3] + (second[1] - first[3]) / 2;

      if (cross({x: a[0], y: a[1]}, { x: a[2], y: a[3] }, { x: endCenterX, y: endCenterY }) > 0) {
        return [
          [first[0], first[1], first[2], cY],
          [second[0], cY, second[2], second[3]],
        ];
      }

      return [
        [first[0], first[1], cX, first[3]],
        [cX, second[1], second[2], second[3]],
      ];
    } else if (a[0] > b[2] && a[3] < b[1]) {
      // TOP RIGHT
      const cX = second[2] + (first[0] - second[2]) / 2;
      const cY = first[3] + (second[1] - first[3]) / 2;

      if (cross({x: a[2], y: a[1]}, { x: a[0], y: a[3] }, { x: endCenterX, y: endCenterY }) > 0) {
        return [
          [cX, first[1], first[2], first[3]],
          [second[0], second[1], cX, second[3]],
        ];
      }

      return [
        [first[0], first[1], first[2], cY],
        [second[0], cY, second[2], second[3]],
      ];
    } else if (a[0] > b[2] && a[1] > b[3]) {
      // BOTTOM RIGHT
      const cX = second[2] + (first[0] - second[2]) / 2;
      const cY = second[3] + (first[1] - second[3]) / 2;

      if (cross({x: a[0], y: a[1]}, { x: a[2], y: a[3] }, { x: endCenterX, y: endCenterY }) > 0) {
        return [
          [cX, first[1], first[2], first[3]],
          [second[0], second[1], cX, second[3]],
        ];
      }

      return [
        [first[0], cY, first[2], first[3]],
        [second[0], second[1], second[2], cY],
      ];
    }
  }

  return [first, second];
};

/**
 * Calculates the grid which is used as nodes at
 * the grid line intersections by the A* algorithm.
 *
 * NOTE: This is not a uniform grid. It is built at
 * various intersections of bounding boxes.
 */
const calculateGrid = (
  aabbs: Bounds[],
  start: Point,
  startHeading: Heading,
  end: Point,
  endHeading: Heading,
  common: Bounds,
): Grid => {
  const horizontal = new Set<number>();
  const vertical = new Set<number>();

  if (startHeading === HEADING_LEFT || startHeading === HEADING_RIGHT) {
    vertical.add(start.y);
  } else {
    horizontal.add(start.x);
  }
  if (endHeading === HEADING_LEFT || endHeading === HEADING_RIGHT) {
    vertical.add(end.y);
  } else {
    horizontal.add(end.x);
  }

  aabbs.forEach((aabb) => {
    horizontal.add(aabb[0]);
    horizontal.add(aabb[2]);
    vertical.add(aabb[1]);
    vertical.add(aabb[3]);
  });

  horizontal.add(common[0]);
  horizontal.add(common[2]);
  vertical.add(common[1]);
  vertical.add(common[3]);

  const _vertical = Array.from(vertical).sort((a, b) => a - b);
  const _horizontal = Array.from(horizontal).sort((a, b) => a - b);

  return {
    row: _vertical.length,
    col: _horizontal.length,
    data: _vertical.flatMap((y, row) =>
      _horizontal.map(
        (x, col): Node => ({
          f: 0,
          g: 0,
          h: 0,
          closed: false,
          visited: false,
          parent: null,
          addr: [col, row] as [number, number],
          pos: {x, y} as Point,
        }),
      ),
    ),
  };
};

const getDonglePosition = (
  bounds: Bounds,
  heading: Heading,
  point: Point,
): Point => {
  switch (heading) {
    case HEADING_UP:
      return {x: point.x, y: bounds[1]};
    case HEADING_RIGHT:
      return {x: bounds[2], y: point.y};
    case HEADING_DOWN:
      return {x: point.x, y: bounds[3]};
  }
  return {x: bounds[0], y: point.y};
};

const estimateSegmentCount = (
  start: Node,
  end: Node,
  startHeading: Heading,
  endHeading: Heading,
) => {
  if (endHeading === HEADING_RIGHT) {
    switch (startHeading) {
      case HEADING_RIGHT: {
        if (start.pos.x >= end.pos.x) {
          return 4;
        }
        if (start.pos.y === end.pos.y) {
          return 0;
        }
        return 2;
      }
      case HEADING_UP:
        if (start.pos.y > end.pos.y && start.pos.x < end.pos.x) {
          return 1;
        }
        return 3;
      case HEADING_DOWN:
        if (start.pos.y < end.pos.y && start.pos.x < end.pos.x) {
          return 1;
        }
        return 3;
      case HEADING_LEFT:
        if (start.pos.y === end.pos.y) {
          return 4;
        }
        return 2;
    }
  } else if (endHeading === HEADING_LEFT) {
    switch (startHeading) {
      case HEADING_RIGHT:
        if (start.pos.y === end.pos.y) {
          return 4;
        }
        return 2;
      case HEADING_UP:
        if (start.pos.y > end.pos.y && start.pos.x > end.pos.x) {
          return 1;
        }
        return 3;
      case HEADING_DOWN:
        if (start.pos.y < end.pos.y && start.pos.x > end.pos.x) {
          return 1;
        }
        return 3;
      case HEADING_LEFT:
        if (start.pos.x <= end.pos.x) {
          return 4;
        }
        if (start.pos.y === end.pos.y) {
          return 0;
        }
        return 2;
    }
  } else if (endHeading === HEADING_UP) {
    switch (startHeading) {
      case HEADING_RIGHT:
        if (start.pos.y > end.pos.y && start.pos.x < end.pos.x) {
          return 1;
        }
        return 3;
      case HEADING_UP:
        if (start.pos.y >= end.pos.y) {
          return 4;
        }
        if (start.pos.x === end.pos.x) {
          return 0;
        }
        return 2;
      case HEADING_DOWN:
        if (start.pos.x === end.pos.x) {
          return 4;
        }
        return 2;
      case HEADING_LEFT:
        if (start.pos.y > end.pos.y && start.pos.x > end.pos.x) {
          return 1;
        }
        return 3;
    }
  } else if (endHeading === HEADING_DOWN) {
    switch (startHeading) {
      case HEADING_RIGHT:
        if (start.pos.y < end.pos.y && start.pos.x < end.pos.x) {
          return 1;
        }
        return 3;
      case HEADING_UP:
        if (start.pos.x === end.pos.x) {
          return 4;
        }
        return 2;
      case HEADING_DOWN:
        if (start.pos.y <= end.pos.y) {
          return 4;
        }
        if (start.pos.x === end.pos.x) {
          return 0;
        }
        return 2;
      case HEADING_LEFT:
        if (start.pos.y < end.pos.y && start.pos.x > end.pos.x) {
          return 1;
        }
        return 3;
    }
  }
  return 0;
};

/**
 * Get neighboring points for a gived grid address
 */
const getNeighbors = ([col, row]: [number, number], grid: Grid) =>
  [
    gridNodeFromAddr([col, row - 1], grid),
    gridNodeFromAddr([col + 1, row], grid),
    gridNodeFromAddr([col, row + 1], grid),
    gridNodeFromAddr([col - 1, row], grid),
  ] as [Node | null, Node | null, Node | null, Node | null];

const gridNodeFromAddr = (
  [col, row]: [col: number, row: number],
  grid: Grid,
): Node | null => {
  if (col < 0 || col >= grid.col || row < 0 || row >= grid.row) {
    return null;
  }

  return grid.data[row * grid.col + col] ?? null;
};

/**
 * Get node for global point on canvas (if exists)
 */
const pointToGridNode = (point: Point, grid: Grid): Node | null => {
  for (let col = 0; col < grid.col; col++) {
    for (let row = 0; row < grid.row; row++) {
      const candidate = gridNodeFromAddr([col, row], grid);
      if (
        candidate &&
        point.x === candidate.pos.x &&
        point.y === candidate.pos.y
      ) {
        return candidate;
      }
    }
  }

  return null;
};

const commonAABB = (aabbs: Bounds[]): Bounds => [
  Math.min(...aabbs.map((aabb) => aabb[0])),
  Math.min(...aabbs.map((aabb) => aabb[1])),
  Math.max(...aabbs.map((aabb) => aabb[2])),
  Math.max(...aabbs.map((aabb) => aabb[3])),
];

/// #region Utils

const getBindableElementForId = (
  id: string,
  elementsMap: ElementsMap,
): DucBindableElement | null => {
  const element = elementsMap.get(id);
  if (element && isBindableElement(element)) {
    return element;
  }

  return null;
};

const normalizedArrowElementUpdate = (
  global: Point[],
  externalOffsetX?: number,
  externalOffsetY?: number,
) => {
  const offsetX = global[0].x;
  const offsetY = global[0].y;

  const points = global.map(
    (point) => ({x: point.x - offsetX, y: point.y - offsetY} as const),
  );

  return {
    points,
    x: offsetX + (externalOffsetX ?? 0),
    y: offsetY + (externalOffsetY ?? 0),
    ...getSizeFromPoints(points),
  };
};

/// If last and current segments have the same heading, skip the middle point
const simplifyElbowArrowPoints = (points: Point[]): Point[] =>
  points
    .slice(2)
    .reduce(
      (result, point) =>
        arePointsEqual(
          vectorToPoint(
            vectorToHeading(
              pointToVector(result[result.length - 1], result[result.length - 2])
            ),
          ),
          vectorToPoint(
            vectorToHeading(pointToVector(point, result[result.length - 1]))
          )
        )
          ? [...result.slice(0, -1), point]
          : [...result, point],
      [
        points[0] ?? { x: 0, y: 0 },
        points[1] ?? { x: 1, y: 0 },
      ]
    );

const neighborIndexToHeading = (idx: number): Heading => {
  switch (idx) {
    case 0:
      return HEADING_UP;
    case 1:
      return HEADING_RIGHT;
    case 2:
      return HEADING_DOWN;
  }
  return HEADING_LEFT;
};

const getGlobalPoint = (
  fixedPointRatio: Point | undefined | null,
  initialPoint: Point,
  otherPoint: Point,
  elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
  boundElement?: DucBindableElement | null,
  hoveredElement?: DucBindableElement | null,
  isDragging?: boolean,
): Point => {
  if (isDragging) {
    if (hoveredElement) {
      const snapPoint = getSnapPoint(
        initialPoint,
        otherPoint,
        hoveredElement,
        elementsMap,
      );

      return snapToMid(hoveredElement, snapPoint);
    }

    return initialPoint;
  }

  if (boundElement) {
    const fixedGlobalPoint = getGlobalFixedPointForBindableElement(
      fixedPointRatio || { x:0, y:0 },
      boundElement,
    );

    // NOTE: Resize scales the binding position point too, so we need to update it
    return Math.abs(
      distanceToBindableElement(boundElement, fixedGlobalPoint, elementsMap) -
        FIXED_BINDING_DISTANCE,
    ) > 0.01
      ? getSnapPoint(initialPoint, otherPoint, boundElement, elementsMap)
      : fixedGlobalPoint;
  }

  return initialPoint;
};

const getSnapPoint = (
  point: Point,
  otherPoint: Point,
  element: DucBindableElement,
  elementsMap: ElementsMap,
) =>
  bindPointToSnapToElementOutline(
    isRectanguloidElement(element)
      ? avoidRectangularCorner(element, point)
      : point,
    otherPoint,
    element,
    elementsMap,
  );

const getBindPointHeading = (
  point: Point,
  otherPoint: Point,
  elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
  hoveredElement: DucBindableElement | null | undefined,
  origPoint: Point,
) =>
  getHeadingForElbowArrowSnap(
    point,
    otherPoint,
    hoveredElement,
    hoveredElement &&
      aabbForElement(
        hoveredElement,
        Array(4).fill(
          distanceToBindableElement(hoveredElement, point, elementsMap),
        ) as [number, number, number, number],
      ),
    elementsMap,
    origPoint,
  );


  // Utility function to convert Point to tuple if required
// Utility function to convert Point to a tuple if needed

const getHoveredElements = (
  origStartGlobalPoint: Point,
  origEndGlobalPoint: Point,
  elementsMap: NonDeletedSceneElementsMap | SceneElementsMap,
) => {
  // TODO: Might be a performance bottleneck and the Map type
  // remembers the insertion order anyway...
  const nonDeletedSceneElementsMap = toBrandedType<NonDeletedSceneElementsMap>(
    new Map([...elementsMap].filter((el) => !el[1].isDeleted)),
  );
  const elements = Array.from(elementsMap.values());
  return [
    getHoveredElementForBinding(
      origStartGlobalPoint as { x: number; y: number },
      elements,
      nonDeletedSceneElementsMap,
      true,
    ),
    getHoveredElementForBinding(
      origEndGlobalPoint as { x: number; y: number },
      elements,
      nonDeletedSceneElementsMap,
      true,
    ),
  ];
};

