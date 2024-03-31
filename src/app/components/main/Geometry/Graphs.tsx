"use client"
import dynamic from 'next/dynamic';
import { GRAPHS } from "@/app/data/elements";
import { ACCENT, BACKGROUND, GRID_POSITION, HOVERING_GRAPHS, HOVERING_LABELS, MODE, SECONDARY, SELECTED_GRAPH, VARIABLES, vec2D } from "@/app/data/globals";
import { IsPointInRect, parseRGB, ReplaceLetter, rgb, RGB2string, toGlobal, toLocal, transparent } from "@/app/data/management";
import { Graph } from "@/app/data/props";
import useResize from "@/app/hooks/useResize";
import { useAtom } from "jotai";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from 'framer-motion';
import { usePrevious } from "@/app/hooks/usePrevious";

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

interface GraphProps {
    data: Graph,
    removeFunc: () => void
}

const GraphComponent = React.memo((props: GraphProps) => {
    const [bgr] = useAtom(BACKGROUND);
    const [acc] = useAtom(ACCENT);
    const [hovering_graphs, setHoveringGraphs] = useAtom(HOVERING_GRAPHS);
    const [hovered_labels] = useAtom(HOVERING_LABELS);
    const [sec] = useAtom(SECONDARY);
    const [offset, _] = useAtom(GRID_POSITION);
    const [variables] = useAtom(VARIABLES);
    const [selected, set_selected] = useAtom(SELECTED_GRAPH);
    const [dragging, set_dragging] = useState(false);
    const [mode, set_mode] = useAtom(MODE);
    const range = Math.abs(props.data.range_x);
    const div = useRef<HTMLDivElement>(null);
    const bin = useRef<HTMLDivElement>(null);
    const [mpos, SetMpos] = useState<vec2D>({ 'x': 0, 'y': 0 });
    const [Graphs, setGraphs] = useAtom(GRAPHS);
    const prevMpos = usePrevious(mpos);
    var step = range / props.data.resolution;
    const data: { x: number[], y: number[], name: string, marker: { color: string | rgb | undefined, width: number }, mode: string }[] = useMemo(() => {
        const d: { x: number[], y: number[], name: string, marker: { color: string | rgb | undefined, width: number }, mode: string }[] = [];
        props.data.functions.forEach(func => {
            var formula = func.expression;
            const x_data: number[] = [];

            for (let x = -range; x <= range; x += step) {
                x_data.push(x);
            }
            variables.forEach(v => {
                formula = ReplaceLetter(formula, v.name, v.value);
            })
            const y_data: number[] = x_data.map(d => {
                var formula2 = formula.replace(/\(/g, " ( ").replace(/\)/g, " ) ");
                formula2 = ReplaceLetter(formula2, 'x', d);
                try {
                    return eval(formula2)
                } catch (error) {
                    return 0;
                }
            });
            d.push({ x: x_data, y: y_data, name: func.expression, mode: "lines", marker: { color: func.color, width: 9 } });
        })
        return d
    }, [props.data.functions, range, step, variables])

    const inEdit = selected == props.data.id;
    const Mdown = useCallback((event: MouseEvent) => {
        const { clientX, clientY } = event;
        const self = div?.current
        const btn = bin?.current;
        if (!self || hovered_labels.length > 0) return;
        const rect = self.getBoundingClientRect();
        const rect2 = btn?.getBoundingClientRect();
        if (!(clientX < rect.left || clientX > rect.right || clientY > rect.bottom || clientY < rect.top)) {
            if (event.button == 0) {
                set_selected(props.data.id);
                set_dragging(true);
                set_mode("graph");
            }
        }

        if (event.button == 0 && inEdit && btn && rect2 && (clientX > rect2.left && clientX < rect2.right && clientY > rect2.top && clientY < rect2.bottom)) {
            props.removeFunc();
        }
    }, [hovered_labels.length, inEdit, props, set_mode, set_selected])
    const Mup = (event: MouseEvent) => {
        set_dragging(false);
    }
    const Mmove = useCallback((event: MouseEvent) => {
        SetMpos({ x: event.clientX, y: event.clientY });
        if (dragging) {
            const clone = [...Graphs];
            clone[clone.findIndex(g => g.id == props.data.id)].x += mpos.x - prevMpos.x;
            clone[clone.findIndex(g => g.id == props.data.id)].y += mpos.y - prevMpos.y;
            setGraphs(clone);
        }
    }, [Graphs, dragging, mpos.x, mpos.y, prevMpos.x, prevMpos.y, props.data.id, setGraphs])
    useEffect(() => {
        window.addEventListener("mousedown", Mdown);
        window.addEventListener("mouseup", Mup);
        window.addEventListener("mousemove", Mmove);
        return () => {
            window.removeEventListener("mousedown", Mdown);
            window.removeEventListener("mouseup", Mup);
            window.removeEventListener("mousemove", Mmove);
        }
    }, [Mdown, Mmove, dragging, mode, selected, mpos, prevMpos, hovered_labels])

    var lenght_x = range;
    var lenght_y = props.data.range_y;

    const width = 800;
    const height = 500;
    return (<motion.div
        ref={div}
        style={{
            position: "fixed",
            left: props.data.x + offset.x,
            top: props.data.y + offset.y,
            width: width - 30,
            height: height - 100,
            borderRadius: "0.8rem",
            margin: -100,
            background: transparent(sec, 0.3),
            border: `1px solid rgba(255,255,255,0.5)`,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
        }}
        onHoverEnd={() => {
            setHoveringGraphs(prev => {
                const clone = [...prev];
                clone.splice(clone.findIndex(g => g == props.data.id));
                return clone;
            });
        }}
        onHoverStart={() => {
            if (!hovering_graphs.includes(props.data.id)) {
                setHoveringGraphs(prev => [...prev, props.data.id]);
            }
        }}
        animate={{
            boxShadow: inEdit ? `0 0 20px ${acc}` : ''
        }}
    >
        <Plot
            style={{
                margin: -50,
            }}
            data={data}
            config={{ displaylogo: false, modeBarButtonsToRemove: ['toImage'] }}
            layout={{
                width: width,
                height: height,


                xaxis: {
                    zeroline: true,
                    showline: true,
                    showgrid: false,
                    color: acc,
                    gridwidth: 3,
                    range: [-lenght_x, lenght_x],
                    fixedrange: true,
                    tickfont: { family: 'Poppins', color: 'white' },
                },
                yaxis: {
                    color: acc,
                    zeroline: true,
                    showline: true,
                    showgrid: false,
                    fixedrange: true,
                    range: [-lenght_y, lenght_y],
                    tickfont: { family: 'Poppins', color: 'white' },
                },
                legend: {
                    traceorder: 'normal',
                    font: { family: 'Poppins', size: 12, color: 'white' },
                },
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                annotations: [
                ],
            }}
        />

        {inEdit ?
            <motion.div
                ref={bin}
                style={{
                    position: "fixed",
                    left: 'calc(100% + .5rem)',
                    top: '0.4rem',
                    background: transparent(sec, 0.5),
                    WebkitBackdropFilter: "blur(6px)",
                    backdropFilter: "blur(6px)",
                    border: "2px solid white",
                    padding: 5,
                    borderRadius: ".3rem",
                    zIndex: 99,
                }}
                whileHover={{ scale: 0.9, rotate: 3 }}
                onClick={props.removeFunc}
            >

                <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="1.5rem" height="1.5rem">
                    <path d="M 10 2 L 9 3 L 3 3 L 3 5 L 21 5 L 21 3 L 15 3 L 14 2 L 10 2 z M 4.3652344 7 L 6.0683594 22 L 17.931641 22 L 19.634766 7 L 4.3652344 7 z" />
                </svg>
            </motion.div>
            : null
        }
    </motion.div>)
});

