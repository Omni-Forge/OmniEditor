import React from 'react';
import { Input } from './components/ui/Input';
import { INFRA_TYPES } from './constants';
import type { Node } from './constants';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void;
}

const PropertiesPanel = ({ selectedNode, onUpdateNode }: PropertiesPanelProps) => {
  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-neutral-800 bg-neutral-900">
        <div className="p-4 text-neutral-500 text-center">
          Select a resource to view its properties
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-neutral-800 bg-neutral-900">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Resource Properties</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-300">Name</label>
            <Input 
              value={selectedNode.name}
              onChange={(e) => {
                onUpdateNode(selectedNode.id, { name: e.target.value });
              }}
              className="bg-neutral-800 border-neutral-700 text-neutral-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-300">Type</label>
            <Input 
              value={INFRA_TYPES[selectedNode.config.category][selectedNode.type].name}
              disabled
              className="bg-neutral-800 border-neutral-700 text-neutral-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-300">Category</label>
            <Input 
              value={selectedNode.config.category}
              disabled
              className="bg-neutral-800 border-neutral-700 text-neutral-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;