import { ChevronLeft, Eye, Waves, Gauge } from "lucide-react";
import { getSettings, updateSettings, type GameSettings } from "@/game/storage";
import { useState } from "react";

interface Props {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: Props) {
  const [settings, setSettings] = useState<GameSettings>(() => getSettings());

  function toggle(key: "reducedShake" | "colorblindMode") {
    const next = updateSettings({ [key]: !settings[key] });
    setSettings(next);
  }

  function setSensitivity(value: number) {
    const next = updateSettings({ touchSensitivity: value });
    setSettings(next);
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#150826] to-[#020814] px-5 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white">Settings</h2>
      </div>

      <div className="flex flex-col gap-4">
        <SettingRow
          icon={<Waves size={18} />}
          title="Reduced Screen Shake"
          subtitle="Softer camera shake on deaths and explosions"
          control={
            <Toggle checked={settings.reducedShake} onChange={() => toggle("reducedShake")} />
          }
        />
        <SettingRow
          icon={<Eye size={18} />}
          title="Colorblind-Friendly Colors"
          subtitle="Swaps red/green trap and goal cues for orange/blue"
          control={
            <Toggle checked={settings.colorblindMode} onChange={() => toggle("colorblindMode")} />
          }
        />
        <SettingRow
          icon={<Gauge size={18} />}
          title="Control Sensitivity"
          subtitle="How quickly the player responds to input"
          control={null}
        />
        <div className="flex items-center gap-3 -mt-2 px-1">
          <span className="text-xs text-white/40 font-mono">Slow</span>
          <input
            type="range"
            min={0.6}
            max={1.6}
            step={0.05}
            value={settings.touchSensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="flex-1 accent-cyan-400"
          />
          <span className="text-xs text-white/40 font-mono">Fast</span>
        </div>
        <div className="text-center text-xs text-white/30 font-mono -mt-2">
          {Math.round(settings.touchSensitivity * 100)}%
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  control,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-4 bg-white/5 border border-white/10">
      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-cyan-300 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium">{title}</div>
        <div className="text-white/40 text-xs">{subtitle}</div>
      </div>
      {control}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors shrink-0 ${
        checked ? "bg-cyan-400 justify-end" : "bg-white/15 justify-start"
      }`}
    >
      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
    </button>
  );
}
