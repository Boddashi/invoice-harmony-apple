
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn(
      "flex items-center justify-center",
      className
    )}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const newTheme = theme === "dark" ? "light" : "dark";
          console.log(`Toggling theme from ${theme} to ${newTheme}`);
          setTheme(newTheme);
        }}
        className="rounded-full p-2 transition-colors hover:bg-secondary/80 dark:hover:bg-secondary/30 focus:outline-none"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun size={20} className="text-neon-yellow" />
        ) : (
          <Moon size={20} />
        )}
      </Button>
    </div>
  );
}
