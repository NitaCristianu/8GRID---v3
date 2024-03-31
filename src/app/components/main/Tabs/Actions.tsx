"use client"
import { ACCENT, CAN_SELECT, GRID_POSITION, MODE, POINT_RADIUS, SECONDARY, SELECTED, VARIABLES } from "@/app/data/globals"
import { useAtom } from "jotai"
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ePoints_Calc_data, ePoints_data, eSegments_data } from "@/app/data/elements";
import { ObtainPosition, decomposeSegment, getCoords, getSegmentCoords, getUniqueLetters, rgbToHex, transparent } from "@/app/data/management";
import { ePoint, ePoints_Calc, eSegment, point_prop, point_prop_calc, segment_props, total_props } from "@/app/data/props";
import { clamp } from "three/src/math/MathUtils.js";
import { CompressedTextureLoader } from "three";
import { v4 } from "uuid";

interface copies {
    points: ePoint[],
    calcs: ePoints_Calc[],
    segments: eSegment[]
}

export function RemoveSegment(id: string, dataIn: copies): copies {
    var data = { ...dataIn };
    const index = data.segments.findIndex(s => s.id == id);
    if (index == -1) return data;
    const self = { ...data.segments[index] };

    data.segments.splice(index, 1);

    data.points.forEach(p => {
        if (p.id == self.from || p.id == self.to) {
            data = RemovePoint(p.id, data);
        }
    })

    return data;
}

export function RemovePoint(id: string, dataIn: copies): copies {
    var data = { ...dataIn };
    var index = data.points.findIndex(p => p.id == id);
    var isCalculated = false;
    if (index == -1) {
        index = data.calcs.findIndex(p => p.id == id);
        isCalculated = true;
        if (index == -1) return data;
    }
    if (isCalculated)
        data.calcs.splice(index, 1);
    else
        data.points.splice(index, 1);
    data.segments.forEach(segment => {
        if (segment.from == id || segment.to == id) {
            data = RemoveSegment(segment.id, data);
        }
    })

    return data;
}

function getObject(id: string | null | undefined, points: ePoint[], points_calc: ePoints_Calc[], segments: eSegment[]) {
    if (typeof (id) != "string") return -1;
    const i1 = points.findIndex(p => p.id == id);
    if (i1 > -1) return points[i1];
    const i2 = points_calc.findIndex(p => p.id == id);
    if (i2 > -1) return points_calc[i2];
    const i3 = segments.findIndex(p => p.id == id);
    if (i3 > -1) return segments[i3];
    return -1;
}

