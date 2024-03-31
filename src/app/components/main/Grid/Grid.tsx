"use client"
import useResize from "@/app/hooks/useResize";
import { ReactElement, useEffect, useRef, useState } from "react";
import style from "./styles.module.css";
import { ACCENT, CELL_SIZE, DRAG_SPEED, GRID_POSITION, SHOW_GRID, vec2D } from "@/app/data/globals";
import ShaderBackground from './Background';
import { useMotionValue } from "framer-motion";
import { useAtom } from "jotai";
import { transparent } from "@/app/data/management";

function DrawGrid(context: CanvasRenderingContext2D, offset: vec2D = { x: 0, y: 0 }, size: vec2D = { x: window.innerWidth + 5, y: window.innerHeight + 5 }) {
    context.beginPath();
    for (let x = offset.x % CELL_SIZE; x < size.x; x += CELL_SIZE) {
        context.moveTo(x, 0);
        context.lineTo(x, size.y);
    }

    for (let y = offset.y % CELL_SIZE; y < size.y; y += CELL_SIZE) {
        context.moveTo(0, y);
        context.lineTo(size.x, y);
    }
    context.closePath();
}

export default function Grid(): ReactElement {
    const grid = useRef<HTMLCanvasElement>(null);
    const size = useResize();
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [show_grid, _] = useAtom(SHOW_GRID);
    const [accent] = useAtom(ACCENT);

    const [gridPos, set_gridPos] = useAtom(GRID_POSITION);
    const [dragging, set_dragging] = useState(false);

    useEffect(() => {
        const OnMove = (event: MouseEvent) => {
            mouseX.set(event.clientX, false);
            mouseY.set(event.clientY, false);
            if (!dragging) return;
            set_gridPos((prev) => ({
                x: prev.x + mouseX.getVelocity() / DRAG_SPEED,
                y: prev.y + mouseY.getVelocity() / DRAG_SPEED
            }))
        }

        const OnUp = (event: MouseEvent) => {
            if (event.button == 1)
                set_dragging(false);
        }

        const OnDown = (event: MouseEvent) => {
            if (event.button == 1)
                set_dragging(true);
        }

        window.addEventListener('mousemove', OnMove);
        window.addEventListener('mouseup', OnUp);
        window.addEventListener('mousedown', OnDown);

        return () => {
            window.removeEventListener('mousemove', OnMove);
            window.removeEventListener('mouseup', OnUp);
            window.removeEventListener('mousedown', OnDown);
        }
    }, [set_gridPos,gridPos, mouseX, mouseY, dragging])
    useEffect(() => {
        const canvas = grid.current as HTMLCanvasElement;
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        
        canvas.width = size.x;
        canvas.height = size.y;
        
        context.lineWidth = 2;
        context.strokeStyle = transparent(accent, .4);
        if (show_grid)
            DrawGrid(context, gridPos)
        context.stroke();

    }, [size,accent, gridPos, show_grid]);

    return (<>
        <ShaderBackground />
        <canvas
            ref={grid}
            className={style.grid}
        >
        </canvas>
    </>)
}