export function LogoMark({
  className = "w-9 h-9",
  variant = "color",
}: {
  className?: string;
  variant?: "color" | "white";
}) {
  const src = variant === "white" ? "/logo-mark-white.png" : "/logo-mark.png";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`${className} object-contain`} />
  );
}

export function Logo({
  markClassName = "w-9 h-9",
  textClassName = "font-extrabold text-[17px] tracking-tight",
  variant = "color",
}: {
  markClassName?: string;
  textClassName?: string;
  variant?: "color" | "white";
}) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={markClassName} variant={variant} />
      <span className={textClassName}>chatspace</span>
    </span>
  );
}
