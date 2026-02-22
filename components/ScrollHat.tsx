"use client";

import { useEffect, useRef, useState } from "react";

// Width of the horizontal track (matches hero content width area)
const TRACK_W = 700;

export function ScrollHat() {
    const xPos = useRef(TRACK_W * 0.1);       // start near left
    const lastScrollY = useRef(0);
    const scrollDelta = useRef(0);            // +right / -left
    const rafRef = useRef<number>(0);
    const [display, setDisplay] = useState({ x: xPos.current, tilt: -18 });

    useEffect(() => {
        lastScrollY.current = window.scrollY;

        const onScroll = () => {
            const dy = window.scrollY - lastScrollY.current; // + = down, - = up
            scrollDelta.current = dy * 2.5;                  // amplify
            lastScrollY.current = window.scrollY;
        };
        window.addEventListener("scroll", onScroll, { passive: true });

        const tick = () => {
            // Decay delta each frame
            scrollDelta.current *= 0.88;

            // Move horizontally — clamp within track
            xPos.current = Math.max(0, Math.min(TRACK_W, xPos.current + scrollDelta.current));

            // Tilt: lean right when moving right, lean left when moving left
            const tilt = -15 + scrollDelta.current * 0.6;

            setDisplay({ x: xPos.current, tilt });
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <div
            className="pointer-events-none absolute select-none"
            style={{
                left: "50%",
                top: "50%",
                width: TRACK_W,
                height: 0,
                transform: "translate(-50%, -50%)",
                zIndex: 5,
                overflow: "visible",
            }}
        >
            <span
                style={{
                    position: "absolute",
                    left: display.x,
                    top: "0px",
                    transform: `translate(-50%, -50%) rotate(${display.tilt}deg)`,
                    fontSize: "10rem",
                    opacity: 0.72,
                    filter: "drop-shadow(0 0 20px rgba(99,102,241,0.85))",
                    display: "inline-block",
                    willChange: "transform",
                }}
            >
                🎓
            </span>
        </div>
    );
}
