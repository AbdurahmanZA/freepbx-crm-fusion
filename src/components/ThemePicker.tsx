
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const themes = [
  {
    label: "Jericho Blue/Orange",
    value: "jericho",
    preview: (
      <span className="flex gap-1">
        <span className="w-4 h-4 rounded" style={{ background: "#2D5563" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#E69A3A" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#FFFFFF", border: "1px solid #ccc" }} />
      </span>
    ),
  },
  {
    label: "Indigo/Teal",
    value: "indigo",
    preview: (
      <span className="flex gap-1">
        <span className="w-4 h-4 rounded" style={{ background: "#364f6b" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#3fc1c9" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#f5f7fa", border: "1px solid #ccc" }} />
      </span>
    ),
  },
  {
    label: "Emerald/Slate",
    value: "emerald",
    preview: (
      <span className="flex gap-1">
        <span className="w-4 h-4 rounded" style={{ background: "#059669" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#374151" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#f3f4f6", border: "1px solid #ccc" }} />
      </span>
    ),
  },
  {
    label: "Minimalist Light",
    value: "minimal",
    preview: (
      <span className="flex gap-1">
        <span className="w-4 h-4 rounded" style={{ background: "#F8FAFC" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#e5e7eb" }} />
        <span className="w-4 h-4 rounded" style={{ background: "#222", border: "1px solid #ccc" }} />
      </span>
    ),
  },
];

export const ThemePicker = () => {
  const [selected, setSelected] = useState<string>(() => localStorage.getItem("theme-style") || "jericho");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", selected);
    localStorage.setItem("theme-style", selected);
  }, [selected]);

  return (
    <div className="flex flex-col gap-1 w-full max-w-xs">
      <label className="text-sm font-medium mb-1">Choose Theme</label>
      <div className="flex flex-col gap-2">
        {themes.map((theme) => (
          <Button
            key={theme.value}
            size="sm"
            variant={selected === theme.value ? "default" : "outline"}
            className="flex items-center gap-2 justify-start"
            onClick={() => setSelected(theme.value)}
          >
            {theme.preview}
            <span>{theme.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
