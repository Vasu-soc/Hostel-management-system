import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 sm:h-10 sm:w-10"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
      ) : (
        <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
      )}
    </Button>
  );
};

export default ThemeToggle;
