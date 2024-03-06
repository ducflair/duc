import { DucObject } from "../object";

export interface VectorObject extends DucObject {
    
    
    color: string;

    border: boolean;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    borderStyle: "solid" | "dotted" | "dashed" | "double" | "groove" | "ridge" | "inset" | "outset" | "none" | "hidden";
    
}




function stringify(object: VectorObject): string {
    return JSON.stringify(object);
}

function parse(json: string): VectorObject {
    return JSON.parse(json);
}

export function create(props: VectorObject): VectorObject {
    return {
        ...props,
        type: "vector"
    };
}
