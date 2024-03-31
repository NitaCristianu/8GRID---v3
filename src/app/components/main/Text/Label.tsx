"use client"
import { labels_data } from '@/app/data/elements';
import { ACCENT, BACKGROUND, GRID_POSITION, HOVERING_LABELS, MODE, SECONDARY, SELECTED, SELECT_RECT, VARIABLES, vec2D } from '@/app/data/globals';
import { motion, useScroll } from 'framer-motion';
import { useAtom } from 'jotai';
import React, { FormEvent, RefObject, createRef, useCallback, useEffect, useRef, useState } from 'react';
import style from "./styles.module.css";
import { createFragmentList, transparent } from '@/app/data/management';
import { usePrevious } from '@/app/hooks/usePrevious';
import ReactTextareaAutosize from 'react-textarea-autosize';
import 'froala-editor/css/froala_style.min.css';
import { Fragment, Tag, variable } from '@/app/data/props';
import 'katex/dist/katex.min.css';
import KaTeX from './Tex';

interface slider_props {
    at: number,
    var: string,
    from: number,
    to: number
}


export interface Label_Props {
    id: string
}

function getSlider(inputString: string): slider_props {
    const varPattern = /var\s+(\w+)/;
    const fromPattern = /from\s+(-?[\d.]+)/;
    const toPattern = /to\s+(-?[\d.]+)/;
    const atPattern = /at\s+(-?[\d.]+)/;


    const varMatch = inputString.match(varPattern);
    const fromMatch = inputString.match(fromPattern);
    const toMatch = inputString.match(toPattern);
    const atMatch = inputString.match(atPattern);

    var varValue, fromValue, toValue, atValue;
    if (varMatch)
        varValue = varMatch[1];
    if (fromMatch)
        fromValue = parseFloat(fromMatch[1]);
    if (toMatch)
        toValue = parseFloat(toMatch[1]);
    if (atMatch)
        atValue = parseFloat(atMatch[1]);

    return {
        var: varValue || "",
        from: fromValue || 0,
        to: toValue || 1,
        at: atValue || 0.5
    }
}

