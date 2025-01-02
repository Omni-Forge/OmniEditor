import React from 'react';
import { Button } from './components/ui/Button';
import { X } from 'lucide-react';
import { INFRA_TYPES } from './constants';
import type { Node as NodeType, Point } from './constants';
import { NODE_WIDTH, NODE_HEIGHT, getConnectionPoint } from './canvasUtils';

interface ConnectionBarProps {
  position: Point;
  onStartConnection: (position: Point, type: 'parent' | 'child') => void;
  onEndConnection: (type: 'parent' | 'child') => void;
  isActive: boolean;
  type: 'parent' | 'child';
}

const ConnectionBar = ({ position, onStartConnection, onEndConnection, isActive, type }: ConnectionBarProps) => (
  <div
    className={`absolute h-3 bg-neutral-600 cursor-pointer hover:bg-neutral-500 transition-colors
                rounded-md ${isActive ? 'bg-neutral-500' : ''} ${type === 'parent' ? 'parent-bar' : 'child-bar'}`}
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
    <div className="absolute inset-0 bg-neutral-500 opacity-0 hover:opacity-100 rounded-md transition-opacity" />
  </div>
);

interface NodeProps {
  node: NodeType;
  isSelected: boolean;
  isDrawing: boolean;
  onStartConnection: (nodeId: string, point: Point, type: 'parent' | 'child') => void;
  onEndConnection: (nodeId: string, type: 'parent' | 'child') => void;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onMouseMove: (e: React.MouseEvent, nodeId: string) => void;
  onMouseUp: () => void;
  onSelect: (node: NodeType) => void;
  onDelete: (nodeId: string) => void;
}

const Node = ({
  node,
  isSelected,
  isDrawing,
  onStartConnection,
  onEndConnection,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onSelect,
  onDelete
}: NodeProps) => {
  return (
    <div
      className={`absolute border-2 rounded-lg bg-neutral-800 cursor-move shadow-lg
                ${isSelected ? 'border-neutral-500' : 'border-neutral-700'}
                hover:border-neutral-600 transition-colors`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onMouseMove={(e) => onMouseMove(e, node.id)}
      onMouseUp={onMouseUp}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
    >
      <ConnectionBar
        position={getConnectionPoint(node, 'parent')}
        onStartConnection={(point) => onStartConnection(node.id, point, 'parent')}
        onEndConnection={() => onEndConnection(node.id, 'parent')}
        isActive={isDrawing}
        type="parent"
      />

      <ConnectionBar
        position={getConnectionPoint(node, 'child')}
        onStartConnection={(point) => onStartConnection(node.id, point, 'child')}
        onEndConnection={() => onEndConnection(node.id, 'child')}
        isActive={isDrawing}
        type="child"
      />

      <div className="absolute top-2 right-2 z-30">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-red-900/50"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
        >
          <X className="h-4 w-4 text-red-400" />
        </Button>
      </div>

      <div className="p-2 h-full flex flex-col justify-center items-center">
        <div className="text-sm font-medium text-center truncate w-full px-2 text-neutral-100">
          {node.name}
        </div>
        <div className="text-xs text-neutral-400 text-center truncate w-full px-2">
          {INFRA_TYPES[node.config.category][node.type].name}
        </div>
      </div>
    </div>
  );
};

export default Node;