import React from 'react';
import type { Connection, Point } from './constants';

interface ConnectionLinesProps {
  connections: Connection[];
  tempLine: {
    fromPoint: Point;
    toPoint: Point;
  } | null;
  zoom: number;
}

const isValidPoint = (point: Point | undefined | null): point is Point => {
  return !!point && typeof point.x === 'number' && typeof point.y === 'number';
};

const ConnectionLines = ({ connections, tempLine, zoom }: ConnectionLinesProps) => {
  // Filter out connections with invalid coordinates
  const validConnections = connections.filter(conn => 
    isValidPoint(conn.fromPoint) && isValidPoint(conn.toPoint)
  );

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {validConnections.map(conn => {
        // Double check that points are valid before rendering
        if (!isValidPoint(conn.fromPoint) || !isValidPoint(conn.toPoint)) {
          return null;
        }
        
        return (
          <line
            key={conn.id}
            x1={conn.fromPoint.x}
            y1={conn.fromPoint.y}
            x2={conn.toPoint.x}
            y2={conn.toPoint.y}
            stroke="#525252"
            strokeWidth={2 / zoom}
          />
        );
      })}
      {tempLine && isValidPoint(tempLine.fromPoint) && isValidPoint(tempLine.toPoint) && (
        <line
          x1={tempLine.fromPoint.x}
          y1={tempLine.fromPoint.y}
          x2={tempLine.toPoint.x}
          y2={tempLine.toPoint.y}
          stroke="#525252"
          strokeWidth={2 / zoom}
          strokeDasharray="4"
        />
      )}
    </svg>
  );
};

export default ConnectionLines;