export default function Label(props: Label_Props) {
    const { id } = props;
    const [data, set_data] = useAtom(labels_data);
    const [mode, set_mode] = useAtom(MODE);
    const [offset, set_offset] = useAtom(GRID_POSITION);
    const [bgr] = useAtom(BACKGROUND);
    const [acc] = useAtom(ACCENT);
    const [sec] = useAtom(SECONDARY);
    const label_self = data[data.findIndex(l => l.id == id)];
    const index = data.findIndex(l => l.id == id);
    const self_ref = useRef<HTMLDivElement>(null);
    const content = label_self?.content;
    const text_area = useRef<HTMLTextAreaElement>(null);
    const [variables, set_variables] = useAtom<variable[]>(VARIABLES);
    const [hovering_labels, setHoveringLabels] = useAtom(HOVERING_LABELS);
    const [dragging, set_dragging] = useState<boolean>(false);
    const [mpos, SetMpos] = useState<vec2D>({ 'x': 0, 'y': 0 });
    const prevMpos = usePrevious(mpos);
    const [x, set_x] = useState(0);
    const [y, set_y] = useState(0);
    const [edit_mode, set_edit_mode] = useState(false);

    const [render_queue, set_render_queue] = useState<Fragment[]>([{ content: content || "", type: "default" }]);

    const mDown = useCallback((event: MouseEvent) => {
        if (event.button != 0) return;
        const maindiv = self_ref.current;
        if (!maindiv) return;
        const rect = maindiv.getBoundingClientRect();
        if (!(event.clientX > rect.left && event.clientX < rect.right &&
            event.clientY > rect.top && event.clientY < rect.bottom)) return;
        if (document.activeElement == text_area.current) return;
        set_dragging(true);
    }, [])

    const mUp = useCallback((event: MouseEvent) => {
        if (event.button != 0) return;
        set_dragging(false);
    }, [])

    const onMove = useCallback((event: MouseEvent) => {
        SetMpos({ x: event.clientX, y: event.clientY });
        if (!dragging) return;
        const labels = [...data];
        const index = labels.findIndex(l => l.id == id);
        labels[index].left += event.clientX - prevMpos.x;
        labels[index].top += event.clientY - prevMpos.y;
        set_data(labels);
    }, [id, set_data, data, dragging, mpos, prevMpos])

    const remove = () => {
        setHoveringLabels(prev => {
            const clone = [...prev];
            clone.splice(clone.findIndex(g => g == label_self.id));
            return clone;
        })
        const clone = [...data];
        clone.splice(index, 1);
        set_data(clone);
    }

    useEffect(() => {
        set_x(label_self.left + offset.x);
        set_y(label_self.top + offset.y);

        window.addEventListener("mousedown", mDown);
        window.addEventListener("mouseup", mUp);
        window.addEventListener("mousemove", onMove)
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mousedown", mDown);
            window.removeEventListener("mouseup", mUp);
        }
    }, [mDown, mUp, onMove, label_self.left, label_self.top, offset, data, dragging])
    useEffect(() => {
        const tags: Tag[] = [
            { name: "slider", open: "<s>", closing: "</s>" },
            { name: "TeX", open: "<f>", closing: "</f>" },
        ]
        let toParse = content;
        var bold_i = 0;
        toParse = toParse.replace(/\n/g, "<br>")
        toParse = toParse.replaceAll("**", () => { bold_i++; return bold_i % 2 == 1 ? "<strong>" : "</strong>"; })
        toParse = toParse.replaceAll("*", () => { bold_i++; return bold_i % 2 == 1 ? "<em>" : "</em>"; })
        const parsedList = createFragmentList(toParse, tags);
        set_render_queue(parsedList);
    }, [content, edit_mode, data])
    return <motion.div
        ref={self_ref}
        className={style.Label}
        style={{
            background: transparent(sec, 0.2),
            zIndex: 6,
            left: x,
            top: y,
        }}
        onHoverEnd={() => {
            setHoveringLabels(prev => {
                const clone = [...prev];
                clone.splice(clone.findIndex(g => g == label_self.id));
                return clone;
            });
        }}
        onHoverStart={() => {
            if (!hovering_labels.includes(label_self.id)) {
                setHoveringLabels(prev => [...prev, label_self.id]);
            }
        }}
        onDoubleClick={() => {
            if (document.activeElement == text_area.current) return;
            if (edit_mode) {
                const content = text_area.current?.value || '';
                const labels = [...data];
                labels[index].content = content;
                set_data(labels);
            }
            set_edit_mode(prev => !prev);
        }}
    >

        <h1
            style={{
                fontFamily: "Poppins",
                userSelect: 'none',
                fontSize: edit_mode ? '1rem' : '0rem',
                transition: 'fontSize 0.2s',
                alignSelf: 'center',
                fontWeight: 'bolder',
            }}

        >
            EDIT MODE
        </h1>
        {edit_mode ?
            <motion.div
                whileHover={{ rotate: 3, scale: 0.9 }}
                whileTap={{ scale: 1.1 }}
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
                onClick={remove}
            >

                <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="1.5rem" height="1.5rem">
                    <path d="M 10 2 L 9 3 L 3 3 L 3 5 L 21 5 L 21 3 L 15 3 L 14 2 L 10 2 z M 4.3652344 7 L 6.0683594 22 L 17.931641 22 L 19.634766 7 L 4.3652344 7 z" />
                </svg>
            </motion.div>
            : null
        }
        {
            edit_mode ?
                <div style={{ display: "flex" }}>
                    <ReactTextareaAutosize
                        ref={text_area}
                        title={label_self.content}
                        contentEditable
                        style={{
                            resize: 'none',
                            borderRadius: "0.8rem",
                            background: 'rgba(0,0,0,0)',
                            WebkitBackdropFilter: "blur(4px)",
                            backdropFilter: "blur(4px)",
                            padding: ".7rem",
                            width: '100%'

                        }}
                    >
                        {label_self.content}
                    </ReactTextareaAutosize>
                </div>
                : <div
                    style={{
                        userSelect: 'none'
                    }}
                >{render_queue.map((frag, i) => {
                    if (frag.type == "default") {
                        return <p
                            key={label_self.id + "-" + i}
                            style={{
                                userSelect: 'none',
                                color: acc
                            }}
                            dangerouslySetInnerHTML={{ __html: frag.content }}
                        />
                    }
                    if (frag.type == "TeX") {
                        return <KaTeX
                            key={label_self.id + "-" + i}
                            tex={frag.content}
                        />
                    }
                    if (frag.type == "slider") {
                        const props = getSlider(frag.content);
                        var index = variables.findIndex(p => p.name == props.var);
                        if (index == -1) {
                            const copy = [...variables];
                            index = copy.push({ name: props.var, value: props.at }) - 1;
                            set_variables(copy);
                        }

                        return <div
                            key={label_self.id + "-" + i}
                            style={{
                                fontFamily: "Poppins",
                                fontWeight: "800",
                                gap: "1rem",
                                background: transparent(sec, 0.3),
                                padding: 10,
                                borderRadius: "0.8rem",
                                marginBottom: -20
                            }}
                        >
                            <p style={{
                                marginLeft: 20,
                                color: acc,
                                fontFamily: "Crimson Text",
                                marginBottom: -15
                            }}>{props.var} = {variables[index] && variables[index].value.toFixed(2)}</p>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "1rem",
                                    padding: 20,
                                }}
                            >
                                <p
                                    style={{ color: acc }}
                                >{props.from}</p>
                                <input
                                    title="slider"
                                    type="range"
                                    min={props.from}
                                    style={{
                                        width: '100%',
                                    }}
                                    max={props.to}
                                    step={0.0001}
                                    value={variables[index] && variables[index].value}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                        set_dragging(false);
                                        const copy = [...variables];
                                        copy[copy.findIndex(p => p.name == props.var)].value = parseFloat(event.target.value);
                                        set_variables(copy);
                                    }}
                                ></input>
                                <p style={{ color: acc }} >{props.to}</p>
                            </div>
                        </div>
                    }
                    return null;
                })}</div>
        }

    </motion.div >


}