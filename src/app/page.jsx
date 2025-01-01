"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from  './components/ui/Input';
import { 
  Plus, 
  FileJson, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Move,
  ChevronDown,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "./components/ui/DropdownMenu";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "./components/ui/Alert";

// Infrastructure type definitions with categories and metadata
const INFRA_TYPES = {
  compute: {
    aws_instance: { 
      name: 'EC2 Instance', 
      category: 'compute',
      description: 'Amazon EC2 Virtual Machine'
    },
    aws_lambda: { 
      name: 'Lambda Function', 
      category: 'compute',
      description: 'Serverless Function'
    },
    ecs_service: { 
      name: 'ECS Service', 
      category: 'compute',
      description: 'Container Service'
    }
  },
  storage: {
    aws_s3: { 
      name: 'S3 Bucket', 
      category: 'storage',
      description: 'Object Storage'
    },
    aws_ebs: { 
      name: 'EBS Volume', 
      category: 'storage',
      description: 'Block Storage'
    }
  },
  network: {
    aws_vpc: { 
      name: 'VPC', 
      category: 'network',
      description: 'Virtual Private Cloud'
    },
    aws_subnet: { 
      name: 'Subnet', 
      category: 'network',
      description: 'Network Subnet'
    },
    aws_security_group: {
      name: 'Security Group',
      category: 'network',
      description: 'Firewall Rules'
    }
  },
  database: {
    aws_rds: { 
      name: 'RDS Instance', 
      category: 'database',
      description: 'Relational Database'
    },
    aws_dynamodb: { 
      name: 'DynamoDB Table', 
      category: 'database',
      description: 'NoSQL Database'
    },
    aws_elasticache: {
      name: 'ElastiCache',
      category: 'database',
      description: 'In-Memory Cache'
    }
  }
};

// Connection bar component for parent/child relationships
const ConnectionBar = ({ position, onStartConnection, onEndConnection, isActive, type }) => (
  <div
    className={`absolute h-3 bg-blue-500 cursor-pointer hover:bg-blue-600 transition-colors
                rounded-md ${isActive ? 'bg-blue-600' : ''} ${type === 'parent' ? 'parent-bar' : 'child-bar'}`}
    style={{
      left: '4px',
      right: '4px',
      top: type === 'parent' ? '0' : 'auto',
      bottom: type === 'child' ? '0' : 'auto',
      transform: type === 'parent' ? 'translateY(-50%)' : 'translateY(50%)',
      zIndex: 20
    }}
    onMouseDown={(e) => {
      e.stopPropagation();
      onStartConnection(position, type);
    }}
    onMouseUp={(e) => {
      e.stopPropagation();
      onEndConnection(type);
    }}
  >
    <div className="absolute inset-0 bg-blue-400 opacity-0 hover:opacity-100 rounded-md transition-opacity" />
  </div>
);

// Navigation controls component
const NavigationControls = ({ onZoomIn, onZoomOut, onResetZoom, onResetPan, zoom }) => (
  <div className="absolute bottom-4 right-4 flex flex-col space-y-2 bg-white p-2 rounded-lg shadow-md">
    <Button variant="outline" size="icon" onClick={onZoomIn}>
      <ZoomIn className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="icon" onClick={onZoomOut}>
      <ZoomOut className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="icon" onClick={() => { onResetZoom(); onResetPan(); }}>
      <Move className="h-4 w-4" />
    </Button>
    <div className="text-center text-sm text-gray-500">{Math.round(zoom * 100)}%</div>
  </div>
);

// Main infrastructure designer component
const InfrastructureDesigner = () => {
  // State management
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tempLine, setTempLine] = useState(null);
  const [error, setError] = useState(null);
  
  const canvasRef = useRef(null);

  // Filter infrastructure types based on search
  const filteredTypes = Object.entries(INFRA_TYPES).reduce((acc, [category, types]) => {
    const filtered = Object.entries(types).filter(([key, value]) =>
      value.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = Object.fromEntries(filtered);
    }
    return acc;
  }, {});

  // Canvas navigation handlers
  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    if (isDrawing && tempLine) {
      const rect = canvasRef.current.getBoundingClientRect();
      const { x, y } = inverseTransformCoordinates(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      setTempLine(prev => ({
        ...prev,
        toPoint: { x, y }
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prevZoom => Math.min(Math.max(0.1, prevZoom * scaleFactor), 2));
    }
  };

  // Coordinate transformation functions
  const transformCoordinates = (x, y) => ({
    x: (x * zoom) + pan.x,
    y: (y * zoom) + pan.y
  });

  const inverseTransformCoordinates = (x, y) => ({
    x: (x - pan.x) / zoom,
    y: (y - pan.y) / zoom
  });

  // Node management
  const addNode = (typeKey, typeInfo) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const center = inverseTransformCoordinates(
      rect.width / 2 - pan.x,
      rect.height / 2 - pan.y
    );

    const newNode = {
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
    setNodes([...nodes, newNode]);
  };

  const handleNodeDrag = (e, nodeId) => {
    if (draggedNode === nodeId) {
      const rect = canvasRef.current.getBoundingClientRect();
      const { x, y } = inverseTransformCoordinates(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      
      setNodes(nodes.map(node =>
        node.id === nodeId
          ? { ...node, position: { 
              x: x - dragOffset.x,
              y: y - dragOffset.y
            }}
          : node
      ));

      // Update connected lines
      setConnections(connections.map(conn => {
        if (conn.fromNode === nodeId || conn.toNode === nodeId) {
          const fromNode = nodes.find(n => n.id === conn.fromNode);
          const toNode = nodes.find(n => n.id === conn.toNode);
          return {
            ...conn,
            fromPoint: getConnectionPoint(
              conn.fromNode === nodeId ? { position: { x: x - dragOffset.x, y: y - dragOffset.y }} : fromNode,
              'child'
            ),
            toPoint: getConnectionPoint(
              conn.toNode === nodeId ? { position: { x: x - dragOffset.x, y: y - dragOffset.y }} : toNode,
              'parent'
            )
          };
        }
        return conn;
      }));
    }
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = inverseTransformCoordinates(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    setDraggedNode(nodeId);
    setDragOffset({ x, y });
  };

  const handleNodeMouseUp = () => {
    setDraggedNode(null);
  };

  // Connection management
  const getConnectionPoint = (node, type) => {
    const width = 160;
    const height = 80;
    return {
      x: node.position.x + width/2,
      y: node.position.y + (type === 'parent' ? 0 : height)
    };
  };

  const startConnection = (nodeId, point, type) => {
    setIsDrawing(true);
    setDrawingStart({
      nodeId,
      point,
      type
    });
    setTempLine({
      fromPoint: point,
      toPoint: point,
      type
    });
  };

  const endConnection = (nodeId, type) => {
    if (isDrawing && drawingStart && drawingStart.nodeId !== nodeId) {
      // Only allow connections from child to parent
      if (drawingStart.type === 'child' && type === 'parent') {
        // Check for circular dependencies
        if (wouldCreateCycle(drawingStart.nodeId, nodeId)) {
          setError('Cannot create circular dependencies');
          setTimeout(() => setError(null), 3000);
        } else {
          const fromNode = nodes.find(n => n.id === drawingStart.nodeId);
          const toNode = nodes.find(n => n.id === nodeId);
          setConnections([...connections, {
            id: `conn-${Date.now()}`,
            fromNode: drawingStart.nodeId,
            toNode: nodeId,
            fromPoint: getConnectionPoint(fromNode, 'child'),
            toPoint: getConnectionPoint(toNode, 'parent'),
            type: 'parent-child'
          }]);
        }
      }
    }
    setIsDrawing(false);
    setDrawingStart(null);
    setTempLine(null);
  };

  // Check for circular dependencies
  const wouldCreateCycle = (fromId, toId, visited = new Set()) => {
    if (fromId === toId) return true;
    if (visited.has(fromId)) return false;
    
    visited.add(fromId);
    const childConnections = connections.filter(conn => conn.toNode === fromId);
    
    return childConnections.some(conn => 
      wouldCreateCycle(conn.fromNode, toId, new Set(visited))
    );
  };

  // Generate and export JSON configuration
  const generateConfig = () => {
    const buildHierarchy = (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return null;
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      const childConnections = connections.filter(conn => conn.toNode === nodeId);
      const children = childConnections
        .map(conn => buildHierarchy(conn.fromNode, new Set(visited)))
        .filter(Boolean);

      return {
        id: node.id,
        type: node.type,
        name: node.name,
        config: node.config,
        children: children.length > 0 ? children : undefined
      };
    };

    // Find root nodes (nodes with no children)
    const parentNodes = new Set(connections.map(conn => conn.fromNode));
    const rootNodes = nodes.filter(node => !parentNodes.has(node.id));

    return {
      version: "1.0",
      resources: rootNodes.map(node => buildHierarchy(node.id))
    };
  };

  const handleExport = () => {
    const config = generateConfig();
    const jsonString = JSON.stringify(config, null, 2);
    
    // Create and trigger download
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

  // Delete node and its connections
  const deleteNode = (nodeId) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    setConnections(connections.filter(conn => 
      conn.fromNode !== nodeId && conn.toNode !== nodeId
    ));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Infrastructure Designer</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-4 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto">
                <div className="p-2 sticky top-0 bg-white border-b">
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                </div>
                {Object.entries(filteredTypes).map(([category, types]) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-sm font-semibold bg-gray-100 sticky top-14">
                      {category.toUpperCase()}
                    </div>
                    {Object.entries(types).map(([typeKey, typeInfo]) => (
                      <DropdownMenuItem
                        key={typeKey}
                        onClick={() => addNode(typeKey, typeInfo)}
                        className="flex flex-col items-start"
                      >
                        <span className="font-medium">{typeInfo.name}</span>
                        <span className="text-xs text-gray-500">{typeInfo.description}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleExport}
              className="flex items-center"
              variant="outline"
            >
              <FileJson className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>

          <div 
            ref={canvasRef}
            className="border rounded-lg h-96 relative overflow-hidden cursor-move bg-gray-50"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
          >
            <div
              className="absolute inset-0 origin-top-left"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
              }}
            >
              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {connections.map(conn => (
                  <line
                    key={conn.id}
                    x1={conn.fromPoint.x}
                    y1={conn.fromPoint.y}
                    x2={conn.toPoint.x}
                    y2={conn.toPoint.y}
                    stroke="#6B7280"
                    strokeWidth={2 / zoom}
                  />
                ))}
                {tempLine && (
                  <line
                    x1={tempLine.fromPoint.x}
                    y1={tempLine.fromPoint.y}
                    x2={tempLine.toPoint.x}
                    y2={tempLine.toPoint.y}
                    stroke="#6B7280"
                    strokeWidth={2 / zoom}
                    strokeDasharray="4"
                  />
                )}
              </svg>

              {/* Nodes */}
              {nodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    className={`absolute border-2 rounded-lg bg-white cursor-move shadow-sm
                              ${isSelected ? 'border-blue-500' : 'border-gray-200'}
                              hover:border-blue-300 transition-colors`}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      width: '160px',
                      height: '80px'
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onMouseMove={(e) => handleNodeDrag(e, node.id)}
                    onMouseUp={handleNodeMouseUp}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                  >
                    <ConnectionBar
                      position={getConnectionPoint(node, 'parent')}
                      onStartConnection={(point) => startConnection(node.id, point, 'parent')}
                      onEndConnection={() => endConnection(node.id, 'parent')}
                      isActive={isDrawing}
                      type="parent"
                    />

                    <ConnectionBar
                      position={getConnectionPoint(node, 'child')}
                      onStartConnection={(point) => startConnection(node.id, point, 'child')}
                      onEndConnection={() => endConnection(node.id, 'child')}
                      isActive={isDrawing}
                      type="child"
                    />

                    <div className="absolute top-2 right-2 z-30">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-red-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="p-2 h-full flex flex-col justify-center items-center">
                      <div className="text-sm font-medium text-center truncate w-full px-2">
                        {node.name}
                      </div>
                      <div className="text-xs text-gray-500 text-center truncate w-full px-2">
                        {INFRA_TYPES[node.config.category][node.type].name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <NavigationControls 
              onZoomIn={() => setZoom(z => Math.min(2, z * 1.2))}
              onZoomOut={() => setZoom(z => Math.max(0.1, z * 0.8))}
              onResetZoom={() => setZoom(1)}
              onResetPan={() => setPan({ x: 0, y: 0 })}
              zoom={zoom}
            />
          </div>

          {/* Properties panel */}
          {selectedNode && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Resource Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input 
                      value={selectedNode.name}
                      onChange={(e) => {
                        setNodes(nodes.map(node =>
                          node.id === selectedNode.id
                            ? { ...node, name: e.target.value }
                            : node
                        ));
                        setSelectedNode(prev => ({
                          ...prev,
                          name: e.target.value
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <Input 
                      value={INFRA_TYPES[selectedNode.config.category][selectedNode.type].name}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Input 
                      value={selectedNode.config.category}
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InfrastructureDesigner;