"use client"
import { motion } from "framer-motion";
import style from "./styles.module.css";
import { useAtom } from "jotai";
import { ACCENT, GRID_POSITION, MODE, SECONDARY, SELECTED_GRAPH } from "@/app/data/globals";
import React, { useEffect, useRef, useState } from "react";
import { BACKGROUND } from '../../../data/globals';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { RGB2string, rgbToHex, transparent } from "@/app/data/management";
import { GRAPHS } from "@/app/data/elements";

export default function GraphGallery() {
    const [current_mode, set_mode] = useAtom(MODE);
    const [Graphs, setGraphs] = useAtom(GRAPHS);
    const [accent] = useAtom(ACCENT);
    const [bgr] = useAtom(BACKGROUND);
    const [sec] = useAtom(SECONDARY);
    const [selected] = useAtom(SELECTED_GRAPH);

    const [manageble_input_x, set_magageable_input_x] = useState<boolean>(true);
    const [input_x, set_input_x] = useState('');
    const [input_y, set_input_y] = useState('');
    const [manageble_input_y, set_magageable_input_y] = useState<boolean>(true);
    const index = Graphs.findIndex(g => g.id == selected);
    const gallery_ref = useRef<HTMLDivElement>(null);
    return (
        <>
            <motion.div
                className={style.EuclidianGallery}
                ref={gallery_ref}
                style={{
                    left: current_mode == "graph" ? "calc(70% - 1rem)" : "100%",
                    border: `2px solid ${accent}`,
                    display: 'flex',
                    alignContent: 'center',
                    flexDirection: 'column'
                }}

            >
                <h1 className={style.Title1} style={{ color: accent }} >GRAPH</h1>
                <br />
                <br />
                {selected != "" ?
                    <>
                        <div
                            style={{
                                display: "flex",
                                gap: 20,
                                width: '90%',
                                alignItems: "center"
                            }}
                        >
                            <h2 style={{
                                color: accent,
                                fontWeight: 500,
                                marginLeft: 20,
                                fontFamily: "Poppins",
                                textAlign: 'center'
                            }} >
                                Range X
                            </h2>
                            <ReactTextareaAutosize
                                spellCheck={false}
                                style={{
                                    borderRadius: '0.8rem',
                                    background: manageble_input_x ? transparent(sec, 0.2) : "rgba(233, /1, 81, .4)",
                                    resize: 'none',
                                    border: "1px solid white",
                                    padding: 7,
                                    width: '100%',
                                    fontFamily: "Poppins"
                                }}
                                value={input_x.length > 0 ? input_x : (index > -1 ? Graphs[index].range_x : 1)}
                                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    const val = event.target.value;
                                    set_input_x(val);
                                    if (!val) {
                                        const clone = [...Graphs]
                                        clone[clone.findIndex(g => g.id == selected)].range_x = 1;
                                        setGraphs(clone);
                                        return;
                                    }
                                    var translated;
                                    try {
                                        translated = eval(val);
                                        set_magageable_input_x(true);
                                    } catch (error) {
                                        translated = 1;
                                        set_magageable_input_x(false);
                                    }
                                    const clone = [...Graphs]
                                    clone[clone.findIndex(g => g.id == selected)].range_x = translated;
                                    setGraphs(clone);
                                }}
                            />
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: 20,
                                width: '90%',
                                alignItems: "center"
                            }}
                        >
                            <h2 style={{
                                color: accent,
                                fontWeight: 500,
                                marginLeft: 20,
                                fontFamily: "Poppins",
                                textAlign: 'center'
                            }} >
                                Range Y
                            </h2>
                            <ReactTextareaAutosize
                                spellCheck={false}
                                style={{
                                    borderRadius: '0.8rem',
                                    fontFamily: "Poppins",
                                    background: manageble_input_y ? transparent(sec, 0.2) : "rgba(233, 81, 81, .4)",
                                    resize: 'none',
                                    border: "1px solid white",
                                    padding: 7,
                                    width: '100%'
                                }}
                                value={input_y.length > 0 ? (index > -1 ? Graphs[index].range_y : 1) : 1}
                                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    const val = event.target.value;
                                    set_input_y(val);
                                    if (!val) {
                                        const clone = [...Graphs]
                                        clone[clone.findIndex(g => g.id == selected)].range_y = 1;
                                        setGraphs(clone);
                                        return;
                                    }
                                    var translated;
                                    try {
                                        translated = eval(val);
                                        set_magageable_input_y(true);
                                    } catch (error) {
                                        translated = 1;
                                        set_magageable_input_y(false);
                                    }
                                    const clone = [...Graphs]
                                    clone[clone.findIndex(g => g.id == selected)].range_y = translated;
                                    setGraphs(clone);
                                }}
                            />
                        </div>
                        <br />
                        <div
                            style={{
                                display: "flex",
                                gap: 20,
                                width: '90%',
                                alignItems: "center"
                            }}
                        >
                            <h2 style={{
                                color: accent,
                                fontWeight: 500,
                                marginLeft: 20,
                                fontFamily: "Poppins",
                                textAlign: 'center'
                            }} >
                                Quality
                            </h2>
                            <input
                                spellCheck={false}
                                style={{
                                    borderRadius: '0.8rem',
                                    background: transparent(sec, 0.2),
                                    resize: 'none',
                                    border: "1px solid white",
                                    fontFamily: "Poppins",
                                    padding: 7,
                                    width: '100%'
                                }}
                                type="number"
                                title="graph-res"
                                value={index > -1 ? Graphs[index].resolution : 0}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    const val = event.target.value;
                                    const clone = [...Graphs]
                                    clone[clone.findIndex(g => g.id == selected)].resolution = parseInt(val);
                                    setGraphs(clone);
                                }}
                            />
                        </div>
                        <br />
                        <h1
                            style={{
                                textAlign: "center",
                                fontFamily: "Poppins",
                                fontWeight: 800,
                                fontSize: 30,
                            }}
                        >FUNCTIONS</h1>
                        <div
                            style={{
                                borderRadius: '0.8rem',
                                background: transparent(sec, 0.2),
                                display: 'flex',
                                width: '90%',
                                flexDirection: 'column',
                                marginLeft: '5%',
                                gap: 20,
                                padding: 10
                            }}
                        >
                            {index > -1 ? Graphs[index].functions.map((func, i) => (
                                <motion.div
                                    key={Graphs[index].id + "-" + i}
                                    style={{
                                        borderRadius: '0.8rem',
                                        background: transparent(sec, 0.2),
                                        border: "1px solid white",
                                        display: 'flex',
                                        gap: 10,
                                        justifyContent: 'center',
                                        alignContent: 'center',
                                        alignItems: "center",
                                        paddingRight: 5
                                    }}
                                >
                                    <ReactTextareaAutosize
                                        value={RGB2string(Graphs[index].functions[i].expression || "rgb(0,0,0)")}
                                        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                                            const clone = [...Graphs];
                                            if (!event.target.value) {
                                                clone[index].functions[i].expression = "";
                                                return;
                                            }
                                            clone[index].functions[i].expression = event.target.value;
                                            setGraphs(clone);
                                        }}
                                        style={{
                                            background: "rgba(0,0,0,0)",
                                            fontFamily: "Poppins",
                                            resize: 'none',
                                            outline: 'none',
                                            padding: 7,
                                            width: '80%'
                                        }}
                                    />
                                    <motion.input
                                        type="color"
                                        title="func-col"
                                        style={{
                                            background: 'none',
                                            height: '100%',
                                            aspectRatio: 1,
                                        }}
                                        whileHover={{
                                            border: "2px solid white"
                                        }}
                                        value={rgbToHex(Graphs[index].functions[i].color || "rgb(0,0,0)")}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            const clone = [...Graphs];
                                            console.log(event.target.value);
                                            clone[index].functions[i].color = event.target.value;
                                            setGraphs(clone);
                                        }}
                                    />
                                    <motion.div
                                        whileHover={{
                                            background: "rgba(243, 37, 37, .5)"
                                        }}
                                        style={{
                                            userSelect: "none",
                                            textAlign: "center",
                                            aspectRatio: 1,
                                            border: "2px solid rgb(243, 37, 37)",
                                            color: "rgb(243, 37, 37)",
                                            background: "rgba(243, 37, 37, .2)",
                                            height: "80%",
                                            fontWeight: 800,
                                            paddingTop: 5,
                                            borderRadius: ".8rem"
                                        }}
                                        onClick={() => {
                                            const clone = [...Graphs]
                                            clone[index].functions.splice(i, 1);
                                            setGraphs(clone);
                                        }}
                                    >
                                        X
                                    </motion.div>

                                </motion.div>
                            )) : null}
                            <motion.div
                                style={{
                                    background: transparent(sec, 0.4),
                                    border: '2px solid rgb(60, 236, 133)',
                                    color: "rgb(60,236, 133)",
                                    borderRadius: '0.8rem',
                                    fontFamily: "Poppins",
                                    fontWeight: 1000,
                                    textAlign: 'center',
                                    userSelect: 'none',
                                    fontSize: 40,
                                }}
                                whileHover={{
                                    background: transparent("rgb(60, 236, 133)", 0.2),
                                    scale: 1.04
                                }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    const content = "x";
                                    const color = "#ff0000";
                                    const func = { expression: content, color: color };
                                    const clone = [...Graphs];
                                    clone[index].functions.push(func);
                                    setGraphs(clone);
                                }}
                            >+</motion.div>
                        </div>
                    </>
                    : <p
                        style={{
                            padding: 20,
                            fontFamily: "Poppins",
                            fontWeight: 300,
                            textAlign: 'center',
                            height: '100%'
                        }}
                    >Select a graph in order to edit it.</p>}
            </motion.div>
        </>)
}