import { expect, mock, test } from "bun:test";
import {
  applyModelExplode,
  configureModelMotion,
  readModelMotion,
} from "../src/utils/modelMotion";

test("IFC uses only authored products including all of their material groups", () => {
  const frame = {
    id: "ifc-model",
    parts: ["a", "b"].map((id) => ({
      id,
      ifc: { globalId: "door", expressID: 42 },
    })),
    animation: { speed: 2, tracks: [["door", "rz", [0, 4], [0, 90]]] },
    explode: [["42", "tx", [0, 1], [0, 5]]],
  };
  const viewer = {
    addRotationTrack: mock(),
    addTranslationTrack: mock(),
    initAnimation: mock(),
    explode: mock(),
    setRelativeTime: mock(),
    setExplode: mock(),
    rendered: { nestedGroup: { groups: { a: {}, b: {} } } },
  };
  configureModelMotion(viewer, frame);
  expect(viewer.addRotationTrack.mock.calls).toEqual([
    ["a", "z", [0, 2], [0, 90]],
    ["b", "z", [0, 2], [0, 90]],
  ]);
  applyModelExplode(viewer, true, 1);
  applyModelExplode(viewer, true, 3);
  expect(viewer.addTranslationTrack.mock.calls).toEqual([
    ["a", "x", [0, 1], [0, 15]],
    ["b", "x", [0, 1], [0, 15]],
  ]);
  expect(viewer.setRelativeTime.mock.calls).toEqual([[1 / 3], [1]]);
  applyModelExplode(viewer, false, 0);
  expect(viewer.setExplode).toHaveBeenCalledWith(false);
  configureModelMotion(viewer, { id: "ifc-model", parts: [] });
  applyModelExplode(viewer, true, 3);
  expect(viewer.explode).not.toHaveBeenCalled();
});
test("ordinary assemblies reach triple the default displacement and reject malformed tracks", () => {
  const viewer = { explode: mock(), setRelativeTime: mock() };
  configureModelMotion(viewer, {});
  applyModelExplode(viewer, true, 3);
  expect(viewer.explode).toHaveBeenCalledWith(2, 1, 5.5);
  expect(viewer.setRelativeTime).toHaveBeenCalledWith(1);
  expect(
    readModelMotion({
      animation: [
        [
          "a",
          "q",
          [0, 1],
          [
            [1, 0, 0],
            [0, 1, 0],
          ],
        ],
      ],
    }).animation,
  ).toEqual([]);
});

test("authored explosion directions preserve their signed offsets and distances", () => {
  const viewer = {
    addPositionTrack: mock(),
    initAnimation: mock(),
    setRelativeTime: mock(),
  };
  configureModelMotion(viewer, {
    explode: {
      directions: [{ path: "part", direction: [0, -1, 0], distance: 8 }],
    },
  });
  applyModelExplode(viewer, true, 3);
  expect(viewer.addPositionTrack).toHaveBeenCalledWith(
    "part",
    [0, 1],
    [
      [0, 0, 0],
      [0, -24, 0],
    ],
  );
});
