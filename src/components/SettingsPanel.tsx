import React from "react";
import { Input } from "./ui/input";

interface SettingsPanelProps {
  duration: number;
  width: number;
  height: number;
  onDurationChange: (val: number) => void;
  onWidthChange: (val: number) => void;
  onHeightChange: (val: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  duration,
  width,
  height,
  onDurationChange,
  onWidthChange,
  onHeightChange,
}) => {
  return (
    <div className="flex flex-col gap-5 bg-card/40 border border-border p-5 rounded-2xl">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
        GIF Configurations
      </h3>

      {/* Frame Duration */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-zinc-400">
          Frame Duration (ms)
        </label>
        <Input
          type="number"
          value={duration || ""}
          onChange={(e) => onDurationChange(Math.max(10, parseInt(e.target.value) || 0))}
          placeholder="e.g. 500"
          min="10"
        />
      </div>

      {/* Resolution */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-zinc-400">
          Resolution (Width × Height)
        </label>
        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <Input
              type="number"
              value={width || ""}
              onChange={(e) => onWidthChange(Math.max(1, parseInt(e.target.value) || 0))}
              placeholder="Width"
              min="1"
            />
          </div>
          <div>
            <Input
              type="number"
              value={height || ""}
              onChange={(e) => onHeightChange(Math.max(1, parseInt(e.target.value) || 0))}
              placeholder="Height"
              min="1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
