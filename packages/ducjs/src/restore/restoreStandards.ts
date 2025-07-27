import { RestoredDataState } from "ducjs/restore/restoreDataState";
import { Standard } from "ducjs/technical";



export const restoreStandards = (
  standards: any
): RestoredDataState["standards"] => {
  if(standards === undefined || standards === null) {
    // This should not happen, but if it does, we return the default standards
    // Add the default standards
  }
}

 /**
  * Checks if a given id is present in the standards array.
  * Returns true if found, false otherwise.
  */
 export const isStandardIdPresent = (id: string, standards: Standard[]): boolean => {
   if (!Array.isArray(standards) || typeof id !== "string") return false;
   return standards.some(s => typeof s.id === "string" && s.id === id);
 };
