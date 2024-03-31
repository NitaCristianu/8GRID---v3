"use client"
import { ACCENT, BACKGROUND, mode, MODE } from "@/app/data/globals";
import styles from "./styles.module.css";
import selection_icon from './icons/selection.svg';
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { modify } from "@/app/data/management";

import Image from "next/image";
import SelectionIcon from "./assets/SelectionIcon.png";
import MenuIcon from "./assets/MenuIcon2.png";
import EuclidianGallery from "./assets/GeometryGallery.png";
import TextIc from "./assets/Text.png";
import Graph from "./assets/Graph.png";

const buttons: mode[] = [
    "menu",
    "selection",
    "euclidian",
    "graph"
]

export default function Taskbar() {
    const [current_mode, set_mode] = useAtom(MODE);
    const bgr = useAtom(BACKGROUND)[0];
    const acc = useAtom(ACCENT)[0];
    return (<div
        className={styles.taskbar}
    >
        {...buttons.map(type =>
        (<motion.div
            key={type}
            className={styles.button}
            animate={{
                marginRight: current_mode == type ? 0 : 20,
            }}
            whileHover={{
                marginRight: current_mode != type ? 20 : 5,
                scale: 1.1
            }}
            whileTap={{
                scale: 0.9
            }}
            onTap={() => {
                set_mode(type);
            }}
        >
            {type == "menu" ? <Image src={MenuIcon} alt="menu icon" /> : null}
            {type == "selection" ? <Image src={SelectionIcon} alt="selection icon" /> : null}
            {type == "euclidian" ? <Image src={EuclidianGallery} alt="euclidian gallery icon" /> : null}
            {type == "graph" ? <Image src={Graph} alt="graph icon" /> : null}
            <motion.p
                style={{
                    fontWeight: 800,
                    fontFamily: "Poppins",
                }}
                animate = {{
                    opacity : current_mode == type ? 1 : 0,
                    scale : current_mode == type ? 1 : 0.8,
                    marginLeft : current_mode == type ? '5%' : 0,
                    marginTop : current_mode == type ? '5%' : 0,

                }}
            >{(type == "euclidian" ? "BULD" : type.toUpperCase()) + " MODE"}</motion.p>
        </motion.div>))}



    </div>)
}