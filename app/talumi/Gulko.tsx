"use client";

import React from "react";

export type GulkoProps = {
  className?: string;
  alt?: string;
  animated?: boolean;
  celebrating?: boolean;
};

export function Gulko({
  className = "",
  alt = "Guľko – maskot TALUMI",
  animated = true,
  celebrating = false,
}: GulkoProps) {
  return (
    <span
      className={`gulko ${animated ? "gulko-animated" : ""} ${
        celebrating ? "gulko-celebrating" : ""
      } ${className}`.trim()}
    >
      <img
        className="gulko-frame gulko-default"
        src="/talumi-gulko-default.png"
        alt={alt}
        draggable={false}
      />
      <img
        className="gulko-frame gulko-blink"
        src="/talumi-gulko-blink.png"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        className="gulko-frame gulko-wave"
        src="/talumi-gulko-wave-aligned.png"
        alt=""
        aria-hidden="true"
        draggable={false}
      />

      <style jsx>{`
        .gulko {
          display: inline-block;
          position: relative;
          vertical-align: middle;
          user-select: none;
          line-height: 0;
        }

        .gulko-frame {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          pointer-events: none;
          background: transparent !important;
        }

        .gulko-blink,
        .gulko-wave {
          position: absolute;
          inset: 0;
          opacity: 0;
        }

        /* 1. JEMNÁ LEVITÁCIA (POHUPOVANIE HORE-DOLE) */
        .gulko-animated {
          animation: gulkoFloat 3.2s ease-in-out infinite;
        }

        /* 2. AUTOMATICKÉ ŽMURKANIE CEZ CSS */
        .gulko-animated .gulko-blink {
          animation: gulkoBlink 3.8s ease-in-out infinite;
        }

        /* 3. OSLAVNÉ MÁVANIE */
        .gulko-celebrating .gulko-default,
        .gulko-celebrating .gulko-blink {
          opacity: 0 !important;
          animation: none !important;
        }

        .gulko-celebrating .gulko-wave {
          opacity: 1 !important;
        }

        .gulko-celebrating {
          animation: gulkoCelebrate 0.5s ease-in-out infinite alternate !important;
        }

        @keyframes gulkoFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes gulkoBlink {
          0%, 94%, 100% {
            opacity: 0;
          }
          96%, 98% {
            opacity: 1;
          }
        }

        @keyframes gulkoCelebrate {
          0% {
            transform: translateY(0px) scale(1);
          }
          100% {
            transform: translateY(-12px) scale(1.15) rotate(4deg);
          }
        }
      `}</style>
    </span>
  );
}