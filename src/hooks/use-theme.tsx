import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import * as React from "react";
import { ReactNode, useEffect, useLayoutEffect } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={false}
      storageKey="hostel-theme-preference"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  const applyTheme = (targetTheme: string) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (targetTheme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    }
  };

  const toggleTheme = () => {
    // Determine target based on current icon/meaning (the resolvedTheme)
    const targetTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(targetTheme);
    applyTheme(targetTheme);
    console.log("Switching theme to:", targetTheme);
  };

  // Sync class on mount and theme change
  useLayoutEffect(() => {
    if (resolvedTheme) {
      applyTheme(resolvedTheme);
    }
  }, [resolvedTheme]);

  return {
    theme: (resolvedTheme || "light") as "light" | "dark",
    toggleTheme,
    setTheme: (newTheme: string) => {
      setTheme(newTheme);
      applyTheme(newTheme);
    },
  };
}
