"use client"
import { ACCENT, BACKGROUND, MODE, SECONDARY, SHOW_GRID } from "@/app/data/globals";
import { useAtom } from "jotai";
import { motion } from 'framer-motion';
import style from "./styles.module.css";
import { modify, parseRGB, RGB2string, transparent } from "@/app/data/management";
import { themes } from "@/app/data/elements";

export default function Menu() {
    const [current_mode, set_mode] = useAtom(MODE);
    const [accent, set_accent] = useAtom(ACCENT);
    const [secondary, set_secondary] = useAtom(SECONDARY);
    const [bgr, set_bgr] = useAtom(BACKGROUND);
    const [grid, set_grid] = useAtom(SHOW_GRID);
    return (<motion.div
        className={style.Menu}
        style={{
            left: current_mode == "menu" ? "calc(76% - 1rem)" : "100%",
            border: `2px solid ${modify(accent, 1.3)}`
        }}
    >
        <h1
            className={style.Title1}
            style={{ color: accent }}
        >MENU</h1>
        <br />
        <br />
        <motion.div
            style={{
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                padding: 5,
                borderRadius: "0.8rem",
            }}
            animate={{
                background: transparent(secondary, 0.3),

            }}
        >
            {...themes.map(t => (<motion.div
                key={t.name}
                style={{
                    background: RGB2string(t.background),
                    width: 50,
                    aspectRatio: 1,
                    borderRadius: "0.8rem",
                }}
                onTap={() => {
                    set_bgr(RGB2string(t.background));
                    set_accent(RGB2string(t.accent));
                    set_secondary(RGB2string(t.secondary))
                }}
            />))}
        </motion.div>

    </motion.div >)
}