import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { getNodePosition, getPowerAlignmentFromPosition } from "../utils/nodePosition.js";
import { CATEGORY_COLORS, CATEGORY_SHAPES } from "../utils/constants.js";

export default function NodeLayer({ nodes, canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset, setSelectedNode, updateNode, selectedNode, expandedStack, setExpandedStack }) {
  const nodeRefs = useRef({});
  const canvasRef = useRef(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null); // Node ID that is being hovered
  const [snappingNode, setSnappingNode] = useState(null); // Node ID that is currently snapping

  // Fixed default sizes - no measurement needed
  const DEFAULT_WIDTH = 60;
  const DEFAULT_HEIGHT = 24;

  // Track previous nodes to detect when nodes are actually added/removed
  const prevNodesRef = useRef(nodes.map(n => n.id).sort().join(','));
  const basePositionsRef = useRef({});

  // Calculate initial positions (only when nodes are added/removed, not during drag or selection)
  // Use fixed default sizes - no measurement needed
  const calculateInitialPositions = useCallback(() => {
    const positions = {};
    const existingRects = [];
    
    // Sort nodes by id for deterministic ordering
    const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
    
    const processedNodes = [];
    sortedNodes.forEach(node => {
      // Always use default sizes - no measurement needed
      const pos = getNodePosition(
        node, 
        existingRects, // Check collisions against already-positioned nodes
        canvasWidth, 
        canvasHeight, 
        sidePadding,
        bottomPadding,
        tickInset,
        DEFAULT_WIDTH, 
        DEFAULT_HEIGHT,
        processedNodes // Pass already-processed nodes for stacking logic
      );
      positions[node.id] = pos;
      processedNodes.push(node);
      
      // Add this node's rect to existingRects for collision detection
      existingRects.push({
        x: pos.x - DEFAULT_WIDTH / 2,
        y: pos.y - DEFAULT_HEIGHT / 2,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT
      });
    });
    return positions;
  }, [nodes, canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset]);

  const [positions, setPositions] = useState(() => {
    const initial = calculateInitialPositions();
    basePositionsRef.current = initial;
    return initial;
  });

  // Track if we just finished dragging to trigger position recalculation
  const justFinishedDraggingRef = useRef(false);

  // Track previous node power/alignment values to detect changes after drag
  const prevNodeValuesRef = useRef(new Map());
  
  // Track if we're updating a node from the edit panel (to prevent position recalculation)
  const isUpdatingFromEditPanelRef = useRef(false);
  
  // Track drag start position and distance
  const dragStartPositionRef = useRef(null);
  const [hasDragStart, setHasDragStart] = useState(false); // Track if we have a potential drag start
  const MIN_DRAG_DISTANCE = 5; // Minimum pixels to move before considering it a drag
  
  // Track nodes that are being animated after edit panel update
  const animatingNodesRef = useRef(new Set());

  // Track selectedNode with a ref so we can check it without adding to dependencies
  const selectedNodeRef = useRef(selectedNode);
  useEffect(() => {
    selectedNodeRef.current = selectedNode;
    // Keep isSelectingRef set as long as a node is selected to prevent position recalculation
    // This ensures that even if nodes array updates from Firestore, positions won't be recalculated
    if (selectedNode) {
      isSelectingRef.current = true;
    } else {
      // Only clear the flag if we're not in the middle of selecting (handled by timeout in handleNodeClick)
      // Use a small delay to avoid race conditions
      setTimeout(() => {
        if (!selectedNodeRef.current) {
          isSelectingRef.current = false;
        }
      }, 50);
    }
  }, [selectedNode]);

  // Track if a node was selected before dragging (to restore edit panel after drag)
  const wasSelectedBeforeDragRef = useRef(null);
  
  // Track if a node is being selected in an expanded stack
  const isSelectingNodeRef = useRef(false);
  
  // Track if we're in the middle of selecting a node (to prevent position recalculation)
  const isSelectingRef = useRef(false);

  // Helper function to calculate snap position from power/alignment values
  const getSnapPosition = useCallback((power, alignment) => {
    const xRange = canvasWidth - 2 * sidePadding;
    const xBase = sidePadding + ((alignment + 5) * (xRange / 10));
    const yRange = canvasHeight - bottomPadding;
    const yBase = canvasHeight - bottomPadding - tickInset - ((power - 1) * (yRange / 10));
    return { x: xBase, y: yBase };
  }, [canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset]);

  // Calculate expanded positions for nodes in a stack (spread in a circle)
  const getExpandedPosition = useCallback((node, basePos, index, totalNodes) => {
    if (totalNodes <= 1) return basePos;
    
    // Increase radius for larger stacks to prevent crowding
    const baseRadius = 55;
    const radius = totalNodes > 4 ? baseRadius + (totalNodes - 4) * 20 : baseRadius;
    
    const angleStep = (2 * Math.PI) / totalNodes;
    const angle = index * angleStep;
    
    return {
      x: basePos.x + radius * Math.cos(angle),
      y: basePos.y + radius * Math.sin(angle)
    };
  }, []);

  // Group nodes by power/alignment to identify stacks (not by calculated positions)
  // This ensures nodes with same power/alignment always stack together
  // Sort nodes by ID within each group for consistent ordering (prevents position shifts)
  // Must be defined before handleMouseMove which uses it
  const nodeGroups = useMemo(() => {
    const groups = new Map();
    // Sort nodes by ID first to ensure consistent ordering
    const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
    sortedNodes.forEach(node => {
      // Use power/alignment as the key, not position, to ensure consistent stacking
      const key = `${node.power},${node.alignment}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(node);
    });
    return groups;
  }, [nodes]);

  // Only recalculate positions when nodes are actually added/removed
  // NOT when a node is selected or during drag
  // Also recalculate after drag completes to snap node to correct position
  useEffect(() => {
    // First, check if any node's power/alignment actually changed
    // This detects changes from drag, edit panel, or any other source
    // We need to check this BEFORE the early return to allow animation even when a node is selected
    let powerAlignmentChanged = false;
    let hasNewNodes = false;
    const nodesToAnimate = new Set();
    
    nodes.forEach(node => {
      const prevValue = prevNodeValuesRef.current.get(node.id);
      if (!prevValue) {
        // New node added
        hasNewNodes = true;
      } else if (prevValue.power !== node.power || prevValue.alignment !== node.alignment) {
        // Power/alignment changed - this is a legitimate change that requires position update
        powerAlignmentChanged = true;
        // Track which node changed (for smooth animation if from edit panel)
        nodesToAnimate.add(node.id);
      }
    });
    
    const currentNodeIds = nodes.map(n => n.id).sort().join(',');
    const nodesChanged = prevNodesRef.current !== currentNodeIds;
    
    // Also check if any nodes were removed
    const currentIds = new Set(nodes.map(n => n.id));
    const prevIds = new Set(Array.from(prevNodeValuesRef.current.keys()));
    const nodesRemoved = Array.from(prevIds).some(id => !currentIds.has(id));
    
    // If power/alignment changed, allow recalculation even if a node is selected
    // This enables smooth animation when saving from edit panel
    const shouldAllowRecalculation = powerAlignmentChanged || nodesChanged || hasNewNodes || nodesRemoved;
    
    // Don't recalculate if:
    // - A node is being dragged
    // - A node is snapping after drag
    // - We're in the middle of selecting a node (unless power/alignment changed)
    // - We're updating from the edit panel (prevents recalculation when saving edits)
    // BUT: Allow recalculation if power/alignment changed (for smooth animation from edit panel)
    if (!shouldAllowRecalculation) {
      // No changes detected, check normal blocking conditions
      if (selectedNodeRef.current || isDragging || draggingNode !== null || snappingNode !== null || 
          isSelectingRef.current || isUpdatingFromEditPanelRef.current) {
        return;
      }
    } else {
      // Changes detected - only block if dragging or snapping
      if (isDragging || draggingNode !== null || snappingNode !== null || isUpdatingFromEditPanelRef.current) {
        return;
      }
      // If a node is selected but power/alignment changed, allow recalculation
      // This enables animation when saving from edit panel
    }
    
    // Recalculate if:
    // 1. Node IDs changed (added/removed), OR
    // 2. Power/alignment changed (from drag, edit panel, or any source)
    if (nodesChanged || powerAlignmentChanged || hasNewNodes || nodesRemoved) {
      const newPositions = calculateInitialPositions();
      basePositionsRef.current = newPositions;
      
      // If only one node changed and it's not from a drag, animate it smoothly
      // Otherwise, update all positions immediately
      if (nodesToAnimate.size === 1 && !justFinishedDraggingRef.current) {
        const nodeIdToAnimate = Array.from(nodesToAnimate)[0];
        const newPos = newPositions[nodeIdToAnimate];
        const oldPos = positions[nodeIdToAnimate];
        
        // Only animate if position actually changed
        if (oldPos && (Math.abs(newPos.x - oldPos.x) > 1 || Math.abs(newPos.y - oldPos.y) > 1)) {
          // Mark node as animating
          animatingNodesRef.current.add(nodeIdToAnimate);
          setSnappingNode(nodeIdToAnimate);
          
          // Update position to trigger smooth animation
          setPositions(prev => ({
            ...prev,
            [nodeIdToAnimate]: newPos
          }));
          
          // Clear animation state after animation completes
          const animationDuration = 300; // Should match CSS transition
          setTimeout(() => {
            animatingNodesRef.current.delete(nodeIdToAnimate);
            setSnappingNode(null);
            // Update all positions to ensure consistency
            setPositions(newPositions);
          }, animationDuration);
        } else {
          // No position change needed, just update all positions
          setPositions(newPositions);
        }
      } else {
        // Multiple nodes changed or from drag - update all positions immediately
        setPositions(newPositions);
      }
      
      prevNodesRef.current = currentNodeIds;
      // Update stored power/alignment values
      nodes.forEach(node => {
        prevNodeValuesRef.current.set(node.id, { power: node.power, alignment: node.alignment });
      });
      justFinishedDraggingRef.current = false;
    } else {
      // Update stored values even if we don't recalculate
      // But only if we're not in the middle of selecting a node
      if (!isSelectingRef.current) {
        nodes.forEach(node => {
          prevNodeValuesRef.current.set(node.id, { power: node.power, alignment: node.alignment });
        });
      }
    }
  }, [nodes, isDragging, draggingNode, snappingNode, calculateInitialPositions]);

  // Handle mouse events
  const handleMouseDown = (nodeId, e) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    const ref = nodeRefs.current[nodeId];
    if (!node || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    // Store initial mouse position for drag distance calculation
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    dragStartPositionRef.current = { x: initialMouseX, y: initialMouseY, nodeId };
    setHasDragStart(true); // Enable event listeners
    
    // Don't set dragging yet - wait until mouse moves beyond threshold
    // This prevents accidental drags from clicks
    
    // Store if this node was selected before drag (to restore panel after drag)
    if (selectedNode && selectedNode.id === nodeId) {
      wasSelectedBeforeDragRef.current = true;
    } else {
      wasSelectedBeforeDragRef.current = false;
    }
    
    // Calculate offset from mouse to node center
    setDragOffset({
      x: initialMouseX - (rect.left + rect.width / 2),
      y: initialMouseY - (rect.top + rect.height / 2)
    });
    
    // If node is in an expanded stack, immediately update position state to expanded position
    // This prevents the glitch where position state doesn't match rendered position when dragging starts
    const positionKey = `${node.power},${node.alignment}`;
    const stackNodes = nodeGroups.get(positionKey) || [];
    const isStacked = stackNodes.length > 1;
    const isExpanded = expandedStack === positionKey;
    
    if (isStacked && isExpanded) {
      const clusterCenterPos = getSnapPosition(node.power, node.alignment);
      const nodeIndex = stackNodes.findIndex(n => n.id === nodeId);
      const expandedPos = getExpandedPosition(node, clusterCenterPos, nodeIndex, stackNodes.length);
      // Update position state immediately to match rendered position
      setPositions(prev => ({
        ...prev,
        [nodeId]: expandedPos
      }));
    }
  };

  const handleMouseMove = useCallback((e) => {
    // Check if we should start dragging (mouse moved beyond threshold)
    if (!isDragging && dragStartPositionRef.current) {
      const dragStart = dragStartPositionRef.current;
      const distance = Math.sqrt(
        Math.pow(e.clientX - dragStart.x, 2) + 
        Math.pow(e.clientY - dragStart.y, 2)
      );
      
      if (distance >= MIN_DRAG_DISTANCE) {
        // Start dragging - user has moved mouse beyond threshold
        const nodeId = dragStart.nodeId;
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          setIsDragging(true);
          setDraggingNode(nodeId);
          
          // Hide edit panel during drag
          setSelectedNode(null);
          
          // Position state should already be updated to expanded position in handleMouseDown
          // No need to update it again here
        }
      } else {
        // Not enough movement yet, don't start dragging
        return;
      }
    }
    
    // Continue with normal drag handling
    if (!isDragging || !draggingNode || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - dragOffset.x - canvasRect.left;
    const newY = e.clientY - dragOffset.y - canvasRect.top;
    
    setPositions(prev => ({
      ...prev,
      [draggingNode]: { x: newX, y: newY }
    }));
  }, [isDragging, draggingNode, dragOffset, nodes, expandedStack, nodeGroups, getSnapPosition, getExpandedPosition]);

  const handleMouseUp = useCallback(() => {
    // Clear drag start position
    dragStartPositionRef.current = null;
    setHasDragStart(false);
    
    // If we never started dragging (click without enough movement), treat as click
    if (!isDragging || !draggingNode) {
      return;
    }
    
    const node = nodes.find(n => n.id === draggingNode);
    const pos = positions[draggingNode];
    
    if (node && pos) {
      const { alignment, power } = getPowerAlignmentFromPosition(
        pos.x, 
        pos.y, 
        canvasWidth, 
        canvasHeight, 
        sidePadding,
        bottomPadding,
        tickInset
      );
      
      // Round to nearest grid position
      const roundedAlignment = Math.round(alignment);
      const roundedPower = Math.round(power);
      
      // Calculate the target snap position
      const snapPos = getSnapPosition(roundedPower, roundedAlignment);
      
      // Capture nodeId before resetting state
      const nodeId = draggingNode;
      
      // Collapse any expanded stacks immediately (before snap animation)
      // This ensures the stack is collapsed before the edit panel appears
      if (expandedStack) {
        setExpandedStack(null);
      }
      
      // Reset drag state
      setIsDragging(false);
      setDraggingNode(null);
      
      // Start snapping animation
      setSnappingNode(nodeId);
      
      // Update position to snap target - this will trigger CSS transition
      setPositions(prev => ({
        ...prev,
        [nodeId]: snapPos
      }));
      
      // Wait for animation to complete, then update database and show edit panel
      const animationDuration = 300; // milliseconds - should match CSS transition duration
      setTimeout(() => {
        // Create updated node with new position data
        // Use snapPos which is where the node should be after animation
        const updatedNode = {
          ...node,
          alignment: roundedAlignment,
          power: roundedPower,
          _screenX: snapPos.x,
          _screenY: snapPos.y
        };

        // Update database with updated node (this will trigger position recalculation via Firestore)
        updateNode(nodeId, updatedNode);

        // Always open/edit panel after drag completes with new ratings
        // If panel was open before drag, restore it; otherwise open it for the first time
        // Use snapPos to ensure panel appears at the final position where node is now
        const wasSelected = wasSelectedBeforeDragRef.current;
        setSelectedNode({
          ...updatedNode,
          _screenX: snapPos.x,
          _screenY: snapPos.y
        });
        wasSelectedBeforeDragRef.current = null;
        
        // Mark that we just finished dragging - the useEffect will handle recalculation
        // when nodes array updates from Firestore
        justFinishedDraggingRef.current = true;
        
        // Clear snapping state
        setSnappingNode(null);
      }, animationDuration);
    } else {
      setIsDragging(false);
      setDraggingNode(null);
    }
  }, [isDragging, draggingNode, nodes, positions, canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset, updateNode, expandedStack, getSnapPosition]);

  // Add event listeners for dragging
  // Need to listen even when not dragging yet, to detect when mouse moves beyond threshold
  useEffect(() => {
    if (isDragging || hasDragStart) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, hasDragStart, handleMouseMove, handleMouseUp]);


  // Keep stack expanded if it contains the selected node (but don't auto-expand)
  // Only maintain expansion state if it was already expanded
  useEffect(() => {
    if (selectedNode) {
      // Use power/alignment as key, not position
      const positionKey = `${selectedNode.power},${selectedNode.alignment}`;
      const stackNodes = nodeGroups.get(positionKey) || [];
      // If this is a stacked node and the stack is expanded, ensure it stays expanded
      if (stackNodes.length > 1) {
        setExpandedStack(prev => {
          // Only keep expanded if it was already expanded (don't auto-expand)
          // But if it's already expanded, ensure it stays that way
          if (prev === positionKey) {
            return positionKey; // Keep it expanded
          }
          return prev; // Don't change if not already expanded
        });
      }
    }
  }, [selectedNode, nodeGroups]);

  // Track previous expandedStack to detect when a stack collapses
  const prevExpandedStackRef = useRef(expandedStack);
  
  // Reset node positions to base positions when a stack collapses
  useEffect(() => {
    // Detect when a stack collapses (expandedStack goes from a value to null)
    const wasExpanded = prevExpandedStackRef.current !== null;
    const isNowCollapsed = expandedStack === null;
    const stackJustCollapsed = wasExpanded && isNowCollapsed;
    
    // Only reset positions if a stack just collapsed and we're not dragging/snapping
    // Also skip if a node is currently snapping (it will be handled after animation)
    if (stackJustCollapsed && !isDragging && !draggingNode && !snappingNode) {
      // Get the position key of the stack that just collapsed (from previous value)
      const collapsedStackKey = prevExpandedStackRef.current;
      
      // Find all nodes in that stack and reset their positions to base
      const stackNodes = nodes.filter(n => {
        const key = `${n.power},${n.alignment}`;
        return key === collapsedStackKey;
      });
      
      if (stackNodes.length > 0) {
        // Calculate base positions for nodes in the collapsed stack
        const updatedPositions = { ...positions };
        let needsUpdate = false;
        
        stackNodes.forEach(node => {
          const basePos = getNodePosition(
            node,
            [],
            canvasWidth,
            canvasHeight,
            sidePadding,
            bottomPadding,
            tickInset,
            DEFAULT_WIDTH,
            DEFAULT_HEIGHT,
            []
          );
          
          const currentPos = positions[node.id];
          if (!currentPos || Math.abs(basePos.x - currentPos.x) > 1 || Math.abs(basePos.y - currentPos.y) > 1) {
            updatedPositions[node.id] = basePos;
            needsUpdate = true;
          }
        });
        
        if (needsUpdate) {
          setPositions(updatedPositions);
          // Update basePositionsRef for consistency
          basePositionsRef.current = { ...basePositionsRef.current, ...updatedPositions };
        }
      }
    }
    
    // Update the ref after processing
    prevExpandedStackRef.current = expandedStack;
  }, [expandedStack, isDragging, draggingNode, snappingNode, nodes, positions, canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset]);

  // Collapse expanded stack when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (expandedStack && !isSelectingNodeRef.current) {
        // Don't collapse if clicking on a node, badge, or node panel
        const clickedInStack = e.target.closest('.node') || 
                              e.target.closest('.data-stack-badge') || 
                              e.target.closest('.node-panel') ||
                              e.target.closest('.data-collapse-button');
        
        if (!clickedInStack) {
          setExpandedStack(null);
        }
      }
    };
    
    if (expandedStack) {
      document.addEventListener("click", handleClickOutside, true);
      return () => document.removeEventListener("click", handleClickOutside, true);
    }
  }, [expandedStack]);

  // Handle click events
  const handleNodeClick = (nodeId, e) => {
    e.stopPropagation();
    if (!isDragging) {
      const node = nodes.find(n => n.id === nodeId);
      const nodePos = positions[nodeId];
      if (!node || !nodePos) return;
      
      // Mark that we're selecting to prevent position recalculation
      isSelectingRef.current = true;
      
      // Use power/alignment as key for consistent stacking
      const positionKey = `${node.power},${node.alignment}`;
      const stackNodes = nodeGroups.get(positionKey) || [];
      const isStacked = stackNodes.length > 1;
      
      // If there's an expanded stack and the clicked node is NOT in that stack, collapse it
      if (expandedStack && expandedStack !== positionKey) {
        setExpandedStack(null);
      }
      
      // Calculate the display position (expanded or base) for the edit panel
      // IMPORTANT: Use the node's actual power/alignment values, not calculated from position
      const clusterCenterPos = isStacked ? getSnapPosition(node.power, node.alignment) : nodePos;
      let currentDisplayPos;
      
      // If clicking a stacked node and it's not expanded, expand it AND select the node
      if (isStacked && expandedStack !== positionKey) {
        // Expand the stack first
        setExpandedStack(positionKey);
        // Calculate where the node will be after expansion
        const nodeIndex = stackNodes.findIndex(n => n.id === nodeId);
        currentDisplayPos = getExpandedPosition(node, clusterCenterPos, nodeIndex, stackNodes.length);
      } else {
        // If already expanded or not stacked, use current position
        currentDisplayPos = (isStacked && expandedStack === positionKey) 
          ? getExpandedPosition(node, clusterCenterPos, stackNodes.findIndex(n => n.id === nodeId), stackNodes.length)
          : nodePos;
      }
      
      // Create node with position info for edit panel, but preserve original power/alignment
      const nodeWithPosition = {
        ...node,
        _screenX: currentDisplayPos.x,
        _screenY: currentDisplayPos.y
      };
      
      // If this is a stacked node in an expanded stack, ensure stack stays expanded
      // Do this BEFORE setting selectedNode to avoid any race conditions
      if (isStacked) {
        setExpandedStack(positionKey);
      }
      
      // Mark that we're selecting a node to prevent click outside handler from collapsing stack
      isSelectingNodeRef.current = true;
      // isSelectingRef will be set to true by the useEffect when selectedNode is set
      setSelectedNode(nodeWithPosition);
      
      // Clear the click handler flag after state update completes
      setTimeout(() => {
        isSelectingNodeRef.current = false;
      }, 0);
    }
  };

  // Handle stack badge click - expand the stack
  const handleStackBadgeClick = (e, positionKey) => {
    e.stopPropagation();
    // Toggle: if already expanded, collapse; otherwise expand
    setExpandedStack(expandedStack === positionKey ? null : positionKey);
  };



  return (
    <div ref={canvasRef} style={{ position: "relative", width: canvasWidth, height: canvasHeight }}>
      {nodes.map(node => {
        if (!nodeRefs.current[node.id]) nodeRefs.current[node.id] = React.createRef();
        // Use fixed default sizes - no measurement needed
        const width = DEFAULT_WIDTH;
        const height = DEFAULT_HEIGHT;
        const basePos = positions[node.id] || { x: 0, y: 0 };
        const shape = CATEGORY_SHAPES[node.classification] || "square";
        // Use power/alignment as key for consistent stacking
        const positionKey = `${node.power},${node.alignment}`;
        const stackNodes = nodeGroups.get(positionKey) || [];
        const isStacked = stackNodes.length > 1;
        const isExpanded = expandedStack === positionKey;
        
        // Calculate static cluster center for badges/buttons (based on power/alignment, not dynamic position)
        // This ensures badges stay static even when a node is being dragged
        const clusterCenterPos = isStacked ? getSnapPosition(node.power, node.alignment) : basePos;
        
        // Use expanded position if stack is expanded, otherwise use base position
        // BUT: if this node is being dragged or snapping, use the position from state directly
        let displayPos = basePos;
        if (isStacked && isExpanded && draggingNode !== node.id && snappingNode !== node.id) {
          const nodeIndex = stackNodes.findIndex(n => n.id === node.id);
          displayPos = getExpandedPosition(node, clusterCenterPos, nodeIndex, stackNodes.length);
        } else if (draggingNode === node.id || snappingNode === node.id) {
          // Node is being dragged or snapping - use the position from state directly
          displayPos = basePos;
        }
        
        const isTopNode = stackNodes[0]?.id === node.id; // Show badge on first node in stack

        return (
          <div key={node.id}>
            <div
              ref={nodeRefs.current[node.id]}
              className={`node ${shape}`}
              style={{
                position: "absolute",
                left: displayPos.x,
                top: displayPos.y,
                transform: (isDragging && draggingNode === node.id) 
                  ? "translate(-50%, -50%)" 
                  : (node.id === hoveredNode ? "translate(-50%, -50%) scale(1.15)" : "translate(-50%, -50%)"),
                backgroundColor: CATEGORY_COLORS[node.category],
                cursor: isDragging && draggingNode === node.id ? "grabbing" : "grab",
                zIndex: node.id === selectedNode?.id ? 10 : (node.id === hoveredNode ? 8 : (isExpanded ? 5 : (isStacked ? 2 : 1))),
                boxShadow: node.id === selectedNode?.id ? "0 2px 8px rgba(0,0,0,0.3)" : (node.id === hoveredNode ? "0 2px 8px rgba(0,0,0,0.25)" : "0 1px 3px rgba(0,0,0,0.15)"),
                transition: (isDragging && draggingNode === node.id) 
                  ? "none" 
                  : (snappingNode === node.id
                    ? "left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    : "left 0.2s ease-out, top 0.2s ease-out, transform 0.2s ease-out")
              }}
              title={node.label}
              onMouseDown={(e) => handleMouseDown(node.id, e)}
              onClick={(e) => handleNodeClick(node.id, e)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <span className="label">{node.label}</span>
            </div>
            {isStacked && isTopNode && !isExpanded && (
              <div
                className="data-stack-badge"
                style={{
                  position: "absolute",
                  left: clusterCenterPos.x - width / 2 - 8,
                  top: clusterCenterPos.y - height / 2 - 8,
                  backgroundColor: "#DC143C",
                  color: "white",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  zIndex: 15,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  transition: "all 0.2s ease-out",
                  lineHeight: "1"
                }}
                onClick={(e) => handleStackBadgeClick(e, positionKey)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.3)";
                  e.currentTarget.style.boxShadow = "0 3px 6px rgba(0,0,0,0.4)";
                  e.currentTarget.style.backgroundColor = "#FF1744";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
                  e.currentTarget.style.backgroundColor = "#DC143C";
                }}
                title={`${stackNodes.length} nodes stacked here. Click to expand.`}
              >
                <div style={{ fontSize: "11px" }}>{stackNodes.length}</div>
                <div style={{ fontSize: "8px", marginTop: "-2px" }}>←→</div>
              </div>
            )}
            {isStacked && isExpanded && isTopNode && (
              <div
                className="data-collapse-button"
                style={{
                  position: "absolute",
                  left: clusterCenterPos.x - 12,
                  top: clusterCenterPos.y - 12,
                  backgroundColor: "#DC143C",
                  color: "white",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  zIndex: 15,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  transition: "all 0.2s ease-out"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Check for unsaved changes before closing
                  const editPanel = document.querySelector(".node-panel");
                  if (editPanel) {
                    const unsavedWarning = editPanel.querySelector('[style*="color: #DC143C"]');
                    if (unsavedWarning && unsavedWarning.textContent.includes("unsaved changes")) {
                      if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
                        setExpandedStack(null);
                        setSelectedNode(null);
                      }
                    } else {
                      setExpandedStack(null);
                      setSelectedNode(null);
                    }
                  } else {
                    setExpandedStack(null);
                    setSelectedNode(null);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.3)";
                  e.currentTarget.style.boxShadow = "0 3px 6px rgba(0,0,0,0.4)";
                  e.currentTarget.style.backgroundColor = "#FF1744";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
                  e.currentTarget.style.backgroundColor = "#DC143C";
                }}
                title="Click to collapse stack."
              >
                →←
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}