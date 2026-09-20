"use client";

import { PointerEvent, useEffect, useState } from "react";
import type { CSSProperties } from "react";

export function LogoMark({
  className = "w-9 h-9",
  variant = "color",
}: {
  className?: string;
  variant?: "color" | "white";
}) {
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  function handlePointerMove(event: PointerEvent<HTMLSpanElement>) {
    if (reducedMotion) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normalizedX = (event.clientX - centerX) / (rect.width / 2);
    const normalizedY = (event.clientY - centerY) / (rect.height / 2);

    setLook({
      x: Math.max(-1, Math.min(1, normalizedX)) * 14,
      y: Math.max(-1, Math.min(1, normalizedY)) * 8,
    });
  }

  function handlePointerLeave() {
    setIsHovering(false);
    setLook({ x: 0, y: 0 });
  }

  const bubbleFill =
    variant === "white" ? "#ffffff" : "url(#chatspace-logo-gradient)";
  const eyeFill = variant === "white" ? "#070d24" : "#ffffff";

  return (
    <span
      aria-hidden="true"
      className={`chatspace-logo-mark ${className}`}
      data-hovering={isHovering && !reducedMotion ? "true" : "false"}
      style={
        {
          "--logo-eye-x": `${look.x}px`,
          "--logo-eye-y": `${look.y}px`,
        } as CSSProperties
      }
      onPointerEnter={() => setIsHovering(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <svg viewBox="0 0 512 512" role="img" focusable="false">
        <defs>
          <linearGradient
            id="chatspace-logo-gradient"
            x1="256"
            x2="256"
            y1="74"
            y2="438"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0A55F0" />
            <stop offset="1" stopColor="#0F82FF" />
          </linearGradient>
        </defs>

        {variant === "color" && <rect width="512" height="512" rx="112" fill="#ffffff" />}

        <path
          fill={bubbleFill}
          d="M51 188c0-64 50-114 114-114h180c65 0 116 50 116 114v75c0 65-51 114-116 114h-5l35 52c6 9-4 19-14 15l-134-67h-62c-64 0-114-49-114-114v-75Z"
        />

        <g className="logo-eye-track">
          <g>
            <circle className="logo-eye" cx="201" cy="230" r="49" fill={eyeFill} />
          </g>
          <g className="logo-eye-wink">
            <circle
              className="logo-eye"
              cx="326"
              cy="230"
              r="26"
              fill={eyeFill}
            />
          </g>
        </g>
      </svg>
    </span>
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
