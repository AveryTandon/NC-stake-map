import React, { useRef, useEffect, useState, useCallback } from "react";
import { getNodePosition, getPowerAlignmentFromPosition } from "../utils/nodePosition.js";
import { CATEGORY_COLORS, CATEGORY_SHAPES } from "../utils/constants.js";

export default function NodeLayer({ nodes, canvasWidth, canvasHeight, padding, setSelectedNode, updateNode, selectedNode }) {
  const nodeRefs = useRef({});
  const canvasRef = useRef(null);
  const [nodeSizes, setNodeSizes] = useState({});
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Calculate initial positions (only when nodes change, not during drag)
  const calculateInitialPositions = useCallback(() => {
    const positions = {};
    nodes.forEach(node => {
      const { width = 50, height = 20 } = nodeSizes[node.id] || {};
      positions[node.id] = getNodePosition(
        node, 
        [], // Don't check for collisions during initial positioning
        canvasWidth, 
        canvasHeight, 
        padding, 
        width, 
        height
      );
    });
    return positions;
  }, [nodes, canvasWidth, canvasHeight, padding, nodeSizes]);

  const [positions, setPositions] = useState(calculateInitialPositions());

  // Update positions only when nodes or sizes change (not during drag)
  useEffect(() => {
    if (!isDragging && draggingNode === null) {
      setPositions(calculateInitialPositions());
    }
  }, [nodes, nodeSizes, isDragging, draggingNode, calculateInitialPositions]);

  // Measure node sizes when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      const sizes = {};
      nodes.forEach(node => {
        if (!nodeRefs.current[node.id]) nodeRefs.current[node.id] = React.createRef();
        const ref = nodeRefs.current[node.id];
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          sizes[node.id] = { width: rect.width, height: rect.height };
        }
      });
      setNodeSizes(sizes);
    }
  }, [nodes]);

  // Handle mouse events
  const handleMouseDown = (nodeId, e) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    const ref = nodeRefs.current[nodeId];
    if (!node || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    setIsDragging(true);
    setDraggingNode(nodeId);
    setSelectedNode(null);
    
    // Calculate offset from mouse to node center
    setDragOffset({
      x: e.clientX - (rect.left + rect.width / 2),
      y: e.clientY - (rect.top + rect.height / 2)
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !draggingNode || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - dragOffset.x - canvasRect.left;
    const newY = e.clientY - dragOffset.y - canvasRect.top;
    
    setPositions(prev => ({
      ...prev,
      [draggingNode]: { x: newX, y: newY }
    }));
  }, [isDragging, draggingNode, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !draggingNode) return;
    
    const node = nodes.find(n => n.id === draggingNode);
    const pos = positions[draggingNode];
    
    if (node && pos) {
      const { alignment, power } = getPowerAlignmentFromPosition(
        pos.x, 
        pos.y, 
        canvasWidth, 
        canvasHeight, 
        padding
      );
      
      // Create updated node with new position data
      const updatedNode = {
        ...node,
        alignment: Math.round(alignment),
        power: Math.round(power),
        _screenX: pos.x,
        _screenY: pos.y
      };

      // Reset drag state
      setIsDragging(false);
      setDraggingNode(null);

      // Update database with updated node
      updateNode(draggingNode, updatedNode);

      requestAnimationFrame(() => {
        setSelectedNode(updatedNode);
      });
    } else {
      setIsDragging(false);
      setDraggingNode(null);
    }
  }, [isDragging, draggingNode, nodes, positions, canvasWidth, canvasHeight, padding, updateNode, setSelectedNode]);

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle click events
  const handleNodeClick = (nodeId, e) => {
    e.stopPropagation();
    if (!isDragging) {
      const node = nodes.find(n => n.id === nodeId);
      setSelectedNode(node);
    }
  };

  return (
    <div ref={canvasRef} style={{ position: "relative", width: canvasWidth, height: canvasHeight }}>
      {nodes.map(node => {
        if (!nodeRefs.current[node.id]) nodeRefs.current[node.id] = React.createRef();
        const { width = 50, height = 20 } = nodeSizes[node.id] || {};
        const pos = positions[node.id] || { x: 0, y: 0 };
        const shape = CATEGORY_SHAPES[node.classification] || "square";

        return (
          <div
            key={node.id}
            ref={nodeRefs.current[node.id]}
            className={`node ${shape}`}
            style={{
              position: "absolute",
              left: pos.x - width / 2,
              top: pos.y - height / 2,
              backgroundColor: CATEGORY_COLORS[node.category],
              cursor: isDragging && draggingNode === node.id ? "grabbing" : "grab",
              zIndex: node.id === selectedNode?.id ? 10 : 1,
              boxShadow: node.id === selectedNode?.id ? "0 2px 8px rgba(0,0,0,0.2)" : "none"
            }}
            title={node.label}
            onMouseDown={(e) => handleMouseDown(node.id, e)}
            onClick={(e) => handleNodeClick(node.id, e)}
          >
            <span className="label">{node.label}</span>
          </div>
        );
      })}
    </div>
  );
}