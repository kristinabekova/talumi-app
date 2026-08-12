type GulkoProps = {
  className?: string;
  alt?: string;
  animated?: boolean;
  celebrating?: boolean;
};

export function Gulko({ className = "", alt = "Guľko – maskot TALUMI", animated = true, celebrating = false }: GulkoProps) {
  return (
    <span className={`gulko ${animated ? "gulko-animated" : ""} ${celebrating ? "gulko-celebrating" : ""} ${className}`.trim()}>
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
    </span>
  );
}
