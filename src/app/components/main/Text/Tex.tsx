import { MouseEventHandler, useEffect, useRef } from "react";
import katex from 'katex';
import { useAtom } from "jotai";
import { SECONDARY } from "@/app/data/globals";
import { transparent } from "@/app/data/management";

export default function KaTeX({ tex, className = "" }: { tex: string, className?: string, onClick? : (event:MouseEventHandler<HTMLDivElement>)=>void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [sec] = useAtom(SECONDARY);
    useEffect(() => {
        try {
            if (containerRef.current) {
                containerRef.current.style.background = transparent(sec, 0.3);
            }
            katex.render(tex, containerRef.current as HTMLDivElement);
        } catch (error) {
            if (containerRef.current) {
                containerRef.current.style.background = "rgba(255,100,100,.2)";
            }
            (containerRef.current as HTMLDivElement).innerHTML = error + `<br><br>Formula: "${tex}"`;
        }
    }, [tex, sec]);

    return <div
        style={{
            borderRadius : ".8rem",
            userSelect : "none",
            padding:8,
            marginBottom : -20,
            
        }}
        ref={containerRef}
        className={className}
        />;
}