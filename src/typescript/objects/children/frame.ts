import { DucObject } from '../object';

export interface FrameObject extends DucObject {
    
    objects: DucObject[];
    
    color: string;

    border: boolean;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    borderStyle: "solid" | "dotted" | "dashed" | "double" | "groove" | "ridge" | "inset" | "outset" | "none" | "hidden";
    
}