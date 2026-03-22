import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import * as React from "react";
import { ReactNode, useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={false}
      storageKey="hostel-theme-preference"
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return {
    theme: (theme || "light") as "light" | "dark",
    setTheme,
    toggleTheme,
    mounted,
  };
}
