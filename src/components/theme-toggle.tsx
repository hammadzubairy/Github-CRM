"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const loadThemeMenu = () => import("./theme-menu");

const ThemeMenu = dynamic(loadThemeMenu, { ssr: false, loading: () => <ThemeButton /> });

function ThemeButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" size="icon" aria-label="Change theme" aria-haspopup="menu" {...props}>
      <SunIcon className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
    </Button>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const [requested, setRequested] = useState(false);

  if (requested) return <ThemeMenu trigger={<ThemeButton className={className} />} />;
  return (
    <ThemeButton
      className={className}
      onPointerEnter={() => void loadThemeMenu()}
      onFocus={() => void loadThemeMenu()}
      onClick={() => setRequested(true)}
    />
  );
}
