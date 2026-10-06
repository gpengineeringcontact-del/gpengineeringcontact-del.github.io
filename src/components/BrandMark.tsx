import { useState } from "react";
import { IconCompass } from "./icons";

export function BrandMark({ darkSurface = false }: { darkSurface?: boolean }) {
  const [logoFailed, setLogoFailed] = useState(false);
  return (
    <span className="flex items-center">
      <span className="relative flex h-11 w-36 items-center justify-center overflow-hidden">
        {!logoFailed ? (
          <img
            src="/assets/wyfare-logo.png"
            alt=""
            className={`h-full w-full object-contain ${darkSurface ? "[filter:brightness(0)_saturate(100%)_invert(71%)_sepia(18%)_saturate(651%)_hue-rotate(315deg)_brightness(88%)_contrast(86%)]" : ""}`}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className={`flex items-center gap-2 font-display text-xl font-bold ${darkSurface ? "text-tang" : "text-forest"}`}>
            <IconCompass className="h-5 w-5" /> Wyfare
          </span>
        )}
      </span>
    </span>
  );
}
