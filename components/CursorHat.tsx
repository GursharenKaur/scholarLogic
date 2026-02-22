"use client";

import { useEffect, useRef, useState } from "react";

export function CursorHat() {
    const pos = useRef({ x: -200, y: -200 });
    const smooth = useRef({ x: -200, y: -200 });
    const [display, setDisplay] = useState({ x: -200, y: -200 });
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            pos.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener("mousemove", onMove);

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        const tick = () => {
            smooth.current.x = lerp(smooth.current.x, pos.current.x + 60, 0.045);
            smooth.current.y = lerp(smooth.current.y, pos.current.y + 60, 0.045);
            setDisplay({ x: smooth.current.x, y: smooth.current.y });
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener("mousemove", onMove);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <div
            className="pointer-events-none fixed z-10 select-none"
            style={{
                left: display.x,
                top: display.y,
                transform: "translate(-50%, -50%) rotate(-15deg)",
                fontSize: "3.5rem",
                opacity: 0.38,
                filter: "blur(0.5px) drop-shadow(0 0 12px rgba(99,102,241,0.6))",
                transition: "opacity 0.2s",
                willChange: "transform",
            }}
        >
            🎓
        </div>
    );
}
