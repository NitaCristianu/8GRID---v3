import { v4 } from "uuid";
import { rgb } from "./management";

export type segment_render_mode = "only-segment" | "only-line" | "line-segment" | "circle";

export interface theme {
    background : string | rgb,
    secondary : string | rgb,
    accent : string | rgb,
    name : string
}

export interface func {
    expression : string,
    color? : rgb | string
}

export interface Graph {
    functions : func[],
    range_x : number,
    range_y : number,
    resolution : number,
    id : string,
    x : number,
    y : number
}

export interface ePoint {
    x: number,
    y: number,
    tag : string,
    id: string,
    visible? : boolean,
    color : string
}

export interface eSegment {
    from : string,
    to : string,
    id : string,
    color : string,
    renderMode : segment_render_mode
}

export interface ePoints_Calc {
    formula : string,
    tag : string,
    id: string,
    visible? : boolean,
    color : string
}

export interface Label {
    top : number,
    left : number,
    content : string,
    id : string
}

export interface Tag {
    name: string;
    open: string;
    closing: string;
}

export interface Fragment {
    content : string,
    type : string
}

export interface variable {
    name : string,
    value : number
}

export const point_prop = [
    "color",
    "tag",
]

export const point_prop_calc = [
    "color",
    "tag",
    "formula"
]

export const segment_props = [
    "color",
]

export const total_props = [
    {id : "color", type : "color", default : "rgba(231, 255, 255, .995)"},
    {id : "tag", type : "char", default : ""},
    {id : "visible", type : "checkbox", default : true},
    {id : "formula", type : "text", default : "(0,0)"}
]

export const tips = {
    ePoint : "Click anywhere to insert a point",
    eSegment : "Select two points",
    eCenter : "Select two points",
    ePerpendicular : "Select two points"
}