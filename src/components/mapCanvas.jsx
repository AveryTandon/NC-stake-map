import React from "react";
import useMap from "../hooks/useMap";

export default function MapCanvas({ mapId }) {
  const { nodes, createNode, updateNode } = useMap(mapId);

  const handleAddNode = () => {
    createNode({
      label: "New Node",
      x: Math.random() * 400,
      y: Math.random() * 400,
      meta: {}
    });
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "80vh", border: "1px solid #ccc" }}>
      <button onClick={handleAddNode}>Add Node</button>

      {nodes.map(node => (
        <div
          key={node.id}
          style={{
            position: "absolute",
            left: node.x,
            top: node.y,
            padding: "6px 10px",
            border: "1px solid #666",
            borderRadius: 4,
            background: "#fff",
            cursor: "move"
          }}
          onDoubleClick={() => updateNode(node.id, { label: node.label + " ✏️" })}
        >
          {node.label}
        </div>
      ))}
    </div>
  );
}