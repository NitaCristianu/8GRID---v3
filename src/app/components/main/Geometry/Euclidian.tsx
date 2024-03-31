"use client"
import { ePoints_Calc_data, ePoints_data, eSegments_data } from "@/app/data/elements";
import { CAN_SELECT, GRID_POSITION, HOVERING_GRAPHS, HOVERING_LABELS, MODE, POINT_RADIUS, SEGMENT_WIDTH, SELECTED, SELECT_RECT, VARIABLES, vec2D } from "@/app/data/globals";
import { AddPoint, Distance_Squared, GetClosestPoint, GetHovering, GetHoveringPoint, IsPointInRect, IsSegmentInRect, ObtainPosition, decomposeSegment, getCoords, getSegmentCoords, isEPointsCalc, toGlobal, toLocal } from '@/app/data/management';
import { ePoint, ePoints_Calc, eSegment, variable } from "@/app/data/props";
import { usePrevious } from "@/app/hooks/usePrevious";
import useResize from "@/app/hooks/useResize";
import { useMotionValue } from "framer-motion";
import { useAtom } from "jotai";
import { Exo_2 } from "next/font/google";
import { useEffect, useRef, useState } from "react";

function DrawPointCalc(ctx: CanvasRenderingContext2D, point: ePoints_Calc, points: ePoint[], points_calc: ePoints_Calc[], variables: variable[], offset: vec2D) {
    if (point.visible != null && point.visible == false) return;
    const { x, y } = toLocal(ObtainPosition(point.formula, points, points_calc, variables), offset);
    ctx.beginPath();
    ctx.fillStyle = point.color;
    if (
        -POINT_RADIUS <= x &&
        x <= window.innerWidth &&
        -POINT_RADIUS <= y &&
        POINT_RADIUS <= window.innerHeight
    )
        ctx.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = "rgb(0,12,86)";
    if (point.tag && point.tag.length > 0 && point.tag.length < 2) {
        ctx.fillText(point.tag, x, y + 2);
    }
    ctx.closePath();
}

function DrawPoint(ctx: CanvasRenderingContext2D, point: ePoint, offset: vec2D) {
    if (point.visible != null && point.visible == false) return;
    const { x, y } = toLocal(getCoords(point), offset);
    ctx.beginPath();
    ctx.fillStyle = point.color;
    if (
        -POINT_RADIUS <= x &&
        x <= window.innerWidth &&
        -POINT_RADIUS <= y &&
        POINT_RADIUS <= window.innerHeight
    )
        ctx.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = "rgb(0,12,86)";
    if (point.tag && point.tag.length > 0 && point.tag.length < 2) {
        ctx.fillText(point.tag, x, y + 2);
    }
    ctx.closePath();

}

function DrawPoints(context: CanvasRenderingContext2D, points: ePoint[], points_calc: ePoints_Calc[], variables: variable[], offset: vec2D) {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.textAlign = "center"
    context.textBaseline = "middle"
    for (const index in points) DrawPoint(context, points[index], offset);
    for (const index in points_calc) DrawPointCalc(context, points_calc[index], points, points_calc, variables, offset);
}

function DrawSegment(ctx: CanvasRenderingContext2D, segment: eSegment, from: vec2D, to: vec2D, offset: vec2D) {

    if (segment.renderMode == "only-segment" || segment.renderMode == "line-segment") {
        ctx.beginPath();
        ctx.lineWidth = SEGMENT_WIDTH;
        ctx.strokeStyle = segment.color;
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.closePath();
        ctx.stroke();
    }
    if (segment.renderMode == "line-segment" || segment.renderMode == "only-line") {
        ctx.beginPath();
        ctx.strokeStyle = segment.color;
        ctx.lineWidth = SEGMENT_WIDTH / 3;
        const slope = (to.y - from.y) / (to.x - from.x);
        const yIntercep = from.y - slope * from.x;
        const xStart = 0;
        const yStart = yIntercep;
        const xEnd = window.innerWidth;
        const yEnd = slope * xEnd + yIntercep;
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.closePath();
        ctx.stroke();
    }
    if (segment.renderMode == "circle") {
        ctx.beginPath();
        ctx.strokeStyle = segment.color;
        ctx.lineWidth = SEGMENT_WIDTH;
        ctx.arc(
            (from.x + to.x) / 2,
            (from.y + to.y) / 2,
            Math.sqrt(Distance_Squared(from, to)) / 2,
            0,
            2 * Math.PI
        )
        ctx.stroke();
        ctx.closePath();
    }
}

