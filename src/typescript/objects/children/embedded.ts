import { DucObject } from "../object";

export interface EmbeddedObject extends DucObject {
    

    border: boolean;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    borderStyle: "solid" | "dotted" | "dashed" | "double" | "groove" | "ridge" | "inset" | "outset" | "none" | "hidden";
    
}




function stringify(object: EmbeddedObject): string {
    return JSON.stringify(object);
}

function parse(json: string): EmbeddedObject {
    return JSON.parse(json);
}

function create(props: EmbeddedObject): EmbeddedObject {
    return {
        ...props,
        type: "vector"
    };
}
