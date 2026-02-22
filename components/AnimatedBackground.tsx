"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let t = 0;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Color stops for the wave lines — blue → purple → violet
        const palette = [
            "rgba(99,102,241,",   // indigo
            "rgba(139,92,246,",   // violet
            "rgba(59,130,246,",   // blue
            "rgba(168,85,247,",   // purple
            "rgba(96,165,250,",   // sky
        ];

        function drawWave(
            offsetY: number,
            amplitude: number,
            frequency: number,
            phase: number,
            color: string,
            lineWidth: number,
            alpha: number
        ) {
            if (!ctx || !canvas) return;
            ctx.beginPath();
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color + alpha + ")";

            for (let x = 0; x <= canvas.width; x += 2) {
                const nx = x / canvas.width;
                const y =
                    offsetY +
                    Math.sin(nx * frequency * Math.PI + phase + t) * amplitude +
                    Math.sin(nx * frequency * 0.5 * Math.PI + phase * 1.3 + t * 0.7) * amplitude * 0.4;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        function frame() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const H = canvas.height;
            const W = canvas.width;

            // Draw layered organic contour waves — right-of-center cluster
            const cx = W * 0.62;
            const layers = 28;

            for (let i = 0; i < layers; i++) {
                const progress = i / layers;
                const color = palette[i % palette.length];
                const alpha = 0.12 + progress * 0.55;
                const amplitude = 60 + progress * 90;
                const freq = 1.5 + progress * 1.2;
                const phase = (i * 0.45) + progress * 2;
                const lineW = 0.8 + progress * 0.6;

                // vertical fan — spread waves from center outward
                const spreadY = H * 0.5 + (i - layers / 2) * (H / layers) * 1.1;

                drawWave(
                    spreadY,
                    amplitude * (1 - Math.abs(i - layers / 2) / layers * 0.6),
                    freq,
                    phase,
                    color,
                    lineW,
                    alpha
                );
            }

            // Second cluster — bottom right
            for (let i = 0; i < 14; i++) {
                const progress = i / 14;
                const color = palette[(i + 2) % palette.length];
                const alpha = 0.08 + progress * 0.3;
                const amplitude = 30 + progress * 55;
                const freq = 2 + progress * 1.5;
                const phase = (i * 0.6) + 3;
                const lineW = 0.6 + progress * 0.5;
                const spreadY = H * 0.82 + (i - 7) * (H / 18) * 0.9;

                drawWave(spreadY, amplitude, freq, phase, color, lineW, alpha);
            }

            t += 0.005;
            animId = requestAnimationFrame(frame);
        }

        frame();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.9 }}
        />
    );
}
