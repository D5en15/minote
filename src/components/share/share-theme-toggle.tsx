"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type ThemePreference = "light" | "dark";

function getPreferredTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem("minote-share-theme");

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ShareThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(getPreferredTheme);

  useEffect(() => {
    window.localStorage.setItem("minote-share-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <Button
      aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      size="icon"
      type="button"
      variant="outline"
    >
      {theme === "dark" ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
