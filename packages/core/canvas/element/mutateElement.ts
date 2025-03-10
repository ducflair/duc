import type { DucElement } from "./types";
import Scene from "../scene/Scene";
import { getSizeFromPoints } from "../points";
import { randomInteger } from "../random";
import type { Point } from "../types";
import { getUpdatedTimestamp } from "../utils";
import type { Mutable } from "../utility-types";
import { ShapeCache } from "../scene/ShapeCache";

export type ElementUpdate<TElement extends DucElement> = Omit<
  Partial<TElement>,
  "id" | "version" | "versionNonce" | "updated"
>;

// This function tracks updates of text elements for the purposes for collaboration.
// The version is used to compare updates when more than one user is working in
// the same drawing. Note: this will trigger the component to update. Make sure you
// are calling it either from a React event handler or within unstable_batchedUpdates().
export const mutateElement = <TElement extends Mutable<DucElement>>(
  element: TElement,
  updates: ElementUpdate<TElement>,
  informMutation = true,
): TElement => {
  let didChange = false;
  // casting to any because can't use `in` operator
  // (see https://github.com/microsoft/TypeScript/issues/21732)
  const { points, fileId } = updates as any;

  if (typeof points !== "undefined") {
    updates = { ...getSizeFromPoints(points), ...updates };
  }

  for (const key in updates) {
    const value = (updates as any)[key];
    if (typeof value !== "undefined") {
      if (
        (element as any)[key] === value &&
        // if object, always update because its attrs could have changed
        // (except for specific keys we handle below)
        (typeof value !== "object" ||
          value === null ||
          key === "groupIds" ||
          key === "scale")
      ) {
        continue;
      }

      if (key === "scale") {
        const prevScale = (element as any)[key];
        const nextScale = value;
        if (prevScale[0] === nextScale[0] && prevScale[1] === nextScale[1]) {
          continue;
        }
      } else if (key === "points") {
        const prevPoints = (element as any)[key];
        const nextPoints = value;
        if (prevPoints.length === nextPoints.length) {
          let didChangePoints = false;
          let index = prevPoints.length;
          while (--index >= 0) {
            if (!comparePoints(prevPoints[index], nextPoints[index])) {
              didChangePoints = true;
              break;
            }
          }
          if (!didChangePoints) {
            continue;
          }
        }
      }

      (element as any)[key] = value;
      didChange = true;
    }
  }

  if (!didChange) {
    return element;
  }

  if (
    typeof updates.height !== "undefined" ||
    typeof updates.width !== "undefined" ||
    typeof fileId != "undefined" ||
    typeof points !== "undefined"
  ) {
    ShapeCache.delete(element);
  }

  element.version++;
  element.versionNonce = randomInteger();
  element.updated = getUpdatedTimestamp();

  if (informMutation) {
    Scene.getScene(element)?.triggerUpdate();
  }

  return element;
};

export const newElementWith = <TElement extends DucElement>(
  element: TElement,
  updates: ElementUpdate<TElement>,
  /** pass `true` to always regenerate */
  force = false,
): TElement => {
  let didChange = false;
  for (const key in updates) {
    const value = (updates as any)[key];
    if (typeof value !== "undefined") {
      if (
        (element as any)[key] === value &&
        // if object, always update because its attrs could have changed
        (typeof value !== "object" || value === null)
      ) {
        continue;
      }
      didChange = true;
    }
  }

  if (!didChange && !force) {
    return element;
  }

  return {
    ...element,
    ...updates,
    updated: getUpdatedTimestamp(),
    version: element.version + 1,
    versionNonce: randomInteger(),
  };
};

/**
 * Mutates element, bumping `version`, `versionNonce`, and `updated`.
 *
 * NOTE: does not trigger re-render.
 */
export const bumpVersion = <T extends Mutable<DucElement>>(
  element: T,
  version?: DucElement["version"],
) => {
  element.version = (version ?? element.version) + 1;
  element.versionNonce = randomInteger();
  element.updated = getUpdatedTimestamp();
  return element;
};


const comparePoints = (prevPoint: Point, nextPoint: Point): boolean => {
  if (prevPoint.x !== nextPoint.x || prevPoint.y !== nextPoint.y) {
    return false;
  }
  
  if (prevPoint.mirroring !== nextPoint.mirroring) {
    return false;
  }

  if (prevPoint.isCurve !== nextPoint.isCurve) {
    return false;
  }

  if (prevPoint.borderRadius !== nextPoint.borderRadius) {
    return false;
  }

  // Compare handles if they exist
  if (prevPoint.handleIn && nextPoint.handleIn) {
    if (prevPoint.handleIn.x !== nextPoint.handleIn.x || 
        prevPoint.handleIn.y !== nextPoint.handleIn.y) {
      return false;
    }
  } else if (prevPoint.handleIn !== nextPoint.handleIn) {
    return false;
  }

  if (prevPoint.handleOut && nextPoint.handleOut) {
    if (prevPoint.handleOut.x !== nextPoint.handleOut.x || 
        prevPoint.handleOut.y !== nextPoint.handleOut.y) {
      return false;
    }
  } else if (prevPoint.handleOut !== nextPoint.handleOut) {
    return false;
  }

  return true;
};