import React, { useState } from "react";
import useMap from "../hooks/useMap.js";

export default function MapCanvas({ mapId }) {
  const { nodes, createNode } = useMap(mapId);
  const [label, setLabel] = useState("");
  const [power, setPower] = useState(1);
  const [alignment, setAlignment] = useState(1);

  const handleAddNode = () => {
    createNode({
      label,
      power_rating: Number(power),
      alignment_rating: Number(alignment),
      meta: {}
    });
    setLabel("");
    setPower(1);
    setAlignment(1);
  };

  const canvasWidth = 500;
  const canvasHeight = 500;
  const padding = 50;

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input type="number" min="1" max="5" value={power} onChange={(e) => setPower(e.target.value)} />
        <input type="number" min="1" max="5" value={alignment} onChange={(e) => setAlignment(e.target.value)} />
        <button onClick={handleAddNode}>Add Node</button>
      </div>

      <div style={{ position: "relative", width: canvasWidth, height: canvasHeight, border: "1px solid #ccc" }}>
        {/* Axis labels */}
        <div style={{ position: "absolute", top: 0, left: canvasWidth / 2 }}>Alignment →</div>
        <div style={{ position: "absolute", top: canvasHeight / 2, left: 0, transform: "rotate(-90deg)" }}>Power ↑</div>

        {nodes.map(node => {
          const x = padding + (node.alignment_rating - 1) * ((canvasWidth - 2 * padding) / 4);
          const y = canvasHeight - padding - (node.power_rating - 1) * ((canvasHeight - 2 * padding) / 4);
          return (
            <div key={node.id} style={{
              position: "absolute",
              left: x - 15, // center the node
              top: y - 15,
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#3498db",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: "bold"
            }}>
              {node.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}