GraphComponent.displayName = "graph-component";

const GraphsComponent = React.memo(() => {

    const [selected, set_selected] = useAtom(SELECTED_GRAPH);
    const [hovering_graphs, setHoveringGraphs] = useAtom(HOVERING_GRAPHS);
    const RightClick = useCallback((event: MouseEvent) => {
        if (event.button != 2) return;
        set_selected("");
    }, [set_selected]);
    useEffect(() => {
        window.addEventListener("mouseup", RightClick);
        return () => {
            window.removeEventListener("mouseup", RightClick);
        }
    }, [selected, RightClick])

    const [Graphs, setGraphs] = useAtom(GRAPHS);
    return (<div style={{ zIndex: 2, position: "fixed", left: 0, top: 0 }}>
        {Graphs.map(data => <GraphComponent
            key={data.id}
            data={data}

            removeFunc={() => {
                const clone = [...Graphs];
                set_selected("");
                setHoveringGraphs(prev => {
                    const clone = [...prev];
                    clone.splice(clone.findIndex(g => g == data.id));
                    return clone;
                });
                clone.splice(clone.findIndex(g => g.id == data.id), 1);
                setGraphs(clone);
            }}
        />)}
    </div>)
});

GraphsComponent.displayName = "graphs-component";

export default GraphsComponent;