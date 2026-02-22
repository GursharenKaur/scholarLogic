import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScholarLogic — AI-Powered Scholarship Matching",
  description: "Find scholarships you actually qualify for, powered by AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      {/* suppressHydrationWarning needed because ThemeProvider sets class client-side */}
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Blocking script: read saved theme BEFORE first paint to prevent flash */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('sl-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
            }}
          />
        </head>
        <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
