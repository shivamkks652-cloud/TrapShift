import { useEffect, useState } from "react";
import MainMenu from "@/components/MainMenu";
import WorldSelect from "@/components/WorldSelect";
import LevelSelect from "@/components/LevelSelect";
import GameScreen from "@/components/GameScreen";
import EndlessScreen from "@/components/EndlessScreen";
import SkinShop from "@/components/SkinShop";
import SettingsScreen from "@/components/SettingsScreen";
import { getLevelById } from "@/game/levels";
import { isMuted, setMuted, setMusicVolume, setSfxVolume, setMusicEnabled, setSfxEnabled, initAudioLifecycle } from "@/game/audio";
import { getSettings } from "@/game/storage";
import { initAds, showMenuBanner, hideMenuBanner } from "@/game/ads";

type Screen =
  | { name: "menu" }
  | { name: "worlds" }
  | { name: "levels"; worldId: number }
  | { name: "playing"; levelId: string }
  | { name: "endless" }
  | { name: "daily" }
  | { name: "skins" }
  | { name: "settings" };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: "menu" });
  const [muted, setMutedState] = useState(isMuted());

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  useEffect(() => {
    // Apply saved volume settings at boot so menu/endless music matches
    // user preferences before any level is entered.
    const s = getSettings();
    setMusicVolume(s.musicVolume);
    setSfxVolume(s.sfxVolume);
    setMusicEnabled(s.musicEnabled);
    setSfxEnabled(s.sfxEnabled);
    initAudioLifecycle();
    void initAds();
  }, []);

  useEffect(() => {
    if (screen.name === "playing") {
      void hideMenuBanner();
    } else {
      void showMenuBanner();
    }
  }, [screen.name]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black text-white font-sans">
      {screen.name === "menu" && (
        <MainMenu
          onPlay={() => setScreen({ name: "worlds" })}
          onEndless={() => setScreen({ name: "endless" })}
          onDaily={() => setScreen({ name: "daily" })}
          onSkins={() => setScreen({ name: "skins" })}
          onSettings={() => setScreen({ name: "settings" })}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}
      {screen.name === "worlds" && (
        <WorldSelect onBack={() => setScreen({ name: "menu" })} onSelectWorld={(worldId) => setScreen({ name: "levels", worldId })} />
      )}
      {screen.name === "levels" && (
        <LevelSelect
          worldId={screen.worldId}
          onBack={() => setScreen({ name: "worlds" })}
          onSelectLevel={(levelId) => setScreen({ name: "playing", levelId })}
        />
      )}
      {screen.name === "playing" &&
        (() => {
          const level = getLevelById(screen.levelId);
          if (!level) return null;
          return (
            <GameScreen
              key={level.id}
              level={level}
              onExit={() => setScreen({ name: "levels", worldId: level.world })}
              onGoToLevel={(levelId) => setScreen({ name: "playing", levelId })}
            />
          );
        })()}
      {screen.name === "endless" && <EndlessScreen mode="endless" onExit={() => setScreen({ name: "menu" })} />}
      {screen.name === "daily" && <EndlessScreen mode="daily" onExit={() => setScreen({ name: "menu" })} />}
      {screen.name === "skins" && <SkinShop onBack={() => setScreen({ name: "menu" })} />}
      {screen.name === "settings" && <SettingsScreen onBack={() => setScreen({ name: "menu" })} />}
    </div>
  );
}

export default App;
