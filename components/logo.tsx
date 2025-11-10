"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  "2xl": 112,
};

export type LogoSize = keyof typeof sizeMap;

export interface LogoProps {
  size?: LogoSize;
  className?: string;
  priority?: boolean;
  shadow?: boolean;
  "aria-hidden"?: boolean;
}

export function Logo({
  size = "md",
  className,
  priority = false,
  shadow = false,
  ...props
}: LogoProps) {
  const dimension = sizeMap[size] ?? sizeMap.md;

  return (
    <Image
      src="/branding/logo.png"
      alt="Logo de Eventos Salome"
      width={dimension}
      height={dimension}
      priority={priority}
      className={cn(
        "object-contain",
        shadow && "drop-shadow-lg",
        className
      )}
      {...props}
    />
  );
}

