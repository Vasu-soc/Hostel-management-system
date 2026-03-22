import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl opacity-0"
        aria-hidden="true"
      />
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 sm:h-10 sm:w-10 relative overflow-hidden group rounded-xl hover:bg-primary/10 transition-all duration-300"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 fill-amber-500/20 transition-all" />
      ) : (
        <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 fill-indigo-600/10 transition-all" />
      )}
    </Button>
  );
};

export default ThemeToggle;

