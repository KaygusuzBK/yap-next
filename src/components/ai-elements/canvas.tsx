"use client";

import React from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type ConnectionLineComponent,
  type ReactFlowProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface CanvasProps extends Omit<ReactFlowProps, 'children'> {
  children?: React.ReactNode;
  nodes: Node[];
  edges: Edge[];
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  connectionLineComponent?: ConnectionLineComponent;
}

export function Canvas({
  children,
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  connectionLineComponent,
  ...props
}: CanvasProps) {
  return (
    <ReactFlowProvider>
      <div className="h-screen w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineComponent={connectionLineComponent}
          fitView
          className="bg-background"
          {...props}
        >
          {children}
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
