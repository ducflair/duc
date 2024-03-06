import { DucObject } from "../object";

export interface TextObject extends DucObject {

    content: string;
    link: string;

    color: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: "normal" | "bold" | "bolder" | "lighter" | number;
    fontStyle: "normal" | "italic" | "oblique";
    textDecoration: "none" | "underline" | "overline" | "line-through";
    textAlign: "left" | "right" | "center" | "justify";
    textBaseline: "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";
    lineHeight: number;
    textIndent: number;
    letterSpacing: number;
    textTransform: "none" | "capitalize" | "uppercase" | "lowercase";
    whiteSpace: "normal" | "nowrap" | "pre" | "pre-line" | "pre-wrap";
    wordSpacing: number;
    textOverflow: "clip" | "ellipsis";
    wordWrap: "normal" | "break-word";
    wordBreak: "normal" | "break-all" | "keep-all";
    overflowWrap: "normal" | "break-word";
    hyphens: "none" | "manual" | "auto";
    direction: "ltr" | "rtl";
    unicodeBidi: "normal" | "embed" | "bidi-override";
    writingMode: "horizontal-tb" | "vertical-rl" | "vertical-lr";
    textOrientation: "mixed" | "upright" | "sideways";
    textCombineUpright: "none" | "all";
    textEmphasis: "none" | string;
    textShadow: "none" | string;
    textStroke: "none" | string;
}