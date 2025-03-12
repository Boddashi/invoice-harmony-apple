
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
          setTheme(theme === "light" ? "dark" : "light");
        }}
        className="rounded-full transition-colors hover:bg-secondary/80 dark:hover:bg-secondary/30 focus:outline-none"
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <Moon size={20} className="animate-in fade-in duration-200" />
        ) : (
          <Sun size={20} className="text-neon-yellow animate-in fade-in duration-200" />
        )}
      </Button>
    </div>
  );
}
