import { ePoint, ePoints_Calc, eSegment, Fragment, Tag, variable } from './props';
import { CELL_SIZE, GRID_POSITION, POINT_RADIUS, SEGMENT_WIDTH, vec2D } from './globals';
import { useAtom } from "jotai";
import { v4 } from "uuid";

export interface rgb { r: number, g: number, b: number };

export function isEPointsCalc(p: ePoint | ePoints_Calc): p is ePoints_Calc {
    return (p as ePoints_Calc).formula !== undefined;
}

export function getCoords(p: ePoint): vec2D {
    return { x: p.x || 0, y: p.y || 0 };
}

export function decomposeSegment(segment: eSegment, points: ePoint[], points_calc: ePoints_Calc[]) {
    let p1_index = points.findIndex(p => p.id == segment.from);
    let p2_index = points.findIndex(p => p.id == segment.to);
    var p1_calc = false, p2_calc = false;
    if (p1_index == -1) {
        p1_index = points_calc.findIndex(p => p.id == segment.from);
        p1_calc = true;
    }
    if (p2_index == -1) {
        p2_calc = true;
        p2_index = points_calc.findIndex(p => p.id == segment.to);
    }
    return [p1_calc ? points_calc[p1_index] : points[p1_index], p2_calc ? points_calc[p2_index] : points[p2_index]];
}

export function getSegmentCoords(segment: eSegment, points: ePoint[], points_calc: ePoints_Calc[], variables: variable[]) {
    const decomposed = decomposeSegment(segment, points, points_calc);
    return decomposed.map(v => {
        if (v == undefined) return { x: 0, y: 0 };
        let p_index = points.findIndex(p => p.id == v.id);
        let x = 0, y = 0;
        if (p_index == -1) {
            p_index = points_calc.findIndex(p => p.id == v.id);
            if (p_index > -1) {
                const pos = ObtainPosition(points_calc[p_index].formula, points, points_calc, variables);
                x = pos.x;
                y = pos.y;
            }
        } else {
            const pos = getCoords(v as ePoint);
            x = pos.x;
            y = pos.y;
        }
        return { x: x, y: y };
    });
}

export function getUniqueTag(points: ePoint[], points_calc: ePoints_Calc[]) {
    var tag: string = "a";
    var i = 0;
    let letters = 'abcdefghijklmnopqrstuvwxyz';
    letters = letters.toUpperCase();
    while (i < letters.length) {
        tag = letters.at(i % letters.length) as string;
        var i1 = points.findIndex(p => p.tag == tag);
        var i2 = points_calc.findIndex(p => p.tag == tag);
        if (i1 == -1 && i2 == -1) {
            return tag;
        }
        i++;
    }
    letters = letters.toLowerCase();
    while (i < letters.length) {
        tag = letters.at(i % letters.length) as string;
        var i1 = points.findIndex(p => p.tag == tag);
        var i2 = points_calc.findIndex(p => p.tag == tag);
        if (i1 == -1 && i2 == -1) {
            return tag;
        }
        i++;
    }
    return " ";
}

export function toLocal(pos: vec2D, offset: vec2D): vec2D {
    if (!pos) return offset;
    return { x: pos.x + offset.x, y: pos.y + offset.y }
}

export function toGlobal(pos: vec2D, offset: vec2D): vec2D {
    if (!pos) return { x: -offset.x, y: -offset.y };
    return { x: pos.x - offset.x, y: pos.y - offset.y }
}

export function AddPoint(pos: vec2D, points: ePoint[], points_calc: ePoints_Calc[]) {
    return [...points, { color: "rgba(231, 255, 255, .995)", x: pos.x, y: pos.y, id: v4(), tag: getUniqueTag(points, points_calc) }];
}

export function Distance_Squared(A: vec2D, B: vec2D) {
    const a = A.x - B.x;
    const b = A.y - B.y;
    return a * a + b * b;
}

