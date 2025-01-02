import type { Node, Connection, Point } from './constants';

export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 80;

export interface TransformState {
  zoom: number;
  pan: Point;
}

export const transformCoordinates = (x: number, y: number, transform: TransformState): Point | null => {
  if (!transform || typeof transform.zoom !== 'number' || !transform.pan) {
    return null;
  }
  return {
    x: (x * transform.zoom) + transform.pan.x,
    y: (y * transform.zoom) + transform.pan.y
  };
};

export const inverseTransformCoordinates = (x: number, y: number, transform: TransformState): Point | null => {
  if (!transform || typeof transform.zoom !== 'number' || !transform.pan) {
    return null;
  }
  return {
    x: (x - transform.pan.x) / transform.zoom,
    y: (y - transform.pan.y) / transform.zoom
  };
};

export const getConnectionPoint = (node: Node, type: 'parent' | 'child'): Point => {
  if (!node || !node.position) {
    console.warn('Invalid node or position in getConnectionPoint');
    return { x: 0, y: 0 };
  }
  
  return {
    x: node.position.x + NODE_WIDTH/2,
    y: node.position.y + (type === 'parent' ? 0 : NODE_HEIGHT)
  };
};

export const wouldCreateCycle = (
  fromId: string, 
  toId: string, 
  connections: Connection[], 
  visited = new Set<string>()
): boolean => {
  if (!fromId || !toId || !Array.isArray(connections)) {
    return false;
  }
  if (fromId === toId) return true;
  if (visited.has(fromId)) return false;
  
  visited.add(fromId);
  const childConnections = connections.filter(conn => conn.toNode === fromId);
  
  return childConnections.some(conn => 
    wouldCreateCycle(conn.fromNode, toId, connections, new Set(visited))
  );
};

export const generateConfig = (nodes: Node[], connections: Connection[]) => {
  if (!Array.isArray(nodes) || !Array.isArray(connections)) {
    return { version: "1.0", resources: [] };
  }

  const buildHierarchy = (nodeId: string, visited = new Set<string>()) => {
    if (!nodeId || visited.has(nodeId)) return null;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const childConnections = connections.filter(conn => conn.toNode === nodeId);
    const children = childConnections
      .map(conn => buildHierarchy(conn.fromNode, new Set(visited)))
      .filter((child): child is NonNullable<typeof child> => child !== null);

    return {
      id: node.id,
      type: node.type,
      name: node.name,
      config: node.config,
      children: children.length > 0 ? children : undefined
    };
  };

  const parentNodes = new Set(connections.map(conn => conn.fromNode));
  const rootNodes = nodes.filter(node => !parentNodes.has(node.id));

  return {
    version: "1.0",
    resources: rootNodes.map(node => buildHierarchy(node.id)).filter((node): node is NonNullable<typeof node> => node !== null)
  };
};