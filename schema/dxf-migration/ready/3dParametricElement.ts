import { _DucElementBase } from "./types";

// TODO: Careful because STEP, STL and STP files are external and need references through filesIds and BinaryFiles
export type Duc3dParametricElement = _DucElementBase & {
  type: "3dParametric";

  /**
   * Replicad parametric model code as a string.
   * This should be valid JavaScript code using replicad's API.
   */
  parametricModel: string;

  /**
   * Optional: Parameters for the model, if your parametricModel supports them.
   */
  modelParams?: Record<string, any>;
}