function DrawSegments(ctx: CanvasRenderingContext2D, points: ePoint[], points_calc: ePoints_Calc[], segments: eSegment[], offset: vec2D, variables: variable[]) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    segments.forEach(segment => {
        let index1 = points.findIndex(p => p.id == segment.from);
        let index2 = points.findIndex(p => p.id == segment.to);
        var x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        if (index1 == -1) {
            index1 = points_calc.findIndex(p => p.id == segment.from);
            if (index1 > -1) {
                const pos = toLocal(ObtainPosition(points_calc[index1].formula, points, points_calc, variables), offset);
                x1 = pos.x;
                y1 = pos.y;
            }
        } else {
            const pos = toLocal(getCoords(points[index1]), offset);
            x1 = pos.x;
            y1 = pos.y;
        }
        if (index2 == -1) {
            index2 = points_calc.findIndex(p => p.id == segment.to);
            if (index2 > -1) try {
                const pos = toLocal(ObtainPosition(points_calc[index2].formula, points, points_calc, variables), offset);
                x2 = pos.x;
                y2 = pos.y;
            } catch (error) {
                return;
            }
        } else {
            index2 = points.findIndex(p => p.id == segment.to);
            const pos = toLocal(getCoords(points[index2]), offset);
            x2 = pos.x;
            y2 = pos.y;
        }
        if (index1 == -1 || index2 == -1) return;
        DrawSegment(
            ctx,
            segment,
            { x: x1, y: y1 },
            { x: x2, y: y2 },
            offset
        )
    })
}

function DrawSelected(ctx: CanvasRenderingContext2D, selected: string[], points: ePoint[], segments: eSegment[], points_calc: ePoints_Calc[], variables: variable[], offset: vec2D) {
    ctx.strokeStyle = "rgba(156, 181, 255, 0.75)";
    ctx.lineWidth = 12;

    ctx.beginPath();
    selected.forEach(id => {
        var index1 = points.findIndex(p => p.id == id);
        if (index1 != -1) {
            var { x, y } = toLocal(getCoords(points[index1]), offset);
            ctx.moveTo(x + POINT_RADIUS, y);
            ctx.arc(x, y, POINT_RADIUS * 1.1, 0, 2 * Math.PI);
            return;
        };
        var index2 = segments.findIndex(p => p.id == id);
        if (index2 != -1) {
            const positions_global = getSegmentCoords(segments[index2], points, points_calc, variables);
            const [pos1, pos2] = positions_global.map(v => toLocal(v, offset));
            if (segments[index2].renderMode == "line-segment" || segments[index2].renderMode == "only-line") {
                const to = pos1;
                const from = pos2;
                const slope = (to.y - from.y) / (to.x - from.x);
                const yIntercep = from.y - slope * from.x;
                const xStart = 0;
                const yStart = yIntercep;
                const xEnd = window.innerWidth;
                const yEnd = slope * xEnd + yIntercep;
                ctx.moveTo(xStart, yStart);
                ctx.lineTo(xEnd, yEnd);
            } else if (segments[index2].renderMode == "only-segment") {
                ctx.moveTo(pos1.x, pos1.y);
                ctx.lineTo(pos2.x, pos2.y);
            } else if (segments[index2].renderMode == "circle") {
                ctx.beginPath();
                var [from, to] = getSegmentCoords(segments[index2], points, points_calc, variables);
                from = toLocal(from, offset);
                to = toLocal(to, offset);
                ctx.arc(
                    (from.x + to.x) / 2,
                    (from.y + to.y) / 2,
                    Math.sqrt(Distance_Squared(from, to)) / 2,
                    0,
                    2 * Math.PI
                )
                ctx.stroke();
                ctx.closePath();
            }
            return;
        }
        var index3 = points_calc.findIndex(p => p.id == id);
        if (index3 != -1) {
            var { x, y } = toLocal(ObtainPosition(points_calc[index3].formula, points, points_calc, variables), offset);
            ctx.moveTo(x + POINT_RADIUS, y);
            ctx.arc(x, y, POINT_RADIUS * 1.1, 0, 2 * Math.PI);
            return;
        }
    })
    ctx.closePath();

    ctx.stroke();
}