export function GetClosestPoint(pos: vec2D, points: ePoint[]) {
    // assuming points.lenght > 0
    var closest_id = "";
    var closest_distance = Infinity;
    for (const index in points) {
        const p = points[index];
        const dist = Distance_Squared(getCoords(p), pos)
        if (dist < closest_distance) {
            closest_distance = dist;
            closest_id = p.id;
        }
    }
    return { closest_id, closest_distance };
}
export function GetClosestPointCalc(pos: vec2D, pointsCalc: ePoints_Calc[], points: ePoint[], variables: variable[]) {
    var closest_id = "";
    var closest_distance = Infinity;
    for (const index in pointsCalc) {
        const p = pointsCalc[index];
        const dist = Distance_Squared(ObtainPosition(p.formula, points, pointsCalc, variables), pos);
        if (dist < closest_distance) {
            closest_distance = dist;
            closest_id = p.id;
        }
    }
    return { closest_id, closest_distance };
}

export function GetHoveringPoint(pos: vec2D, points: ePoint[], threshold: number = 1) {
    const { closest_id, closest_distance } = GetClosestPoint(pos, points);
    var exists = false;
    if (closest_distance >= 0 && closest_distance < POINT_RADIUS * POINT_RADIUS * threshold) {
        return { isHovering: true, Hovering_id: closest_id };
    }
    return { isHovering: false, Hovering_id: "" };
}

export function GetHoveringPointCalc(pos: vec2D, pointsCalc: ePoints_Calc[], points: ePoint[], variables: variable[], threshold: number = 1) {
    const { closest_id, closest_distance } = GetClosestPointCalc(pos, pointsCalc, points, variables);
    var exists = false;
    if (closest_distance >= 0 && closest_distance < POINT_RADIUS * POINT_RADIUS * threshold) {
        return { isHovering: true, Hovering_id: closest_id };
    }
    return { isHovering: false, Hovering_id: "" };
}

export function GetAnyHoveringPoint(pos: vec2D, points: ePoint[], pointsCalc: ePoints_Calc[], variables: variable[], threshold: number = 1) {
    const a = GetHoveringPoint(pos, points, threshold);
    const b = GetHoveringPointCalc(pos, pointsCalc, points, variables, threshold);
    const isB = b.isHovering;
    return {
        isHovering: a.isHovering || b.isHovering,
        Hovering_id: isB ? b.Hovering_id : a.Hovering_id,
        isCalculated: isB
    }
}

export function DistanceToLineSquared(point: vec2D, lineStart: vec2D, lineEnd: vec2D) {
    // Create vectors
    let v = { x: lineEnd.x - lineStart.x, y: lineEnd.y - lineStart.y };
    let w = { x: point.x - lineStart.x, y: point.y - lineStart.y };

    // Compute dot product
    let c1 = w.x * v.x + w.y * v.y;
    let c2 = v.x * v.x + v.y * v.y;
    // Compute projection point
    let b = c1 / c2;
    let projection = { x: lineStart.x + b * v.x, y: lineStart.y + b * v.y };

    // Compute distance from point to projection
    let dx = point.x - projection.x;
    let dy = point.y - projection.y;
    return dx * dx + dy * dy;
}

export function clmap(num: number, min: number, max: number) { return Math.min(Math.max(num, min), max) };

export function DistanceToSegmentSquared(pos: vec2D, segment: eSegment, points: ePoint[], points_calc: ePoints_Calc[], variables: variable[]) {
    const [pos1, pos2] = getSegmentCoords(segment, points, points_calc, variables);

    if (segment.renderMode == "circle"){
        const center = {
            x : ( pos1.x + pos2.x ) / 2,
            y : ( pos1.y + pos2.y ) / 2
        }
        var dist = Distance_Squared(pos, center) - Distance_Squared(pos1, center);
        dist = Math.abs(dist / 20);
        return dist;
    }
    if (segment.renderMode == "only-line" || segment.renderMode == "line-segment") {
        const dist = DistanceToLineSquared(pos, pos1, pos2);
        return dist;
    }


    if (pos2.x - pos1.x == 0)
        return Math.pow(pos.x - pos1.x, 2);
    var m = (pos2.y - pos1.y) / (pos2.x - pos1.x);

    // Calculate the squared perpendicular distance
    var d = Math.pow(m * pos.x - pos.y + pos1.y - m * pos1.x, 2) / (m ** 2 + 1);


    // Check if the perpendicular from P intersects AB
    var dotproduct = (pos.x - pos1.x) * (pos2.x - pos1.x) + (pos.y - pos1.y) * (pos2.y - pos1.y);
    if (dotproduct < 0) {
        return Math.pow(pos.x - pos1.x, 2) + Math.pow(pos.y - pos1.y, 2);
    }
    var squaredlengthba = Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2);
    if (dotproduct > squaredlengthba) {
        return Math.pow(pos.x - pos2.x, 2) + Math.pow(pos.y - pos2.y, 2);
    }
    return d;
}

