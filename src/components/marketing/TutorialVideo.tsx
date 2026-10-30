"use client";

import Image from "next/image";
import { useState } from "react";

/** Video tutorial (rekaman layar asli aplikasi). Klik-untuk-putar: tidak ada byte video sebelum ditekan (performa). */
export function TutorialVideo({ locale, label, duration }: { locale: "en" | "id"; label: string; duration: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="relative aspect-video overflow-hidden rounded-md border border-line bg-surface shadow-inset">
      {playing ? (
        <video
          src={`/video/tutorial-${locale}.mp4`}
          poster={`/video/poster-${locale}.webp`}
          autoPlay
          controls
          playsInline
          preload="metadata"
          className="size-full"
          aria-label={label}
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group relative block size-full">
          <Image src={`/video/poster-${locale}.webp`} alt="" fill sizes="(min-width: 1200px) 1136px, 100vw" className="object-cover opacity-70 transition-opacity duration-200 group-hover:opacity-85" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="flex items-center gap-3 rounded-md border border-signal-edge bg-signal px-5 py-3 font-semibold text-canvas shadow-inset transition-transform duration-150 group-hover:scale-[1.03] group-active:scale-[0.98]">
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                <path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
              </svg>
              {label}
              <span className="font-mono text-caption font-normal opacity-80">{duration}</span>
            </span>
          </span>
        </button>
      )}
    </figure>
  );
}