function DrawSelection(ctx: CanvasRenderingContext2D, rect: vec2D[], offset: vec2D) {
    if (rect.length < 2) return;
    const transformed = [
        toLocal(rect[0], offset),
        toLocal(rect[1], offset)
    ];
    ctx.fillStyle = "rgba(80, 137, 244, .4)";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(218, 237, 255, .6)"
    ctx.beginPath();
    ctx.rect(
        Math.min(transformed[0].x, transformed[1].x),
        Math.min(transformed[0].y, transformed[1].y),
        Math.abs(transformed[0].x - transformed[1].x),
        Math.abs(transformed[0].y - transformed[1].y),
    );
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
}

export default function Euclidian() {
    const [points, setPoints] = useAtom(ePoints_data);
    const [segments, setSegments] = useAtom(eSegments_data);
    const [points_calc, set_points_calc] = useAtom(ePoints_Calc_data);
    const size = useResize()
    const canvas_ref = useRef<HTMLCanvasElement>(null);
    const [offset] = useAtom(GRID_POSITION);
    const [selected, set_selected] = useAtom(SELECTED);
    const [mode, set_mode] = useAtom(MODE);
    const [mpos, SetMpos] = useState<vec2D>({ 'x': 0, 'y': 0 });
    const prevMpos = usePrevious(mpos);
    const [dragging, setDragging] = useState(false);
    const [selecting, setSelecting] = useState(false);
    const [select_rect, set_select_rect] = useAtom(SELECT_RECT);
    const [can_select, set_can_select] = useAtom(CAN_SELECT);
    const [variables, set_variables] = useAtom(VARIABLES);

    const [hovering_graphs] = useAtom(HOVERING_GRAPHS);
    const [hovering_labels] = useAtom(HOVERING_LABELS);

    useEffect(() => {
        const MouseDown = (event: MouseEvent) => {
            // selection
            if (points.length == 0 || !can_select || hovering_graphs.length > 0 || hovering_labels.length > 0) return;
            if (
                (mode == "menu" && event.clientX > size.x * 0.75) ||
                (mode == "euclidian" && event.clientX > size.x * 0.69) ||
                (mode == "graph" && event.clientX > size.x * 0.69)
            ) return;
            const mpos = toGlobal({ x: event.clientX, y: event.clientY }, offset);
            const { isHovering, Hovering_id } = GetHovering(mpos, points, segments, points_calc, variables);
            if (isHovering && event.button == 0) {
                setDragging(true);
                setSelecting(false);
                set_select_rect([]);
                const index = selected.findIndex(id => id == Hovering_id);
                if (index == -1) {
                    if (event.ctrlKey)
                        set_selected((prev) => ([...prev, Hovering_id]));
                    else
                        set_selected([Hovering_id]);
                }
            } else if (event.button == 2) {
                /// UNSEELCT
                set_selected([]);
            } else if (event.button == 0 && mode == "selection" && !isHovering) {
                // SELECT RECT
                setSelecting(true);
                set_select_rect([
                    mpos,
                    mpos
                ])
            }
        }
        const MouseUp = (event: MouseEvent) => {
            // if (mode != "selection") { setSelecting(false); set_select_rect([]); return; };

            if (!can_select) { setSelecting(false); return; }
            event.stopPropagation();
            const mpos = toGlobal({ x: event.clientX, y: event.clientY }, offset);
            setDragging(false);
            if (mode == "selection" && event.button == 0 && selecting && select_rect.length > 0) {
                setSelecting(false);
                set_select_rect([select_rect[0], mpos]);
                const selected_elements: string[] = [];
                points.forEach(p => {
                    if (IsPointInRect(p, [select_rect[0], mpos]) && (p.visible == undefined || p.visible == true))
                        selected_elements.push(p.id);
                });
                points_calc.forEach(p => {
                    if (IsPointInRect(ObtainPosition(p.formula, points, points_calc, variables), [select_rect[0], mpos]) && (p.visible == undefined || p.visible == true))
                        selected_elements.push(p.id);
                });
                segments.forEach(s => {
                    if (IsSegmentInRect(s, points, points_calc, [select_rect[0], mpos], variables))
                        selected_elements.push(s.id);
                });
                if (selected_elements.length > 0)
                    set_selected(selected_elements);
            } else set_select_rect([]);
        }
        const MouseMove = (event: MouseEvent) => {
            // if (mode != "selection" || !can_select) { set_select_rect([]); return; }
            if (mode != "selection") { setSelecting(false); set_select_rect([]); return; }
            SetMpos({ 'x': event.clientX, 'y': event.clientY });
            if (selecting) {
                set_select_rect(prev => [prev[0], toGlobal(mpos, offset)]);
            }
            if (dragging) {
                const updated_points = [...points];
                selected.forEach(id => {
                    const index_point = points.findIndex(p => p.id == id);
                    if (index_point != -1) {
                        updated_points[index_point].x += mpos.x - prevMpos.x;
                        updated_points[index_point].y += mpos.y - prevMpos.y;
                    } else {
                        const index_segment = segments.findIndex(s => s.id == id);
                        if (index_segment != -1) {
                            const segment = segments[index_segment];
                            const p1_index = points.findIndex(p => p.id == segment.from);
                            const p2_index = points.findIndex(p => p.id == segment.to);
                            if (p1_index > -1 && p2_index > -1) {
                                const p1 = points[p1_index];
                                const p2 = points[p2_index];
                                if (selected.findIndex(id => id == p1.id) == -1) {
                                    updated_points[p1_index].x += mpos.x - prevMpos.x;
                                    updated_points[p1_index].y += mpos.y - prevMpos.y;
                                }
                                if (selected.findIndex(id => id == p2.id) == -1) {
                                    updated_points[p2_index].x += mpos.x - prevMpos.x;
                                    updated_points[p2_index].y += mpos.y - prevMpos.y;
                                }
                            }
                        }
                    };
                })
                setPoints(updated_points);
            };
        }
        window.addEventListener("mouseup", MouseUp);
        window.addEventListener("mousedown", MouseDown);
        window.addEventListener("mousemove", MouseMove);
        return () => {
            window.removeEventListener("mousedown", MouseDown);
            window.removeEventListener("mouseup", MouseUp);
            window.removeEventListener("mousemove", MouseMove);
        }
    }, [size.x,dragging, hovering_labels.length, hovering_graphs.length, points_calc, prevMpos.x, prevMpos.y, setPoints, set_select_rect, set_selected, variables, selecting, offset, points, selected, mpos, mode, select_rect, segments, can_select])

    useEffect(() => {
        const canvas = canvas_ref.current as HTMLCanvasElement;
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;

        canvas.width = size.x;
        canvas.height = size.y;

        context.font = `bolder ${POINT_RADIUS * 1.2}px Poppins`;
        DrawSegments(context, points, points_calc, segments, offset, variables);
        DrawSelected(context, selected, points, segments, points_calc, variables, offset);
        DrawPoints(context, points, points_calc, variables, offset);
        if (selecting) DrawSelection(context, select_rect, offset);
    }, [points_calc, variables, points, size, offset, selected, select_rect, selecting, segments, hovering_graphs, hovering_labels])

    return (<canvas
        ref={canvas_ref}
        style={{
            zIndex: 2,
            width: '100%',
            height: '100%',
            position: 'fixed'
        }}
        onContextMenu={e => e.preventDefault()}
    />)
}