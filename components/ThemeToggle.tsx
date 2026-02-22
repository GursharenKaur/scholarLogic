"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
    const { theme, toggle } = useTheme();

    return (
        <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className={`group relative w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200
        border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-300
        dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700
        ${className}`}
        >
            {/* Sun icon — visible in dark mode (click to go light) */}
            <Sun
                className={`absolute w-4 h-4 transition-all duration-300 ${theme === "dark"
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 -rotate-90 scale-75"
                    }`}
            />
            {/* Moon icon — visible in light mode (click to go dark) */}
            <Moon
                className={`absolute w-4 h-4 transition-all duration-300 ${theme === "light"
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 rotate-90 scale-75"
                    }`}
            />
        </button>
    );
}
