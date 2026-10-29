import { useState } from "react";
import { Lightbulb } from "lucide-react";

const HINTS: Record<string, string> = {
  "w2-3": "Fog mein controls ulte hain — aage jaane ke liye LEFT dabao. Moving tile paas aane ka intezaar karo, phir jump.",
};
const key = (id: string) => `trapshift.hint.${id}`;

export function RetryHint({ levelId, deaths }: { levelId: string; deaths: number }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(key(levelId)) === "1");
  const text = HINTS[levelId];
  if (!text || dismissed || deaths < 10) return null;
  const close = () => {
    localStorage.setItem(key(levelId), "1");
    setDismissed(true);
  };
  return (
    <div className="pointer-events-none absolute top-20 inset-x-0 z-30 flex justify-center px-4">
      <div
        data-testid="retry-hint-popup"
        className="pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300 max-w-sm flex items-start gap-3 rounded-2xl bg-fuchsia-500/15 backdrop-blur-md border border-fuchsia-300/40 px-4 py-3 shadow-[0_0_24px_rgba(232,121,249,0.35)]"
      >
        <Lightbulb className="w-5 h-5 mt-0.5 shrink-0 text-yellow-300" />
        <div className="flex-1">
          <p data-testid="retry-hint-text" className="text-fuchsia-100 text-sm leading-snug">{text}</p>
          <button
            data-testid="retry-hint-dismiss-btn"
            onClick={close}
            className="mt-2 rounded-full bg-cyan-400/20 border border-cyan-300/50 px-4 py-1 text-cyan-100 text-xs font-semibold active:scale-95 transition-transform"
          >
            Samajh gaya
          </button>
        </div>
      </div>
    </div>
  );
}
