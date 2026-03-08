"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const LogoSlider = ({
  logos,
  speed = 60,
  direction = "left",
  showBlur = true,
  blurLayers = 8,
  blurIntensity = 1,
  className,
  pauseOnHover = false,
}) => {
  return (
    <div
      className={cn("logo-slider w-full overflow-hidden", className)}
      style={{
        "--speed": speed,
        "--count": logos.length,
        "--blurs": blurLayers,
        "--blur": blurIntensity,
      }}
    >
      <div
        className={cn("logo-slider__container", "relative w-full min-h-[80px] grid")}
        data-direction={direction}
        data-pause-on-hover={pauseOnHover}
      >
        {showBlur && (
          <div className="logo-slider__blur logo-slider__blur--left absolute top-0 bottom-0 left-0 w-1/4 z-10 pointer-events-none rotate-180">
            {Array.from({ length: blurLayers }).map((_, i) => (
              <div key={i} className="absolute inset-0" style={{ "--blur-index": i }} />
            ))}
          </div>
        )}
        {showBlur && (
          <div className="logo-slider__blur logo-slider__blur--right absolute top-0 bottom-0 right-0 w-1/4 z-10 pointer-events-none">
            {Array.from({ length: blurLayers }).map((_, i) => (
              <div key={i} className="absolute inset-0" style={{ "--blur-index": i }} />
            ))}
          </div>
        )}
        <ul className="logo-slider__track flex items-center h-full w-fit m-0 p-0 list-none">
          {logos.map((logo, index) => (
            <li
              key={index}
              className="logo-slider__item h-[64px] w-[260px] grid place-items-center shrink-0"
              style={{ "--item-index": index }}
            >
              <div className="flex items-center justify-center">
                {logo}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

LogoSlider.displayName = "LogoSlider";
export default LogoSlider;
