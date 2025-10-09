"use client";

import React from "react";
import { useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

export function Controls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-4 left-4 flex flex-col gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => zoomIn()}
        className="h-8 w-8 p-0"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => zoomOut()}
        className="h-8 w-8 p-0"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => fitView()}
        className="h-8 w-8 p-0"
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
