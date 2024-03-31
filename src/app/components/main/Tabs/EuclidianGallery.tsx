"use client"
import { motion } from "framer-motion";
import style from "./styles.module.css";
import { useAtom } from "jotai";
import { ACCENT, GRID_POSITION, MODE, POINT_RADIUS, SELECTED, VARIABLES, euclidian } from "@/app/data/globals";
import { useEffect, useRef, useState } from "react";
import useResize from "@/app/hooks/useResize";
import { AddPoint, DoesSegmentExist, GetAnyHoveringPoint, GetHoveringPoint, ObtainPosition, getCoords, getUniqueTag, toGlobal, toLocal } from "@/app/data/management";
import { ePoints_Calc_data, ePoints_data, eSegments_data } from "@/app/data/elements";
import { v4 } from "uuid";
import { randomLetter } from "@/app/data/utils";
import { segment_render_mode, tips } from "@/app/data/props";
import { Faster_One, Irish_Grover } from "next/font/google";
import { BACKGROUND } from '../../../data/globals';
import Latex from "react-latex-next";

export default function EuclidianGallery() {
    const [placing, setPlacing] = useState(null);
    const [current_mode, set_mode] = useAtom(MODE);

    const essentials: euclidian[] = ["ePoint", "eSegment"];
    const construct: euclidian[] = ["eCenter", "ePerpendicular"];

    const [accent, __] = useAtom(ACCENT);
    const [bgr, ___] = useAtom(BACKGROUND);

    const canvas_ref = useRef<HTMLCanvasElement>(null);
    const gallery_ref = useRef<HTMLDivElement>(null);
    const size = useResize();
    const [mpos, set_mpos] = useState({ 'x': 0, 'y': 0 });
    const [offset, _] = useAtom(GRID_POSITION);

    const [points_data, set_points_data] = useAtom(ePoints_data);
    const [points_calc_data, set_points_calc_data] = useAtom(ePoints_Calc_data);
    const [segments_data, set_segmments_data] = useAtom(eSegments_data);
    const [inuse, set_inuse] = useState<string[]>([]);
    const [variables, set_variables] = useAtom(VARIABLES);

    useEffect(() => {
        const canvas = canvas_ref.current as HTMLCanvasElement;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        canvas.width = size.x;
        canvas.height = size.y;

        ctx.fillStyle = accent;
        ctx.strokeStyle = accent;
        ctx.shadowBlur = 10;
        ctx.shadowColor = accent;
        ctx.lineWidth = 5;

        const offseted_mpos = toGlobal(mpos, offset);
        const { isHovering, Hovering_id, isCalculated } = GetAnyHoveringPoint(offseted_mpos, points_data, points_calc_data, variables);

        if (current_mode != "euclidian") return;
        ctx.beginPath();

        if ((placing == "eCenter" || placing == "ePerpendicular" || placing == "eSegment") && inuse.length > 0) {
            var index = points_data.findIndex(p => p.id == inuse.at(inuse.length - 1));
            var coords;
            if (index == -1) {
                index = points_calc_data.findIndex(p => p.id == inuse.at(inuse.length - 1));
                coords = ObtainPosition(points_calc_data[index].formula, points_data, points_calc_data, variables);
            } else {
                coords = getCoords(points_data[index]);
            }
            coords = toLocal(coords, offset);
            ctx.moveTo(coords.x, coords.y);
            var lineto = { x: 0, y: 0 };
            if (isHovering) {
                let index = (points_data.findIndex(p => p.id == Hovering_id))
                var x, y;
                if (isCalculated) {
                    index = points_calc_data.findIndex(p => p.id == Hovering_id);
                    const pos = ObtainPosition(points_calc_data[index].formula, points_data, points_calc_data, variables);
                    x = pos.x;
                    y = pos.y;
                } else {
                    const pos = getCoords(points_data[index]);
                    x = pos.x;
                    y = pos.y;
                }
                const transformed = toLocal({ x: x, y: y }, offset);
                lineto = transformed;
            } else
                lineto = mpos;

            if (placing == "eCenter") {
                ctx.arc((coords.x + lineto.x) / 2, (coords.y + lineto.y) / 2, 10, 3, 2 * Math.PI);
            }
            ctx.stroke();
        }

        ctx.moveTo(mpos.x, mpos.y);
        if (!isHovering)
            ctx.arc(mpos.x, mpos.y, POINT_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
    }, [inuse, size, mpos, placing, offset, points_data, accent, current_mode, points_calc_data, variables])

    useEffect(() => {
        const mouseDown = (event: MouseEvent) => {
            if (current_mode != "euclidian") return;
            if (event.clientX < 64) return;
            const rect = gallery_ref.current != null ? gallery_ref.current.getBoundingClientRect() : null;
            if (rect && rect.left < event.clientX &&
                rect.right > event.clientX &&
                rect.top < event.clientY &&
                rect.bottom > event.clientY) return;
            const offseted_mpos = toGlobal(mpos, offset);
            const { isHovering, Hovering_id, isCalculated } = GetAnyHoveringPoint(offseted_mpos, points_data, points_calc_data, variables);
            if (placing == "ePoint" && event.button == 0) {
                if (!isHovering) {
                    set_points_data(prev => [...prev, {
                        x: offseted_mpos.x,
                        y: offseted_mpos.y,
                        id: v4(),
                        color: accent,
                        tag: getUniqueTag(points_data, points_calc_data)
                    }]);
                }
            } else if (placing == "eSegment") {
                if (inuse.length > 0 && event.button == 0) {
                    if (isHovering) {
                        const type: segment_render_mode = "only-segment";
                        const segment = {
                            from: inuse.at(inuse.length - 1) || "",
                            to: Hovering_id,
                            id: v4(),
                            color: "white",
                            renderMode: type
                        }
                        if (!DoesSegmentExist(segment, segments_data)) {
                            set_segmments_data(prev => [...prev, segment])
                            set_inuse(prev => [...prev, Hovering_id]);
                        }

                    } else if (event.button == 0) {
                        const new_point_id = v4();
                        // no need to verify wheter the semgent exists because a new unique point is created
                        set_points_data(prev => [...prev, {
                            x: offseted_mpos.x,
                            y: offseted_mpos.y,
                            id: new_point_id,
                            color: "white",
                            tag: getUniqueTag(points_data, points_calc_data)
                        }])
                        set_segmments_data(prev => [...prev, {
                            from: inuse.at(inuse.length - 1) || "",
                            to: new_point_id,
                            id: v4(),
                            color: "white",
                            renderMode: "only-segment"
                        }])
                        set_inuse(prev => [...prev, new_point_id]);
                    }
                }
            } else if (placing == "eCenter") {
                if (inuse.length > 0 && event.button == 0 && Hovering_id) {
                    const id = v4();
                    var formula: string;
                    const p_from_index = points_data.findIndex(p => p.id == Hovering_id);
                    const c_from_index = points_calc_data.findIndex(p => p.id == Hovering_id);
                    const p_to_index = points_data.findIndex(p => p.id == inuse.at(inuse.length - 1));
                    const c_to_index = points_calc_data.findIndex(p => p.id == inuse.at(inuse.length - 1));
                    var fromTag, toTag;
                    fromTag = p_from_index > -1 ? points_data[p_from_index].tag : points_calc_data[c_from_index].tag;
                    toTag = p_to_index > -1 ? points_data[p_to_index].tag : points_calc_data[c_to_index].tag;
                    formula = `(${fromTag} + ${toTag})/2`;
                    if (Hovering_id != inuse.at(inuse.length - 1)) {
                        set_points_calc_data(prev => [...prev, {
                            formula: formula,
                            id: id,
                            tag: getUniqueTag(points_data, points_calc_data),
                            color: "white"
                        }])
                        set_inuse(prev => [...prev, id]);
                    }
                }
            } else if (placing == "ePerpendicular") {
                if (inuse.length > 0 && event.button == 0 && Hovering_id) {
                    const id = v4();
                    var formula: string;
                    const p_from_index = points_data.findIndex(p => p.id == Hovering_id);
                    const c_from_index = points_calc_data.findIndex(p => p.id == Hovering_id);
                    const p_to_index = points_data.findIndex(p => p.id == inuse.at(inuse.length - 1));
                    const c_to_index = points_calc_data.findIndex(p => p.id == inuse.at(inuse.length - 1));
                    var fromTag, toTag;
                    fromTag = p_from_index > -1 ? points_data[p_from_index].tag : points_calc_data[c_from_index].tag;
                    toTag = p_to_index > -1 ? points_data[p_to_index].tag : points_calc_data[c_to_index].tag;
                    const angle = Math.PI / 2;
                    formula = `
                    x: ${fromTag}.x + (${toTag}.x + (${fromTag}.x*-1)) * Math.cos(${angle}) - (${toTag}.y + (${fromTag}.y) * -1) * Math.sin(${angle})
                    y: ${fromTag}.y + (${toTag}.x + (${fromTag}.x*-1)) * Math.sin(${angle}) + (${toTag}.y + (${fromTag}.y) * -1) * Math.cos(${angle})`
                        ;
                    if (Hovering_id != inuse.at(inuse.length - 1)) {
                        set_points_calc_data(prev => [...prev, {
                            formula: formula,
                            id: id,
                            tag: getUniqueTag(points_data, points_calc_data),
                            visible: false,
                            color: "white"
                        }])
                        set_inuse(prev => [...prev, id]);
                        set_segmments_data(prev => [...prev, {
                            from: Hovering_id,
                            to: id,
                            id: v4(),
                            color: "white",
                            renderMode: "only-line",

                        }])
                    }
                }
            }
            if (isHovering && inuse.findIndex(id => id == Hovering_id) == -1 && event.button == 0) set_inuse(prev => [...prev, Hovering_id]);
            if (event.button == 2) set_inuse([]);

        }
        const mousemove = (event: MouseEvent) => {
            set_mpos({ 'x': event.clientX, 'y': event.clientY });
        }
        window.addEventListener("mousedown", mouseDown);
        window.addEventListener("mousemove", mousemove);
        return () => {
            window.removeEventListener("mousedown", mouseDown);
            window.removeEventListener("mousemove", mousemove);
        }
    }, [points_data, inuse, mpos, size, accent, current_mode, offset, placing, points_calc_data, segments_data, set_points_calc_data, set_points_data, set_segmments_data, variables]);
    return (
        <>
            <canvas
                ref={canvas_ref}
                style={{
                    width: '100%',
                    height: '100%',
                    position: "fixed"
                }}
            />
            <motion.p style={{
                position: 'fixed',
                width: '100%',
                fontFamily: "Poppins",
                textAlign: 'center',
                top: "100%"
            }}
                animate={{
                    top: current_mode == "euclidian" ? "95%" : "100%",
                }}
            >{placing != null ? tips[placing] : "Select any element from the gallery"}
            </motion.p>
            <motion.div
                className={style.EuclidianGallery}
                ref={gallery_ref}
                style={{
                    left: current_mode == "euclidian" ? "calc(70% - 1rem)" : "100%",
                    border: `2px solid ${accent}`,
                    overflowY: "scroll",
                    
                }}

            >
                <h1 className={style.Title1} style={{ color: accent }} >ESSENTIALS</h1>
                <br />
                <br />
                <motion.div
                    style={{
                        width: "100%",
                        flexDirection: 'row',
                        display: 'flex',
                        alignContent: "center",
                        justifyContent: "center",
                        flexWrap : "wrap",
                        gap: "2rem",
                    }}
                >

                    {...essentials.map(type =>
                        <motion.div
                            className={style.Card}
                            key={type}
                            style={{
                                boxShadow: placing == type ? `0 0 10px 2px ${accent}` : "",
                            }}
                            whileHover={{
                                scale: 1.1
                            }}
                            whileTap={{
                                scale: 0.9
                            }}
                            onTap={() => {
                                setPlacing(type);
                            }}
                        >
                            <div style={{ scale: 0.5 }}>
                                {type == "ePoint" ?
                                    <div>
                                        <h1 style={{
                                            position: "fixed",
                                            color: bgr,
                                            fontSize: `calc(3.2rem)`,
                                            lineHeight: '147%',
                                            fontFamily: "Poppins",
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            width: "100%",
                                            height: "100%",
                                            userSelect: "none"
                                        }} >A</h1>
                                        <svg fill="white" xmlns="http://www.w3.org/2000/svg" viewBox="-1.5 -2 3 3">
                                            <path d="M 0 -2 A 1 1 0 0 0 0 1 A 1 1 0 0 0 0 -2 M 0 -2" />
                                        </svg>
                                    </div> : null}
                                {type == "eSegment" ? <svg fill="white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" id="Flat">
                                    <path d="M214.62793,86.62695a32.0716,32.0716,0,0,1-38.88245,4.94141L91.56836,175.74561a32.00172,32.00172,0,1,1-50.19629-6.37256l.00049-.001a32.05731,32.05731,0,0,1,38.88208-4.94043l84.177-84.17725a32.00172,32.00172,0,1,1,50.19629,6.37256Z" />
                                </svg> : null}
                            </div>
                        </motion.div>)}

                </motion.div>
                <h1 className={style.Title1} style={{ color: accent }} >CONSTRUCT</h1>
                <br />
                <br />
                <motion.div
                    style={{
                        width: "100%",
                        flexDirection: 'row',
                        display: 'flex',
                        alignContent: "center",
                        justifyContent: "center",
                        flexWrap : "wrap",
                        gap: "2rem"
                    }}
                >

                    {...construct.map(type =>
                        <motion.div
                            className={style.Card}
                            key={type}
                            style={{
                                boxShadow: placing == type ? `0 0 10px 2px ${accent}` : "",
                            }}
                            whileHover={{
                                scale: 1.1
                            }}
                            whileTap={{
                                scale: 0.9
                            }}
                            onTap={() => {
                                setPlacing(type);
                            }}
                        >
                            <div style={{ scale: 0.5 }}>
                                {type == "eCenter" ? <svg fill="white" style={{ scale: 1.2 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                                    <g id="turf-midpoint">
                                        <circle cx="49.331" cy="50.493" r="6.845" />
                                        <path scale={1.9} d="M85.331,23.338c-4.877,0-8.845-3.968-8.845-8.845c0-4.877,3.968-8.845,8.845-8.845s8.845,3.968,8.845,8.845   C94.176,19.37,90.208,23.338,85.331,23.338z M85.331,9.648c-2.672,0-4.845,2.173-4.845,4.845c0,2.671,2.173,4.845,4.845,4.845   s4.845-2.173,4.845-4.845C90.176,11.821,88.003,9.648,85.331,9.648z" />
                                        <path d="M14.331,94.338c-4.877,0-8.845-3.968-8.845-8.845s3.968-8.845,8.845-8.845c4.877,0,8.845,3.968,8.845,8.845   S19.208,94.338,14.331,94.338z M14.331,80.648c-2.672,0-4.845,2.173-4.845,4.845s2.173,4.845,4.845,4.845   c2.671,0,4.845-2.173,4.845-4.845S17.002,80.648,14.331,80.648z" />
                                    </g>
                                    <g id="Layer_1">
                                    </g>
                                </svg> : null}
                                {type == "ePerpendicular" ? <svg fill="white" style={{ scale: 1.2 }} xmlns="http://www.w3.org/2000/svg" viewBox="1.05451 1.77808 45.02 32.87">
                                    <path d="M 9.9079 21.5135 A 1 1 75 0 0 1.1453 19.7204 A 1 1 75 0 0 9.9079 21.5135 M 9 20 L 8 23 L 30 27 M 8 23 L 29 30 L 30 27 M 9.9079 21.5135 A 1 1 75 0 0 1.1453 19.7204 A 1 1 75 0 0 9.9079 21.5135 M 37.1619 26.6342 A 1 1 75 0 0 29.5039 32.8272 A 1 1 75 0 0 37.1619 26.6342 M 36 27 L 42 10 L 39 9 L 33 26 M 37.074 6.9875 A 1 1 75 0 0 46.0261 5.624 A 1 1 75 0 0 37.074 6.9875" fill="" />
                                </svg> : null}

                            </div>
                        </motion.div>)}
                </motion.div>

            </motion.div>
        </>)
}