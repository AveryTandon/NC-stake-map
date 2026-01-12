import React, { useRef, useState, useEffect } from "react";
import useMap from "../hooks/useMap.js";
import NodeLayer from "./nodeLayer.jsx";
import NewNodePanel from "./newNodePanel.jsx";
import EditNodePanel from "./editNodePanel.jsx";
import { CATEGORY_COLORS, CATEGORY_SHAPES } from "../utils/constants.js";

export default function MapCanvas({ mapId }) {
  const { nodes, createNode, updateNode, deleteNode } = useMap(mapId);
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedStack, setExpandedStack] = useState(null); // Position key of expanded stack
  const categories = ["Individual", "Institution", "Media", "Social", "State", "Other"];
  const classifications = ["Key Policy, Issue, or Debate", "Opposition Unorganized Group", "Opposition Organized Group", "Progressive Unorganized Group", "Progressive Organized Group", "Decision Maker"];
  const canvasRef = useRef(null);
  const canvasWidth = 1400;
  const canvasHeight = 780;
  const sidePadding = 80;
  const bottomPadding = 60;
  const tickInset = 40;

  // Note: Click outside handling is now done in editNodePanel.jsx
  // This allows it to check for unsaved changes before closing

  // Draw axes with arrows and tick marks
  const drawAxes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // X axis
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight - bottomPadding);
    ctx.lineTo(canvasWidth, canvasHeight - bottomPadding);
    ctx.stroke();

    // X arrow
    ctx.beginPath();
    ctx.moveTo(canvasWidth, canvasHeight - bottomPadding);
    ctx.lineTo(canvasWidth - 15, canvasHeight - bottomPadding - 5);
    ctx.lineTo(canvasWidth - 15, canvasHeight - bottomPadding + 5);
    ctx.closePath();
    ctx.fill();

    // Y axis in center of page
    const yAxisX = canvasWidth / 2;
    ctx.beginPath();
    ctx.moveTo(yAxisX, canvasHeight - bottomPadding);
    ctx.lineTo(yAxisX, 0);
    ctx.stroke();

    // Y arrow
    ctx.beginPath();
    ctx.moveTo(yAxisX, 0);
    ctx.lineTo(yAxisX - 5, 10);
    ctx.lineTo(yAxisX + 5, 10);
    ctx.closePath();
    ctx.fill();

    // X axis labels
    ctx.font = "20px sans-serif";
    ctx.fillText("People Power Vision", 100, canvasHeight - bottomPadding + 40);
    ctx.fillText("Billionaire Vision", canvasWidth - sidePadding, canvasHeight - bottomPadding + 40);

    // Y axis labels
    ctx.save();
    ctx.translate(yAxisX - 20, 40);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Power", 0, 0);
    ctx.restore();

    // X tick marks and values
    const xRange = canvasWidth - 2 * sidePadding;
    for (let i = -5; i <= 5; i++) {
      const x = sidePadding + (i + 5) * (xRange / 10);
      ctx.beginPath();
      ctx.moveTo(x, canvasHeight - bottomPadding);
      ctx.lineTo(x, canvasHeight - bottomPadding + 8);
      ctx.stroke();
      ctx.font = "12px sans-serif";
      ctx.fillText(i, x, canvasHeight - bottomPadding + 18);
    }

    // Y tick marks and values
    const yRange = canvasHeight - bottomPadding;
    for (let i = 1; i <= 10; i++) {
      const y = canvasHeight - bottomPadding - tickInset - ((i - 1) * (yRange / 10));
      ctx.beginPath();
      ctx.moveTo(yAxisX, y);
      ctx.lineTo(yAxisX + 8, y);
      ctx.stroke();
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(i, yAxisX + 15, y);
      ctx.textAlign = "center";
    }
  };

  // Draw axes initially and whenever canvas size changes
  useEffect(() => {
    drawAxes();
  }, [canvasWidth, canvasHeight]);

  // Sync selectedNode with nodes array when it updates (e.g., after drag completes and Firestore updates)
  // This ensures the edit panel always shows the latest power/alignment values
  useEffect(() => {
    if (selectedNode) {
      const updatedNode = nodes.find(n => n.id === selectedNode.id);
      if (updatedNode) {
        // Only update if power or alignment changed to avoid unnecessary re-renders
        if (updatedNode.power !== selectedNode.power || updatedNode.alignment !== selectedNode.alignment) {
          setSelectedNode(prev => ({
            ...prev,
            power: updatedNode.power,
            alignment: updatedNode.alignment,
            // Preserve other fields that might have been set (like _screenX, _screenY)
            category: updatedNode.category,
            classification: updatedNode.classification,
            notes: updatedNode.notes,
            label: updatedNode.label
          }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  return (
    <div>
      {/* Description */}
      <p style={{padding: "0px 10px"}}>This power map shows the relationships between different stakeholders. You can add new nodes, 
        setting their power and alignment according to the scales below. You can also edit an existing node by clicking on it.</p>
      
      {/* Add new node button */}
      <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
      <NewNodePanel
        createNode={createNode}
        categories={categories}
        classifications={classifications}
      />
      </div>
    
      {/* Canvas & NodeLayer */}
      <div style={{ position: "relative", width: canvasWidth, height: canvasHeight, margin: "10px 20px" }}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
        <NodeLayer
          nodes={nodes}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          sidePadding={sidePadding}
          bottomPadding={bottomPadding}
          tickInset={tickInset}
          setSelectedNode={setSelectedNode}
          updateNode={updateNode}
          selectedNode={selectedNode}
          expandedStack={expandedStack}
          setExpandedStack={setExpandedStack}
        />
        <EditNodePanel
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          updateNode={updateNode}
          deleteNode={deleteNode}
          categories={categories}
          classifications={classifications}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          sidePadding={sidePadding}
          bottomPadding={bottomPadding}
          tickInset={tickInset}
          nodes={nodes}
          expandedStack={expandedStack}
        />
      </div>
      
      {/* Legend */}
      <div className="legend">
        <div className="legend-section">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "4px" }}>
            <div
              style={{
                width: 14,
                height: 14,
                backgroundColor: color,
                border: "1px solid #8e8e8eff",
                borderRadius: "3px",
              }}
            />
            <span>{category}</span>
          </div>
        ))} </div>
        <div className="legend-section">
        {Object.entries(CATEGORY_SHAPES).map(([category, shape]) => (
          <div key={category} style={{ display: "flex", textAlign: "left", gap: "3px", alignItems: "center", marginBottom: "4px" }}>
            <div className={`legend-shape ${shape}`} />
            <span>{category}</span>
          </div>
        ))} </div>
        <div className="legend-section">
          <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "4px" }}>
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: "#DC143C",
                color: "white",
                borderRadius: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "bold",
                lineHeight: "1"
              }}
            >
              <div style={{ fontSize: "11px" }}>2</div>
              <div style={{ fontSize: "8px", marginTop: "-2px" }}>←→</div>
            </div>
            <span>Click number badge or any stacked node to expand</span>
          </div>
        </div>
      </div>
    </div>
  );
}