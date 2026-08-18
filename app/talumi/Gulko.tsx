"use client";

import React from "react";

interface GulkoProps {
  className?: string;
  variant?: "default" | "wave" | "blink";
}

export function Gulko({ className = "", variant = "default" }: GulkoProps) {
  const file =
    variant === "wave"
      ? "/talumi-gulko-wave.png"
      : variant === "blink"
      ? "/talumi-gulko-blink.png"
      : "/talumi-gulko-default.png";

  return (
    <div className={`gulko-wrapper ${className}`}>
      <img src={file} alt="Guľko" className="gulko-img" />
      <style jsx>{`
        .gulko-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          overflow: hidden;
          background: transparent;
        }
        .gulko-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          border-radius: 50%;
          filter: drop-shadow(0 6px 14px rgba(51, 0, 91, 0.22));
          -webkit-filter: drop-shadow(0 6px 14px rgba(51, 0, 91, 0.22));
        }
      `}</style>
    </div>
  );
}