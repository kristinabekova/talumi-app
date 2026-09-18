"use client";

import React from "react";

export type LumiProps = {
  className?: string;
  alt?: string;
  animated?: boolean;
  celebrating?: boolean;
};

export function Lumi({
  className = "",
  alt = "Lumi – tvoj kamoš",
  animated = true,
  celebrating = false,
}: LumiProps) {
  return (
    <img
      className={`lumi-mascot ${animated ? "lumi-animated" : ""} ${celebrating ? "lumi-celebrating" : ""} ${className}`.trim()}
      src="/talumi-gulko-lumi.png"
      alt={alt}
      draggable={false}
    />
  );
}
