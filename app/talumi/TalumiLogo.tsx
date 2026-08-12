type TalumiLogoProps = {
  className?: string;
  light?: boolean;
};

export function TalumiLogo({ className = "", light = false }: TalumiLogoProps) {
  return (
    <img
      className={`talumi-logo ${className}`.trim()}
      src={light ? "/talumi-logo-white.png" : "/talumi-logo-purple.png"}
      alt="Talumi"
      draggable={false}
    />
  );
}
