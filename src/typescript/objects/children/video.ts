
import { DucObject } from "../object";

export interface VideoObject extends DucObject {

    source: string; // URL

    currentTime: number;
    duration: number;
    volume: number;
    playbackRate: number;
    loop: boolean;
    speed: number;

}