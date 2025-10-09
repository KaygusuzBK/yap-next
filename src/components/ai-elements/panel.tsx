"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  children: React.ReactNode;
  className?: string;
}

export function Panel({ position = "top-left", children, className }: PanelProps) {
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      className={cn(
        "absolute z-10",
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
}
