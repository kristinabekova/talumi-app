"use client";

import React from "react";

export type LumiProps = {
  className?: string;
  alt?: string;
};

export function Lumi({ className = "", alt = "Lumi – tvoj kamoš" }: LumiProps) {
  return (
    <img
      className={`lumi-mascot ${className}`.trim()}
      src="/talumi-gulko-lumi.png"
      alt={alt}
      draggable={false}
    />
  );
}