export default function Actions() {

    const [selected, set_selected] = useAtom(SELECTED);
    const [mode, set_mode] = useAtom(MODE);
    const [points, set_points] = useAtom(ePoints_data);
    const [points_calc, set_points_calc] = useAtom(ePoints_Calc_data);
    const [segments, set_segments] = useAtom(eSegments_data);
    const actionsdiv = useRef(null);
    const [can_select, set_can_select] = useAtom(CAN_SELECT);
    const [offset, _] = useAtom(GRID_POSITION);
    const [variables, set_variables] = useAtom(VARIABLES);
    const [x, set_x] = useState(-500);
    const [y, set_y] = useState(0);

    const [sec] = useAtom(SECONDARY);
    const [acc] = useAtom(ACCENT);
    const [props, set_props] = useState<string[]>([]);


    const remove = () => {
        var points_clone = [...points];
        var segments_clone = [...segments];
        var points_calc_clone = [...points_calc];
        selected.forEach(id => {
            const index_point = points_clone.findIndex(p => p.id == id);
            if (index_point > -1) {
                segments.forEach(s => {
                    const index = segments_clone.findIndex(a => a.id == s.id);
                    if (s.from == id) {
                        segments_clone.splice(index, 1);
                    }
                    else if (s.to == id) {
                        segments_clone.splice(index, 1);
                    }

                })
                points_calc.forEach(self => {
                    const letters = getUniqueLetters(self.formula);
                    const index = points_calc_clone.findIndex(p => letters.includes(points_clone[index_point].tag));
                    points_calc_clone.splice(index, 1);
                })
                points_clone.splice(index_point, 1);
            }
            const index_segment = segments_clone.findIndex(s => s.id == id);
            if (index_segment > -1)
                segments_clone.splice(index_segment, 1);
            const index_point_calc = points_calc.findIndex(p => p.id == id);
            if (index_point_calc > -1) {
                segments.forEach(s => {
                    const index = segments_clone.findIndex(a => a.id == s.id);
                    if (s.from == id) {
                        segments_clone.splice(index, 1);
                    }
                    else if (s.to == id) {
                        segments_clone.splice(index, 1);
                    }

                })
                points_calc_clone.splice(index_point_calc, 1);
            }
        })
        set_selected([]);
        set_props([]);
        set_segments(segments_clone);
        set_points(points_clone);
        set_points_calc(points_calc_clone);

    }

    useEffect(() => {
        set_props([]);
    }, [selected])

    const modifyProperty = useCallback((prop: {
        id: string,
        type: string,
        default: string | boolean
    }, event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const points_clone = [...points];
        const segments_clone = [...segments];
        const points_calc_clone = [...points_calc];
        console.log(prop);
        selected.forEach(id => {
            const finds = [
                { table: points_clone, index: points_clone.findIndex(p => p.id == id) },
                { table: segments_clone, index: segments_clone.findIndex(s => s.id == id) },
                { table: points_calc_clone, index: points_calc_clone.findIndex(p => p.id == id) },
            ];
            finds.forEach(find => {
                if (find.index < 0) return;
                const obj = find.table[find.index];
                //if (!obj[prop.id]) return;
                if (!(typeof find.table[find.index] == "object")) return;
                if (!(typeof prop.id == "string")) return;
                if (!((prop.id as string) in find.table[find.index])) return;
                if (!(prop.id in find.table[find.index])) return;

                if (prop.id in find.table[find.index] && prop.type == "char" && event.target.value.toUpperCase() != event.target.value.toLowerCase()) {
                    find.table[find.index][prop.id] = event.target.value.toUpperCase().charAt(event.target.value.length - 1);
                    return;
                }
                if (prop.type == "text") {
                    find.table[find.index][prop.id] = event.target.value;
                    return;
                }
                if (prop.type == "color") {
                    find.table[find.index][prop.id] = event.target.value;
                    return;
                }
                if (prop.type == "checkbox") {
                    find.table[find.index][prop.id] = event.target.value;
                    return;
                }

            })
        })
        set_points(points_clone);
        set_segments(segments_clone);
    }, [points_calc, set_points, set_segments, points, segments, selected]);

    useEffect(() => {
        if (selected.length == 0 && props.length > 0) set_props([]);
        if (selected.length == 0 || mode != 'selection') return
        var righthest = -Infinity;
        var a = 0; // arithmetic mean
        var n = 0;
        selected.forEach(id => {
            const point_index = points.findIndex(p => p.id == id);
            const segments_index = segments.findIndex(p => p.id == id);
            const points_calc_index = points_calc.findIndex(p => p.id == id);
            if (point_index > -1) {
                const { x, y } = getCoords(points[point_index]);
                if (x > righthest) righthest = x;
                n++;
                a += y;
            } else if (segments_index > -1) {
                n += 2;
                const [p, p1] = getSegmentCoords(segments[segments_index], points, points_calc, variables);
                if (p.x > righthest) righthest = p.x;
                if (p1.x > righthest) righthest = p1.x;
                a += p.y + p1.y;
            } else if (points_calc_index > -1) {
                const { x, y } = ObtainPosition(points_calc[points_calc_index].formula, points, points_calc, variables);
                if (x > righthest) righthest = x;
                n++;
                a += y;
            }
        })
        set_x(clamp(righthest + POINT_RADIUS * 2 + offset.x, 64, window.innerWidth - 356));
        set_y(clamp(a / n + offset.y, 64, window.innerHeight - 356));
    }, [points_calc, variables, segments, selected, points, offset, mode, props])

    const config = () => {
        set_props([]);
        selected.forEach(id => {
            const index_point = points.findIndex(p => p.id == id);
            const index_segment = segments.findIndex(p => p.id == id);
            const index_point_calc = points_calc.findIndex(p => p.id == id);
            if (index_point > -1) {
                // SELECTED IS A POINT
                set_props(prev => [...prev, ...point_prop]);
            } else if (index_segment > -1) {
                set_props(prev => [...prev, ...segment_props]);
            } else if (index_point_calc > -1) {
                set_props(prev => [...prev, ...point_prop_calc]);
            }
        })
    }

    const spring = {
        type: 'cubic',
    }

    return (
        <motion.div transition={spring} animate={{ opacity: ((selected.length > 0 && mode == "selection") ? 1 : 0) }} >
            <motion.div
                onHoverStart={() => set_can_select(false)}
                onHoverEnd={() => set_can_select(true)}
                ref={actionsdiv}
                style={{
                    position: "fixed",
                    background: transparent(sec, 0.5),
                    border: "2px solid white",
                    WebkitBackdropFilter: "blur(6px)",
                    backdropFilter: "blur(6px)",
                    padding: 5,
                    x,
                    y,
                    borderRadius: ".3rem",
                    zIndex: 99,
                    opacity: selected.length > 0 ? 1 : 0
                }}
                whileHover={{ rotate: 3, scale: 0.9 }}
                whileTap={{ scale: 1.1 }}
                onClick={remove}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="1.5rem" height="1.5rem">
                    <path d="M 10 2 L 9 3 L 3 3 L 3 5 L 21 5 L 21 3 L 15 3 L 14 2 L 10 2 z M 4.3652344 7 L 6.0683594 22 L 17.931641 22 L 19.634766 7 L 4.3652344 7 z" />
                </svg>
            </motion.div>

            <motion.div
                onHoverStart={() => set_can_select(false)}
                onHoverEnd={() => set_can_select(true)}
                ref={actionsdiv}
                style={{
                    position: "fixed",
                    background: transparent(sec, 0.5),
                    WebkitBackdropFilter: "blur(6px)",
                    backdropFilter: "blur(6px)",
                    border: "2px solid white",
                    padding: 5,
                    x,
                    y: `calc(${y}px - 2.5rem)`,
                    borderRadius: ".3rem",
                    zIndex: 99,
                }}
                whileHover={{ rotate: 3, scale: 0.9 }}
                whileTap={{ scale: 1.1 }}
                onClick={config}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 48 48" width="1.5rem" height="1.5rem">
                    <path d="M39.139,26.282C38.426,25.759,38,24.919,38,24.034s0.426-1.725,1.138-2.247l3.294-2.415 c0.525-0.386,0.742-1.065,0.537-1.684c-0.848-2.548-2.189-4.872-3.987-6.909c-0.433-0.488-1.131-0.642-1.728-0.38l-3.709,1.631 c-0.808,0.356-1.749,0.305-2.516-0.138c-0.766-0.442-1.28-1.23-1.377-2.109l-0.446-4.072c-0.071-0.648-0.553-1.176-1.191-1.307 c-2.597-0.531-5.326-0.54-7.969-0.01c-0.642,0.129-1.125,0.657-1.196,1.308l-0.442,4.046c-0.097,0.88-0.611,1.668-1.379,2.11 c-0.766,0.442-1.704,0.495-2.515,0.138l-3.729-1.64c-0.592-0.262-1.292-0.11-1.725,0.377c-1.804,2.029-3.151,4.35-4.008,6.896 c-0.208,0.618,0.008,1.301,0.535,1.688l3.273,2.4C9.574,22.241,10,23.081,10,23.966s-0.426,1.725-1.138,2.247l-3.294,2.415 c-0.525,0.386-0.742,1.065-0.537,1.684c0.848,2.548,2.189,4.872,3.987,6.909c0.433,0.489,1.133,0.644,1.728,0.38l3.709-1.631 c0.808-0.356,1.748-0.305,2.516,0.138c0.766,0.442,1.28,1.23,1.377,2.109l0.446,4.072c0.071,0.648,0.553,1.176,1.191,1.307 C21.299,43.864,22.649,44,24,44c1.318,0,2.648-0.133,3.953-0.395c0.642-0.129,1.125-0.657,1.196-1.308l0.443-4.046 c0.097-0.88,0.611-1.668,1.379-2.11c0.766-0.441,1.705-0.493,2.515-0.138l3.729,1.64c0.594,0.263,1.292,0.111,1.725-0.377 c1.804-2.029,3.151-4.35,4.008-6.896c0.208-0.618-0.008-1.301-0.535-1.688L39.139,26.282z M24,31c-3.866,0-7-3.134-7-7s3.134-7,7-7 s7,3.134,7,7S27.866,31,24,31z" />
                </svg>
            </motion.div>

            <motion.div
                onHoverStart={() => set_can_select(false)}
                onHoverEnd={() => set_can_select(true)}
                style={{
                    zIndex: 99,
                    position: "fixed",
                    x: `calc(${x}px + 4rem)`,
                    y: `calc(${y}px - 3rem)`,
                    background: transparent(sec, 0.4),
                    WebkitBackdropFilter: "blur(4px)",
                    backdropFilter: "blur(4px)",
                    padding: ".7rem",
                    border: "2px solid white",
                    paddingRight: "4rem",
                    borderRadius: ".8rem",
                }}
                animate={{
                    opacity: props.length > 0 ? 1 : 0,
                }}
            >
                {...total_props.map(property => {
                    if (props.findIndex(p => p == property.id) == -1) return null;
                    return <motion.div style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        fontWeight: 600

                    }}
                        key={v4()}

                    >
                        <motion.p
                            style={{
                                userSelect: "none",
                                fontWeight: 800,
                                fontFamily: "Poppins"
                            }}
                        >{property.id.toUpperCase()}</motion.p>
                        {property.type == "color" ? <input
                            type="color"
                            style={{
                                zIndex: 99,
                                width: "2rem",
                                height: "2rem",
                                border: "none",
                                padding: 0,
                                background: "rgba(0,0,0,0)",
                            }}
                            value={
                                selected.length == 1 ?
                                    (getObject(selected[0], points, points_calc, segments) != -1 ?
                                        rgbToHex(getObject(selected[0], points, points_calc, segments)[property.id]) || "#ffffff"
                                        : "#ffffff")
                                    : '#ffffff'
                            }
                            onChange={(event) => modifyProperty(property, event)}
                        /> : null}
                        {property.type == "checkbox" ? <input
                            type="checkbox"
                            style={{
                                zIndex: 99,
                                border: "none",
                                aspectRatio: 1,
                                height: "2rem",
                                WebkitBackdropFilter: "blur(4px)",
                                backdropFilter: "blur(4px)",
                                fontSize: "1.2rem",
                                padding: 0,
                                resize: "none",
                                textAlign: "center",
                                background: "rgba(20,20,20,0.2)",
                                borderRadius: "0.8rem"
                            }}
                            value={
                                selected.length == 1 ?
                                    (getObject(selected[0], points, points_calc, segments) != -1 ?
                                        getObject(selected[0], points, points_calc, segments)[property.id] || false
                                        : false)
                                    : false
                            }
                            onChange={(event) => modifyProperty(property, event)}
                        /> : null}
                        {property.type == "char" ? <textarea
                            style={{
                                zIndex: 99,
                                border: "none",
                                aspectRatio: 1,
                                height: "2rem",
                                WebkitBackdropFilter: "blur(4px)",
                                backdropFilter: "blur(4px)",
                                fontSize: "1.2rem",
                                padding: 0,
                                resize: "none",
                                textAlign: "center",
                                background: "rgba(20,20,20,0.2)",
                                borderRadius: "0.8rem"
                            }}
                            value={
                                selected.length == 1 ?
                                    (getObject(selected[0], points, points_calc, segments) != -1 ?
                                        getObject(selected[0], points, points_calc, segments)[property.id] || ""
                                        : "")
                                    : ''
                            }
                            placeholder="-"
                            onChange={(event) => modifyProperty(property, event)}
                        /> : null}
                        {property.type == "text" ? <textarea
                            style={{
                                zIndex: 99,
                                border: "none",
                                height: "1.85rem",
                                fontSize: "1.2rem",
                                WebkitBackdropFilter: "blur(4px)",
                                backdropFilter: "blur(4px)",
                                padding: 0,
                                fontWeight: property.id == "formula" ? 'lighter' : 'bold',
                                fontFamily: property.id == "formula" ? "Poppins" : "Crimson Text",
                                resize: "none",
                                textAlign: "center",
                                background: "rgba(20,20,20,0.2)",
                                borderRadius: "0.8rem"
                            }}
                            placeholder="-"
                            value={
                                selected.length > 0 ?
                                    (getObject(selected[0], points, points_calc, segments) != -1 ?
                                        (getObject(selected[0], points, points_calc, segments)[property.id] || "")
                                        : "")
                                    : ''
                            }
                            onChange={(event) => {
                                modifyProperty(property, event)
                            }}
                        /> : null}
                    </motion.div>
                })}

            </motion.div>
        </motion.div>
    )
}