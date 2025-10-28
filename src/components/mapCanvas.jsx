import React, { useRef, useState, useEffect } from "react";
import useMap from "../hooks/useMap.js";
import NodeLayer from "./nodeLayer.jsx";
import NewNodePanel from "./newNodePanel.jsx";
import EditNodePanel from "./editNodePanel.jsx";
import { CATEGORY_COLORS, CATEGORY_SHAPES } from "../utils/constants.js";

export default function MapCanvas({ mapId }) {
  const { nodes, createNode, updateNode, deleteNode } = useMap(mapId);
  const [selectedNode, setSelectedNode] = useState(null);
  const categories = ["Media", "Social", "State", "Individual", "Other"];
  const classifications = ["Key Policy, Issue, or Debate", "Opposition Unorganized Group", "Opposition Organized Group", "Progressive Unorganized Group", "Progressive Organized Group", "Decision Maker"];
  const canvasRef = useRef(null);
  const canvasWidth = 1300;
  const canvasHeight = 770;
  const padding = 50;
  const tickInset = 40;

  // Click outside node panel to deselect node
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".node-panel") && !e.target.classList.contains("node")) {
        setSelectedNode(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Draw axes with arrows and tick marks
  const drawAxes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // X axis
    ctx.beginPath();
    ctx.moveTo(padding, canvasHeight - padding);
    ctx.lineTo(canvasWidth - padding + 50, canvasHeight - padding);
    ctx.stroke();

    // X arrow
    ctx.beginPath();
    ctx.moveTo(canvasWidth - padding + 50, canvasHeight - padding);
    ctx.lineTo(canvasWidth - padding + 40, canvasHeight - padding - 5);
    ctx.lineTo(canvasWidth - padding + 40, canvasHeight - padding + 5);
    ctx.closePath();
    ctx.fill();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(padding, canvasHeight - padding);
    ctx.lineTo(padding, padding - 50);
    ctx.stroke();

    // Y arrow
    ctx.beginPath();
    ctx.moveTo(padding, padding - 50);
    ctx.lineTo(padding - 5, padding - 40);
    ctx.lineTo(padding + 5, padding - 40);
    ctx.closePath();
    ctx.fill();

    // Ticks and labels
    for (let i = 1; i <= 10; i++) {
      // X ticks
      const x = padding + tickInset + ((i - 1) * (canvasWidth - 2 * padding - tickInset) / 9);
      ctx.beginPath();
      ctx.moveTo(x, canvasHeight - padding);
      ctx.lineTo(x, canvasHeight - padding + 10);
      ctx.stroke();
      ctx.fillText(i, x, canvasHeight - padding + 20);

      // Y ticks
      const y = canvasHeight - padding - tickInset - ((i - 1) * (canvasHeight - 2 * padding - tickInset) / 9);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding - 8, y);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText(i, padding - 12, y);
      ctx.textAlign = "center";
    }
  };

  // Draw axes initially and whenever canvas size changes
  useEffect(() => {
    drawAxes();
  }, [canvasWidth, canvasHeight]);

  return (
    <div className="container">
      {/* Description */}
        <p>This power map shows the relationships between different stakeholders in NC. You can add new nodes, 
          setting their power and alignment on a scale of 1-10. You can also edit an existing node by clicking on it.</p>
      {/* Add new node button */}
        <NewNodePanel
          createNode={createNode}
          categories={categories}
          classifications={classifications}
        />
      {/* Legend */}
      <div className="legend">
        <div className="legend-section">
          {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
            <div key={category} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
            <div key={category} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div className={`legend-shape ${shape}`}/>
              <span>{category}</span>
            </div>
          ))} </div>
      </div>
      {/* Canvas & NodeLayer */}
      <div style={{ position: "relative", width: canvasWidth, height: canvasHeight,  margin: "80px auto 0" }}>
        <h2 style={{ position: "absolute", bottom: -20, left: 160, transform: "translateX(-50%)" }}>Aligned w/ Our Vision</h2>
        <h2 style={{ position: "absolute", bottom: -20, left: 1040, transform: "translateX(-50%)" }}>Top Dog Vision</h2>
        <h2 style={{ position: "absolute", bottom: 80, left: -80, transform: "rotate(-90deg) translateY(50%)" }}>Low Power</h2>
        <h2 style={{ position: "absolute", bottom: canvasHeight - 80, left: -80, transform: "rotate(-90deg) translateY(50%)" }}>High Power</h2>
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
          padding={padding}
          setSelectedNode={setSelectedNode}
          updateNode={updateNode}
          selectedNode={selectedNode}
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
          padding={padding}
        />
      </div>
    </div>
  );
}