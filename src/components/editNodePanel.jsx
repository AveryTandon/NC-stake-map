import React, { useState, useEffect, useRef } from "react";
import { getNodePosition } from "../utils/nodePosition.js";

export default function EditNodePanel({ selectedNode, setSelectedNode, updateNode, deleteNode, categories, classifications, canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset, nodes, expandedStack }) {
    const [coords, setCoords] = useState({ top: 0, left: 0, positionBelow: true });
    const panelWidth = 325;
    const [editedPower, editPower] = useState(1);
    const [editedAlignment, editAlignment] = useState(1);
    const [editedCategory, editCategory] = useState("");
    const [editedClassification, editClassification] = useState("");
    const [editedNotes, editNotes] = useState("");
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesExpanded, setNotesExpanded] = useState(false);
    const editNotesRef = useRef(null);
    const maxNotesHeight = 180; // Maximum height for notes box in pixels
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Helper function to calculate expanded position (same logic as nodeLayer)
    const getExpandedPosition = (basePos, index, totalNodes) => {
        if (totalNodes <= 1) return basePos;
        
        const baseRadius = 55;
        const radius = totalNodes > 4 ? baseRadius + (totalNodes - 4) * 20 : baseRadius;
        
        const angleStep = (2 * Math.PI) / totalNodes;
        const angle = index * angleStep;
        
        return {
            x: basePos.x + radius * Math.cos(angle),
            y: basePos.y + radius * Math.sin(angle)
        };
    };

    // Helper function to check if two rectangles overlap
    const rectanglesOverlap = (rect1, rect2) => {
        return !(
            rect1.x + rect1.width < rect2.x ||
            rect1.x > rect2.x + rect2.width ||
            rect1.y + rect1.height < rect2.y ||
            rect1.y > rect2.y + rect2.height
        );
    };

    useEffect(() => {
        if (!selectedNode) return;

        editPower(selectedNode.power);
        editAlignment(selectedNode.alignment);
        editCategory(selectedNode.category);
        editClassification(selectedNode.classification);
        editNotes(selectedNode.notes || "");
        setIsEditingNotes(false);
        setNotesExpanded(false);
        setHasUnsavedChanges(false);
        
        // Auto-expand notes box to show full content when panel opens
        setTimeout(() => {
            if (editNotesRef.current) {
                const textarea = editNotesRef.current;
                textarea.style.height = "auto";
                const scrollHeight = textarea.scrollHeight;
                // Expand to show full content, but cap at maxNotesHeight
                textarea.style.height = Math.min(scrollHeight, maxNotesHeight) + "px";
                // If content exceeds max height, mark as expanded/truncated
                setNotesExpanded(scrollHeight > maxNotesHeight);
            }
        }, 0);
    }, [selectedNode?.id, selectedNode?.category, selectedNode?.classification, selectedNode?.notes]);

    // Update power and alignment values whenever selectedNode changes (including after drag)
    useEffect(() => {
        if (!selectedNode) return;
        
        editPower(Math.round(selectedNode.power * 10) / 10);
        editAlignment(Math.round(selectedNode.alignment * 10) / 10);
    }, [selectedNode?.power, selectedNode?.alignment]);

    // Calculate panel position
    useEffect(() => {
        if (!selectedNode) return;

        let nodePos;
        // If node has screen position, always use it (prevents recalculation when stack collapses)
        // This is especially important when dragging from an expanded stack
        if (selectedNode._screenX && selectedNode._screenY) {
            nodePos = { x: selectedNode._screenX, y: selectedNode._screenY };
        } else {
            nodePos = getNodePosition(
            selectedNode,
            [],
            canvasWidth,
            canvasHeight,
            sidePadding,
            bottomPadding,
            tickInset,
            60,
            24
            );
        }

        const panelHeight = 200;
        const gap = 30; // Gap between node and panel
        const nodeWidth = 60;
        const nodeHeight = 24;
        
        // Check if selected node is in an expanded cluster
        const positionKey = `${selectedNode.power},${selectedNode.alignment}`;
        const isInExpandedCluster = expandedStack === positionKey;
        
        // Calculate cluster node positions if in an expanded cluster
        const clusterNodeRects = [];
        if (isInExpandedCluster) {
            // Get all nodes in this cluster
            const clusterNodes = nodes.filter(n => 
                n.power === selectedNode.power && n.alignment === selectedNode.alignment
            ).sort((a, b) => a.id.localeCompare(b.id));
            
            // Calculate base position for the cluster
            const basePos = getNodePosition(
                selectedNode,
                [],
                canvasWidth,
                canvasHeight,
                sidePadding,
                bottomPadding,
                tickInset,
                nodeWidth,
                nodeHeight
            );
            
            // Calculate expanded positions for all nodes in cluster
            clusterNodes.forEach((node, index) => {
                const expandedPos = getExpandedPosition(basePos, index, clusterNodes.length);
                clusterNodeRects.push({
                    x: expandedPos.x - nodeWidth / 2,
                    y: expandedPos.y - nodeHeight / 2,
                    width: nodeWidth,
                    height: nodeHeight
                });
            });
        }

        // Try different panel positions and choose one that doesn't overlap with cluster nodes
        let left = nodePos.x;
        let top = nodePos.y;
        let positionBelow = true;
        let positionSide = null;
        
        let foundPosition = false;
        
        // For expanded clusters, use circular positioning around the cluster
        if (isInExpandedCluster) {
            // Calculate cluster center
            const clusterCenter = getNodePosition(
                selectedNode,
                [],
                canvasWidth,
                canvasHeight,
                sidePadding,
                bottomPadding,
                tickInset,
                nodeWidth,
                nodeHeight
            );
            
            // Calculate the radius needed to place panel outside the expanded nodes
            // Use the expanded radius plus some padding (reduced for closer positioning)
            const clusterNodes = nodes.filter(n => 
                n.power === selectedNode.power && n.alignment === selectedNode.alignment
            );
            const baseRadius = 55;
            const expandedRadius = clusterNodes.length > 4 ? baseRadius + (clusterNodes.length - 4) * 20 : baseRadius;
            // Calculate minimum safe distance to avoid overlapping with expanded nodes
            // Account for node size and panel size, with minimal gap for very close positioning
            const nodeMaxDimension = Math.max(nodeWidth, nodeHeight);
            const panelMaxDimension = Math.max(panelWidth, panelHeight);
            // Ensure panel is outside the expanded nodes with minimal gap for very close positioning
            const panelRadius = expandedRadius + (nodeMaxDimension / 2) + (panelMaxDimension / 2) + (gap * 0.05);
            
            // Calculate the direction from cluster center to the selected node
            const dx = nodePos.x - clusterCenter.x;
            const dy = nodePos.y - clusterCenter.y;
            const nodeDistanceFromCenter = Math.sqrt(dx * dx + dy * dy);
            const nodeAngle = Math.atan2(dy, dx);
            
            // Generate candidate positions in a circle around the cluster center
            // But adjust the radius based on the node's distance from center for consistency
            // Try multiple angles around the circle (every 15 degrees for better coverage)
            const numAngles = 24;
            const angleIncrement = (2 * Math.PI) / numAngles;
            
            const candidates = [];
            for (let i = 0; i < numAngles; i++) {
                const angle = i * angleIncrement;
                
                // Calculate base position on the circle
                const baseX = clusterCenter.x + panelRadius * Math.cos(angle);
                const baseY = clusterCenter.y + panelRadius * Math.sin(angle);
                
                // Adjust position to be closer to the node when the angle is similar to node's angle
                // This makes panels above/below nodes closer, matching the right/left behavior
                const angleDiff = Math.abs(angle - nodeAngle);
                const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
                
                let candidateX, candidateY;
                
                // If this candidate is in the direction of the node, position relative to the node itself
                // Otherwise use the full panel radius from cluster center
                if (normalizedAngleDiff < Math.PI / 4) { // Within 45 degrees of node direction
                    // Position panel directly relative to the node for consistent close positioning
                    const distanceFromNode = (nodeMaxDimension / 2) + (panelMaxDimension / 2) + (gap * 0.1);
                    candidateX = nodePos.x + distanceFromNode * Math.cos(angle);
                    candidateY = nodePos.y + distanceFromNode * Math.sin(angle);
                } else {
                    // Use standard circular positioning from cluster center
                    candidateX = clusterCenter.x + panelRadius * Math.cos(angle);
                    candidateY = clusterCenter.y + panelRadius * Math.sin(angle);
                }
                
                const candidateRect = {
                    x: candidateX - panelWidth / 2,
                    y: candidateY - panelHeight / 2,
                    width: panelWidth,
                    height: panelHeight
                };
                
                // Check if this position overlaps with any cluster node
                const overlaps = clusterNodeRects.some(clusterRect => 
                    rectanglesOverlap(candidateRect, clusterRect)
                );
                
                // Check if position is within canvas bounds
                const withinBounds = 
                    candidateRect.x >= 0 &&
                    candidateRect.x + candidateRect.width <= canvasWidth &&
                    candidateRect.y >= 0 &&
                    candidateRect.y + candidateRect.height <= canvasHeight - 50;
                
                if (!overlaps && withinBounds) {
                    // Calculate distance from this candidate position to the selected node
                    const distance = Math.sqrt(
                        Math.pow(candidateX - nodePos.x, 2) + 
                        Math.pow(candidateY - nodePos.y, 2)
                    );
                    
                    candidates.push({
                        x: candidateX,
                        y: candidateY,
                        distance: distance,
                        rect: candidateRect
                    });
                }
            }
            
            // Sort candidates by distance to the selected node (closest first)
            candidates.sort((a, b) => a.distance - b.distance);
            
            // Use the closest valid position
            if (candidates.length > 0) {
                const bestCandidate = candidates[0];
                left = bestCandidate.x;
                top = bestCandidate.y;
                
                // Determine position relative to node for styling
                const dx = bestCandidate.x - nodePos.x;
                const dy = bestCandidate.y - nodePos.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                    positionSide = dx > 0 ? 'right' : 'left';
                    positionBelow = false;
                } else {
                    positionBelow = dy > 0;
                    positionSide = null;
                }
                foundPosition = true;
            }
        }
        
        // If not in expanded cluster or circular positioning didn't find a spot, use standard positioning
        if (!foundPosition) {
            // For nodes with power <= 3, prioritize right/left positioning to avoid hiding the node
            // For other nodes, use the standard below/above preference
            const isLowPower = selectedNode.power <= 3;
            const candidatePositions = isLowPower
                ? [
                    // For low power nodes: right, left, below, above
                    { side: 'right', top: nodePos.y, left: nodePos.x + nodeWidth / 2 + gap + panelWidth / 2 },
                    { side: 'left', top: nodePos.y, left: nodePos.x - nodeWidth / 2 - gap - panelWidth / 2 },
                    { side: 'below', top: nodePos.y + nodeHeight / 2 + gap + panelHeight / 2, left: nodePos.x },
                    { side: 'above', top: nodePos.y - nodeHeight / 2 - gap - panelHeight / 2, left: nodePos.x }
                  ]
                : [
                    // Standard preference: below, above, right, left
                    { side: 'below', top: nodePos.y + nodeHeight / 2 + gap + panelHeight / 2, left: nodePos.x },
                    { side: 'above', top: nodePos.y - nodeHeight / 2 - gap - panelHeight / 2, left: nodePos.x },
                    { side: 'right', top: nodePos.y, left: nodePos.x + nodeWidth / 2 + gap + panelWidth / 2 },
                    { side: 'left', top: nodePos.y, left: nodePos.x - nodeWidth / 2 - gap - panelWidth / 2 }
                  ];
            
            for (const candidate of candidatePositions) {
                const candidateRect = {
                    x: candidate.left - panelWidth / 2,
                    y: candidate.top - panelHeight / 2,
                    width: panelWidth,
                    height: panelHeight
                };
                
                // Check if position is within canvas bounds
                const withinBounds = 
                    candidateRect.x >= 0 &&
                    candidateRect.x + candidateRect.width <= canvasWidth &&
                    candidateRect.y >= 0 &&
                    candidateRect.y + candidateRect.height <= canvasHeight - 50; // Leave space for legend
                
                if (withinBounds) {
                    left = candidate.left;
                    top = candidate.top;
                    positionBelow = candidate.side === 'below';
                    positionSide = candidate.side === 'right' || candidate.side === 'left' ? candidate.side : null;
                    foundPosition = true;
                    break;
                }
            }
        }
        
        // If no ideal position found, use default (below or above based on space)
        if (!foundPosition) {
            const spaceBelow = canvasHeight - nodePos.y;
            const spaceAbove = nodePos.y;
            
            if (spaceBelow < panelHeight + gap + 50) {
                top = nodePos.y - panelHeight / 2 - gap;
                positionBelow = false;
            } else {
                top = nodePos.y + panelHeight / 2 + gap;
                positionBelow = true;
            }
            left = nodePos.x;
        }
        
        // Constrain horizontal position to stay within canvas
        left = Math.max(panelWidth / 2, Math.min(left, canvasWidth - panelWidth / 2));
        // Constrain vertical position
        top = Math.max(panelHeight / 2, Math.min(top, canvasHeight - panelHeight / 2 - 50));

        setCoords({ top, left, positionBelow, positionSide });
    }, [selectedNode, canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset, expandedStack, nodes]);

    // Focus textarea when editing mode is enabled
    useEffect(() => {
      if (isEditingNotes && editNotesRef.current) {
          editNotesRef.current.focus();
      }
    }, [isEditingNotes]);

    // Warn about unsaved changes when trying to close
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (selectedNode) {
          // Don't close if clicking inside the panel, on a node (or any child), badge, or collapse button
          if (!e.target.closest(".node-panel") && 
              !e.target.closest(".node") && 
              !e.target.closest(".data-stack-badge") && 
              !e.target.closest(".data-collapse-button")) {
            if (hasUnsavedChanges) {
              if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
                setHasUnsavedChanges(false);
                setSelectedNode(null);
              }
            } else {
              // No unsaved changes, just close
              setSelectedNode(null);
            }
          }
        }
      };
      if (selectedNode) {
        document.addEventListener("click", handleClickOutside, true);
        return () => document.removeEventListener("click", handleClickOutside, true);
      }
    }, [hasUnsavedChanges, selectedNode]);

    if (!selectedNode) return null;

    const handleSave = () => {
        // Close panel first to allow smooth animation
        setHasUnsavedChanges(false);
        const nodeId = selectedNode.id;
        const updatedNode = {
            ...selectedNode,
            power: editedPower,
            alignment: editedAlignment,
            category: editedCategory,
            classification: editedClassification,
            notes: editedNotes,
        };
        setSelectedNode(null);
        // Update node after closing panel to trigger smooth animation
        updateNode(nodeId, updatedNode);
    };

    const handleDelete = () => {
        if (hasUnsavedChanges) {
            if (!window.confirm("You have unsaved changes. Are you sure you want to delete this node?")) {
                return;
            }
        } else {
            if (!window.confirm("Are you sure you want to delete this node?")) {
                return;
            }
        }
        deleteNode(selectedNode.id);
        setHasUnsavedChanges(false);
        setSelectedNode(null);
    };

    return (
        <div
          className="node-panel"
          style={{
            position: "absolute",
            top: coords.top,
            left: coords.left,
            transform: "translate(-50%, -50%)",
            width: panelWidth,
            fontSize: "13px"
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}><strong>{selectedNode.label}</strong></h4>
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
              Power:
              <input
                type="number"
                min="1"
                max="10"
                value={editedPower}
              onChange={(e) => {
                editPower(Math.max(1, Math.min(10, Number(e.target.value))));
                setHasUnsavedChanges(true);
              }}
              style={{ margin: 0 }}
            />
          </label>
          <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
            Alignment:
            <input
              type="number"
              min="-5"
              max="5"
              value={editedAlignment}
              onChange={(e) => {
                editAlignment(Math.max(-5, Math.min(5, Number(e.target.value))));
                setHasUnsavedChanges(true);
              }}
              style={{ margin: 0 }}
            />
            </label>
          </div>
          
          <div style={{ marginBottom: "8px" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
              Category:
              <select 
                id="category-select" 
                value={editedCategory} 
                onChange={(e) => {
                  editCategory(e.target.value);
                  setHasUnsavedChanges(true);
                }} 
                style={{ flex: 1, margin: 0 }}
              >
                <option value="">--Choose Category--</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <div style={{ marginBottom: "8px" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
              Classification:
              <select 
                id="class-select" 
                value={editedClassification} 
                onChange={(e) => {
                  editClassification(e.target.value);
                  setHasUnsavedChanges(true);
                }} 
                style={{ flex: 1, margin: 0 }}
              >
                <option value="">--Choose Classification--</option>
                {classifications.map((clas) => (
                  <option key={clas} value={clas}>
                    {clas}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <div style={{ marginBottom: "8px", width: "100%" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "flex-start", gap: "5px" }}>
              Notes:
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <textarea
                  ref={editNotesRef}
                  value={editedNotes}
                  readOnly={!isEditingNotes}
                  onFocus={() => setIsEditingNotes(true)}
                  onChange={(e) => {
                    editNotes(e.target.value);
                    setHasUnsavedChanges(true);
                    const textarea = e.target;
                    textarea.style.height = "auto";
                    const scrollHeight = textarea.scrollHeight;
                    // Allow expansion up to maxNotesHeight
                    textarea.style.height = Math.min(scrollHeight, maxNotesHeight) + "px";
                    // Update expanded state if content exceeds max
                    if (scrollHeight > maxNotesHeight) {
                      setNotesExpanded(true);
                    } else {
                      setNotesExpanded(false);
                    }
                  }}
                  style={{ 
                    margin: 0, 
                    minHeight: "40px", 
                    maxHeight: maxNotesHeight + "px",
                    resize: "vertical",
                    overflowY: "auto"
                  }}
                />
                {notesExpanded && (
                  <div style={{ fontSize: "11px", color: "#666" }}>
                    Note truncated. Scroll to see more or edit to view full content.
                  </div>
                )}
              </div>
            </label>
          </div>
          
          {hasUnsavedChanges && (
            <div style={{ fontSize: "11px", color: "#DC143C", marginBottom: "4px", textAlign: "center", fontStyle: "italic" }}>
              You have unsaved changes
            </div>
          )}
          <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
            <button onClick={handleSave} className="save-btn" style={{ margin: 0 }}>Save Changes</button>
            <button onClick={handleDelete} className="del-btn" style={{ margin: 0 }}>Delete Node</button>
          </div>
        </div>
    );
}