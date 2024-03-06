import { MetricSystem, ImperialSystem } from './utils/measurements';

export interface DucObject {

    id: string;
    type: "text" | "image" | "vector" | "frame" | "embedded" | "video";  // Possibly Audio in the Future
    
    theme: string; // TODO: Investigate this implementation

    scope: MetricSystem | ImperialSystem;

    x: number;
    y: number;
    width: number;
    height: number;
    isLocked: boolean;
    
    createdAt: Date;
    updatedAt: Date;

}
