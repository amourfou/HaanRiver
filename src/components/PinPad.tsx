"use client";

import { useCallback, useEffect, useState } from "react";

interface Props {
  length?: number;
  /** Auto-submit when `length` digits are entered. */
  onComplete: (pin: string) => void;
  disabled?: boolean;
  /** Bumping this clears the dots and plays a shake (after a wrong PIN). */
  resetKey?: number;
  shake?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

/** Big 3×4 number pad for kids: 64px+ buttons, ● dots, auto-submit at `length` digits. */
export function PinPad({ length = 6, onComplete, disabled, resetKey = 0, shake }: Props) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    setPin("");
  }, [resetKey]);

  const press = useCallback(
    (k: (typeof KEYS)[number]) => {
      if (disabled) return;
      if (k === "back") return setPin((p) => p.slice(0, -1));
      if (k === "clear") return setPin("");
      setPin((p) => {
        if (p.length >= length) return p;
        const next = p + k;
        if (next.length === length) setTimeout(() => onComplete(next), 120);
        return next;
      });
    },
    [disabled, length, onComplete]
  );

  // Hardware keyboard support (tablets / PC)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key as (typeof KEYS)[number]);
      else if (e.key === "Backspace") press("back");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return (
    <div className="select-none">
      <div
        className={["mb-6 flex justify-center gap-3", shake ? "animate-[pinshake_0.4s]" : ""].join(" ")}
        aria-live="polite"
        aria-label={`${pin.length}자리 입력됨`}
      >
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={[
              "h-5 w-5 rounded-full border-2 transition",
              i < pin.length ? "border-sky-300 bg-sky-300" : "border-white/40 bg-transparent",
            ].join(" ")}
          />
        ))}
      </div>
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-3" role="group" aria-label="숫자 패드">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => press(k)}
            aria-label={k === "back" ? "지우기" : k === "clear" ? "모두 지우기" : k}
            className={[
              "flex h-20 min-h-[64px] items-center justify-center rounded-3xl text-3xl font-bold touch-manipulation transition active:scale-95 disabled:opacity-40",
              k === "back" || k === "clear" ? "bg-white/5 text-slate-300 text-2xl" : "bg-white/15 text-white",
            ].join(" ")}
          >
            {k === "back" ? "⌫" : k === "clear" ? "↺" : k}
          </button>
        ))}
      </div>
    </div>
  );
}
