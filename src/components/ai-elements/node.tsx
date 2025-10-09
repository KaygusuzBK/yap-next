"use client";

import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface NodeData extends Record<string, unknown> {
  label?: string;
  description?: string;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  handles?: {
    target?: boolean;
    source?: boolean;
  };
}

interface NodeComponentProps extends NodeProps {
  data: NodeData;
  children?: React.ReactNode;
  className?: string;
}

export function Node({
  data,
  children,
  className,
  ...props
}: NodeComponentProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg shadow-sm min-w-[200px] max-w-[300px]",
        className
      )}
      {...props}
    >
      {data.handles?.target && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-primary border-2 border-background"
        />
      )}
      {data.handles?.source && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-primary border-2 border-background"
        />
      )}
      {children}
    </div>
  );
}

export function NodeHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-4 border-b border-border", className)}>
      {children}
    </div>
  );
}

export function NodeTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("font-semibold text-foreground", className)}>
      {children}
    </h3>
  );
}

export function NodeDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm text-muted-foreground mt-1", className)}>
      {children}
    </p>
  );
}

export function NodeContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-4", className)}>
      {children}
    </div>
  );
}

export function NodeFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-4 pt-0 text-xs text-muted-foreground", className)}>
      {children}
    </div>
  );
}
