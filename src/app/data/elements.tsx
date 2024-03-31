import { atom } from "jotai";
import { Graph, Label, ePoint, ePoints_Calc, eSegment, segment_render_mode, theme } from './props';
import { v4 } from "uuid";
import { expression } from "three/examples/jsm/nodes/Nodes.js";

export const ePoints_data = atom<ePoint[]>([
    {
        x: 550,
        y: 600,
        id: "a",
        tag: "A",
        color: "rgba(231, 255, 255, .995)"
    },
    {
        x: 800,
        y: 800,
        id: "b",
        tag: "B",
        color: "rgba(231, 255, 255, .995)"
    },
    {
        x: 900,
        y: 500,
        id: "c",
        tag: "C",
        color: "rgba(231, 255, 255, .995)"
    },
])

export const eSegments_data = atom<eSegment[]>([
    {
        from: "a",
        to: "b",
        id: "ab",
        color: "rgba(231, 255, 255, .995)",
        renderMode: "circle"
    },
    {
        from: "b",
        to: "c",
        id: "bc",
        color: "rgba(231, 255, 255, .995)",
        renderMode: "only-segment"
    },

]);

export const ePoints_Calc_data = atom<ePoints_Calc[]>([
    {
        id: "m",
        formula: "A + (B-A) * a",
        color: "rgb(202, 60, 60)",
        tag: "M",
    },
    {
        id: "n",
        formula: "B + (C-B) * a",
        color: "rgb(202, 60, 60)",
        tag: "N"
    },
    {
        id: "p",
        formula: "M + (N-M) * a",
        color: "rgb(60, 202, 164)",
        tag: "P"
    },
]);

export const labels_data = atom<Label[]>([
    {
        top: 200,
        left: 200,
        content: `**Hello World!**
        It s an ecuation
        <f>\\pi</f>
        <s>var a from 0 to 1 at 0.5</s>
        `,
        id: v4(),
    }
]);

// export const GRAPHS = atom<Graph[]>([]);

export const GRAPHS = atom<Graph[]>([{
    functions: [{
        expression: "Math.sin( x ) * a * 10",
        color: "rgb(59, 203, 205)"
    }, {
        expression: "x * 3 * a",
        color: "rgb(212, 222, 73)"
    },],
    range_x: 3 * Math.PI,
    range_y: 14,
    resolution : 30,
    id : v4(),
    x : 500,
    y : 500
}]);

export const themes: theme[] = [
    {
        accent: "rgb(246, 252, 251)_",
        secondary: "rgb(10, 13, 20)",
        background: "rgb(94, 128, 215)",
        name: "baby blue"
    },
    {
        accent: "rgb(12, 18, 35)_",
        secondary: "rgb(93, 97, 128)",
        background: "rgb(230, 233, 255)",
        name: "snow"
    },
    {
        accent: "rgb(246, 252, 251)_",
        secondary: "rgb(5, 31, 20)",
        background: "rgb(41, 180, 133)",
        name: "dragon red"
    },
]