export function GetClosestSegment(pos: vec2D, points: ePoint[], points_calc: ePoints_Calc[], segments: eSegment[], variables: variable[]) {
    var closest_id = "";
    var closest_distance = Infinity;
    for (const index in segments) {
        const s = segments[index];
        if (!s) continue;
        const dist = DistanceToSegmentSquared(pos, s, points, points_calc, variables);
        if (dist < closest_distance) {
            closest_distance = dist;
            closest_id = s.id;
        }
    }
    return { closest_id, closest_distance };
}

export function GetHoveringSegment(pos: vec2D, points: ePoint[], points_calc: ePoints_Calc[], segments: eSegment[], variables: variable[], threshold = 1) {
    if (segments.length == 0) return { isHovering: false, Hovering_id: "" };
    const { closest_id, closest_distance } = GetClosestSegment(pos, points, points_calc, segments, variables);
    if (closest_distance >= 0 && closest_distance < SEGMENT_WIDTH * SEGMENT_WIDTH * threshold) {
        return { isHovering: true, Hovering_id: closest_id };
    }
    return { isHovering: false, Hovering_id: "" };
}

export function GetHovering(pos: vec2D, points: ePoint[], segments: eSegment[], points_calc: ePoints_Calc[], variables: variable[], threshold = 1) {
    const { isHovering: isHoveringPoint, Hovering_id: Hovering_id_Point } = GetHoveringPoint(pos, points, threshold);
    if (isHoveringPoint) return { isHovering: isHoveringPoint, Hovering_id: Hovering_id_Point };
    const { isHovering: isHoveringPointCalc, Hovering_id: Hovering_id_Point_Calc } = GetHoveringPointCalc(pos, points_calc, points, variables, threshold);
    if (isHoveringPointCalc) return { isHovering: isHoveringPointCalc, Hovering_id: Hovering_id_Point_Calc };
    const { isHovering: isHoveringSegment, Hovering_id: Hovering_id_Segment } = GetHoveringSegment(pos, points, points_calc, segments, variables, threshold);
    return { isHovering: isHoveringSegment, Hovering_id: Hovering_id_Segment };
}

function isSurroundedByLetters(str: string, letter: string) {
    if (!str.includes(letter)) {
        return false;
    }
    const regex = new RegExp(`[a-z]${letter}[a-z]`, 'i');
    return regex.test(str);
}

export function ReplaceLetter(str: string, letter: string, value: number | string) {
    if (!str.includes(letter)) return str;
    const regex = new RegExp(`([^a-z()]|^)${letter}(?=[^a-z()]|$)`, 'ig');
    return str.replace(regex, (_, before) => `${before}${value}`);
}


export function IsPointInRect(point: vec2D, rect: vec2D[]) {
    const from = rect[0];
    const to = rect[1];
    const topleft = {
        x: Math.min(from.x, to.x),
        y: Math.min(from.y, to.y)
    };
    const bottomRight = {
        x: Math.max(from.x, to.x),
        y: Math.max(from.y, to.y)
    }

    return (
        topleft.x <= point.x &&
        bottomRight.x >= point.x &&
        topleft.y <= point.y &&
        bottomRight.y >= point.y
    )
}

export function IsSegmentInRect(segment: eSegment, points: ePoint[], points_calc: ePoints_Calc[], rect: vec2D[], variables: variable[]) {
    const from = rect[0];
    const to = rect[1];
    const [pos1, pos2] = getSegmentCoords(segment, points, points_calc, variables);
    const topleft = {
        x: Math.min(from.x, to.x),
        y: Math.min(from.y, to.y)
    };
    const bottomRight = {
        x: Math.max(from.x, to.x),
        y: Math.max(from.y, to.y)
    }
    return (pos1.x >= topleft.x && pos1.x <= bottomRight.x && pos1.y >= topleft.y && pos1.y <= bottomRight.y) &&
        (pos2.x >= topleft.x && pos2.x <= bottomRight.x && pos2.y >= topleft.y && pos2.y <= bottomRight.y)
}

