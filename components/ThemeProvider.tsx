"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "light",
    toggle: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");

    // On first mount, read saved preference or system preference
    useEffect(() => {
        const saved = localStorage.getItem("sl-theme") as Theme | null;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initial: Theme = saved ?? (prefersDark ? "dark" : "light");
        setTheme(initial);
        document.documentElement.classList.toggle("dark", initial === "dark");
    }, []);

    const toggle = () => {
        setTheme((prev) => {
            const next: Theme = prev === "dark" ? "light" : "dark";
            document.documentElement.classList.toggle("dark", next === "dark");
            localStorage.setItem("sl-theme", next);
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}
