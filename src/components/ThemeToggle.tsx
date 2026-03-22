import { Moon, Sun, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";

const ThemeToggle = () => {
  const { theme, toggleTheme, mounted } = useTheme();

  // Guard against hydration mismatch
  if (!mounted) {
    return (
      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-muted/20 animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={`h-8 w-8 sm:h-10 sm:w-10 relative overflow-hidden group rounded-xl transition-all duration-500 border-none shadow-sm ${
        isDark 
          ? 'bg-indigo-950/40 hover:bg-indigo-900/60' 
          : 'bg-amber-500/10 hover:bg-amber-500/20'
      }`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme === "dark" ? "dark" : "light"}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex items-center justify-center pt-0.5"
        >
          {isDark ? (
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 fill-amber-400/20 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          ) : (
            <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 fill-indigo-600/20 drop-shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {isDark && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
                style={{ 
                  left: `${20 + i * 30}%`, 
                  top: `${30 + (i % 2) * 20}%`,
                  animationDelay: `${i * 0.5}s`
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </Button>
  );
};

export default ThemeToggle;

