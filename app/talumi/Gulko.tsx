"use client";

import React, { useState, useEffect } from "react";

interface GulkoProps {
  className?: string;
  variant?: "default" | "wave" | "blink";
  autoBlink?: boolean;
}

export function Gulko({ className = "", variant = "default", autoBlink = true }: GulkoProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (!autoBlink || variant !== "default") return;

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 180);
    }, 3200);

    return () => clearInterval(blinkInterval);
  }, [autoBlink, variant]);

  const getImageSrc = () => {
    if (variant === "wave") return "/talumi-gulko-wave.png";
    if (variant === "blink" || isBlinking) return "/talumi-gulko-blink.png";
    return "/talumi-gulko-default.png";
  };

  return (
    <img
      src={getImageSrc()}
      alt="Guľko"
      className={className}
      style={{
        display: "block",
        objectFit: "contain",
        userSelect: "none",
        pointerEvents: "none"
      }}
    />
  );
}