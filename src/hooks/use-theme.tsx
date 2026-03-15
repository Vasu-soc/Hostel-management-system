import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import * as React from "react";
import { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { setTheme, resolvedTheme } = useNextTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  return {
    theme: (resolvedTheme || "light") as "light" | "dark",
    toggleTheme,
    setTheme: (newTheme: "light" | "dark") => setTheme(newTheme),
  };
}
