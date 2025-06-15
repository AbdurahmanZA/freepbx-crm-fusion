
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const themes = [
  {
    label: "Ocean",
    value: "ocean",
    description: "Deep blue with coral accents",
    preview: (
      <span className="flex gap-1">
        <span className="w-4 h-4 rounded" style={{ background: "#1e40af" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#f97316" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }} />
      </span>
    ),
  },
  {
    label: "Forest",
    value: "forest",
    description: "Rich green with warm browns",
    preview: (
      <span className="flex gap-1">
        <span className="w-4 h-4 rounded" style={{ background: "#064e3b" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#92400e" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#fefefe", border: "1px solid #d6d3d1" }} />
      </span>
    ),
  },
  {
    label: "Sunset",
    value: "sunset",
    description: "Purple with golden highlights",
    preview: (
      <span className="flex gap-1">
        <span className="w-4 h-4 rounded" style={{ background: "#7c3aed" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#d97706" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#fef7f7", border: "1px solid #f3e8ff" }} />
      </span>
    ),
  },
];

export const ThemePicker = () => {
  const [selected, setSelected] = useState<string>(() => localStorage.getItem("theme-style") || "ocean");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", selected);
    localStorage.setItem("theme-style", selected);
  }, [selected]);

  return (
    <div className="flex flex-col gap-2 w-full max-w-sm">
      <label className="text-sm font-medium mb-1">Choose Theme</label>
      <div className="flex flex-col gap-2">
        {themes.map((theme) => (
          <Button
            key={theme.value}
            size="sm"
            variant={selected === theme.value ? "default" : "outline"}
            className="flex items-center gap-3 justify-start p-3 h-auto"
            onClick={() => setSelected(theme.value)}
          >
            {theme.preview}
            <div className="flex flex-col items-start">
              <span className="font-medium">{theme.label}</span>
              <span className="text-xs opacity-70">{theme.description}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
