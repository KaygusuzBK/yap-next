"use client";

import React from "react";

export function Connection(props: any) {
  return (
    <div
      {...props}
      style={{
        stroke: "hsl(var(--primary))",
        strokeWidth: 2,
        strokeDasharray: "5,5",
      }}
    />
  );
}
