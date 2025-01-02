"use client"

import React, { useState, useRef, useCallback } from 'react';
import TitleBar from './TitleBar';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import { generateConfig, getConnectionPoint } from './canvasUtils';
import type { Node, Connection } from './constants';

const InfrastructureDesigner = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleAddNode = (typeKey: string, typeInfo: any) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const center = {
      x: (rect.width / 2 - pan.x) / zoom,
      y: (rect.height / 2 - pan.y) / zoom
    };

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: typeKey,
      name: `${typeInfo.name}-${nodes.length + 1}`,
      position: center,
      config: {
        type: typeKey,
        category: typeInfo.category,
        properties: {}
      }
    };

    setNodes(prev => [...prev, newNode]);
  };

  const handleUpdateNode = (nodeId: string, updates: Partial<Node>) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  };

  const handleCreateConnection = (fromNodeId: string, toNodeId: string) => {
    const fromNode = nodes.find(n => n.id === fromNodeId);
    const toNode = nodes.find(n => n.id === toNodeId);
    
    if (!fromNode || !toNode) return;

    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      fromNode: fromNodeId,
      toNode: toNodeId,
      fromPoint: getConnectionPoint(fromNode, 'child'),
      toPoint: getConnectionPoint(toNode, 'parent'),
      type: 'parent-child'
    };

    setConnections(prev => [...prev, newConnection]);
  };

  const handleConnectionsUpdate = (newConnections: Connection[]) => {
    setConnections(newConnections);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      conn.fromNode !== nodeId && conn.toNode !== nodeId
    ));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleExport = () => {
    const config = generateConfig(nodes, connections);
    const jsonString = JSON.stringify(config, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infrastructure-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-neutral-900 text-neutral-100 select-none">
      <TitleBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddNode={handleAddNode}
        onExport={handleExport}
      />

      <div className="flex-1 flex">
        <Canvas
          ref={canvasRef}
          nodes={nodes}
          connections={connections}
          selectedNode={selectedNode}
          zoom={zoom}
          pan={pan}
          onNodeSelect={setSelectedNode}
          onNodeDelete={handleDeleteNode}
          onNodeUpdate={handleUpdateNode}
          onConnectionCreate={handleCreateConnection}
          onConnectionsUpdate={handleConnectionsUpdate}
          onZoomChange={setZoom}
          onPanChange={setPan}
        />

        <PropertiesPanel
          selectedNode={selectedNode}
          onUpdateNode={handleUpdateNode}
        />
      </div>
    </div>
  );
};

export default InfrastructureDesigner;