export function EqualSegments(a: eSegment, b: eSegment) {
    return (a.from == b.from && a.to == b.to) || (a.to == b.from && a.from == b.to);
}

export function DoesSegmentExist(segment: eSegment, segments: eSegment[]) {
    let exists = false;

    segments.forEach(random_segment => {
        if (EqualSegments(random_segment, segment)) exists = true;
    })
    return exists;
}

export function getUniqueLetters(str: string) {
    let uniqueLetters = '';
    for (let i = 0; i < str.length; i++) {
        if (str[i].match(/[a-z]/i) && !uniqueLetters.includes(str[i])) {
            uniqueLetters += str[i];
        }
    }
    return uniqueLetters;
}

export function hasCommonLetter(str1: string, str2: string) {
    for (let i = 0; i < str1.length; i++) {
        if (str1[i].match(/[A-Za-z]/) && str2.includes(str1[i])) {
            return true;
        }
    }
    return false;
}

export function canBeEvaluated(str: string) {
    try {
        eval(str);
        return true;
    } catch (error) {
        return false;
    }
}

export function ObtainPosition(formula: string, points: ePoint[], points_calc: ePoints_Calc[], variables: variable[]) {
    if (formula.length == 0) return { x: 0, y: 0 };
    const original = formula;
    let regex = /\(\s*\d+\s*,\s*\d+\s*\)/g;

    formula = formula.replace(/\s+/g, '');
    let matches = [...formula.matchAll(regex)];
    let formulaX = formula;
    let formulaY = formula;
    if (formula.includes("x:") && formula.includes("y:")) {
        formulaX = formula.substring(formula.indexOf("x:") + 2, formula.indexOf("y:"));
        formulaY = formula.substring(formula.indexOf("y:") + 2, formula.length);
    }
    const letters: string[] = [];
    for (let match of matches) {
        const str: string = match[0];
        const index_comma: number = str.indexOf(",");
        let x = +str.substring(1, index_comma);
        let y = +str.substring(index_comma + 1, str.length - 1);
        formulaX = formulaX.replace(str, `${x}`);
        formulaY = formulaY.replace(str, `${y}`);

    }
    points.forEach(point => {
        try {
            const regex = new RegExp(point.tag, 'g');
            const regex_x_axis = new RegExp(point.tag + '.x', 'g');
            const regex_y_axis = new RegExp(point.tag + '.y', 'g');

            if (regex_x_axis.test(formulaX))
                formulaX = formulaX.replace(regex_x_axis, `${point.x}`);
            if (regex_x_axis.test(formulaY))
                formulaY = formulaY.replace(regex_x_axis, `${point.x}`);
            if (regex_y_axis.test(formulaX))
                formulaX = formulaX.replace(regex_y_axis, `${point.y}`);
            if (regex_y_axis.test(formulaY))
                formulaY = formulaY.replace(regex_y_axis, `${point.y}`);
            formulaX = formulaX.replace(regex, `${point.x}`);

            formulaY = formulaY.replace(regex, `${point.y}`);
        } catch (error) {
            console.log(error);
            console.log(formula);
            return;
        }
    })
    const remainingX = getUniqueLetters(formulaX);
    const remainingY = getUniqueLetters(formulaY);
    if (canBeEvaluated(formulaX) && canBeEvaluated(formulaY))
        return {
            x: eval(formulaX),
            y: eval(formulaY)
        }
    points_calc.forEach(point => {
        const uniqueLetters = getUniqueLetters(point.formula);
        if (!hasCommonLetter(remainingY, point.tag) && !hasCommonLetter(remainingX, point.tag)) return;
        if (remainingX == uniqueLetters || remainingY == uniqueLetters) return;
        try {
            const regex = new RegExp(point.tag, 'g');
            const pos = ObtainPosition(point.formula, points, points_calc, variables);
            const regex_x_axis = new RegExp(point.tag + '.x', 'g');
            const regex_y_axis = new RegExp(point.tag + '.y', 'g');

            if (regex_x_axis.test(formulaX))
                formulaX = formulaX.replace(regex_x_axis, `${pos.x}`);
            if (regex_x_axis.test(formulaY))
                formulaY = formulaY.replace(regex_x_axis, `${pos.x}`);
            if (regex_y_axis.test(formulaX))
                formulaX = formulaX.replace(regex_y_axis, `${pos.y}`);
            if (regex_y_axis.test(formulaY))
                formulaY = formulaY.replace(regex_y_axis, `${pos.y}`);

            formulaX = formulaX.replace(regex, `${pos.x}`);
            formulaY = formulaY.replace(regex, `${pos.y}`);
        } catch (error) {
            return false;
        }
    })
    if (canBeEvaluated(formulaX) && canBeEvaluated(formulaY))
        return {
            x: eval(formulaX),
            y: eval(formulaY)
        }
    for (let i = 0; i < variables.length; i++) {
        const var_ = variables[i];
        formulaX = formulaX.replaceAll(var_.name, `${var_.value}`);
        formulaY = formulaY.replaceAll(var_.name, `${var_.value}`);
    }

    if (canBeEvaluated(formulaX) && canBeEvaluated(formulaY))
        return {
            x: eval(formulaX),
            y: eval(formulaY)
        }

    return { x: 0, y: 0 };
}

