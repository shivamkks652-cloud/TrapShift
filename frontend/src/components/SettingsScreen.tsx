import { ChevronLeft, Eye, Waves, Gauge, Music, Volume2, Move, Contrast } from "lucide-react";
import { getSettings, updateSettings, type GameSettings } from "@/game/storage";
import { setMusicVolume, setSfxVolume } from "@/game/audio";
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

  function setNum(key: keyof GameSettings, value: number) {
    const next = updateSettings({ [key]: value });
    setSettings(next);
    if (key === "musicVolume") setMusicVolume(value);
    if (key === "sfxVolume") setSfxVolume(value);
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#150826] to-[#020814] px-5 py-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          data-testid="settings-back-btn"
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white">Settings</h2>
      </div>

      <div className="flex flex-col gap-4">
        <Slider
          icon={<Music size={18} />}
          title="Music Volume"
          testid="music-volume-slider"
          min={0} max={1} step={0.05}
          value={settings.musicVolume}
          onChange={(v) => setNum("musicVolume", v)}
        />
        <Slider
          icon={<Volume2 size={18} />}
          title="Sound Effects Volume"
          testid="sfx-volume-slider"
          min={0} max={1} step={0.05}
          value={settings.sfxVolume}
          onChange={(v) => setNum("sfxVolume", v)}
        />
        <Slider
          icon={<Move size={18} />}
          title="Touch Button Size"
          testid="touch-scale-slider"
          min={0.8} max={1.4} step={0.05}
          value={settings.touchScale}
          onChange={(v) => setNum("touchScale", v)}
        />
        <Slider
          icon={<Contrast size={18} />}
          title="Touch Button Opacity"
          testid="touch-opacity-slider"
          min={0.3} max={1} step={0.05}
          value={settings.touchOpacity}
          onChange={(v) => setNum("touchOpacity", v)}
        />
        <Slider
          icon={<Gauge size={18} />}
          title="Control Sensitivity"
          testid="sensitivity-slider"
          min={0.6} max={1.6} step={0.05}
          value={settings.touchSensitivity}
          onChange={(v) => setNum("touchSensitivity", v)}
        />
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
      </div>
    </div>
  );
}

function Slider({
  icon, title, value, min, max, step, onChange, testid,
}: {
  icon: React.ReactNode; title: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; testid: string;
}) {
  return (
    <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-cyan-300 shrink-0">
          {icon}
        </div>
        <div className="flex-1 text-white text-sm font-medium">{title}</div>
        <div className="text-xs text-white/40 font-mono">{Math.round((value - min) / (max - min) * 100)}%</div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        data-testid={testid}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-400"
      />
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
