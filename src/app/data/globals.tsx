import { atom } from "jotai";
import { Graph, variable } from "./props";

export type mode = "menu" | "selection" | "euclidian" | "graph";
export type euclidian = null | "ePoint" | "eSegment" | "eCenter" | "ePerpendicular";
export type elements = euclidian | "label"

export interface vec2D { x : number, y : number }
export const CELL_SIZE = 90;
export const DRAG_SPEED = 80;
export const POINT_RADIUS = 20;
export const SEGMENT_WIDTH = 7;
export const GRID_POSITION = atom<vec2D>({x : 0, y : 0})
export const SELECTED = atom<string[]>([]);
export const CAN_SELECT = atom<boolean>(true);
export const SELECT_RECT = atom<vec2D[]>([]);
export const SHOW_GRID = atom<boolean>(true);
export const MODE = atom<mode>("menu");
export const ACCENT = atom<string>("rgb(246, 252, 251)");
export const BACKGROUND = atom<string>("rgb(43, 107, 217)");
export const SECONDARY = atom<string>("rgb(10, 13, 20)");
export const VARIABLES = atom<variable[]>([]);
export const SELECTED_GRAPH = atom<string>("");
export const HOVERING_GRAPHS = atom<string[]>([]);
export const HOVERING_LABELS = atom<string[]>([]);