export function rgbToHex(colorInput : {r : number, g : number, b : number} | string | undefined) {
    if (!colorInput) return "#ffffff";
    const {r,g,b} = typeof(colorInput) == "string" ? parseRGB(colorInput) : colorInput;
    const toHex = (c : number) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

function hexToRgb(hex: string): rgb {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        const [, r, g, b] = result.map(val => parseInt(val, 16));
        return { r, g, b };
    }
    return { r: 0, g: 0, b: 0 }
}

export function parseRGB(rgbString: string): rgb {
    rgbString = rgbString.replaceAll(' ', '');
    if (rgbString.at(0) == "#") {
        return hexToRgb(rgbString);
    }
    const match = rgbString.match(/rgb\((\d+),(\d+),(\d+)\)/);
    if (match) {
        const [, r, g, b] = match.map(Number);
        return { r, g, b };
    }
    return { r: 0, g: 0, b: 0 }
}

export function RGB2string(col : rgb | string){
    if (typeof(col) == "string") return col;
    return `rgb(${col.r},${col.g},${col.b})`;
}

export function modify(colorValue: string | rgb, n: number): string {
    if (typeof (colorValue) == "string") colorValue = parseRGB(colorValue);
    colorValue.r *= n;
    colorValue.g *= n;
    colorValue.b *= n;
    colorValue.r = Math.max(Math.min(colorValue.r, 255), 0);
    colorValue.g = Math.max(Math.min(colorValue.g, 255), 0);
    colorValue.b = Math.max(Math.min(colorValue.b, 255), 0);
    return `rgb(${colorValue.r.toFixed(0)},${colorValue.g.toFixed(0)},${colorValue.b.toFixed(0)})`;

}

export function createFragmentList(string: string, tags: Tag[]): Fragment[] {
    let fragments: Fragment[] = [];
    let startIdx: number = 0;

    while (startIdx < string.length) {
        let tagFound: boolean = false;

        // Find the next tag
        for (let tag of tags) {
            if (string.startsWith(tag.open, startIdx)) {
                tagFound = true;
                let tagType: string = tag.name;
                let tagOpen: string = tag.open;
                let tagClose: string = tag.closing;
                let endIdx: number = string.indexOf(tagClose, startIdx + tagOpen.length);
                if (endIdx === -1) {
                    endIdx = string.length;
                }
                fragments.push({ content: string.substring(startIdx + tagOpen.length, endIdx), type: tagType });
                startIdx = endIdx + tagClose.length;
                break;
            }
        }

        if (!tagFound) {
            let endIdx: number = startIdx + 1;
            while (endIdx < string.length && !tags.some(tag => string.startsWith(tag.open, endIdx))) {
                endIdx++;
            }
            fragments.push({ content: string.substring(startIdx, endIdx), type: 'default' });
            startIdx = endIdx;
        }
    }

    return fragments;
}

export const transparent = (col : rgb | string, n : number)=>{
    if (typeof(col) == 'string'){ col = parseRGB(col) };
    return `rgba(${col.r}, ${col.g}, ${col.b}, ${n})`
}